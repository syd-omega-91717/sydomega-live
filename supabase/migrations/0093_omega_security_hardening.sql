-- SYD OMEGA 91717 — production security hardening
--
-- 0092 introduced owner-gated SECURITY DEFINER member-status RPCs and
-- notification writes. This migration tightens the privilege boundary:
-- anonymous clients do not need these administrative RPCs, and every
-- SECURITY DEFINER function gets an explicit search_path so object resolution
-- cannot be influenced by caller-controlled schemas.

BEGIN;

REVOKE EXECUTE ON FUNCTION public.approve_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.grant_permanent_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.revoke_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.extend_trial(uuid, integer) FROM anon;

ALTER FUNCTION public.approve_member(uuid) SET search_path = public;
ALTER FUNCTION public.grant_permanent_access(uuid) SET search_path = public;
ALTER FUNCTION public.reject_member(uuid) SET search_path = public;
ALTER FUNCTION public.revoke_member(uuid) SET search_path = public;
ALTER FUNCTION public.extend_trial(uuid, integer) SET search_path = public;

-- The owner check is the authorization boundary. Keep execution available to
-- authenticated clients so the RPC can be called through PostgREST, while the
-- function itself rejects non-owner callers.
GRANT EXECUTE ON FUNCTION public.approve_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.grant_permanent_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.extend_trial(uuid, integer) TO authenticated;

COMMIT;
