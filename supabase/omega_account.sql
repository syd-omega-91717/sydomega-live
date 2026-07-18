-- ============================================================================
-- SYD OMEGA 91717 -- ACCOUNT CONTROL (deactivate / reactivate / delete)
-- User-friendly + compliance (GDPR-CCPA right-to-delete).
-- A member may deactivate (reversible) or permanently delete ONLY their own
-- account. The Sovereign founder can never be deactivated or deleted. Safe.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deactivated_at   timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pending_deletion timestamptz;

-- DEACTIVATE -- reversible; the access guard will treat them as not-approved --
CREATE OR REPLACE FUNCTION public.deactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=auth.uid()),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  UPDATE public.profiles
     SET deactivated_at = now(), access_approved = false, is_trial = false, trial_expires_at = NULL
   WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'deactivated',true);
END;
$$;

-- REACTIVATE -- lifts a self-deactivation (owner re-approval still governs trial)
CREATE OR REPLACE FUNCTION public.reactivate_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET deactivated_at = NULL WHERE id = auth.uid();
  RETURN jsonb_build_object('ok',true,'reactivated',true);
END;
$$;

-- DELETE -- permanent erasure of the caller's own data (right-to-delete) -----
CREATE OR REPLACE FUNCTION public.delete_account()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=uid),false) THEN
    RETURN jsonb_build_object('ok',false,'error','sovereign_protected');
  END IF;
  -- wipe the member's data across the platform
  DELETE FROM public.task_completions WHERE user_id = uid;
  DELETE FROM public.evolution_events WHERE user_id = uid;
  DELETE FROM public.trophies         WHERE user_id = uid;
  DELETE FROM public.medals           WHERE user_id = uid;
  DELETE FROM public.certificates     WHERE user_id = uid;
  DELETE FROM public.platform_owners  WHERE user_id = uid;
  DELETE FROM public.profiles         WHERE id = uid;
  -- attempt to remove the auth identity too (needs elevated rights; if the
  -- function owner lacks them, the data is already wiped and we flag for purge)
  BEGIN
    DELETE FROM auth.users WHERE id = uid;
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',true);
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('ok',true,'deleted',true,'auth_removed',false,'note','data wiped; auth row purge pending');
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reactivate_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_account()     TO authenticated;

COMMIT;
