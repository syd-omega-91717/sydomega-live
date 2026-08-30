-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA SYNC POINT: Full Schema Consolidation
-- ════════════════════════════════════════════════════════════════════════════
-- This migration represents a full schema sync point to align local migrations
-- with the remote database state. All previous migrations are considered applied.
-- If this is the first migration being applied to a fresh database, all prior
-- schema creation is implicitly assumed to exist from the flat SQL files.
--
-- Applied as: supabase db push
-- ════════════════════════════════════════════════════════════════════════════

-- This file is intentionally minimal. It serves as a migration timestamp marker
-- for synchronization purposes. The actual schema state is maintained through
-- the complete set of migration files in this directory (0001-0094 and dated files).
--
-- If you need to verify the complete schema, refer to:
-- - supabase/migrations/0001_omega_master_deploy.sql (base schema)
-- - All subsequent numbered migrations (0002-0094)
-- - All timestamped migrations (202608*)

-- Verify that critical tables exist (sanity check)
DO $$
DECLARE
  table_count INT;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public';
  
  IF table_count < 50 THEN
    RAISE WARNING 'Expected at least 50 tables in public schema, found %', table_count;
  END IF;
  
  -- Log migration application, IF that table exists.
  --
  -- public.migrations_log is created by nothing in this repository and does
  -- not exist on production either (to_regclass('public.migrations_log')
  -- returns NULL on ydqhzvvoyufiiqvzcjns, checked 2026-08-30). An unguarded
  -- INSERT therefore aborts the whole push on any database:
  --
  --   ERROR: relation "public.migrations_log" does not exist (SQLSTATE 42P01)
  --
  -- which is exactly what Supabase Preview reported. This migration has never
  -- been applied to production -- its version is absent from
  -- supabase_migrations.schema_migrations -- so the log row was never written
  -- anywhere and nothing depends on it.
  --
  -- Guarded rather than deleted: the file's purpose is to be a sync-point
  -- marker plus the sanity check above, and if a migrations_log table is ever
  -- introduced this records into it correctly. to_regclass returns NULL
  -- instead of raising, so it is the right test here.
  IF to_regclass('public.migrations_log') IS NOT NULL THEN
    EXECUTE $log$
      INSERT INTO public.migrations_log (migration_name, status, applied_at)
      VALUES ('schema_sync_point', 'applied', NOW())
      ON CONFLICT DO NOTHING
    $log$;
  END IF;
END $$;
