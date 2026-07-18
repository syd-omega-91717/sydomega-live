-- ============================================================================
-- SYD OMEGA 91717 -- MIGRATION STATUS CHECK  (read-only, changes nothing)
--
-- Paste this whole file into the Supabase SQL editor and run it.
-- It reports which of the four hardening migrations are already applied,
-- so you only run what is actually missing.
--
-- Safe: contains no CREATE, ALTER, INSERT, UPDATE or DELETE.
-- ============================================================================

SELECT
  'omega_rls_hardening.sql' AS migration,
  CASE WHEN (
    SELECT bool_and(c.relrowsecurity)
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE n.nspname = 'public'
       AND c.relname IN ('certificates','trophies','evolution_events',
                         'task_completions','contribution_log')
  ) THEN 'ALREADY APPLIED  -- skip'
    ELSE 'NOT APPLIED      -- RUN IT (member data is exposed until you do)'
  END AS status,
  'RLS on 5 member-data tables' AS what_it_does

UNION ALL SELECT
  'omega_access_audit.sql',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgrelid = 'public.profiles'::regclass
       AND tgname  = 'trg_log_access_decision'
  ) THEN 'ALREADY APPLIED  -- skip'
    ELSE 'NOT APPLIED      -- RUN IT'
  END,
  'Audit trail for approve / reject / revoke'

UNION ALL SELECT
  'omega_indexes.sql',
  CASE WHEN (
    SELECT count(*) FROM pg_indexes
     WHERE schemaname = 'public'
       AND indexname IN ('family_nodes_user_idx','evolution_events_user_time_idx',
                         'character_records_user_idx','sovereign_points_ledger_user_time_idx',
                         'consult_requests_user_idx','publications_user_idx',
                         'media_reservations_user_idx','commission_contracts_user_idx',
                         'profiles_access_idx','profiles_trial_idx')
  ) >= 10 THEN 'ALREADY APPLIED  -- skip'
    ELSE 'NOT APPLIED      -- RUN IT'
  END,
  '10 indexes on the hottest query paths'

UNION ALL SELECT
  'omega_error_monitor.sql',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'report_client_error'
  ) THEN 'ALREADY APPLIED  -- skip'
    ELSE 'NOT APPLIED      -- RUN IT'
  END,
  'Runtime error capture + owner viewer';

-- ============================================================================
-- BONUS: overall health -- expect 0 rows from this one.
-- Any row returned is a public table with Row Level Security switched OFF.
-- ============================================================================
SELECT c.relname AS table_without_rls
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
 WHERE n.nspname = 'public'
   AND c.relkind = 'r'
   AND c.relrowsecurity = false
 ORDER BY c.relname;
