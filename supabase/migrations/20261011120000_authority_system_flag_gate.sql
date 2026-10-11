-- ============================================================================
-- SYD OMEGA 91717 -- AUTHORITY SYSTEM FEATURE FLAG
-- Standing Dashboard and authority score computation, gated behind a flag.
-- Dormant (false) by default until subscriber-portal exposure is live.
-- ============================================================================
BEGIN;

-- Add the authority_system_enabled flag to platform_settings if absent --------
INSERT INTO public.platform_settings(key,bool_value) VALUES ('authority_system_enabled',false)
  ON CONFLICT (key) DO NOTHING;

COMMIT;
