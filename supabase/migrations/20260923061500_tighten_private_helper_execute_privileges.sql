-- Ω SYD OMEGA 91717 — tighten private helper execution
-- These helpers are internal building blocks and have no repository call site
-- that requires direct PostgREST invocation. Remove client-role EXECUTE so
-- their SECURITY DEFINER privilege boundary is narrower.
BEGIN;

REVOKE EXECUTE ON FUNCTION private.get_platform_flag(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION private.is_app_owner() FROM PUBLIC, anon, authenticated;

COMMIT;
