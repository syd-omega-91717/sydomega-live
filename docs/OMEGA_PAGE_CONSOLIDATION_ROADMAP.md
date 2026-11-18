# Ω SYD OMEGA 91717 — Page Consolidation Roadmap

**Status:** PROPOSAL / SOURCE-INVENTORY-BASED — no routes or page content are removed by this document.  
**Baseline inspected:** `main` at `0682056637480759ed2dd7d7f69f90d73ccabbed`, 18 November 2026.  
**Canonical page contracts:** 241. **Root HTML files:** 241. **Navigation domains:** 14.

## 1. Objective

Reduce the user-facing page estate by consolidating related experiences into a small set of coherent domain workspaces. A member should enter a domain once and move between its capabilities using in-page navigation, tabs, accordions, searchable section indexes and deep links—not repeatedly load a separate page for every small feature.

This is **not** a proposal to cram the entire platform into one enormous HTML document. The target is a compact set of domain hubs with clear information architecture, fast initial rendering and progressively loaded panels.

## 2. Decisions and non-negotiable constraints

1. Preserve the existing static HTML/JavaScript/CSS + Supabase architecture. No framework rewrite.
2. Keep the current canonical routes working during migration. Old URLs must resolve to the equivalent hub section, with query/hash state preserved where possible.
3. Consolidate presentation and navigation, not authorization boundaries. Owner-only, member-only, KYC, financial, family and sensitive identity capabilities retain server-side authorization and RLS.
4. A page is mergeable only after its unique tasks, data sources, scripts, events, failure paths, accessibility and responsive behavior have been mapped.
5. Do not duplicate writes, event ingestion, subscriptions or background polling when panels are combined. Shared domain services own those operations.
6. Preserve evidence labels: LIVE, CALCULATED, SIMULATED, USER-CREATED, LORE and UNAVAILABLE. A visual consolidation must not turn simulated or unavailable data into live claims.
7. No mass deletion or redirects until equivalent behavior is tested and production evidence is recorded.

## 3. Proposed domain hubs

Use the 14 existing top-level navigation domains as the first consolidation boundary. Reuse existing domain landing pages where they are suitable; do not create another parallel navigation system.

| Hub route | Consolidated subject areas | Existing page families to assess |
|---|---|---|
| `/dashboard.html` | Command & personal workspace | command, gateway, beacon, search, notifications, missions, projects, decisions, contacts, notes, vision, time, recovery, evidence |
| `/profile.html` | Identity & account | profile, passport, character, membership, credentials, KYC entry, settings, security, personal context |
| `/ascend.html` | Learning & progression | academy, courses, exams, skills, vocabulary, reading, flashcards, focus, forge, mentors, principles, evolution, matrix |
| `/cosmos.html` | Universe & exploration | orrery, realms, elements, houses, pantheons, horoscope, oracle, map, graph, chronicle, runes, mirror, sovereign DNA |
| `/vault.html` | Money, assets & commerce | wallet, treasury, income, revenue, portfolio, ledger, payments, subscriptions, billing, marketplace, blockchain, advertising |
| `/order.html` | People, family & authority | family, bloodline, heritage, hall, sovereigns, factions, city, approvals, control deck |
| `/life.html` | Personal wellbeing & routines | body, physiology, workout, nutrition, sleep, mood, breath, habits, journal, rituals, fasting, targets, weekly review, gratitude, hydration |
| `/services.html` | Services & business operations | consultancy, commissions, publishing, studio, creation/project studio, creator, marketing, events, travel, health service |
| `/intel.html` | Research & intelligence | insight, research, prediction, intelligence, personal intelligence, automation, compliance, atlas, cipher, codex, mind map, nexus, pulse, signal |
| `/sovereign-ai.html` | AI & agent operations | agent network, analytics, queue, simulation arena, agent operations and agent insights |
| `/govern.html` | Governance & platform operations | governance, council, observatory, enterprise, privacy, roadmap, lab, design system, ecosystem, knowledge graph, maintenance, ops, architecture, control plane |
| `/invest.html` | Investment & financial analysis | investment engine, portfolio, treasury, wallet, revenue, income, budget, expenses, wealth, asset ledger |
| `/achieve.html` | Achievements & mastery | ladder, achievements, leaderboard, quests, cosmetics, mastery, covenant, seasonal events, gates, grades, levels, phases, ascension, triads, awards, trophies |
| `/media.html` | Media & creative universe | cinema, movies, characters, series, trailers, universe, feed, publications, visual atlas, game worlds, studio library |

The table is a **candidate grouping**, not permission to merge every listed page blindly. Some subjects appear in more than one current navigation group; the canonical owner must be resolved before implementation. For example, wallet/portfolio/ledger currently appear in both Vault/Invest and identity/archive navigation. Select one canonical home and provide cross-links rather than two independent implementations.

## 4. Hub page interaction model

Each hub should provide:

- A short domain overview and a clear primary action.
- A persistent local section rail or tab bar with readable labels.
- Search/filter over the hub's sections.
- Deep-linkable panels using stable IDs (for example `/life.html#sleep`).
- A compact overview panel plus focused detail panels; do not render every heavy module at initial load.
- Lazy initialization for charts, maps, video, editors and other expensive components.
- Shared loading, empty, error, permission-denied and unavailable states.
- Keyboard operation, visible focus, semantic headings, accessible tabs and reduced-motion support.
- Mobile-first navigation that does not hide essential actions below an inaccessible fold.

Do not use tabs for long workflows that need browser history or separate security review. Keep specialist flows as distinct routes when isolation, payment, KYC, legal consent, large editors or complex multi-step operations justify it.

## 5. Migration sequence

### Phase 0 — Evidence and classification (first)
- Export all 241 page contracts and map each page to exactly one canonical hub owner.
- Identify duplicated capabilities, overlapping data sources, duplicated scripts and duplicate navigation entries.
- For each candidate, record: unique user task, primary role, data reads/writes, RPCs, RLS assumptions, events, assets, failure paths, accessibility, responsive behavior and current production evidence.
- Mark candidates KEEP_SEPARATE, MERGE_PANEL, REDIRECT_ALIAS or RETIRE only with explicit rationale.

### Phase 1 — Low-risk consolidation
- Start with informational and read-mostly groups that share the same role and data boundary.
- Add hub panels and stable anchors to the existing landing pages.
- Convert duplicate links to canonical deep links.
- Keep legacy pages available until smoke tests prove parity.

### Phase 2 — Shared interactive modules
- Consolidate overlapping dashboards and forms only after extracting shared page logic into existing framework-free JS modules.
- Establish one owner for each data subscription, polling loop, event emitter and mutation path.
- Add tests for duplicate submission, stale state, back/forward navigation, direct deep links and session expiry.

### Phase 3 — Sensitive and transactional workflows
- Review identity/KYC, financial, marketplace, approvals, family and owner operations separately.
- Keep distinct route boundaries when they improve authorization, auditability, legal consent or failure containment.
- Require role-specific RLS tests and production verification before aliasing routes.

### Phase 4 — Legacy route retirement
- Only after equivalent behavior is proven, convert redundant pages to thin compatibility redirects or server-level redirects to the canonical hub anchor.
- Retain a route map for bookmarks, external links and search indexing.
- Remove obsolete HTML only after inbound references, scripts, tests, analytics and production logs show it is safe.

## 6. Acceptance gates

A consolidation batch is complete only when all applicable checks pass:

- Every source page maps to one canonical hub or has an explicit KEEP_SEPARATE rationale.
- No unique user task or data capability is lost.
- All old routes resolve correctly; all navigation links and deep links work.
- Authorization and RLS behavior are unchanged or demonstrably stricter.
- No duplicate mutations, event listeners, subscriptions or polling loops.
- Loading, empty, error, denied and offline states are tested.
- Keyboard, screen-reader semantics, reduced motion and mobile layouts are checked.
- Existing CI, security, database replay and production release gates remain green.
- Production smoke tests validate the exact deployed commit.
- The page-contract registry and evidence matrix are updated with evidence, not assumptions.

## 7. Measurement

Track both user-facing reduction and quality:

- Number of canonical hub routes.
- Number of legacy routes still serving unique content.
- Number of compatibility aliases.
- Number of pages classified KEEP_SEPARATE with rationale.
- Task coverage before/after (must remain 100% for migrated tasks).
- Broken internal links and deep-link failures (target 0).
- Duplicate event subscriptions/mutations (target 0).
- Largest Contentful Paint and JavaScript transferred on hub entry.
- Accessibility defects and mobile navigation failures (target 0 release-blocking).

Do not announce a target page count until Phase 0 reveals the true number of unique workflows. The initial objective is to replace the 241-page user journey with 14 coherent domain entry points, then retain only the specialist routes justified by workflow or security boundaries.

## 8. First implementation batch

Begin with **Life** and **Ascend** as candidate low-risk domains, but only after the page-level inventory confirms their panels share compatible data and authorization boundaries. Then proceed to Cosmos and Media. Defer Vault, Identity, Order and Governance until their sensitive workflows have explicit separation decisions.

**Immediate next action:** generate the 241-page-to-14-hub ownership matrix from `config/omega-page-contracts.json` and the canonical navigation source in `nav.js`; review every unmapped, multiply mapped and sensitive route before changing page code.
