-- PROPOSED, NOT APPLIED. See PLAN.md in this directory.
--
-- Owner authority requires AAL2 when, and only when, owner_mfa_required is on.
-- Both flags are seeded false, so applying this changes nothing observable:
-- is_platform_owner() returns exactly what it does today until a human sets
-- owner_mfa_required = true. Do that only after PLAN.md's success criterion 3
-- returns 0 rows and phase 2 (the 24 direct owner checks) has landed.
--
-- Break-glass: in the Supabase SQL editor,
--   UPDATE public.platform_settings SET bool_value = false
--    WHERE key = 'owner_mfa_required';
--
-- When applied, move it to supabase/migrations/<applied version>_owner_mfa_enforcement.sql
-- and append the version to supabase/remote-migrations.json.

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
