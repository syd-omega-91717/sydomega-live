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


---

## Refreshed production observation — 2026-11-17

This section supersedes the 2026-10-24 numeric snapshot above. The earlier snapshot is retained as history, not silently overwritten.

### Provider Advisor

- Supabase Performance Advisor: **326** `unused_index` INFO findings, observed at 2026-11-17 08:29:14 UTC.
- These findings are a review queue. They are not an approved DDL plan and do not establish that any individual index is redundant.

### Read-only PostgreSQL inventory

A read-only query against `pg_index`, `pg_class`, `pg_namespace`, `pg_constraint`, `pg_stat_user_indexes`, and `pg_stat_user_tables` returned:

| Measure | 2026-11-17 result |
|---|---:|
| User indexes across non-system schemas | 1,730 |
| Indexes with `idx_scan = 0` | 1,308 |
| Primary indexes | 1,056 |
| Unique indexes | 1,245 |
| Indexes backing declared constraints | 831 |
| Zero-scan primary/unique/constraint-backed indexes (overlapping categories) | 910 |
| Zero-scan indexes in `auth` | 114 |
| Zero-scan `public` indexes that are non-primary, non-unique and not constraint-backed | 323 |
| Zero-scan `public` non-constraint indexes, at least 64 KiB, on tables with estimated live rows | **0** |
| Same filtered group on tables with recorded writes | **0** |

The zero-scan categories overlap and must not be added together. The inventory deliberately includes non-system schemas, while the candidate filter is limited to `public`.

### Important workload signal

The largest zero-scan public non-constraint index in this sample was `public.idx_mem_user` on `ai_memory` at 40 KiB. Its table had 16 estimated live rows and **31,896 recorded insert/update/delete operations**. This is a concrete example of why a zero-scan index can still impose write cost while potentially serving a query path not represented in the retained statistics. It is not approved for removal; inspect its exact definition, application use, RLS predicates, and query plans first.

Other zero-scan indexes in the top sample were 16–32 KiB. Some were on tables with recorded writes, including graph, activity, notification, module-runtime, and service data. No large, populated public non-constraint candidate met the initial 64 KiB screen.

### Statistics-window limitation

- PostgreSQL server start observed: `2026-09-08T16:43:35.593732Z`.
- `pg_stat_database.stats_reset` returned `NULL`.
- A server start timestamp is **not** proof of the statistics reset time. Therefore, `idx_scan = 0` means zero in the currently retained counters; it does not prove an index has never been used or that the observation covers a representative production workload.
- No `pg_stat_statements` query-text export was performed in this observation.

### Decision and next gate

**No index is approved for removal. No DDL was executed.**

The current screen does not justify destructive cleanup. Before a candidate can be considered, collect exact index DDL and OID, validity, constraint and FK dependencies, overlapping indexes, RLS-policy references, representative application query paths, table write volume, index size, and workload-window evidence. Test relevant plans in a non-production environment and prepare a reversible migration with before/after latency and error monitoring.

The 326 Advisor findings remain INFO. Never convert an Advisor count or a zero-scan counter directly into a `DROP INDEX` migration.
