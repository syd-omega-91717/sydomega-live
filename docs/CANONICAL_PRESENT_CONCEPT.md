# Ω SYD OMEGA 91717 — Canonical Present Concept

**Status:** AUTHORITATIVE BUILD GUARDRAIL  
**Scope:** Production repository (`syd-omega-91717/sydomega-live`)  
**Purpose:** Prevent future work from conflicting with the platform that exists today.

## 1. Rule zero — preserve before extending

This repository is a living production surface. Future agents and engineers MUST:

1. Inspect the current implementation before changing it.
2. Preserve working behavior unless a change has a documented reason and a verified replacement.
3. Prefer additive, compatible changes over rewrites.
4. Never replace the current platform with a smaller demo, mock, scaffold, or simplified frontend.
5. Never claim a capability is production-ready merely because a page, SQL table, function, or configuration file exists.
6. Verify runtime behavior before marking a capability DONE.
7. Update the evidence/audit record in the same change when a capability's state changes.

## 2. Current production architecture

The current repository's production architecture is:

```text
User Browser
    |
    v
Vercel / sydomega.com
    |
    +--> Static recursive web surface (HTML/CSS/JS/assets)
    |
    v
Supabase
    +--> Auth
    +--> PostgreSQL / RLS / RPC
    +--> Storage
    +--> Edge Functions
    |
    +--> External providers where explicitly integrated
```

The repository currently has no framework-required `src/` application as the canonical web runtime. The root web pages are deployed as the web surface. `bg.js` and the shared Omega modules form the runtime layer.

The original Master Prompt describes a React/Vite/TypeScript application, 12-service backend, Redis, Docker and Expo mobile architecture. Those specifications remain product/target requirements where not yet implemented, but MUST NOT be represented as the current production architecture unless independently verified.

## 3. Design language — preserve it

All new user-facing work MUST remain compatible with the present Ω identity:

- Ω is the primary visual symbol.
- Dark-only presentation; do not introduce a light mode.
- Cinematic, futuristic, premium and readable.
- Gold/cyan/crimson accents remain available through existing design ownership.
- Existing typography and design-system ownership must be reused rather than duplicated.
- The 9 / 9.17 / 91717 motifs may be used as product language, structure and interaction motifs.
- Cinematic effects must never reduce navigation clarity, accessibility or functional usability.
- Prefer larger, readable type and clear primary actions over ornamental density.

## 4. Runtime ownership rules

Before editing a shared behavior, identify its current owner.

- `bg.js`: global bootstrap, shared design injection, approval guard and runtime module loading.
- `nav.js`: navigation taxonomy and page-to-axis mapping.
- `theme.js` / `css/omega-system.css`: canonical palette/type token ownership.
- `omega-identity.js`: page identity/axis presentation.
- `omega-sculpture.js`: 3-D sculpture layer and its canon-driven scenes.
- `omega-motion.js`: shared motion behavior.
- `omega-dataguard.js`: data/loading failure presentation.
- `omega-bottom-stack.js`: bottom chrome measurement/coordination.
- Supabase RLS: actual database authorization boundary for client data access.

Do not create a second global owner for an existing responsibility without documenting the migration and proving there is no cascade/runtime conflict.

## 5. Canon is data, not duplicated prose

Where the repository already has canonical configuration/data, new visualizations MUST read that source instead of inventing a second copy.

Examples:

- 3-D scenes read the platform canon/realm data.
- Page identity comes from navigation taxonomy.
- User authority comes from persisted authorization state.
- Financial and other sensitive state must come from server-authoritative data where the feature is intended to be server-backed.

If two existing canonical sources disagree, STOP and record the conflict. Do not silently choose one in a new feature.

## 6. Present canon conflicts that remain intentionally OPEN

The repository audit has identified owner-level canon decisions that must not be silently resolved by implementation:

- Concept art says nine gates in places while the repository canon currently uses twelve gates.
- Multiple twelve-gate name sets exist and may represent distinct systems or canon drift.
- Concept art and repository data differ on element counts/names.
- Concept art describes nine ascension stages while current repository progression uses twelve tiers.

Until the owner settles these, implementation MUST read the current repository canon for functional behavior and MUST NOT hard-code an alternative count from concept art.

## 7. Lore / fiction / production boundary

The 999-point blueprint is part of the project's creative and strategic universe, but not every point is a permissible production behavior.

Use four classifications:

- **PRODUCTION:** implementable product capability.
- **R&D:** future technical research, behind a controlled boundary.
- **LORE/FICTION:** world-building and narrative material; never represented as an active system capability.
- **PROHIBITED OPERATIONAL BEHAVIOR:** never implement harmful, coercive, unauthorized surveillance, credential abuse, destructive cyber, legal-evasion, or unauthorized financial-control behavior.

Present-tense UI must not falsely represent a lore/R&D concept as an operational capability.

## 8. Security non-negotiables

- Never commit secrets, private keys, service-role keys, provider tokens or credentials.
- Never weaken RLS to make a feature easier.
- Never restore an unrestricted `WITH CHECK (true)` write policy without a documented, reviewed access model.
- Never trust client-only role flags for authorization.
- Never expose service-role credentials to browser code.
- Every state-changing integration must have authorization, validation, error handling and appropriate idempotency.
- Financial, identity, legal, medical and AI-sensitive actions require explicit policy boundaries and auditability.

## 9. Evidence standard

Use these status meanings consistently:

- **IMPLEMENTED:** code exists.
- **RUNTIME-VERIFIED:** code was exercised successfully in a representative runtime.
- **PRODUCTION-VERIFIED:** live production behavior was independently tested.
- **PARTIAL:** only part of the promised capability is proven.
- **UNVERIFIED:** implementation exists but evidence is insufficient.
- **OPEN:** known gap remains.
- **DECISION REQUIRED:** implementation depends on an unresolved owner/canon/product decision.

Do not convert IMPLEMENTED into PRODUCTION-VERIFIED without evidence.

## 10. Build sequence for future work

Every feature should follow:

```text
Existing implementation audit
        ↓
Canonical source identification
        ↓
Conflict check
        ↓
Security/data model
        ↓
Minimal compatible implementation
        ↓
Runtime verification
        ↓
Production verification where possible
        ↓
Evidence update
        ↓
Commit
```

## 11. What NOT to do

Do not:

- replace the static production surface with a new framework merely for fashion;
- delete existing pages because a smaller architecture is easier;
- duplicate shared CSS/token systems;
- add a second navigation taxonomy;
- fabricate backend responses to make a page appear complete;
- mark mock/demo data as live;
- silently resolve canon conflicts;
- expose unfinished financial/blockchain/AI behavior as operational;
- introduce runtime CDN dependencies when an approved self-hosted/vendor pattern exists;
- add a new global script without measuring its page-wide payload and runtime impact.

## 12. Definition of done

A change is complete only when:

- it follows the current architecture;
- it follows the present Ω concept;
- it does not duplicate or conflict with an existing owner;
- security boundaries remain intact;
- existing pages remain intact;
- the changed path is runtime-tested;
- failures are surfaced honestly;
- documentation/evidence is updated;
- no known regression is knowingly left behind.

**This document is a build guardrail, not a replacement for the product blueprint. The product blueprint supplies intent; the live repository supplies present implementation reality; evidence decides completion.**
