-- CRITICAL: Reset migration state for Phase C/D deployment
-- This file reconciles remote database with local migration directory
-- The remote had migrations applied that weren't tracked locally

-- No-op reconciliation: this file exists only to establish a checkpoint
-- All prior schema changes are assumed to be present in the remote database
-- New changes from this point forward will be tracked in sequential migrations

SELECT 'Migration state reset for Phase C/D consolidation' as status;
