# Ω SYD OMEGA 91717 — Master Recovery & No-Conflict Execution Matrix

**Purpose:** recover the project decisions and requested systems from prior sessions/documents, reconcile them with the actual repository, and prevent specification drift from being mistaken for implementation.

## 0. Non-negotiable execution rules

1. Preserve working functionality; enhancements are additive or migration-controlled.
2. One source of truth per domain; no duplicate runtime authority.
3. Every claimed feature is classified `VERIFIED`, `IMPLEMENTED/UNVERIFIED`, `PLANNED`, `FICTION/LORE`, or `OWNER DECISION`.
4. No production claim without repository + deployment + backend evidence.
5. High-risk auth/RLS/payment/schema changes require dedicated verification before merge.
6. The existing static Vercel architecture remains the production surface until a measured migration proves a new architecture is safer.
7. `omega-sculpture.js` remains the sole Three.js/WebGL owner; spatial realm work must not create competing WebGL contexts.
8. Narrative/cinematic concepts remain distinct from operational technology and must not create false technical, financial, medical, legal, or scientific claims.

## 1. Recovered product pillars

- Ω brand identity, dark-only futuristic visual system, readable typography, cinematic motion, Ω mark, 9.17 Hz / 91717 identity.
- Command/dashboard and cross-platform navigation.
- Identity: profile, verification/KYC, passport, settings, characters, agents, factions, pantheons, houses.
- Ascension: academy, matrix, gaming, trophies, exams, contributions, evolution, gates.
- Family/heritage: family tree, heredity, heritage assets, privacy tiers.
- Media/universe: cinema, movies, series, trailers, demos, universe, hall, city, feed, social, news.
- Finance/economy: vault, wallet, blockchain, marketplace, portfolio, income, ledger, payments/subscriptions, investment.
- Communication/security: AI concierge/chat, social connections, encryption, notifications, threat/guardian systems.
- Creator economy: creator/idea forge, moderation/review pipeline, content authenticity and uniqueness.
- AI/data: agents, memory, telemetry, autonomous insights, workflow orchestration, search, graph, recommendations.
- Mobile/product expansion: React Native/Expo concept retained as a future product surface; not to be falsely represented as production until built and tested.

## 2. Recovered architecture requirements

The April Master Prompt proposed a React/Vite + TypeScript web monorepo, 12 backend services, Redis, Prisma/PostgreSQL, Docker, Nginx, mobile Expo, Stripe, Socket.io/SSE, Claude/Gemini/Perplexity, and a broad component library. The July research prompt expands the target into enterprise architecture, security, observability, testing, compliance, scalability, governance, documentation, and continuous improvement.

**Current repository reality:** the production repository is a large framework-free static estate with Supabase/Postgres/Edge Functions/Storage and many root `omega-*.js` modules. Therefore the monorepo specification is a target architecture, not permission to replace the working estate wholesale. Migration must be incremental and evidence-driven.

## 3. Recovered security/compliance requirements

- Zero-trust principles.
- Strong auth/session controls, MFA/RBAC, rate limits, secure headers, input validation, XSS/CSRF protections where applicable.
- RLS correctness and policy consolidation.
- Secrets never committed or exposed to clients.
- Audit logs for sensitive actions.
- GDPR export/delete and transparent retention/consent.
- Security scanning, dependency/supply-chain checks, SBOM where feasible.
- Payments through compliant Stripe flows; never store raw payment credentials.
- Privacy-by-design, accessibility, age/parental controls where applicable.
- Clear distinction between fictional lore and operational claims.

## 4. Recovered scalability/reliability requirements

- Redis/cache-aside where justified.
- Queues/workers for asynchronous workloads.
- Pagination and indexed queries.
- Stateless service design for future horizontal scaling.
- CDN/static optimization.
- Performance budgets and regression tests.
- Backups, restore testing, disaster recovery, incident response.
- Observability: errors, performance, security events, critical business events.

## 5. Recovered AI requirements

- Modular agent roles: Sentinel, Analyst, Historian, Tutor, Merchant, Proxy, Oracle, Scout, Warden, Auditor, Beacon, Sovereign.
- AI concierge with streaming UX, context injection, memory, module awareness, moderation, fallback providers, and auditable model/provider usage.
- RAG/vector/semantic search and knowledge-graph capabilities where they solve a real product need.
- Human override and safe tool/action boundaries.
- No unrestricted self-rewriting production code. Evolution is proposed, tested, approved, and deployed through controlled CI/CD.

## 6. Recovered gaming/media/3-D requirements

- Nine-game / nine-film universe concept.
- Character system, progression, trophies, medals, certificates, rewards.
- Movie/series/demo library and content progress.
- Movie ↔ game ↔ character ↔ collectible relationships.
- Cinematic 3-D identity integrated into real navigation and data, not decoration.
- Current spatial realm layer is additive CSS 3-D; existing WebGL ownership remains centralized in `omega-sculpture.js`.
- Next high-value 3-D work: realm-specific scenes, navigable geometry, controlled first-visit cinematic identity, improved compositor path, and data-driven scene content.

## 7. Recovered business/product systems

- Subscriptions and Stripe checkout/webhook.
- Creator/marketplace monetization.
- Referral program.
- Advertising/publicity workflow.
- Enterprise licensing/partnership readiness.
- Digital passport/certificates and user-owned assets.
- Financial dashboards must remain transparent and compliant; speculative currency-control concepts from legacy lore are not operational instructions.

## 8. Legacy concepts requiring explicit separation

The 999-point blueprint contains many creative/fictional concepts plus some unsafe or legally impossible operational claims. These must not be silently implemented as real platform behavior. Examples include orbital sovereignty, legal immunity, government replacement, biometric/DNA control, psychological manipulation, unrestricted autonomous self-rewrite, offensive cyber actions, market manipulation, or impossible medical/physics claims.

The July risk-managed direction explicitly converts these into **Narrative Layer / Fiction / Lore** while the real platform is the **Technology Layer**: premium AI + media + gaming + education + productivity + analytics + creator economy + digital identity infrastructure.

## 9. Known current gaps recovered from repository evidence

### High priority
- Production/deployment integration must be verified end-to-end, not inferred from repository state.
- Live Supabase schema/RLS state must remain synchronized with migrations and client assumptions.
- Remaining RLS consolidation requires controlled live verification for the final policy findings.
- Server-side data integrity/type validation needs expansion to eliminate silent-failure classes.
- Full browser regression coverage is incomplete across the large page estate.
- Critical external integrations (Stripe webhooks, AI providers, Edge Functions, Storage, email/notifications) need production-path verification.

### Product/runtime
- Workflow engine exists but has limited real-world triggers; its event boundaries must be expanded only where they are idempotent and observable.
- Guardian/threat gates exist but privileged action semantics need controlled rollout behind existing feature flags and tests.
- Music/ambient modules have event/mount/CDN-runtime issues documented in the gap analysis and need a dependency-safe implementation.
- Nexus needs an explicit empty state for members without graph data.
- 3-D realm system needs realm-specific data-driven scenes and navigable geometry.
- Navigation lower-section discoverability needs UX treatment rather than unsafe layout hacks.
- i18n needs full page rollout and real language/RTL regression coverage.
- Client-only financial pages need their documented local-backup path preserved unless a secure server migration is intentionally approved.
- `user_assets`-dependent vault/portfolio functionality needs real population/write paths, not empty tables presented as completed inventory.

### Architecture target not yet equivalent to production reality
- React/Vite web application target.
- Expo mobile application.
- 12-service microservice target.
- Redis-backed realtime leaderboard target.
- Socket.io/SSE AI service target.
- Docker/local full-stack target.
- Nginx/Kubernetes/Render multi-service target.
- Full shared TypeScript component system.

These remain migration targets until the repository actually contains and verifies them.

## 10. No-conflict architecture map

| Domain | Runtime authority | Do not duplicate |
|---|---|---|
| 3-D/WebGL | `omega-sculpture.js` | WebGL renderer/context |
| Canon | `omega-canon.js` + canonical data | hard-coded competing canon |
| Navigation | `nav.js` + page-local routing conventions | parallel sidebar systems |
| User/session | existing Supabase/auth modules | second client session authority |
| Supabase access | existing guarded client path | direct unguarded competing clients |
| Progress | existing task/RPC model | client-only shadow progress |
| AI | provider gateway/edge architecture as it matures | browser-exposed provider keys |
| Payments | Stripe checkout/webhook path | client-side payment authority |
| Security | RLS + guardian/threat/telemetry layers | cosmetic-only security badges |
| Content | existing media/publication tables + creator pipeline | duplicate content stores without migration |
| i18n | existing `i18n.js` | page-local translation engines |

## 11. Highest-level execution ladder

### Phase A — Evidence baseline
Repository inventory → live schema → deployment surface → integration matrix → browser smoke suite → security baseline.

### Phase B — Integrity
Finish RLS consolidation → type/runtime validation → silent-write elimination → schema reconciliation → data integrity tests.

### Phase C — Platform UX
Navigation IA → readable type → responsive behavior → i18n rollout → empty/error/loading states → accessibility → consistent data/action affordances.

### Phase D — Real-time and automation
Wire workflows through existing domain events → guarded threat actions → realtime presence/events → notifications → queues where justified.

### Phase E — AI operating layer
Provider gateway → moderation → memory/RAG → agent orchestration → action permissions → evaluation harness → cost/latency telemetry.

### Phase F — Gaming + cinema universe
Data-driven game/media relationships → progression/rewards → character graph → realm-specific 3-D → navigable scenes → cinematic first-visit identity.

### Phase G — Commerce and creator economy
Referrals → marketplace → creator pipeline → advertising → subscriptions → certificates/passport → entitlement enforcement.

### Phase H — Reliability and scale
Caching → queues → performance budgets → load tests → backups/restore drills → observability → incident response → disaster recovery.

### Phase I — Mobile and architecture migration
Build Expo surface from proven web/domain contracts; introduce React/TypeScript service boundaries only where migration reduces risk; never rewrite the production estate solely to match an old prompt.

### Phase J — Enterprise release
Security review → legal/compliance review → accessibility → privacy/data governance → SBOM/dependency review → production canary → rollback verification → release evidence pack.

### Phase Ω — Continuous evolution
Every release repeats: discover → benchmark → design → threat-model → implement → test → deploy → observe → learn → improve.

## 12. Definition of highest phase

The project is not considered at the highest phase because a document says `999/999` or because a UI looks complete. Highest phase means the real system has evidence for:

- functional product flows;
- synchronized database and migrations;
- secure authentication/authorization/RLS;
- reliable payments and external integrations;
- observable AI and automation;
- accessible, responsive, multilingual UX;
- production-grade gaming/media/3-D integration;
- tested backups and recovery;
- CI/CD with quality/security gates;
- documented operations and incident response;
- reproducible deployments;
- measured performance and reliability;
- clear separation of verified technology from fiction/lore;
- controlled, reversible continuous improvement.

This matrix is the recovery anchor for future sessions. New work should update evidence/status here rather than create another disconnected roadmap.
