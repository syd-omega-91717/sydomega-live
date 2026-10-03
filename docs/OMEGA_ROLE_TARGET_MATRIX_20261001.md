# Ω SYD OMEGA 91717 — Role / Target / Evolution Matrix
Date: 2026-10-01

This matrix is the execution layer for the existing 18-module product contract. It does not replace the canonical feature-purpose matrix or domain registry.

## Classification

- **Role** = what the module must accomplish for the user/platform.
- **Target** = the higher-order product capability this module evolves toward.
- **Current foundation** = existing repository/data/runtime authority.
- **Remaining build** = concrete work that is still justified.
- **Conflict guard** = what must not be duplicated or silently changed.

| # | Module | Role | Target | Current foundation | Remaining build | Conflict guard |
|---:|---|---|---|---|---|---|
| 1 | Core | identity, navigation, control | unified command center with trustworthy live state | shared shell, nav, OS, World | activate compact Command HUD and fresh production journey | one navigation/OS authority |
| 2 | Consultancy | turn requests into professional delivery | governed service marketplace/workspace | consult requests, bookings, meetings | lifecycle proof, assignment, SLA/status telemetry | no second project/workflow store |
| 3 | Gaming & Characters | competition, play, character progression | deterministic multiplayer-ready arena + character graph | gaming pages, matrix, characters, leaderboards | anti-abuse, lifecycle tests, durable session state | no client-authoritative scores |
| 4 | Achievements | convert verified work into recognition | evidence-backed achievement economy | tasks, medals, trophies, certificates | verify award rules and event→verification→award chain | no client minting |
| 5 | Family & Tree Links | relationship/heritage graph | privacy-aware relationship graph | family/bloodline tables and graph surfaces | multi-user RLS + consent + provenance proof | no exposure of unrelated rows |
| 6 | Media | publish, discover and consume media | creator/media operating system | media/publications/assets | rights, ingestion, lifecycle, recommendations, storage E2E | no second content store |
| 7 | Blockchain/NFT | present digital-asset concepts safely | governed digital asset/vault layer | asset/vault/blockchain surfaces | legal decision + provider + custody + transaction proof | remain gated until legally/operationally ready |
| 8 | Communication & Security | communication plus trust | secure communications and identity center | messages, notifications, security controls | MFA/RBAC/audit E2E, notification event coverage | no second auth/notification authority |
| 9 | Horoscope & Elements | personalized thematic experience | explainable personalization/cosmos layer | profile signals, elements, horoscope surfaces | deterministic canon contract + privacy controls | presentation cannot become entitlement |
| 10 | News | trusted information discovery | provenance-aware intelligence feed | news/publication/search structures | source freshness, corrections, ranking, moderation | preserve source provenance |
| 11 | Heritage | preserve evidence and history | durable personal/cultural archive | heritage/family/knowledge structures | export/delete/provenance lifecycle | privacy and rights boundary |
| 12 | Evaluation & Progress | measure development | 729-node progression engine with evidence | matrix, task completion, evolution | authoritative scoring proof + replayable history | no localStorage authority |
| 13 | Passport/Credentials | portable proof | verifiable credential/inventory layer | passport, certificates, assets | export verification + issuance lifecycle | no visual asset equals credential |
| 14 | Legal | make trust operational | policy/consent/compliance control plane | legal pages, consent/audit structures | retention/deletion/vendor evidence | no legal claims without evidence |
| 15 | Gods/Planets/Elements | canonical creative language | coherent lore/cosmos system | canon + visual atlas + element surfaces | resolve vocabulary conflicts through explicit canon decision | never silently rewrite canon |
| 16 | Investment Engine | financial intelligence/simulation | governed decision-support platform | simulation, wallet/ledger concepts, provider structures | reconciliation, risk controls, legal/provider gates | execution remains disabled until gates pass |
| 17 | AI & Intelligence | search, reasoning, orchestration | governed multi-agent intelligence fabric | concierge, AI tables, evidence graph, event fabric | model/tool permissions, provenance, evals, cost controls | provider secrets server-side |
| 18 | Hierarchy | governance and permissions | explicit role×resource×action policy engine | roles, gates, approvals, governance | complete authorization matrix + E2E proof | owner boundary remains server-enforced |

## Cross-platform target

The product should evolve as one system with distinct surfaces:

**WORLD** = discovery and spatial context  
**COMMAND** = action and operational control  
**ASCEND** = progression and learning  
**COSMOS** = identity/canon/visual universe  
**VAULT** = commerce/assets/entitlements  
**ORDER** = relationships/governance  
**SERVICES** = professional/creator/media services  
**INTEL** = research/knowledge/AI

The shell is navigation; domain authorities remain separate.

## Benchmark-derived engineering principles

External research and the repository's source-intelligence registry reinforce these transferable patterns:

- transactional outbox/inbox semantics for durable event delivery;
- idempotent consumers and deterministic delivery IDs;
- durable workflow state instead of in-memory orchestration;
- observable health/readiness/latency/error signals;
- provenance-first knowledge and AI retrieval;
- policy-as-code for authorization/compliance;
- production observability with logs, traces and metrics;
- release gates based on evidence rather than file presence.

These are principles to adapt, not proprietary implementations.

## P0 build order

1. Command HUD activation.
2. Role/target registry and machine-readable contract.
3. Production authorization/MFA evidence.
4. Notification event coverage using the existing event fabric.
5. Stripe entitlement lifecycle verification.
6. Storage upload/read/delete isolation proof.
7. Backup/restore exercise.
8. Current-production smoke evidence.
9. AI tool permission/provenance evaluation.
10. Mobile surface only after the domain contracts above are proven.

## Definition of done

A module is complete only when its role is explicit, target is explicit, authoritative data is known, security boundary is known, failure behavior exists, observability exists, automated verification exists, deployment evidence exists, and unresolved decisions are recorded.
