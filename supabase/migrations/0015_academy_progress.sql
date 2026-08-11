-- SYD OMEGA 91717 -- Academy progress tracking (idempotent; RLS added; self-healing)
-- Not currently wired into academy.html -- table exists but nothing reads/writes it
-- yet. Fixed for correctness (schema prefix, IF NOT EXISTS, FK, RLS) so it's safe
-- to run and ready whenever academy.html's progress tracking is built.
-- Self-healing: if public.academy_progress already exists from an earlier/partial
-- run, ADD COLUMN IF NOT EXISTS brings it up to spec before RLS references these
-- columns -- CREATE TABLE IF NOT EXISTS alone would silently no-op on an existing
-- table and leave it without user_id, which is what caused 42703 here.
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid()
);
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS node_id TEXT;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0;
ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
-- if user_id or node_id were left NULL-able from an older run, that's fine for
-- now -- not forcing NOT NULL retroactively in case existing rows would violate it.
DO $uniq$
BEGIN
  ALTER TABLE public.academy_progress ADD CONSTRAINT academy_progress_user_node_unique UNIQUE (user_id, node_id);
EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $uniq$;

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS academy_progress_own ON public.academy_progress;
CREATE POLICY academy_progress_own ON public.academy_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.academy_progress TO authenticated;
