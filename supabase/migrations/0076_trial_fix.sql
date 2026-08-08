-- ============================================================================
-- SYD OMEGA 91717 -- TRIAL ACCESS FIX
-- Trial period: 9 MINUTES 17 SECONDS = 557 seconds
-- DEDICATION period: 9 HOURS 17 MINUTES 17 SECONDS = 33,437 seconds (separate engine). Exact. Non-negotiable.
-- Run AFTER all migration chunks in Supabase SQL editor.
-- ============================================================================

/* ── 1. APPROVE MEMBER: grants exactly 9h 17m 17s trial access ──────────── */
DROP FUNCTION IF EXISTS public.approve_member(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _starts  timestamptz := now();
  _expires timestamptz := now() + INTERVAL '557 seconds'; /* 9 minutes 17 seconds: the sovereign trial */
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    access_approved  = true,
    is_trial         = true,
    trial_expires_at = _expires,
    is_rejected      = false,
    access_requested_at = COALESCE(access_requested_at, now())
  WHERE id = p_uid AND NOT is_owner;
  RETURN jsonb_build_object(
    'ok',             true,
    'uid',            p_uid,
    'trial_starts',   _starts,
    'trial_expires',  _expires,
    'duration_seconds', 557,
    'duration_display', '9 MINUTES 17 SECONDS',
    'duration_hhmmss',  '09:17'
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_member(uuid) TO authenticated;

/* ── 2. CHECK TRIAL STATUS: auto-expires if past due ────────────────────── */
DROP FUNCTION IF EXISTS public.check_trial_status(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.check_trial_status(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE r record;
BEGIN
  SELECT is_trial, is_owner, trial_expires_at, access_approved, is_rejected
  INTO r FROM public.profiles WHERE id = p_uid;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','not_found'); END IF;
  IF r.is_owner THEN
    RETURN jsonb_build_object('ok',true,'status','owner','permanent',true,
      'duration_display','LIFETIME SOVEREIGN');
  END IF;
  /* Auto-expire if trial has lapsed */
  IF r.is_trial AND r.trial_expires_at IS NOT NULL AND r.trial_expires_at <= now() THEN
    UPDATE public.profiles SET
      access_approved = false, is_trial = false, trial_expires_at = NULL
    WHERE id = p_uid;
    RETURN jsonb_build_object('ok',true,'status','expired',
      'expired_at', r.trial_expires_at,
      'duration_display', '9 MINUTES 17 SECONDS COMPLETE');
  END IF;
  IF r.is_trial AND r.trial_expires_at > now() THEN
    RETURN jsonb_build_object(
      'ok',               true,
      'status',           'trial',
      'expires_at',       r.trial_expires_at,
      'started_at',       r.trial_expires_at - INTERVAL '557 seconds', /* 9 min 17 sec trial */
      'seconds_remaining', EXTRACT(EPOCH FROM (r.trial_expires_at - now()))::int,
      'seconds_total',    557,
      'duration_display', '9 MINUTES 17 SECONDS',
      'duration_hhmmss',  '09:17'
    );
  END IF;
  IF r.access_approved AND NOT r.is_trial THEN
    RETURN jsonb_build_object('ok',true,'status','permanent','permanent',true,
      'duration_display','PERMANENT ACCESS');
  END IF;
  RETURN jsonb_build_object('ok',true,'status','pending');
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_trial_status(uuid) TO authenticated;

/* ── 3. MY TRIAL STATUS: member checks their own status ─────────────────── */
DROP FUNCTION IF EXISTS public.my_trial_status() CASCADE;
CREATE OR REPLACE FUNCTION public.my_trial_status()
RETURNS jsonb LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT public.check_trial_status(auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.my_trial_status() TO authenticated;

/* ── 4. GRANT PERMANENT ACCESS ──────────────────────────────────────────── */
DROP FUNCTION IF EXISTS public.grant_permanent_access(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.grant_permanent_access(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    access_approved  = true,
    is_trial         = false,
    trial_expires_at = NULL,
    is_rejected      = false
  WHERE id = p_uid AND NOT is_owner;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'status','permanent',
    'duration_display','LIFETIME ACCESS GRANTED');
END;
$$;
GRANT EXECUTE ON FUNCTION public.grant_permanent_access(uuid) TO authenticated;

/* ── 5. VERIFY RESULT ───────────────────────────────────────────────────── */
SELECT
  display_name,
  is_owner,
  access_approved,
  is_trial,
  trial_expires_at,
  CASE
    WHEN is_owner THEN 'LIFETIME SOVEREIGN'
    WHEN access_approved AND NOT is_trial THEN 'PERMANENT'
    WHEN is_trial AND trial_expires_at > now()
      THEN EXTRACT(EPOCH FROM (trial_expires_at - now()))::int || 's remaining of 557s (9 min 17 sec)'
    WHEN is_trial AND trial_expires_at <= now() THEN 'EXPIRED'
    ELSE 'PENDING'
  END AS trial_status
FROM public.profiles
ORDER BY is_owner DESC, created_at DESC
LIMIT 10;
