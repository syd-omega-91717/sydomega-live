# OMEGA_SKILL_REGISTRY

**Generated file — do not edit by hand.**
Regenerate with `python3 scripts/omega-registry.py`;
`--check` runs in CI and fails when this file no longer matches the repo.

Every number here is read off the filesystem at generation time. It exists
because the hand-written equivalents all drifted: `.claude/skills/README.md`
said "Four skills", `CLAUDE.md` §10 said "Five", §11 said "4-skill pipeline",
and 12 exist.

## 1 · Skills

`.claude/skills/<name>/SKILL.md`. **Discoverable** means the frontmatter carries
both a `name:` and a `description:` — that description is what a coding agent
matches against to decide whether the skill applies, so a skill without one is
effectively invisible unless invoked by exact name.

| Skill | Discoverable | Support files | ~tokens | Named in | Last touched |
|---|---|---|---|---|---|
| `autonomous-coder` | yes | — | 1,767 | CLAUDE.md, README.md | 2026-08-11 |
| `cinematic-media` | yes | — | 1,651 | README.md | 2026-08-30 |
| `context-budget` | yes | — | 1,451 | CLAUDE.md, README.md | 2026-08-23 |
| `deploy-gate` | yes | — | 1,703 | README.md | 2026-08-30 |
| `feature-architect` | yes | — | 1,819 | CLAUDE.md, README.md | 2026-08-22 |
| `grill-me-codex` | yes | 1 | 2,793 | CLAUDE.md, README.md | 2026-08-24 |
| `image-pipeline` | yes | — | 1,427 | README.md | 2026-08-30 |
| `interface-guidelines` | yes | — | 1,142 | CLAUDE.md, README.md | 2026-08-23 |
| `subscriber-portal` | yes | — | 1,178 | CLAUDE.md, README.md | 2026-08-11 |
| `verify-in-browser` | yes | 4 | 2,301 | CLAUDE.md, README.md | 2026-08-30 |
| `visual-assets` | yes | — | 1,611 | README.md | 2026-08-30 |
| `web-trend-scout` | yes | — | 1,109 | CLAUDE.md, README.md | 2026-08-11 |

**12 skills, ~19,952 tokens** if every SKILL.md were read in one
session. They are loaded on demand, so that total is a ceiling, not a per-session cost.

### Purpose of each

- **`autonomous-coder`** — Implements a feature-architect blueprint into real files in this repo (static .html page, optional omega-*.js module, idempotent supabase/*.sql, nav.js…
- **`cinematic-media`** — Work on sydomega-live's video and "cinematic" motion surface — the welcome demo video and its wiring, the transition/2.5D/motion engines, and the…
- **`context-budget`** — Keep this repo's per-session context cost down — measure what every agent session loads before it starts, decide where new documentation belongs so…
- **`deploy-gate`** — Ship a change to sydomega-live's real deployment surface — the static Vercel site and, separately, the Supabase backend — without letting a green local…
- **`feature-architect`** — Turns a FEATURE_IDEAS.md proposal into an exact, file-by-file implementation blueprint for this repo's real static-HTML/Supabase architecture (no…
- **`grill-me-codex`** — Safety gate for HIGH-RISK changes in this repo — auth, database schema, payments/Stripe, RLS policies, or any new public-callable function/RPC.
  - carries: `THREAT_MODEL.md`
- **`image-pipeline`** — Produce, add, or change imagery for sydomega-live — procedural SVG, canvas-rendered PNG (share cards, QR, exports), PWA/favicon raster, and…
- **`interface-guidelines`** — Audit sydomega-live against the Web Interface Guidelines, using only the rules that apply to a no-build vanilla-HTML stack.
- **`subscriber-portal`** — Surfaces an already-built, human-approved feature inside the real subscriber-facing UI (dashboard/hub pages, existing tier and notification systems) —…
- **`verify-in-browser`** — Verify a change to sydomega-live by rendering the real pages in headless Chromium, and run repo-wide scans (page errors, mobile tap targets, horizontal…
  - carries: `harness/sbstub.js`, `harness/scan.js`, `harness/serve.js`, `harness/session.js`
- **`visual-assets`** — Design or change any visual element of sydomega-live — SVG assets, sigils, emblems, share cards, page marks, palette, typography — so it matches the…
- **`web-trend-scout`** — Researches external platforms, APIs, and open-source trends via real web search, then writes a proposal-only feature idea grounded in this repo's actual…

## 2 · Agents

`.claude/agents/*.md`. These are conversational role definitions, not a runtime —
this repo has no multi-agent execution engine (see `CLAUDE.md` §6).

| Agent | Role | ~tokens | Last touched |
|---|---|---|---|
| `claudeconcil` | Multi-turn guided interface for Claude Council deliberations. | 1,556 | 2026-08-18 |

## 3 · Platform census

Counted at generation time. These are the numbers that kept going stale in prose.

| What | Count |
|---|---|
| `.html` pages | 179 |
| pages loading `bg.js` | 179 of 179 |
| `omega-*.js` modules | 118 (925 KB) |
| root `.js` files | 127 |
| `supabase/*.sql` (flat bag) | 125 |
| `supabase/migrations/*.sql` | 145 (103 numbered `NNNN_`, 42 timestamped) |
| Edge Functions | 11 |
| skills | 12 |
| agent definitions | 1 |

### Translation coverage

Committed on purpose: a pack that loses keys changes a number here and
fails `--check`. `scripts/i18n-contract.py` enforces the rest (every
`data-i18n` key resolves, no orphan pack keys, no HTML entities in values).

| Source | Keys |
|---|---|
| `T_EN` (English, inlined in `i18n.js`) | 1167 |
| `i18n/ar.json` | 1167 |
| `i18n/es.json` | 1167 |
| `i18n/fr.json` | 1167 |
| `i18n/hi.json` | 1167 |
| `i18n/nl.json` | 1167 |
| `i18n/zh.json` | 1167 |

`supabase/migrations/README.md` records exactly one end-to-end run against a
fresh scratch PostgreSQL 16 instance, covering the **94-file numbered sequence**
(`0001`–`0094`) — see its heading *"Full 94-file sequence validated
end-to-end for the first time"*. The 51 files added since (numbered and
timestamped alike) were **not part of that validation**, and no run has covered
all 145. Treat the validated scope as `0001`–`0094` only.

**`bg.js` is loaded by all 179 pages.** It is a hard single point of
failure for the entire platform, not a partial one — if it fails to parse, every
page is down. This is why `node --check` on it gates CI.

