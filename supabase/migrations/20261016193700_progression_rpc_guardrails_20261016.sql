-- Compatibility alias for a production-recorded migration version.
--
-- Production recorded version 20261016193700 as
-- progression_rpc_guardrails_20261016. The canonical, complete migration is
-- tracked at 20261016194804_progression_rpc_guardrails_20261016.sql.
--
-- Keep this file intentionally empty: replay must preserve the already-applied
-- ledger entry without running the progression changes twice. Do not delete or
-- rename this alias unless the production migration history is deliberately
-- reconciled and all downstream Supabase environments are verified.
begin;
commit;
