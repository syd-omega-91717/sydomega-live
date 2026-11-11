# Ω SYD OMEGA 91717 — 18-Module Repository Traceability Audit

**Audit date:** 2026-11-11  
**Repository baseline:** `main` at `5537d5baabdbd4eaac1d7fa3619981a62b437208`  
**Scope:** reconcile the historical 18-module product contract against the current page-contract registry, product-domain registry, capability registry and visible data-contract references.

## Executive result

The repository has a strong inventory foundation, but the 18-module domain registry is currently a scaffold rather than a completed implementation map.

| Evidence surface | Observed state |
|---|---:|
| Canonical product domains | 18 / 18 present |
| Product domains with implementation state beyond UNVERIFIED | 0 / 18 |
| Product domains with canonical capability links | 0 / 18 |
| Product domains with authoritative data sources | 0 / 18 |
| Product domains with dependencies | 0 / 18 |
| Product domains with telemetry definitions | 0 / 18 |
| Product domains with acceptance tests | 0 / 18 |
| Product domains with release evidence | 0 / 18 |
| Product domains with accountable owner assigned | 0 / 18 |
| Page contracts | 241 / 241 present |
| Page contracts with domain UNVERIFIED | 205 / 241 |
| Page contracts with an OPEN_TASK review item | 241 / 241 |
| Capability registry entries | 15 |
| Capability registry entries with verified=true | 0 / 15 |

These counts describe **traceability/evidence completeness**, not whether the associated pages render or whether every feature is absent. Candidate page names below are leads for review, not approved canonical mappings.

## Capability registry snapshot

| Status | Count | Entries |
|---|---:|---|
| BUILT | 4 | platform-runtime, identity, roadmap, accessibility |
| PARTIAL | 6 | feed, approvals, family, social, observability, import-export |
| BROKEN | 2 | transactions, wallet-balances |
| LOCAL_ONLY | 1 | search |
| TESTED | 2 | internationalization, production-contract |

All 15 entries currently have `verified=false`. The status labels are the registry's own status values; they must not be interpreted as production verification. The two BROKEN entries are material blockers for financial/asset functionality. No blockchain, crypto, investment, custody, token, or balance capability should be promoted from these records.

## Module-by-module evidence map

The candidate routes are taken from existing page-contract paths and page-domain labels. A route being present does not establish that it is the canonical module entry point.

| # | Product module | Candidate page surfaces | Data / capability evidence currently recorded | Main gap / disposition |
|---:|---|---|---|---|
| 1 | Platform Core (Auth & Profile) | account.html, profile.html, identity.html | `profiles`; capability `identity` (BUILT, not verified); runtime `bg.js` | Define canonical identity/session journey, MFA/recovery/session expiry, role/resource matrix and production proof. |
| 2 | Consultancy Hub | consultancy.html | `consult_requests`, `profiles`; no linked capability | Verify request lifecycle, member/owner authorization, status transitions, notification and failure/retry behavior. |
| 3 | Gaming & Characters | gaming.html, character.html, characters.html | `profiles`, `task_completions`; `get_points_leaderboard`, `my_progression` on character surface | Separate simulated game state from persisted competitive state; test replay, tamper resistance, entitlement and server authority. |
| 4 | Achievements System | achievements.html, trophies.html | `certificates`, `medals`, `profiles`, `task_completions`, `trophies`; no linked capability | Require event/evidence provenance and anti-forgery tests before an award is treated as earned. |
| 5 | Family & Tree Links | family.html | `bloodline_nodes`, `family_nodes`, `heritage_records`, `profiles`; capability `family` (PARTIAL) | Complete row-level cross-user isolation, consent, correction, export and deletion evidence. |
| 6 | Media (Movies / Series / Demos) | media.html, movies.html, series.html | Media hub contract has no data source; movie/series contracts currently mention `profiles` only; no linked capability | Map catalog, asset storage, provider rights, upload/playback/delete and content moderation contracts. |
| 7 | Blockchain / Crypto / NFT | blockchain.html, wallet.html, vault.html, cosmic-ledger.html | `my_points_balance` appears on blockchain page; `user_assets` appears on vault; `transactions` and `wallet-balances` capabilities are BROKEN | Page domain currently labels blockchain.html as AI. Points are not proof of crypto assets. DECISION REQUIRED; no live financial/token claims or activation. |
| 8 | Communication & Security | security.html, social.html, notifications.html | `social` capability PARTIAL; `social_broadcasts`, `social_connections`, `omega_notifications`, `profiles`; no dedicated messaging capability | Define channel ownership, message privacy, abuse controls, notification delivery and security/MFA evidence separately. |
| 9 | Horoscope & Elements | horoscope.html, signal.html, elements.html | `profiles`; domain labels include Horoscope / Personal Signals; no linked capability | Separate deterministic profile-derived presentation from external-provider data and LORE; document source, consent and failure state. |
| 10 | Media & News | news.html | `dispatches`, `profiles`; RPC `published_dispatches`; no linked capability | Verify publisher provenance, freshness, moderation, source attribution and provider outage handling. |
| 11 | Heredity & Heritage | heritage.html, family.html | `heritage_records` appears in family data contract; heritage page itself only references `profiles`; no linked capability | Resolve ownership overlap with Family; prove own-row access, consent, export and deletion before sensitive lineage use. |
| 12 | Evaluation & Progress | quest-progress.html, my-quests.html, gaming.html, character.html | `quest_completions`, `task_completions`; RPC `my_progression`; no dedicated progress capability | Specify authoritative scoring, idempotency, anti-manipulation, replay and regression tests; do not infer earned state. |
| 13 | System Passport & Crypto Card | passport.html, profile.html, identity.html | Profile surfaces reference `profiles`, `certificates`, `character_records`, `evolution_events`; no passport capability | Define as a platform membership/credential only, never a government identity or travel document; verify claims and export privacy. |
| 14 | Legal & Rights | terms.html, privacy.html | `consent_records`, `profiles`; RPCs `request_account_erasure`, `update_consent`; no legal capability | Retention, consent, export and erasure lifecycle need policy approval and end-to-end proof; do not activate dormant erasure by assumption. |
| 15 | Gods, Planets & Elements | cosmos.html, elements.html, world-atlas.html, world-shell.html, world.html, worlds.html | No authoritative data or capability links recorded in these page contracts | Keep proposed cosmology distinct from approved canon; label lore/simulation/future content and require owner decisions for canon changes. |
| 16 | Asset Ownership & Investment Engine | invest.html, investment.html, ledger.html, payments.html, vault.html, wallet.html, revenue.html | `user_assets` and `access_audit_log` on vault; transactions/wallet-balances BROKEN; no verified investment capability | DECISION REQUIRED. No investment, custody, yield, token, trading, payment or balance activation without legal, accounting, risk and provider approval. |
| 17 | AI & System Intelligence | insight.html, intelligence.html, autonomous-insights.html, personal-intelligence.html | `graph_entities`, `graph_relationships`, `graph_events`, `graph_evidence`, `agent_experiments`, `agent_performance_metrics`, `autonomous_insights`; no linked AI capability | Add model/tool provenance, permission boundary, policy firewall, evaluation, abuse tests, latency/cost and fallback evidence. |
| 18 | Level & Ownership Hierarchy | levels.html, approvals.html, identity.html | `approvals` capability PARTIAL; identity surfaces expose profile/role-related RPC references; no complete role-resource matrix | Build role × resource × action tests including owner-only routes, negative cases, escalation and cross-user denial. |

## Structural findings

1. **Domain registry is structurally complete but semantically empty.** All 18 records exist and have the required fields, but each has `implementation_state=UNVERIFIED`, `accountable_owner=UNASSIGNED`, `customer_job=UNVERIFIED`, empty capability/data/dependency/telemetry/test/release arrays, and unverified authorization/failure/rollback descriptions.
2. **Page registry is an inventory, not a completed contract.** It has 241 records, but 205 domains remain UNVERIFIED and every page still has a PAGE::*::REVIEW open task.
3. **Capability registry coverage is narrow.** Only 15 capability entries exist, 12 page contracts link to them, and none is marked verified. Several module areas have no canonical capability.
4. **Some labels are semantically inconsistent.** `blockchain.html` is currently classified under domain AI while its route and RPC naming suggest a different product surface. This needs an explicit correction, not keyword-based auto-mapping.
5. **Family and Heritage overlap.** `heritage_records` is referenced by the family page data contract while the separate heritage page does not list that table. Ownership and privacy boundaries need an explicit decision.
6. **Financial records are not live balances.** A table name, RPC, page, points field or UI card is not evidence of custody, settlement, token ownership, valuation or investment performance.
7. **Main branch protection is disabled in the observed GitHub branch metadata.** `protected=false`; this means repository-level required status checks are not enforced by branch protection at this time. This is a P0 governance risk. Enable branch protection/rulesets with required checks, review requirements and no force-push/deletion through the GitHub repository settings after confirming the exact required check names.

## Priority plan

### P0 — governance and risk containment
- Enable main-branch protection/rulesets and require the full blocking CI/security/release checks.
- Keep financial, crypto, KYC, biometric and erasure features gated pending explicit legal/product/provider decisions.
- Preserve all current UNVERIFIED states until evidence is attached.

### P1 — complete the domain contracts
For each of the 18 domains, record:
- accountable owner and customer job;
- canonical page/capability IDs (only after owner review);
- authoritative tables/RPCs and data classification;
- authorization boundary and negative cases;
- truth states and failure/retry behavior;
- dependencies, telemetry, acceptance tests, operating cost/owner;
- release evidence and rollback/retirement path.

### P2 — verify vertical slices
Prioritize Platform Core, Family, Consultancy, Achievements, Media, News, Progress and Hierarchy as bounded user journeys. Keep Blockchain and Investment in DECISION REQUIRED until the commercial/legal/security model is approved. Validate each vertical slice from browser interaction through Supabase persistence/RLS, events/evidence, tests, CI, preview and exact production SHA.

## Evidence discipline

The page and capability data above are repository declarations, not fresh live-provider verification. This audit did not execute authenticated production journeys, inspect private Supabase rows, or verify a production deployment. Status promotion must follow the repository evidence ladder:

`SPECIFIED → IMPLEMENTED → CONNECTED → PERSISTED → SECURED → TESTED → DEPLOYED → LIVE-VERIFIED`

Do not change a domain to IMPLEMENTED, TESTED or PRODUCTION-VERIFIED solely to make the matrix look complete.

## Source files inspected

- `docs/OMEGA_ALL_ROLES_CONTROL_MATRIX.md`
- `config/omega-product-domain-registry.json`
- `config/omega-page-contracts.json`
- `docs/capabilities/registry.json`
- `config/omega-requirement-control-plane.json`
- `config/omega-source-traceability-v2.json`
- `scripts/omega-unified-core-contract.py`
- `scripts/capability-audit.py`
- `scripts/omega-all-roles-control.py`

**Audit conclusion:** the 18 modules are all represented in the product-domain registry, but none is yet connected to a complete, evidence-backed domain contract. The next engineering work must fill those contracts from existing implementation and verified behavior, not by inventing capabilities or promoting page names into production proof.
