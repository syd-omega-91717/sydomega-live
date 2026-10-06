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