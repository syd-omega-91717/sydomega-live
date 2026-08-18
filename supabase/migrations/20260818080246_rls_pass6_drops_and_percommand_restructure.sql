-- ============================================================================
-- Ω SYD OMEGA 91717 — RLS PASS 6: 18 MORE TABLES DROPPED/RESTRUCTURED
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Sixth pass on `multiple_permissive_policies`, continuing the "slow,
-- per-table" approach the user explicitly chose. A fresh full `pg_policies`
-- dump was run through a corrected detector script (fixing two real bugs
-- found while building it: (1) the OR-splitter only split one level deep,
-- missing redundancies hidden behind nested-but-logically-top-level ORs
-- like `(A OR (B OR C))`; (2) equality clauses weren't normalized for
-- operand order, so `auth.uid() = user_id` and `user_id = auth.uid()`
-- were treated as different clauses when they're identical). Both fixes
-- were verified by hand against real examples before trusting the
-- detector's output — see `media_reservations_select_merged` and
-- `task_completions_select_merged` below, both real live redundancies the
-- unfixed detector missed entirely.
--
-- PURE DROPS (7 policies, redundant or logically dominated by their
-- table's ALL policy — zero behavior change):
--   - media_reservations_select_merged, task_completions_select_merged:
--     literal OR-term subset of their table's ALL policy, caught by the
--     corrected detector.
--   - interest_signals: interest_own_insert (exact-duplicate condition to
--     a public-scoped policy, narrower role scope) and member sees own
--     signals (subset of the surviving authenticated-scoped policy for
--     the only role where it isn't already false).
--   - media_reservations' owner updates media, publications' owner
--     updates publications and pub_update: not a literal OR-term subset
--     (so the detector correctly didn't flag these), but verified by hand
--     to be logically dominated — each only ever passes when
--     is_platform_owner() or uid=user_id already holds, which the
--     table's ALL policy already grants unconditionally for that command.
--
-- RESTRUCTURED (16 tables, ALL + additive-specific pairs collapsed into
-- single-purpose per-command policies — the same technique proven on the
-- 5 knowledge-graph tables in 20260818072522, now applied at scale).
-- Split into two groups depending on whether the additive policy's role
-- scope was safe to fold into a single `{public}`-scoped policy:
--   - Safe to widen: either the additive policy was already `{public}`-
--     scoped, or its condition is a `uid`-based self-reference that
--     naturally evaluates false for anon regardless of role scope —
--     api_keys, governance_policies, policy_rules, conversations,
--     messages, member_posts, member_presence, activity_feed (the
--     long-documented "don't merge" example in this file — now safely
--     resolvable via full restructuring rather than a naive OR-merge),
--     ai_memory, advertisements, platform_settings, threat_events.
--   - NOT safe to widen (bare `true` at `{authenticated}` scope — folding
--     into `{public}` would newly expose anon to unconditional access):
--     feature_flags, platform_metrics. These keep their exact original
--     `TO authenticated` scope on the restructured policy instead of
--     merging into a `{public}`-scoped OR, so anon's access is unchanged.
-- For tables whose ALL policy only granted self-access (no owner bypass:
-- conversations, messages, member_posts, member_presence, activity_feed,
-- ai_memory), the restructured INSERT/UPDATE/DELETE policies stay
-- self-only — no owner bypass was added where none existed before.
--
-- DEFERRED, not touched this pass (still show up in the advisor):
-- `dispatches`, `content_versions` (each mix `{public}`- and
-- `{authenticated}`-scoped additive policies with different conditions,
-- needing non-uniform per-policy scope handling rather than a single
-- clean merge), and `marketplace_listings` (5 overlapping policies using
-- two different columns, `user_id` vs `seller_id` — needs the
-- column-consistency question this file already flagged elsewhere
-- resolved first).
--
-- Verified post-apply: `pg_policies` grouped by (table, cmd) shows
-- exactly 1 policy for every command on every one of the 18 tables
-- touched (no gaps, no duplicates, no lockout). `get_advisors` re-run
-- afterward confirmed `multiple_permissive_policies` dropped 98→25, and
-- a search of the fresh advisor output found the only 3 tables still
-- appearing in that category are exactly the 3 deliberately deferred
-- above — confirming this pass didn't miss anything it should have
-- caught, and didn't touch anything it shouldn't have.
--
-- Idempotent (DROP POLICY IF EXISTS before each CREATE), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

-- ============ PURE DROPS (redundant / dominated) ============
DROP POLICY IF EXISTS "media_reservations_select_merged" ON public.media_reservations;
DROP POLICY IF EXISTS "task_completions_select_merged" ON public.task_completions;
DROP POLICY IF EXISTS "interest_own_insert" ON public.interest_signals;
DROP POLICY IF EXISTS "member sees own signals" ON public.interest_signals;
DROP POLICY IF EXISTS "owner updates media" ON public.media_reservations;
DROP POLICY IF EXISTS "owner updates publications" ON public.publications;
DROP POLICY IF EXISTS "pub_update" ON public.publications;

-- ============ RESTRUCTURE: api_keys ============
DROP POLICY IF EXISTS "owner sees all keys" ON public.api_keys;
DROP POLICY IF EXISTS "member sees own keys" ON public.api_keys;
CREATE POLICY "api_keys_select" ON public.api_keys
  FOR SELECT USING (is_platform_owner() OR owner_id = (select auth.uid()));
CREATE POLICY "api_keys_owner_insert" ON public.api_keys
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "api_keys_owner_update" ON public.api_keys
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "api_keys_owner_delete" ON public.api_keys
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: governance_policies ============
DROP POLICY IF EXISTS "owner manages policies" ON public.governance_policies;
DROP POLICY IF EXISTS "members read active policies" ON public.governance_policies;
CREATE POLICY "governance_policies_select" ON public.governance_policies
  FOR SELECT USING (is_platform_owner() OR status = 'active');
CREATE POLICY "governance_policies_owner_insert" ON public.governance_policies
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "governance_policies_owner_update" ON public.governance_policies
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "governance_policies_owner_delete" ON public.governance_policies
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: policy_rules ============
DROP POLICY IF EXISTS "owner manages policy_rules" ON public.policy_rules;
DROP POLICY IF EXISTS "authenticated reads policy_rules" ON public.policy_rules;
CREATE POLICY "policy_rules_select" ON public.policy_rules
  FOR SELECT USING (is_platform_owner() OR (select auth.uid()) IS NOT NULL);
CREATE POLICY "policy_rules_owner_insert" ON public.policy_rules
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "policy_rules_owner_update" ON public.policy_rules
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "policy_rules_owner_delete" ON public.policy_rules
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: conversations (self-only ALL + owner SELECT bypass) ============
DROP POLICY IF EXISTS "conversations_all_merged" ON public.conversations;
DROP POLICY IF EXISTS "owner reads all conversations" ON public.conversations;
CREATE POLICY "conversations_select" ON public.conversations
  FOR SELECT USING (user_id = (select auth.uid()) OR is_platform_owner());
CREATE POLICY "conversations_self_insert" ON public.conversations
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "conversations_self_update" ON public.conversations
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "conversations_self_delete" ON public.conversations
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============ RESTRUCTURE: messages (self-only ALL + owner SELECT bypass) ============
DROP POLICY IF EXISTS "member manages own messages" ON public.messages;
DROP POLICY IF EXISTS "owner reads all messages" ON public.messages;
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = (select auth.uid()))
    OR is_platform_owner()
  );
CREATE POLICY "messages_self_insert" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = (select auth.uid()))
  );
CREATE POLICY "messages_self_update" ON public.messages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = (select auth.uid()))
  );
CREATE POLICY "messages_self_delete" ON public.messages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = (select auth.uid()))
  );

-- ============ RESTRUCTURE: member_posts (self-only ALL + broadened SELECT) ============
DROP POLICY IF EXISTS "member manages own posts" ON public.member_posts;
DROP POLICY IF EXISTS "members see published posts" ON public.member_posts;
CREATE POLICY "member_posts_select" ON public.member_posts
  FOR SELECT USING (status = 'published' OR user_id = (select auth.uid()));
CREATE POLICY "member_posts_self_insert" ON public.member_posts
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "member_posts_self_update" ON public.member_posts
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "member_posts_self_delete" ON public.member_posts
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============ RESTRUCTURE: member_presence (self-only ALL + open SELECT) ============
DROP POLICY IF EXISTS "member updates own presence" ON public.member_presence;
DROP POLICY IF EXISTS "members see presence" ON public.member_presence;
CREATE POLICY "member_presence_select" ON public.member_presence
  FOR SELECT USING (true);
CREATE POLICY "member_presence_self_insert" ON public.member_presence
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "member_presence_self_update" ON public.member_presence
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "member_presence_self_delete" ON public.member_presence
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============ RESTRUCTURE: activity_feed (self-only ALL + broadened SELECT) ============
DROP POLICY IF EXISTS "member manages own feed" ON public.activity_feed;
DROP POLICY IF EXISTS "members see public feed" ON public.activity_feed;
CREATE POLICY "activity_feed_select" ON public.activity_feed
  FOR SELECT USING (is_public = true OR user_id = (select auth.uid()));
CREATE POLICY "activity_feed_self_insert" ON public.activity_feed
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "activity_feed_self_update" ON public.activity_feed
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "activity_feed_self_delete" ON public.activity_feed
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============ RESTRUCTURE: ai_memory (self-only ALL + owner SELECT bypass) ============
DROP POLICY IF EXISTS "member writes own memory" ON public.ai_memory;
DROP POLICY IF EXISTS "ai_memory_select_merged" ON public.ai_memory;
CREATE POLICY "ai_memory_select" ON public.ai_memory
  FOR SELECT USING (user_id = (select auth.uid()) OR is_platform_owner());
CREATE POLICY "ai_memory_self_insert" ON public.ai_memory
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "ai_memory_self_update" ON public.ai_memory
  FOR UPDATE USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY "ai_memory_self_delete" ON public.ai_memory
  FOR DELETE USING (user_id = (select auth.uid()));

-- ============ RESTRUCTURE: advertisements (owner-only ALL + member submit/read) ============
DROP POLICY IF EXISTS "owner_manage_ads" ON public.advertisements;
DROP POLICY IF EXISTS "member submits own ad" ON public.advertisements;
DROP POLICY IF EXISTS "read_approved_ads" ON public.advertisements;
CREATE POLICY "advertisements_select" ON public.advertisements
  FOR SELECT USING (is_platform_owner() OR status = 'approved' OR submitted_by = (select auth.uid()));
CREATE POLICY "advertisements_insert" ON public.advertisements
  FOR INSERT WITH CHECK (is_platform_owner() OR submitted_by = (select auth.uid()));
CREATE POLICY "advertisements_owner_update" ON public.advertisements
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "advertisements_owner_delete" ON public.advertisements
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: platform_settings (owner-only ALL + public read) ============
DROP POLICY IF EXISTS "ps_write" ON public.platform_settings;
DROP POLICY IF EXISTS "platform_settings_read" ON public.platform_settings;
CREATE POLICY "platform_settings_select" ON public.platform_settings
  FOR SELECT USING (true);
CREATE POLICY "platform_settings_owner_insert" ON public.platform_settings
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "platform_settings_owner_update" ON public.platform_settings
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "platform_settings_owner_delete" ON public.platform_settings
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: threat_events (owner-only ALL + member self-insert) ============
DROP POLICY IF EXISTS "owner manages threats" ON public.threat_events;
DROP POLICY IF EXISTS "insert threat events" ON public.threat_events;
CREATE POLICY "threat_events_select" ON public.threat_events
  FOR SELECT USING (is_platform_owner());
CREATE POLICY "threat_events_insert" ON public.threat_events
  FOR INSERT WITH CHECK (is_platform_owner() OR user_id = (select auth.uid()));
CREATE POLICY "threat_events_owner_update" ON public.threat_events
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "threat_events_owner_delete" ON public.threat_events
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: feature_flags (owner-only ALL + authenticated-only read, scope preserved) ============
DROP POLICY IF EXISTS "owner manages flags" ON public.feature_flags;
DROP POLICY IF EXISTS "members read flags" ON public.feature_flags;
CREATE POLICY "feature_flags_select" ON public.feature_flags
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "feature_flags_owner_insert" ON public.feature_flags
  FOR INSERT WITH CHECK (is_platform_owner());
CREATE POLICY "feature_flags_owner_update" ON public.feature_flags
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "feature_flags_owner_delete" ON public.feature_flags
  FOR DELETE USING (is_platform_owner());

-- ============ RESTRUCTURE: platform_metrics (owner-only ALL + authenticated-only insert, scope preserved) ============
DROP POLICY IF EXISTS "owner reads metrics" ON public.platform_metrics;
DROP POLICY IF EXISTS "member inserts metrics" ON public.platform_metrics;
CREATE POLICY "platform_metrics_select" ON public.platform_metrics
  FOR SELECT USING (is_platform_owner());
CREATE POLICY "platform_metrics_insert" ON public.platform_metrics
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "platform_metrics_owner_update" ON public.platform_metrics
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());
CREATE POLICY "platform_metrics_owner_delete" ON public.platform_metrics
  FOR DELETE USING (is_platform_owner());
