-- ============================================================================
-- SURGICAL FIX: expire_trial return type conflict
-- Run each statement SEPARATELY in the Supabase SQL editor.
-- Copy statement 1, run it, then copy statement 2, run it.
-- ============================================================================

-- STATEMENT 1: paste and run this alone
DROP FUNCTION IF EXISTS public.expire_trial(uuid) CASCADE;

-- ============================================================================

-- STATEMENT 2: paste and run this after statement 1 succeeds
CREATE OR REPLACE FUNCTION public.expire_trial(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $body$
BEGIN
  IF auth.uid() <> p_uid AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id=p_uid),false) THEN
    RETURN jsonb_build_object('ok',true,'owner',true);   -- never reset the Sovereign
  END IF;
  DELETE FROM public.task_completions WHERE user_id=p_uid;
  DELETE FROM public.evolution_events WHERE user_id=p_uid;
  DELETE FROM public.trophies         WHERE user_id=p_uid;
  DELETE FROM public.medals           WHERE user_id=p_uid;
  DELETE FROM public.certificates     WHERE user_id=p_uid;
  UPDATE public.profiles SET
    axis_a=1, axis_b=1, axis_c=1, axis_a=0.001, axis_b=0.001, axis_c=0.001,
    nodes_earned=0, nodes_cleared=0, certificates_earned=0, trophies_earned=0, medals_earned=0,
    access_approved=false, is_trial=false, trial_expires_at=NULL
  WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'reset',true);
END;
$body$;
GRANT EXECUTE ON FUNCTION public.expire_trial(uuid) TO authenticated, anon;
