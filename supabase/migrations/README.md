# supabase/migrations — canonical, ordered migration history

This directory is the canonical, ordered, automatically-appliable schema history for this project, in Supabase CLI convention (`NNNN_<descriptive_name>.sql` for numbered migrations and `YYYYMMDDhhmmss_<descriptive_name>.sql` for timestamped migrations, applied via `supabase db push`). It supersedes manual copy-paste of `supabase/*.sql` into the Supabase SQL editor.

## Production migration invariant

## Current provider-verified state — 2026-11-22

- The authenticated live Supabase migration ledger contains **441 applied versions**; latest version is `20261122105012` with provider name `20261122110000_close_advance_matrix_member_execution`. The source snapshot in `supabase/remote-migrations.json` records the same 441 versions. The source filename preserves this exact provider version/name pair. `supabase/pending-migrations.json` is empty.
- `20261122100837_financial_truth_and_scenario_lab` adds per-user RLS-protected financial scenarios, immutable formula-versioned simulation runs, and an owner-only AAL2 aggregate of Stripe settlement ledger records.
- `20261122100946_financial_scenario_numeric_bounds` bounds scenario inputs to prevent projection totals exceeding the stored numeric precision. `20261122101614_finance_rpc_private_wrappers_and_index` moves privileged implementations into the non-exposed `private` schema, leaves only `SECURITY INVOKER` public wrappers, and adds the simulation-run foreign-key index.
- Live catalog checks confirmed both new tables have RLS enabled, scenario CRUD is scoped to `auth.uid()`, simulation runs are read-only to authenticated clients, and the two finance RPCs have an empty search path and authenticated-only execute grants.
- `20261122105012_20261122110000_close_advance_matrix_member_execution` revokes API-role EXECUTE on both the public and private `advance_matrix(integer,text)` entry points. Live verification confirms anon, authenticated and service_role are denied while the postgres owner retains execution. No event-verified progression executor is deployed; the matrix API remains unavailable.
- A read-only owner/AAL2 invocation returned zero settlement transactions, zero refund transactions, zero processed/failed payment events, zero unmatched reconciliations, and no currency amounts. Payments, Stripe integration, tokens and KYC intake remain disabled.
- The scenario lab creates no payments, tokens, member balances or actual revenue. Its immutable run snapshots are explicitly classified `SIMULATED`. The actuals surface reports only gross Stripe provider settlements and refunds by currency; it does not label them recognized accounting revenue.
- These schema checks do not prove a full browser scenario run, Stripe test-mode lifecycle, legal approval, accounting recognition or production UI deployment. Those remain separate gates.


`supabase/migrations/` is the source of truth for migration files. The live project's `supabase_migrations.schema_migrations` table is the source of truth for what production has recorded as applied.

**Invariant:** every remote migration version must have exactly one local migration file, and every local migration version intended for production must be recorded remotely after deployment. A green build must never be inferred from a schema that merely looks correct; migration history itself must be synchronized.

The repository contains timestamped reconciliation migrations for changes that were historically applied directly to the live database. Those files preserve the recorded migration versions so `supabase db push` does not encounter `Remote migration versions not found in local migrations directory`.

## Historical provider-verified state — 2026-11-16 (superseded by 2026-11-17)

- A fresh, read-only read of the authenticated Supabase provider ledger returned **432 unique applied versions**; the latest is `20261116214842_authenticated_safe_column_read_grants`. The repository's `supabase/remote-migrations.json` records the same 432 versions.
- The source directory now contains **433 migration files**: 432 provider-applied versions plus one explicitly registered pending migration. The pending registry is part of source inventory and is not provider-applied state.
- Versions `20261112091600`, `20261113030000`, and `20261113062812` are present in both source history and the live provider ledger. Do not remove, rewrite, renumber, or reapply an already-recorded migration to correct documentation or inventory drift.
- The prior isolated fresh-database replay on main commit `016bf9276143abe82d18317f4e8005187c92c6fe` passed all 430 migrations at that earlier revision, plus the migration security audit, 54 module runtime adapter probes, family-access authorization/privacy probes, and the authenticated content-pipeline E2E test (`local_only=true`). It predates migrations `20261116214052`, `20261116214700`, and `20261116214842`; the 433-source migration replay is pending PR validation. Production remains blocked until the pending version is applied through the controlled workflow.
- PR #1281 reconciled the source inventory and provider snapshot. It did not apply a migration to the production database or change production data.
- Migration `20261116214052_media_items_authenticated_select` grants `SELECT` to `authenticated` only on `public.media_items`. The existing RLS policy still limits ordinary members to `status='live'`; the owner predicate remains protected by the existing MFA-aware `private.is_platform_owner()` function. `anon` receives no grant.
- Migration `20261116214700_api_keys_live_column_compatibility` is registered as pending in `supabase/pending-migrations.json`. On clean replay it renames legacy `key_name`/`is_active` to the live application names `name`/`active`; on the current provider it is expected to be a no-op. It blocks production until the controlled migration-push workflow applies it.
- Migration `20261116214842_authenticated_safe_column_read_grants` grants only the required non-secret `SELECT` columns on `public.api_keys` and `public.consent_records` to `authenticated`. It does not grant `api_key`, `api_secret`, `ip_hash`, or `user_agent`, and it adds no table-wide SELECT. Existing owner/member RLS policies remain the row boundary.
- Both grants were verified live after application. Fresh replay and source/provider parity are being validated in the accompanying PR.
- The exact-SHA Cloudflare production verifier passed for `016bf9276143abe82d18317f4e8005187c92c6fe`: root and `www` returned HTTP 200, CSP and HSTS were present, and **241/241 pages plus 361/361 references** passed the production smoke audit. This is historical production evidence, not a re-verification of the current main SHA.
- Vercel promotion remains postponed because the Vercel account's credits/capacity are not confirmed as restored. A successful workflow run that explicitly reports promotion postponed is not evidence of a Vercel production deployment. Cloudflare Pages is the currently verified production host.
- Supabase Auth leaked-password protection remains a separate dashboard-level hardening action. Owner MFA enforcement remains dormant until both owner accounts have individually verified TOTP factors and the sign-in step-up path is validated. Do not enable the enforcement flag before those prerequisites are met.

## Historical provider snapshot — 2026-11-12 (superseded by 2026-11-13)

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


## Current provider-verified state — 2026-11-17

The following is the latest independently checked state. It supersedes the 2026-11-16 pending-migration and stale-production statements above.

- The authenticated Supabase provider migration ledger contains **437 unique applied versions**, latest `20261118090000_owner_aal2_media_reservation_decisions`. The source directory contains **437 unique migration files**, all provider-applied. `supabase/remote-migrations.json` records all 437 live versions; `supabase/pending-migrations.json` is empty.
- Migration `20261116214700_api_keys_live_column_compatibility` is provider-applied. A read-only query of `information_schema.columns` confirms `public.api_keys.name text NOT NULL` and `public.api_keys.active boolean DEFAULT true`. No API-key or secret values were queried.
- A fresh full migration replay from zero passed on PR #1386 head `5d013f12b0fb90536ff919a70fbbd7670477aa10`, including the guarded UUID-to-bigint conversion path, migration security audit, RLS/RPC checks, 54 runtime-adapter probes, family-access privacy probes, and authenticated content-pipeline E2E. The provider ledger now independently records all 437 source migrations; strict `migration-drift.py` is expected to pass after this snapshot reconciliation.
- The sensitive-column grant boundary remains unchanged: authenticated can read only the required non-secret columns on `public.api_keys` and `public.consent_records`; no table-wide SELECT was added, and `api_key`, `api_secret`, `ip_hash`, and `user_agent` remain excluded.
- The latest Cloudflare Pages exact-SHA production verification passed for main commit `d62168f2d8dd3504d5f2809128c64af1113984b1` ([run #43985648597](https://github.com/syd-omega-91717/sydomega-live/actions/runs/43985648597)). Both `sydomega.com` and `www.sydomega.com` release manifests matched that exact commit; both hosts returned HTTP 200; CSP and HSTS passed; the complete smoke test passed **241/241 registered pages and 368/368 references**. The earlier 20f8 verification remains historical evidence.
- GitHub Pages failover build, deployment, and six-route smoke test also passed for `d62168f2d8dd3504d5f2809128c64af1113984b1` (run #43985648579). Cloudflare Pages remains the primary production host. Vercel promotion remains explicitly postponed by the account-credit/capacity gate and is not claimed as deployed.
- Current Supabase Security Advisor findings: one warning for disabled leaked-password protection; three informational RLS-enabled/no-policy findings on private/internal tables; 326 informational unused-index findings. These are tracked for separate remediation/review. Do not add blanket policies to private tables or drop indexes solely from an unused-index finding.
- The production auth setting for leaked-password protection still requires an authorized dashboard change and post-change verification. Owner MFA enforcement remains dormant until the required owner-factor prerequisites and sign-in step-up validation are complete.

The repository snapshot reconciliation was merged through [PR #1347](https://github.com/syd-omega-91717/sydomega-live/pull/1347); subsequent release evidence is refreshed against the exact main commit. The values above are point-in-time evidence for the stated commit and provider query, not a promise that future deployments remain healthy.


## 2026-11-17 — AI telemetry schema and exact privilege reconciliation

The live provider already contained `public.omega_ai_requests`, but no source migration created it. The prior grant migration therefore failed on an isolated fresh replay. Source migration `20261117002651_omega_ai_requests_service_role_insert_grant.sql` now includes an idempotent table baseline matching the inspected live columns, primary/unique/check constraints, indexes, RLS and deny-by-default client policy before applying its grant. This is a replay compatibility baseline; it does not claim that the historical production apply created the table.

The original grant left PostgreSQL 17 `TRUNCATE`, `REFERENCES`, `TRIGGER` and `MAINTAIN` privileges in the role ACL even though SELECT/UPDATE/DELETE were denied. Follow-up migration `20261117003721_omega_ai_requests_privilege_tightening.sql` revokes all table privileges from `anon`, `authenticated` and `service_role`, then grants only INSERT to `service_role`. Live post-apply checks confirm the eight table privileges: service_role has INSERT only; anon and authenticated have none. RLS and the existing deny policy remain enabled. No synthetic usage row was created.

The provider migration ledger contains 437 applied versions, latest `20261118090000`; `supabase/remote-migrations.json` records all 437 live-applied versions. The pending registry is empty. Live catalog probes confirm the reservation key type, least-privilege RLS policies, and status-RPC grants.


## 2026-11-17 — private uploads bucket size enforcement

Provider migration `20261117004605_uploads_bucket_size_limit_50mb.sql` sets `storage.buckets.file_size_limit=52428800` for the private `uploads` bucket and asserts that the bucket remains private. The limit matches the existing `upload.js` 50 MiB client ceiling and is enforced by Storage rather than trusting JavaScript. The migration does not change `allowed_mime_types`: publishing explicitly supports arbitrary binary attachments, and the current system has no signature scanner/malware provider. MIME/signature validation and malware scanning remain separate release gates.


## 2026-11-18 — owner-only media reservation decisions (applied)

Source migration `20261118090000_owner_aal2_media_reservation_decisions.sql` safely reconciles the historical fresh-replay UUID primary-key declaration to the live `bigint` key only when the table is empty and has no inbound foreign keys (otherwise it aborts), corrects the reservation decision RPC to use `bigint`, requires the platform-owner check and an AAL2 session, constrains valid state transitions, and writes a durable `omega_platform_events` record in the same transaction. Direct authenticated UPDATE privileges are revoked so the browser cannot bypass the owner step-up boundary. The marketing owner queue is updated to call the RPC and step up through the existing TOTP flow when required.

**Provider verification:** Supabase records version `20261118090000` (`owner_aal2_media_reservation_decisions`). Live `media_reservations.id` is `bigint` identity; only SELECT and INSERT RLS policies remain; authenticated direct UPDATE is false; the bigint status RPC is executable by authenticated and the legacy UUID RPC is not. The live Auth database currently has zero enrolled MFA factors, so owner approval/rejection remains fail-closed until an owner enrolls TOTP and reaches AAL2. Malware scanning and rights verification remain separate controls.
