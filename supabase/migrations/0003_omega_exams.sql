-- ============================================================================
-- SYD OMEGA 91717 -- EXAM RESULTS (real backend for exam.html)
-- exam.html previously told members "certificate queued for issuance" and
-- "Matrix coordinates updated" on passing an exam -- neither actually happened,
-- nothing was ever saved anywhere, not even locally. This is the real backend:
-- records every attempt, and on a pass: awards a real certificate, advances
-- the member's real Knowledge axis (via the existing advance_matrix/profiles
-- update), and logs a real evolution event. Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.exam_results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_id     text NOT NULL,          -- matches EXAMS[].id in exam.html: matrix|cosmology|sovereignty|intelligence|economy|heritage
  score       int NOT NULL,
  total       int NOT NULL,
  pct         numeric NOT NULL,
  passed      boolean NOT NULL,
  cert_name   text,
  taken_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.exam_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS exam_results_own ON public.exam_results;
CREATE POLICY exam_results_own ON public.exam_results FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.is_platform_owner()) WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT ON public.exam_results TO authenticated;

-- submit an exam result: records the attempt, and on a pass, issues a real
-- certificate + advances the real Knowledge axis + logs a real evolution event.
-- One certificate per exam per member (re-passing doesn't duplicate the cert).
CREATE OR REPLACE FUNCTION public.submit_exam_result(
  p_exam_id text, p_score int, p_total int, p_cert_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid uuid := auth.uid();
  v_pct numeric;
  v_pass boolean;
  v_already boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_total IS NULL OR p_total <= 0 THEN RETURN jsonb_build_object('ok',false,'error','bad_total'); END IF;

  v_pct := round((p_score::numeric / p_total::numeric) * 100, 1);
  v_pass := v_pct >= 72;

  INSERT INTO public.exam_results(user_id, exam_id, score, total, pct, passed, cert_name)
    VALUES (uid, p_exam_id, p_score, p_total, v_pct, v_pass, p_cert_name);

  IF NOT v_pass THEN
    RETURN jsonb_build_object('ok',true,'passed',false,'pct',v_pct);
  END IF;

  -- already holds this certificate? don't duplicate, but still record the re-take above
  SELECT EXISTS(SELECT 1 FROM public.certificates WHERE user_id = uid AND title = p_cert_name) INTO v_already;
  IF NOT v_already AND p_cert_name IS NOT NULL THEN
    INSERT INTO public.certificates(user_id, title, milestone) VALUES (uid, p_cert_name, p_exam_id);
  END IF;

  -- advance the real Knowledge axis (axis_a), capped at 9, only on first pass
  IF NOT v_already THEN
    UPDATE public.profiles SET axis_a = LEAST(9, COALESCE(axis_a,1) + 0.5) WHERE id = uid;
    INSERT INTO public.evolution_events(user_id, axis, note)
      VALUES (uid, 'A', 'Examination passed -- ' || COALESCE(p_cert_name, p_exam_id) || ' certificate earned (' || v_pct || '%)');
  END IF;

  RETURN jsonb_build_object('ok',true,'passed',true,'pct',v_pct,'cert_awarded', NOT v_already, 'cert_name', p_cert_name);
END;
$$;
GRANT EXECUTE ON FUNCTION public.submit_exam_result(text,int,int,text) TO authenticated;

-- read my own exam history (for a future "past attempts" view)
CREATE OR REPLACE FUNCTION public.my_exam_results()
RETURNS SETOF public.exam_results LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.exam_results WHERE user_id = auth.uid() ORDER BY taken_at DESC;
$$;
GRANT EXECUTE ON FUNCTION public.my_exam_results() TO authenticated;

COMMIT;
