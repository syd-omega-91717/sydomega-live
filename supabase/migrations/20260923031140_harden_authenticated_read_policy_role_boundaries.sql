-- Ω SYD OMEGA 91717 — authenticated read policy role boundaries
BEGIN;

DROP POLICY IF EXISTS aa_read ON public.academy_access;
CREATE POLICY aa_read ON public.academy_access FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id OR private.is_platform_owner());

DROP POLICY IF EXISTS academy_exam_results_own_select ON public.academy_exam_results;
CREATE POLICY academy_exam_results_own_select ON public.academy_exam_results FOR SELECT TO authenticated USING ((SELECT auth.uid()) = profile_id OR private.is_platform_owner());

DROP POLICY IF EXISTS access_grant_audit_owner_read ON public.access_grant_audit;
CREATE POLICY access_grant_audit_owner_read ON public.access_grant_audit FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS agent_experiments_read ON public.agent_experiments;
CREATE POLICY agent_experiments_read ON public.agent_experiments FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS autonomous_decisions_member_read ON public.autonomous_decisions;
CREATE POLICY autonomous_decisions_member_read ON public.autonomous_decisions FOR SELECT TO authenticated USING (member_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS "owner reads kpi log" ON public.capability_kpi_log;
CREATE POLICY "owner reads kpi log" ON public.capability_kpi_log FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS "member sees own recs" ON public.content_recommendations;
CREATE POLICY "member sees own recs" ON public.content_recommendations FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS member_reads_owns_deliberations ON public.council_deliberations;
CREATE POLICY member_reads_owns_deliberations ON public.council_deliberations FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS daily_engagement_self_read ON public.daily_engagement;
CREATE POLICY daily_engagement_self_read ON public.daily_engagement FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id OR private.omega_is_owner());

DROP POLICY IF EXISTS data_domains_select ON public.data_domains;
CREATE POLICY data_domains_select ON public.data_domains FOR SELECT TO authenticated USING (private.is_platform_owner() OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS data_entities_select ON public.data_entities;
CREATE POLICY data_entities_select ON public.data_entities FOR SELECT TO authenticated USING (private.is_platform_owner() OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "member sees own exports" ON public.data_export_requests;
CREATE POLICY "member sees own exports" ON public.data_export_requests FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS dispatches_select ON public.dispatches;
CREATE POLICY dispatches_select ON public.dispatches FOR SELECT TO authenticated USING (is_published = true OR private.is_platform_owner() OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS owner_sees_all_audit ON public.enterprise_audit;
CREATE POLICY owner_sees_all_audit ON public.enterprise_audit FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS expert_bookings_select_merged ON public.expert_bookings;
CREATE POLICY expert_bookings_select_merged ON public.expert_bookings FOR SELECT TO authenticated USING (client_id = (SELECT auth.uid()) OR expert_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS feedback_select ON public.feedback;
CREATE POLICY feedback_select ON public.feedback FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id OR private.is_platform_owner());

DROP POLICY IF EXISTS knowledge_edges_select ON public.knowledge_edges;
CREATE POLICY knowledge_edges_select ON public.knowledge_edges FOR SELECT TO authenticated USING (private.is_platform_owner() OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS knowledge_nodes_select ON public.knowledge_nodes;
CREATE POLICY knowledge_nodes_select ON public.knowledge_nodes FOR SELECT TO authenticated USING (private.is_platform_owner() OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS member_agent_interactions_member_read ON public.member_agent_interactions;
CREATE POLICY member_agent_interactions_member_read ON public.member_agent_interactions FOR SELECT TO authenticated USING (member_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS member_feature_flags_read ON public.member_feature_flags;
CREATE POLICY member_feature_flags_read ON public.member_feature_flags FOR SELECT TO authenticated USING (member_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS "owner reads all events" ON public.platform_events;
CREATE POLICY "owner reads all events" ON public.platform_events FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS platform_metrics_select ON public.platform_metrics;
CREATE POLICY platform_metrics_select ON public.platform_metrics FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS "owner reads all evals" ON public.policy_eval_log;
CREATE POLICY "owner reads all evals" ON public.policy_eval_log FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS policy_rules_select ON public.policy_rules;
CREATE POLICY policy_rules_select ON public.policy_rules FOR SELECT TO authenticated USING (private.is_platform_owner() OR (SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS sovereign_events_select_merged ON public.sovereign_events;
CREATE POLICY sovereign_events_select_merged ON public.sovereign_events FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS user_dedication_select_merged ON public.user_dedication;
CREATE POLICY user_dedication_select_merged ON public.user_dedication FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR private.is_platform_owner());

DROP POLICY IF EXISTS workflow_executions_select_merged ON public.workflow_executions;
CREATE POLICY workflow_executions_select_merged ON public.workflow_executions FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()) OR private.is_platform_owner());

COMMIT;
