-- ============================================================================
-- Migration State Reconciliation
-- ============================================================================
-- Compatibility checkpoint for the former legacy 8-digit version 20260822.
--
-- Supabase CLI has a known migration-ordering failure when an 8-digit migration
-- and a 14-digit migration share the same YYYYMMDD prefix. This project also
-- contains 20260822024048, so the legacy version is normalized to a unique
-- 14-digit timestamp.
--
-- The original migration was intentionally a synchronization-only checkpoint;
-- no schema object is created or altered here.
-- ============================================================================

SELECT current_timestamp AS reconciliation_timestamp;
