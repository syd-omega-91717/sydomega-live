-- ============================================================================
-- SYD OMEGA 91717 -- FEEDBACK & COMMENTS
-- Verified members can submit feedback/comments (with an optional 1-5 rating)
-- from any page. Members see their own; the Sovereign owner sees all. Safe RLS.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.feedback (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid(),
  page       text,
  rating     int CHECK (rating BETWEEN 1 AND 5),
  message    text NOT NULL,
  status     text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feedback_insert ON public.feedback;
CREATE POLICY feedback_insert ON public.feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS feedback_select ON public.feedback;
CREATE POLICY feedback_select ON public.feedback
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_owner());

-- submit feedback (owner-safe, length-capped) -------------------------------
CREATE OR REPLACE FUNCTION public.submit_feedback(
  p_message text, p_rating int DEFAULT NULL, p_page text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_message IS NULL OR length(trim(p_message)) = 0 THEN
    RETURN jsonb_build_object('ok',false,'error','empty'); END IF;
  INSERT INTO public.feedback(user_id, message, rating, page)
    VALUES (auth.uid(), left(p_message, 4000), p_rating, left(coalesce(p_page,''),120))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- my feedback (member sees their own history) -------------------------------
CREATE OR REPLACE FUNCTION public.my_feedback()
RETURNS SETOF public.feedback LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.feedback WHERE user_id = auth.uid() ORDER BY created_at DESC;
$$;

GRANT EXECUTE ON FUNCTION public.submit_feedback(text,int,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_feedback() TO authenticated;
GRANT SELECT, INSERT ON public.feedback TO authenticated;

COMMIT;
