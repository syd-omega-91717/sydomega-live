# Ω Single-Page Workspace Consolidation

## Objective
Reduce the number of user-facing destinations without deleting working specialist routes.

The platform now treats the physical HTML estate and the user-facing information architecture as separate concerns:
- specialist HTML files remain available for stable deep links and backward compatibility;
- canonical workspaces are the primary navigation destinations;
- canonical workspaces expose specialist capabilities through an in-page capability viewer;
- the capability viewer preserves the source route and provides an explicit OPEN ROUTE escape hatch;
- direct legacy URLs remain valid;
- owner/admin routes retain their existing authorization boundaries.

## Canonical workspaces
COMMAND, IDENTITY, LIFE, ASCEND, COSMOS, VAULT, ORDER, SERVICES, INTEL, ARENA, GOVERN, INVEST, ACHIEVE, ARCHIVE and MEDIA.

## High-confidence single-page families

### LIFE
Body, physiology, workout, nutrition, sleep, mood, meditation, breathwork, habits, journal, rituals, fasting, targets, weekly review, affirmations, gratitude, oath, stoic practice and hydration.

### ASCEND
Academy, courses, focus, contributions, evolution, levels, phases, ascension, domain mastery, clarity, flashcards, library, mentors, principles, reading, skills, vocabulary, architect and forge.

### INTEL
Research, prediction, intelligence, automation, graph administration, graph timeline, centrality, explorer, anomalies, evidence, codex, cipher, mind map, nexus, pulse, sigma and signal.

### MEDIA
Cinema, movies, series, trailers, universe, feed, publications, visual atlas and characters.

### INVEST
Investment, portfolio, treasury, wallet, revenue, income, budget, expenses, wealth, ledger, payments and subscriptions.

### ARCHIVE / IDENTITY
Identity, passport, character, credentials, membership, KYC, heritage and bloodline are grouped into coherent identity/archive discovery rather than presented as independent top-level destinations.

### GOVERN
Governance, observatory, enterprise, privacy, roadmap, ecosystem, knowledge, Knowledge Loom, maintenance, control center, platform kernel, agent operations, ops, architecture and autonomous insights.

## Important distinction
This is not a destructive file merge.

A specialist page may still be required because it currently owns unique code, state, authorization, or data behavior. Until that capability is fully absorbed into the canonical workspace, its physical route remains.

The consolidation layer therefore changes the user journey first, then permits gradual code-level absorption.

## Deep-link model
Canonical capability views use `/workspace.html#module=<specialist-key>`.

The viewer opens the specialist route inside the canonical workspace and provides:
- source route;
- in-page close;
- direct route opening;
- browser-history-compatible hash state;
- accessible dialog semantics.

A direct specialist URL remains unchanged.

## Safety rules
1. Never convert a legacy route into a redirect until its capability is actually absorbed.
2. Never copy privileged owner/admin functionality into a public workspace without preserving authorization.
3. Never duplicate backend truth just to make a hub look complete.
4. Never represent lore as verified state.
5. Keep LIVE, CALCULATED, USER-CREATED, VERIFIED, UNAVAILABLE and BLOCKED truth states explicit.
6. Prefer one coherent workspace over a growing collection of thin navigation pages.

## Result
The information architecture moves from hundreds of pages and hundreds of navigation decisions toward 15 canonical workspaces, contextual capabilities and specialist deep links.