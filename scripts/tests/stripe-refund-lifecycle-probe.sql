-- Integration probe for the pending Stripe refund migration.
-- Runs only against the isolated CI database and rolls back every fixture.
BEGIN;

DO $stripe_refund_probe$
DECLARE
  v_treasury uuid;
  v_revenue uuid;
  v_original_tx uuid;
  v_refund_tx uuid;
  v_result jsonb;
  v_count integer;
  v_state_amount numeric;
  v_original_status text;
  v_original_recon_status text;
  v_debits numeric;
  v_credits numeric;
  v_jpy_treasury uuid;
  v_jpy_revenue uuid;
  v_jpy_tx uuid;
BEGIN
  INSERT INTO public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
  VALUES (NULL,'TREASURY','USD','CI refund treasury','{"test_fixture":true}')
  RETURNING account_id INTO v_treasury;
  INSERT INTO public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
  VALUES (NULL,'REVENUE','USD','CI refund revenue','{"test_fixture":true}')
  RETURNING account_id INTO v_revenue;

  INSERT INTO public.omega_ledger_transactions(
    idempotency_key,event_type,currency_code,external_reference,description,status,metadata
  ) VALUES (
    'test-stripe-refund-original','STRIPE_SETTLEMENT','USD','pi_test_refund_1',
    'CI-only original settlement','POSTED','{"test_fixture":true}'
  ) RETURNING transaction_id INTO v_original_tx;

  INSERT INTO public.omega_ledger_entries(transaction_id,account_id,direction,amount,currency_code,metadata)
  VALUES
    (v_original_tx,v_treasury,'DEBIT',10,'USD','{"test_fixture":true}'),
    (v_original_tx,v_revenue,'CREDIT',10,'USD','{"test_fixture":true}');

  INSERT INTO public.omega_payment_events(
    provider,provider_event_id,event_type,payload_hash,status,transaction_id,metadata,processed_at
  ) VALUES (
    'stripe','evt_test_original_payment','invoice.payment_succeeded','fixture-hash',
    'PROCESSED',v_original_tx,'{"test_fixture":true}',now()
  );

  INSERT INTO public.omega_payment_reconciliation(
    provider,provider_reference,internal_transaction_id,expected_amount,settled_amount,
    currency,status,idempotency_key,evidence,reconciled_at
  ) VALUES (
    'stripe','pi_test_refund_1',v_original_tx,10,10,'USD','matched',
    'stripe-reconciliation:evt_test_original_payment','{"test_fixture":true}',now()
  );

  -- First partial refund: cumulative $3.00.
  v_result := public.record_stripe_refund(
    'evt_test_refund_300','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,300,'usd','fixture-refund-300','{"test_fixture":true}'
  );
  IF (v_result->>'ok')::boolean IS DISTINCT FROM true
     OR (v_result->>'delta_amount')::numeric <> 3 THEN
    RAISE EXCEPTION 'partial refund did not post expected $3 delta: %',v_result;
  END IF;

  SELECT transaction_id INTO v_refund_tx
    FROM public.omega_ledger_transactions
   WHERE idempotency_key='stripe-refund:ch_test_refund_1:300';
  IF v_refund_tx IS NULL THEN RAISE EXCEPTION 'partial refund transaction missing'; END IF;

  SELECT pg_catalog.coalesce(sum(amount) FILTER (WHERE direction='DEBIT'),0),
         pg_catalog.coalesce(sum(amount) FILTER (WHERE direction='CREDIT'),0)
    INTO v_debits,v_credits
    FROM public.omega_ledger_entries WHERE transaction_id=v_refund_tx;
  IF v_debits <> 3 OR v_credits <> 3 THEN
    RAISE EXCEPTION 'partial refund ledger is not balanced: debits %, credits %',v_debits,v_credits;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.omega_ledger_entries
     WHERE transaction_id=v_refund_tx AND account_id=v_revenue AND direction='DEBIT' AND amount=3
  ) OR NOT EXISTS (
    SELECT 1 FROM public.omega_ledger_entries
     WHERE transaction_id=v_refund_tx AND account_id=v_treasury AND direction='CREDIT' AND amount=3
  ) THEN
    RAISE EXCEPTION 'partial refund did not reverse the original accounts';
  END IF;

  -- Exact event replay is idempotent.
  v_result := public.record_stripe_refund(
    'evt_test_refund_300','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,300,'usd','fixture-refund-300','{"test_fixture":true}'
  );
  IF (v_result->>'duplicate')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'exact duplicate event was not identified: %',v_result;
  END IF;

  -- A new event ID with the same cumulative amount must not double-post.
  v_result := public.record_stripe_refund(
    'evt_test_refund_same_total','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,300,'usd','fixture-refund-300b','{"test_fixture":true}'
  );
  IF (v_result->>'delta_amount')::numeric <> 0 THEN
    RAISE EXCEPTION 'same cumulative refund double-posted: %',v_result;
  END IF;
  SELECT count(*) INTO v_count FROM public.omega_ledger_transactions
   WHERE event_type='STRIPE_REFUND_REVERSAL' AND external_reference='ch_test_refund_1';
  IF v_count <> 1 THEN RAISE EXCEPTION 'same cumulative refund created % reversals',v_count; END IF;

  -- Out-of-order stale cumulative events must not reduce state or post a reversal.
  v_result := public.record_stripe_refund(
    'evt_test_refund_stale','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,200,'usd','fixture-refund-stale','{"test_fixture":true}'
  );
  IF (v_result->>'stale')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'stale cumulative event was not identified: %',v_result;
  END IF;

  -- A second charge ID cannot make cumulative refunds exceed the original payment.
  BEGIN
    PERFORM public.record_stripe_refund(
      'evt_test_refund_overflow','charge.refunded','ch_test_refund_2','pi_test_refund_1',
      1000,800,'usd','fixture-refund-overflow','{"test_fixture":true}'
    );
    RAISE EXCEPTION 'over-refund unexpectedly accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM <> 'stripe_refund_exceeds_original_settlement' THEN RAISE; END IF;
  END;
  IF EXISTS (SELECT 1 FROM omega_private.stripe_refund_state WHERE charge_id='ch_test_refund_2') THEN
    RAISE EXCEPTION 'rejected over-refund left persistent state';
  END IF;

  -- A larger cumulative total posts only the delta, not the full cumulative value.
  v_result := public.record_stripe_refund(
    'evt_test_refund_600','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,600,'usd','fixture-refund-600','{"test_fixture":true}'
  );
  IF (v_result->>'delta_amount')::numeric <> 3 THEN
    RAISE EXCEPTION 'second partial refund did not post only $3 delta: %',v_result;
  END IF;

  -- Full refund posts only the remaining $4 and marks the original settlement reversed.
  v_result := public.record_stripe_refund(
    'evt_test_refund_1000','charge.refunded','ch_test_refund_1','pi_test_refund_1',
    1000,1000,'usd','fixture-refund-1000','{"test_fixture":true}'
  );
  IF (v_result->>'delta_amount')::numeric <> 4
     OR (v_result->>'fully_refunded')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'full refund delta/state incorrect: %',v_result;
  END IF;

  SELECT amount_refunded INTO v_state_amount FROM omega_private.stripe_refund_state
   WHERE charge_id='ch_test_refund_1';
  SELECT status INTO v_original_status FROM public.omega_ledger_transactions
   WHERE transaction_id=v_original_tx;
  SELECT status INTO v_original_recon_status FROM public.omega_payment_reconciliation
   WHERE internal_transaction_id=v_original_tx AND provider_reference='pi_test_refund_1';
  IF v_state_amount <> 10 OR v_original_status <> 'REVERSED' OR v_original_recon_status <> 'reversed' THEN
    RAISE EXCEPTION 'full refund did not finalize state: amount %, transaction %, reconciliation %',
      v_state_amount,v_original_status,v_original_recon_status;
  END IF;

  -- Zero-decimal currency amounts must remain whole major units (500 JPY, not JPY 5).
  INSERT INTO public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
  VALUES (NULL,'TREASURY','JPY','CI JPY refund treasury','{"test_fixture":true}')
  RETURNING account_id INTO v_jpy_treasury;
  INSERT INTO public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
  VALUES (NULL,'REVENUE','JPY','CI JPY refund revenue','{"test_fixture":true}')
  RETURNING account_id INTO v_jpy_revenue;

  INSERT INTO public.omega_ledger_transactions(
    idempotency_key,event_type,currency_code,external_reference,description,status,metadata
  ) VALUES (
    'test-stripe-refund-jpy-original','STRIPE_SETTLEMENT','JPY','pi_test_refund_jpy',
    'CI-only JPY settlement','POSTED','{"test_fixture":true}'
  ) RETURNING transaction_id INTO v_jpy_tx;

  INSERT INTO public.omega_ledger_entries(transaction_id,account_id,direction,amount,currency_code,metadata)
  VALUES
    (v_jpy_tx,v_jpy_treasury,'DEBIT',500,'JPY','{"test_fixture":true}'),
    (v_jpy_tx,v_jpy_revenue,'CREDIT',500,'JPY','{"test_fixture":true}');

  INSERT INTO public.omega_payment_events(
    provider,provider_event_id,event_type,payload_hash,status,transaction_id,metadata,processed_at
  ) VALUES (
    'stripe','evt_test_original_jpy','invoice.payment_succeeded','fixture-jpy',
    'PROCESSED',v_jpy_tx,'{"test_fixture":true}',now()
  );

  INSERT INTO public.omega_payment_reconciliation(
    provider,provider_reference,internal_transaction_id,expected_amount,settled_amount,
    currency,status,idempotency_key,evidence,reconciled_at
  ) VALUES (
    'stripe','pi_test_refund_jpy',v_jpy_tx,500,500,'JPY','matched',
    'stripe-reconciliation:evt_test_original_jpy','{"test_fixture":true}',now()
  );

  v_result := public.record_stripe_refund(
    'evt_test_refund_jpy_100','charge.refunded','ch_test_refund_jpy','pi_test_refund_jpy',
    500,100,'jpy','fixture-jpy-refund','{"test_fixture":true}'
  );
  IF (v_result->>'delta_amount')::numeric <> 100 THEN
    RAISE EXCEPTION 'JPY refund conversion was not whole-unit accurate: %',v_result;
  END IF;
END;
$stripe_refund_probe$;

ROLLBACK;
