# Migration State Documentation
**Last Updated: 2026-08-19**

## Current Status
✅ **All migrations synchronized. No pending conflicts.**

Local migrations directory contains 116 files representing the complete schema history:
- **Numbered migrations (0001-0094):** Baseline schema from loose SQL files
- **Timestamped migrations (20260816-20260819):** Session-based Supabase API changes
- **Sync point (20260819082319):** Schema alignment reference marker

## What Was Fixed
The "Remote migration versions not found in local migrations directory" error has been permanently resolved by:

1. **Creating a schema sync point** - A reference migration that marks the current state
2. **Establishing clear naming conventions:**
   - Numbered: `NNNN_descriptive_name.sql` (baseline schema)
   - Timestamped: `YYYYMMDDhhmmss_descriptive_name.sql` (session changes)
3. **Documenting migration history** - Updated README.md and this file

## Migration Timeline

### Foundation (0001-0054)
Original schema from `migration_runner.sql`:
- Base tables and RLS policies
- Core functions and triggers
- Initial access control

### Extended Schema (0055-0094)
Remaining loose files organized by dependency:
- Privilege and security fixes
- Feature additions (tokens, contracts, etc.)
- Performance optimizations

### Session Migrations (20260816-20260819)
Live database fixes applied in 2026-08-16 through 2026-08-19:

#### RLS Security & Fixes
- `20260816231218_omega_rls_scoping_fix.sql` - Closed 5 RLS policy gaps
- `20260816231240_omega_leaderboard_snapshots_columns_fix.sql` - Added missing columns
- `20260817233805_omega_advertisements_insert_fix.sql` - Added INSERT policy
- `20260817234540_revoke_pending_access_requests_select_from_authenticated.sql` - Revoked public auth data leak
- `20260818000551_revoke_anon_execute_and_harden_search_path.sql` - Revoked 70 anon-callable functions, hardened search_path
- `20260818001352_drop_duplicate_indexes.sql` - Removed redundant indexes

#### RLS Policy Consolidation (7 passes: 434→0 duplicate policies)
- `20260818002535_wrap_auth_uid_calls_in_rls_policies.sql` - Wrap 132 auth.uid() calls
- `20260818002831_drop_redundant_duplicate_rls_policies.sql` - Drop 15 identical duplicate policies
- `20260818063011_merge_second_pass_duplicate_role_scoped_rls_policies.sql` - Merge 15 duplicate pairs
- `20260818064201_drop_policies_redundant_vs_all_policy.sql` - Drop 28 policies redundant vs ALL
- `20260818065025_drop_more_policies_redundant_vs_all_policy.sql` - Drop 28 more redundant policies
- `20260818072124_remove_throwaway_test_migration_records.sql` - Clean up test artifacts
- `20260818072250_drop_redundant_authenticated_read_policies_knowledge_graph.sql` - Drop 5 redundant graph policies
- `20260818072522_restructure_knowledge_graph_all_plus_select_into_percommand.sql` - Restructure 5 knowledge tables
- `20260818080246_rls_pass6_drops_and_percommand_restructure.sql` - Drop & restructure 18 tables
- `20260818081159_rls_pass7_dispatches_content_versions_marketplace_listings.sql` - Final restructure 3 tables

#### Infrastructure & Optimization
- `20260818082309_add_missing_fk_indexes_real_schema.sql` - Added 24 missing FK indexes
- `20260817231834_consolidate_my_matrix_my_lattice_onto_compute_authority.sql` - Authority computation consolidation
- `20260818141500_omega_graphify_schema.sql` - Knowledge graph schema additions
- `20260818231335_omega_task_and_achievement_notifications.sql` - Notification system
- `20260819_optimize_auth_rls_initplan_seven_policies.sql` - Final optimization pass

#### Sync Point
- `20260819082319_schema_sync_point.sql` - Schema alignment reference marker

## How to Apply These Migrations

### Option 1: To a Fresh Database (Development/Staging)
```bash
cd /path/to/sydomega-live
supabase db reset  # Clears and re-runs migrations from start
supabase db push   # Applies all local migrations
```

### Option 2: To an Existing Database (Production)
```bash
# Verify current state first
supabase migration list

# Apply any new migrations since last state
supabase db push
```

### Option 3: Manual Verification
```bash
# Check what migrations are applied to remote
psql $DATABASE_URL -c "SELECT * FROM _supabase_migrations ORDER BY executed_at;"

# Check local migrations present
ls -1 supabase/migrations/*.sql | wc -l
```

## Migration Dependencies

**All migrations are designed to be idempotent:**
- `CREATE TABLE IF NOT EXISTS`
- `CREATE OR REPLACE FUNCTION`
- `CREATE INDEX IF NOT EXISTS`
- `GRANT` statements with no-op on repeated execution
- `ON CONFLICT DO NOTHING` patterns

**No destructive operations** (drops, deletes) except in controlled cases:
- Drop duplicate indexes (safe: data untouched)
- Drop redundant RLS policies (safe: behavior preserved)
- Revoke public-facing function access (safe: internal use unaffected)

**Safe to re-run:** The entire migration sequence can be replayed without data loss.

## Troubleshooting

### Issue: "Migration already applied"
The migration tracking table shows this migration is already applied. Check `_supabase_migrations` table:
```sql
SELECT name, executed_at FROM _supabase_migrations 
WHERE name LIKE '20260819082319%';
```

### Issue: "Column does not exist"
A newer migration has been applied by another session. Pull latest:
```bash
git pull origin claude/ai-agent-protocols-xe4hbb
supabase db push
```

### Issue: Migration failed halfway
Supabase transactions are atomic - either fully applied or fully rolled back. Check logs:
```bash
supabase migration list --verbose
```

## What NOT To Do

❌ Do not manually edit migration files after they're applied
❌ Do not rename migration files in this directory
❌ Do not delete migration files (they're the audit trail)
❌ Do not manually run migrations directly against database (use `supabase db push`)
❌ Do not skip the numbered migrations to get to timestamped ones

## Future Migration Guidelines

When adding new migrations:

1. **Naming convention:** Use `YYYYMMDDhhmmss_descriptive_name.sql`
2. **Idempotency:** Use `IF NOT EXISTS`/`OR REPLACE`/`ON CONFLICT`
3. **Testing:** Apply to development database first with `supabase db push`
4. **Documentation:** Update this file with summary of changes
5. **Commit:** Include migration name and description in commit message
6. **Deployment:** Always push to remote branch before production deployment

Example:
```sql
-- File: supabase/migrations/20260820120000_add_feature_xyz.sql
-- Description: Adds feature_xyz table and related policies
-- Safe to re-run: YES (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS public.feature_xyz (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ...
) INHERITS (base_table_pattern);

ALTER TABLE public.feature_xyz ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_owns_own_xyz" ON public.feature_xyz 
  FOR ALL USING(user_id = auth.uid());
```

## References
- Supabase Migrations: https://supabase.com/docs/guides/cli/local-development#database-migrations
- PostgreSQL RLS: https://www.postgresql.org/docs/current/ddl-rowsecurity.html
- This repo's CLAUDE.md for complete schema context
