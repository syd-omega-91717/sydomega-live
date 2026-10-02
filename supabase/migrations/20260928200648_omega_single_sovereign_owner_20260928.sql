-- Ω single sovereign owner boundary
-- The canonical owner identity is the pre-existing owner account used by
-- the project's owner bootstrap/notification migrations. The secondary auth
-- account remains intact but loses owner authorization.
DO $$
DECLARE
  canonical_owner uuid;
BEGIN
  SELECT id INTO canonical_owner
  FROM auth.users
  WHERE lower(email) = 's.y.dagher@gmail.com'
  LIMIT 1;

  IF canonical_owner IS NULL THEN
    RAISE EXCEPTION 'canonical owner account not found';
  END IF;

  UPDATE public.profiles
  SET is_owner = false
  WHERE is_owner = true
    AND id <> canonical_owner;

  UPDATE public.profiles
  SET is_owner = true
  WHERE id = canonical_owner;

  DELETE FROM public.platform_owners
  WHERE user_id <> canonical_owner;

  INSERT INTO public.platform_owners(user_id)
  VALUES (canonical_owner)
  ON CONFLICT (user_id) DO NOTHING;

  IF (SELECT count(*) FROM public.profiles WHERE is_owner = true) <> 1 THEN
    RAISE EXCEPTION 'owner invariant failed: profiles.is_owner must contain exactly one row';
  END IF;

  IF (SELECT count(*) FROM public.platform_owners) <> 1 THEN
    RAISE EXCEPTION 'owner invariant failed: platform_owners must contain exactly one row';
  END IF;
END $$;