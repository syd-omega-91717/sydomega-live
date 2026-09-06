/* Applied live 2026-09-05 via apply_migration as version 20260905012909.
   Source: supabase/chunk_09_new_features.sql — only the two tables production
   lacked. oaths and user_dedication from the same file were already live and
   were deliberately not re-applied. */

CREATE TABLE IF NOT EXISTS public.codex_bookmarks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source     text NOT NULL CHECK (source IN ('wikipedia','arxiv','openlibrary')),
  title      text NOT NULL,
  url        text NOT NULL,
  excerpt    text,
  authors    text,
  published  text,
  saved_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS codex_bookmarks_user_url ON public.codex_bookmarks(user_id, url);
CREATE INDEX IF NOT EXISTS codex_bookmarks_user_idx ON public.codex_bookmarks(user_id);
ALTER TABLE public.codex_bookmarks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='codex_bookmarks' AND policyname='codex_bm_own') THEN
    CREATE POLICY codex_bm_own ON public.codex_bookmarks FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.signal_saves (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source     text NOT NULL CHECK (source IN ('hn','github','devto')),
  title      text NOT NULL,
  url        text NOT NULL,
  points     integer,
  saved_at   timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS signal_saves_user_url ON public.signal_saves(user_id, url);
CREATE INDEX IF NOT EXISTS signal_saves_user_idx ON public.signal_saves(user_id);
ALTER TABLE public.signal_saves ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='signal_saves' AND policyname='signal_saves_own') THEN
    CREATE POLICY signal_saves_own ON public.signal_saves FOR ALL USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.codex_bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_saves    TO authenticated;
