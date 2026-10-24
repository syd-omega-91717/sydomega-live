# supabase/migrations — canonical, ordered migration history

This directory is the canonical, ordered, automatically-appliable schema history for this project, in Supabase CLI convention (`NNNN_<descriptive_name>.sql` for numbered migrations and `YYYYMMDDhhmmss_<descriptive_name>.sql` for timestamped migrations, applied via `supabase db push`). It supersedes manual copy-paste of `supabase/*.sql` into the Supabase SQL editor.

## Production migration invariant

`supabase/migrations/` is the source of truth for migration files. The live project's `supabase_migrations.schema_migrations` table is the source of truth for what production has recorded as applied.

**Invariant:** every remote migration version must have exactly one local migration file, and every local migration version intended for production must be recorded remotely after deployment. A green build must never be inferred from a schema that merely looks correct; migration history itself must be synchronized.

The repository contains timestamped reconciliation migrations for changes that were historically applied directly to the live database. Those files preserve the recorded migration versions so `supabase db push` does not encounter `Remote migration versions not found in local migrations directory`.

## Current provider-verified state — 2026-10-24

- The live Supabase migration ledger contains **409 applied versions**; the latest recorded version is `20261024102602_harden_provider_registry_column_access`.
- `supabase/remote-migrations.json` is being reconciled in the current follow-up to the provider-confirmed 409-version ledger. The local migration directory remains 409 files after renaming the provider-registry migration to its actual applied version. The pending registry is empty in this reconciliation branch; the full fresh-database replay is a required merge gate.
- The Stripe zero-decimal settlement migration `20261024091500` and provider-registry column-access migration `20261024102602` are applied in production. The live `omega_private.record_stripe_payment` definition was verified against the currency conversion source, with service-role-only execute access.
- The provider registry privilege boundary is live and verified: authenticated has no table-wide SELECT and can read only `id`, `provider_key`, `display_name`, `adapter_kind`, `capabilities`, and `status`. Authenticated SELECT is denied for `secret_ref`, `metadata`, `created_at`, and `updated_at`; `service_role` retains `secret_ref` SELECT for server-side workers.
- The provider ledger briefly contained duplicate entries named `harden_provider_registry_column_access` at `20261024101622` and `20261024102602`. The earlier row was confirmed to have no persistent privilege effect and was removed by a guarded history-only repair after checking the live grants and confirming the later applied row. No application data or schema objects were changed by that repair; the current provider ledger has only `20261024102602`.
- PR #1072 introduced a duplicate pending version and malformed source allowlist, which caused migration inventory/replay and release-readiness checks to fail. That malformed source was not applied to production. The current reconciliation restores the source file to the provider-confirmed version and requires a fresh isolated replay before it can merge.
- Migration-history parity is a point-in-time fact. Continue to require fresh migration replay, policy/grant tests, and provider-side verification for future migrations.
- The dated sections below are historical snapshots. Their counts and deployment states apply only to the commits and dates named in those sections; use this current provider-verified state for present status.

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