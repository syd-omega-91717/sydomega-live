# Schema Consolidation Plan

**Status:** Documented for future work  
**Date:** 2026-08-30  
**Scope:** 110 tables with duplicate definitions across supabase/ and supabase/migrations/

## Executive Summary

The repository contains 120 unique table definitions spread across 37+ SQL files. 110 of these tables are defined in **multiple files** (2-14 occurrences per table), creating significant maintenance debt and potential for drift between definitions.

### Current State
- **Total unique tables:** 120
- **Tables with duplicates:** 110 (91.7%)
- **Affected files:** 37 SQL files
- **Primary causes:**
  1. Historical file-per-feature pattern in `supabase/*.sql`
  2. Migration mirror in `supabase/migrations/` replicates definitions
  3. Aggregate migration chunks (`chunk_*.sql`, `migration_runner.sql`) duplicate tables
  4. Multiple timestamped migrations for same table (e.g., schema repairs, sync fixes)

## Problem Classification

### Tier 1: Parser Artifacts (4 tables)
These are NOT real tables—they are SQL keywords matched by the regex pattern for "CREATE TABLE":

```
- above     (keyword in context, likely "CREATE TABLE ABOVE ...")
- alone     (keyword fragment)
- bodies    (matched in multi-line statement)
- for       (keyword fragment)
- if        (conditional keyword)
- is        (comparison operator)
```

**Root Cause:** Multi-line SQL CREATE TABLE statements cause the regex matcher to include nearby keywords.

**Fix:** Parse with a proper SQL parser, or post-process to verify all matches are real tables.

### Tier 2: Legitimate but Dangerous Duplicates (106 tables)
Real tables with legitimate multiple definitions due to the consolidation architecture:

**Pattern A: Core table + Migrations copy** (~70 tables)
```
omega_personal_logs.sql + migrations/0002_omega_personal_logs.sql
omega_ai_memory.sql + migrations/0059_omega_ai_memory.sql
...
```

**Pattern B: Feature file + chunk aggregates** (~40 tables)
```
omega_master_deploy.sql + chunk_02a_migrations.sql + migration_runner.sql
marketplace_listings.sql + chunk_06_migrations.sql + chunk_08_migrations.sql
platform_owners.sql + chunk_02b_migrations.sql + chunk_08_migrations.sql + migration_runner.sql
...
```

**Pattern C: Multiple migration files for same table** (~15 tables)
```
task_completions:
  - migrations/0001_omega_master_deploy.sql
  - migrations/0058_matrix_engine.sql
  - omega_master_deploy.sql
  - matrix_engine.sql

platform_owners (5 definitions):
  - migrations/0017_access_gate.sql
  - migrations/0044_omega_evolution_rpc.sql
  - migrations/0051_omega_rls_fix.sql
  - access_gate.sql
  - omega_evolution_rpc.sql
  - omega_rls_fix.sql
```

## Risk Assessment

### Data Loss Risk: LOW
- `CREATE TABLE IF NOT EXISTS` guards most definitions (idempotent)
- Duplicates in migrations/ are only run once against schema
- Flat `supabase/*.sql` files are not re-run against production
- Live database is not affected by file structure

### Maintenance Risk: MEDIUM
- RLS policy updates require finding and updating all copies
- Column additions (e.g., `member_state` table added in 0095) need to appear in both flat and migration locations
- Divergence is possible during concurrent edits
- Schema drift becomes invisible until caught by live query failures

### CI/CD Risk: LOW
- `scripts/audit.py` checks only do table existence verification
- `scripts/schema-dictionary.py` references `live-schema.json` (live database truth)
- Deployments use flat `supabase/*.sql` files (source of truth for new deploys)

## Consolidation Strategy

### Phase 1: Identify Canonical Definition (Not started)
For each Tier 2 table, determine:
1. Which file contains the authoritative definition (usually the feature-specific one)
2. Which RLS policies are live (via `live-schema.json`)
3. Which columns/constraints are actually on the production table
4. How many times it's executed (migrations/ files run once; flat files never re-run)

**Method:**
```bash
# For each duplicate table:
# 1. Compare CREATE TABLE statements across all occurrences
# 2. Query live schema for actual column set and constraints
# 3. Identify policy differences
# 4. Mark earliest migration file as canonical (chronologically correct)
```

### Phase 2: Deduplicate Flat Files (Recommended order)
1. **Accept the truth:** migrations/0001–0094 are the definitive sequence for schema history
2. **Consolidate:** All Tier 2 tables should have definitions in their canonical migrations file ONLY
3. **Delete from flat files:** Remove all `supabase/omega_*.sql` definitions that exist in migrations/
4. **Update migration_runner.sql:** This file is an aggregate for local testing; mark it as deprecated
5. **Update chunk_*.sql:** These are also aggregates; determine if they're still used

### Phase 3: Audit & Verify (Post-consolidation)
```bash
# After consolidation:
python3 << 'EOF'
# Regenerate duplicate table report—should show only Tier 1 (parser artifacts)
# Verify all 120 tables are reachable from:
#   1. migrations/0001–0094 (definitive sequence)
#   2. All numbered migrations after 0094
#   3. All timestamped migrations
EOF

# Run against live schema:
scripts/schema-dictionary.py --regenerate  # Updates live-schema.json
scripts/audit.py --strict                   # All checks must pass
```

### Phase 4: Document & Archive (Final)
1. Create `SCHEMA_CONSOLIDATION_DONE.md` with final duplicate count (should be 6: Tier 1 parser artifacts)
2. Document which flat files were deleted and why
3. Add note to migration_runner.sql explaining it's for local testing only, not authoritative
4. Update FIXES_LOG.md with consolidation entry (evidence-cited: before/after duplicate counts, cleanup commands)

## Implementation Recommendations

### For Next Session:
1. **Verify live schema first.** Run:
   ```bash
   supabase db list-tables
   # or
   scripts/schema-dictionary.py --regenerate
   ```
   This gives canonical column/constraint list per table.

2. **Choose Phase 1 output format:** A CSV or JSON mapping:
   ```json
   {
     "task_completions": {
       "canonical_definition": "migrations/0058_matrix_engine.sql",
       "duplicates": [
         "migrations/0001_omega_master_deploy.sql",
         "omega_master_deploy.sql",
         "supabase/matrix_engine.sql"
       ],
       "live_status": "VERIFIED_2026-08-29"
     }
   }
   ```

3. **Automate the cleanup:** Write a script to:
   - Read the mapping file
   - Delete duplicate definitions from flat files
   - Verify syntax with `node --check` on remaining SQL (if parseable)
   - Regenerate registry files

### Known Blockers:
- **No SQL parser in repo:** Multi-line CREATE TABLE regex is brittle. A Python `sqlparse` or equivalent would be more reliable but requires dependency.
- **Parser artifacts (Tier 1):** Cannot be distinguished from real tables without understanding SQL context. Manual inspection of those 6 files required.
- **Migration runner:** Used by local development and `supabase db push`. Clarify whether it should be kept updated or deprecated before deletion.

## Metrics
| Metric | Current | Target |
|---|---|---|
| Total unique tables | 120 | 120 |
| Tables with duplicates | 110 | 6 (Tier 1 only) |
| Affected files | 37 | ~10 (migrations/ only) |
| Highest duplicate count | 14 (platform_owners) | 1 |

## Timeline
- **Phase 1 (Identify):** 1–2 sessions (schema comparison work)
- **Phase 2 (Deduplicate):** 1 session (scripted deletion + verification)
- **Phase 3 (Audit):** 1 session (live verification + CI gate)
- **Phase 4 (Document):** 1 session (cleanup + archive)

**Estimated total effort:** 4–5 sessions
**Recommended start:** After GitHub Actions diagnostics are confirmed working

## References
- `CLAUDE.md` §5 (schema management) & §8.2 (known debt)
- `REPOSITORY_AUDIT.md` (current schema state)
- `live-schema.json` (production schema snapshot)
- `migrations/README.md` (how the migration sequence works)
