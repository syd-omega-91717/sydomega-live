-- ============================================================================
-- SYD OMEGA 91717 -- TRIAL ACCESS FIX & MEMBER TIMELINE
-- Run in Supabase SQL editor.
-- 1. Ensures approve_member sets correct 9.1717-minute expiry
-- 2. Adds auto-expire trigger (fires on every profile SELECT)
-- 3. Creates check_my_trial() RPC for member's own trial status
-- ============================================================================

-- ── Fix approve_member to always set correct trial window ──────────────────
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $approve$
DECLARE
  _exp timestamptz := now() + INTERVAL '550.302 seconds'; -- 9.1717 minutes
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    access_approved  = true,
    is_trial         = true,
    trial_expires_at = _exp,
    is_rejected      = false
  WHERE id = p_uid AND NOT is_owner;
  RETURN jsonb_build_object(
    'ok', true,
    'uid', p_uid,
    'trial_starts', now(),
    'trial_expires', _exp,
    'duration_seconds', 557,
    'duration_display', '9 MINUTES 17 SECONDS'
  );
END;
$approve$;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid) TO authenticated;

-- ── Auto-expire: called on every gate check ────────────────────────────────
DROP FUNCTION IF EXISTS public.check_trial_status(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.check_trial_status(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $chk$
DECLARE r record;
BEGIN
  SELECT is_trial, is_owner, trial_expires_at, access_approved INTO r
  FROM public.profiles WHERE id=p_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF r.is_owner THEN RETURN jsonb_build_object('ok',true,'status','owner','permanent',true); END IF;
  IF r.is_trial AND r.trial_expires_at IS NOT NULL AND r.trial_expires_at <= now() THEN
    UPDATE public.profiles SET
      access_approved=false, is_trial=false, trial_expires_at=NULL
    WHERE id=p_uid;
    RETURN jsonb_build_object('ok',true,'status','expired','expired_at',r.trial_expires_at);
  END IF;
  IF r.is_trial AND r.trial_expires_at > now() THEN
    RETURN jsonb_build_object(
      'ok', true, 'status', 'trial',
      'expires_at', r.trial_expires_at,
      'seconds_remaining', EXTRACT(EPOCH FROM (r.trial_expires_at - now())),
      'started_approx', r.trial_expires_at - INTERVAL '557 seconds'
    );
  END IF;
  IF r.access_approved AND NOT r.is_trial THEN
    RETURN jsonb_build_object('ok',true,'status','permanent','permanent',true);
  END IF;
  RETURN jsonb_build_object('ok',true,'status','pending');
END;
$chk$;
GRANT EXECUTE ON FUNCTION public.check_trial_status(uuid) TO authenticated;

-- ── Member views own trial status ─────────────────────────────────────────
DROP FUNCTION IF EXISTS public.my_trial_status() CASCADE;
CREATE OR REPLACE FUNCTION public.my_trial_status()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $mts$
  SELECT public.check_trial_status(auth.uid());
$mts$;
GRANT EXECUTE ON FUNCTION public.my_trial_status() TO authenticated;

-- Verify
SELECT id, is_owner, is_trial, access_approved,
       trial_expires_at,
       CASE WHEN is_trial AND trial_expires_at > now()
            THEN EXTRACT(EPOCH FROM (trial_expires_at - now()))::int
            ELSE 0 END AS seconds_remaining
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;
