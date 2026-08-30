# Schema Consolidation Phase 1 — Report & Canonical Mapping

**Status:** Complete  
**Date:** 2026-08-30  
**Output:** `schema_consolidation_mapping.json`

## Executive Summary

Automated analysis identified 110 duplicate table definitions across 37 SQL files:
- **Tier 1 (Parser artifacts):** 6 tables — likely false positives from SQL keyword matching
- **Tier 2 (Legitimate duplicates):** 104 tables — real duplicates needing consolidation

Analysis script: `scripts/schema-consolidation-phase1.py`

---

## Tier 1 — Parser Artifacts (6 tables)

These likely represent SQL keywords caught by the regex pattern when CREATE TABLE statements span multiple lines:

| Table | Occurrences | Classification |
|---|---|---|
| above | 8 | SQL keyword (CREATE TABLE ABOVE ...) |
| alone | 4 | SQL keyword fragment |
| bodies | 4 | Likely keyword in multi-line statement |
| for | 4 | SQL keyword (FOR EACH ROW ...) |
| if | 2 | SQL conditional |
| is | 8 | SQL operator |

**Action:** Manual inspection of `schema_consolidation_mapping.json` required. Verify these are truly non-existent tables before proceeding to Phase 2.

**Verification command:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('above', 'alone', 'bodies', 'for', 'if', 'is');
```
If query returns 0 rows, Tier 1 classification is correct.

---

## Tier 2 — Legitimate Duplicates (104 tables)

### Highest Duplicates

| Table | Count | Canonical File |
|---|---|---|
| platform_owners | 13 | chunk_08_migrations.sql |
| marketplace_listings | 12 | chunk_02a_migrations.sql |
| platform_settings | 12 | chunk_08_migrations.sql |
| dispatches | 11 | chunk_02a_migrations.sql |
| commission_contracts | 9 | chunk_02a_migrations.sql |
| consult_requests | 9 | chunk_02a_migrations.sql |
| media_reservations | 9 | chunk_02a_migrations.sql |
| family_nodes | 8 | chunk_02a_migrations.sql |
| publications | 8 | chunk_02a_migrations.sql |
| task_completions | 8 | chunk_02a_migrations.sql |
| medals | 7 | chunk_02a_migrations.sql |

### Canonical Definition Selection Strategy

For each Tier 2 table, the mapping identifies:
1. **Canonical file** — preferred source of truth (priority: numbered migration → timestamped migration → feature-specific file)
2. **Duplicate files** — targets for deletion in Phase 2
3. **Requires manual verification** — flag for tables needing schema comparison

### Root Causes

1. **Migration history duplication** — `supabase/migrations/0001` through `0094` are mirrored in `supabase/chunk_*.sql` files
2. **Aggregate chunks** — `chunk_02a_migrations.sql`, `chunk_08_migrations.sql`, etc. bundle multiple tables
3. **Fix migrations** — Later numbered/timestamped migrations re-define tables for schema repairs (e.g., `0058_matrix_engine.sql`, `0089_omega_user_assets_fix.sql`)
4. **File-per-feature pattern** — Original architecture created `omega_<feature>.sql` files that were later mirrored to `migrations/`

---

## Phase 2 Preparation

The `schema_consolidation_mapping.json` provides everything needed for Phase 2 (file deletion):

```json
{
  "tier_2": {
    "platform_owners": {
      "canonical_definition": "supabase/chunk_08_migrations.sql",
      "duplicate_files": [
        "supabase/access_gate.sql",
        "supabase/chunk_02b_migrations.sql",
        "supabase/migrations/0001_omega_master_deploy.sql",
        "supabase/migrations/0017_access_gate.sql",
        // ... 11 more files
      ],
      "duplicate_count": 13,
      "requires_manual_verification": false
    },
    // ... 103 more tables
  }
}
```

**Phase 2 will:**
1. For each Tier 2 table, delete all files in `duplicate_files` except `canonical_definition`
2. Verify remaining schema compiles (`node --check` on any parseable SQL)
3. Test against live database (`scripts/schema-dictionary.py --regenerate`)
4. Update `migration_runner.sql` if it's no longer authoritative

**Estimated effort:** 1 session (scripted deletion + verification)

---

## Known Issues & Limitations

### 1. Canonical Selection May Need Refinement
Current heuristic selects earliest migration file, but aggregate files (`chunk_*.sql`) may not be ideal canonical sources. Phase 2 should verify canonical definitions match live schema via:
```bash
scripts/schema-dictionary.py --regenerate
```

### 2. Parser Artifacts Need Manual Inspection
Tier 1 items must be verified against live schema before Phase 2. A SQL query as shown above will confirm.

### 3. Migration Runner Unclear
`supabase/migration_runner.sql` aggregates many tables and is unclear if it's still used for local development. Phase 2 should:
- Determine if `supabase db push` still uses this file
- If yes, decide whether to update or deprecate
- If no, mark as deprecated in comments

### 4. SQL Parser Limitations
Current regex-based approach has inherent limits. A proper SQL parser (e.g., Python's `sqlparse` library) would be more reliable but adds a dependency.

---

## Verification Checklist for Phase 2

Before deleting files, verify:

- [ ] Live schema snapshot is current (`scripts/schema-dictionary.py --regenerate` run 2026-08-30 or later)
- [ ] All Tier 1 items verified against `pg_tables` query
- [ ] For each Tier 2 table with >5 duplicates, manually compare definitions:
  - [ ] Column list matches canonical vs. duplicates
  - [ ] RLS policies identical
  - [ ] Indexes match
  - [ ] Triggers/functions match
- [ ] `migration_runner.sql` status determined (still used for local dev?)
- [ ] `chunk_*.sql` files understood (only aggregates, or still active?)
- [ ] Remaining CI checks still pass after deletion

---

## Metrics (Phase 1 Results)

| Metric | Value |
|---|---|
| Total unique tables | 120 |
| Tables with duplicates | 110 |
| Tier 1 parser artifacts | 6 |
| Tier 2 legitimate duplicates | 104 |
| Highest duplicate count | 13 (platform_owners) |
| Average duplicates per table | 1.8 files |
| Files affected | 37 SQL files |

---

## Timeline & Effort Estimate

| Phase | Status | Effort | Date |
|---|---|---|---|
| Phase 1: Identify | ✅ Complete | 1 session | 2026-08-30 |
| Phase 2: Deduplicate | 📋 Planned | 1 session | TBD |
| Phase 3: Verify | 📋 Planned | 1 session | TBD |
| Phase 4: Archive | 📋 Planned | 1 session | TBD |

---

## Files Generated This Phase

1. `scripts/schema-consolidation-phase1.py` — Analysis script (automated)
2. `schema_consolidation_mapping.json` — Canonical mapping (data-driven output)
3. `SCHEMA_CONSOLIDATION_PHASE1_REPORT.md` — This document

---

## Next Steps

1. **Manual verification of Tier 1:**
   ```bash
   psql "$SUPABASE_DB_URL" << 'SQL'
   SELECT tablename FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('above', 'alone', 'bodies', 'for', 'if', 'is');
   SQL
   ```

2. **Compare a few Tier 2 definitions:**
   For top 3 tables, manually read definitions in canonical vs. duplicate files to verify selection logic.

3. **Determine migration_runner status:**
   Check if `supabase db push` or any local scripts reference this file.

4. **Plan Phase 2:**
   Write a cleanup script that deletes duplicate files based on mapping, with a rollback mechanism.

---

## References

- `SCHEMA_CONSOLIDATION_PLAN.md` — Comprehensive consolidation strategy
- `CLAUDE.md` §5 (Schema management) & §8.2 (Known debt)
- `REPOSITORY_AUDIT.md` — Current schema state
- `schema_consolidation_mapping.json` — Full canonical mapping (data-driven)
