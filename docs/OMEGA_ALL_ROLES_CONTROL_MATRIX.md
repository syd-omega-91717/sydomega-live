# Ω SYD OMEGA 91717 — All-Roles Control Matrix

**Purpose:** operational control surface for the 18-module product model and the cross-functional team required to take each module from specification to live evidence.

**Rule:** this matrix does not promote a capability. It records the evidence lane that must exist before promotion.

## Evidence ladder

`SPECIFIED → IMPLEMENTED → CONNECTED → PERSISTED → SECURED → TESTED → DEPLOYED → LIVE-VERIFIED`

A page, SQL file, prompt, or successful static check is not by itself production proof.

## Module control matrix

| # | Module | Product / UX | Application | Data / RLS | Security / Compliance | AI / Integration | QA / Runtime | Current control state | Next required proof |
|---:|---|---|---|---|---|---|---|---|---|
| 1 | Platform Core | navigation, shell, Command | shared runtime | session/profile | approval boundary | system services | browser + production smoke | PARTIAL | fresh production journey evidence |
| 2 | Consultancy | service journey | request workflow | consultancy records | member/owner boundary | provider integrations | request lifecycle test | PARTIAL | end-to-end request evidence |
| 3 | Gaming & Characters | game/character UX | game state | game records | ownership/entitlement | media/game services | state transition tests | PARTIAL | representative game lifecycle |
| 4 | Achievements | progression UX | awards/standing | achievement records | anti-forgery rules | optional intelligence | progression regression | PARTIAL | production progression proof |
| 5 | Family & Tree Links | lineage UX | family workflows | family/bloodline/heritage | own-row isolation | none required | cross-user RLS tests | PARTIAL | multi-user row isolation |
| 6 | Media | library/player UX | publishing/media flows | media metadata/assets | storage authorization | external media providers | upload/playback tests | PARTIAL | storage + provider E2E |
| 7 | Blockchain / Crypto / NFT | vault/asset UX | asset workflows | asset/ledger model | legal + authorization | chain provider | transaction simulation/E2E | DECISION REQUIRED | legal/business decision before activation |
| 8 | Communication & Security | messaging/settings | communication flows | notifications/security records | MFA/RBAC/audit | messaging providers | abuse + failure tests | PARTIAL | MFA/RBAC/audit journey |
| 9 | Horoscope & Elements | Cosmos UX | profile-derived presentation | canonical profile fields | privacy boundary | optional provider | deterministic render tests | BUILT / PARTIAL | canon and runtime regression |
| 10 | News | discovery/read UX | feed aggregation | news records | content/provider controls | external sources | freshness/error tests | PARTIAL | provider + freshness evidence |
| 11 | Heritage | records/lineage UX | heritage workflows | heritage records | own-row controls | none required | CRUD + RLS tests | PARTIAL | deletion/export evidence |
| 12 | Evaluation & Progress | progress UX | scoring/progression | task/progress records | anti-manipulation | analytics | calculation regression | PARTIAL | production scoring evidence |
| 13 | Passport / Crypto Card | identity presentation | card/export | profile/credential data | identity/privacy | PDF generation | render/export test | BUILT / PARTIAL | export + identity verification |
| 14 | Legal | terms/privacy UX | consent/legal controls | consent/audit records | retention/deletion | vendor records | legal journey tests | PARTIAL | retention/deletion/consent evidence |
| 15 | Gods / Planets / Elements | Cosmos/lore UX | canonical presentation | canonical configuration | no privileged mutation | none required | vocabulary regression | SPECIFIED / PARTIAL | resolve canon conflicts |
| 16 | Investment Engine | financial UX | financial workflows | ledger/portfolio model | KYC/AML where applicable | market providers | reconciliation tests | DECISION REQUIRED | approved business/legal model |
| 17 | AI & System Intelligence | concierge/agent UX | agent/tool orchestration | evidence/provenance | policy firewall | model routing | eval + abuse tests | PARTIAL | model/tool/evidence contract |
| 18 | Level & Ownership Hierarchy | hierarchy UX | role/gate logic | roles/standing | RBAC/owner boundary | governance services | authorization matrix | PARTIAL | full role × resource matrix |

## Cross-functional release gates

| Control | Required owner roles | Gate |
|---|---|---|
| Identity / session | IAM, Security, Supabase, QA | login, recovery, session expiry and MFA evidence |
| Authorization | IAM, Security, Data, QA | role × resource × action matrix with cross-user tests |
| Storage | Supabase, Security, Privacy, QA | upload/download/delete isolation and failure evidence |
| Payments | Finance, Commerce, Security, Legal, QA | signed webhook, replay/idempotency, reconciliation and refund evidence |
| AI | AI Architect, Security, Data, QA | model/tool permissions, provenance, policy firewall, evaluation evidence |
| Production | SRE, Vercel, DevSecOps, QA | current SHA deployment + smoke + runtime evidence |
| Privacy | Privacy, Legal, Data, Security | export, deletion, retention and vendor evidence |
| Accessibility | UX, Accessibility, QA | keyboard, names, contrast, reduced motion, responsive evidence |
| Recovery | SRE, Data, Security | backup and restoration drill |
| Supply chain | DevSecOps, Security | immutable workflow actions, dependency controls, secret scan |
| Observability | SRE, Data, Product | errors, latency, availability and privacy-safe telemetry |
| Governance | Owner, Product, Legal, Auditor | decision log for disputed canon/business activation |

## Current P0/P1 control priorities

1. MFA, recovery and session lifecycle.
2. Complete role × resource authorization matrix.
3. Storage deletion/retention path.
4. Cross-user RLS regression at row level.
5. Edge Function authentication, replay and rate-limit tests.
6. Audit-log retention and incident-response evidence.
7. Backup/restore exercise.
8. Responsive, keyboard, accessible-name and reduced-motion verification.
9. Complete 18-module evidence mapping.
10. Commerce activation decision before enabling dormant financial/token capabilities.
11. AI model router, tool permissions, provenance and policy firewall evidence.
12. Fresh production smoke evidence for the current main SHA.

## Conflict-prevention rules

- Extend an existing owner module before creating a parallel implementation.
- Do not introduce a second provider for an existing responsibility without a recorded migration decision.
- Do not silently reconcile conflicting canon; record the conflict and require an owner decision.
- Do not promote `VERIFIED` from historical text.
- Do not treat a missing live-provider check as successful.
- Do not activate financial/token functionality merely because schema or UI exists.
