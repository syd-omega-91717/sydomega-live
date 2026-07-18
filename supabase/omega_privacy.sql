-- ============================================================================
-- SYD OMEGA 91717 -- PROFILE PRIVACY
-- Every profile is PRIVATE by default: only the member and the Sovereign owner
-- can read it. A member may choose to make their own profile public. The
-- founder's profile is private unless he opts in. Non-recursive RLS.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

-- rebuild the SELECT policy: self OR owner OR explicitly-public ---------------
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR public.is_platform_owner()
    OR is_public = true
  );

-- a member toggles ONLY their own visibility --------------------------------
CREATE OR REPLACE FUNCTION public.set_profile_visibility(p_public boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  UPDATE public.profiles SET is_public = COALESCE(p_public, false) WHERE id = auth.uid();
  RETURN jsonb_build_object('ok', true, 'is_public', COALESCE(p_public, false));
END;
$$;
GRANT EXECUTE ON FUNCTION public.set_profile_visibility(boolean) TO authenticated;

-- founder stays private by default (opt-in only) ----------------------------
UPDATE public.profiles SET is_public = false WHERE is_owner = true AND is_public IS NULL;

COMMIT;
