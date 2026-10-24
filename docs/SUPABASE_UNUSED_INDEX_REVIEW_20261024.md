# Supabase Unused-Index Review — 2026-10-24

## Decision

**No index was dropped. No index is approved for removal from this snapshot alone.** The live Performance Advisor reported 327 unused-index INFO findings. This is a review queue, not proof that 327 indexes are safe to delete.

## Read-only evidence captured

- Supabase project: `ydqhzvvoyufiiqvzcjns`.
- Observation date: 2026-10-24.
- The live `pg_stat_user_indexes` view contained 989 user-table indexes; 807 had `idx_scan = 0` in the statistics currently retained by PostgreSQL, including 660 zero-scan indexes in `public`.
- The live database contained 97 user tables with estimated live rows.
- The `pg_stat_statements` extension is installed at version 1.11. Its reported statistics reset timestamp is **2026-09-08 16:42:31 UTC**. At the observation time it retained 4,783 normalized statement shapes and 1,336,180 total calls, about 5,291,418 ms cumulative execution time, 4,380 shared-block reads, and 710,202,510 shared-block hits. No query-text dump or destructive index operation was performed in this pass.
- The busiest sequential-scan counters were on small tables: `platform_owners` (2 estimated rows), `platform_settings` (21), `notifications` (12), `profiles` (9), and `task_completions` (21). These counts alone do not prove an index is unnecessary or missing. `session_heartbeats` had 3,826 estimated live rows and 3,779 sequential scans, so it is a separate query-plan review candidate—not an unused-index removal candidate.
- A focused candidate query looked only for zero-scan indexes in the `public` schema that were non-primary, non-unique, not backing a declared constraint, on a table with estimated live rows, and at least 64 KiB. **That query returned zero candidates.**
- The Performance Advisor's 327 findings are a separate provider-generated set; they must not be equated with the 807 zero-scan count, which spans the broader user-index view and its current statistics window.
- The PostgreSQL server start timestamp observed during this pass was 2026-09-08. A trustworthy `pg_stat_reset` timestamp was not established, so `idx_scan = 0` must be interpreted as zero in the currently retained statistics—not as proof the index has never been used.

## Why no destructive change is justified

1. Primary-key, unique, and constraint-backed indexes are integrity mechanisms and must not be dropped based on scan counters.
2. Foreign-key, RLS, authentication, queue, idempotency, and rare administrative paths can have low-frequency but critical index use.
3. An index may be used through bitmap scans or workload patterns not represented by one short observation window. PostgreSQL documents that index scan counters are cumulative statistics and that their interpretation has limitations; see the [PostgreSQL cumulative statistics documentation](https://www.postgresql.org/docs/current/monitoring-stats.html).
4. The current evidence did not establish a large, non-constraint, zero-scan public index on a populated table. There is no justified immediate disk/latency win to trade against production risk.

## Required evidence before any index removal

For each candidate index, capture and review:

- Exact schema, table, index definition, size, uniqueness, validity, constraint dependencies, and overlapping/prefix indexes.
- Current `pg_stat_user_indexes` values and the applicable statistics-reset window.
- Representative peak-period query workload and query plans; include RLS policies, foreign-key paths, authentication, jobs/queues, idempotency, and operational/rare workflows.
- Before/after `EXPLAIN (ANALYZE, BUFFERS)` for relevant queries in a safe non-production environment. Do not run expensive `ANALYZE` workloads against production without a bounded plan.
- A reviewed migration that removes only a proven redundant or harmful index, with rollback instructions and post-deployment latency/error monitoring.

## Next safe review sequence

1. Preserve the 327 Advisor findings as INFO until individually evaluated.
2. Confirm whether `pg_stat_statements` is available and whether its retention/reset window covers representative traffic. If unavailable, capture a bounded, privacy-safe query sample through approved provider logging.
3. Rank candidates by size, table cardinality, overlapping definitions, and evidence of expensive sequential scans—not by the advisor count alone.
4. Exclude all primary/unique/constraint indexes unless a separate schema redesign proves the constraint can be preserved.
5. Test one reviewed migration in a non-production branch; compare plans and runtime behavior before any production rollout.
6. Re-run the Performance Advisor after measured changes and retain the before/after evidence.

## Current status

**REVIEW IN PROGRESS — zero destructive index changes.** The focused high-risk shortlist returned no candidate under the filter above; the broader 327-finding queue still requires workload-aware review.
