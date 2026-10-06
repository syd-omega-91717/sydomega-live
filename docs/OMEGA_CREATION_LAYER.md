# Ω Creation Layer

The Creation Layer turns image, video, movie, game, simulation, story, world, and interactive concepts into one governed production domain.

## Creation grammar

IDEA → PROJECT → PROMPT/RULES → PROVIDER JOB → ASSET → LINEAGE → EXPERIENCE → RUN → EVENT → EVIDENCE → ANALYTICS

## Domains

- **Ω Visual Forge** — image creation, variants, lineage, licensing and publication.
- **Ω Cinema** — treatment → script → storyboard → shots → edit → soundtrack → master.
- **Ω Game Forge** — world → rules → quests → entities → player state → action → event → evidence → progression.
- **Ω Simulation Lab** — economic, strategic, scientific and training simulations with explicit SIMULATED state.
- **Ω World Builder** — real geography separated from fictional Ω civilization layers.
- **Ω Story Engine** — Knowledge Loom + characters + scenes + media + interactive decisions.

## Canonical objects

- `omega_creative_projects`
- `omega_creative_assets`
- `omega_experience_definitions`
- `omega_experience_runs`

All have ownership, lifecycle/truth state, lineage or versioning, and RLS.

## Provider principle

Adobe, image generation, video generation, game tooling, search, knowledge retrieval, GitHub, Vercel, Supabase and future connectors are **adapters**, not sources of truth.

The database owns:

- authorization
- ownership
- lineage
- provenance
- truth state
- licensing metadata
- publication state
- auditability

## Truth boundaries

Generated media is never represented as human-authored without provenance.

Fictional worlds never become real-world telemetry.

Simulated game results never become financial balances or real-world achievements automatically.

Provider success never automatically means public publication.

No provider secret belongs in client code.

## Status

The database layer is implemented. Provider-specific generation adapters, rendering pipelines, game execution, and the public Creation Studio UI remain separate implementation phases and are not falsely marked LIVE.

## Enforcement status — measured live 2026-10-06

The previous client-write gap is **closed in the live database**.

- Authenticated clients no longer have direct INSERT/UPDATE/DELETE privileges on the four Creation Layer tables.
- Creation and mutation are performed through authenticated public RPC wrappers.
- Privileged implementations live in the non-exposed `private` schema, use `SECURITY DEFINER`, `search_path=''`, and explicit ownership checks.
- Anonymous execution of the public creation RPCs is denied.
- Project creation is forced to `DRAFT / USER-CREATED`.
- Asset creation is forced to `DESIGNED / USER-CREATED` with unverified user-origin provenance.
- Experience creation is forced to `DRAFT / SIMULATED`.
- Run creation and state transitions are server-owned; run score is not client-writable.
- Experience steps emit canonical `omega_platform_events` records.
- Published experiences are readable by authenticated members; draft and retired experiences remain owner-scoped.
- A rollback transaction exercised the creation RPC and confirmed the enforced `DRAFT` state without leaving test data.
- Security Advisor remains at the single pre-existing warning: leaked-password protection is disabled.

## Remaining reality gap

Provider-specific adapters, verified provider jobs, artifact storage delivery, content hashing, licensing verification, publication workflows, and the public Creation Studio remain to be built.

Until a real provider job produces verifiable output, a creative asset must remain visibly `USER-CREATED` / `DESIGNED` rather than `LIVE`.

The Creation Layer is therefore **secured and persisted, but not yet provider-live**.
