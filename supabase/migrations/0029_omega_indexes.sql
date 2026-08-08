-- ============================================================================
-- SYD OMEGA 91717 -- PERFORMANCE INDEXES (idempotent; safe to re-run)
--
-- PASS C FINDING (measured, not estimated)
-- The schema has 42 tables but only 6 named indexes. Meanwhile the frontend
-- filters by user_id on almost every read:
--
--     .from('<table>').select(...).eq('user_id', <session user>)
--
-- Without an index on user_id, PostgreSQL performs a sequential scan of the
-- whole table for each of those reads. At current row counts this is invisible;
-- it degrades linearly as members join, and it degrades first on the pages
-- members use most.
--
-- Row Level Security makes this matter more, not less: every RLS policy of the
-- form USING (auth.uid() = user_id) is evaluated per row, so an unindexed
-- user_id means the policy check itself scans the table.
--
-- Tables below were selected by measuring actual .eq('user_id', ...) usage in
-- the shipped pages -- not by indexing everything indiscriminately.
--
-- CONCURRENTLY is deliberately NOT used: it cannot run inside a transaction
-- block, and these tables are small enough that a brief lock is harmless.
-- ============================================================================

-- family_nodes -- 5 call sites (family.html bloodline + heritage tabs)
CREATE INDEX IF NOT EXISTS family_nodes_user_idx
  ON public.family_nodes (user_id);

-- evolution_events -- 4 call sites (dashboard, matrix, account, profile feeds)
-- ordered by created_at DESC everywhere, so index both columns together
CREATE INDEX IF NOT EXISTS evolution_events_user_time_idx
  ON public.evolution_events (user_id, created_at DESC);

-- character_records -- profile.html character tab
CREATE INDEX IF NOT EXISTS character_records_user_idx
  ON public.character_records (user_id);

-- sovereign_points_ledger -- points.html, ordered by created_at DESC
CREATE INDEX IF NOT EXISTS sovereign_points_ledger_user_time_idx
  ON public.sovereign_points_ledger (user_id, created_at DESC);

-- consult_requests -- consultancy.html
CREATE INDEX IF NOT EXISTS consult_requests_user_idx
  ON public.consult_requests (user_id);

-- publications -- publishing.html
CREATE INDEX IF NOT EXISTS publications_user_idx
  ON public.publications (user_id);

-- media_reservations -- media/reservations flow
CREATE INDEX IF NOT EXISTS media_reservations_user_idx
  ON public.media_reservations (user_id);

-- commission_contracts -- contracts.html
CREATE INDEX IF NOT EXISTS commission_contracts_user_idx
  ON public.commission_contracts (user_id);

-- ----------------------------------------------------------------------------
-- Owner-side scans. approvals.html and the bg.js pending-count badge both
-- filter profiles by access state; these support that without scanning every
-- member row.
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS profiles_access_idx
  ON public.profiles (access_approved, is_owner);

CREATE INDEX IF NOT EXISTS profiles_trial_idx
  ON public.profiles (is_trial, trial_expires_at)
  WHERE is_trial IS TRUE;

-- ============================================================================
-- VERIFY AFTER RUNNING
-- ============================================================================
-- select tablename, indexname from pg_indexes
--  where schemaname='public'
--    and indexname in ('family_nodes_user_idx','evolution_events_user_time_idx',
--                      'character_records_user_idx','sovereign_points_ledger_user_time_idx',
--                      'consult_requests_user_idx','publications_user_idx',
--                      'media_reservations_user_idx','commission_contracts_user_idx',
--                      'profiles_access_idx','profiles_trial_idx')
--  order by tablename;
--
-- Confirm an index is actually used (should say "Index Scan", not "Seq Scan"):
-- explain analyze select * from public.evolution_events
--  where user_id = auth.uid() order by created_at desc limit 8;
