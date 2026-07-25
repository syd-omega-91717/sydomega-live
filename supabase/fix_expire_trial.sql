-- ══════════════════════════════════════════════════════════════════════════
--  PASTE ONLY STATEMENT 1 INTO THE SQL EDITOR. CLICK RUN. WAIT FOR SUCCESS.
-- ══════════════════════════════════════════════════════════════════════════
DROP FUNCTION IF EXISTS public.expire_trial(uuid) CASCADE;


-- ══════════════════════════════════════════════════════════════════════════
--  THEN PASTE ONLY STATEMENT 2. CLICK RUN.
-- ══════════════════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.expire_trial(p_uid uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $expire_trial$
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
    axis_a=1, axis_b=1, axis_c=1, authority=0,
    nodes_earned=0, nodes_cleared=0, certificates_earned=0, trophies_earned=0, medals_earned=0,
    access_approved=false, is_trial=false, trial_expires_at=NULL
  WHERE id=p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'reset',true);
END;
$expire_trial$;
GRANT EXECUTE ON FUNCTION public.expire_trial(uuid) TO authenticated, anon;
