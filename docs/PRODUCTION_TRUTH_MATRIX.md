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
| Production domain | `sydomega.com`, `www.sydomega.com` configured historically | UNVERIFIED | Verify current HTTP response and deployment |

## Supabase

| Capability | Current truth | Required next action |
|---|---|---|
| Production project | Active production project established | Keep canonical project ID documented |
| PostgreSQL | Live | Continue schema verification |
| Public tables | 212 at last live audit | Re-run inventory before release |
| Public functions | 128 at last live audit | Re-run privilege/function audit |
| RLS | 212/212 public tables enabled at last live audit | Re-run after schema changes |
| Six unrestricted Phase-5 INSERT policies | Fixed in live database | Regression audit |
| Leaked password protection | Enabled by owner | Refresh Security Advisor and record zero findings |
| Migration history | Live migrations applied; latest known migration recorded separately | Check schema drift before each release |
| Storage | Present in architecture | Audit buckets/policies and exercise upload/download |
| Edge Functions | Present | Verify deployed versions and secrets without exposing them |

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

## Deployment / CI

| Contract | Truth | Next action |
|---|---|---|
| Vercel build configuration | Implemented | Inspect a successful current deployment log |
| Main deployment policy | Implemented | Verify current production alias |
| Vercel management access | Previously blocked by scope/re-authentication | Re-authenticate correct project/team scope |
| Recent deployment errors | Previously observed on PR deployments | Obtain current deployment logs and close root cause |
| GitHub workflows | Implemented | Restore runner reliability and obtain green executions |
| Production smoke checks | Implemented | Require successful execution as release evidence |
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

- [ ] Current Vercel deployment succeeds.
- [ ] `sydomega.com` and `www.sydomega.com` serve the intended build.
- [ ] Production smoke tests pass.
- [ ] GitHub verification workflows execute successfully.
- [ ] Supabase Security Advisor has zero unresolved findings.
- [ ] RLS regression audit passes.
- [ ] Auth/MFA/RBAC E2E flow passes.
- [ ] Stripe checkout/webhook/entitlement flow passes in the intended environment.
- [ ] No secrets are exposed in repository or client bundle.
- [ ] Critical user journeys pass on mobile-sized and desktop viewports.
- [ ] Accessibility and performance gates pass for representative pages.
- [ ] Backup/restore procedure has been exercised.
- [ ] Release evidence records Git SHA, deployment ID, migration state and test results.

**This matrix intentionally does not invent completion. It is updated only when evidence changes.**
