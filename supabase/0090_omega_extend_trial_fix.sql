-- ============================================================================
-- 0090_omega_extend_trial_fix.sql
-- SYD OMEGA 91717 -- EXTEND_TRIAL RPC FIX
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION public.extend_trial(p_uid uuid, p_seconds int)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE base timestamptz; exp timestamptz;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  SELECT trial_expires_at INTO base FROM public.profiles WHERE id=p_uid;
  IF base IS NULL OR base < now() THEN base := now(); END IF;
  exp := base + make_interval(secs => p_seconds);
  UPDATE public.profiles
     SET access_approved=true, is_trial=true, is_rejected=false, trial_expires_at=exp
   WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'trial_expires_at',exp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.extend_trial(uuid,int) TO authenticated;

COMMIT;
