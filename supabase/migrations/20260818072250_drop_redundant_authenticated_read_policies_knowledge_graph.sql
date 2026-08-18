-- ============================================================================
-- Ω SYD OMEGA 91717 — DROP 5 REDUNDANT {authenticated}-SCOPED READ POLICIES
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Continuing the `multiple_permissive_policies` consolidation follow-up.
-- Five tables (`capability_registry`, `data_domains`, `data_entities`,
-- `knowledge_edges`, `knowledge_nodes`) each carried 3 policies: a
-- `{public}`-scoped `FOR ALL USING(is_platform_owner())` owner policy, a
-- `{public}`-scoped `FOR SELECT USING(auth.uid() IS NOT NULL)` policy, and
-- an `{authenticated}`-scoped `FOR SELECT USING(true)` policy
-- (`<table>_auth_read`). The last of these is fully subsumed by the
-- `{public}`-scoped SELECT policy: for the `authenticated` role
-- specifically, `auth.uid() IS NOT NULL` is always true (a defining
-- property of that role — the role only applies to a caller that has
-- authenticated), so the public-scoped policy alone already grants
-- authenticated callers identical SELECT access, while correctly still
-- denying anon. Dropping the `_auth_read` duplicate is a pure redundancy
-- removal, not a restructuring — confirmed by hand across all 5 tables'
-- exact policy text before applying, not assumed from the naming pattern.
--
-- This did NOT fully clear these 5 tables from the advisor's
-- `multiple_permissive_policies` category on its own — a deeper,
-- genuinely-additive overlap remained between the ALL policy and the
-- surviving public-scoped SELECT policy, resolved separately in
-- 20260818072522 (same session, immediately following).
--
-- Verified post-apply: each table left with exactly 1 SELECT policy (was
-- 2) and 2 total policies (was 3); no table's overall policy count reached
-- zero for any command (no lockout).
--
-- Idempotent (DROP POLICY IF EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "capability_registry_auth_read" ON public.capability_registry;
DROP POLICY IF EXISTS "data_domains_auth_read" ON public.data_domains;
DROP POLICY IF EXISTS "data_entities_auth_read" ON public.data_entities;
DROP POLICY IF EXISTS "knowledge_edges_auth_read" ON public.knowledge_edges;
DROP POLICY IF EXISTS "knowledge_nodes_auth_read" ON public.knowledge_nodes;
