-- Historical production migration materialization.
-- The canonical Stripe webhook boundary is reconciled by the later cleanup
-- migration; this file records the migration version already applied on the
-- live project so local and remote histories remain aligned.

BEGIN;

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id text PRIMARY KEY,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'processing',
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'processing';

ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.stripe_webhook_events FROM anon, authenticated, public;

CREATE OR REPLACE FUNCTION public.apply_subscription_event(
  p_uid uuid,
  p_tier text,
  p_status text,
  p_period_end timestamptz,
  p_customer text,
  p_event_id text,
  p_event_type text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  inserted_count integer;
  event_status text;
  result jsonb;
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;
  IF p_event_id IS NULL OR btrim(p_event_id) = '' THEN
    RAISE EXCEPTION 'stripe_event_id_required';
  END IF;
  INSERT INTO public.stripe_webhook_events (event_id, event_type, status)
  VALUES (btrim(p_event_id), COALESCE(NULLIF(btrim(p_event_type), ''), 'unknown'), 'processing')
  ON CONFLICT (event_id) DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 0 THEN
    SELECT status INTO event_status FROM public.stripe_webhook_events WHERE event_id = btrim(p_event_id) FOR UPDATE;
    IF event_status = 'processed' THEN
      RETURN jsonb_build_object('ok', true, 'duplicate', true, 'event_id', btrim(p_event_id));
    END IF;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_uid) THEN
    RAISE EXCEPTION 'subscription_profile_not_found';
  END IF;
  SELECT public.apply_subscription(p_uid, p_tier, p_status, p_period_end, p_customer) INTO result;
  IF result IS NULL OR result->>'ok' IS DISTINCT FROM 'true' THEN
    RAISE EXCEPTION 'subscription_apply_failed';
  END IF;
  UPDATE public.stripe_webhook_events
  SET status = 'processed', processed_at = now(), event_type = COALESCE(NULLIF(btrim(p_event_type), ''), event_type)
  WHERE event_id = btrim(p_event_id);
  RETURN result || jsonb_build_object('event_id', btrim(p_event_id), 'event_type', p_event_type);
END;
$function$;

REVOKE ALL ON FUNCTION public.apply_subscription_event(uuid, text, text, timestamptz, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription_event(uuid, text, text, timestamptz, text, text, text) TO service_role;

COMMIT;
