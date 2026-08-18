-- ============================================================================
-- Ω SYD OMEGA 91717 — DROP 28 MORE POLICIES REDUNDANT AGAINST THEIR ALL POLICY
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Fourth pass on `multiple_permissive_policies`, same pattern as
-- 20260818064201 (a `FOR ALL` policy already implying a separate
-- command-specific policy's condition) — found after fixing a real bug in
-- the detector script used for that prior pass: `split_top_or()` only
-- split an expression on ` OR ` at bracket-depth 0, but several ALL-policy
-- conditions are wrapped in an *extra* pair of parens around the whole OR
-- expression (e.g. `((auth.uid()=user_id) OR is_platform_owner())`),
-- pushing the actual OR to depth 1 and hiding it from the splitter
-- entirely. This was a false-negative bug (missed real redundancies), not
-- a false-positive one — nothing unsafe was ever proposed by the buggy
-- version, it just found fewer of the safe cases than actually existed.
-- Fixed by stripping wrapping parens before splitting, then re-verified by
-- hand against `certificates` (its "own certificates read"/"cert_self"
-- policies, both literally `auth.uid()=user_id`, are now correctly
-- recognized as implied by `certificates_own`'s
-- `auth.uid()=user_id OR is_platform_owner()`) before re-running the full
-- scan across every table.
--
-- 28 policies dropped across 11 tables, each confirmed (qual, and where
-- applicable with_check, checked separately per this file's own established
-- rule for UPDATE policies needing both) to be a subset of their table's
-- ALL policy condition, with role-scope subset also verified: certificates,
-- commission_contracts, consult_requests, contribution_log, dispatches,
-- evolution_events, family_nodes, media_reservations, publications,
-- task_completions, trophies. Two of these
-- (`contribution_log_insert_merged`, `contribution_log_select_merged`)
-- were themselves created by the second consolidation pass
-- (20260818063011) earlier in this session — turned out to be fully
-- redundant against `contribution_log_own`'s ALL policy once correctly
-- detected, a natural continuation of that fix rather than a contradiction
-- of it.
--
-- Verified post-apply: every affected table's `FOR ALL` policy remains,
-- and every command the dropped policies covered is still covered by it —
-- no lockout on any action. `get_advisors` re-run afterward confirmed
-- `multiple_permissive_policies` dropped 171 -> 123 (again a larger drop
-- than 28, per this file's now-established pattern of `{public}`-scoped
-- policies clearing findings across every role that inherits from public).
--
-- Idempotent (DROP POLICY IF EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DROP POLICY IF EXISTS "own certificates insert" ON public.certificates;
DROP POLICY IF EXISTS "own certificates read" ON public.certificates;
DROP POLICY IF EXISTS "cert_self" ON public.certificates;
DROP POLICY IF EXISTS "own contracts insert" ON public.commission_contracts;
DROP POLICY IF EXISTS "own contracts read" ON public.commission_contracts;
DROP POLICY IF EXISTS "cc_insert" ON public.commission_contracts;
DROP POLICY IF EXISTS "own consults insert" ON public.consult_requests;
DROP POLICY IF EXISTS "own consults read" ON public.consult_requests;
DROP POLICY IF EXISTS "cr_insert" ON public.consult_requests;
DROP POLICY IF EXISTS "contribution_log_insert_merged" ON public.contribution_log;
DROP POLICY IF EXISTS "contribution_log_select_merged" ON public.contribution_log;
DROP POLICY IF EXISTS "wire insert" ON public.dispatches;
DROP POLICY IF EXISTS "own evolution insert" ON public.evolution_events;
DROP POLICY IF EXISTS "own evolution read" ON public.evolution_events;
DROP POLICY IF EXISTS "own family delete" ON public.family_nodes;
DROP POLICY IF EXISTS "own family insert" ON public.family_nodes;
DROP POLICY IF EXISTS "own family read" ON public.family_nodes;
DROP POLICY IF EXISTS "own family update" ON public.family_nodes;
DROP POLICY IF EXISTS "own media insert" ON public.media_reservations;
DROP POLICY IF EXISTS "mr_insert" ON public.media_reservations;
DROP POLICY IF EXISTS "own pubs insert" ON public.publications;
DROP POLICY IF EXISTS "pub_insert" ON public.publications;
DROP POLICY IF EXISTS "own tasks insert" ON public.task_completions;
DROP POLICY IF EXISTS "own tasks read" ON public.task_completions;
DROP POLICY IF EXISTS "members insert own tasks" ON public.task_completions;
DROP POLICY IF EXISTS "own trophies insert" ON public.trophies;
DROP POLICY IF EXISTS "own trophies read" ON public.trophies;
DROP POLICY IF EXISTS "trophy_self" ON public.trophies;
