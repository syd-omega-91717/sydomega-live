-- ============================================================================
-- SYD OMEGA 91717 -- POPULATE public.notifications ON MEMBER-STATUS EVENTS
-- omega_notifications_fix.sql added the public.notifications table that
-- omega-notify.js (injected platform-wide by bg.js) reads for the badge/
-- toast/panel widget, but nothing anywhere inserted a row into it -- CLAUDE.md
-- flagged this explicitly as separate, undone-on-purpose work: "deciding
-- which server-side events should generate one is separate... work."
--
-- This file closes that gap for the one set of events that's unambiguous and
-- already fully defined: the five owner-gated member-status RPCs in
-- omega_access_control.sql and omega_extend_trial_fix.sql
-- (approve_member, grant_permanent_access, reject_member, revoke_member,
-- extend_trial) -- every one of them already changes exactly one member's
-- access state on the owner's explicit action, which is precisely what a
-- notification should announce. No new business logic invented; no
-- speculative trigger (e.g. "trade" or "mission outcome" events for
-- user_assets) added -- those remain intentionally undone, per CLAUDE.md,
-- pending a product decision on how they'd actually be generated.
--
-- Each function's body is otherwise byte-for-byte identical to its current
-- definition (CREATE OR REPLACE, same signature/return type) -- only a
-- single INSERT INTO public.notifications was added before the RETURN.
-- notification_type values match the set omega-notify.js already recognizes
-- (gate_unlock, access_granted, trial_start, task_complete, system).
--
-- DEPENDS ON public.notifications existing -- run AFTER
-- omega_notifications_fix.sql (loose bag) / 0091_omega_notifications_fix.sql
-- (supabase/migrations/), same as every other file in this family depends on
-- omega_access_control.sql having already created the functions being
-- replaced here.
--
-- Idempotent, safe to re-run.
-- ============================================================================
BEGIN;

-- drop prior versions of these functions first -- CREATE OR REPLACE cannot
-- change a return type, and a live database may already have a version of
-- one of these with a different return type (or a different argument list
-- than assumed below). Same defensive pattern as omega_access_control.sql,
-- which originally created these functions for exactly this reason.
DO $drop$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT 'DROP FUNCTION IF EXISTS public.' || quote_ident(p.proname)
           || '(' || pg_get_function_identity_arguments(p.oid) || ');' AS cmd
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('approve_member','grant_permanent_access',
                        'reject_member','revoke_member','extend_trial')
  LOOP
    EXECUTE r.cmd;
  END LOOP;
END $drop$;

CREATE OR REPLACE FUNCTION public.approve_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE exp timestamptz;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  exp := now() + public.trial_length();
  UPDATE public.profiles
     SET access_approved=true, is_trial=true, is_rejected=false, trial_expires_at=exp
   WHERE id=p_uid;
  INSERT INTO public.notifications(user_id,notification_type,message)
    VALUES (p_uid,'trial_start','Your 9:17 sovereign trial has begun.');
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'is_trial',true,'trial_expires_at',exp,'minutes',9.1717);
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_permanent_access(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=true, is_trial=false, is_rejected=false, trial_expires_at=NULL
   WHERE id=p_uid;
  INSERT INTO public.notifications(user_id,notification_type,message)
    VALUES (p_uid,'access_granted','Permanent access has been granted. Welcome to the Order.');
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'permanent',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, is_rejected=true, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  INSERT INTO public.notifications(user_id,notification_type,message)
    VALUES (p_uid,'system','Your access request was not approved at this time.');
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'rejected',true);
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_member(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  UPDATE public.profiles
     SET access_approved=false, is_trial=false, trial_expires_at=NULL
   WHERE id=p_uid AND COALESCE(is_owner,false)=false;
  INSERT INTO public.notifications(user_id,notification_type,message)
    VALUES (p_uid,'system','Your access has been revoked.');
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'revoked',true);
END;
$$;

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
  INSERT INTO public.notifications(user_id,notification_type,message)
    VALUES (p_uid,'trial_start','Your trial has been extended.');
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'trial_expires_at',exp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_member(uuid)         TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.grant_permanent_access(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid)          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.extend_trial(uuid,int)       TO authenticated;

COMMIT;
-- ===== end omega_notify_triggers.sql =====
