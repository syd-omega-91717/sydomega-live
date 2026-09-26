-- Restore the member self-service profile columns that
-- 0041_omega_access_control.sql intended and live had drifted away from.
--
-- Measured live 2026-09-26 before this migration: authenticated could UPDATE
-- only avatar_url, bio, demo_watched_at, display_name, dob, trial_started_at.
-- So terms.html (terms_accepted), omega-onboard.js (sign) and settings.html
-- (bg_color) failed with 42501 for every member -- a new member could not accept
-- terms, and bg.js sends a member without terms back to terms.html. 4 of 7
-- non-owner members had no sign and no accepted terms.
--
-- Safety, verified live as a real non-owner member (rolled back):
--   * guard_profile_privileges (profiles_privilege_guard) still rejects any
--     member change to access_approved / is_trial / is_owner / trial_* /
--     permanent_* / subscription_status; is_owner=true -> 42501.
--   * derive_cosmology recomputes element / god / agent from sign server-side,
--     so none of those are granted; the client sends sign only.
--   * kyc_* is deliberately NOT granted: a member must never write their own
--     KYC verdict. KYC submission needs an owner-reviewed RPC (separate change).
-- Applied live via apply_migration as version 20260926091843.
DO $grant$
DECLARE col text;
BEGIN
  FOREACH col IN ARRAY ARRAY[
    'sign','birth_date','terms_accepted','terms_accepted_at',
    'bg_color','nationality','profession','updated_at'
  ] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_schema='public' AND table_name='profiles' AND column_name=col) THEN
      EXECUTE format('GRANT UPDATE (%I) ON public.profiles TO authenticated', col);
    END IF;
  END LOOP;
END $grant$;
