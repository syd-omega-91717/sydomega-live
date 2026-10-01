-- Ω SYD OMEGA 91717
-- Production security boundary: anonymous clients must not execute public-schema
-- functions implicitly. Sensitive/privileged RPCs remain available only to
-- explicitly granted roles. Public read experiences should use RLS-protected
-- tables/views or dedicated invoker functions.
--
-- This migration intentionally revokes EXECUTE from anon for every existing
-- function in public. No new anonymous RPC allowlist is created here.
-- Any future anonymous RPC must be introduced with an explicit, reviewed grant.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name,
           p.oid::regprocedure AS function_identity
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format(
      'REVOKE EXECUTE ON FUNCTION %s FROM anon',
      r.function_identity
    );
  END LOOP;
END
$$;

COMMENT ON SCHEMA public IS
  'Ω production policy: anonymous EXECUTE on public-schema functions is deny-by-default; reviewed RPCs require explicit grants.';
