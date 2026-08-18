-- ============================================================================
-- Ω SYD OMEGA 91717 — RLS PASS 7: FINAL 3 TABLES, `multiple_permissive_policies`
-- FULLY CLEARED (434 -> 0 ACROSS ALL SEVEN PASSES)
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Seventh and final pass on `multiple_permissive_policies`, resolving the 3
-- tables deliberately deferred from pass 6 (`content_versions`, `dispatches`
-- — mixed `{public}`/`{authenticated}`-scoped additive policies with
-- different conditions; `marketplace_listings` — 5 overlapping policies
-- split across two different columns).
--
-- `content_versions`: same "bare true at authenticated scope dominates"
-- shape as `feature_flags`/`platform_metrics` in pass 6 — the
-- `{authenticated}`-scoped `content_versions_auth_read` (qual=true) already
-- grants every authenticated user (owner included) unconditional read
-- access, making both the ALL policy's SELECT component and the separate
-- `author reads own content_versions` policy (author_id=uid) fully
-- redundant for that role. A single `SELECT TO authenticated USING (true)`
-- policy reproduces exactly what the 3 original policies granted: anon
-- gets nothing (unchanged — anon was never able to satisfy
-- `is_platform_owner()` or `author_id = uid`), authenticated/owner get
-- unconditional read (unchanged).
--
-- `dispatches`: the {authenticated}-scoped `wire read` (qual=true) and the
-- {public}-scoped `dispatch_read`/`dispatches_own` SELECT components
-- can't be folded into one policy by widening role scope alone (anon must
-- keep seeing only published dispatches, not everything) — resolved with
-- the `(select auth.role()) = 'authenticated'` idiom already used live
-- elsewhere in this exact schema (`marketplace_listings_select_merged`,
-- predating this session). A single SELECT policy —
-- `is_published = true OR is_platform_owner() OR (select auth.role()) =
-- 'authenticated'` — reproduces the original 3-policy behavior exactly:
-- anon sees only published dispatches (the `auth.role()` term is false for
-- anon), authenticated/owner see everything (the `auth.role()` term
-- dominates, matching what `wire read` alone already granted). INSERT/
-- UPDATE/DELETE had no additive policies beyond the ALL policy's own
-- self-or-owner condition, so those became simple 1:1 per-command splits.
--
-- `marketplace_listings`: checked the live table shape before touching
-- anything, per this file's standing rule against guessing at schema —
-- `information_schema.columns` confirmed both `user_id` (nullable) and
-- `seller_id` (NOT NULL) exist, and a direct row-count query confirmed
-- the table has 0 rows total, so `user_id` has never been populated by
-- any real insert. `seller_id` is therefore the only column any real
-- write path could have used (enforced by its NOT NULL constraint), and
-- `marketplace_listings_own`'s `user_id`-based self-access clause was
-- already dead code in practice (its OR-term never true for a real row).
-- Restructured around `seller_id` as the operative identity column,
-- preserving `marketplace_listings_select_merged`'s existing
-- `auth.role()='authenticated'` broad-read grant (any authenticated
-- member can browse the whole marketplace, not just active listings —
-- an intentional, already-live design predating this session, not
-- something introduced here) and `ml_update`'s existing seller-or-owner
-- condition unchanged. DELETE previously had no seller-specific policy
-- at all (only the ALL policy's dead-`user_id`-OR-owner condition, which
-- in practice meant owner-only) — kept as owner-only rather than
-- introducing a new seller-delete capability that didn't previously
-- exist, since this pass's job is restructuring, not redesigning access.
--
-- Verified post-apply: `pg_policies` grouped by (table, cmd) shows exactly
-- 1 policy for every command on all 3 tables (12 rows, no gaps, no
-- duplicates, no lockout). `get_advisors` re-run afterward confirmed
-- `multiple_permissive_policies` dropped to exactly 0 — fully cleared, a
-- 100% reduction from the original 434 findings across all seven passes
-- in this session. Only `unused_index` (125) and `unindexed_foreign_keys`
-- (85) remain in the performance-advisor output, both already-documented
-- INFO-level categories deliberately deferred to a dedicated follow-up
-- (see this file's earlier entry on the first performance-advisor pass).
--
-- Idempotent (DROP POLICY IF EXISTS before each CREATE), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

-- ============ RESTRUCTURE: content_versions (bare true at authenticated scope, dominates) ============
DROP POLICY IF EXISTS "owner manages content_versions" ON public.content_versions;
DROP POLICY IF EXISTS "author reads own content_versions" ON public.content_versions;
DROP POLICY IF EXISTS "content_versions_auth_read" ON public.content_versions;
CREATE POLICY "content_versions_select" ON public.content_versions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "content_versions_owner_insert" ON public.content_versions
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "content_versions_owner_update" ON public.content_versions
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "content_versions_owner_delete" ON public.content_versions
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: dispatches (mixed public/authenticated additive SELECTs, folded via auth.role() guard) ============
DROP POLICY IF EXISTS "dispatches_own" ON public.dispatches;
DROP POLICY IF EXISTS "dispatch_read" ON public.dispatches;
DROP POLICY IF EXISTS "wire read" ON public.dispatches;
CREATE POLICY "dispatches_select" ON public.dispatches
  FOR SELECT USING (is_published = true OR is_platform_owner() OR (select auth.role()) = 'authenticated');
CREATE POLICY "dispatches_self_insert" ON public.dispatches
  FOR INSERT WITH CHECK (user_id = (select auth.uid()) OR is_platform_owner());
CREATE POLICY "dispatches_self_update" ON public.dispatches
  FOR UPDATE USING (user_id = (select auth.uid()) OR is_platform_owner()) WITH CHECK (user_id = (select auth.uid()) OR is_platform_owner());
CREATE POLICY "dispatches_self_delete" ON public.dispatches
  FOR DELETE USING (user_id = (select auth.uid()) OR is_platform_owner());

-- ============ RESTRUCTURE: marketplace_listings (seller_id is the real NOT NULL column; user_id is dead — 0 rows, nullable, never populated) ============
DROP POLICY IF EXISTS "marketplace_listings_own" ON public.marketplace_listings;
DROP POLICY IF EXISTS "ml_insert" ON public.marketplace_listings;
DROP POLICY IF EXISTS "marketplace_listings_select_merged" ON public.marketplace_listings;
DROP POLICY IF EXISTS "ml_read" ON public.marketplace_listings;
DROP POLICY IF EXISTS "ml_update" ON public.marketplace_listings;
CREATE POLICY "marketplace_listings_select" ON public.marketplace_listings
  FOR SELECT USING (is_platform_owner() OR status = 'active' OR seller_id = (select auth.uid()) OR (select auth.role()) = 'authenticated');
CREATE POLICY "marketplace_listings_insert" ON public.marketplace_listings
  FOR INSERT WITH CHECK (is_platform_owner() OR seller_id = (select auth.uid()));
CREATE POLICY "marketplace_listings_update" ON public.marketplace_listings
  FOR UPDATE USING (is_platform_owner() OR seller_id = (select auth.uid())) WITH CHECK (is_platform_owner() OR seller_id = (select auth.uid()));
CREATE POLICY "marketplace_listings_owner_delete" ON public.marketplace_listings
  FOR DELETE USING (is_platform_owner());
