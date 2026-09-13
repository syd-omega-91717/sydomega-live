-- Harden Phase 5 autonomous-agent RLS.
-- Trusted agent/server writes use the Supabase service role, which bypasses RLS.
-- Member-originated interaction inserts remain available only for the authenticated member owning the row.

DROP POLICY IF EXISTS "agent_experiments_write" ON public.agent_experiments;
DROP POLICY IF EXISTS "agent_performance_metrics_write" ON public.agent_performance_metrics;
DROP POLICY IF EXISTS "autonomous_decisions_agent_write" ON public.autonomous_decisions;
DROP POLICY IF EXISTS "autonomous_insights_agent_write" ON public.autonomous_insights;
DROP POLICY IF EXISTS "member_agent_interactions_agent_write" ON public.member_agent_interactions;
DROP POLICY IF EXISTS "member_feature_flags_write" ON public.member_feature_flags;

REVOKE INSERT ON TABLE public.agent_experiments FROM anon, authenticated;
REVOKE INSERT ON TABLE public.agent_performance_metrics FROM anon, authenticated;
REVOKE INSERT ON TABLE public.autonomous_decisions FROM anon, authenticated;
REVOKE INSERT ON TABLE public.autonomous_insights FROM anon, authenticated;
REVOKE INSERT ON TABLE public.member_feature_flags FROM anon, authenticated;

GRANT INSERT ON TABLE public.member_agent_interactions TO authenticated;
CREATE POLICY "member_agent_interactions_member_insert"
  ON public.member_agent_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = member_id);

REVOKE INSERT ON TABLE public.member_agent_interactions FROM anon;
