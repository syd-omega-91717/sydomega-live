-- Owner authority requires AAL2 when, and only when, owner_mfa_required is on.
-- APPLIED LIVE 2026-09-26, DORMANT: both flags are seeded false, so
-- is_platform_owner() returns exactly what it did before (verified: owner t,
-- member f). Decision record: docs/decisions/owner-mfa/PLAN.md.
--
-- Turn on only after every owner holds a verified factor (PLAN.md success
-- criterion 3 returns 0 rows). omega_is_owner() already defers only to this
-- function (20260926102450), so enforcement covers every owner path.
--
-- Break-glass: in the Supabase SQL editor,
--   UPDATE public.platform_settings SET bool_value = false
--    WHERE key = 'owner_mfa_required';

INSERT INTO public.platform_settings(key, bool_value)
VALUES ('mfa_enrolment_enabled', false), ('owner_mfa_required', false)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION private.is_platform_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path = 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid())
     AND (
       NOT private.get_platform_flag('owner_mfa_required')
       OR coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
     );
$function$;
