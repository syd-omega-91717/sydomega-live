-- ============================================================================
-- Ω SYD OMEGA 91717 — ADD 24 MISSING FOREIGN-KEY INDEXES (REAL SCHEMA ONLY)
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- First pass on the `unindexed_foreign_keys` performance-advisor category
-- (85 findings, deferred from every earlier RLS-focused pass in this
-- session pending a dedicated look). Queried `pg_constraint`/`pg_index`
-- directly for the authoritative list (85 foreign keys with no covering
-- index — matched the advisor's own count exactly, confirming the catalog
-- query and the advisor agree), rather than trusting the advisor's
-- metadata alone (which only gives column ordinal positions, not names).
--
-- Before adding anything, cross-referenced all 63 distinct tables in that
-- list against this repo's own `supabase/*.sql` source, the same method
-- already established earlier in this file for the RLS-disabled-scaffold
-- finding: only 18 tables have a real `CREATE TABLE` anywhere in this
-- repo (`academy_progress`, `advertisements`, `api_keys`,
-- `content_versions`, `data_entities`, `data_lineage`, `enterprise_audit`,
-- `incidents`, `knowledge_edges`, `marketplace_listings`,
-- `matrix_progress`, `member_perks`, `security_policies`, `sim_trades`,
-- `sla_metrics`, `soc_alerts`, `threat_events`, `token_balances`) — the
-- other 45 (`organizations`, `teams`, `projects`/`tasks`, `calendars`,
-- `ai_workspaces`, `knowledge_documents`, `webhooks`, `workflows`,
-- `marketplace_orders`, `billing_invoices`, etc.) are the same unrelated,
-- generic multi-tenant SaaS scaffold this file already documented finding
-- on this production project (empty on every table sampled, never created
-- by anything in this repo, purpose unknown) — left untouched, matching
-- this file's own standing rule against inventing behavior for schema
-- this repo doesn't own or understand the purpose of. This migration adds
-- indexes for exactly the 18 real tables' 24 unindexed foreign keys; the
-- scaffold's 61 remaining unindexed-FK findings are deliberately not
-- addressed here.
--
-- Purely additive (CREATE INDEX IF NOT EXISTS) — no RLS, no access-control
-- implication, no risk of a lockout or behavior change. The only
-- observable side effect is that `get_advisors`'s `unused_index` count
-- rises by up to 24 immediately after this applies, since a brand-new
-- index is by definition unused until real query traffic reaches it —
-- expected, not a regression, and self-corrects as the advisor's
-- statistics window accumulates real usage.
--
-- Verified post-apply: all 24 new index names confirmed present via
-- `pg_indexes`. `get_advisors` re-run afterward confirmed
-- `unindexed_foreign_keys` dropped 85→61 (exactly the 24 resolved), and a
-- table-name search of the remaining findings confirmed all 61 are on the
-- 45 scaffold tables, not the 18 real ones this migration touched.
--
-- Idempotent (CREATE INDEX IF NOT EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DO 'BEGIN IF to_regclass(''public.academy_progress'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''academy_progress'' AND column_name = ''lesson_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_academy_progress_lesson_id" ON public.academy_progress (lesson_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.advertisements'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''advertisements'' AND column_name = ''approved_by'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_advertisements_approved_by" ON public.advertisements (approved_by)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.advertisements'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''advertisements'' AND column_name = ''submitted_by'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_advertisements_submitted_by" ON public.advertisements (submitted_by)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.api_keys'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''api_keys'' AND column_name = ''organization_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_api_keys_organization_id" ON public.api_keys (organization_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.content_versions'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''content_versions'' AND column_name = ''author_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_content_versions_author_id" ON public.content_versions (author_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.data_entities'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''data_entities'' AND column_name = ''domain_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_data_entities_domain_id" ON public.data_entities (domain_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.data_lineage'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''data_lineage'' AND column_name = ''source_entity'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_data_lineage_source_entity" ON public.data_lineage (source_entity)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.data_lineage'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''data_lineage'' AND column_name = ''target_entity'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_data_lineage_target_entity" ON public.data_lineage (target_entity)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.enterprise_audit'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''enterprise_audit'' AND column_name = ''actor_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_enterprise_audit_actor_id" ON public.enterprise_audit (actor_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.enterprise_audit'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''enterprise_audit'' AND column_name = ''enterprise_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_enterprise_audit_enterprise_id" ON public.enterprise_audit (enterprise_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.incidents'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''incidents'' AND column_name = ''author_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_incidents_author_id" ON public.incidents (author_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.knowledge_edges'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''knowledge_edges'' AND column_name = ''to_node'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_knowledge_edges_to_node" ON public.knowledge_edges (to_node)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.marketplace_listings'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''marketplace_listings'' AND column_name = ''seller_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_marketplace_listings_seller_id" ON public.marketplace_listings (seller_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.matrix_progress'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''matrix_progress'' AND column_name = ''phase'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_matrix_progress_phase" ON public.matrix_progress (phase)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.matrix_progress'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''matrix_progress'' AND column_name = ''track'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_matrix_progress_track" ON public.matrix_progress (track)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.member_perks'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''member_perks'' AND column_name = ''perk_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_member_perks_perk_id" ON public.member_perks (perk_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.security_policies'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''security_policies'' AND column_name = ''created_by'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_security_policies_created_by" ON public.security_policies (created_by)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.sim_trades'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''sim_trades'' AND column_name = ''from_user'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_sim_trades_from_user" ON public.sim_trades (from_user)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.sim_trades'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''sim_trades'' AND column_name = ''to_user'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_sim_trades_to_user" ON public.sim_trades (to_user)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.sla_metrics'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''sla_metrics'' AND column_name = ''enterprise_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_sla_metrics_enterprise_id" ON public.sla_metrics (enterprise_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.soc_alerts'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''soc_alerts'' AND column_name = ''affected_user'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_soc_alerts_affected_user" ON public.soc_alerts (affected_user)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.soc_alerts'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''soc_alerts'' AND column_name = ''threat_event_id'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_soc_alerts_threat_event_id" ON public.soc_alerts (threat_event_id)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.threat_events'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''threat_events'' AND column_name = ''resolved_by'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_threat_events_resolved_by" ON public.threat_events (resolved_by)''; END IF; END';
DO 'BEGIN IF to_regclass(''public.token_balances'') IS NOT NULL AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = ''public'' AND table_name = ''token_balances'' AND column_name = ''token'') THEN EXECUTE ''CREATE INDEX IF NOT EXISTS "idx_token_balances_token" ON public.token_balances (token)''; END IF; END';
