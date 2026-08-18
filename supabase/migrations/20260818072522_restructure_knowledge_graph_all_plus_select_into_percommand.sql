-- ============================================================================
-- Ω SYD OMEGA 91717 — RESTRUCTURE 5 KNOWLEDGE-GRAPH TABLES' ALL+SELECT POLICY
-- PAIRS INTO SINGLE-PURPOSE PER-COMMAND POLICIES
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Fifth pass on `multiple_permissive_policies`, and the first pass to use
-- the "collapse ALL + specific policies into single-purpose per-command
-- policies" technique flagged as blocked in CLAUDE.md's prior entry — the
-- blocker (whether a `FOR ALL` policy with only `USING` implicitly reuses
-- that expression as `WITH CHECK` for INSERT/UPDATE, or defaults to
-- unrestricted `WITH CHECK(true)`) was resolved this session by an
-- empirical test against a real scratch table and role on this project: a
-- `FOR ALL USING(owner_flag = true)` policy with no explicit WITH CHECK
-- correctly REJECTED an INSERT violating that condition (SQLSTATE 42501),
-- confirming `USING` is reused for `WITH CHECK`, not defaulted to `true`.
-- (Test objects and their tracking-table rows fully cleaned up afterward —
-- see 20260818072124's own entry for that housekeeping.)
--
-- This pass's target shape is different from every prior pass: a
-- `capability_registry`/`data_domains`/`data_entities`/`knowledge_edges`/
-- `knowledge_nodes` table each had exactly 2 remaining policies after the
-- immediately-prior fix (20260818072... — dropping a genuine byte-duplicate
-- `{authenticated}`-scoped bare-`true` SELECT policy) removed the simple
-- redundancy: a `{public}`-scoped `FOR ALL USING(is_platform_owner())`
-- policy, and a `{public}`-scoped `FOR SELECT USING(auth.uid() IS NOT
-- NULL)` policy. These are NOT redundant against each other — the ALL
-- policy's condition doesn't imply the SELECT policy's (an owner-only gate
-- is narrower, not broader, than an any-authenticated-user gate) — so this
-- was correctly left alone by every prior pass's redundancy detectors.
-- Confirmed via a live re-run of `get_advisors` after the prior fix that
-- these 5 tables still each carried a `multiple_permissive_policies`
-- finding for every role inheriting `public` (5 tables x 5 roles = 25
-- findings), proving the prior fix, while itself correct, hadn't cleared
-- this deeper overlap.
--
-- Restructured each table's 2 policies into 4 single-purpose ones:
--   - `<table>_select`        FOR SELECT USING (is_platform_owner() OR auth.uid() IS NOT NULL)
--   - `<table>_owner_insert`  FOR INSERT WITH CHECK (is_platform_owner())
--   - `<table>_owner_update`  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner())
--   - `<table>_owner_delete`  FOR DELETE USING (is_platform_owner())
-- Provably behavior-identical, not just similar: SELECT access today is the
-- OR of both policies' conditions (Postgres evaluates multiple permissive
-- policies for the same role+command as an OR) — the new single SELECT
-- policy encodes that exact OR explicitly. INSERT/UPDATE/DELETE access
-- today is owner-only via the ALL policy's `USING`, which — per the
-- semantics confirmed above — was already implicitly reused as `WITH
-- CHECK`; the new policies make that identical restriction explicit rather
-- than implicit. Net effect: exactly 1 policy per (table, command), zero
-- residual overlap for any command or role.
--
-- Verified post-apply: `pg_policies` grouped by (table, cmd) shows exactly
-- 1 policy for all 4 commands across all 5 tables (20 rows, no gaps, no
-- duplicates). `get_advisors` re-run afterward confirmed
-- `multiple_permissive_policies` dropped 123 -> 98, and a direct search of
-- the fresh advisor output for these 5 table names inside that category
-- returned 0 remaining hits — this pass fully cleared them, not just
-- reduced their count.
--
-- Idempotent (DROP POLICY IF EXISTS before each CREATE), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

-- capability_registry
DROP POLICY IF EXISTS "owner manages capability_registry" ON public.capability_registry;
DROP POLICY IF EXISTS "authenticated reads capability_registry" ON public.capability_registry;
CREATE POLICY "capability_registry_select" ON public.capability_registry
  FOR SELECT USING (is_platform_owner() OR ((select auth.uid()) IS NOT NULL));
CREATE POLICY "capability_registry_owner_insert" ON public.capability_registry
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "capability_registry_owner_update" ON public.capability_registry
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "capability_registry_owner_delete" ON public.capability_registry
  FOR DELETE USING (is_platform_owner());

-- data_domains
DROP POLICY IF EXISTS "owner manages data_domains" ON public.data_domains;
DROP POLICY IF EXISTS "authenticated reads data_domains" ON public.data_domains;
CREATE POLICY "data_domains_select" ON public.data_domains
  FOR SELECT USING (is_platform_owner() OR ((select auth.uid()) IS NOT NULL));
CREATE POLICY "data_domains_owner_insert" ON public.data_domains
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "data_domains_owner_update" ON public.data_domains
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "data_domains_owner_delete" ON public.data_domains
  FOR DELETE USING (is_platform_owner());

-- data_entities
DROP POLICY IF EXISTS "owner manages data_entities" ON public.data_entities;
DROP POLICY IF EXISTS "authenticated reads data_entities" ON public.data_entities;
CREATE POLICY "data_entities_select" ON public.data_entities
  FOR SELECT USING (is_platform_owner() OR ((select auth.uid()) IS NOT NULL));
CREATE POLICY "data_entities_owner_insert" ON public.data_entities
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "data_entities_owner_update" ON public.data_entities
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "data_entities_owner_delete" ON public.data_entities
  FOR DELETE USING (is_platform_owner());

-- knowledge_edges
DROP POLICY IF EXISTS "owner manages knowledge_edges" ON public.knowledge_edges;
DROP POLICY IF EXISTS "authenticated reads knowledge_edges" ON public.knowledge_edges;
CREATE POLICY "knowledge_edges_select" ON public.knowledge_edges
  FOR SELECT USING (is_platform_owner() OR ((select auth.uid()) IS NOT NULL));
CREATE POLICY "knowledge_edges_owner_insert" ON public.knowledge_edges
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "knowledge_edges_owner_update" ON public.knowledge_edges
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "knowledge_edges_owner_delete" ON public.knowledge_edges
  FOR DELETE USING (is_platform_owner());

-- knowledge_nodes
DROP POLICY IF EXISTS "owner manages knowledge_nodes" ON public.knowledge_nodes;
DROP POLICY IF EXISTS "authenticated reads knowledge_nodes" ON public.knowledge_nodes;
CREATE POLICY "knowledge_nodes_select" ON public.knowledge_nodes
  FOR SELECT USING (is_platform_owner() OR ((select auth.uid()) IS NOT NULL));
CREATE POLICY "knowledge_nodes_owner_insert" ON public.knowledge_nodes
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "knowledge_nodes_owner_update" ON public.knowledge_nodes
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "knowledge_nodes_owner_delete" ON public.knowledge_nodes
  FOR DELETE USING (is_platform_owner());
