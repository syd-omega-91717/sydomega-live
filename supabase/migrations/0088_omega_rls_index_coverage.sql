-- ============================================================================
-- SYD OMEGA 91717 -- RLS INDEX COVERAGE
-- 2026 Supabase RLS guidance is consistent: a missing index on a column
-- referenced inside a USING/WITH CHECK clause is the top RLS performance
-- killer -- every row-scoped query becomes a full table scan under RLS
-- instead of an index lookup. Systematic scan across every migration file
-- for tables with a `user_id = auth.uid()`-style policy (the dominant
-- ownership pattern in this schema) and no corresponding index found 26.
--
-- Purely additive: CREATE INDEX IF NOT EXISTS never changes behavior, only
-- query plans, so this carries none of the correctness risk the function-
-- signature fixes elsewhere in this migration history did. The defensive
-- ADD COLUMN IF NOT EXISTS guard before each index matches the pattern
-- already established for ai_memory.sql / interest_graph.sql, in case any
-- of these tables exist in a real project with a divergent shape.
-- Safe + re-runnable.
-- ============================================================================
BEGIN;

ALTER TABLE public.academy_access ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_academy_access_user_id ON public.academy_access(user_id);

ALTER TABLE public.academy_progress ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_academy_progress_user_id ON public.academy_progress(user_id);

ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_id ON public.automation_rules(user_id);

ALTER TABLE public.bloodline_nodes ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_bloodline_nodes_user_id ON public.bloodline_nodes(user_id);

ALTER TABLE public.content_recommendations ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_content_recommendations_user_id ON public.content_recommendations(user_id);

ALTER TABLE public.contribution_log ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_contribution_log_user_id ON public.contribution_log(user_id);

ALTER TABLE public.data_export_requests ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_data_export_requests_user_id ON public.data_export_requests(user_id);

ALTER TABLE public.dispatches ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_dispatches_user_id ON public.dispatches(user_id);

ALTER TABLE public.event_rsvps ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user_id ON public.event_rsvps(user_id);

ALTER TABLE public.exam_results ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON public.exam_results(user_id);

ALTER TABLE public.feedback ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);

ALTER TABLE public.health_logs ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_health_logs_user_id ON public.health_logs(user_id);

ALTER TABLE public.heritage_records ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_heritage_records_user_id ON public.heritage_records(user_id);

ALTER TABLE public.matrix_progress ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_matrix_progress_user_id ON public.matrix_progress(user_id);

ALTER TABLE public.member_events ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_member_events_user_id ON public.member_events(user_id);

ALTER TABLE public.member_perks ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_member_perks_user_id ON public.member_perks(user_id);

ALTER TABLE public.member_posts ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_member_posts_user_id ON public.member_posts(user_id);

ALTER TABLE public.member_presence ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_member_presence_user_id ON public.member_presence(user_id);

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON public.messages(user_id);

ALTER TABLE public.research_hypotheses ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_research_hypotheses_user_id ON public.research_hypotheses(user_id);

ALTER TABLE public.session_heartbeats ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_session_heartbeats_user_id ON public.session_heartbeats(user_id);

ALTER TABLE public.social_broadcasts ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_social_broadcasts_user_id ON public.social_broadcasts(user_id);

ALTER TABLE public.social_connections ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_social_connections_user_id ON public.social_connections(user_id);

ALTER TABLE public.token_balances ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_token_balances_user_id ON public.token_balances(user_id);

ALTER TABLE public.travel_journeys ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_travel_journeys_user_id ON public.travel_journeys(user_id);

ALTER TABLE public.user_dedication ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS idx_user_dedication_user_id ON public.user_dedication(user_id);

COMMIT;
