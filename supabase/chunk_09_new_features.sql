/* ==========================================================================
   CHUNK 09 — NEW FEATURE TABLES
   · oaths              — sovereign oath registry (cryptographic sealing)
   · codex_bookmarks    — user-saved knowledge articles
   · signal_saves       — user-saved signal/news items
   · user_dedication    — daily dedication tracker (if not already present)
   ========================================================================== */

/* ── OATHS ── */
CREATE TABLE IF NOT EXISTS public.oaths (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       text NOT NULL DEFAULT 'SOVEREIGNTY'
                   CHECK (category IN ('SOVEREIGNTY','DISCIPLINE','EXCELLENCE','LOYALTY','HONOR','VISION')),
  oath_text      text NOT NULL CHECK (char_length(oath_text) BETWEEN 10 AND 1000),
  hash_sha256    text NOT NULL,
  sworn_at       timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate hashes (each oath must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS oaths_hash_unique ON public.oaths(hash_sha256);

-- Fast lookups by user
CREATE INDEX IF NOT EXISTS oaths_user_id_idx ON public.oaths(user_id);
CREATE INDEX IF NOT EXISTS oaths_sworn_at_idx ON public.oaths(sworn_at DESC);

ALTER TABLE public.oaths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Members can read all oaths (transparent ledger)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='oaths' AND policyname='oaths_read') THEN
    CREATE POLICY oaths_read ON public.oaths FOR SELECT USING (true);
  END IF;
  -- Members can only insert their own oaths
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='oaths' AND policyname='oaths_insert') THEN
    CREATE POLICY oaths_insert ON public.oaths FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  -- No updates or deletes — oaths are immutable
END $$;


/* ── CODEX BOOKMARKS ── */
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
    CREATE POLICY codex_bm_own ON public.codex_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── SIGNAL SAVES ── */
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
    CREATE POLICY signal_saves_own ON public.signal_saves FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── USER DEDICATION (idempotent — may already exist from dedication_table.sql) ── */
CREATE TABLE IF NOT EXISTS public.user_dedication (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date NOT NULL DEFAULT CURRENT_DATE,
  seconds_today    integer NOT NULL DEFAULT 0 CHECK (seconds_today >= 0),
  target_seconds   integer NOT NULL DEFAULT 33437,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS user_dedication_user_date ON public.user_dedication(user_id, date DESC);

ALTER TABLE public.user_dedication ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_dedication' AND policyname='dedication_own') THEN
    CREATE POLICY dedication_own ON public.user_dedication FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  -- Owner can view all members' dedication
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_dedication' AND policyname='dedication_owner_read') THEN
    CREATE POLICY dedication_owner_read ON public.user_dedication FOR SELECT USING (public.is_platform_owner());
  END IF;
END $$;


/* ── GRANT PERMISSIONS ── */
GRANT SELECT, INSERT ON public.oaths TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.codex_bookmarks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signal_saves TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_dedication TO authenticated;
