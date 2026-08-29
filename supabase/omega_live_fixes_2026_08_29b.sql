-- ============================================================================
-- omega_live_fixes_2026_08_29b.sql
--
-- APPLIED LIVE to project ydqhzvvoyufiiqvzcjns and verified by role
-- impersonation before being written here. Recorded in the flat bag because
-- the bag is the source of truth for new schema changes (CLAUDE.md 5).
--
-- HOW IT WAS FOUND: every RLS-enabled public table carrying a `user_id` column
-- was counted twice -- once privileged, once while impersonating a real
-- non-owner approved member (set_config('role','authenticated') +
-- request.jwt.claims, the shape PostgREST actually produces). Empty tables were
-- skipped, since both counts are 0 there and prove nothing. One table returned
-- the same count to a non-owner as to a superuser: public.dispatches.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- `dispatches` -- a policy whose own gate was cancelled by its third branch.
--
-- The SELECT policy read:
--
--   (is_published = true)
--   OR is_platform_owner()
--   OR ((SELECT auth.role()) = 'authenticated')
--
-- The third branch is true for EVERY signed-in member, which makes the first
-- branch dead: `is_published` gated nothing, and an unpublished draft was
-- readable platform-wide. This is CLAUDE.md 8.4's "classifying a policy by
-- substring is not reading it" -- a scanner looking for `is_published` or for
-- `is_platform_owner` would call this policy correctly scoped. It is the full
-- qual that decides.
--
-- Nothing was actually exposed at the time of the fix: the table held exactly
-- one row and it was published. That is precisely why it was fixed then --
-- zero blast radius, and the gap closes before the first draft is ever written.
--
-- The blanket branch was standing in for an author branch, so that is what
-- replaces it. Write policies were already correct
-- (user_id = auth.uid() OR is_platform_owner() on INSERT/UPDATE/DELETE) and are
-- left untouched.
--
-- VERIFIED LIVE on a real seeded draft owned by member A -- both cases return 0
-- against a table with no drafts and would have proved nothing:
--   member B sees A's draft   -> 0   (was: 1)
--   member B total rows       -> 1   (the published one only)
--   author A sees own draft   -> 1
--   owner sees all rows       -> 2
--   probe draft rolled back; dispatches left at its original 1 row.

DROP POLICY IF EXISTS dispatches_select ON public.dispatches;
CREATE POLICY dispatches_select ON public.dispatches
  FOR SELECT
  USING (
    is_published = true
    OR public.is_platform_owner()
    OR user_id = (SELECT auth.uid())
  );


-- ----------------------------------------------------------------------------
-- REVIEWED AND DELIBERATELY NOT CHANGED
--
-- The same sweep found five more SELECT policies with `USING (true)` on tables
-- that carry a user_id. None is the dispatches shape, because none of them has
-- a visibility gate for the blanket branch to cancel -- they are read-only
-- social surfaces that are meant to be visible to every member:
--
--   leaderboard_snapshots  "all members see leaderboard"
--   member_events          activity feed
--   member_presence        who is currently online
--   oaths                  commented in its own file as a transparent ledger,
--                          and loadOaths() reads all members' oaths by design
--   platform_owners        who the owners are
--
-- Narrowing any of these is a product decision about what members may see of
-- each other, not a bug fix, so they are recorded as reviewed rather than
-- "left broken".
--
-- Five privilege-granting SECURITY DEFINER functions were also re-tested by
-- impersonation and are correctly guarded. Worth recording because they LOOK
-- unguarded to an exception-based test: they RETURN a refusal payload instead
-- of raising, so `PERFORM fn(...)` inside a BEGIN/EXCEPTION block completes
-- without error and reads as success. The return value is the only evidence:
--   approve_member     -> {"ok": false, "error": "forbidden"}
--   extend_trial       -> {"ok": false, "error": "forbidden"}
--   apply_subscription -> {"ok": false, "error": "forbidden"}
--   academy_promote    -> {"ok": false, "error": "owner_only"}
--   award_token        -> {"ok": false, "note": "economy disabled until legal
--                          sign-off"}  (the tokens_enabled gate, CLAUDE.md 5)
-- ----------------------------------------------------------------------------
