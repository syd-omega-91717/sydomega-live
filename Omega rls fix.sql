-- ============================================================================
-- SYD OMEGA 91717 -- RLS RECURSION FIX (error 42P17 on profile save)
-- The profiles policies call is_platform_owner(), which read from profiles,
-- which re-triggered the profiles policy -> infinite recursion (42P17). This
-- moves the owner check to a tiny RLS-free lookup table so the loop is broken,
-- while the founder keeps full owner-sees-all access. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- 1) RLS-free lookup of who the owner is (contains only owner user-ids) -------
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false)=true
  ON CONFLICT DO NOTHING;
ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_owners_read ON public.platform_owners;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

-- 2) keep it in sync whenever a profile's is_owner flag changes ---------------
CREATE OR REPLACE FUNCTION public.sync_platform_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
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

-- 3) owner check now reads the RLS-free table -- never profiles -> no recursion
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

COMMIT;
