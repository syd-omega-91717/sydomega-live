# Ω SYD OMEGA 91717 — Source Canon & Conflict Register

## Purpose

The project has several historical source documents with different roles. This register prevents an agent from treating a historical concept, prompt, or visual/lore document as proof of the current production architecture.

## Authority hierarchy

When sources conflict, use this order:

1. Live production evidence — deployed application, verified Vercel deployment, live Supabase state, executed tests, and current Git SHA.
2. Repository contracts — production truth matrix, capability registry, security contracts, module contracts, migration contracts, and CI gates.
3. Current implementation architecture — the actual files and runtime paths in sydomega-live.
4. Current product architecture documents — gameful evolution, feature-purpose, provenance and other explicitly current design contracts.
5. Historical master prompts — implementation intent and target-state requirements; not proof that the requested stack was ever deployed.
6. 999-point Sovereign Blueprint — conceptual, narrative, speculative and archival material unless an item has independently passed the production lifecycle.
7. External inspiration/research — transferable principles only; never source-of-truth for project state.

## Five uploaded source documents

| Source | Canonical role | Implementation authority |
|---|---|---|
| 999-Point Sovereign Blueprint — Nano Detail Expansion | Conceptual / archival / lore / speculative requirements | None by itself |
| SYD OMEGA 91717 — Master Prompt | Historical target architecture and feature specification | Reference only; reconcile before implementation |
| Ω SYD OMEGA 91717_Document | Earlier full-stack product specification | Reference only |
| Absolute | Prompting, critique, humanization and reasoning techniques | Process guidance only |
| SYD OMEGA 91717 | Research, benchmarking and continuous-improvement directive | Governance/research guidance |

## Architecture conflicts found

### Current runtime vs historical React monorepo

The historical Master Prompt specifies React/Vite, React Native/Expo, Express microservices, Prisma/PostgreSQL, Docker and a monorepo.

The current repository is a large dependency-light static HTML/JavaScript surface with Supabase and Vercel contracts.

Decision: evolve the current production surface incrementally. Do not replace the repository with the historical monorepo merely because the prompt describes it.

### React + Tailwind vs React/Vite vs static runtime

The uploaded documents contain multiple frontend descriptions.

Decision: the repository and current production contracts define implementation reality. A framework migration requires an explicit architecture decision, measured benefit, migration plan, and rollback path.

### Database choices

Historical documents mention PostgreSQL, Prisma and MongoDB.

Decision: current Supabase PostgreSQL and its migrations/RLS are the active persistence authority. Do not introduce MongoDB or a second ORM/database solely to satisfy historical text.

### Financial rules

The blueprint contains multiple ownership, liquidity, reinvestment, tier, commission and token-economy rules.

Decision: these are not executable financial truth. Any financial behavior must use an authoritative ledger, explicit business/legal approval, provider controls, idempotency, reconciliation and production evidence.

### KYC/KYS

The blueprint uses a fictional/conceptual KYS construct involving loyalty and astrological intent.

Decision: it cannot replace identity verification, KYC/AML, sanctions controls, consent, or lawful eligibility checks. Astrological or symbolic systems may remain entertainment/lore where clearly labeled.

### Medical, biological and mental-health concepts

The blueprint contains biological digital-twin, DNA, medical-data, longevity and mental-health concepts.

Decision: these are high-risk concepts, not implementation authority. Any real health-data capability requires explicit consent, data minimization, security/privacy controls, lawful basis, retention/deletion rules, and domain-specific review. Hidden behavioral restrictions based on inferred mental state are not permitted as a default product mechanic.

### Cyber-warfare and autonomous defense language

The blueprint contains offensive-sounding cyber-warfare and autonomous response concepts.

Decision: translate these into defensive security controls only: detection, isolation, rate limiting, revocation, incident response, safe automation and audited containment. No autonomous offensive activity is inferred from the blueprint.

### Geopolitical / sovereignty / legal-immunity claims

Narrative claims about absolute sovereignty, geopolitical power or legal immunity are not system permissions or legal facts.

Decision: treat them as lore/brand narrative unless separately established through lawful, documented evidence.

### Physics / biological / absolute performance claims

Claims such as Planck-scale latency, impossible-to-hack cryptography, perfect prediction, universal control, or guaranteed uptime are not engineering requirements.

Decision: convert only technically testable goals into measurable SLOs, benchmarks and acceptance criteria.

## Credential hygiene finding

The uploaded historical documents contain plaintext credential-looking values and infrastructure identifiers.

Required action: treat any credential that may ever have been real as exposed. Revoke/rotate it at its provider and replace historical documents with placeholders. Do not copy these values into the repository, prompts, tickets, screenshots or generated code.

The current repository search performed during this audit found no matching sk_test_, AIza, or rnd_ credential values in tracked code. The secret-pattern scanner itself is intentionally present in the repository and is not a credential.

OWASP recommends least privilege, revocation, rotation, lifecycle metadata and rapid containment for exposed secrets.

## Implementation rule

A source item becomes eligible for implementation only after:

SOURCE → CLASSIFY → SPECIFY → IMPLEMENT → CONNECT → PERSIST → SECURE → TEST → DEPLOY → LIVE-VERIFY

If the source is conceptual, speculative, fictional or contradictory, classification must remain visible.

## Regression rule

No future change may silently:

- replace the active stack with a historical stack;
- create a second database authority;
- create duplicate progression/achievement state;
- treat artwork as ownership;
- treat route reachability as business correctness;
- treat lore as real-world fact;
- treat an exposed credential as usable;
- enable financial/medical/high-risk automation without its dedicated control contract.

## Research integration rule

External research supplies transferable patterns, not project state. Current examples adopted into the architecture include:

- evidence/provenance-first capability presentation;
- event-backed achievement evaluation;
- explicit simulation boundaries;
- progressive rendering rather than platform-wide 3D;
- realtime updates with authorization boundaries;
- supply-chain provenance and SBOM opportunities;
- AI observability and standardized telemetry vocabulary.
