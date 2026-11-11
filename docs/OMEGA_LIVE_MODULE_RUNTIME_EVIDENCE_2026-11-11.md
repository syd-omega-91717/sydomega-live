# Ω SYD OMEGA 91717 — Live Module Runtime Evidence

**Observed:** 2026-11-11  
**Provider:** Supabase project `ydqhzvvoyufiiqvzcjns`  
**Method:** read-only SQL against the live project. No production data was changed.

## Provider observations

| Catalog | Rows | Meaning |
|---|---:|---|
| `public.omega_capabilities` | 24 | Capability declarations, purpose, data classification, default authorization, lifecycle and dependency metadata |
| `public.omega_services` | 24 | Service declarations and service-level policy |
| `public.omega_module_runtime_actions` | 54 | Module action declarations, endpoints, executors, authorization class, execution mode, data class, evidence/idempotency flags and rollback descriptions |

There are **18 module-bound capability records** for the historical product domains and **6 additional CrossPlatform capabilities**. The runtime-action catalog has 18 module IDs with three actions each; all 54 rows are labelled `INTEGRATED`. Most module-bound capability/service records are `DESIGNED`; Progress and Intelligence are labelled `INTEGRATED`. All module capability records default to `DENY_BY_DEFAULT`.

## Module mapping

### platform-core → CORE

- Capability: `core-orchestration` — DESIGNED; data class `INTERNAL`; default authorization `DENY_BY_DEFAULT`.
- Service: `core-orchestration` — DESIGNED.
- Runtime actions:
  - `CORE.catalog.read` — `/api/core/catalog`; READ; authz `AUTHENTICATED`; executor `omega_capabilities+omega_services`.
  - `CORE.profile.read` — `/api/core/profile`; READ; authz `SELF`; executor `public.profiles`.
  - `CORE.search.read` — `/api/core/search`; READ; authz `AUTHENTICATED`; executor `search adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### consultancy → CONSULTANCY

- Capability: `consultancy-workbench` — DESIGNED; data class `CONFIDENTIAL`; default authorization `DENY_BY_DEFAULT`.
- Service: `consultancy-workbench` — DESIGNED.
- Runtime actions:
  - `CONSULTANCY.cases.read` — `/api/consultancy/cases`; READ; authz `SELF`; executor `consultancy adapter`.
  - `CONSULTANCY.deliverables.read` — `/api/consultancy/deliverables`; READ; authz `SELF`; executor `consultancy adapter`.
  - `CONSULTANCY.intake.create` — `/api/consultancy/intake`; WRITE; authz `AUTHENTICATED`; executor `consultancy adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### gaming → GAMING

- Capability: `gaming-engine` — DESIGNED; data class `INTERNAL`; default authorization `DENY_BY_DEFAULT`.
- Service: `gaming-engine` — DESIGNED.
- Runtime actions:
  - `GAMING.leaderboard.read` — `/api/gaming/leaderboard`; READ; authz `AUTHENTICATED`; executor `leaderboard adapter`.
  - `GAMING.matrix.read` — `/api/gaming/matrix`; READ; authz `SELF`; executor `matrix runtime`.
  - `GAMING.missions.read` — `/api/gaming/missions`; READ; authz `SELF`; executor `mission state`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### achievements → ACHIEVEMENTS

- Capability: `achievement-engine` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `achievement-engine` — DESIGNED.
- Runtime actions:
  - `ACHIEVEMENTS.certificate.read` — `/api/achievements/certificates`; READ; authz `SELF`; executor `omega_certificates`.
  - `ACHIEVEMENTS.definitions.read` — `/api/achievements/definitions`; READ; authz `AUTHENTICATED`; executor `omega_achievement_definitions`.
  - `ACHIEVEMENTS.mine.read` — `/api/achievements/mine`; READ; authz `SELF`; executor `omega_user_achievements`.
- Scope note: Observed actions read definitions, caller achievements and certificates; no award-issuance write action appears in this snapshot.

### family → FAMILY

- Capability: `family-space` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `family-space` — DESIGNED.
- Runtime actions:
  - `FAMILY.graph.read` — `/api/family/graph`; READ; authz `SELF`; executor `family graph adapter`.
  - `FAMILY.heritage.read` — `/api/family/heritage`; READ; authz `SELF`; executor `heritage adapter`.
  - `FAMILY.vault.read` — `/api/family/vault`; READ; authz `SELF`; executor `legacy vault adapter`.
- Scope note: Observed family actions are SELF-scoped and sensitive; this does not replace end-to-end cross-member authorization tests.

### media → MEDIA

- Capability: `media-studio` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `media-studio` — DESIGNED.
- Runtime actions:
  - `MEDIA.jobs.read` — `/api/media/jobs`; READ; authz `SELF`; executor `media job adapter`.
  - `MEDIA.library.read` — `/api/media/library`; READ; authz `AUTHENTICATED`; executor `media adapter`.
  - `MEDIA.publishing.read` — `/api/media/publishing`; READ; authz `SELF`; executor `publishing adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### blockchain → BLOCKCHAIN_NFT

- Capability: `blockchain-lab` — DESIGNED; data class `RESTRICTED`; default authorization `DENY_BY_DEFAULT`.
- Service: `blockchain-lab` — DESIGNED.
- Runtime actions:
  - `BLOCKCHAIN_NFT.assets.read` — `/api/blockchain/assets`; READ; authz `AUTHENTICATED`; executor `asset registry adapter`.
  - `BLOCKCHAIN_NFT.marketplace.read` — `/api/blockchain/marketplace`; SIMULATION; authz `AUTHENTICATED`; executor `marketplace simulation adapter`.
  - `BLOCKCHAIN_NFT.ownership.verify` — `/api/blockchain/ownership/verify`; EXTERNAL; authz `AUTHENTICATED`; executor `external-chain verification gateway`.
- Scope note: Observed actions are asset read, marketplace simulation and external ownership-proof verification. No mint, transfer, custody or trading action is present in this snapshot.

### communication-security → COMMUNICATION

- Capability: `communication-hub` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `communication-hub` — DESIGNED.
- Runtime actions:
  - `COMMUNICATION.events.read` — `/api/communication/events`; READ; authz `SELF_OR_POLICY`; executor `event fabric`.
  - `COMMUNICATION.notifications.read` — `/api/communication/notifications`; READ; authz `SELF`; executor `omega_notifications`.
  - `COMMUNICATION.presence.read` — `/api/communication/presence`; READ; authz `SELF_OR_POLICY`; executor `member presence adapter`.
- Scope note: Communication actions are observed. Security is a cross-cutting control domain; no separate SECURITY runtime module appears in this 18-module action table.

### horoscope-elements → HOROSCOPE

- Capability: `horoscope-oracle` — DESIGNED; data class `PUBLIC`; default authorization `DENY_BY_DEFAULT`.
- Service: `horoscope-oracle` — DESIGNED.
- Runtime actions:
  - `HOROSCOPE.profile.read` — `/api/horoscope/profile`; READ; authz `SELF`; executor `profile adapter`.
  - `HOROSCOPE.provenance.read` — `/api/horoscope/provenance`; READ; authz `SELF`; executor `provenance registry`.
  - `HOROSCOPE.reading.generate` — `/api/horoscope/reading`; SIMULATION; authz `SELF`; executor `interpretive runtime`.
- Scope note: HOROSCOPE actions are mapped here; ELEMENTAL simulation/cosmology actions are mapped to the separate cosmology domain.

### news → NEWS

- Capability: `news-intelligence` — DESIGNED; data class `PUBLIC`; default authorization `DENY_BY_DEFAULT`.
- Service: `news-intelligence` — DESIGNED.
- Runtime actions:
  - `NEWS.feed.read` — `/api/news/feed`; READ; authz `AUTHENTICATED`; executor `news adapter`.
  - `NEWS.provenance.read` — `/api/news/provenance`; READ; authz `AUTHENTICATED`; executor `news provenance adapter`.
  - `NEWS.topics.read` — `/api/news/topics`; READ; authz `AUTHENTICATED`; executor `news adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### heritage → HERITAGE

- Capability: `heritage-archive` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `heritage-archive` — DESIGNED.
- Runtime actions:
  - `HERITAGE.access.read` — `/api/heritage/access`; READ; authz `SELF_OR_POLICY`; executor `heritage policy adapter`.
  - `HERITAGE.documents.read` — `/api/heritage/documents`; READ; authz `SELF`; executor `heritage storage adapter`.
  - `HERITAGE.timeline.read` — `/api/heritage/timeline`; READ; authz `SELF`; executor `heritage adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### progress → PROGRESS

- Capability: `progression-matrix` — INTEGRATED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `progression-matrix` — INTEGRATED.
- Runtime actions:
  - `PROGRESS.matrix.read` — `/api/progress/matrix`; READ; authz `SELF`; executor `matrix runtime`.
  - `PROGRESS.tasks.read` — `/api/progress/tasks`; READ; authz `SELF`; executor `task runtime`.
  - `PROGRESS.verification.read` — `/api/progress/verification`; READ; authz `SELF`; executor `evidence graph`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### passport → CREDENTIALS

- Capability: `credentials-passport` — DESIGNED; data class `PRIVATE`; default authorization `DENY_BY_DEFAULT`.
- Service: `credentials-passport` — DESIGNED.
- Runtime actions:
  - `CREDENTIALS.certificates.read` — `/api/credentials/certificates`; READ; authz `SELF`; executor `omega_certificates`.
  - `CREDENTIALS.passport.read` — `/api/credentials/passport`; READ; authz `SELF`; executor `credential adapter`.
  - `CREDENTIALS.verify.read` — `/api/credentials/verify`; READ; authz `PUBLIC_PROOF`; executor `credential verification adapter`.
- Scope note: Credential/member passport presentation only; it is not a government identity or travel document.

### legal → LEGAL

- Capability: `legal-compliance` — DESIGNED; data class `RESTRICTED`; default authorization `DENY_BY_DEFAULT`.
- Service: `legal-compliance` — DESIGNED.
- Runtime actions:
  - `LEGAL.consent.read` — `/api/legal/consent`; READ; authz `SELF`; executor `consent records`.
  - `LEGAL.privacy.read` — `/api/legal/privacy`; READ; authz `PUBLIC`; executor `legal content`.
  - `LEGAL.terms.read` — `/api/legal/terms`; READ; authz `PUBLIC`; executor `legal content`.
- Scope note: Observed actions are read-only terms, privacy and caller consent reads; this does not prove legal compliance or that erasure/export workflows are active.

### cosmology → ELEMENTAL

- Capability: `elemental-simulation` — DESIGNED; data class `SIMULATION`; default authorization `DENY_BY_DEFAULT`.
- Service: `elemental-simulation` — DESIGNED.
- Runtime actions:
  - `ELEMENTAL.cosmology.read` — `/api/elemental/cosmology`; SIMULATION; authz `AUTHENTICATED`; executor `omega_elemental_runtime`.
  - `ELEMENTAL.interpretation.read` — `/api/elemental/interpretation`; SIMULATION; authz `AUTHENTICATED`; executor `omega_elemental_runtime`.
  - `ELEMENTAL.simulation.run` — `/api/elemental/simulation`; SIMULATION; authz `AUTHENTICATED`; executor `omega_elemental_runtime`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### investment → INVESTMENT

- Capability: `investment-intelligence` — DESIGNED; data class `CONFIDENTIAL`; default authorization `DENY_BY_DEFAULT`.
- Service: `investment-intelligence` — DESIGNED.
- Runtime actions:
  - `INVESTMENT.research.read` — `/api/investment/research`; READ; authz `AUTHENTICATED`; executor `research adapter`.
  - `INVESTMENT.simulation.read` — `/api/investment/simulation`; SIMULATION; authz `SELF`; executor `simulation adapter`.
  - `INVESTMENT.watchlist.read` — `/api/investment/watchlist`; READ; authz `SELF`; executor `investment adapter`.
- Scope note: Observed actions are research read, caller-owned simulation read and watchlist read. No trade execution, custody or yield action is present in this snapshot.

### intelligence → INTELLIGENCE

- Capability: `intelligence-fabric` — INTEGRATED; data class `RESTRICTED`; default authorization `DENY_BY_DEFAULT`.
- Service: `intelligence-fabric` — INTEGRATED.
- Runtime actions:
  - `INTELLIGENCE.agents.read` — `/api/intelligence/agents`; READ; authz `AUTHENTICATED`; executor `omega_agents`.
  - `INTELLIGENCE.evidence.read` — `/api/intelligence/evidence`; READ; authz `SELF`; executor `graph_evidence`.
  - `INTELLIGENCE.retrieval.read` — `/api/intelligence/retrieval`; READ; authz `AUTHENTICATED`; executor `retrieval adapter`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.

### hierarchy → HIERARCHY

- Capability: `hierarchy-governance` — DESIGNED; data class `RESTRICTED`; default authorization `DENY_BY_DEFAULT`.
- Service: `hierarchy-governance` — DESIGNED.
- Runtime actions:
  - `HIERARCHY.entitlements.read` — `/api/hierarchy/entitlements`; READ; authz `SELF`; executor `omega_entitlements`.
  - `HIERARCHY.governance.read` — `/api/hierarchy/governance`; READ; authz `POLICY`; executor `governance audit`.
  - `HIERARCHY.roles.read` — `/api/hierarchy/roles`; READ; authz `SELF`; executor `role registry`.
- Scope note: Catalog and runtime action observations only; route reachability, persistence, provider operation and end-to-end user behavior remain separately unverified.


## Evidence boundary

A row labelled `INTEGRATED` is a provider-side catalog declaration, not an end-to-end test result. This snapshot does not prove endpoint reachability, caller authorization, RLS behavior for each route, persistence, UI integration, error handling, production deployment freshness, or real user outcomes. The canonical product-domain registry therefore retains `implementation_state=UNVERIFIED` and leaves `canonical_capabilities` empty pending the evidence gate.

## Risk controls preserved

- Investment runtime actions are read/simulation only in this observation; no trade, custody, yield or settlement action is declared under INVESTMENT.
- Blockchain/NFT observations are asset reads, marketplace simulation and external ownership-proof verification; no mint, transfer or custody action is declared.
- Passport remains a platform credential presentation, not a government identity or travel document.
- Family and Heritage data is sensitive and SELF/SELF_OR_POLICY scoped; negative cross-user access tests remain mandatory.
- Legal actions observed here are terms/privacy/consent reads; this does not certify compliance or prove erasure/export lifecycle completion.

## Reconciliation

The machine-readable snapshot is `config/omega-live-module-runtime-observations.json`. Each historical product domain references it through `runtime_observation_ref`. A validator is added in this branch to enforce the 18-domain mapping, catalog shape and financial/sensitive-data guardrails. No live Supabase schema, data, edge function, auth setting, or provider configuration was changed.


## Critical live dispatcher drift found after catalog reconciliation

A read-only `pg_get_functiondef('public.omega_runtime_dispatch(uuid,text,jsonb)')` inspection on 2026-11-11 found live definition hash `f4fcee65d41c94a2f8491a2aa53b6612`. Although the provider migration ledger records the wave-2/wave-3 adapter migrations and the live action table labels all 54 actions `INTEGRATED`, the actual live dispatcher contains concrete module/action branches for only **23 of 54** actions. The other **31** are returned by its `ADAPTER_REQUIRED` fallback.

Missing live branches:
- `CORE.search.read`
- `CONSULTANCY.intake.create`
- `CONSULTANCY.cases.read`
- `CONSULTANCY.deliverables.read`
- `GAMING.missions.read`
- `GAMING.leaderboard.read`
- `FAMILY.graph.read`
- `FAMILY.heritage.read`
- `FAMILY.vault.read`
- `MEDIA.library.read`
- `MEDIA.publishing.read`
- `BLOCKCHAIN_NFT.marketplace.read`
- `COMMUNICATION.presence.read`
- `COMMUNICATION.events.read`
- `HOROSCOPE.reading.generate`
- `HOROSCOPE.provenance.read`
- `NEWS.feed.read`
- `NEWS.topics.read`
- `NEWS.provenance.read`
- `HERITAGE.timeline.read`
- `HERITAGE.documents.read`
- `HERITAGE.access.read`
- `PROGRESS.tasks.read`
- `PROGRESS.verification.read`
- `CREDENTIALS.passport.read`
- `CREDENTIALS.verify.read`
- `INVESTMENT.research.read`
- `INVESTMENT.simulation.read`
- `INTELLIGENCE.retrieval.read`
- `HIERARCHY.roles.read`
- `HIERARCHY.governance.read`

This is a production integrity defect and demonstrates why a migration ledger and lifecycle field are not proof of runtime behavior. The branch now includes `20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql`, which restores the wave-2 adapters, implements the remaining read/write handlers with actor scoping and explicit simulation/credential boundaries, and adds a CI contract that requires all 54 canonical actions to map to concrete adapters. The migration is explicitly registered as `PENDING_REVIEW / NOT_APPLIED`; no production database mutation has occurred in this work sequence. It must pass fresh replay, then be applied through the authorized Supabase migration action, after which the remote migration snapshot is updated from provider evidence.


A second cross-user idempotency defect was found during the write-path review: service orders used a globally unique key and an unscoped lookup. The same reconciliation migration now changes service-order idempotency to `(user_id, idempotency_key)` and uses atomic `ON CONFLICT` handling. The isolated SQL probe reuses the same key for two synthetic users and requires distinct order/request IDs while repeated calls by the same user return the same ID.

## Cross-user idempotency audit

A read-only live-schema review found globally unique idempotency keys on member-owned records. This is a collision/isolation defect class; the audit did not observe an actual cross-user exploit. A member retry key could otherwise collide with another member's operation, and some existing helpers returned or updated the globally matched row.

The reconciliation migration now scopes idempotency to the owner or subject for:
- consultancy requests — `(user_id, runtime_idempotency_key)`;
- service orders — `(user_id, idempotency_key)`, while retaining a global partial key for null-user system orders;
- agent tasks — `(user_id, idempotency_key)`, while retaining a global partial key for null-user system tasks;
- notifications — `(user_id, idempotency_key)`;
- sovereign progression events — `(user_id, idempotency_key)`, with a transaction advisory lock so a retry cannot apply the axis delta twice;
- achievement verifications — `(user_achievement_id, idempotency_key)`;
- platform events and audit records — `(actor_user_id, idempotency_key)`, while retaining global deduplication for null-actor system records.

The migration preserves global idempotency where the identifier is inherently system-wide, including event-queue, ledger transaction, provider reconciliation and referral-conversion identities. Existing media-job and mission-transition idempotency already uses user-scoped keys.

The SQL regression probe now checks same-user retries, cross-user collisions and null-owner system deduplication. The expected result is one stable record for the same owner/key, distinct records for different owners using the same key, and one globally deduplicated system record. All probe writes run in a transaction that is rolled back.

These changes remain **pending isolated replay and production application**. The live database has not yet been modified by this migration.
