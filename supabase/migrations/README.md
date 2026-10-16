# supabase/migrations — canonical, ordered migration history

This directory is the canonical, ordered, automatically-appliable schema history for this project, in Supabase CLI convention (`NNNN_<descriptive_name>.sql` for numbered migrations and `YYYYMMDDhhmmss_<descriptive_name>.sql` for timestamped migrations, applied via `supabase db push`). It supersedes manual copy-paste of `supabase/*.sql` into the Supabase SQL editor.

## Production migration invariant

`supabase/migrations/` is the source of truth for migration files. The live project's `supabase_migrations.schema_migrations` table is the source of truth for what production has recorded as applied.

**Invariant:** every remote migration version must have exactly one local migration file, and every local migration version intended for production must be recorded remotely after deployment. A green build must never be inferred from a schema that merely looks correct; migration history itself must be synchronized.

The repository contains timestamped reconciliation migrations for changes that were historically applied directly to the live database. Those files preserve the recorded migration versions so `supabase db push` does not encounter `Remote migration versions not found in local migrations directory`.

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

The 383-file run above is historical evidence for the source state at that commit only. A fresh authenticated production migration-list query on 2026-10-16 returns **386 applied versions**, matching the **386 local migration files**, with no local-only, remote-only, or duplicate versions. The latest provider-recorded version is `20261016194804`, `progression_rpc_guardrails_20261016`; its exact version is preserved in the canonical local filename and provider snapshot. Production privilege probes confirm anonymous execution is denied and authenticated execution is allowed for both member-preference RPCs. The progression guardrail migration was replayed from zero across all **386 migration files** and passed the migration security audit, hardening contract, and family-access authorization/privacy probes on [PR #959's full migration replay](https://github.com/syd-omega-91717/sydomega-live/actions/runs/38956998325). The live `private.complete_task` function now validates task inputs, caps awards at `0.12` per call and `0.30` over a rolling 24-hour window, serializes per-member awards, and uses an empty search path; the supporting partial index is present. The repository snapshot and pending registry have been refreshed from provider evidence. Migration-history parity remains a point-in-time fact, not proof of complete semantic schema equivalence or future deployment success.

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
