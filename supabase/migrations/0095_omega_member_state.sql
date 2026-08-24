-- ============================================================================
-- Ω MEMBER STATE -- server-side mirror for browser-local member data.
--
-- WHY THIS EXISTS
--
-- scripts/evidence-audit.py classifies 48 of this platform's 178 pages as
-- LOCAL_ONLY: they write member data with localStorage.setItem and make no
-- table, RPC, or Edge Function call at all. 43 of those have no export path
-- either. A member who clears their cache, switches device, or uses a private
-- window loses every achievement, note, target, reading log and workout they
-- ever recorded, with no way to get any of it back and no copy the owner can
-- see.
--
-- Only the 7 finance pages were a deliberate decision (CLAUDE.md §8.2); the
-- other 41 were never chosen, they just accumulated. This table closes that.
--
-- WHAT THIS IS AND IS NOT
--
-- It is a MIRROR, not the source of truth. omega-state.js copies each
-- localStorage write up here; it never silently writes back down. That
-- asymmetry is deliberate: a page renders from localStorage synchronously at
-- DOMContentLoaded, while any server read is async, so a hydrating sync would
-- race the page's own render -- the page paints empty, the member types, and
-- that empty-derived write clobbers good server data. Restoring is therefore
-- an explicit member action (omega-local-backup.js), never automatic.
--
-- Consequence: this cannot lose data that localStorage already holds. The
-- worst failure mode is a mirror row that is staler than the browser, which
-- is exactly the failure mode of any backup.
--
-- SHAPE
--
-- Deliberately one row per (member, key) rather than one JSON blob per member:
-- the primary key IS the upsert conflict target. CLAUDE.md §8.1 class 7 --
-- an upsert whose conflict target matches no unique index -- has bitten this
-- repo four separate times, in both directions (a named onConflict with no
-- index raises 42P10; an omitted one defaults to the PK and raises 23505
-- forever after the first write). Making the natural key the primary key
-- means the conflict target cannot drift away from the index.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.member_state (
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key         text        NOT NULL,
  value       jsonb       NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, key)
);

COMMENT ON TABLE public.member_state IS
  'Server-side mirror of browser-local member data. Written by omega-state.js '
  'on every localStorage write; read back only on an explicit member restore. '
  'Not the source of truth -- see supabase/omega_member_state.sql.';

-- Every RLS policy on this platform filters on user_id; without this index
-- each policy check is a sequential scan. The PK covers (user_id, key) so
-- user_id-only lookups already use it as a prefix -- no separate index needed.

ALTER TABLE public.member_state ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- POLICIES. A member reaches only their own rows.
--
-- Note what is NOT here: the owner is deliberately given no read policy on
-- this table. is_platform_owner() grants elevated read across most of this
-- schema, but this table holds members' private mood logs, journals, body
-- measurements and finances, mirrored without them opting in per-page. Giving
-- the owner a blanket read would silently widen what the owner can see
-- compared to what these pages exposed yesterday, which is a privacy decision
-- for a human to make, not a side effect of adding a backup. Add it later if
-- it is actually wanted.
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS member_state_select_own ON public.member_state;
CREATE POLICY member_state_select_own ON public.member_state
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS member_state_insert_own ON public.member_state;
CREATE POLICY member_state_insert_own ON public.member_state
  FOR INSERT TO authenticated
  -- Scoped, not WITH CHECK(true): an unscoped check on a table carrying a
  -- user_id is the spoofing shape in CLAUDE.md §8.1 class 6(b), and
  -- platform_events/platform_metrics still carry it.
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS member_state_update_own ON public.member_state;
CREATE POLICY member_state_update_own ON public.member_state
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS member_state_delete_own ON public.member_state;
CREATE POLICY member_state_delete_own ON public.member_state
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- GRANTS. Checked BEFORE row security, so a policy without a grant never runs
-- and every query fails 42501 -- the most expensive class in this repo's
-- history (CLAUDE.md §8.1 class 6; 60 tables were in that state, and a live
-- probe during this change found conversations, messages, knowledge_nodes,
-- knowledge_edges and subscriptions still are). Granting here is not optional.
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_state TO authenticated;

-- anon gets nothing: this table is only ever reached by a signed-in member.
REVOKE ALL ON public.member_state FROM anon;
