-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: applied to production with no file in this
-- directory. Exact recorded statement, not a reconstruction.

-- oath.html has been live with no `oaths` table behind it. The page inserts and
-- selects from public.oaths; the table is declared in
-- supabase/chunk_09_new_features.sql but that file was never applied -- 3 of its
-- 4 tables are absent live. oath.html degrades correctly (it checks res.error
-- and falls back to localStorage) so nothing crashed, but every oath a member
-- has sworn exists only in that member's browser and has never reached the
-- server.
--
-- Applied verbatim from the bag's declaration. Reviewed before applying:
--   * oaths_insert is WITH CHECK (auth.uid() = user_id) -- correctly scoped,
--     not the WITH CHECK(true) spoofing shape called out in CLAUDE.md 8.1(6b).
--   * oaths_read is USING (true) -- deliberate, the file comments it as a
--     "transparent ledger" and loadOaths() selects all members' oaths, so this
--     matches the feature as built rather than widening it.
--   * No UPDATE/DELETE policies: oaths are immutable by design.
--   * GRANT is present and matches the policies, so this does not repeat the
--     policy-without-grant class (CLAUDE.md 8.1(6c)) that broke 22 features.
--   * The client's six category values (SOVEREIGNTY, DISCIPLINE, EXCELLENCE,
--     LOYALTY, HONOR, VISION) exactly match the CHECK constraint -- verified
--     against oath.html's data-cat attributes before applying, since a mismatch
--     would make every insert fail on a check violation.
--
-- codex_bookmarks and signal_saves are also missing live and are deliberately
-- NOT created here: codex.html uses localStorage only and never calls
-- .from('codex_bookmarks'), and signal_saves has zero references anywhere in
-- the repo. Creating them would be building unwired features, not fixing a bug.

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

CREATE UNIQUE INDEX IF NOT EXISTS oaths_hash_unique  ON public.oaths(hash_sha256);
CREATE INDEX        IF NOT EXISTS oaths_user_id_idx  ON public.oaths(user_id);
CREATE INDEX        IF NOT EXISTS oaths_sworn_at_idx ON public.oaths(sworn_at DESC);

ALTER TABLE public.oaths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='oaths' AND policyname='oaths_read') THEN
    CREATE POLICY oaths_read ON public.oaths FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='oaths' AND policyname='oaths_insert') THEN
    CREATE POLICY oaths_insert ON public.oaths FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT ON public.oaths TO authenticated;
