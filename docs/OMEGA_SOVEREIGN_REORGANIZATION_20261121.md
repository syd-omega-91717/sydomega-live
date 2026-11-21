# Ω SYD OMEGA 91717 — Sovereign Page & Agent Reorganization

**Date:** 2026-11-21  
**Target repository:** `syd-omega-91717/sydomega-live`  
**Baseline:** `main` at `d8f37f346a0e82271d875cf1e12b653e7cb31415`  
**Status:** Architecture foundation; implementation must proceed in gated, verifiable phases.

## 1. Objective

Reorganize the existing static/Supabase platform into coherent destination hubs. Each hub should present all related capabilities in one navigable experience, using the existing Omega visual language and canonical data sources. This is not a framework migration, monorepo rewrite, or deletion campaign.

The existing URL estate remains compatible. Existing pages become either canonical hub destinations, in-page sections, or preserved legacy/deep-link entry points. Do not redirect or remove a route until its destination, anchors, auth behavior, data dependencies, and inbound references have been verified.

## 2. Verified repository baseline

At the baseline commit:

- The canonical primary-agent roster is `omega-agents.json`, containing 12 agents: Sentinel, Merchant, Scout, Warden, Sovereign, Auditor, Proxy, Oracle, Beacon, Analyst, Tutor, Historian.
- `agents.html` already provides member-bound agent, council, chat, and science tabs.
- `agent-network.html` provides a separate 12-node canvas network view.
- `pantheons.html` provides Olympian archetypes, a personal archetype selector, other pantheon content, and science material.
- `agent-operations.html` is a separate operational console with a deliberately restricted, read-only tool surface.
- `nav.js` currently places these related experiences across COSMOS, ARENA, and GOVERN. They are therefore fragmented across navigation groups and pages.
- `omega-constellation.js`, `omega-sculpture.js`, `omega-emblems.js`, the canonical theme tokens, and the existing visual estate audit provide reusable visual primitives. Do not introduce a competing palette, a second agent roster, or another emblem system.

The source-of-truth roster and the live route map must be read at implementation time; this document is not a substitute for the canonical files.

## 3. Canonical destination hubs

The following is the proposed information architecture. The hub is the primary destination; existing pages and URL anchors remain valid until a migration is individually tested.

| Hub | Consolidated content families |
|---|---|
| **Ω Genesis / Command** | Dashboard, command center, World, global state, module navigation, evidence/replay/recovery, notifications |
| **Ω Intelligence & Agent Council** | Primary agents, subordinate hierarchy, agent network, pantheon/archetype views, agent chat, agent insights, research, prediction, knowledge, search, analytics, operations entry |
| **Ω Finance & Exchange** | Vault, investment, portfolio, treasury, wallet, blockchain, marketplace, income, revenue, ledger, payments, subscriptions, advertising |
| **Ω Academy & Ascension** | Academy, courses, matrix, stages, progress, exams, gaming progression, achievements, trophies, medals, certificates, leaderboard |
| **Ω Universe & Media** | Movies, series, games, characters, worlds, media library, production studio, visual atlas, demos |
| **Ω Identity & Heritage** | Profile, passport, family, bloodline, heritage, genealogy, cultural records, zodiac, elements, personal archetype |
| **Ω Governance & Security** | Governance, legal, privacy, compliance, security, approvals, audit, owner controls, architecture and platform operations |
| **Ω Communication & Community** | Chat, member communication, social surfaces, community activity, events, news distribution, notifications where appropriate |
| **Ω Consultancy & Services** | Consultancy, medical/health service listings, legal/business/economy/engineering domains, contracts, publishing, marketing, travel and service booking |

**Life and wellbeing:** retain its existing dedicated tools and data boundaries; surface them as a clearly labelled section within Identity & Heritage or as a separately promoted destination if the page-contract audit shows that a single hub would harm discoverability. Do not merge sensitive health data into a general profile payload.

## 4. Agent hierarchy

### 4.1 Primary council

Preserve the 12 canonical primary agents and their current roster order and definitions. Their existing responsibilities, sign, element, patron, greeting, voice, domains, and route associations remain the source of truth in `omega-agents.json`.

### 4.2 Subordinate council

The requested structure is interpreted as **12 subordinate agent positions under each primary agent**, for **144 subordinate positions** across the 12 primary agents.

**Source reconciliation / version decision:** The 999-point blueprint's Point 116 specifies 108 “Micro-Executors” and gives Sentinel deploying 9 sub-agents as its example. That is a genuine conflict with the later explicit owner instruction of 12 subordinate positions under each of the 12 primary agents. The current implementation follows the later owner instruction: **12 × 12 = 144**. This is a deliberate versioned amendment to Point 116, not a claim that the original blueprint specified 144. The blueprint text does not define the Hero / King / Pantheon families, their distribution, or subordinate identities; those families are introduced by the later owner instruction, and their allocation remains unspecified. The blueprint's Agent 1–12 numbering order in Points 47–58 also differs from the current `omega-agents.json` array order. Agent names, not array positions or historical ordinal numbers, are the identity keys; the UI and server authorization map must bind by name.

Each subordinate belongs to one of three classification families:

- **Hero** — specialist executor / champion archetype.
- **King** — domain authority / coordinating archetype.
- **Pantheon** — mythic, cultural, or knowledge-archetype affiliation.

These are classification families, not permission grants. The exact distribution of the 12 positions among the three families is intentionally not hard-coded as 4/4/4. A subordinate may have a class, parent, identity, and capability set only when those are explicitly defined and approved.

Do not invent 144 names, powers, or operational claims. Until a subordinate is specified and implemented, represent its slot as **UNASSIGNED / NOT OPERATIONAL**. A lore profile, illustration, or simulated agent is never to be presented as a deployed AI executor.

### 4.3 Data contract

Every primary or subordinate agent record should support:

- for every **actual provisioned agent**, stable `agent_id` and `parent_agent_id`;
- for every **unassigned capacity slot**, stable `position_id`, `parent_agent_name`, `slot_number`, `status: UNASSIGNED`, null name/classification, empty capabilities/permissions, and `operational: false`; a slot is not an agent identity;
- `tier` (`PRIMARY` or `SUBORDINATE`) only after an actual agent is provisioned;
- `classification` (`HERO`, `KING`, `PANTHEON`, or null for unassigned);
- canonical name, title, purpose, domains, and declared capabilities;
- explicit authority scope and denied actions;
- status: `LIVE`, `SIMULATED`, `LORE`, `UNAVAILABLE`, or `UNASSIGNED`;
- execution evidence / last verified timestamp where applicable;
- source/provenance and version.

Parent-child membership must not imply inherited privileges. Each tool call remains server-authorized, scoped, logged, and independently permission-checked. No agent may gain financial, owner, deployment, credential, destructive, or external-network authority from its rank, title, or visual placement.

### 4.4 Sovereign Core

The 999-point blueprint describes a later “13th Agent / Core” as the synthesis of the twelve roles (Point 589). Model this as an orchestration/synthesis layer over the 12 primary agents, not as a thirteenth independent authority or a bypass around owner approval.

## 5. Visual system

Compose existing visual primitives rather than inventing a parallel design language:

1. **Gold-on-obsidian** for authority, identity, ownership, and hierarchy.
2. **Cyan-holographic** for intelligence, system topology, telemetry, and relationships.
3. Concentric rings, orbital paths, radial groupings, and the Omega core as the primary composition grammar.
4. Existing gold/cyan/element accents and canonical type tokens; no local duplicate token table.
5. A compact overview first, with drill-down panels and expandable layers for dense information.
6. Responsive mobile layout: the hierarchy must remain usable as a vertical tree/list when a radial graph cannot fit.
7. Reduced-motion support, keyboard-operable nodes, visible focus, accessible names, and a non-canvas list of equivalent links.
8. No fake live metrics, activity, online states, authority values, balances, earned rewards, or completed agent runs.

The Agent Council hub should have one visual overview with selectable layers: **Council / Hierarchy / Network / Pantheons / Operations / Activity & Evidence**. The selected node opens a detail panel without navigating away. Operations remains gated by the existing authorization rules.

## 6. Migration and implementation sequence

### Phase 0 — Inventory and contract
- Generate a complete page-family inventory from the canonical page contract registry, `nav.js`, route references, and deployed HTML estate.
- For each route, record current purpose, destination hub, anchors, auth gate, data sources, scripts, storage/RPC dependencies, inbound links, and test coverage.
- Detect duplicate content and duplicate data sources before moving anything.

### Phase 1 — Agent Council reference hub
- Consolidate the member agent view, council, network visualization, pantheon/archetype content, and operations entry into the Agent Council hub.
- Reuse `omega-agents.json` as the only primary-agent roster.
- Reuse existing network/constellation/emblem renderers where their contracts fit.
- Extract shared renderers only after parity tests; do not duplicate the existing network roster or god/archetype catalogue.
- Preserve `/agents.html`, `/agent-network.html`, `/pantheons.html`, and `/agent-operations.html` as compatible entry routes until verified in production.

### Phase 2 — Shared hub shell
- Build one reusable static-page shell pattern for hub hero, section navigation, content panels, responsive layout, breadcrumbs, and route metadata.
- Keep page-specific modules and data contracts separate behind clear section boundaries.
- Avoid a client-side SPA rewrite or new frontend framework.

### Phase 3 — Consolidate remaining page families
- Migrate one hub at a time in priority order: Command, Finance, Academy, Universe/Media, Identity/Heritage, Governance/Security, Communication, Consultancy/Services.
- Move related features into sections only where the same auth/data lifecycle makes that safe.
- Keep specialist pages where a dedicated workflow, compliance boundary, or mobile interaction warrants it.

### Phase 4 — Route and navigation compatibility
- Update the canonical navigation map only after each destination exists.
- Preserve old URLs and fragments through stable anchors or thin compatibility entry pages.
- Test every inbound route and every cross-page action before retiring any duplicate surface.

### Phase 5 — Verification and release
- Run page-contract, link, asset, auth/RLS, accessibility, responsive, console, and visual-regression checks.
- Verify data truth labels and evidence lineage.
- Inspect the Vercel preview and production smoke checks before merge/deploy.
- No broad redirect, route deletion, schema migration, or production permission expansion without a separate verified change.

## 7. Acceptance criteria

- All 12 primary agents are sourced from one canonical roster.
- Exactly 12 subordinate positions are represented per primary (144 total capacity); unassigned slots are visibly non-operational.
- No subordinate identity or capability is fabricated.
- Agent, network, pantheon, and operations experiences are reachable from one Agent Council destination.
- Every existing route and anchor continues to work.
- No authorization boundary is weakened; operations remain independently gated.
- Every displayed status is evidence-backed and distinguishes LIVE, SIMULATED, LORE, UNAVAILABLE, and UNASSIGNED.
- Hub navigation is consistent, responsive, keyboard-accessible, and compatible with reduced motion.
- No existing feature or data source is silently dropped.
- CI, preview, and production verification pass before any merge or deployment claim.

## 8. Explicit exclusions

The 999-point blueprint contains aspirational or speculative concepts (for example orbital infrastructure, Mars backups, biological/DNA locks, guaranteed market stabilization, autonomous legal immunity, and superhuman prediction). These may be represented as clearly labelled lore or simulation, but must not be implemented or advertised as real capabilities without independently validated engineering, legal authority, evidence, and safety review.

Likewise, financial allocation, token issuance, custody, investment execution, medical/biometric processing, and legal decision-making require separate regulatory, security, operational, and owner approval gates. This page reorganization does not activate any of them.

### Phase 1 implementation record — 2026-11-21

- `agents.html` now renders a 12-primary / 144-seat hierarchy panel using the existing canonical `omega-agents.json` roster and the validated `/omega-agent-hierarchy.json` capacity registry.
- Both Agent Council and Network views now fail closed when the canonical roster is unavailable; stale duplicate fallback identities are no longer rendered.
- Every subordinate position is displayed as `UNASSIGNED`; no names, capabilities, permissions, or live status are fabricated.
- Network, Pantheons, and Operations remain reachable from the Agent Council navigation; existing URLs are preserved.
- `agent-network.html` no longer labels every agent active or fabricates authority/last-activity values; it identifies the visualization as illustrative.
- `omega-agent-operations.js` now loads its selectable primary roster from `omega-agents.json`; the Edge Function's server-side tool allowlist remains authoritative.
- CI and browser/device regression results are pending for the implementation branch; this record does not claim a pass or production deployment.
