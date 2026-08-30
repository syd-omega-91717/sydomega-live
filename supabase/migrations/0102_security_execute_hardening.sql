-- SYD OMEGA 91717 security execute hardening
-- PUBLIC is an implicit PostgreSQL grant path. Revoking only from anon is
-- insufficient when PUBLIC still has EXECUTE. Keep the owner predicate
-- available to authenticated owner-gated operations, never anonymously.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.is_platform_owner() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;
COMMENT ON FUNCTION public.is_platform_owner() IS
  'Internal authorization predicate. PUBLIC/anonymous EXECUTE is revoked; authenticated owner-gated operations may use it internally.';
COMMIT;
