-- Adopt two tables that existed live but only in the flat supabase/*.sql bag.
--
-- WHY. supabase/migrations/ is the deployment sequence (CLAUDE.md section 5);
-- the flat bag has no ledger and is applied by hand, so schema declared only
-- there never deploys. `advertisements` (chunk_06_migrations.sql) and
-- `council_deliberations` (omega_council_schema.sql) were in exactly that
-- state: both are live, both were created by hand, and `supabase db push`
-- against a fresh database would not create either. That also made
-- 20260819071913's unguarded `ALTER POLICY ... ON public.council_deliberations`
-- unrunnable on a fresh apply.
--
-- WHAT. Every statement below is transcribed from the live database on
-- 2026-09-05 (information_schema.columns, pg_constraint, pg_indexes, pg_policy
-- and information_schema.role_table_grants) and is guarded, so against
-- production this migration is an exact no-op and against a fresh database it
-- reproduces what production has. Grants are recorded as they are live and are
-- deliberately NOT widened here: `advertisements` carries owner-only UPDATE and
-- DELETE policies with no matching table-level GRANT, which is section 8.1
-- class 6. No client code writes those verbs today (advertising.html only
-- selects and inserts), so the gap is recorded in GAP_ANALYSIS.md rather than
-- closed by an authorization change nothing needs.

-- ---------------------------------------------------------------- advertisements
CREATE TABLE IF NOT EXISTS public.advertisements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  contact_email text NOT NULL,
  title text NOT NULL,
  description text,
  url text,
  category text,
  rate_tier text DEFAULT 'weekly',
  status text DEFAULT 'pending',
  submitted_by uuid REFERENCES public.profiles(id),
  approved_by uuid REFERENCES public.profiles(id),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertisements_submitted_by ON public.advertisements USING btree (submitted_by);
CREATE INDEX IF NOT EXISTS idx_advertisements_approved_by ON public.advertisements USING btree (approved_by);

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advertisements_select ON public.advertisements;
CREATE POLICY advertisements_select ON public.advertisements
  FOR SELECT USING (
    private.is_platform_owner()
    OR status = 'approved'
    OR submitted_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS advertisements_insert ON public.advertisements;
CREATE POLICY advertisements_insert ON public.advertisements
  FOR INSERT WITH CHECK (
    private.is_platform_owner()
    OR submitted_by = (SELECT auth.uid())
  );

DROP POLICY IF EXISTS advertisements_owner_update ON public.advertisements;
CREATE POLICY advertisements_owner_update ON public.advertisements
  FOR UPDATE USING (private.is_platform_owner())
  WITH CHECK (private.is_platform_owner());

DROP POLICY IF EXISTS advertisements_owner_delete ON public.advertisements;
CREATE POLICY advertisements_owner_delete ON public.advertisements
  FOR DELETE USING (private.is_platform_owner());

GRANT SELECT ON public.advertisements TO anon;
GRANT SELECT, INSERT ON public.advertisements TO authenticated;

-- --------------------------------------------------------- council_deliberations
CREATE TABLE IF NOT EXISTS public.council_deliberations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE INDEX IF NOT EXISTS idx_council_deliberations_user_id ON public.council_deliberations USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_council_deliberations_created_at ON public.council_deliberations USING btree (created_at DESC);

ALTER TABLE public.council_deliberations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS member_reads_owns_deliberations ON public.council_deliberations;
CREATE POLICY member_reads_owns_deliberations ON public.council_deliberations
  FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS member_creates_deliberations ON public.council_deliberations;
CREATE POLICY member_creates_deliberations ON public.council_deliberations
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS member_updates_owns_deliberations ON public.council_deliberations;
CREATE POLICY member_updates_owns_deliberations ON public.council_deliberations
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.council_deliberations TO authenticated;
