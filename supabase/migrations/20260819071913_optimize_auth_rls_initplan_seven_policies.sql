-- RLS Performance Optimization: Wrap auth.uid() calls as (select auth.uid())
-- Fixes 7 remaining auth_rls_initplan findings from performance advisor
-- Impact: Each auth.uid() evaluation now happens once per query instead of once per row
-- No access-control changes; pure performance improvement

-- Optimize council_deliberations policies (3 policies)
-- Guarded (owner-approved edit, 2026-10-04): on a fresh `supabase db reset`
-- this table does not exist yet -- it reaches migrations/ only in
-- 20260905211725, which creates these same three policies in this same
-- (SELECT auth.uid()) form. Live had the table from the flat bag and already
-- applied this version, so the guard changes nothing there.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
             AND tablename = 'council_deliberations'
             AND policyname = 'member_reads_owns_deliberations') THEN
    ALTER POLICY member_reads_owns_deliberations ON public.council_deliberations
      USING (user_id = (SELECT auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
             AND tablename = 'council_deliberations'
             AND policyname = 'member_creates_deliberations') THEN
    ALTER POLICY member_creates_deliberations ON public.council_deliberations
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
             AND tablename = 'council_deliberations'
             AND policyname = 'member_updates_owns_deliberations') THEN
    ALTER POLICY member_updates_owns_deliberations ON public.council_deliberations
      USING (user_id = (SELECT auth.uid()))
      WITH CHECK (user_id = (SELECT auth.uid()));
  END IF;
END $$;

-- Optimize graph_entities policy
ALTER POLICY members_see_own_entities ON public.graph_entities
  USING (is_platform_owner() OR (user_id = (SELECT auth.uid())));

-- Optimize graph_events policy
ALTER POLICY members_see_own_events ON public.graph_events
  USING (is_platform_owner() OR (user_id = (SELECT auth.uid())));

-- Optimize graph_evidence policy
ALTER POLICY members_see_own_evidence ON public.graph_evidence
  USING (is_platform_owner() OR (user_id = (SELECT auth.uid())));

-- Optimize graph_relationships policy
ALTER POLICY members_see_own_relationships ON public.graph_relationships
  USING (is_platform_owner() OR (user_id = (SELECT auth.uid())));
