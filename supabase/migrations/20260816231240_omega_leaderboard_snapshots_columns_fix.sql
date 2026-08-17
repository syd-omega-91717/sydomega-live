-- ============================================================================
-- Ω SYD OMEGA 91717 — LEADERBOARD SNAPSHOTS: MISSING COLUMNS FIX
--
-- Byte-for-byte the same fix as supabase/omega_leaderboard_snapshots_columns_fix.sql
-- (see that file for full rationale/evidence). This file exists specifically to
-- match the version string Supabase's own `apply_migration` tool recorded on the
-- remote database's migration-tracking table when this fix was applied directly
-- (2026-08-16, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for why
-- this one breaks the directory's usual NNNN_<name>.sql convention.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS sign         text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS tier         text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS is_owner     boolean DEFAULT false;
-- ===== end 20260816231240_omega_leaderboard_snapshots_columns_fix.sql =====
