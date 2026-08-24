-- ============================================================================
-- Ω AUTHENTICATED EXECUTE HARDENING -- the deliberately small half
--
-- Companion to omega_anon_execute_hardening.sql. That file closed the
-- unauthenticated surface (23 anon-executable SECURITY DEFINER functions -> 2).
-- This one addresses the advisor's other 93 findings:
-- `authenticated_security_definer_function_executable`.
--
-- WHY THIS FILE IS THREE LINES AND NOT NINETY-THREE
--
-- The advisor reports every SECURITY DEFINER function `authenticated` can
-- execute. It cannot see whether a function guards itself internally, so the
-- count reads far worse than the real exposure. Reading the actual bodies on
-- production, the owner-sensitive ones are already guarded -- they just do it
-- through `public.omega_is_owner()`, e.g.
--
--     get_pending_requests():
--       if not public.omega_is_owner() then
--         raise exception 'Not authorised.' using errcode = '42501';
--
-- A first-pass classifier here searched only for `is_platform_owner`,
-- `auth.uid()` and `auth.role()`, and therefore reported get_pending_requests
-- and engagement_report as unguarded. Both are fine. That is CLAUDE.md §8.4's
-- rule restated: classifying a function by substring is not reading it, and a
-- scanner needs its own false-positive pass before its number means anything.
--
-- Of the genuinely unguarded remainder, most are unguarded on purpose:
--   published_dispatches  -- body is `WHERE is_published = true`
--   public_leaderboard    -- a leaderboard
--   order_stats           -- aggregate counts, no per-member rows
--   get_platform_flag     -- one flag value
-- and each has a real caller. Revoking them would break member-facing pages to
-- clear an advisor line, which is security theatre, not security.
--
-- That leaves exactly three: unguarded AND called by nothing in this repo.
-- Unused code that only adds attack surface is the one case where revoking is
-- free, so those three are removed from the REST surface entirely.
--
-- SEPARATELY VERIFIED, AND THE REASON THIS FILE IS NOT LARGER
--
-- The question that actually matters for leaks is not "how many functions can
-- a member call" but "can one member read another's rows". Tested directly on
-- production by impersonating a real non-owner member
-- (set_config('request.jwt.claims', ...) per CLAUDE.md §8.4) across 17
-- member-data tables and comparing against privileged counts: every populated
-- table came back scoped -- 0 of 24 certificates, 0 of 69 ledger rows, 0 of 10
-- task_completions, 0 of 24 trophies, 0 of 24 medals, 0 of 3 exam_results.
-- `profiles` is `((SELECT auth.uid()) = id) OR is_platform_owner()`, so a
-- member reads only their own row and no member email is reachable by another
-- member. RLS is doing its job; the remaining advisor count is noise, not leak.
-- ============================================================================

-- get_activity_feed -- joins activity_feed to profiles and returns every
-- member's display_name, element and activity. The only cross-member read path
-- in the authenticated surface, and nothing calls it.
REVOKE EXECUTE ON FUNCTION public.get_activity_feed(integer, integer) FROM PUBLIC, anon, authenticated;

-- get_capability_health -- internal capability registry: health status,
-- lifecycle state, SLO p95 timings. Operational detail, not member-facing.
REVOKE EXECUTE ON FUNCTION public.get_capability_health() FROM PUBLIC, anon, authenticated;

-- log_evolution -- a write. It delegates to complete_task, which is
-- auth.uid()-scoped, so this was never a spoofing hole -- but an uncalled
-- write endpoint is still surface.
REVOKE EXECUTE ON FUNCTION public.log_evolution(text, text) FROM PUBLIC, anon, authenticated;

-- Revoked from PUBLIC as well as the named roles: PUBLIC is where
-- CREATE FUNCTION puts the default grant, and revoking only the named role
-- leaves it reachable by inheritance. See the companion file's header for the
-- full version of that mistake.
