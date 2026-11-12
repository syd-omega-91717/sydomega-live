# supabase/migrations — canonical, ordered migration history

This directory is the canonical, ordered, automatically-appliable schema history for this project, in Supabase CLI convention (`NNNN_<descriptive_name>.sql` for numbered migrations and `YYYYMMDDhhmmss_<descriptive_name>.sql` for timestamped migrations, applied via `supabase db push`). It supersedes manual copy-paste of `supabase/*.sql` into the Supabase SQL editor.

## Production migration invariant

`supabase/migrations/` is the source of truth for migration files. The live project's `supabase_migrations.schema_migrations` table is the source of truth for what production has recorded as applied.

**Invariant:** every remote migration version must have exactly one local migration file, and every local migration version intended for production must be recorded remotely after deployment. A green build must never be inferred from a schema that merely looks correct; migration history itself must be synchronized.

The repository contains timestamped reconciliation migrations for changes that were historically applied directly to the live database. Those files preserve the recorded migration versions so `supabase db push` does not encounter `Remote migration versions not found in local migrations directory`.

## Current provider-verified state — 2026-11-12

- The live Supabase migration ledger contains **419 unique recorded versions**; the latest is `20261112091500_omega_search_index_schema_reconciliation`. `supabase/remote-migrations.json` now records those 419 provider-confirmed versions.
- The three follow-up migrations previously listed as pending — `20261112091300_omega_idempotency_payload_integrity`, `20261112091400_omega_stripe_refund_state_fk_index`, and `20261112091500_omega_search_index_schema_reconciliation` — are now present in the live provider ledger. Read-only catalog checks verified the seven payload-conflict guards, the consultancy/service/task/notification/event/achievement owner-scoped idempotency structures, the Stripe refund-state index, and the reconciled `search_index` columns and owner/shared read policy. Ledger presence alone is not proof of clean replay or complete end-to-end behavior.
- The live consultancy request table was observed with **0 rows**, **0 null user IDs**, and **0 null domains**. Its production `id` type is `BIGINT`; the historical clean-replay baseline creates `consult_requests.id` as `UUID`. The historical baseline also creates `consult_requests` before the later `CREATE TABLE IF NOT EXISTS` block, which means that block does not add its missing `domain` column. The live provider schema already has the required `domain` column.
- The live `omega_private.create_consult_intake` helper had payload-conflict protection but returned `BIGINT` and did not return the generated ID on the successful path. That is incompatible with a fresh replay where the source ID is UUID. PR #1244 adds a CLI-authored follow-up migration that preserves both source ID types, returns `id::text`, adds the missing successful `RETURN`, aligns the required/default consultancy columns with the verified provider shape, and changes the dispatcher variable to text. It does **not** rewrite existing IDs or fabricate request rows.
- The live `search_index` has **0 rows** and the reconciled owner/shared-only read policy. The policy currently evaluates `auth.uid()` directly; the performance advisor still reports one `auth_rls_initplan` finding. The same PR adds the scalar-subquery form `(select auth.uid())`. The performance advisor also reports **326 unused indexes**; do not drop them without workload and query-plan evidence.
- The full fresh-database migration replay now passes on PR #1244, including the consultancy domain and UUID/BIGINT text-ID compatibility changes. The 54-action probe then progressed past consultancy and exposed two dispatcher defects in sequence. `MEDIA.library.read` omitted `created_at` from a derived `media_items` projection while the outer aggregate ordered by `m.created_at`; after that projection was corrected, the next run reached `COMMUNICATION.presence.read` and found the dispatcher ordering by nonexistent `member_presence.last_seen_at` instead of the canonical `last_seen` column. The pending migration now fixes both query projections; the complete probe must be rerun on the latest head before provider application.
- `supabase/pending-migrations.json` now contains only `20261112091600_omega_consultancy_runtime_schema_parity.sql`, marked `PENDING_REVIEW / NOT_APPLIED` and production-blocking. It must pass fresh replay, the complete runtime probe, migration-security checks, and a post-application advisor recheck before it can be applied to the provider.
- Read-only inspection of the live runtime dispatcher found all 53 canonical `module_read` branches plus the dedicated consultancy-intake write branch (**54/54**). This verifies SQL branch coverage only; it does not establish that every HTTP route, user journey, external provider, or production release is operational.
- The live Edge Function inventory remains 22 configured and active functions with exact repository entrypoint matches. This is source parity, not proof that every downstream integration is healthy.
- The public production release remains **NOT LIVE-VERIFIED**. The exact-SHA Cloudflare verifier on main contained duplicated retry/route-smoke blocks; PR #1244 repairs it. Do not claim production convergence until the verifier passes against the exact main SHA and the release manifest, headers, core routes, and full page smoke succeed.
- Supabase security advisor still reports leaked-password protection disabled. Three private-schema tables have RLS enabled without policies and no client table grants; these remain fail-closed and require owner review, not blanket policy creation. The erasure engine remains intentionally dormant: `private.erasure_policy` is empty, the worker is disabled, and no erasure cron job exists.
- No production data was changed by the read-only checks or by PR #1244. The migration remains unapplied. Continue to require isolated replay, policy/grant tests, and provider-side verification for future migrations.

## Verification

Run the local structural contract:

```bash
python scripts/migration-history-contract.py --local
```

For a linked Supabase project, first inspect the authoritative comparison:

```bash
supabase migration list
```

The expected result has no row where only LOCAL or only REMOTE is populated. If a remote version is missing locally, recover the migration file/version before pushing anything else. If the remote history is wrong but the database schema is already correct, use `supabase migration repair` only after verifying the actual database state. `migration repair` changes tracking history; it does not execute or undo SQL.

### Full fresh-database replay — 2026-10-16

GitHub Actions [Supabase Full Migration Replay run 38912798583](https://github.com/syd-omega-91717/sydomega-live/actions/runs/38912798583) passed on `main` commit `b5f0ea9f0aa0ba82fd343ed84eada2e3bc29f463`. That historical run validated all **383 local migration files** present at that commit, started an isolated Supabase stack, replayed the history from a fresh database with `supabase db reset`, revalidated the inventory, and passed the migration security audit, hardening contract, and family-access authorization/privacy probes. It predates the marketplace asset-path hardening migration now recorded as applied version `20261016174416`; this older run is not evidence for that migration.

The 383-file run above is historical evidence for the source state at that commit only. A fresh authenticated production migration-list query on 2026-10-16 returns **385 applied versions**, matching the **385 production-applied local migration versions**, with no local-only, remote-only, or duplicate versions in that applied set. The highest applied version is `20261016193000`, `revoke_anon_member_preferences_rpc_20261016`. The marketplace asset-isolation migration `20261016174416` and the member-preference RPC least-privilege migration `20261016193000` are recorded as applied in production. The live grants were independently checked: anonymous execution is denied for `get_member_preferences()` and `set_member_preferences(...)`, while authenticated execution remains allowed. A fresh database replay of all **385 applied migrations** passed on [PR #947's final verified head](https://github.com/syd-omega-91717/sydomega-live/actions/runs/38954642663). This branch adds a 386th local migration for bounded task-award guardrails; it is registered as `PENDING_REVIEW / NOT_APPLIED` and must remain a production blocker until the 386-file replay passes and the migration is deliberately applied. Migration-history parity is a point-in-time fact, not proof of complete semantic schema equivalence or future deployment success.
The 383-file run above is historical evidence for the source state at that commit only. A fresh authenticated production migration-list query on 2026-10-16 returns **386 applied versions**, matching the **386 local migration files**, with no local-only, remote-only, or duplicate versions. The latest provider-recorded version is `20261016194804`, `progression_rpc_guardrails_20261016`; its exact version is preserved in the canonical local filename and provider snapshot. Production privilege probes confirm anonymous execution is denied and authenticated execution is allowed for both member-preference RPCs. The progression guardrail migration was replayed from zero across all **386 migration files** and passed the migration security audit, hardening contract, and family-access authorization/privacy probes on [PR #959's full migration replay](https://github.com/syd-omega-91717/sydomega-live/actions/runs/38956998325). The live `private.complete_task` function now validates task inputs, caps awards at `0.12` per call and `0.30` over a rolling 24-hour window, serializes per-member awards, and uses an empty search path; the supporting partial index is present. The repository snapshot and pending registry have been refreshed from provider evidence. Migration-history parity remains a point-in-time fact, not proof of complete semantic schema equivalence or future deployment success. **Update 2026-10-16 21:53Z:** `20261016213149` (content pipeline `service_role` grants) was applied and is recorded, making 387 local files; the live ledger now returns **388** because it also holds `20261016193700` (`progression_rpc_guardrails_20261016`), which has no local file and is not in the snapshot. `20261016221059` (`capture_storage_files_schema`) followed: 388 local files, 389 live rows.

## Safe recovery procedure

When the CLI reports remote versions that do not exist locally:

1. **Do not delete or rewrite production migrations just to make `db push` pass.**
2. Run `supabase migration list` and record every LOCAL/REMOTE divergence.
3. If the remote migration represents a real schema change that is absent from the repository, capture the current remote schema with `supabase db pull` and review the generated migration before committing it.
4. If the remote history contains an entry whose schema change is already represented elsewhere and the history entry itself is erroneous, repair that specific history entry with `supabase migration repair <version> --status reverted`, then re-run `supabase migration list`.
5. If a migration was applied manually and the database state is verified, preserve its version locally (prefer an exact recovered migration; otherwise use an explicitly documented reconciliation migration) rather than pretending it never existed.
6. Run `supabase db push --dry-run` before production deployment.
7. Deploy through one controlled migration pipeline and re-run `supabase migration list` afterward.

## CI protection

`python scripts/migration-history-contract.py --local` is a required CI check. It rejects duplicate local versions and missing/invalid migration structure. The existing `migration-consistency.py` remains a separate static schema-content audit.

For environments with Supabase credentials available to CI, the same contract can consume the output of `supabase migration list` using:

```bash
supabase migration list > migration-list.txt
python scripts/migration-history-contract.py --remote-output migration-list.txt
```

Credentials must be supplied through the CI secret store and must never be committed to the repository.

## Migration ordering

The numbered baseline (`0001` onward) remains the historical foundation. Timestamped migrations record later production changes and reconciliation work. Version numbers are the identity used by Supabase; descriptive filenames must not be used as a substitute for version identity.

**Timestamp invariant:** historical numeric versions may remain 4 digits; every new timestamp migration must use the full 14-digit `YYYYMMDDhhmmss` form. Never create an 8-digit `YYYYMMDD` migration. This prevents the known Supabase CLI ordering failure when an 8-digit version shares its date prefix with a 14-digit migration.

New schema changes must be created as new migrations. Existing applied migrations must not be rewritten or renumbered.

## Production rules

- Never run `supabase db reset --linked` against production.
- Never use `--include-seed` against production.
- Never commit access tokens, database passwords, service-role keys, or other secrets.
- Never mark a migration `reverted` solely to silence a CI error.
- Never declare migration synchronization without checking both local files and remote history.
- Keep one authoritative migration directory; loose `supabase/*.sql` files are reference/legacy material and are not the deployment sequence.

## Background

Earlier consolidation work established this directory by synchronizing the loose SQL files into an ordered migration history. Some original SQL bundles contained stale implementations, so the canonical migration files were re-synced to the current loose-file bodies rather than blindly replaying the old bundle. Later timestamped files capture production reconciliation changes. The detailed historical analysis remains in the repository's consolidation reports and `FIXES_LOG.md`.


## 2026-10-17 — restore the applied progression migration ledger alias

A fresh authenticated production migration-list query on 2026-10-17 returned **401 applied versions**, latest `20261017110604`. The `main` tree before this repair contained **400 local migration files**; the sole production-only version was `20261016193700` (`progression_rpc_guardrails_20261016`). The canonical progression guardrail SQL is already tracked and recorded under `20261016194804`. The earlier version was removed from the repository while its production ledger row remained, causing Supabase's preview check to fail with `Remote migration versions not found in local migrations directory`.

This repair restores `20261016193700_progression_rpc_guardrails_20261016.sql` as an intentionally empty compatibility alias. It preserves the applied version in replay history without executing the progression changes twice. The production ledger snapshot was refreshed from the authenticated provider result and now records 401 versions. Its per-migration records are normalized to an array, matching the schema consumed by the migration contracts; the local migration directory has 401 unique versions after the alias is restored. The generated registry census is updated accordingly (107 numbered and 294 timestamped files). This is ledger reconciliation, not a production schema change. The migration replay and Supabase Preview check must pass on the PR head before merge.

## 2026-11-12 — reconcile the applied runtime adapter migration

A fresh read-only query against the configured production Supabase project returned **416 applied migration versions**, latest `20261111190000` (`omega_runtime_dispatch_adapter_reconciliation`). The previous checked-in remote ledger snapshot contained 415 versions and ended at `20261104090000`; `supabase/remote-migrations.json` is updated from the provider result. The original runtime reconciliation migration is therefore no longer listed as pending.

Direct inspection of `public.omega_runtime_dispatch(uuid,text,jsonb)` found all 53 canonical module-read branches and the dedicated consultancy-intake write branch (54/54). The owner/subject-scoped unique indexes introduced by the applied migration are present in the provider schema. This is runtime-definition and migration-ledger evidence, not proof that every route, user journey, external provider or production release is live.

Three follow-up migrations are registered as `PENDING_REVIEW / NOT_APPLIED`: `20261112091300_omega_idempotency_payload_integrity.sql` adds immutable request-payload checks; `20261112091400_omega_stripe_refund_state_fk_index.sql` covers the unindexed refund-state FK; and `20261112091500_omega_search_index_schema_reconciliation.sql` reconciles the known live/fresh search-index schema drift and tightens owner/org RLS. All three block production until fresh full replay, SQL regression probes and security checks pass. Do not edit the already-applied `20261111190000` migration; subsequent changes must use new timestamped migrations.
