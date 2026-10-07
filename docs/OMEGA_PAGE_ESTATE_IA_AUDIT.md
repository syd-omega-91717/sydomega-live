# Ω SYD OMEGA 91717 — Page Estate & Information Architecture Audit

Source basis: current `main` repository page estate plus `visual-page-survey.json`.

## Executive finding

Main currently contains **231 HTML files**; the visual survey contains **235 records**. The optimization target is the number of **user-facing destinations**, not the number of capabilities. Related capabilities should become sections, tabs, drawers, or workspaces inside canonical product hubs while system routes and genuinely distinct workflows remain independently addressable.

## Canonical hub model

`COMMAND → IDENTITY → LIFE → ASCEND → COSMOS → VAULT → ORDER → SERVICES → INTEL → ARENA → GOVERN → INVEST → ACHIEVE → ARCHIVE → MEDIA`

## High-confidence consolidation families

| Family | Current leaf pattern | Canonical destination |
|---|---|---|
| Wellness / daily life | 20+ single-purpose pages | `/life.html` |
| Finance | budget, expenses, wealth, wallet, treasury, investment, portfolio, revenue, payments, subscriptions, income, ledger | `/investment.html` + `/vault.html` |
| Learning | academy, courses, library, mentors, principles, reading, skills, vocabulary, flashcards, clarity, focus | `/academy.html` |
| Achievement | achievements, awards, grades, levels, phases, trophies, leaderboard, quests, gates, triads, grid, ascension, kings | `/honors.html` / `/achievements.html` |
| Identity | profile, life, character, passport, KYC, credentials, membership, security | `/profile.html` + `/security.html` |
| Intelligence / knowledge | research, intelligence, prediction, graph variants, knowledge, codex/cipher/mindmap/nexus/pulse/signal | `/intelligence.html` + `/knowledge-loom.html` |
| Media | cinema, movies, series, trailers, publications, visual atlas, characters, feed, universe | `/media.html` |
| Governance / operations | governance, control center, kernel, architecture, maintenance, ops, observatory, compliance, approvals, agent operations | `/control-center.html` / `/control-plane.html` |
| Creation | creator, project studio, studio, creation studio | `/creation-studio.html` |
| World / cosmos | world, atlas, shell, cosmos, realms, map, mirror, oracle, rune, tribe, elements, pantheons, houses | `/world.html` + `/world-atlas.html` + `/cosmos.html` |
| Commerce / services | marketplace, contracts, consultancy, publishing, marketing, advertising | `/services.html` + `/marketplace.html` |
| Communication | chatbot, social, network, contacts, notifications, notes, decisions, projects, quotes, time, vision | `/dashboard.html` + contextual workspaces |

## Page-by-page survey disposition

| Page | Family | Disposition | Words | Cards | Sections | Focus | Findings |
|---|---|---|---:|---:|---:|---:|---|
| `404.html` | other | SYSTEM_ROUTE | 72 | 43 | 0 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px |
| `academy.html` | learning | KEEP_CANONICAL_HUB | 1520 | 153 | 12 | 91 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 153 card-like surfaces |
| `account.html` | other | REVIEW_UNIQUE_JOB | 373 | 22 | 0 | 94 | READABILITY: 10 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `achievements.html` | achievement | KEEP_CANONICAL_HUB | 347 | 41 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `ad-network.html` | commerce | CONSOLIDATE_OR_SECTION | 173 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `admin_console.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `advertising.html` | commerce | CONSOLIDATE_OR_SECTION | 326 | 33 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `affirmations.html` | wellness | CONSOLIDATE_OR_SECTION | 443 | 16 | 6 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `agent-network.html` | other | REVIEW_UNIQUE_JOB | 23 | 3 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `agent-operations.html` | governance-ops | CONSOLIDATE_OR_SECTION | 98 | 4 | 2 | 100 |  |
| `agent.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `agents.html` | other | KEEP_CANONICAL_HUB | 230 | 36 | 3 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `analytics-dashboard.html` | other | ROLE_DASHBOARD | 212 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing |
| `analytics.html` | other | REVIEW_UNIQUE_JOB | 704 | 46 | 7 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `approvals.html` | governance-ops | CONSOLIDATE_OR_SECTION | 162 | 4 | 9 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px |
| `architect.html` | learning | CONSOLIDATE_OR_SECTION | 160 | 18 | 0 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `architecture.html` | governance-ops | CONSOLIDATE_OR_SECTION | 68 | 2 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing |
| `arena.html` | other | REVIEW_UNIQUE_JOB | 141 | 3 | 0 | 100 |  |
| `ascension.html` | achievement | CONSOLIDATE_OR_SECTION | 291 | 30 | 7 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `atlas.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 148 | 9 | 3 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `audit-report.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `automation.html` | other | REVIEW_UNIQUE_JOB | 341 | 33 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `autonomous-insights.html` | governance-ops | CONSOLIDATE_OR_SECTION | 27 | 0 | 2 | 100 |  |
| `awards.html` | achievement | CONSOLIDATE_OR_SECTION | 608 | 26 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `beacon.html` | other | REVIEW_UNIQUE_JOB | 249 | 18 | 6 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `blockchain.html` | other | REVIEW_UNIQUE_JOB | 314 | 19 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `bloodline.html` | other | REVIEW_UNIQUE_JOB | 303 | 19 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `body.html` | wellness | CONSOLIDATE_OR_SECTION | 498 | 28 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `breath.html` | wellness | CONSOLIDATE_OR_SECTION | 567 | 20 | 5 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `budget.html` | finance | CONSOLIDATE_OR_SECTION | 96 | 12 | 0 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `character.html` | identity | CONSOLIDATE_OR_SECTION | 461 | 67 | 11 | 94 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 67 card-like surfaces |
| `characters.html` | media | CONSOLIDATE_OR_SECTION | 109 | 4 | 0 | 97 | READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px |
| `charter.html` | other | REVIEW_UNIQUE_JOB | 351 | 37 | 0 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `chatbot.html` | communication | CONSOLIDATE_OR_SECTION | 218 | 17 | 4 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `chronicle.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 1226 | 21 | 0 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px |
| `cinema.html` | media | CONSOLIDATE_OR_SECTION | 872 | 56 | 6 | 94 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px; DENSITY: 56 card-like surfaces |
| `cipher.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 218 | 17 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `city.html` | other | REVIEW_UNIQUE_JOB | 378 | 35 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `clarity.html` | learning | CONSOLIDATE_OR_SECTION | 363 | 40 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `codex.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 179 | 23 | 7 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px |
| `cohorts-dashboard.html` | other | ROLE_DASHBOARD | 12 | 0 | 0 | 100 | FLEXIBILITY: 1 fixed widths >=320px |
| `command.html` | other | REVIEW_UNIQUE_JOB | 261 | 17 | 0 | 96 | READABILITY: 4 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `compliance.html` | governance-ops | CONSOLIDATE_OR_SECTION | 367 | 27 | 5 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `consultancy.html` | commerce | CONSOLIDATE_OR_SECTION | 124 | 17 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `contacts.html` | communication | CONSOLIDATE_OR_SECTION | 460 | 39 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `contracts.html` | commerce | CONSOLIDATE_OR_SECTION | 190 | 17 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 3 fixed widths >=320px |
| `contributions.html` | other | REVIEW_UNIQUE_JOB | 296 | 32 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `control-center.html` | governance-ops | KEEP_CANONICAL_HUB | 138 | 12 | 0 | 99 | FLEXIBILITY: 4 fixed widths >=320px |
| `control-plane.html` | governance-ops | KEEP_CANONICAL_HUB | 7 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `cosmetics.html` | other | REVIEW_UNIQUE_JOB | 66 | 10 | 3 | 100 |  |
| `cosmic-ledger.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 145 | 0 | 0 | 100 |  |
| `cosmos.html` | world-cosmos | KEEP_CANONICAL_HUB | 215 | 19 | 11 | 96 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px |
| `council.html` | other | REVIEW_UNIQUE_JOB | 23 | 7 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `courses.html` | learning | CONSOLIDATE_OR_SECTION | 29 | 5 | 3 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `covenant.html` | achievement | CONSOLIDATE_OR_SECTION | 15 | 0 | 0 | 100 |  |
| `creator.html` | creation | CONSOLIDATE_OR_SECTION | 112 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `credentials.html` | identity | CONSOLIDATE_OR_SECTION | 184 | 18 | 5 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `dashboard.html` | other | KEEP_CANONICAL_HUB | 518 | 139 | 29 | 84 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px; DENSITY: 139 card-like surfaces; DENSITY: 29 section headings |
| `dashboard.html` | other | KEEP_CANONICAL_HUB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `decisions.html` | communication | CONSOLIDATE_OR_SECTION | 449 | 20 | 0 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `design-showcase.html` | governance-ops | CONSOLIDATE_OR_SECTION | 159 | 4 | 7 | 100 | FLEXIBILITY: 3 fixed widths >=320px |
| `design-system.html` | governance-ops | CONSOLIDATE_OR_SECTION | 364 | 31 | 9 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `dna.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 231 | 22 | 4 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `domain-mastery.html` | achievement | CONSOLIDATE_OR_SECTION | 18 | 0 | 0 | 100 |  |
| `ecosystem.html` | governance-ops | CONSOLIDATE_OR_SECTION | 254 | 17 | 5 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `elements.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 356 | 19 | 7 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `enter.html` | other | SYSTEM_ROUTE | 142 | 17 | 0 | 96 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 4 declarations at >=3px letter spacing |
| `enterprise.html` | governance-ops | CONSOLIDATE_OR_SECTION | 390 | 37 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `eternity.html` | other | REVIEW_UNIQUE_JOB | 90 | 4 | 0 | 100 |  |
| `events.html` | other | REVIEW_UNIQUE_JOB | 313 | 17 | 7 | 96 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 4 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `evidence.html` | other | REVIEW_UNIQUE_JOB | 68 | 0 | 0 | 100 |  |
| `evolution.html` | other | REVIEW_UNIQUE_JOB | 192 | 33 | 5 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `exam.html` | other | REVIEW_UNIQUE_JOB | 10 | 12 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `expenses.html` | finance | CONSOLIDATE_OR_SECTION | 149 | 52 | 0 | 96 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 52 card-like surfaces |
| `factions.html` | other | REVIEW_UNIQUE_JOB | 254 | 18 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `family.html` | other | KEEP_CANONICAL_HUB | 561 | 13 | 15 | 90 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 11 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px; DENSITY: 15 section headings |
| `fasting.html` | wellness | CONSOLIDATE_OR_SECTION | 541 | 54 | 0 | 96 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 54 card-like surfaces |
| `feed.html` | media | CONSOLIDATE_OR_SECTION | 235 | 32 | 7 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `flashcard.html` | learning | CONSOLIDATE_OR_SECTION | 143 | 24 | 0 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `focus.html` | learning | CONSOLIDATE_OR_SECTION | 215 | 17 | 5 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `forge.html` | other | REVIEW_UNIQUE_JOB | 240 | 34 | 3 | 94 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 7 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `gaming.html` | other | REVIEW_UNIQUE_JOB | 2474 | 201 | 16 | 85 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px; DENSITY: 201 card-like surfaces; DENSITY: 16 section headings |
| `gates.html` | achievement | CONSOLIDATE_OR_SECTION | 251 | 23 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `gateway.html` | other | REVIEW_UNIQUE_JOB | 12 | 0 | 0 | 96 | READABILITY: 4 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `governance.html` | governance-ops | KEEP_CANONICAL_HUB | 352 | 28 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `grades.html` | achievement | CONSOLIDATE_OR_SECTION | 403 | 29 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `graph-admin.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 19 | 2 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `graph-anomalies.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 31 | 4 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `graph-centrality.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 25 | 4 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `graph-evidence.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 28 | 8 | 0 | 100 | FLEXIBILITY: 3 fixed widths >=320px |
| `graph-explorer.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 18 | 5 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `graph-timeline.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 29 | 5 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `graph.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 240 | 18 | 3 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `graphify.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 90 | 43 | 1 | 100 |  |
| `gratitude.html` | wellness | CONSOLIDATE_OR_SECTION | 412 | 16 | 0 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `grid.html` | achievement | CONSOLIDATE_OR_SECTION | 267 | 41 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `guide.html` | other | REVIEW_UNIQUE_JOB | 14 | 0 | 0 | 100 | FLEXIBILITY: 2 fixed widths >=320px |
| `habits.html` | wellness | CONSOLIDATE_OR_SECTION | 378 | 25 | 5 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `hall.html` | other | REVIEW_UNIQUE_JOB | 178 | 27 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `health.html` | other | REVIEW_UNIQUE_JOB | 320 | 23 | 5 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `healthz.html` | other | SYSTEM_ROUTE | 4 | 0 | 0 | 100 |  |
| `hercules.html` | achievement | CONSOLIDATE_OR_SECTION | 35 | 2 | 0 | 100 |  |
| `heritage.html` | other | KEEP_CANONICAL_HUB | 257 | 16 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `honors.html` | other | KEEP_CANONICAL_HUB | 550 | 22 | 5 | 94 | FLEXIBILITY: 12 fixed widths >=320px |
| `horoscope.html` | other | REVIEW_UNIQUE_JOB | 656 | 54 | 4 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; DENSITY: 54 card-like surfaces |
| `houses.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 271 | 10 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `identity.html` | identity | CONSOLIDATE_OR_SECTION | 184 | 23 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `income.html` | finance | CONSOLIDATE_OR_SECTION | 272 | 30 | 7 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `index.html` | other | REVIEW_UNIQUE_JOB | 608 | 48 | 0 | 100 |  |
| `intelligence.html` | knowledge-intel | KEEP_CANONICAL_HUB | 482 | 96 | 0 | 92 | CONTRACT: no visible/semantic level-1 heading; DENSITY: 96 card-like surfaces |
| `interface-omni.html` | other | REVIEW_UNIQUE_JOB | 138 | 11 | 4 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 5 declarations at >=3px letter spacing |
| `investment.html` | finance | KEEP_CANONICAL_HUB | 408 | 41 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `investor-dashboard.html` | other | ROLE_DASHBOARD | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `investor-gate.html` | other | ROLE_DASHBOARD | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `journal.html` | wellness | CONSOLIDATE_OR_SECTION | 130 | 13 | 1 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 5 declarations at >=3px letter spacing |
| `kings.html` | achievement | CONSOLIDATE_OR_SECTION | 307 | 12 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `knowledge.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 277 | 24 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `kyc.html` | identity | CONSOLIDATE_OR_SECTION | 387 | 45 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `lab.html` | governance-ops | CONSOLIDATE_OR_SECTION | 413 | 42 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `leaderboard.html` | achievement | CONSOLIDATE_OR_SECTION | 307 | 43 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `leaderboard.html` | achievement | CONSOLIDATE_OR_SECTION | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `ledger.html` | finance | CONSOLIDATE_OR_SECTION | 211 | 30 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `levels.html` | achievement | CONSOLIDATE_OR_SECTION | 251 | 23 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `library.html` | learning | CONSOLIDATE_OR_SECTION | 189 | 19 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `maintenance.html` | governance-ops | CONSOLIDATE_OR_SECTION | 115 | 56 | 4 | 94 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 56 card-like surfaces |
| `map.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 209 | 38 | 2 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `marketing.html` | commerce | CONSOLIDATE_OR_SECTION | 219 | 17 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `marketplace.html` | commerce | KEEP_CANONICAL_HUB | 351 | 18 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `matrix.html` | other | REVIEW_UNIQUE_JOB | 881 | 27 | 5 | 93 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 11 fixed widths >=320px |
| `media.html` | media | KEEP_CANONICAL_HUB | 1052 | 189 | 17 | 82 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 10 fixed widths >=320px; DENSITY: 189 card-like surfaces; DENSITY: 17 section headings |
| `meditate.html` | wellness | CONSOLIDATE_OR_SECTION | 434 | 17 | 3 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `membership.html` | identity | CONSOLIDATE_OR_SECTION | 261 | 31 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `mentors.html` | learning | CONSOLIDATE_OR_SECTION | 406 | 43 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `mindmap.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 323 | 38 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `mirror.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 255 | 48 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `missions.html` | other | KEEP_CANONICAL_HUB | 40 | 30 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `monitoring-dashboard.html` | other | ROLE_DASHBOARD | 168 | 9 | 0 | 100 | FLEXIBILITY: 3 fixed widths >=320px |
| `mood.html` | wellness | CONSOLIDATE_OR_SECTION | 401 | 14 | 9 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `movies.html` | media | CONSOLIDATE_OR_SECTION | 40 | 12 | 0 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `my-quests.html` | achievement | CONSOLIDATE_OR_SECTION | 61 | 1 | 2 | 100 | FLEXIBILITY: 1 fixed widths >=320px |
| `network.html` | communication | CONSOLIDATE_OR_SECTION | 131 | 13 | 0 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px |
| `news.html` | other | REVIEW_UNIQUE_JOB | 181 | 18 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `nexus.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 204 | 17 | 4 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px |
| `notes.html` | communication | CONSOLIDATE_OR_SECTION | 339 | 41 | 0 | 100 |  |
| `notifications.html` | communication | CONSOLIDATE_OR_SECTION | 260 | 23 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `nutrition.html` | wellness | CONSOLIDATE_OR_SECTION | 270 | 17 | 6 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `oath.html` | wellness | CONSOLIDATE_OR_SECTION | 271 | 44 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `observatory.html` | governance-ops | CONSOLIDATE_OR_SECTION | 284 | 41 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `offline.html` | other | SYSTEM_ROUTE | 196 | 8 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `omega-platform-navigator.html` | other | KEEP_CANONICAL_HUB | 1247 | 45 | 2 | 96 | FLEXIBILITY: 7 fixed widths >=320px |
| `omega-visual-command.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `ops.html` | governance-ops | CONSOLIDATE_OR_SECTION | 141 | 76 | 0 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px; DENSITY: 76 card-like surfaces |
| `oracle.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 252 | 33 | 6 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `pantheons.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 468 | 16 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `passport.html` | identity | CONSOLIDATE_OR_SECTION | 266 | 35 | 0 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `payments.html` | finance | CONSOLIDATE_OR_SECTION | 269 | 43 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `pending.html` | other | SYSTEM_ROUTE | 158 | 43 | 0 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 5 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `phases.html` | achievement | CONSOLIDATE_OR_SECTION | 201 | 23 | 5 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `physiology.html` | wellness | CONSOLIDATE_OR_SECTION | 509 | 47 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `platform-kernel.html` | governance-ops | CONSOLIDATE_OR_SECTION | 72 | 6 | 0 | 100 | FLEXIBILITY: 1 fixed widths >=320px |
| `platform.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `points.html` | other | REVIEW_UNIQUE_JOB | 207 | 17 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `portal.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `portfolio.html` | finance | CONSOLIDATE_OR_SECTION | 170 | 20 | 8 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `prediction.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 249 | 17 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `predictions-dashboard.html` | other | ROLE_DASHBOARD | 60 | 3 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `principles.html` | learning | CONSOLIDATE_OR_SECTION | 457 | 39 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `privacy.html` | other | REVIEW_UNIQUE_JOB | 664 | 28 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `profile.html` | identity | KEEP_CANONICAL_HUB | 1168 | 72 | 27 | 83 | READABILITY: 14 declarations at >=3px letter spacing; FLEXIBILITY: 4 fixed widths >=320px; DENSITY: 72 card-like surfaces; DENSITY: 27 section headings |
| `project-studio.html` | creation | CONSOLIDATE_OR_SECTION | 55 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `projects.html` | communication | CONSOLIDATE_OR_SECTION | 331 | 42 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `publications.html` | media | CONSOLIDATE_OR_SECTION | 463 | 29 | 3 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `publishing.html` | commerce | CONSOLIDATE_OR_SECTION | 472 | 17 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `pulse.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 131 | 36 | 0 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px |
| `quest-progress.html` | achievement | CONSOLIDATE_OR_SECTION | 15 | 0 | 0 | 100 |  |
| `queue.html` | other | REVIEW_UNIQUE_JOB | 97 | 33 | 9 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `quotes.html` | communication | CONSOLIDATE_OR_SECTION | 69 | 8 | 3 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `reading.html` | learning | CONSOLIDATE_OR_SECTION | 499 | 14 | 4 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `realm.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 210 | 48 | 3 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `realms.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 29 | 0 | 0 | 100 | FLEXIBILITY: 1 fixed widths >=320px |
| `recovery.html` | other | REVIEW_UNIQUE_JOB | 177 | 9 | 0 | 100 |  |
| `replay.html` | other | REVIEW_UNIQUE_JOB | 38 | 0 | 0 | 100 |  |
| `research.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 270 | 31 | 5 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px |
| `reset.html` | other | SYSTEM_ROUTE | 117 | 23 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `revenue.html` | finance | CONSOLIDATE_OR_SECTION | 442 | 41 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `rituals.html` | wellness | CONSOLIDATE_OR_SECTION | 241 | 19 | 3 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `roadmap.html` | governance-ops | CONSOLIDATE_OR_SECTION | 193 | 13 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `rune.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 147 | 17 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 3 fixed widths >=320px |
| `scene.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `sculpture.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 186 | 1 | 1 | 100 |  |
| `search.html` | other | REVIEW_UNIQUE_JOB | 213 | 17 | 3 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `seasonal-events.html` | achievement | CONSOLIDATE_OR_SECTION | 15 | 0 | 0 | 100 |  |
| `segmentation-dashboard.html` | other | ROLE_DASHBOARD | 107 | 38 | 6 | 99 | READABILITY: 1 declarations at >=3px letter spacing |
| `series.html` | media | CONSOLIDATE_OR_SECTION | 422 | 36 | 5 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `services.html` | commerce | KEEP_CANONICAL_HUB | 241 | 27 | 5 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `settings.html` | other | REVIEW_UNIQUE_JOB | 461 | 17 | 17 | 96 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; DENSITY: 17 section headings |
| `sigil.html` | other | REVIEW_UNIQUE_JOB | 207 | 20 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `sigma.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 312 | 38 | 15 | 97 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px; DENSITY: 15 section headings |
| `signal.html` | knowledge-intel | CONSOLIDATE_OR_SECTION | 200 | 47 | 1 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `skills.html` | learning | CONSOLIDATE_OR_SECTION | 593 | 48 | 9 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `sleep.html` | wellness | CONSOLIDATE_OR_SECTION | 529 | 24 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `social.html` | communication | CONSOLIDATE_OR_SECTION | 162 | 21 | 2 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 2 fixed widths >=320px |
| `sovereign_health.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `sovereign-ai.html` | other | REVIEW_UNIQUE_JOB | 297 | 31 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `sovereign-covenant.html` | other | REVIEW_UNIQUE_JOB | 189 | 44 | 3 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `sovereigns.html` | other | REVIEW_UNIQUE_JOB | 253 | 30 | 4 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `stoic.html` | wellness | CONSOLIDATE_OR_SECTION | 909 | 13 | 0 | 96 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 4 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `studio.html` | creation | CONSOLIDATE_OR_SECTION | 249 | 42 | 6 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `subscriptions.html` | finance | CONSOLIDATE_OR_SECTION | 307 | 18 | 4 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `system_health.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `targets.html` | wellness | CONSOLIDATE_OR_SECTION | 485 | 21 | 4 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `terms.html` | other | REVIEW_UNIQUE_JOB | 492 | 19 | 0 | 99 | READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `time.html` | communication | CONSOLIDATE_OR_SECTION | 468 | 14 | 8 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `trailers.html` | media | CONSOLIDATE_OR_SECTION | 583 | 52 | 5 | 94 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 52 card-like surfaces |
| `travel.html` | other | REVIEW_UNIQUE_JOB | 287 | 17 | 6 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `treasury.html` | finance | CONSOLIDATE_OR_SECTION | 352 | 40 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 1 fixed widths >=320px |
| `triads.html` | achievement | CONSOLIDATE_OR_SECTION | 542 | 55 | 6 | 96 | CONTRACT: no visible/semantic level-1 heading; DENSITY: 55 card-like surfaces |
| `tribe.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 147 | 32 | 7 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `trophies.html` | achievement | CONSOLIDATE_OR_SECTION | 224 | 17 | 4 | 98 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing |
| `universe.html` | media | CONSOLIDATE_OR_SECTION | 382 | 32 | 5 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `vault.html` | other | KEEP_CANONICAL_HUB | 673 | 88 | 10 | 90 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 2 declarations at >=3px letter spacing; FLEXIBILITY: 2 fixed widths >=320px; DENSITY: 88 card-like surfaces |
| `venture-pipeline.html` | other | REVIEW_UNIQUE_JOB | 0 | 0 | 0 | 100 | CONTRACT: no visible/semantic level-1 heading |
| `verify-deployment.html` | other | SYSTEM_ROUTE | 16 | 0 | 0 | 100 |  |
| `verify-modules.html` | other | SYSTEM_ROUTE | 3 | 0 | 0 | 100 |  |
| `vision.html` | communication | CONSOLIDATE_OR_SECTION | 68 | 9 | 3 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `visual-atlas.html` | media | CONSOLIDATE_OR_SECTION | 84 | 0 | 0 | 100 |  |
| `vocabulary.html` | learning | CONSOLIDATE_OR_SECTION | 466 | 44 | 0 | 99 | CONTRACT: no visible/semantic level-1 heading; FLEXIBILITY: 4 fixed widths >=320px |
| `wallet.html` | finance | CONSOLIDATE_OR_SECTION | 413 | 45 | 0 | 99 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 1 declarations at >=3px letter spacing |
| `water.html` | wellness | CONSOLIDATE_OR_SECTION | 470 | 17 | 9 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing |
| `wealth.html` | finance | CONSOLIDATE_OR_SECTION | 365 | 26 | 6 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 3 fixed widths >=320px |
| `weekly.html` | wellness | CONSOLIDATE_OR_SECTION | 297 | 12 | 5 | 95 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 5 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `workout.html` | wellness | CONSOLIDATE_OR_SECTION | 489 | 14 | 5 | 97 | CONTRACT: no visible/semantic level-1 heading; READABILITY: 3 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `world-atlas.html` | world-cosmos | KEEP_CANONICAL_HUB | 206 | 0 | 0 | 100 |  |
| `world-shell.html` | world-cosmos | CONSOLIDATE_OR_SECTION | 47 | 0 | 0 | 99 | CONTRACT: missing viewport; READABILITY: 1 declarations at >=3px letter spacing; FLEXIBILITY: 1 fixed widths >=320px |
| `world.html` | world-cosmos | KEEP_CANONICAL_HUB | 318 | 0 | 0 | 100 |  |

## Automated totals

- **SYSTEM_ROUTE: 8**
- **KEEP_CANONICAL_HUB: 23**
- **REVIEW_UNIQUE_JOB: 54**
- **CONSOLIDATE_OR_SECTION: 143**
- **ROLE_DASHBOARD: 7**

## Migration rules

1. Create a canonical route registry with `canonical_page`, `legacy_page`, `anchor`, `required_role`, `truth_state`, `owner`, and `redirect_status`.
2. Make the canonical hub own the leaf capability before removing any old route.
3. Change sidebar/search/command-palette links to canonical destinations.
4. Preserve existing deep links through redirects or anchored views.
5. Verify reachability, authorization/RLS, analytics, accessibility, and truth-state contracts.
6. Only then retire redundant HTML files.

## UX target

Users should understand **what they can do**, not how the repository is partitioned. Search, command palette, contextual navigation, recents, pins, and hub-level workspaces should expose capabilities without requiring users to understand 200+ URLs.

## Architectural constraint

This is an information-architecture refactor. It does **not** authorize a React/Vite/Next rewrite. Preserve the existing static/Supabase/Vercel architecture.
