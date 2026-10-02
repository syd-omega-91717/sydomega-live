-- private.omega_is_owner(): one owner gate, not two.
--
-- It returned public.is_platform_owner() OR a fallback read of
-- profiles.is_owner. Nine owner functions (grant_trial_access,
-- get_pending_requests, revoke_permanent_access, expire_trial, ...) and the
-- daily_engagement_self_read policy call it, so any rule added to
-- is_platform_owner() -- the proposed AAL2 requirement in
-- docs/decisions/owner-mfa/ -- was bypassed by the fallback.
--
-- Measured live 2026-09-26 before applying: profiles.is_owner (2) and
-- platform_owners (2) hold the identical set (0 rows in only one), kept in
-- sync by trg_sync_platform_owner. The fallback therefore changes no result
-- today; it only ever mattered as a bypass.
CREATE OR REPLACE FUNCTION private.omega_is_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT coalesce(public.is_platform_owner(), false);
$function$;
