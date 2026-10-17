-- Ω SYD OMEGA 91717 — three deployed functions can read what they already read
-- service_role has held no default privilege on public tables since
-- 20260903015535, and these reads were never granted back (measured live
-- 2026-10-17: each 42501). authenticated already has table SELECT on all
-- three, so nothing here exposes data members cannot already read.
--
--   evidence-graph (ctx.supabaseAdmin)
--     omega_platform_evidence: a column list, and select('*', count, head).
--     A count over * needs table-level SELECT.
--   omega-knowledge-embedding-worker (ctx.supabaseAdmin)
--     omega_knowledge_chunks: content, filtered by id.
--     omega_provider_registry: provider_key, status, secret_ref, by provider_key.
--   omega-provider-worker (ctx.supabaseAdmin)
--     omega_provider_registry: provider_key, status, filtered by id.
--
-- Column grants for the two worker tables: every other column (embedding,
-- metadata, capabilities...) stays unreadable to service_role. Read-only;
-- the workers write through their completion RPCs.

begin;

grant select on table public.omega_platform_evidence to service_role;
grant select (id, content) on table public.omega_knowledge_chunks to service_role;
grant select (id, provider_key, status, secret_ref) on table public.omega_provider_registry to service_role;

commit;
