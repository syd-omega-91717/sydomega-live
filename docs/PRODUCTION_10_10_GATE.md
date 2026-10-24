# Ω SYD OMEGA — Production 10/10 Gate

This is an evidence gate, not a feature checklist. A domain is PASS only when deterministic evidence exists and, where applicable, the live provider independently confirms it. This document deliberately distinguishes repository/CI evidence from live-provider evidence.

## Snapshot

- Audit date: 2026-10-24.
- Main commit at this refresh: `ef468c7c5455f69653766fcd12e8073e760702f9`.
- Provider registry access hardening: [#1068](https://github.com/syd-omega-91717/sydomega-live/pull/1068) merged as `ef468c7c5455f69653766fcd12e8073e760702f9`. The migration is pending and not applied to production. A follow-up [#1069](https://github.com/syd-omega-91717/sydomega-live/pull/1069) removes `metadata` from the Creation Studio query before the restricted column allowlist can be applied safely.
- Runtime evidence refresh: [#1061](https://github.com/syd-omega-91717/sydomega-live/pull/1061), merged as `ccd049f9ae6721c5424fa0e059dce3ad727c070c`. This snapshot supersedes the earlier Stripe-only drift note.
- Payment precision hardening: [#1066](https://github.com/syd-omega-91717/sydomega-live/pull/1066), merged into main at `1c645d060e77167c4bbfb58125df633e3bc5e732`. The follow-up evidence reconciliation [#1067](https://github.com/syd-omega-91717/sydomega-live/pull/1067) is now merged at `cca01a6987c6a82c1de6efc27b9f15b8ed8854a6`. On 2026-10-24, the live Supabase migration history confirmed `20261024091500`, the live `omega_private.record_stripe_payment` definition matched the currency conversion logic, and execute privileges were verified as service_role-only. The remote migration snapshot had lagged the provider state; PR #1067 reconciled the evidence.
- Supabase project: `ydqhzvvoyufiiqvzcjns`; live project status returned `ACTIVE_HEALTHY`.
- **Release status: BLOCKED.** Do not infer deployment parity from passing CI or a healthy Supabase project.

## Latest repository checks

The runtime-evidence refresh PR #1061 passed its required CI, CodeQL, secret-detection, supply-chain/SBOM, full migration replay, contract, repository-integrity, capability-evidence, and Edge Runtime Reconciliation checks. The Stripe currency-precision change was merged through [PR #1066](https://github.com/syd-omega-91717/sydomega-live/pull/1066), and live migration history was reconciled through [PR #1067](https://github.com/syd-omega-91717/sydomega-live/pull/1067). Main commit `cca01a6987c6a82c1de6efc27b9f15b8ed8854a6` had the complete listed repository checks green. PR #1068 then merged the provider registry privilege hardening; PR #1069 adds the required client query compatibility fix. Its checks must complete before the follow-up is merged.

Current provider-side blockers:
- **Vercel status fails** with Vercel's account/deployment-blocked guidance. The Vercel connector returns 403 for team scope `syd-omega-91717s-projects`; team authorization is required before deployment inventory can be queried again.

Runtime parity evidence: on 2026-10-24, all 16 active deployed Edge Function `index.ts` files were compared byte-for-byte (normalizing CRLF and trailing newlines) against their `main` sources; all 16 matched. The runtime manifest was refreshed in PR #1061, and the reconciliation workflow passed. This does not establish end-to-end behavior or payment lifecycle completeness.

The successful isolated migration replay and supply-chain checks are repository evidence, not proof of provider-side lifecycle correctness.

## Current release gate

| Domain | Evidence required | Current state |
|---|---|---|
| Canonical hosting and release parity | READY production deployment for intended main SHA, verified release manifest, independent HTTP smoke checks | **BLOCKED** — GitHub's Vercel status is failing. The last known Vercel READY deployment was reported on commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` from 2026-10-06; this is not current-SHA parity. Vercel team-scope authorization is pending. Cloudflare Pages remains the safer canonical production path while the Vercel restriction is unresolved. |
| Supabase project health | Provider reports project healthy and public endpoints behave as expected | **PARTIAL PASS** — project status is `ACTIVE_HEALTHY`; this does not prove every function or user journey works. |
| PostgreSQL security version | Provider-supported current minor version and review of version-specific upgrade risks | **ACTION REQUIRED / RELEASE BLOCKED** — live project metadata reports PostgreSQL `17.6` (provider image `17.6.1.164`) and `release_channel=withdrawn`, with UTF-8 and ICU collation. The public API marks `withdrawn` as a valid release-channel value, but the specific reason for this image's status is not confirmed. Supabase's 2026-09-25 release notes say PostgreSQL `17.11` is available and closes 44 CVEs; confirm the withdrawn image status and supported upgrade path with Supabase before scheduling changes. Read-only inspection found no `ltree` or `btree_gist` float indexes and no custom operators matching the affected estimator pattern. `pgcrypto` is installed; no application-defined function references to legacy PGP encryption were found, but stored-data usage has not been proven absent. `pgmq` 1.5.1 is installed but `pgmq.meta` is empty and no application-defined function references `pgmq`. Do not upgrade blindly: review provider notices, backup/recovery constraints, and extension compatibility, then schedule the supported dashboard upgrade with owner approval. Do not modify the database version through SQL. |
| Auth leaked-password protection | Supabase Auth HIBP/leaked-password protection enabled and Advisor rechecked | **BLOCKED — PLAN LIMITATION** — the organization is on Supabase Free, and official Supabase documentation states leaked-password protection is available on Pro and above. The live Security Advisor reports `auth_leaked_password_protection` WARN. Do not attempt SQL workarounds or upgrade without explicit owner approval; retain compensating password controls and clearly document that they are not equivalent to provider-side HIBP protection. |
| Owner MFA | Both owner accounts have verified factors before enforcement | **PENDING OWNER ACTION** — latest live aggregate check found 0 of 2 owner accounts with verified TOTP. Enrollment is enabled; enforcement remains off to avoid lockout until both owners verify. |
| RLS and private schemas | RLS and grants match the intended deny-by-default boundary | **REVIEWED** — Advisor INFO for `omega_private.marketplace_listing_assets` is consistent with the documented server-only boundary: RLS enabled, no client policies, and client/service-role privileges revoked. Do not add a client policy just to silence the linter. |
| RPC privilege | High-risk client RPCs are invoker/search-path hardened and regression-tested | **PASS ON EXISTING AUDIT EVIDENCE** — rerun regression checks before release. |
| Migration reproducibility and live-history parity | All committed migrations replay from an empty isolated database; remote history matches provider evidence | **EXISTING LIVE HISTORY RECONCILED; NEW MIGRATION PENDING** — PR #1067 reconciled the live-confirmed `20261024091500` Stripe precision migration. PR #1068 adds `20261024103000_harden_provider_registry_column_access.sql` and registers it as pending/not applied. The isolated full migration replay passed on PR #1068. Apply the provider-registry migration only after PR #1069's Creation Studio query fix is merged, deployed, and verified; then record provider-confirmed history and recheck authenticated and service-role column grants. |
| Edge Function runtime parity | Active deployed source matches reviewed repository source and reconciliation passes | **PASS FOR 2026-10-24 SNAPSHOT** — all 16 active deployed `index.ts` files matched `main`; manifest refreshed and reconciliation CI passed. Recheck after any subsequent function-source change. |
| Payment lifecycle | Signed Stripe event → idempotency → ledger → reconciliation → entitlement → refund/reversal | **BLOCKED** — keep `payments_enabled=false` and `stripe_integration_enabled=false`. The zero-decimal currency conversion migration is present in live migration history and the live settlement RPC was verified to match the source logic. Refund/reversal handling and signed test-mode lifecycle evidence remain incomplete. Live payment-event and reconciliation tables have zero rows; this is absence of test evidence, not proof of a completed lifecycle. No production charges or synthetic payment events. |
| Disaster recovery | Restore into a non-production target; measured RPO/RTO; integrity and access checks | **BLOCKED** — no provider-level restore drill with measured RPO/RTO. Continuity checkpoints are not a database restore test. |
| Privacy lifecycle | Controlled export, deletion, retention expiry, and recovery verification | **PARTIAL** — supporting structures exist; the complete controlled evidence bundle is missing. Use test accounts and do not expose PII in evidence. |
| Provider credentials | Credential presence, least privilege, rotation/revocation, and failure paths verified per provider | **PARTIAL** — provider-specific evidence remains incomplete. Never print secret values into logs or reports. |
| Database performance | Workload-based query plans, latency, and capacity budgets | **REVIEW REQUIRED** — Supabase Advisor reports 327 unused-index INFO findings. The workload review found no index that met the removal shortlist. Do not drop indexes without query-plan evidence, benchmarks, rollback plan, and monitoring. |
| Scale | Representative, bounded concurrency/saturation test with latency, queue, DB, Edge and cost thresholds | **PENDING** — no qualifying load-test report. Do not run destructive stress tests against production. |
| AI quality | Versioned evaluation set, groundedness/retrieval/hallucination scoring, adversarial recovery, latency and cost | **PENDING** — no qualifying versioned evaluation report. Do not label simulated or unverified results as live facts. |

## Conservative recovery decisions

- **Hosting:** keep Cloudflare Pages as canonical while Vercel eligibility and release parity are unresolved. Do not buy credits, upgrade plans, or change billing without explicit owner authorization. Do not attempt to bypass a provider restriction through configuration changes.
- **Payments:** keep `payments_enabled=false`. Do not deploy the changed webhook until refund/reversal handling, signed test-mode lifecycle tests, and runtime-parity evidence pass. Test duplicate delivery, retries, subscription changes/cancellation, settlement, entitlement, refund/reversal, and reconciliation.
- **Database:** retain all indexes until query-plan and workload evidence supports a reversible change. Assess the provider-supported PostgreSQL 17.11 security update; do not initiate an upgrade without a backup/restore plan, compatibility review, and owner-approved maintenance window.
- **Temporary environments:** do not create a billable Supabase branch/project without explicit approval of the quoted cost. If approved later, use synthetic data, assign an expiry, capture evidence, and delete it.
- **Auth:** enable leaked-password protection only through authorized provider settings/Management API. Do not enforce owner MFA until both owners have enrolled and verified factors.
- **Release:** passing CI, static scans, and isolated migration replay are necessary but insufficient. Keep release blocked until live hosting SHA parity, Edge Function parity, payment/privacy lifecycle, DR, MFA, scale, and AI-quality evidence are complete.

## Required next actions

1. Owner authorizes the Vercel team connection; then re-query deployments and diagnose the account restriction. Do not spend money without approval.
2. Merge and deploy [PR #1069](https://github.com/syd-omega-91717/sydomega-live/pull/1069) after all checks pass; verify Creation Studio can list providers with only the six allowed fields.
3. Apply the provider-registry privilege migration through the controlled Supabase migration path, then verify authenticated column grants are limited to the allowlist while service-role worker reads still work. Reconcile `remote-migrations.json` only after provider history confirms the applied version; verify payment flags remain disabled.
3. Review the PostgreSQL 17.6 → 17.11 provider upgrade path against Supabase release notes, extension compatibility, backup/restore constraints, and the project's `pgcrypto` use. Confirm whether the owner approves a maintenance window before any provider-side upgrade.
4. Complete Stripe test-mode lifecycle implementation and tests, including idempotent refunds/reversals; payments remain disabled until signed lifecycle evidence is reviewed. After any later Edge Function change, refresh the runtime manifest and rerun reconciliation.
5. Resolve the leaked-password protection gate: the organization is currently on Supabase Free, while official Supabase documentation limits HIBP leaked-password protection to Pro+. Obtain explicit owner approval for any plan change; otherwise keep this gate BLOCKED and retain compensating controls without claiming equivalence.
6. Both owners enroll and verify MFA; only then enable enforcement through the lockout-safe owner control.
7. Run controlled privacy lifecycle and provider restore drills; record measured RPO/RTO.
8. Run bounded scale and versioned AI-quality evaluations against non-production/test data.

## Evidence rules

1. Never convert BLOCKED, PARTIAL, or PENDING into PASS through documentation.
2. Never fabricate payment, recovery, user, achievement, balance, or provider evidence.
3. A preview deployment or HTTP 200 is not proof that the intended commit is live.
4. A compensating password-breach control is not equivalent to the provider-side Auth setting.
5. An unused-index warning or one `idx_scan=0` observation is not sufficient evidence to drop an index.
6. Production migrations are immutable; schema changes require a new migration.
7. The platform may be called 10/10 only when every gate is PASS, provider-side blockers are cleared, and timestamped evidence is retained.
