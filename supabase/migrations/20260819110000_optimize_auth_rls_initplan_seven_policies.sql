-- RLS Performance Optimization: Wrap auth.uid() calls as (select auth.uid())
-- Fixes 7 remaining auth_rls_initplan findings from performance advisor
-- Impact: Each auth.uid() evaluation now happens once per query instead of once per row
-- No access-control changes; pure performance improvement

-- Optimize council_deliberations policies (3 policies)
ALTER POLICY member_reads_owns_deliberations ON public.council_deliberations
  USING (user_id = (SELECT auth.uid()));

ALTER POLICY member_creates_deliberations ON public.council_deliberations
  WITH CHECK (user_id = (SELECT auth.uid()));

ALTER POLICY member_updates_owns_deliberations ON public.council_deliberations
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

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
