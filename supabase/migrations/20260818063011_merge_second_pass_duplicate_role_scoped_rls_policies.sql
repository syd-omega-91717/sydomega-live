-- ============================================================================
-- Ω SYD OMEGA 91717 — MERGE 15 MORE ROLE-SCOPED DUPLICATE RLS POLICIES
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Second pass on `multiple_permissive_policies`, continuing the RLS-policy
-- consolidation follow-up from 20260818002831 (which merged the first 15
-- byte-identical pairs) and 20260818002535 (auth_rls_initplan). A fresh
-- full pg_policies dump was grouped by (table, cmd, exact roles array) --
-- not just "same role name," but the literal roles array, so a `{public}`
-- (all-roles) policy is never conflated with an `{authenticated}`-only one
-- even when they overlap for authenticated callers. Any group with 2+
-- policies sharing the EXACT same role scope was merged: this is safe by
-- construction, since Postgres already evaluates multiple permissive
-- policies for the same role as an OR of all of them — merging just makes
-- that explicit as one physical policy instead of two, with zero
-- access-control change. Groups whose role scopes differed even slightly
-- (e.g. one `{public}`, one `{authenticated}` for the same table+cmd) were
-- deliberately left alone, same caution as every prior pass in this file.
--
-- 15 groups found (30 individual policies -> 15 merged), covering
-- ai_memory, contribution_log (x2: INSERT, SELECT), conversations,
-- expert_bookings, interest_signals, marketplace_listings, medals,
-- media_reservations, publications, sovereign_events, task_completions,
-- user_dedication, user_journeys, workflow_executions. Verified before
-- applying that none of the 15 new merged-policy names collided with any
-- existing policy name on their table.
--
-- Verified post-apply: every merged (table, cmd) now shows exactly 1
-- policy (was 2); every table still has policies for every command it had
-- before (no accidental total lockout on any action); `get_advisors`
-- re-run afterward confirmed `multiple_permissive_policies` dropped
-- 254 -> 209 (a larger drop than 15 since several merged groups were on
-- commands the advisor counts per underlying CRUD action).
--
-- Idempotent (DROP POLICY IF EXISTS before each CREATE), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "member reads own memory" ON public.ai_memory;
DROP POLICY IF EXISTS "owner reads all memory" ON public.ai_memory;
CREATE POLICY "ai_memory_select_merged" ON public.ai_memory FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "cl_insert" ON public.contribution_log;
DROP POLICY IF EXISTS "own contributions insert" ON public.contribution_log;
CREATE POLICY "contribution_log_insert_merged" ON public.contribution_log FOR INSERT TO authenticated WITH CHECK (((user_id = ( SELECT auth.uid() AS uid))) OR ((( SELECT auth.uid() AS uid) = user_id)));

DROP POLICY IF EXISTS "cl_read" ON public.contribution_log;
DROP POLICY IF EXISTS "own contributions read" ON public.contribution_log;
CREATE POLICY "contribution_log_select_merged" ON public.contribution_log FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid))) OR ((( SELECT auth.uid() AS uid) = user_id)));

DROP POLICY IF EXISTS "conversations_owner_all" ON public.conversations;
DROP POLICY IF EXISTS "member manages own conversations" ON public.conversations;
CREATE POLICY "conversations_all_merged" ON public.conversations FOR ALL USING (((( SELECT auth.uid() AS uid) = user_id)) OR ((user_id = ( SELECT auth.uid() AS uid)))) WITH CHECK (((( SELECT auth.uid() AS uid) = user_id)) OR ((user_id = ( SELECT auth.uid() AS uid))));

DROP POLICY IF EXISTS "member sees own bookings" ON public.expert_bookings;
DROP POLICY IF EXISTS "owner sees all bookings" ON public.expert_bookings;
CREATE POLICY "expert_bookings_select_merged" ON public.expert_bookings FOR SELECT USING ((((client_id = ( SELECT auth.uid() AS uid)) OR (expert_id = ( SELECT auth.uid() AS uid)))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "interest_own_select" ON public.interest_signals;
DROP POLICY IF EXISTS "interest_owner_select" ON public.interest_signals;
CREATE POLICY "interest_signals_select_merged" ON public.interest_signals FOR SELECT TO authenticated USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "marketplace_listings_read" ON public.marketplace_listings;
DROP POLICY IF EXISTS "ml_select" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_select_merged" ON public.marketplace_listings FOR SELECT USING (((( SELECT auth.role() AS role) = 'authenticated'::text)) OR (((status = 'active'::text) OR (( SELECT auth.uid() AS uid) = seller_id) OR is_platform_owner())));

DROP POLICY IF EXISTS "medal_self" ON public.medals;
DROP POLICY IF EXISTS "medals_select_own" ON public.medals;
CREATE POLICY "medals_select_merged" ON public.medals FOR SELECT USING (((( SELECT auth.uid() AS uid) = user_id)) OR (((( SELECT auth.uid() AS uid) = user_id) OR is_platform_owner())));

DROP POLICY IF EXISTS "own media read" ON public.media_reservations;
DROP POLICY IF EXISTS "owner reads all media" ON public.media_reservations;
CREATE POLICY "media_reservations_select_merged" ON public.media_reservations FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id)) OR (((( SELECT auth.uid() AS uid) = user_id) OR is_platform_owner())));

DROP POLICY IF EXISTS "own pubs read" ON public.publications;
DROP POLICY IF EXISTS "owner reads publications" ON public.publications;
CREATE POLICY "publications_select_merged" ON public.publications FOR SELECT TO authenticated USING (((( SELECT auth.uid() AS uid) = user_id)) OR (is_platform_owner()));

DROP POLICY IF EXISTS "member sees own events" ON public.sovereign_events;
DROP POLICY IF EXISTS "owner sees all events" ON public.sovereign_events;
CREATE POLICY "sovereign_events_select_merged" ON public.sovereign_events FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "members see own tasks" ON public.task_completions;
DROP POLICY IF EXISTS "owner sees all tasks" ON public.task_completions;
CREATE POLICY "task_completions_select_merged" ON public.task_completions FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "member sees own dedication" ON public.user_dedication;
DROP POLICY IF EXISTS "owner sees all dedication" ON public.user_dedication;
CREATE POLICY "user_dedication_select_merged" ON public.user_dedication FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "member sees own journey" ON public.user_journeys;
DROP POLICY IF EXISTS "owner reads journeys" ON public.user_journeys;
CREATE POLICY "user_journeys_select_merged" ON public.user_journeys FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));

DROP POLICY IF EXISTS "member sees own executions" ON public.workflow_executions;
DROP POLICY IF EXISTS "owner sees all executions" ON public.workflow_executions;
CREATE POLICY "workflow_executions_select_merged" ON public.workflow_executions FOR SELECT USING (((user_id = ( SELECT auth.uid() AS uid))) OR (is_platform_owner()));
