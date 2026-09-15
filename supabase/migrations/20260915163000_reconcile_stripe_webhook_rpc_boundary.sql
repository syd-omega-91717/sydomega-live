-- SYD OMEGA 91717 — Stripe webhook RPC boundary reconciliation.
-- Removes conflicting overloaded public RPCs and keeps one canonical event
-- boundary for PostgREST/Edge Functions. The existing public
-- apply_subscription(uuid,text,text,timestamptz,text) remains the entitlement
-- primitive; apply_subscription_event(text,text,uuid,text,text,timestamptz,text)
-- remains the single idempotent event entrypoint.

BEGIN;

DROP FUNCTION IF EXISTS public.apply_subscription_event(uuid, text, text, timestamptz, text, text, text);
DROP FUNCTION IF EXISTS public.apply_subscription(uuid, text, text, timestamptz, text, text, text);

CREATE OR REPLACE FUNCTION private.apply_subscription(
  p_uid uuid,
  p_tier text,
  p_status text,
  p_period_end timestamptz,
  p_customer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  updated_count integer;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
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

  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'tier', p_tier, 'status', p_status);
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_subscription_event(
  p_event_id text,
  p_event_type text,
  p_uid uuid,
  p_tier text,
  p_status text,
  p_period_end timestamptz,
  p_customer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  existing_status text;
  applied jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF p_event_id IS NULL OR length(trim(p_event_id)) = 0 THEN
    RAISE EXCEPTION 'stripe_event_id_required';
  END IF;

  INSERT INTO public.stripe_webhook_events(event_id, event_type, status)
  VALUES (p_event_id, COALESCE(NULLIF(p_event_type, ''), 'unknown'), 'processing')
  ON CONFLICT (event_id) DO NOTHING;

  IF NOT FOUND THEN
    SELECT status INTO existing_status
    FROM public.stripe_webhook_events
    WHERE event_id = p_event_id
    FOR UPDATE;

    IF existing_status = 'processed' THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'event_id', p_event_id);
    END IF;

    RAISE EXCEPTION 'stripe_event_in_progress';
  END IF;

  applied := public.apply_subscription(p_uid, p_tier, p_status, p_period_end, p_customer);

  IF COALESCE((applied ->> 'ok')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'subscription_application_rejected';
  END IF;

  UPDATE public.stripe_webhook_events
  SET status = 'processed', processed_at = now(), event_type = COALESCE(NULLIF(p_event_type, ''), event_type)
  WHERE event_id = p_event_id;

  RETURN applied || jsonb_build_object('event_id', p_event_id, 'duplicate', false);
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_subscription_event(text, text, uuid, text, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(text, text, uuid, text, text, timestamptz, text) TO service_role;

COMMIT;
