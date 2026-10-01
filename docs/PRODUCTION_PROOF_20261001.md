# Ω SYD OMEGA 91717 — Production Proof Ledger — 2026-10-01

This ledger records only evidence that was actually exercised or observed. It does not convert source-code presence into runtime proof.

## Current release anchor

- Repository: `syd-omega-91717/sydomega-live`
- Main release commit under verification: `52a32f14d7fbbfa61f442fac0e1e2d3c36b8d9e9`
- Proof contract: `scripts/production-proof-contract.py`
- Supabase project: `sydomega` / `ydqhzvvoyufiiqvzcjns`

## Verified now

| Proof surface | Evidence | Status |
|---|---|---|
| Repository lineage | Current main contains the convergence hardening commit and required progression bridge files | PASS |
| Repository proof machinery | Production proof contract added and designed to fail on missing proof infrastructure | PASS |
| Supabase database | 229 public base tables observed live | PASS |
| Supabase RLS coverage | 229/229 public tables have RLS enabled | PASS |
| Supabase policy coverage | 349 public RLS policies observed; no table without policy in the audited public inventory | PASS |
| Progression bridge | Authoritative migration + event bus + workers are present in main | PASS |
| Progression infrastructure | Live omega_platform_events, omega_platform_evidence, omega_event_queue, and omega_dead_letters exist | PASS |
| Realtime | notifications and sovereign_events are in supabase_realtime publication | PASS |
| Task completion boundary | Public complete_task delegates to private.complete_task; owner/non-owner behavior was previously exercised with rollback | PASS |
| Missions | 9 live omega_missions rows observed | PASS |
| Vercel GitHub status | GitHub combined status for release commit reports Vercel = success | PASS |
| Production domain | Prior production verification exists for sydomega.com and www.sydomega.com | VERIFIED-HISTORICAL |
| Security advisor | One provider-level warning remains: leaked-password protection disabled | OPEN |
| Performance advisor | 257 unused-index findings remain; no destructive bulk deletion is justified | OPEN/REVIEW |
| Stripe runtime | Live counts are currently 0 for subscriptions, webhook events, and invoices | UNPROVEN |
| Storage lifecycle | Buckets/policies exist; live object count is 0 | UNPROVEN |
| Auth/MFA/RBAC E2E | Architecture exists, but enrollment/challenge/recovery and complete privileged-route E2E are not fully proven | UNPROVEN |
| Backup/restore | No current exercise evidence | UNPROVEN |
| Critical browser journeys | No fresh full-journey evidence for this release SHA | UNPROVEN |
| Accessibility/performance | No fresh representative-page release gate evidence | UNPROVEN |
| Vercel provider inspection | Connected Vercel API currently returns 403 for the project/team scope, so deployment details/logs cannot be independently inspected from this session | OPEN |

## Important interpretation

A successful GitHub Vercel status is evidence that the Vercel integration reported success for the release commit. It is not the same as independently inspecting the deployment, production alias, runtime logs, or browser behavior.

Likewise, structural RLS coverage is not equivalent to semantic authorization coverage. The remaining proof must exercise authenticated member, owner, and cross-user denial paths without creating a second authorization authority.

## Required release gates still open

1. Supabase Auth leaked-password protection: provider-level setting.
2. Auth E2E: registration/confirmation/login/reset/session invalidation/MFA recovery.
3. Authorization E2E: representative member/owner/denial matrix.
4. Storage E2E: authenticated upload/read/delete plus cross-user denial.
5. Stripe E2E: checkout, signed webhook, idempotency, entitlement, renewal/cancel/expiry.
6. Progression E2E: authoritative task -> event -> verification -> award -> replay/history.
7. AI E2E: provider path/fallback, permission boundary, provenance, retention and cost controls.
8. Backup/restore: perform and document a restore exercise.
9. Browser release smoke: critical desktop/mobile journeys on the release SHA.
10. Accessibility/performance: representative-page gates.
11. Vercel provider inspection: restore connected-scope authorization and capture deployment ID/log evidence.

## Non-actions

- Do not bulk-delete the 257 unused indexes without workload analysis.
- Do not populate the empty role/permission tables as a second authorization system.
- Do not enable financial, crypto/NFT, or autonomous execution merely to manufacture production evidence.
- Do not mark a feature production-verified because a page, schema, or function exists.

## Reproduction

Run the repository-side proof contract:

`python3 scripts/production-proof-contract.py`

Run the convergence audit:

`python3 scripts/omega-convergence-audit.py --json`

Live provider evidence must be captured separately and appended to this ledger with its timestamp, release SHA, query/test, result, and failure evidence where applicable.
