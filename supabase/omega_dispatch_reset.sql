-- ============================================================================
-- OPTIONAL CLEAN SLATE -- run this ONLY if OMEGA_DISPATCH.sql still errors on a
-- legacy 'dispatches' table with a different schema (integer id, user_id, etc.).
-- It removes the old broadcast table so OMEGA_DISPATCH.sql can create it cleanly.
-- The dispatches table holds only Order broadcasts (no member data), so dropping
-- it loses nothing but old announcements.
-- ============================================================================
DROP TABLE IF EXISTS public.dispatches CASCADE;
-- now run OMEGA_DISPATCH.sql
