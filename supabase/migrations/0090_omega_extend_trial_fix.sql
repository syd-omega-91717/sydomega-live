-- ============================================================================
-- SYD OMEGA 91717 -- EXTEND_TRIAL RPC FIX
-- approvals.html's extend(uid) (approvals.html:530-538) calls
-- sb.rpc('extend_trial', {p_uid, p_seconds:557}) to give a pending member
-- +9:17 more minutes on their trial -- but no such function exists anywhere
-- in supabase/*.sql (only trial_length(), expire_trial(), approve_member(),
-- grant_permanent_access(), reject_member(), revoke_member() do -- no
-- extend_trial). The call is wrapped in try/catch with a client-side
-- fallback .update() on profiles, written on the (incorrect) assumption
-- that sb.rpc() throws on a missing function -- the Supabase JS client
-- resolves rpc() with {data:null,error:{...}} instead of throwing, so the
-- catch block never runs. Net effect: clicking "extend" on a pending
-- member's trial does nothing to the database at all, while the UI still
-- shows the "EXTENDED +9:17 MINUTES" success toast.
--
-- Mirrors approve_member()'s trial-granting shape and the exact fallback
-- logic already written client-side (extend base = current trial_expires_at
-- if still in the future, else now(); add p_seconds on top). Owner-only,
-- matching every other member-management RPC in this file family.
--
-- Idempotent, safe to re-run.
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
-- ===== end omega_extend_trial_fix.sql =====
