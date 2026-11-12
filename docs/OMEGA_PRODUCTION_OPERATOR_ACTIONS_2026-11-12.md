# Ω SYD OMEGA 91717 — Production operator actions

**Observed:** 2026-11-12  
**Purpose:** Track production hardening that cannot be completed safely through the currently connected repository and Supabase actions.

This register separates code-controlled work from provider/account settings that require an authorized owner or administrator.

## P0 — Complete the release-safe runtime change

1. Pass the full isolated Supabase migration replay for all local migrations, including the 54-action runtime probe, immutable-payload conflict tests and refund-state FK index migration.
2. Pass the migration security audit, Contracts, Production Contract, CI, CodeQL, Secret Detection, Supply Chain/SBOM, Repository Integrity and release-readiness checks.
3. After successful isolated replay, apply `20261112091300_omega_idempotency_payload_integrity.sql`, `20261112091400_omega_stripe_refund_state_fk_index.sql` and `20261112091500_omega_search_index_schema_reconciliation.sql` to the production Supabase project through the authorized migration action.
4. Verify the provider ledger records all three new migration versions (expected 419 applied versions), re-query the seven helper definitions and their execute grants, confirm the new refund-state FK index, the reconciled search-index columns/RLS policy, and all owner-scoped indexes.
5. Recheck the Supabase security/performance/health advisors. The expected result is no unindexed refund-state FK warning; do not drop unused indexes without workload evidence.
6. Update `remote-migrations.json` and `pending-migrations.json` from the actual provider result; do not infer application from a green repository workflow.
7. Merge the reviewed PR and require Cloudflare's exact-SHA production verification to pass for the merge commit. The 241-page and same-origin reference smoke test must pass. A Cloudflare branch preview is not production evidence.

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