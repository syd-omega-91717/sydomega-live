-- ============================================================================
-- SYD OMEGA 91717 -- OWNER APEX LOCK
-- Sets Major Sleiman Youssef Dagher to absolute apex on every dimension.
-- Run this in the Supabase SQL editor after all migrations complete.
-- ============================================================================

-- Step 1: ensure the owner flag is set by email
UPDATE public.profiles SET is_owner = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE lower(email) IN ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')
);

-- Step 2: set ALL dimensions to apex
UPDATE public.profiles SET
  -- Matrix position: absolute apex
  axis_a             = 9.000,
  axis_b             = 9.000,
  axis_c             = 9.000,
  authority          = 27.8367,   -- sqrt(729+729+729)*phi/e  nodes_earned       = 104976,    -- 12x12x9x9x9 complete

  -- Achievements: all 12 of each
  certificates_earned = 12,
  trophies_earned     = 12,
  medals_earned       = 12,
  -- Access: full permanent sovereign access
  access_approved     = true,
  is_owner            = true,
  is_trial            = false,
  trial_expires_at    = NULL,
  is_rejected         = false,

  -- Cosmology (Aries / Fire / Ares / Sentinel / PYRON)
  sign               = 'Aries',
  element            = 'fire',
  god                = 'Ares',
  agent              = 'Sentinel',
  -- Subscription: permanent sovereign tier
  subscription_tier  = 'sovereign',
  updated_at          = now()
WHERE is_owner = true;

-- Step 3: award achievements via trophies table (uses actual schema)
DO $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT id INTO owner_id FROM public.profiles WHERE is_owner=true LIMIT 1;
  IF owner_id IS NULL THEN RETURN; END IF;

  -- trophies: trophy_num, medal_num, cert_num columns
  FOR i IN 1..12 LOOP
    INSERT INTO public.trophies (user_id, trophy_num, cert_num, earned_at)
    VALUES (owner_id, i, i, now())
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- medals: medal_num column
  FOR i IN 1..12 LOOP
    INSERT INTO public.medals (user_id, medal_num, earned_at)
    VALUES (owner_id, i, now())
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- certificates: title only (cert_num via trophies above)
  FOR i IN 1..12 LOOP
    BEGIN
      INSERT INTO public.certificates (user_id, title, issued_at)
      VALUES (owner_id, 'Sovereign Certificate '||i::text, now());
    EXCEPTION WHEN OTHERS THEN
      -- column mismatch: skip, counts already set on profiles
      NULL;
    END;
  END LOOP;
END $$;

-- Step 4: grant permanent access if the function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
             WHERE n.nspname='public' AND p.proname='grant_permanent_access') THEN
    PERFORM public.grant_permanent_access(
      (SELECT id FROM public.profiles WHERE is_owner=true LIMIT 1)
    );
  END IF;
END $$;


-- Set matrix position if columns exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='matrix_track') THEN
    UPDATE public.profiles SET matrix_track=12, matrix_phase=12 WHERE is_owner=true;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='archetype') THEN
    UPDATE public.profiles SET archetype='The Sovereign' WHERE is_owner=true;
  END IF;
END $$;
-- Verify
SELECT
  display_name, email, is_owner, access_approved,
  axis_a, axis_b, axis_c, authority,
  nodes_earned, trophies_earned, medals_earned, certificates_earned,
  sign, element, god, agent, subscription_tier
FROM public.profiles
WHERE is_owner = true;
