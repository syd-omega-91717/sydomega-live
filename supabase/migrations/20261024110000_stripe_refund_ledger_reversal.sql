-- Ω SYD OMEGA 91717
-- Idempotent Stripe refund accounting for charge.refunded cumulative amounts.
--
-- This migration is source-pending until the isolated replay, regression suite,
-- and signed Stripe test-mode lifecycle are reviewed. Do not enable payments.
-- Refund accounting deliberately does not change subscription entitlements:
-- refund/cancellation policy must be explicitly specified and tested separately.

BEGIN;

CREATE TABLE IF NOT EXISTS omega_private.stripe_refund_state (
  charge_id text PRIMARY KEY,
  payment_intent_id text NOT NULL,
  original_transaction_id uuid NOT NULL
    REFERENCES public.omega_ledger_transactions(transaction_id) ON DELETE RESTRICT,
  currency_code text NOT NULL CHECK (currency_code ~ '^[A-Z]{3}$'),
  original_amount numeric(28,8) NOT NULL CHECK (original_amount > 0),
  charge_amount numeric(28,8) NOT NULL CHECK (charge_amount > 0),
  amount_refunded numeric(28,8) NOT NULL DEFAULT 0
    CHECK (amount_refunded >= 0 AND amount_refunded <= charge_amount),
  last_event_id text,
  last_reversal_transaction_id uuid
    REFERENCES public.omega_ledger_transactions(transaction_id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stripe_refund_state_original_transaction_idx
  ON omega_private.stripe_refund_state(original_transaction_id);

REVOKE ALL ON TABLE omega_private.stripe_refund_state FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION omega_private.record_stripe_refund(
  p_event_id text,
  p_event_type text,
  p_charge_id text,
  p_payment_intent_id text,
  p_amount_minor bigint,
  p_amount_refunded_minor bigint,
  p_currency text,
  p_payload_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_event_status text;
  v_existing_event_transaction uuid;
  v_original_transaction uuid;
  v_original_amount numeric;
  v_original_currency text;
  v_original_status text;
  v_charge_amount numeric;
  v_new_refunded numeric;
  v_delta numeric;
  v_other_refunded numeric;
  v_total_after numeric;
  v_debit_account uuid;
  v_credit_account uuid;
  v_debit_amount numeric;
  v_credit_amount numeric;
  v_entry_count integer;
  v_reversal_transaction uuid;
  v_state omega_private.stripe_refund_state%ROWTYPE;
  v_currency text := upper(pg_catalog.btrim(p_currency));
BEGIN
  IF p_event_id IS NULL OR pg_catalog.length(pg_catalog.btrim(p_event_id)) < 8 THEN
    RAISE EXCEPTION 'stripe_event_id_required';
  END IF;
  IF p_event_type IS DISTINCT FROM 'charge.refunded' THEN
    RAISE EXCEPTION 'stripe_refund_event_type_invalid';
  END IF;
  IF p_charge_id IS NULL OR pg_catalog.length(pg_catalog.btrim(p_charge_id)) < 8
     OR p_payment_intent_id IS NULL OR pg_catalog.length(pg_catalog.btrim(p_payment_intent_id)) < 8 THEN
    RAISE EXCEPTION 'stripe_refund_reference_required';
  END IF;
  IF p_amount_minor IS NULL OR p_amount_minor <= 0
     OR p_amount_refunded_minor IS NULL OR p_amount_refunded_minor <= 0
     OR p_amount_refunded_minor > p_amount_minor THEN
    RAISE EXCEPTION 'stripe_refund_amount_invalid';
  END IF;
  IF v_currency IS NULL OR v_currency !~ '^[A-Z]{3}
    RAISE EXCEPTION 'stripe_currency_invalid';
  END IF;

  -- Stripe's API uses minor units, with the same zero-decimal and compatibility
  -- rules as record_stripe_payment. ISK and UGX intentionally remain /100.
  v_charge_amount := CASE
    WHEN v_currency IN (
      'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA',
      'PYG','RWF','VND','VUV','XAF','XOF','XPF'
    ) THEN p_amount_minor::numeric
    ELSE p_amount_minor::numeric / 100
  END;
  v_new_refunded := CASE
    WHEN v_currency IN (
      'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA',
      'PYG','RWF','VND','VUV','XAF','XOF','XPF'
    ) THEN p_amount_refunded_minor::numeric
    ELSE p_amount_refunded_minor::numeric / 100
  END;

  -- Claim the provider event inside the same transaction as its ledger effect.
  INSERT INTO public.omega_payment_events(
    provider, provider_event_id, event_type, payload_hash, status, metadata
  ) VALUES (
    'stripe', p_event_id, p_event_type, COALESCE(p_payload_hash, ''),
    'RECEIVED',
    COALESCE(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'charge_id', p_charge_id,
      'payment_intent_id', p_payment_intent_id,
      'amount_minor', p_amount_minor,
      'amount_refunded_minor', p_amount_refunded_minor,
      'currency', v_currency
    )
  ) ON CONFLICT (provider, provider_event_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT status, transaction_id
      INTO v_event_status, v_existing_event_transaction
      FROM public.omega_payment_events
     WHERE provider = 'stripe' AND provider_event_id = p_event_id
     FOR UPDATE;
    IF v_event_status = 'PROCESSED' OR v_event_status = 'IGNORED' THEN
      RETURN pg_catalog.jsonb_build_object(
        'ok', true, 'duplicate', true, 'transaction_id', v_existing_event_transaction
      );
    END IF;
    RAISE EXCEPTION 'stripe_refund_event_in_progress';
  END IF;

  -- Lock the original settlement so refunds for this payment intent serialize,
  -- including when Stripe presents more than one charge ID.
  SELECT t.transaction_id, r.settled_amount, upper(r.currency), t.status
    INTO v_original_transaction, v_original_amount, v_original_currency, v_original_status
    FROM public.omega_payment_reconciliation AS r
    JOIN public.omega_ledger_transactions AS t
      ON t.transaction_id = r.internal_transaction_id
   WHERE r.provider = 'stripe'
     AND r.provider_reference = p_payment_intent_id
     AND r.currency = v_currency
     AND t.external_reference = p_payment_intent_id
     AND t.event_type = 'STRIPE_SETTLEMENT'
   ORDER BY r.created_at DESC
   LIMIT 1
   FOR UPDATE OF t;

  IF v_original_transaction IS NULL THEN
    RAISE EXCEPTION 'stripe_original_settlement_not_found';
  END IF;
  IF v_original_amount IS NULL OR v_original_amount <= 0
     OR v_original_currency IS DISTINCT FROM v_currency
     OR v_original_status NOT IN ('POSTED', 'REVERSED') THEN
    RAISE EXCEPTION 'stripe_original_settlement_invalid';
  END IF;

  INSERT INTO omega_private.stripe_refund_state(
    charge_id, payment_intent_id, original_transaction_id, currency_code,
    original_amount, charge_amount, amount_refunded
  ) VALUES (
    p_charge_id, p_payment_intent_id, v_original_transaction, v_currency,
    v_original_amount, v_charge_amount, 0
  ) ON CONFLICT (charge_id) DO NOTHING;

  SELECT * INTO v_state
    FROM omega_private.stripe_refund_state
   WHERE charge_id = p_charge_id
   FOR UPDATE;

  IF v_state.original_transaction_id IS DISTINCT FROM v_original_transaction
     OR v_state.payment_intent_id IS DISTINCT FROM p_payment_intent_id
     OR v_state.currency_code IS DISTINCT FROM v_currency
     OR v_state.original_amount IS DISTINCT FROM v_original_amount
     OR v_state.charge_amount IS DISTINCT FROM v_charge_amount THEN
    RAISE EXCEPTION 'stripe_refund_charge_mapping_conflict';
  END IF;

  IF v_original_status = 'REVERSED'
     AND v_state.amount_refunded = 0
     AND v_state.last_event_id IS NULL THEN
    RAISE EXCEPTION 'stripe_original_already_reversed_without_refund_state';
  END IF;

  SELECT COALESCE(pg_catalog.sum(amount_refunded), 0)
    INTO v_other_refunded
    FROM omega_private.stripe_refund_state
   WHERE original_transaction_id = v_original_transaction
     AND charge_id <> p_charge_id;

  IF v_new_refunded < v_state.amount_refunded THEN
    UPDATE public.omega_payment_events
       SET status = 'PROCESSED',
           processed_at = pg_catalog.now(),
           metadata = metadata || pg_catalog.jsonb_build_object('stale_refund_event', true)
     WHERE provider = 'stripe' AND provider_event_id = p_event_id;
    RETURN pg_catalog.jsonb_build_object(
      'ok', true, 'duplicate', false, 'stale', true,
      'delta_amount', 0, 'cumulative_refunded_amount', v_state.amount_refunded,
      'transaction_id', NULL
    );
  END IF;

  IF v_new_refunded = v_state.amount_refunded THEN
    UPDATE public.omega_payment_events
       SET status = 'PROCESSED',
           processed_at = pg_catalog.now(),
           metadata = metadata || pg_catalog.jsonb_build_object('duplicate_cumulative_refund', true)
     WHERE provider = 'stripe' AND provider_event_id = p_event_id;
    RETURN pg_catalog.jsonb_build_object(
      'ok', true, 'duplicate', true, 'stale', false,
      'delta_amount', 0, 'cumulative_refunded_amount', v_state.amount_refunded,
      'transaction_id', v_state.last_reversal_transaction_id
    );
  END IF;

  v_total_after := v_other_refunded + v_new_refunded;
  IF v_total_after > v_original_amount THEN
    RAISE EXCEPTION 'stripe_refund_exceeds_original_settlement';
  END IF;
  v_delta := v_new_refunded - v_state.amount_refunded;
  IF v_delta <= 0 THEN
    RAISE EXCEPTION 'stripe_refund_delta_invalid';
  END IF;

  -- The current settlement RPC posts exactly two balanced entries. Fail closed
  -- if the source transaction has a different shape; never guess allocation.
  SELECT pg_catalog.count(*) INTO v_entry_count
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction;

  SELECT account_id, amount INTO v_debit_account, v_debit_amount
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction
     AND direction = 'DEBIT' AND currency_code = v_currency
   ORDER BY created_at LIMIT 1;

  SELECT account_id, amount INTO v_credit_account, v_credit_amount
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction
     AND direction = 'CREDIT' AND currency_code = v_currency
   ORDER BY created_at LIMIT 1;

  IF v_entry_count <> 2
     OR v_debit_account IS NULL OR v_credit_account IS NULL
     OR v_debit_account = v_credit_account
     OR v_debit_amount IS DISTINCT FROM v_original_amount
     OR v_credit_amount IS DISTINCT FROM v_original_amount THEN
    RAISE EXCEPTION 'stripe_original_ledger_shape_unsupported';
  END IF;

  v_reversal_transaction := omega_private.post_ledger_transaction(
    'stripe-refund:' || p_charge_id || ':' || p_amount_refunded_minor::text,
    'STRIPE_REFUND_REVERSAL',
    v_currency,
    'Stripe refund reversal for charge ' || p_charge_id,
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'account_id', v_credit_account, 'direction', 'DEBIT',
        'amount', v_delta, 'currency_code', v_currency
      ),
      pg_catalog.jsonb_build_object(
        'account_id', v_debit_account, 'direction', 'CREDIT',
        'amount', v_delta, 'currency_code', v_currency
      )
    ),
    p_charge_id,
    COALESCE(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'stripe_event_id', p_event_id,
      'payment_intent_id', p_payment_intent_id,
      'charge_id', p_charge_id,
      'cumulative_refunded_minor', p_amount_refunded_minor,
      'delta_amount', v_delta,
      'currency', v_currency
    )
  );

  INSERT INTO public.omega_payment_reconciliation(
    provider, provider_reference, internal_transaction_id,
    expected_amount, settled_amount, currency, status,
    idempotency_key, evidence, reconciled_at
  ) VALUES (
    'stripe', p_charge_id, v_reversal_transaction,
    v_delta, v_delta, v_currency, 'matched',
    'stripe-refund-reconciliation:' || p_charge_id || ':' || p_amount_refunded_minor::text,
    pg_catalog.jsonb_build_object(
      'event_id', p_event_id,
      'event_type', p_event_type,
      'payment_intent_id', p_payment_intent_id,
      'charge_id', p_charge_id,
      'original_transaction_id', v_original_transaction,
      'payload_hash', p_payload_hash,
      'cumulative_refunded_minor', p_amount_refunded_minor,
      'delta_amount', v_delta
    ),
    pg_catalog.now()
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE omega_private.stripe_refund_state
     SET amount_refunded = v_new_refunded,
         last_event_id = p_event_id,
         last_reversal_transaction_id = v_reversal_transaction,
         updated_at = pg_catalog.now()
   WHERE charge_id = p_charge_id;

  IF v_total_after = v_original_amount THEN
    UPDATE public.omega_ledger_transactions
       SET status = 'REVERSED',
           metadata = metadata || pg_catalog.jsonb_build_object(
             'fully_refunded_at', pg_catalog.now(),
             'last_refund_event_id', p_event_id
           )
     WHERE transaction_id = v_original_transaction;

    UPDATE public.omega_payment_reconciliation
       SET status = 'reversed',
           reconciled_at = pg_catalog.now(),
           evidence = evidence || pg_catalog.jsonb_build_object(
             'fully_refunded', true,
             'last_refund_event_id', p_event_id,
             'cumulative_refunded_amount', v_total_after
           )
     WHERE provider = 'stripe'
       AND provider_reference = p_payment_intent_id
       AND internal_transaction_id = v_original_transaction;
  END IF;

  UPDATE public.omega_payment_events
     SET status = 'PROCESSED',
         transaction_id = v_reversal_transaction,
         processed_at = pg_catalog.now(),
         metadata = metadata || pg_catalog.jsonb_build_object(
           'delta_amount', v_delta,
           'cumulative_refunded_amount', v_total_after,
           'original_transaction_id', v_original_transaction,
           'fully_refunded', v_total_after = v_original_amount
         )
   WHERE provider = 'stripe' AND provider_event_id = p_event_id;

  RETURN pg_catalog.jsonb_build_object(
    'ok', true, 'duplicate', false, 'stale', false,
    'delta_amount', v_delta,
    'cumulative_refunded_amount', v_total_after,
    'transaction_id', v_reversal_transaction,
    'fully_refunded', v_total_after = v_original_amount
  );
END;
$function$;

REVOKE ALL ON FUNCTION omega_private.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION omega_private.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.record_stripe_refund(
  p_event_id text,
  p_event_type text,
  p_charge_id text,
  p_payment_intent_id text,
  p_amount_minor bigint,
  p_amount_refunded_minor bigint,
  p_currency text,
  p_payload_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT omega_private.record_stripe_refund(
    p_event_id, p_event_type, p_charge_id, p_payment_intent_id,
    p_amount_minor, p_amount_refunded_minor, p_currency,
    p_payload_hash, p_metadata
  );
$function$;

REVOKE ALL ON FUNCTION public.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  TO service_role;

COMMIT;
 THEN
    RAISE EXCEPTION 'stripe_currency_invalid';
  END IF;

  -- Stripe's API uses minor units, with the same zero-decimal and compatibility
  -- rules as record_stripe_payment. ISK and UGX intentionally remain /100.
  v_charge_amount := CASE
    WHEN v_currency IN (
      'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA',
      'PYG','RWF','VND','VUV','XAF','XOF','XPF'
    ) THEN p_amount_minor::numeric
    ELSE p_amount_minor::numeric / 100
  END;
  v_new_refunded := CASE
    WHEN v_currency IN (
      'BIF','CLP','DJF','GNF','JPY','KMF','KRW','MGA',
      'PYG','RWF','VND','VUV','XAF','XOF','XPF'
    ) THEN p_amount_refunded_minor::numeric
    ELSE p_amount_refunded_minor::numeric / 100
  END;

  -- Claim the provider event inside the same transaction as its ledger effect.
  INSERT INTO public.omega_payment_events(
    provider, provider_event_id, event_type, payload_hash, status, metadata
  ) VALUES (
    'stripe', p_event_id, p_event_type, COALESCE(p_payload_hash, ''),
    'RECEIVED',
    COALESCE(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'charge_id', p_charge_id,
      'payment_intent_id', p_payment_intent_id,
      'amount_minor', p_amount_minor,
      'amount_refunded_minor', p_amount_refunded_minor,
      'currency', v_currency
    )
  ) ON CONFLICT (provider, provider_event_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT status, transaction_id
      INTO v_event_status, v_existing_event_transaction
      FROM public.omega_payment_events
     WHERE provider = 'stripe' AND provider_event_id = p_event_id
     FOR UPDATE;
    IF v_event_status = 'PROCESSED' OR v_event_status = 'IGNORED' THEN
      RETURN pg_catalog.jsonb_build_object(
        'ok', true, 'duplicate', true, 'transaction_id', v_existing_event_transaction
      );
    END IF;
    RAISE EXCEPTION 'stripe_refund_event_in_progress';
  END IF;

  -- Lock the original settlement so refunds for this payment intent serialize,
  -- including when Stripe presents more than one charge ID.
  SELECT t.transaction_id, r.settled_amount, upper(r.currency), t.status
    INTO v_original_transaction, v_original_amount, v_original_currency, v_original_status
    FROM public.omega_payment_reconciliation AS r
    JOIN public.omega_ledger_transactions AS t
      ON t.transaction_id = r.internal_transaction_id
   WHERE r.provider = 'stripe'
     AND r.provider_reference = p_payment_intent_id
     AND r.currency = v_currency
     AND t.external_reference = p_payment_intent_id
     AND t.event_type = 'STRIPE_SETTLEMENT'
   ORDER BY r.created_at DESC
   LIMIT 1
   FOR UPDATE OF t;

  IF v_original_transaction IS NULL THEN
    RAISE EXCEPTION 'stripe_original_settlement_not_found';
  END IF;
  IF v_original_amount IS NULL OR v_original_amount <= 0
     OR v_original_currency IS DISTINCT FROM v_currency
     OR v_original_status NOT IN ('POSTED', 'REVERSED') THEN
    RAISE EXCEPTION 'stripe_original_settlement_invalid';
  END IF;

  INSERT INTO omega_private.stripe_refund_state(
    charge_id, payment_intent_id, original_transaction_id, currency_code,
    original_amount, charge_amount, amount_refunded
  ) VALUES (
    p_charge_id, p_payment_intent_id, v_original_transaction, v_currency,
    v_original_amount, v_charge_amount, 0
  ) ON CONFLICT (charge_id) DO NOTHING;

  SELECT * INTO v_state
    FROM omega_private.stripe_refund_state
   WHERE charge_id = p_charge_id
   FOR UPDATE;

  IF v_state.original_transaction_id IS DISTINCT FROM v_original_transaction
     OR v_state.payment_intent_id IS DISTINCT FROM p_payment_intent_id
     OR v_state.currency_code IS DISTINCT FROM v_currency
     OR v_state.original_amount IS DISTINCT FROM v_original_amount
     OR v_state.charge_amount IS DISTINCT FROM v_charge_amount THEN
    RAISE EXCEPTION 'stripe_refund_charge_mapping_conflict';
  END IF;

  SELECT COALESCE(pg_catalog.sum(amount_refunded), 0)
    INTO v_other_refunded
    FROM omega_private.stripe_refund_state
   WHERE original_transaction_id = v_original_transaction
     AND charge_id <> p_charge_id;

  IF v_new_refunded < v_state.amount_refunded THEN
    UPDATE public.omega_payment_events
       SET status = 'PROCESSED',
           processed_at = pg_catalog.now(),
           metadata = metadata || pg_catalog.jsonb_build_object('stale_refund_event', true)
     WHERE provider = 'stripe' AND provider_event_id = p_event_id;
    RETURN pg_catalog.jsonb_build_object(
      'ok', true, 'duplicate', false, 'stale', true,
      'delta_amount', 0, 'cumulative_refunded_amount', v_state.amount_refunded,
      'transaction_id', NULL
    );
  END IF;

  IF v_new_refunded = v_state.amount_refunded THEN
    UPDATE public.omega_payment_events
       SET status = 'PROCESSED',
           processed_at = pg_catalog.now(),
           metadata = metadata || pg_catalog.jsonb_build_object('duplicate_cumulative_refund', true)
     WHERE provider = 'stripe' AND provider_event_id = p_event_id;
    RETURN pg_catalog.jsonb_build_object(
      'ok', true, 'duplicate', true, 'stale', false,
      'delta_amount', 0, 'cumulative_refunded_amount', v_state.amount_refunded,
      'transaction_id', v_state.last_reversal_transaction_id
    );
  END IF;

  v_total_after := v_other_refunded + v_new_refunded;
  IF v_total_after > v_original_amount THEN
    RAISE EXCEPTION 'stripe_refund_exceeds_original_settlement';
  END IF;
  v_delta := v_new_refunded - v_state.amount_refunded;
  IF v_delta <= 0 THEN
    RAISE EXCEPTION 'stripe_refund_delta_invalid';
  END IF;

  -- The current settlement RPC posts exactly two balanced entries. Fail closed
  -- if the source transaction has a different shape; never guess allocation.
  SELECT pg_catalog.count(*) INTO v_entry_count
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction;

  SELECT account_id, amount INTO v_debit_account, v_debit_amount
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction
     AND direction = 'DEBIT' AND currency_code = v_currency
   ORDER BY created_at LIMIT 1;

  SELECT account_id, amount INTO v_credit_account, v_credit_amount
    FROM public.omega_ledger_entries
   WHERE transaction_id = v_original_transaction
     AND direction = 'CREDIT' AND currency_code = v_currency
   ORDER BY created_at LIMIT 1;

  IF v_entry_count <> 2
     OR v_debit_account IS NULL OR v_credit_account IS NULL
     OR v_debit_account = v_credit_account
     OR v_debit_amount IS DISTINCT FROM v_original_amount
     OR v_credit_amount IS DISTINCT FROM v_original_amount THEN
    RAISE EXCEPTION 'stripe_original_ledger_shape_unsupported';
  END IF;

  v_reversal_transaction := omega_private.post_ledger_transaction(
    'stripe-refund:' || p_charge_id || ':' || p_amount_refunded_minor::text,
    'STRIPE_REFUND_REVERSAL',
    v_currency,
    'Stripe refund reversal for charge ' || p_charge_id,
    pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'account_id', v_credit_account, 'direction', 'DEBIT',
        'amount', v_delta, 'currency_code', v_currency
      ),
      pg_catalog.jsonb_build_object(
        'account_id', v_debit_account, 'direction', 'CREDIT',
        'amount', v_delta, 'currency_code', v_currency
      )
    ),
    p_charge_id,
    COALESCE(p_metadata, '{}'::jsonb) || pg_catalog.jsonb_build_object(
      'stripe_event_id', p_event_id,
      'payment_intent_id', p_payment_intent_id,
      'charge_id', p_charge_id,
      'cumulative_refunded_minor', p_amount_refunded_minor,
      'delta_amount', v_delta,
      'currency', v_currency
    )
  );

  INSERT INTO public.omega_payment_reconciliation(
    provider, provider_reference, internal_transaction_id,
    expected_amount, settled_amount, currency, status,
    idempotency_key, evidence, reconciled_at
  ) VALUES (
    'stripe', p_charge_id, v_reversal_transaction,
    v_delta, v_delta, v_currency, 'matched',
    'stripe-refund-reconciliation:' || p_charge_id || ':' || p_amount_refunded_minor::text,
    pg_catalog.jsonb_build_object(
      'event_id', p_event_id,
      'event_type', p_event_type,
      'payment_intent_id', p_payment_intent_id,
      'charge_id', p_charge_id,
      'original_transaction_id', v_original_transaction,
      'payload_hash', p_payload_hash,
      'cumulative_refunded_minor', p_amount_refunded_minor,
      'delta_amount', v_delta
    ),
    pg_catalog.now()
  ) ON CONFLICT (idempotency_key) DO NOTHING;

  UPDATE omega_private.stripe_refund_state
     SET amount_refunded = v_new_refunded,
         last_event_id = p_event_id,
         last_reversal_transaction_id = v_reversal_transaction,
         updated_at = pg_catalog.now()
   WHERE charge_id = p_charge_id;

  IF v_total_after = v_original_amount THEN
    UPDATE public.omega_ledger_transactions
       SET status = 'REVERSED',
           metadata = metadata || pg_catalog.jsonb_build_object(
             'fully_refunded_at', pg_catalog.now(),
             'last_refund_event_id', p_event_id
           )
     WHERE transaction_id = v_original_transaction;

    UPDATE public.omega_payment_reconciliation
       SET status = 'reversed',
           reconciled_at = pg_catalog.now(),
           evidence = evidence || pg_catalog.jsonb_build_object(
             'fully_refunded', true,
             'last_refund_event_id', p_event_id,
             'cumulative_refunded_amount', v_total_after
           )
     WHERE provider = 'stripe'
       AND provider_reference = p_payment_intent_id
       AND internal_transaction_id = v_original_transaction;
  END IF;

  UPDATE public.omega_payment_events
     SET status = 'PROCESSED',
         transaction_id = v_reversal_transaction,
         processed_at = pg_catalog.now(),
         metadata = metadata || pg_catalog.jsonb_build_object(
           'delta_amount', v_delta,
           'cumulative_refunded_amount', v_total_after,
           'original_transaction_id', v_original_transaction,
           'fully_refunded', v_total_after = v_original_amount
         )
   WHERE provider = 'stripe' AND provider_event_id = p_event_id;

  RETURN pg_catalog.jsonb_build_object(
    'ok', true, 'duplicate', false, 'stale', false,
    'delta_amount', v_delta,
    'cumulative_refunded_amount', v_total_after,
    'transaction_id', v_reversal_transaction,
    'fully_refunded', v_total_after = v_original_amount
  );
END;
$function$;

REVOKE ALL ON FUNCTION omega_private.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION omega_private.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  TO service_role;

CREATE OR REPLACE FUNCTION public.record_stripe_refund(
  p_event_id text,
  p_event_type text,
  p_charge_id text,
  p_payment_intent_id text,
  p_amount_minor bigint,
  p_amount_refunded_minor bigint,
  p_currency text,
  p_payload_hash text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT omega_private.record_stripe_refund(
    p_event_id, p_event_type, p_charge_id, p_payment_intent_id,
    p_amount_minor, p_amount_refunded_minor, p_currency,
    p_payload_hash, p_metadata
  );
$function$;

REVOKE ALL ON FUNCTION public.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_stripe_refund(text, text, text, text, bigint, bigint, text, text, jsonb)
  TO service_role;

COMMIT;
