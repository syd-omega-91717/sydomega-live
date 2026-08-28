-- SYD OMEGA 91717 security execute hardening
-- Keep privileged SECURITY DEFINER RPCs callable by authenticated owners where
-- the existing product contract requires them, but never expose the owner
-- predicate itself to anonymous callers.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.is_platform_owner() FROM anon;
COMMENT ON FUNCTION public.is_platform_owner() IS
  'Internal authorization predicate. Anonymous EXECUTE is intentionally revoked; owner-gated SECURITY DEFINER operations use it internally.';
COMMIT;
