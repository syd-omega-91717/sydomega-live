/* Claude Council — Multi-agent deliberation engine for production-readiness decisions
   Stores structured deliberations with role-specific analyses, synthesis, and verdicts
   for independent multi-perspective assessment of high-stakes decisions. */

CREATE TABLE IF NOT EXISTS public.council_deliberations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  context text,
  depth text DEFAULT 'standard' CHECK (depth IN ('quick', 'standard', 'deep')),
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'complete')),
  roles_snapshot jsonb,
  synthesis jsonb,
  final_verdict text,
  created_at timestamp DEFAULT now(),
  completed_at timestamp
);

ALTER TABLE public.council_deliberations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_reads_owns_deliberations" ON public.council_deliberations
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "member_creates_deliberations" ON public.council_deliberations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "member_updates_owns_deliberations" ON public.council_deliberations
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_council_deliberations_user_id
  ON public.council_deliberations(user_id);

CREATE INDEX IF NOT EXISTS idx_council_deliberations_created_at
  ON public.council_deliberations(created_at DESC);
