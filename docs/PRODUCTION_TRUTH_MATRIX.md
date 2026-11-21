# Ω SYD OMEGA 91717 — Production Truth Matrix

**Purpose:** One operational ledger separating what exists from what is proven.

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
| Production domain | `sydomega.com` and `www.sydomega.com` both served main SHA `4cd09c4e95b7e39c0d0a45a95f3e2d7275d956db` on 2026-11-21; both returned HTTP 200; production verifier passed 242/242 registered pages and 380 same-origin references; CSP and HSTS were present | PRODUCTION-VERIFIED for this exact release | Re-run exact-SHA release verification on every main deployment |

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
| Storage | Read-only production evidence 2026-11-20: `uploads` is private with server-enforced 50 MiB limit and `allowed_mime_types=NULL`; live `content-ingest` v13 verifies byte-signature MIME and SHA-256, with `scan_state=UNAVAILABLE` and `review_state=PENDING_REVIEW`; latest counts: `storage_files=0`, `omega_creative_assets=0`, `omega_media_jobs=0`, `media_reservations=0`, `media_items=36`. Marketing, Publishing and Marketplace now use governed registration (Marketplace via merged PR #1454); KYC remains a separate direct-upload lifecycle. | PARTIAL / PRODUCTION-OBSERVED: no production member upload transaction or catalog population; MIME allowlist intentionally unset pending KYC validation and platform-wide format policy; malware scan/quarantine, rights clearance and authorized delivery remain OPEN | Complete KYC byte-signature/document validation, malware quarantine provider, approved MIME/signature policy, rights review and controlled production owner upload/download/expiry/delete/audit E2E before public delivery or AI ingestion |
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
| Vercel production deployment | **NOT VERIFIED / PROMOTION POSTPONED** on 2026-11-21: the Vercel workflow explicitly reported that Vercel credits were not renewed and skipped production promotion. Its fallback smoke validated the Cloudflare-served release; this is not evidence of a Vercel deployment. | Restore Vercel billing/credits and connected scope authorization, then perform an explicit production promotion and independently verify deployment ID, alias, logs and browser smoke |
| GitHub workflows | **PR #470 corrected-commit verification is green on 2026-09-26**: CI, CodeQL, Contracts, Supabase Runtime Contract, Supabase Migration Security Audit, Production Contract, Runtime Contract, Repository Integrity, Release Readiness, Capability Evidence, Intelligence Fabric and Workflow Contract all passed | Preserve concurrency policy and investigate any new failure at root cause |
| Production smoke checks | **PRODUCTION-VERIFIED 2026-11-21** for main SHA `4cd09c4e95b7e39c0d0a45a95f3e2d7275d956db`; apex and www both served the exact SHA, root/world/evidence returned HTTP 200, and production surface verifier checked 249 routes | Preserve exact-SHA verification; distinguish Cloudflare Pages delivery from Vercel promotion |
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

- [ ] Vercel production promotion is independently verified. **Current production delivery is Cloudflare Pages; the 2026-11-21 Vercel promotion was postponed because credits were unavailable.**
- [x] `sydomega.com` and `www.sydomega.com` serve the exact main SHA `4cd09c4e95b7e39c0d0a45a95f3e2d7275d956db` (2026-11-21 Cloudflare Pages verification).
- [x] Production release smoke passes for exact main SHA `4cd09c4e95b7e39c0d0a45a95f3e2d7275d956db` (242/242 registered pages; 380 references; 249 production surface routes).
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
