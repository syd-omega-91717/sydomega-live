-- Recovered production migration recorded remotely as 20260915201055.
-- Preserve the exact final policy optimization so local history matches production.
ALTER POLICY "autonomous_decisions_member_read" ON public.autonomous_decisions
  USING ((member_id = (SELECT auth.uid())));
ALTER POLICY "member_agent_interactions_member_read" ON public.member_agent_interactions
  USING ((member_id = (SELECT auth.uid())) OR public.is_platform_owner());
ALTER POLICY "member_feature_flags_read" ON public.member_feature_flags
  USING ((member_id = (SELECT auth.uid())) OR public.is_platform_owner());
