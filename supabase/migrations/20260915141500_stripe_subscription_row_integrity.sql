-- ============================================================================
-- SYD OMEGA 91717 — STRIPE SUBSCRIPTION ROW INTEGRITY
--
-- Additive correction only. Preserves the existing Edge Function ->
-- apply_subscription() architecture.
--
-- The idempotency layer correctly prevents duplicate Stripe events, but an
-- UPDATE that matches zero profile rows would otherwise still return ok=true.
-- That could acknowledge a payment event without actually granting or
-- updating an entitlement. Treat a missing profile as a transactional failure
-- so Stripe retries instead of silently losing the subscription mutation.
-- ============================================================================

BEGIN;

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
  updated_count integer;
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

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count <> 1 THEN
    RAISE EXCEPTION 'subscription_profile_not_found';
  END IF;

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
