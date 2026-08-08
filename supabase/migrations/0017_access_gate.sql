-- ============================================================================
-- SYD OMEGA 91717 -- ACCESS APPROVAL GATE (idempotent; safe to re-run)
-- PREREQUISITE: run omega_backend_sync.sql (or the full omega_master_deploy.sql,
-- which includes it) FIRST. This file only ALTERs public.profiles -- it does
-- not create the table, so running it before the base schema exists will fail
-- with "relation public.profiles does not exist".
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_approved boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS access_requested_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Standard owner check used across the whole project (search_path pinned to
-- avoid search_path-hijack on a SECURITY DEFINER function). If this project
-- already ran omega_master_deploy.sql, this CREATE OR REPLACE is a no-op --
-- same name, same body.
-- Recursion-safe owner check.
-- profiles RLS policies call is_platform_owner(); if this function read
-- public.profiles it would re-trigger those policies -> "infinite recursion
-- detected in policy for relation profiles" -> every page breaks.
-- platform_owners is a tiny RLS-free lookup table that breaks that loop.
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false)=true
  ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;
GRANT EXECUTE ON FUNCTION public.is_platform_owner() TO authenticated;

-- Back-compat wrapper: some earlier files (refinements.sql) were written
-- against is_app_owner() instead of is_platform_owner(). Kept as a thin
-- pass-through rather than a second, independently-maintained copy of the
-- same check, so there is exactly one place the actual logic lives. New SQL
-- in this project should call is_platform_owner() directly.
CREATE OR REPLACE FUNCTION public.is_app_owner()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT public.is_platform_owner();
$$;
GRANT EXECUTE ON FUNCTION public.is_app_owner() TO authenticated;

-- owner may read & update ALL profiles (members keep their own-row policies)
DROP POLICY IF EXISTS "owner reads profiles" ON public.profiles;
CREATE POLICY "owner reads profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_platform_owner());
DROP POLICY IF EXISTS "owner updates profiles" ON public.profiles;
CREATE POLICY "owner updates profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_platform_owner()) WITH CHECK (true);

COMMIT;

-- ANOINT + ADMIT YOURSELF so you are never locked out. Replace the email,
-- then run this line separately (outside the transaction above, after COMMIT):
-- update public.profiles set is_owner=true, access_approved=true where id=(select id from auth.users where email='YOUR_EMAIL_HERE');
