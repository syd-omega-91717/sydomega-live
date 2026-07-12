-- SYD OMEGA 91717 -- Academy progress tracking (idempotent; RLS added)
-- Not currently wired into academy.html -- table exists but nothing reads/writes it
-- yet. Fixed for correctness (schema prefix, IF NOT EXISTS, FK, RLS) so it's safe
-- to run and ready whenever academy.html's progress tracking is built.
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, node_id)
);

ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS academy_progress_own ON public.academy_progress;
CREATE POLICY academy_progress_own ON public.academy_progress FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.academy_progress TO authenticated;
