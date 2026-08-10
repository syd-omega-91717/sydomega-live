-- ============================================================================
-- 0092_omega_notify_triggers.sql
-- SYD OMEGA 91717 -- POPULATE public.notifications ON MEMBER-STATUS EVENTS
-- DEPENDS ON public.notifications (0091) already existing.
-- ============================================================================
BEGIN;

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
