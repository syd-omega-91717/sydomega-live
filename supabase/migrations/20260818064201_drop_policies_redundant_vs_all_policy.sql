-- ============================================================================
-- Ω SYD OMEGA 91717 — DROP 9 POLICIES REDUNDANT AGAINST THEIR TABLE'S ALL POLICY
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Third pass on `multiple_permissive_policies`, continuing the RLS-policy
-- consolidation follow-up from 20260818002831 (first merge pass) and
-- 20260818063011 (second merge pass, exact-role-scope groups). This pass
-- targeted a different, more common shape found across the schema: a table
-- with a `FOR ALL` policy PLUS a separate command-specific policy (e.g.
-- `FOR SELECT`) whose condition turns out to already be fully implied by
-- the ALL policy's own condition for that command — since `FOR ALL`
-- already covers SELECT/INSERT/UPDATE/DELETE, the specific policy adds
-- nothing and can be dropped outright, not merged.
--
-- Detected programmatically: for every table with exactly one `FOR ALL`
-- policy, every other (non-ALL) policy on that table whose role scope is a
-- subset of (or equal to) the ALL policy's role scope was checked —
-- normalizing both conditions into OR-clause sets (handling equality-
-- operand reordering) and confirming the specific policy's clause set is a
-- subset of the ALL policy's clause set for the relevant field(s): `qual`
-- for SELECT/UPDATE/DELETE, `with_check` for INSERT/UPDATE. A subset match
-- means the specific policy can never grant access the ALL policy doesn't
-- already grant for that role+command. Confirmed this correctly EXCLUDES
-- real non-redundant cases (e.g. `activity_feed`'s "own rows" ALL policy
-- plus its separate "public OR own rows" SELECT policy — the SELECT
-- policy's extra `is_public = true` clause is not present in the ALL
-- policy's condition, so it's correctly left alone, matching this file's
-- standing example of a case that must NOT be merged).
--
-- 9 policies found and dropped, several of them byte-identical to their
-- table's ALL-policy condition, not just logically implied:
-- commission_contracts, consent_records, consult_requests, data_lineage,
-- error_budget_policy, media_reservations, publications, slo_metrics,
-- threat_events.
--
-- Verified post-apply: every affected table's `FOR ALL` policy remains
-- (still 1 policy count), and every command the dropped policy covered is
-- still covered by the surviving ALL policy — no accidental lockout on
-- any action. `get_advisors` re-run afterward confirmed
-- `multiple_permissive_policies` dropped 209 -> 171 (a larger drop than 9
-- since several affected tables' policies were `{public}`-scoped, which
-- the advisor's per-role reporting counts against every role that
-- inherits from `public`, not just anon/authenticated).
--
-- Idempotent (DROP POLICY IF EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "cc_select" ON public.commission_contracts;
DROP POLICY IF EXISTS "member sees own consent" ON public.consent_records;
DROP POLICY IF EXISTS "cr_select" ON public.consult_requests;
DROP POLICY IF EXISTS "data_lineage_owner_read" ON public.data_lineage;
DROP POLICY IF EXISTS "error_budget_policy_owner_read" ON public.error_budget_policy;
DROP POLICY IF EXISTS "mr_select" ON public.media_reservations;
DROP POLICY IF EXISTS "publications_select_merged" ON public.publications;
DROP POLICY IF EXISTS "slo_metrics_owner_read" ON public.slo_metrics;
DROP POLICY IF EXISTS "owner reads threats" ON public.threat_events;
