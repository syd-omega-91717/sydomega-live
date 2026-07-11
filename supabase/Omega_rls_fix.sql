-- ============================================================================
-- SYD OMEGA 91717 -- RLS RECURSION RESET (definitive fix for 42P17 on save)
-- Over many migrations, the profiles table accumulated several RLS policies,
-- and at least one still queries profiles from inside the owner-check, causing
-- infinite recursion (42P17). This wipes EVERY policy on profiles and rebuilds
-- one clean, non-recursive set, with the owner-check reading a small RLS-free
-- lookup table (platform_owners) instead of profiles. Safe + idempotent.
-- Run this whole file in Supabase -> SQL Editor -> Run.
-- ============================================================================
BEGIN;

-- 1) RLS-free lookup of who the owner is (only owner user-ids) ---------------
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false) = true
  ON CONFLICT DO NOTHING;

-- 2) owner-check reads the lookup -- NEVER profiles -> cannot recurse --------
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

-- 3) DROP EVERY existing policy on profiles + platform_owners ----------------
--    (removes any accumulated / recursive policy from earlier migrations)
DO $reset$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='platform_owners' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_owners', r.policyname);
  END LOOP;
END $reset$;

-- 4) clean, non-recursive policies ------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_owner())
  WITH CHECK (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

-- 5) keep the lookup in sync when is_owner changes --------------------------
CREATE OR REPLACE FUNCTION public.sync_platform_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_owner,false) THEN
    INSERT INTO public.platform_owners(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.platform_owners WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_platform_owner ON public.profiles;
CREATE TRIGGER trg_sync_platform_owner
  AFTER INSERT OR UPDATE OF is_owner ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_platform_owner();

COMMIT;

-- verify (run after): should list EXACTLY these 3 profiles policies ----------
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','platform_owners')
ORDER BY tablename, policyname;
