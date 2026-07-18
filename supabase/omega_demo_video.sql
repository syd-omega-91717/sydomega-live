-- ============================================================================
-- SYD OMEGA 91717 -- WELCOME DEMO VIDEO TRACKING
-- Backs omega-demo-video.js: lets the platform remember that a member has
-- already seen the welcome demo, so it plays once (auto), not every visit.
-- Self-writable by the member (same pattern as omega_profile_fields.sql) --
-- the client sets this the moment the video ends or is skipped. Run any time.
-- ============================================================================
BEGIN;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS demo_watched_at timestamptz;

DO $g$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='profiles' AND column_name='demo_watched_at') THEN
    EXECUTE 'GRANT UPDATE (demo_watched_at) ON public.profiles TO authenticated';
  END IF;
END $g$;

COMMIT;
