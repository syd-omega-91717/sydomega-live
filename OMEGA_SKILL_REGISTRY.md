# OMEGA_SKILL_REGISTRY

**Generated file — do not edit by hand.**
Regenerate with `python3 scripts/omega-registry.py`;
`--check` runs in CI and fails when this file no longer matches the repo.

Every number here is read off the filesystem at generation time.

## 1 · Skills

`.claude/skills/<name>/SKILL.md`.

| Skill | Discoverable | Support files | ~tokens | Named in | Last touched |
|---|---|---|---|---|---|
| `autonomous-coder` | yes | — | 1,737 | CLAUDE.md, README.md | 2026-08-11 |
| `cinematic-media` | yes | — | 1,621 | CLAUDE.md, README.md | 2026-08-30 |
| `context-budget` | yes | — | 1,419 | CLAUDE.md, README.md | 2026-08-23 |
| `deploy-gate` | yes | — | 1,672 | CLAUDE.md, README.md | 2026-08-30 |
| `edge-functions` | yes | — | 1,382 | CLAUDE.md, README.md | 2026-09-15 |
| `feature-architect` | yes | — | 1,789 | CLAUDE.md, README.md | 2026-08-22 |
| `grill-me-codex` | yes | 1 | 2,735 | CLAUDE.md, README.md | 2026-08-24 |
| `i18n` | yes | — | 1,048 | CLAUDE.md, README.md | 2026-08-30 |
| `image-pipeline` | yes | — | 1,400 | CLAUDE.md, README.md | 2026-08-30 |
| `interface-guidelines` | yes | — | 1,122 | CLAUDE.md, README.md | 2026-08-23 |
| `omega-cinematic-system` | yes | — | 1,046 | CLAUDE.md | 2026-09-10 |
| `omega-orchestrator` | yes | — | 1,300 | **nothing** | 2026-09-10 |
| `omega-platform` | yes | — | 1,729 | README.md | 2026-08-31 |
| `omega-production-verification` | yes | — | 909 | **nothing** | 2026-09-10 |
| `present-concept-build` | yes | — | 757 | **nothing** | 2026-09-14 |
| `runtime-verify` | yes | — | 1,731 | CLAUDE.md, README.md | 2026-09-03 |
| `subscriber-portal` | yes | — | 1,156 | CLAUDE.md, README.md | 2026-08-11 |
| `supabase` | yes | 3 | 3,207 | CLAUDE.md, README.md | 2026-08-30 |
| `supabase-postgres-best-practices` | yes | 35 | 807 | CLAUDE.md, README.md | 2026-08-30 |
| `supabase-server` | yes | — | 5,094 | CLAUDE.md, README.md | 2026-08-30 |
| `verify-in-browser` | yes | 4 | 2,257 | CLAUDE.md, README.md | 2026-08-30 |
| `visual-assets` | yes | — | 1,582 | CLAUDE.md, README.md | 2026-08-30 |
| `web-trend-scout` | yes | — | 1,090 | CLAUDE.md, README.md | 2026-08-11 |

**23 skills, ~38,590 tokens** if every SKILL.md were read in one session.

> **3 skill(s) named in no reference doc:** `omega-orchestrator`, `omega-production-verification`, `present-concept-build`.

### Purpose of each

- **`autonomous-coder`** — Implements a feature-architect blueprint into real files in this repo.
- **`cinematic-media`** — Work on the video and cinematic motion surface.
- **`context-budget`** — Keep per-session context cost measured and controlled.
- **`deploy-gate`** — Ship changes to the static Vercel site and Supabase backend with evidence gates.
- **`edge-functions`** — Work on Supabase Edge Functions.
- **`feature-architect`** — Turns feature proposals into exact implementation blueprints.
- **`grill-me-codex`** — Safety gate for high-risk auth, database, payments, RLS and RPC changes.
- **`i18n`** — Work on the translation layer.
- **`image-pipeline`** — Produce or change project imagery and visual assets.
- **`interface-guidelines`** — Audit the interface against applicable web-interface rules.
- **`omega-cinematic-system`** — Production visual design and motion system.
- **`omega-orchestrator`** — Autonomous production workflow.
- **`omega-platform`** — Cross-discipline production engineering.
- **`omega-production-verification`** — Evidence-first production verification across source, browser, Supabase and Vercel.
- **`present-concept-build`** — Inventory-first procedure that extends existing owners rather than creating parallel systems.
- **`runtime-verify`** — Verify real capability entrypoints in a headless browser.
- **`subscriber-portal`** — Surface approved features inside subscriber-facing UI.
- **`supabase`** — Supabase database/backend workflow.
- **`supabase-postgres-best-practices`** — Postgres best practices for Supabase.
- **`supabase-server`** — Server-side Supabase and Edge Function work.
- **`verify-in-browser`** — Browser rendering and repository-wide runtime scans.
- **`visual-assets`** — Visual design and asset work consistent with the Ω system.
- **`web-trend-scout`** — Research external platforms/APIs/open-source trends and produce grounded proposals.

## 2 · Agents

`.claude/agents/*.md`.

| Agent | Role | ~tokens | Last touched |
|---|---|---|---|
| `claudeconcil` | Multi-turn guided interface for Claude Council deliberations. | 1,524 | 2026-08-18 |
| `omega-architect` | --- | 585 | 2026-09-10 |

## 3 · Platform census

| What | Count |
|---|---:|
| `.html` pages | 204 |
| pages loading `bg.js` | 204 of 204 |
| `omega-*.js` modules | 134 (1279 KB) |
| root `.js` files | 142 |
| `supabase/*.sql` (flat bag) | 126 |
| `supabase/migrations/*.sql` | 182 (106 numbered `NNNN_`, 76 timestamped) |
| Edge Functions | 14 |
| skills | 23 |
| agent definitions | 2 |

### Translation coverage

| Source | Keys |
|---|---:|
| `T_EN` (English, inlined in `i18n.js`) | 1174 |
| `i18n/ar.json` | 1167 — 7 short of `T_EN` |
| `i18n/es.json` | 1167 — 7 short of `T_EN` |
| `i18n/fr.json` | 1167 — 7 short of `T_EN` |
| `i18n/hi.json` | 1167 — 7 short of `T_EN` |
| `i18n/nl.json` | 1167 — 7 short of `T_EN` |
| `i18n/zh.json` | 1167 — 7 short of `T_EN` |

`supabase/migrations/README.md` records one end-to-end run against a fresh PostgreSQL 16 instance covering the 94-file numbered sequence (`0001`–`0094`). The later files were not part of that validation; treat `0001`–`0094` as the validated migration scope.

**`bg.js` is loaded by all 204 pages.** It is a hard single point of failure for the platform, so its syntax remains a CI gate.
