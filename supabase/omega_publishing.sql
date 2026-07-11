-- ============================================================================
-- SYD OMEGA 91717 -- PUBLISHING ARCHIVE (M6 / publishing.html backend)
-- Members commit works to their PRIVATE archive. Works are private by default
-- and are NEVER public without the Order's approval. The member sees only their
-- own; the Sovereign owner reviews and approves. Matches publishing.html exactly
-- (table 'publications': user_id, kind, title, body, file_path, status).
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.publications (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL DEFAULT auth.uid(),
  kind       text,
  title      text NOT NULL,
  body       text,
  file_path  text,
  status     text NOT NULL DEFAULT 'private',  -- private | pending | approved | rejected
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;

-- member inserts their own work ---------------------------------------------
DROP POLICY IF EXISTS pub_insert ON public.publications;
CREATE POLICY pub_insert ON public.publications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- member reads their own; owner reads all (works never leak to other members)-
DROP POLICY IF EXISTS pub_select ON public.publications;
CREATE POLICY pub_select ON public.publications FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- member may edit/withdraw their own while still private ---------------------
DROP POLICY IF EXISTS pub_update ON public.publications;
CREATE POLICY pub_update ON public.publications FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('private','rejected'))
  WITH CHECK (auth.uid() = user_id);

-- owner approves / rejects (onlySovereign) ----------------------------------
CREATE OR REPLACE FUNCTION public.set_publication_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('private','pending','approved','rejected') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.publications SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

-- owner reviews the full submission queue -----------------------------------
CREATE OR REPLACE FUNCTION public.review_publications()
RETURNS SETOF public.publications LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.publications
  WHERE public.is_platform_owner()
  ORDER BY (status='pending') DESC, created_at DESC;
$$;

GRANT SELECT, INSERT, UPDATE ON public.publications TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_publication_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_publications() TO authenticated;

COMMIT;
