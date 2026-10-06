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
## Enforcement status (measured live 2026-10-06)

- **Reachable since `20261006170056`.** The tables shipped with policies and no
  `GRANT`; `omega_creation_surface()` raised `42501` for every member until the
  grant migration. Verified by impersonation: a member reads and writes only
  their own rows, a spoofed `owner_id` is refused by RLS, `anon` is refused.
- **The truth boundaries above are declared, not enforced.** Members hold full
  write on their own rows, so a client can set `truth_state='LIVE'` or
  `status='READY'` with no provider job, and can write `experience_runs.score`
  and `state` directly. The `truth_contract` keys returned by
  `omega_creation_surface()` are constants, not checks. Until server-owned
  columns exist (a trigger or a definer RPC writing `status`, `truth_state`,
  `provider*`, `content_sha256`, `score`), no asset or run is evidence.
- **`PUBLISHED` experiences are readable by their owner only.** No policy lets
  another member read a published definition, so nothing is playable by anyone
  but its author, and a run's `experience_id` is checked by FK only.

The last two are open in `GAP_ANALYSIS.md` §S.
