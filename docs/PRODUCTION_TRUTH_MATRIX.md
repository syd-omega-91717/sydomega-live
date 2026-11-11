# Ω SYD OMEGA 91717 — Production Truth Matrix

**Purpose:** One operational ledger separating what exists from what is proven.

> **Current operational snapshot — 2026-11-11.** This dated section supersedes older rows below wherever they conflict. The original matrix remains as historical context; do not treat its September/October deployment, table-count or Auth statements as current without re-verification.

## Current production snapshot (2026-11-11)

| Area | Current evidence | Truth / remaining gate |
|---|---|---|
| Production host | Cloudflare Pages Git integration on `main`; exact release manifest verified for commit `5700c8ac47c6fc129969162a72cd70ba2a1a82eb` | **PRODUCTION-VERIFIED** for that SHA: root and www final HTTP 200, CSP/HSTS present, eight core routes pass after canonical redirects. |
| Full page/link smoke | New `production-smoke.yml` workflow and `cloudflare-production-smoke.py` are in PR #1240 | **PENDING MERGE/RUN**: 241 registered pages, same-origin links/assets and page identity comparison have not yet been verified by this new workflow. |
| Vercel | `vercel.json` Git auto-deployment is disabled for `*`, `**` and `main`; the pre-merge main workflow still contains a dormant gated promotion path | PR #1240 replaces that workflow with **build-artifact validation only** and removes Vercel credentials/deploy steps. This is pending until PR #1240 merges; do not re-enable Vercel promotion. |
| Supabase public schema | Read-only live catalog: **286 public tables; 286/286 have RLS enabled; 0 public RLS tables without policies** | Structural RLS invariant is **PRODUCTION-VERIFIED**. This does not replace policy-semantic and cross-user authorization tests. |
| Supabase migration ledger | **415 recorded versions**, latest applied version `20261104090000` | Migration ledger is not proof that live function bodies match migration source. |
| Runtime catalog | **24 capabilities, 24 services, 54 runtime actions, 18 product domains** | Catalog cardinality verified; capability/service lifecycle labels are not end-to-end proof. |
| Runtime dispatcher | Live `public.omega_runtime_dispatch(uuid,text,jsonb)` has **23/54 concrete action branches**; 31 registered actions fall through to `ADAPTER_REQUIRED` | **OPEN P0**. PR #1240 contains migration `20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql` and a fresh replay/54-action probe. It is not applied to production. |
| Runtime gateway | Deployed `omega-runtime-gateway` source exactly matches repository `index.ts` at the inspected revision | Gateway source parity verified; this does not repair the stale database dispatcher until the migration is applied. |
| Supabase Auth | Security Advisor reports **1 WARN**: leaked-password protection disabled | **OPEN P1**. Owner must enable it in Supabase Authentication settings; the connected Supabase tools expose no Auth-setting write action. Supabase documents the control as Pro plan and above: [Password security](https://supabase.com/docs/guides/auth/password-security). |
| Private RLS tables | Three INFO findings: `omega_private.marketplace_listing_assets`, `private.erasure_log`, `private.erasure_policy` have RLS but no policies | Read-only checks found no SELECT grants for `anon` or `authenticated` on these tables. Keep private; do not add permissive policies to silence the advisor. |
| Refund-state FK | Advisor reports one unindexed FK: `omega_private.stripe_refund_state.last_reversal_transaction_id` | A full B-tree index is included in the same pending PR #1240 migration; verify after replay/application. |
| Unused indexes | Advisor reports **325 candidates** | No indexes were dropped. A zero-scan sample includes primary-key and Supabase Auth/system indexes; require workload-window and query-plan evidence before pruning. |
| Page estate | **241 page contracts**; 205 `domain: UNVERIFIED`; 36 descriptive labels; 34 records contain 36 candidate annotations across 23 labels | Page-to-module mapping remains **PARTIAL/UNVERIFIED**. Do not infer canonical product-domain IDs from similar page labels. |
| Branch governance | GitHub main branch protection is disabled in the inspected repository state | **OPEN P1**. Enable rules/rulesets requiring the applicable CI, CodeQL, security, migration replay, production contract and review checks. |
| Current release status | PR #1239 (redirect-aware exact-SHA Cloudflare verifier) merged; main commit `5700c8ac47c6fc129969162a72cd70ba2a1a82eb` passed exact-SHA production verification | Production release is verified for that commit. This is not a 10/10 platform certification. |

### Current release blockers

1. **P0 — Runtime dispatcher drift:** merge PR #1240 only after all required checks, fresh full migration replay and all 54 runtime probes pass; then apply the migration, reconcile the remote migration ledger and verify the live function/privileges/indexes.
2. **P1 — Leaked-password protection:** owner action in Supabase Dashboard; do not represent the browser-side HIBP check as equivalent.
3. **P1 — Branch governance:** main branch protection/rulesets are not enabled.
4. **P1 — Full page proof:** merge and run the Cloudflare smoke workflow against the exact deployed SHA; remediate any failing registered page or same-origin reference.
5. **P2 — Cross-module page mapping:** reconcile the 241-page estate to the 18 product domains using explicit page-action/data/auth evidence; keep unknown pages unassigned.
6. **P2 — Auth/MFA/RBAC, payments, backup/restore and critical mobile journeys:** remain unverified until representative end-to-end tests are executed.


## Status key

| Status | Meaning |
|---|---|
| IMPLEMENTED | Code/config/schema exists. Runtime behavior not necessarily proven. |
| RUNTIME-VERIFIED | Exercised in a representative runtime/test harness. |
| PRODUCTION-VERIFIED | Verified against the live production system. |
| PARTIAL | Some required behavior exists; the complete contract is not proven. |
| OPEN | Known gap or blocker. |
| DECISION REQUIRED | Owner/canon decision is required before implementation. |

## Platform foundation

| Capability | Present evidence | Current truth | Next proof/action |
|---|---|---|---|
| Ω sovereign web surface | Large root HTML/JS estate | IMPLEMENTED | Continue regression testing |
| Shared bootstrap | `bg.js` | IMPLEMENTED | Keep single-owner rule |
| Navigation taxonomy | `nav.js` | IMPLEMENTED | Resolve discoverability of lower sections |
| Page identity system | `omega-identity.js` | RUNTIME-VERIFIED in prior audit | Regression test representative pages |
| Cinematic 3-D layer | `omega-sculpture.js` | RUNTIME-VERIFIED for current scenes | Realm scenes, navigation and performance work remain |
| Reduced-motion handling | Shared motion/sculpture paths | IMPLEMENTED / PARTIAL | Full accessibility pass |
| Production domain | `sydomega.com`, `www.sydomega.com` | PRODUCTION-VERIFIED on 2026-09-15 | Keep production smoke on every release |

## Supabase

| Capability | Current truth | Required next action |
|---|---|---|
| Production project | Active production project established | Keep canonical project ID documented |
| PostgreSQL | Live; direct SQL verification completed 2026-09-15 | Continue schema verification |
| Public tables | **229** at live verification 2026-10-01 | Re-run inventory before each release |
| Public functions | **current inventory not re-counted in the 2026-10-01 snapshot** | Re-run privilege/function audit |
| RLS | **229/229** public tables have RLS enabled at live verification 2026-10-01 | Complete policy-semantic regression and member/owner access tests |
| Tables without policies | **0** at live verification 2026-10-01 | Preserve this invariant |
| Six unrestricted Phase-5 INSERT policies | Fixed in live database | Regression audit |
| Leaked password protection | **DISABLED** in the live Supabase Auth configuration; Security Advisor warning remains | Keep the Free-tier HIBP compensating control; provider-level closure requires the Supabase feature to be enabled |
| Migration history | Live migration history reconciled through the 2026-10-01 convergence evidence | Check schema drift before each release |
| Storage | Live buckets/policies verified 2026-09-26; `avatars`/`uploads` owner-scoped DELETE policies exist; live object count currently 0 | Exercise a real isolated authenticated upload/read/delete and cross-user denial test before marking lifecycle production-verified |
| Edge Functions | **Source/live mismatch remains under reconciliation**: the 2026-10-01 live snapshot confirms active functions including concierge, concierge-orchestrator, growth-orchestrator, product-orchestrator, stripe-webhook, secrets-health, agent-execute and evidence-graph, while repository source contains additional functions | Reconcile each source function to `DEPLOYED`, `LOCAL-ONLY`, or `RETIRED`; do not deploy unreviewed functions automatically |

## Authentication

| Contract | Truth | Next action |
|---|---|---|
| Email auth | Enabled | E2E register/login test |
| Email confirmation | Enabled | Test confirmation and first login |
| Anonymous sign-in | Disabled | Keep unless product decision changes |
| Manual linking | Disabled | Keep unless explicitly required |
| MFA | Architecture/specification exists | Verify enrollment/challenge/recovery |
| RBAC/owner access | Schema and guards exist | Prove every privileged route/action server-side |
| Password reset | Required by production auth contract | E2E test |
| Session invalidation | Required | E2E test after password/security changes |
| Password breach compensating control | Browser-side HIBP k-anonymity guard is tested and shared by account/recovery flows | Keep distinct from provider-level Supabase leaked-password protection |

## Deployment / CI

| Contract | Truth | Next action |
|---|---|---|
| Vercel build configuration | Implemented | Keep successful current deployment evidence |
| Main deployment policy | Implemented | Verify current production alias on each release |
| Vercel production deployment | **INTEGRATION STATUS PASS** for release commit `52a32f14d7fbbfa61f442fac0e1e2d3c36b8d9e9`; GitHub combined status reports Vercel `success`. Direct connected-Vercel inspection remains blocked by a 403 scope authorization response. | Restore connected Vercel scope authorization and independently inspect deployment ID, production alias, logs and browser smoke |
| GitHub workflows | **PR #470 corrected-commit verification is green on 2026-09-26**: CI, CodeQL, Contracts, Supabase Runtime Contract, Supabase Migration Security Audit, Production Contract, Runtime Contract, Repository Integrity, Release Readiness, Capability Evidence, Intelligence Fabric and Workflow Contract all passed | Preserve concurrency policy and investigate any new failure at root cause |
| Production smoke checks | Implemented and successful for the prior release evidence set; current Vercel production deployment is not independently established in the 2026-10-01 snapshot | Require successful execution as release evidence |
| Branch protection | Not independently verified | Read current rules/rulesets before relying on them |

## Payments / financial integrity

| Contract | Truth | Next action |
|---|---|---|
| Stripe integration | Backend functions exist | Test checkout + signed webhook end-to-end |
| Entitlements | Partially represented | Verify lifecycle: purchase, renewal, cancellation, expiry |
| Webhook idempotency | Must be explicit | Add/verify idempotency event store |
| Financial ledger | Existing ledger functionality exists | Verify immutable accounting semantics and reconciliation |
| Investment execution | Not production-complete | Keep execution disabled until legal/provider controls are complete |
| Crypto/NFT | Surface and backend concepts exist | Keep high-risk execution behind explicit production gates |

## AI / intelligence

| Contract | Truth | Next action |
|---|---|---|
| AI/concierge surface | Present | Verify live provider path and fallback |
| Agent roster | Present as product/canon system | Keep UI claims distinct from autonomous runtime |
| AI memory/data | Database structures exist | Audit retention, deletion and authorization |
| Autonomous actions | Some backend structures exist | Enforce explicit permission/approval boundaries |
| Financial/legal/medical AI | Product concepts exist | Add policy classification and disclaimers before operational use |
| AI cost tracking | Existing OmegaFinOps module is active | Verify estimates and owner-only visibility |

## Product modules

The 18-module product taxonomy remains the target product model. Each module must be treated as a separate capability contract rather than as proof that a page exists.

1. Platform Core
2. Consultancy
3. Gaming & Characters
4. Achievements
5. Family & Tree Links
6. Media
7. Blockchain / Crypto / NFT
8. Communication & Security
9. Horoscope & Elements
10. News
11. Heritage
12. Evaluation & Progress
13. Passport / Crypto Card
14. Legal
15. Gods / Planets / Elements
16. Investment Engine
17. AI & System Intelligence
18. Level & Ownership Hierarchy

For each module, the next audit must record: page(s), data source, write path, authorization boundary, external provider, failure mode, test, and production evidence.

## Known decisions that MUST remain open

- Gate count/name vocabulary conflict: repository canon currently uses twelve; do not silently replace it with nine from concept art.
- Element vocabulary/count conflict: do not silently merge art and repository canon.
- Ascension vocabulary conflict: current progression data controls runtime behavior until the owner decides otherwise.
- 3-D expansion priorities: Sovereign Ident, realm scenes, navigable 3-D nodes and optimization remain product/engineering decisions.
- Music module: currently injected broadly but has no page trigger; do not add CDN payload blindly. Either surface it intentionally with a vendored dependency and error handling, or remove/limit the injection after owner/product decision.

## Release gate

A production release should not be declared complete until all P0/P1 items below are green:

- [x] Current Vercel deployment succeeds for the current release evidence set.
- [x] `sydomega.com` and `www.sydomega.com` serve the intended build.
- [x] Production smoke tests pass for current release SHA `4d4919d0a004dcb25ece8a1fe4f241911ff61567`.
- [x] GitHub verification workflows execute successfully for current main verification set.
- [ ] Supabase Security Advisor has zero unresolved findings. **Open provider-level item: leaked-password protection is disabled on the current Free plan.**
- [ ] RLS regression audit passes at policy-semantic level; current structural invariant is 220/220 RLS-enabled and 0 tables without policies (live inventory verified 2026-09-23).
- [ ] Auth/MFA/RBAC E2E flow passes. **MFA enrollment/challenge/recovery remains unverified.**
- [ ] Stripe checkout/webhook/entitlement flow passes in the intended environment.
- [x] No privileged browser credentials were found by the release-contract audit.
- [ ] Critical user journeys pass on mobile-sized and desktop viewports.
- [ ] Accessibility and performance gates pass for representative pages.
- [ ] Backup/restore procedure has been exercised.
- [x] Current release evidence records Git SHA, deployment evidence and Supabase transport reachability.
- [ ] Latest main SHA has fresh production smoke evidence for all critical journeys.
- [x] Repository production-proof contract exists and is wired into the Vercel validation workflow.

**This matrix intentionally does not invent completion. It is updated only when evidence changes.**
