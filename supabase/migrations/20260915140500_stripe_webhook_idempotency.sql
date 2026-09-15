-- ============================================================================
-- SYD OMEGA 91717 — STRIPE WEBHOOK IDEMPOTENCY
--
-- Preserves the existing Supabase Edge Function -> apply_subscription()
-- architecture while making Stripe event delivery idempotent.
--
-- Stripe may deliver the same event more than once. The event identifier is
-- therefore persisted in the same transaction as the subscription mutation.
-- If the subscription update fails, the transaction rolls back and Stripe can
-- retry safely. If the event already exists, the function returns a duplicate
-- result without mutating the subscription again.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid,
  p_tier text,
  p_status text,
  p_period_end timestamptz,
  p_customer text,
  p_event_id text DEFAULT NULL,
  p_event_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  inserted_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF p_event_id IS NOT NULL AND btrim(p_event_id) <> '' THEN
    INSERT INTO public.stripe_webhook_events (event_id, event_type)
    VALUES (p_event_id, COALESCE(NULLIF(btrim(p_event_type), ''), 'unknown'))
    ON CONFLICT (event_id) DO NOTHING;

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    IF inserted_count = 0 THEN
      RETURN jsonb_build_object(
        'ok', true,
        'duplicate', true,
        'event_id', p_event_id
      );
    END IF;
  END IF;

  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE
      WHEN p_status IN ('active','trialing') THEN upper(p_tier)
      ELSE membership_tier
    END
  WHERE id = p_uid;

  RETURN jsonb_build_object(
    'ok', true,
    'uid', p_uid,
    'tier', p_tier,
    'status', p_status,
    'event_id', p_event_id
  );
END;
$function$;

COMMIT;
