-- ============================================================================
-- Ω ANON EXECUTE HARDENING -- close the unauthenticated RPC surface
--
-- WHY THIS EXISTS
--
-- Supabase's security advisor reports 23 SECURITY DEFINER functions in `public`
-- that the `anon` role can execute. `anon` is not "nobody": it is the role the
-- publishable/anon key maps to, and that key ships in client code by design
-- (bg.js). Anything `anon` can EXECUTE is reachable by anyone on the internet
-- via POST /rest/v1/rpc/<name>, with no account and no invite.
--
-- Ten of those 23 carry no internal authorization check of their own. The
-- serious ones:
--
--   notify_member(p_user_id, p_type, p_message, p_content)
--       Writes a notification, with attacker-chosen body, to any member's id.
--       A phishing surface inside the platform's own trusted UI.
--   upsert_graph_entity(p_user_id, ...)  /  add_graph_relationship(p_user_id, ...)
--       Both take the owning user id as a parameter and write rows attributed
--       to it. Unauthenticated write-as-anyone. Both are also SECURITY DEFINER
--       with a mutable search_path (see part 2).
--   log_evolution(p_axis, p_note)
--       Unauthenticated arbitrary row insert.
--   order_stats()
--       Returns commerce aggregates to unauthenticated callers.
--
-- Postgres grants EXECUTE to PUBLIC automatically on CREATE FUNCTION, so this
-- state is the default that arrives on its own every time a function is created
-- or replaced -- which is why an earlier pass
-- (migrations/20260818000551_revoke_anon_execute_and_harden_search_path.sql)
-- revoked 70 of these and 23 are back. CLAUDE.md §8.1 class 6(a) records the
-- same trap: a narrowing GRANT is decorative unless the default is revoked.
--
-- REVOKE FROM PUBLIC, NOT FROM anon. This matters and is easy to get wrong:
-- the privilege was never granted to `anon` individually, it was granted to
-- PUBLIC, and `anon` merely inherits it. `REVOKE ... FROM anon` therefore
-- removes a grant that does not exist and silently changes nothing. The first
-- draft of this very file made exactly that mistake; it was caught by running
-- the whole script against the live database inside a transaction and
-- re-checking has_function_privilege('anon', ...) before rolling back -- the
-- count came back completely unchanged at 24. Revoke from PUBLIC, then grant
-- back deliberately to the roles that actually need it.
--
-- WHAT IS DELIBERATELY LEFT REACHABLE BY anon
--
-- Revoking blindly would break signed-out pages, so each was checked against
-- real client callers before being included:
--
--   report_client_error  -- KEPT. bg.js installs the error reporter on every
--                           page, including the public ones (account, enter,
--                           reset, terms, pending, index, 404, offline). Taking
--                           this away blinds error reporting exactly where a
--                           signed-out member hits a problem. It has its own
--                           internal guard.
--   is_platform_owner    -- KEPT. It is called from inside RLS policies across
--                           the schema. Policy evaluation happens in the
--                           caller's role, so revoking anon's EXECUTE risks
--                           breaking policy evaluation for anonymous requests
--                           rather than merely denying an RPC. It is a
--                           predicate that already returns false for anon.
--
-- Neither is named below, so neither is touched.
--
-- This does NOT narrow `authenticated`. That is a separate, larger decision
-- (93 more advisor findings) needing each function checked against member-facing
-- callers; doing both at once would make any breakage impossible to attribute.
--
-- Trigger functions are unaffected by revoking EXECUTE: a trigger fires as the
-- table owner, not as the requesting role, so _notify_approved and friends keep
-- working while ceasing to be callable directly over the REST API.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART 1 -- take EXECUTE away from PUBLIC, then hand it back on purpose
--
-- Every function below is revoked from PUBLIC (which is what actually removes
-- anon's access) and then granted only to the role a real caller uses. The
-- caller for each was checked in this repo before deciding; "no caller" means
-- no client page, module, or Edge Function references it at all, so it gets
-- no grant back.
-- ---------------------------------------------------------------------------

-- === No caller anywhere. Unguarded. These get nothing back. ===
REVOKE EXECUTE ON FUNCTION public.notify_member(uuid, text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.log_evolution(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.upsert_graph_entity(uuid, text, text, text, text, jsonb, numeric, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_graph_relationship(uuid, uuid, uuid, text, numeric, numeric, text) FROM PUBLIC, anon;

-- === Trigger functions. Fire as the table owner; never called over REST. ===
REVOKE EXECUTE ON FUNCTION public._notify_approved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._notify_owner_member_approved() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public._notify_owner_member_rejected() FROM PUBLIC, anon;

-- === Signed-in member callers. Keep `authenticated`, drop everyone else. ===
-- order_stats -> hall.html (gated)
REVOKE EXECUTE ON FUNCTION public.order_stats() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.order_stats() TO authenticated;

-- public_leaderboard -> hall.html (gated). Named "public_" but its only caller
-- is a gated page. If a genuinely public leaderboard is ever wanted, re-granting
-- anon is a deliberate one-line change rather than an accident of the default.
REVOKE EXECUTE ON FUNCTION public.public_leaderboard(integer) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.public_leaderboard(integer) TO authenticated;

-- get_platform_flag -> interface-omni.html (gated) + one Edge Function
REVOKE EXECUTE ON FUNCTION public.get_platform_flag(text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_platform_flag(text) TO authenticated, service_role;

-- get_all_members -> approvals.html, profile.html, omega-user.js
REVOKE EXECUTE ON FUNCTION public.get_all_members() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.get_all_members() TO authenticated;

-- complete_task -> publishing.html + 4 omega-* modules
REVOKE EXECUTE ON FUNCTION public.complete_task(text, text, text, text, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.complete_task(text, text, text, text, numeric) TO authenticated;

-- check_gate -> omega-guardian.js
REVOKE EXECUTE ON FUNCTION public.check_gate(text, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_gate(text, numeric) TO authenticated;

-- record_interest_signal -> omega-recommend.js
REVOKE EXECUTE ON FUNCTION public.record_interest_signal(text, text, text, text, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.record_interest_signal(text, text, text, text, numeric) TO authenticated;

-- === Owner-only membership and access control. No client caller found; the
-- owner reaches these while authenticated, and each keeps its internal guard. ===
REVOKE EXECUTE ON FUNCTION public.approve_member(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.approve_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_member(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.reject_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.revoke_member(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.revoke_member(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.grant_permanent_access(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.grant_permanent_access(uuid) TO authenticated;

-- === Server-side only. Invoked by Edge Functions under service_role. ===
-- authenticated is kept on apply_subscription because the existing definition
-- already grants it and the function raises for any caller that is neither
-- service_role nor owner; removing it here would be a behaviour change
-- smuggled into a security fix.
REVOKE EXECUTE ON FUNCTION public.apply_subscription(uuid, text, text, timestamptz, text) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.apply_subscription(uuid, text, text, timestamptz, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.queue_weekly_digest(uuid) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.queue_weekly_digest(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.send_weekly_digests() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.send_weekly_digests() TO service_role;

-- ---------------------------------------------------------------------------
-- PART 2 -- pin search_path on the functions that lack it
--
-- A SECURITY DEFINER function with a mutable search_path resolves unqualified
-- names using the CALLER's search_path while running with the DEFINER's
-- privileges. A caller who can create objects in a schema earlier on that path
-- can shadow a table or operator the function references and have it executed
-- as the definer. Pinning the path removes that entirely.
--
-- pg_temp is placed last deliberately: it is always implicitly searched first
-- unless named, so naming it last is what actually pushes it to the end.
-- ---------------------------------------------------------------------------
ALTER FUNCTION public.upsert_graph_entity(uuid, text, text, text, text, jsonb, numeric, text)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.add_graph_relationship(uuid, uuid, uuid, text, numeric, numeric, text)
  SET search_path = public, pg_temp;

-- These three are SECURITY INVOKER, so the escalation above does not apply --
-- pinned anyway for consistency and to clear the advisor finding.
ALTER FUNCTION public.find_graph_paths(uuid, uuid, uuid, integer)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.graph_entity_centrality(uuid)
  SET search_path = public, pg_temp;
ALTER FUNCTION public.notify_achievement(text, integer)
  SET search_path = public, pg_temp;
