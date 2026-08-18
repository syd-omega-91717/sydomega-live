-- ============================================================================
-- Ω SYD OMEGA 91717 — DROP 15 BYTE-IDENTICAL DUPLICATE RLS POLICIES
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Second half of the `get_advisors(type='performance')` RLS-policy
-- follow-up ("keep going on the RLS policy consolidation"). Addresses 15 of
-- the 424 real `multiple_permissive_policies` findings — NOT a blanket
-- consolidation of all 424 (most are genuinely different access rules that
-- happen to share a role/action, e.g. activity_feed's "own rows" policy
-- co-existing with its separate "public rows" policy — merging those
-- safely needs per-table judgment this migration deliberately doesn't
-- attempt). These 15 are different: dumped every policy in
-- `public.*` via `pg_policies`, grouped by (table, cmd, role), and
-- normalized each qual/with_check (accounting for OR-clause and equality-
-- operand reordering) to find pairs that are truly identical, not just
-- similar. All 15 matches were then re-verified by eye against the raw,
-- un-normalized text before touching anything — e.g. `messages`' two
-- `ALL`-command policies both read, word for word:
--   EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id
--           AND c.user_id = (SELECT auth.uid()))
-- under two different policy names. This is the same duplicate-table-
-- definition problem already extensively documented elsewhere in this repo
-- (multiple supabase/*.sql files independently defining the same table,
-- each adding its own copy of the same policy under a different name) —
-- here it's the same bug manifesting as a literal runtime RLS duplicate,
-- not just a source-file duplicate.
--
-- Kept the more descriptive/conventional name in each pair ("owner manages
-- X" / "owner reads all X" / "member manages own X" over a "<table>_suffix"
-- style name), dropped the other. Purely a performance fix — one fewer
-- policy Postgres has to evaluate per matching query — with zero access-
-- control change, since the dropped policy's logic is byte-identical to
-- the one that remains.
--
-- Verified post-apply: all 15 dropped policy names return zero rows from
-- pg_policies; every one of the 14 affected tables still has at least 1
-- (in most cases 2-3) policies remaining — no table was left with a total
-- RLS lockout as a side effect.
--
-- Idempotent (DROP POLICY IF EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "capability_registry_owner_write" ON public.capability_registry;
DROP POLICY IF EXISTS "circuit_breakers_owner_only" ON public.circuit_breakers;
DROP POLICY IF EXISTS "content_versions_owner_write" ON public.content_versions;
DROP POLICY IF EXISTS "conversations_platform_owner_read" ON public.conversations;
DROP POLICY IF EXISTS "data_domains_owner_write" ON public.data_domains;
DROP POLICY IF EXISTS "data_entities_owner_write" ON public.data_entities;
DROP POLICY IF EXISTS "own events read" ON public.evolution_events;
DROP POLICY IF EXISTS "knowledge_edges_owner_write" ON public.knowledge_edges;
DROP POLICY IF EXISTS "knowledge_nodes_owner_write" ON public.knowledge_nodes;
DROP POLICY IF EXISTS "messages_owner_all" ON public.messages;
DROP POLICY IF EXISTS "messages_platform_owner_read" ON public.messages;
DROP POLICY IF EXISTS "ps_read" ON public.platform_settings;
DROP POLICY IF EXISTS "policy_rules_owner_only" ON public.policy_rules;
DROP POLICY IF EXISTS "rate_limits_owner_only" ON public.rate_limits;
DROP POLICY IF EXISTS "security_policies_owner_only" ON public.security_policies;
