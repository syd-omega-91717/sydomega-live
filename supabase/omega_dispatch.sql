-- ============================================================================
-- SYD OMEGA 91717 -- DISPATCHES (one broadcast channel, no duplication)
-- notifications.html already reads a 'dispatches' table (title, body, created_at).
-- This is the SINGLE broadcast table -- it powers BOTH the Notifications page
-- AND the News page. Supersedes the separate 'news' table (use this instead of
-- OMEGA_NEWS.sql). The Sovereign owner posts; every verified member receives.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.dispatches (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text,
  category     text DEFAULT 'DISPATCH',   -- DISPATCH | INTELLIGENCE | ANNOUNCEMENT | UPDATE
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
-- self-heal: if an older dispatches table exists, add any missing columns
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS category text DEFAULT 'DISPATCH';
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.dispatches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dispatch_read ON public.dispatches;
CREATE POLICY dispatch_read ON public.dispatches FOR SELECT
  USING (is_published = true OR public.is_platform_owner());

-- owner broadcasts a dispatch (reaches every member's notifications + news) ---
CREATE OR REPLACE FUNCTION public.post_dispatch(p_title text, p_body text DEFAULT NULL, p_category text DEFAULT 'DISPATCH')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_title IS NULL OR length(trim(p_title))=0 THEN RETURN jsonb_build_object('ok',false,'error','empty_title'); END IF;
  INSERT INTO public.dispatches(title,body,category)
    VALUES (left(p_title,200), left(coalesce(p_body,''),8000), left(coalesce(p_category,'DISPATCH'),40))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- read the published stream (used by news.html) -----------------------------
CREATE OR REPLACE FUNCTION public.published_dispatches(p_limit int DEFAULT 30)
RETURNS SETOF public.dispatches LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.dispatches WHERE is_published = true ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

-- owner unpublish/republish --------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_dispatch_published(p_id uuid, p_pub boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  UPDATE public.dispatches SET is_published = COALESCE(p_pub,true) WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'published',COALESCE(p_pub,true));
END;
$$;

GRANT SELECT ON public.dispatches TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_dispatch(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.published_dispatches(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_dispatch_published(uuid,boolean) TO authenticated;

-- if a legacy dispatches table has a NOT-NULL user_id, relax it (broadcasts are Order-wide, not per-user)
DO $seed$
BEGIN
  BEGIN
    ALTER TABLE public.dispatches ALTER COLUMN user_id DROP NOT NULL;
  EXCEPTION WHEN undefined_column THEN NULL;  -- no user_id column: fine
  END;
END $seed$;

-- seed one welcome dispatch so the feed is never empty
INSERT INTO public.dispatches(title,body,category)
SELECT 'The Frequency is Live', 'SYD OMEGA 91717 dispatch channel is active. The Code. The Frequency. The Legacy.', 'ANNOUNCEMENT'
WHERE NOT EXISTS (SELECT 1 FROM public.dispatches);

COMMIT;
