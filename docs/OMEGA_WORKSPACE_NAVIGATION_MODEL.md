# Ω SYD OMEGA 91717 — Workspace Navigation Model

## Purpose

The physical repository contains many specialized HTML surfaces. The user experience must not expose the physical file tree as the product information architecture.

The platform therefore uses a **workspace model**: GLOBAL → WORKSPACE → CAPABILITY → DETAIL

## Canonical user-facing workspaces

1. COMMAND — home, search, missions, notifications, world entry, concierge
2. IDENTITY — profile, security, settings, member identity
3. LIFE — body, mind, habits, goals, wellness history
4. ASCEND — academy, learning, exams, progression
5. COSMOS — world, agents, symbolic universe, maps
6. VAULT — wallet, payments, subscriptions, marketplace, ledger
7. ORDER — family, community, approvals, governance-facing relationships
8. SERVICES — consultancy, commissions, publishing, production, services
9. INTEL — research, knowledge, graph, predictions, signals
10. ARENA — AI, simulations, agent network, analytics
11. GOVERN — owner/admin operations, observability, architecture, compliance
12. INVEST — investments, portfolio, treasury, budget, wealth
13. ACHIEVE — achievements, quests, leaderboard, mastery
14. ARCHIVE — heritage, passport, KYC, credentials, identity records
15. MEDIA — cinema, movies, series, publications, visual universe

## Rules

### 1. No leaf-page explosion
A new HTML file must not automatically become a persistent navigation item.

It must first answer:
- What user job does this perform?
- Which canonical workspace owns that job?
- Is this a distinct capability or another view of an existing capability?
- Can it be a section, tab, modal, filtered state, or detail view instead?
- What deep link must remain valid?

### 2. Maximum two visible navigation levels
The default experience is: Workspace → Capability
Detailed records, analytics, history, advanced controls, and specialist views are third-level detail and should normally be reached contextually.

### 3. Progressive disclosure
The persistent dock shows only the highest-value capabilities. The workspace rail provides contextual sibling capabilities. Specialist pages remain reachable through workspace hubs, search, contextual links, deep links, and owner/admin surfaces where appropriate.

### 4. Deep-link preservation
Consolidation does not mean destructive deletion. Existing URLs remain valid until their capabilities have been absorbed, redirected, or formally retired.

### 5. Canonical ownership
Each capability should have one canonical workspace owner.

Examples:
- Body Composition → LIFE
- Physiology → LIFE
- Nutrition → LIFE
- Sleep → LIFE
- Habits → LIFE
- Journal → LIFE
- Budget → INVEST
- Expenses → INVEST
- Portfolio → INVEST
- Knowledge Loom → INTEL
- Graph Evidence → INTEL
- Creation Studio → SERVICES
- Credentials → ARCHIVE
- Movies → MEDIA

### 6. No duplicate ownership
A capability should not simultaneously appear as a primary destination under multiple workspaces unless there is a deliberate cross-domain reason. Cross-domain references should use contextual links rather than duplicate navigation ownership.

## Ω LIFE consolidation
The following family belongs to LIFE:
affirmations, body, breath, fasting, gratitude, habits, journal, meditate, mood, nutrition, oath, physiology, rituals, sleep, stoic, targets, water, weekly, workout.

The intended user model is: LIFE → TODAY | BODY | MIND | HABITS | GOALS | HISTORY

The specialized HTML surfaces may remain as implementation/detail routes while the user sees LIFE as the coherent product surface.

## Migration sequence
1. Map page to canonical workspace.
2. Identify duplicated user jobs.
3. Define canonical hub.
4. Add contextual workspace rail.
5. Move only high-value capabilities into persistent navigation.
6. Preserve deep links.
7. Verify authorization and RLS.
8. Verify analytics/event attribution.
9. Verify mobile navigation.
10. Only then retire redundant user-facing entry points.

## Anti-patterns
Do not:
- delete pages merely to reduce the file count
- create another page for an existing user job
- expose every database concept as a page
- expose every agent/tool as a top-level destination
- create navigation branches solely because a backend table exists
- hide important actions behind ambiguous labels
- use lore terminology where users need an understandable task label

## Success criterion
The success metric is not fewer HTML files.

It is: fewer navigation decisions + preserved capability + clearer mental model + faster task discovery.

The physical codebase may remain modular while the user experience becomes coherent and shallow.