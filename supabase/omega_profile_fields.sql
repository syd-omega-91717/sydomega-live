-- ============================================================================
-- SYD OMEGA 91717 -- SELF-EDIT PROFILE FIELDS
-- Lets a verified member correct their own personal info (name, sign, birth
-- date, nationality, profession, bio) if they filled it in wrong. Access /
-- trial / axis columns remain writable ONLY through the owner-gated functions
-- (this only grants the harmless personalization columns). Run any time.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession  text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio         text;

-- grant self-update ONLY on personalization columns that exist
DO $g$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY['display_name','sign','birth_date','nationality','profession','bio','terms_accepted','updated_at'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $g$;

COMMIT;
