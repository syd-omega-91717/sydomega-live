# Ω SYD OMEGA 91717 — Production operator actions

**Observed:** 2026-11-12  
**Purpose:** Track production hardening that cannot be completed safely through the currently connected repository and Supabase actions.

This register separates code-controlled work from provider/account settings that require an authorized owner or administrator.

## P0 — Complete the release-safe runtime change

1. **Provider ledger reconciliation is complete:** read-only Supabase migration listing confirms **419 applied versions**, latest `20261112091500`. The three follow-up migrations `20261112091300`, `20261112091400`, and `20261112091500` are recorded as applied. The repository snapshot and pending register now match that provider evidence.
2. **Catalog verification is complete for those three migrations:** all seven payload-conflict guards are present in the live helper definitions; owner/subject-scoped idempotency indexes are present; the Stripe refund-state FK index exists; and `search_index` has the reconciled columns and owner/shared-only read policy. This is catalog/schema evidence, not a substitute for clean replay or end-to-end tests.
3. **Fresh replay exposed a separate historical schema mismatch:** the clean migration chain creates `consult_requests.id` as UUID and can omit `domain` because the later `CREATE TABLE IF NOT EXISTS` does not alter the earlier table. Production currently uses BIGINT IDs and a required `domain`. The live consultancy helper also lacked a successful `RETURN`. PR #1244 adds `20261112091600_omega_consultancy_runtime_schema_parity.sql` to add the missing column, preserve existing ID types via text IDs, align verified required/default fields, restore the return value, and update the dispatcher variable. It does not rewrite IDs or create fake requests.
4. The live `consult_requests` table was observed empty (0 rows, 0 null user IDs, 0 null domains). No production rows were modified. The new migration remains `PENDING_REVIEW / NOT_APPLIED` and production-blocking.
5. **Required next gate:** rerun the full isolated migration replay and all 54 runtime adapter probes on the latest updated head, then confirm payload mismatch/retry tests, migration security audit, migration inventory contract, and all relevant CI/security contracts remain green. The prior replay and migration-security audit passed; the full 54-action probe has not yet passed. Do not apply `20261112091600` to production until every gate passes and the migration is reviewed.
6. The performance advisor currently reports one `auth_rls_initplan` warning on `search_index_read`; the pending migration changes `auth.uid()` to the initplan-safe scalar subquery. The advisor also reports 326 unused indexes; do not drop them without workload and query-plan evidence.
7. The current draft PR #1244 also repairs duplicated loops in the exact-SHA Cloudflare production verifier and scopes Semgrep to parser-supported source files without suppressing blocking findings. The latest workflows must pass before merge.
8. After merge, verify Cloudflare serves the exact merge SHA, the release manifest, CSP/HSTS headers, core routes, and full 241-page/same-origin reference smoke test. A GitHub artifact check, Cloudflare preview, or provider migration ledger is not production deployment evidence.

## P1 — GitHub repository protection

The repository's main-branch protection was observed as disabled in the prior release audit. The connected GitHub actions do not expose a branch-protection settings write operation in this session, so this change has not been applied.

An authorized repository administrator should configure:
- require pull requests before merging;
- require the repository's agreed CI/security/release checks, including migration replay, Contracts, Production Contract, CI, CodeQL, Secret Detection, Supply Chain/SBOM, Repository Integrity, Supabase Runtime Contract and Omega Release Readiness;
- require branches to be up to date where compatible with the workflow;
- block force pushes and branch deletion;
- require conversation resolution and dismiss stale approvals after new commits;
- restrict administrator bypass according to the owner's governance policy.

Do not copy status-check names from memory; select the exact check names GitHub reports on a current green PR.

## P1 — Supabase Auth leaked-password protection

The prior security audit recorded leaked-password protection as disabled. The connected Supabase actions in this session can inspect and migrate database state but do not expose an Auth security-settings write operation.

An authorized Supabase project owner should enable leaked-password protection in the Auth security settings, then verify the setting and record the evidence. Do not claim it is enabled based on SQL or migration state.

## P1 — Credential hygiene

The supplied source documents contain credential-like examples and hard-coded local-password examples. No values are reproduced here. Treat any value that was ever active, reused, or copied into a repository, prompt, issue, log, or deployment as exposed:
- revoke and rotate active keys/passwords at their issuing providers;
- inspect provider audit logs and recent access;
- replace local examples with clearly non-secret placeholders;
- keep production secrets in provider-managed secret stores;
- run secret detection after rotation and verify no active credential remains in Git history or deployment artifacts.

This session does not have authority to rotate provider credentials or inspect secret values.

## P2 — Evidence still required for a full production claim

- The live dispatcher branch audit now finds 54/54 action branches. That is not proof that every HTTP endpoint, authorization path, user journey, external provider, persisted side effect or page is operational.
- The public release manifest could not be retrieved through the available inspection channel. Production is not live-verified until the exact-SHA workflow succeeds.
- Provider integrations, payment settlement, KYC/AML, financial execution, blockchain mutation/custody, biometric processing and account erasure remain governed by their existing explicit approval/legal/security boundaries. Do not activate them from blueprint language alone.

## Release acceptance

The platform must not be labelled 10/10 or fully production-ready until the P0 sequence is complete, the P1 owner actions are evidenced, and each product-domain capability has endpoint, authorization, persistence, operational and user-journey evidence.