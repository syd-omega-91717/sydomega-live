-- ============================================================================
-- Ω SYD OMEGA 91717 — LEADERBOARD SNAPSHOTS: MISSING COLUMNS FIX
--
-- Edge Function audit: supabase/functions/snapshot-leaderboard/index.ts (meant
-- to run on a daily cron at 00:05 UTC, per its own header comment, and also
-- callable on-demand by the owner from leaderboard.html) upserts a row per
-- member per day into public.leaderboard_snapshots with these fields:
--   user_id, snapshot_date, authority, axis_a, axis_b, axis_c, rank_global,
--   display_name, element, sign, tier, is_owner
--
-- But the table's only CREATE TABLE (entreprise_schema_v2.sql:126-140,
-- confirmed via grep -- no other file defines or ALTERs this table) has:
--   id, user_id, snapshot_date, authority, rank_global, rank_track,
--   rank_element, axis_a, axis_b, axis_c, track_id, element
--
-- Four of the edge function's fields -- display_name, sign, tier, is_owner --
-- don't exist on the table at all. PostgREST rejects the entire upsert when
-- any payload key references an unknown column (same class of bug as every
-- other silent-failure this session), so this function has never written a
-- single row: rows_written has always been 0, silently, and the function's
-- own catch-per-batch logic still returns {ok:true, rows_written:0} -- a
-- false success, not a visible error. This directly explains why
-- leaderboard_snapshots reads empty everywhere else it's touched this
-- session (omega-export.js's GDPR export fix earlier needed seeded test
-- data specifically because the real table has likely never held a row).
--
-- The fix is to ADD the missing columns, not strip them from the edge
-- function's payload: leaderboard.html's own renderPodium()/renderTable()
-- (the client that reads this table as its documented tier-2 fallback, see
-- leaderboard.html's own "RANKING PIPELINE" copy) already read r.display_name
-- and r.sign from snapshot rows -- so the client and the writer already agree
-- on this shape; only the table was missing it. Matches this repo's own
-- established pattern for this exact bug class (task_completions, ai_memory,
-- feature_flags, etc.) -- add the columns the real code already needs,
-- non-destructively.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS), safe to re-run.
-- Not yet applied to the live database.
-- ============================================================================

BEGIN;

ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS sign         text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS tier         text;
ALTER TABLE public.leaderboard_snapshots ADD COLUMN IF NOT EXISTS is_owner     boolean DEFAULT false;

COMMIT;
-- ===== end omega_leaderboard_snapshots_columns_fix.sql =====
