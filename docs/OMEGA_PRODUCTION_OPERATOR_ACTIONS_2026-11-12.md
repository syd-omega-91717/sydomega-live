# Ω SYD OMEGA 91717 — Production operator actions

**Observed:** 2026-11-12  
**Purpose:** Track production hardening that cannot be completed safely through the currently connected repository and Supabase actions.

This register separates code-controlled work from provider/account settings that require an authorized owner or administrator.

## P0 — Complete the release-safe runtime change

### Provider-applied migrations — verified 2026-11-12

- [x] The authenticated production migration ledger returns **419 versions**, latest `20261112091500`.
- [x] The ledger includes `20261112091300_omega_idempotency_payload_integrity`, `20261112091400_omega_stripe_refund_state_fk_index`, and `20261112091500_omega_search_index_schema_reconciliation`.
- [x] The remote migration snapshot has been reconciled to the provider's 419 version/name records. Ledger evidence is not treated as proof of SQL byte parity.
- [x] The three applied migrations are no longer listed as pending. The two new follow-ups `20261112110000` (runtime adapter schema compatibility) and `20261112120000` (versioned news read-model schema baseline) remain pending review and block release.

### Live database verification — verified 2026-11-12

- [x] Live dispatcher coverage: **54/54** canonical actions (53 module-read branches plus the dedicated consultancy intake write action).
- [x] All seven idempotency helper definitions were re-queried. Each is SECURITY DEFINER with an empty search path and the expected execute boundary: six service-role-only helpers; sovereign event recording is authenticated-only and denied to anon.
- [x] Owner/subject-scoped unique indexes are present for consultancy requests, service orders, agent tasks, notifications, achievement verifications, sovereign events, platform events and audit records. Null-owner system deduplication indexes are present where required.
- [x] The refund-state last-reversal foreign-key index is present.
- [x] All seven compatibility columns on `public.search_index` are present; the authenticated read policy permits only shared or owner rows.
- [x] Security/performance/health advisors were re-run. Health: **0 lints**. Performance: no remaining unindexed refund-state FK finding; one search-index RLS initialization-plan warning and 326 unused-index notices remain. Security: leaked-password protection remains disabled and three internal RLS/no-policy findings remain informational and fail-closed.

### Remaining blocking work

- [ ] Complete a fresh full migration replay and all 54 adapter probes. PR #1242's replay first failed in `CONSULTANCY.cases.read` because optional legacy columns were statically referenced. Follow-up replays then exposed: a missing `created_at` projection in `MEDIA.library.read`; `member_presence.last_seen` versus `last_seen_at`; `omega_platform_events.actor_user_id` versus `user_id`; and `public.news` existing only in the live schema snapshot, not the migration history. PR #1245 now adds schema-safe consultancy projections, the media/presence/event corrections, and a deny-by-default versioned `public.news` baseline with no seeded content. The latest clean replay must still prove all 54 actions before either migration is applied to production.
- [ ] Require all blocking checks to pass. PR #1242 was merged while Full Migration Replay, Contracts, CI and Supply Chain/SBOM were failing. PR #1245 corrects the known failures and adds regression coverage; its checks must be inspected before merge.
- [ ] Merge PR #1245 only after all required checks pass.
- [ ] Require Cloudflare's exact-SHA production verifier to pass for the resulting main commit, including the 241-page and same-origin reference smoke test, CSP/HSTS and the www alias.
- [ ] Record the exact deployed SHA and rollback target. The public release manifest has not yet been independently retrieved through the current inspection channel.

No production schema changes were made by PR #1245. Do not call the platform fully production-ready until the fresh replay, blocking checks, exact-SHA production verification and external owner controls are complete.

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