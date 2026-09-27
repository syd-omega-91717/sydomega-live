# Ω SYD OMEGA 91717 — Gameful Living Platform Architecture

## Purpose

Transform the existing platform from a collection of pages and visual modules into a **living, gameful operating environment** without turning business functions into decorative game mechanics.

The rule is:

> Every visual/game mechanic must represent a real capability, real data, a deterministic simulation, or an explicitly labeled fictional/lore layer.

## Experience model

Each surface has six layers:

1. **World** — where the user is: Core, Realm, Module, Mission, Vault, Arena, Archive.
2. **Player state** — identity, permissions, progression, preferences, achievements and active tasks.
3. **Capability** — the actual product job being performed.
4. **Live state** — database/API/realtime state that makes the surface alive.
5. **Simulation** — forecasts, scenarios, training, what-if models and games; simulation output is never presented as historical fact.
6. **Presentation** — HUD, map, cards, timelines, graph, 2D/3D scene, audio and motion.

## Core loop

`OBSERVE → CHOOSE → ACT → RECEIVE STATE → LEARN → PROGRESS → UNLOCK`

The loop must remain useful even with animation disabled.

## Reality labels

Every visual state is one of:

- `LIVE` — directly sourced from production data.
- `CALCULATED` — deterministic calculation over live data.
- `SIMULATED` — model/what-if result; never represented as a real event.
- `USER-CREATED` — content authored by a member.
- `LORE` — fictional/cinematic content.
- `UNAVAILABLE` — the required source or model is not available.

Never invent metrics to make a dashboard look alive.

## World primitives

### Realm
A product domain with a clear purpose and data contract.

### Mission
A concrete user objective with:
- trigger
- prerequisite
- action
- completion evidence
- reward/progression
- failure/retry state

### Quest
A multi-step mission. Quest completion must be backed by real events or explicitly simulated training events.

### Achievement
A durable record generated from verified events. It must never be awarded merely because a UI element was opened.

### Inventory
A representation of real user-owned digital assets, credentials, saved artifacts or explicitly virtual game items.

### Energy
A visual abstraction for available tasks/activity only if its formula and source are documented. It must not imply financial value unless backed by a real financial ledger.

### Map
A navigation and state visualization. Nodes should link to actual routes/capabilities.

### Arena
A controlled environment for games, simulations, experiments or competitions.

### Archive
Evidence/history: actions, documents, milestones, events, decisions and generated artifacts.

### Command HUD
A compact cross-platform control layer exposing current context, status, mission, alerts and navigation.

## Rendering strategy

Do not convert all 200+ pages into 3D.

Use progressive enhancement:

- Tier 0: semantic HTML + accessible data UI.
- Tier 1: cinematic CSS/HUD.
- Tier 2: Canvas/SVG visualizations.
- Tier 3: selective 3D scenes.
- Tier 4: real-time simulation/multiplayer where the business case exists.

3D must be opt-in at the mount level and must not become a platform-wide dependency.

## Performance rules

- Keep the current static/Vercel architecture until measured evidence justifies migration.
- Load 3D engines only on pages that mount a 3D surface.
- Prefer instancing and pooled objects.
- Dispose GPU resources on teardown.
- Use progressive asset loading.
- Use fixed timestep for deterministic simulations.
- Server-authoritative state for competitive/shared simulations.
- Respect reduced motion and provide non-animated equivalents.
- Measure frame time, memory, network cost and Core Web Vitals.

## Live-data rule

A gameful surface is incomplete if it only changes appearance.

A live surface must expose:
- source
- freshness timestamp
- loading state
- empty state
- stale state
- error state
- retry path
- authorization boundary
- audit/evidence path where consequential

## Safe simulation rule

Simulation output must carry:
- model/version
- input snapshot
- assumptions
- timestamp
- deterministic seed where applicable
- result
- confidence/uncertainty when meaningful
- clear `SIMULATED` label

## Feature lifecycle

`IDEA → SPECIFIED → IMPLEMENTED → CONNECTED → PERSISTED → SECURED → TESTED → DEPLOYED → LIVE-VERIFIED`

A visual prototype is not a production capability.

## Inspiration translated into OMEGA patterns

- **Game editors:** stable scene schemas, asset registries, separated runtime/editor concerns.
- **Game engines:** fixed-step simulation, scene lifecycle, asset streaming, input abstraction.
- **MMOs/live games:** quests, progression, inventories, live events, moderation and telemetry.
- **Modern dashboards:** real-time state, drill-down, filters and auditability.
- **Social platforms:** activity streams, presence, reactions, identity and sharing.
- **Knowledge systems:** graph navigation, provenance, search and linked evidence.
- **Creative tools:** node graphs, timelines, reusable components and authoring workflows.
- **SRE/live operations:** feature flags, observability, rollback, incident state and safe rollout.

These are transferable patterns, not copied implementations.

## Non-negotiable anti-patterns

- fake KPIs
- fake activity feeds
- fake economic balances
- achievements without evidence
- visual 3D with no functional role
- hidden critical actions behind animation
- hover-only controls
- irreversible game mechanics without confirmation
- client-authoritative competitive state
- undocumented lore presented as real-world fact
- new frameworks added merely for visual novelty
