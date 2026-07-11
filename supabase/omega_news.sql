-- ============================================================================
-- SYD OMEGA 91717 -- NEWS INTELLIGENCE (M10) -- sovereign, owner-published
-- A real feed you control: the Sovereign owner posts intelligence/announcements;
-- verified members read the published stream. No external API keys, no CORS,
-- nothing that can break a build -- fully in your sovereignty. Safe RLS.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.news (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  body         text,
  category     text DEFAULT 'INTELLIGENCE',   -- INTELLIGENCE | ANNOUNCEMENT | UPDATE | MEDIA
  is_published boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- published news readable by any signed-in member; owner sees all -------------
DROP POLICY IF EXISTS news_read ON public.news;
CREATE POLICY news_read ON public.news FOR SELECT
  USING (is_published = true OR public.is_platform_owner());

-- owner posts news -----------------------------------------------------------
CREATE OR REPLACE FUNCTION public.post_news(p_title text, p_body text DEFAULT NULL, p_category text DEFAULT 'INTELLIGENCE')
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE new_id uuid;
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_title IS NULL OR length(trim(p_title))=0 THEN RETURN jsonb_build_object('ok',false,'error','empty_title'); END IF;
  INSERT INTO public.news(title,body,category)
    VALUES (left(p_title,200), left(coalesce(p_body,''),8000), left(coalesce(p_category,'INTELLIGENCE'),40))
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END;
$$;

-- read the published feed (newest first) ------------------------------------
CREATE OR REPLACE FUNCTION public.published_news(p_limit int DEFAULT 30)
RETURNS SETOF public.news LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.news WHERE is_published = true ORDER BY created_at DESC LIMIT LEAST(GREATEST(p_limit,1),100);
$$;

-- owner unpublishes / republishes -------------------------------------------
CREATE OR REPLACE FUNCTION public.set_news_published(p_id uuid, p_pub boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  UPDATE public.news SET is_published = COALESCE(p_pub,true) WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'published',COALESCE(p_pub,true));
END;
$$;

GRANT SELECT ON public.news TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_news(text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.published_news(int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_news_published(uuid,boolean) TO authenticated;

-- seed one welcome item so the feed is never empty on first load
INSERT INTO public.news(title,body,category)
SELECT 'The Frequency is Live', 'SYD OMEGA 91717 intelligence stream is active. The Code. The Frequency. The Legacy.', 'ANNOUNCEMENT'
WHERE NOT EXISTS (SELECT 1 FROM public.news);

COMMIT;
