# Phase 3b-2 Analysis: Diverging RPC Consolidation Strategy

## Summary
The audit identified 11 RPCs with diverging function definitions across 116 SQL files. Most "candidate deletion" files identified by the audit contain important schema changes (ALTER TABLE, CREATE INDEX, column additions) that must be preserved. A safe consolidation strategy focuses on ensuring canonical "_fix" versions override diverging definitions through proper run order.

## Canonical Versions (with "_fix" files)
These 4 RPCs have explicit canonical versions in "_fix" files:

1. **apply_subscription**
   - Canonical: `omega_apply_subscription_fix.sql` (5 params: uid, tier, status, period_end, customer)
   - This version is the production-verified signature
   - Diverging versions with 7 params (period_start, tier_num defaults) exist elsewhere
   
2. **complete_task**
   - Canonical: `omega_complete_task_dedup_fix.sql`
   - Handles deduplication with (user_id, task_name) uniqueness
   - Multiple diverging signatures exist (old param names: kind, task, axis, title, weight)

3. **expire_trial**
   - Canonical: `omega_extend_trial_fix.sql` (1 param: uid)
   - Correct authorization and database state management
   - Earlier duplicate file (`fix_expire_trial.sql`) already deleted in Phase 3b-1

4. **recall_ai_context**
   - Canonical: `omega_ai_memory_recall_fix.sql`
   - Proper memory expiration handling
   - Older version in `omega_ai_memory.sql` contains different implementation

## Non-Canonical RPCs (no "_fix" file)
These 7 RPCs have diverging versions but no explicit "_fix" file:

- `check_trial_status`
- `get_all_members`
- `my_lattice`
- `my_matrix`
- `my_subscription`
- `order_stats`
- `public_leaderboard`

**Status**: Require explicit canonicalization decision before consolidation can proceed safely.

## Files NOT Recommended for Deletion
Despite being flagged as "candidates" in audit output, these files contain critical schema changes:

1. **omega_subscription_dates.sql** - Contains ALTER TABLE for subscription_period_start
2. **omega_stats_repair.sql** - Adds missing columns (medal_num, cert_num, issued_at)
3. **omega_leaderboard.sql** - Defines public_leaderboard() AND elements distribution logic
4. **omega_task_and_achievement_notifications.sql** - Adds notification infrastructure
5. **trial_fix.sql** - Defines trial-specific logic with multiple objects
6. **Chunk files (chunk_*.sql)** - Multi-purpose bootstrap sequences
7. **migration_runner.sql** - Combines multiple files for ordered application

**Action**: Keep all these files. Canonical "_fix" versions will override function definitions through CREATE OR REPLACE FUNCTION when applied last.

## Recommended Next Steps

### 1. Verify Run Order in Migrations
Ensure migrations apply in this order:
- Base schema (chunk files, omega_master_deploy.sql)
- Feature-specific files (omega_subscription_dates.sql, omega_stats_repair.sql, etc.)
- Canonical "_fix" files LAST (to override diverging definitions)

### 2. Validate Against Live Database
For the 7 non-canonical RPCs, query pg_proc on production to identify which version is actually live, then:
- Create explicit "_fix" files for those versions
- Mark other versions as deprecated
- Then proceed with selective deletion

### 3. Safe Single-Purpose Deletion Candidates
After validation, only these files might be safe to delete entirely:
- Files that define ONLY one of the diverging RPCs
- Files with NO ALTER TABLE, CREATE INDEX, or other schema side effects
- Files that have a confirmed "_fix" replacement

**Current count**: 0 files meet all three criteria

## Current Status
- Phase 3b-1: COMPLETE (surgical_fix_expire_trial.sql deleted, audit.py enhanced, migration filename fixed)
- Phase 3b-2: ANALYSIS COMPLETE, READY FOR VALIDATION DECISION
- Production impact: LOW (no deletions yet, only documentation and audit improvements)
