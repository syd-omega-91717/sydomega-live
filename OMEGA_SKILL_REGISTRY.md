# OMEGA_SKILL_REGISTRY

**Generated file — do not edit by hand.**
Regenerate with `python3 scripts/omega-registry.py`;
`--check` runs in CI and fails when this file no longer matches the repo.

Every number here is read off the filesystem at generation time. It exists
because the hand-written equivalents all drifted: `.claude/skills/README.md`
said "Four skills", `CLAUDE.md` §10 said "Five", §11 said "4-skill pipeline",
and 19 exist.

## 1 · Skills

`.claude/skills/<name>/SKILL.md`. **Discoverable** means the frontmatter carries
both a `name:` and a `description:` — that description is what a coding agent
matches against to decide whether the skill applies, so a skill without one is
effectively invisible unless invoked by exact name.

| Skill | Discoverable | Support files | ~tokens | Named in | Last touched |
|---|---|---|---|---|---|
| `autonomous-coder` | yes | — | 1,737 | CLAUDE.md, README.md | 2026-08-11 |
| `cinematic-media` | yes | — | 1,621 | CLAUDE.md, README.md | 2026-08-30 |
| `context-budget` | yes | — | 1,419 | CLAUDE.md, README.md | 2026-08-23 |
| `deploy-gate` | yes | — | 1,672 | CLAUDE.md, README.md | 2026-08-30 |
| `edge-functions` | yes | — | 1,389 | CLAUDE.md, README.md | 2026-08-30 |
| `feature-architect` | yes | — | 1,789 | CLAUDE.md, README.md | 2026-08-22 |
| `grill-me-codex` | yes | 1 | 2,735 | CLAUDE.md, README.md | 2026-08-24 |
| `i18n` | yes | — | 1,048 | CLAUDE.md, README.md | 2026-08-30 |
| `image-pipeline` | yes | — | 1,400 | CLAUDE.md, README.md | 2026-08-30 |
| `interface-guidelines` | yes | — | 1,122 | CLAUDE.md, README.md | 2026-08-23 |
| `omega-platform` | yes | — | 1,729 | README.md | 2026-08-31 |
| `runtime-verify` | yes | — | 1,731 | CLAUDE.md, README.md | 2026-09-03 |
| `subscriber-portal` | yes | — | 1,156 | CLAUDE.md, README.md | 2026-08-11 |
| `supabase` | yes | 3 | 3,207 | CLAUDE.md, README.md | 2026-08-30 |
| `supabase-postgres-best-practices` | yes | 35 | 807 | CLAUDE.md, README.md | 2026-08-30 |
| `supabase-server` | yes | — | 5,094 | CLAUDE.md, README.md | 2026-08-30 |
| `verify-in-browser` | yes | 4 | 2,257 | CLAUDE.md, README.md | 2026-08-30 |
| `visual-assets` | yes | — | 1,582 | CLAUDE.md, README.md | 2026-08-30 |
| `web-trend-scout` | yes | — | 1,090 | CLAUDE.md, README.md | 2026-08-11 |

**19 skills, ~34,585 tokens** if every SKILL.md were read in one
session. They are loaded on demand, so that total is a ceiling, not a per-session cost.

### Purpose of each

- **`autonomous-coder`** — Implements a feature-architect blueprint into real files in this repo (static .html page, optional omega-*.js module, idempotent supabase/*.sql, nav.js…
- **`cinematic-media`** — Work on sydomega-live's video and "cinematic" motion surface — the welcome demo video and its wiring, the transition/2.5D/motion engines, and the…
- **`context-budget`** — Keep this repo's per-session context cost down — measure what every agent session loads before it starts, decide where new documentation belongs so…
- **`deploy-gate`** — Ship a change to sydomega-live's real deployment surface — the static Vercel site and, separately, the Supabase backend — without letting a green local…
- **`edge-functions`** — Work on sydomega-live's Supabase Edge Functions — the 11 Deno/TypeScript functions under supabase/functions/ (checkout, stripe-webhook, concierge,…
- **`feature-architect`** — Turns a FEATURE_IDEAS.md proposal into an exact, file-by-file implementation blueprint for this repo's real static-HTML/Supabase architecture (no…
- **`grill-me-codex`** — Safety gate for HIGH-RISK changes in this repo — auth, database schema, payments/Stripe, RLS policies, or any new public-callable function/RPC.
  - carries: `THREAT_MODEL.md`
- **`i18n`** — Work on sydomega-live's translation layer — i18n.js (the inlined English key set T_EN) and i18n/{ar,es,fr,hi,nl,zh}.json.
- **`image-pipeline`** — Produce, add, or change imagery for sydomega-live — procedural SVG, canvas-rendered PNG (share cards, QR, exports), PWA/favicon raster, and…
- **`interface-guidelines`** — Audit sydomega-live against the Web Interface Guidelines, using only the rules that apply to a no-build vanilla-HTML stack.
- **`omega-platform`** — "Cross-discipline production engineering skill for SYD OMEGA 91717.
- **`runtime-verify`** — Verify a change to sydomega-live at runtime — render the real capability entrypoints in a headless browser with scripts/verify-runtime.js — and keep…
- **`subscriber-portal`** — Surfaces an already-built, human-approved feature inside the real subscriber-facing UI (dashboard/hub pages, existing tier and notification systems) —…
- **`supabase`** — "Use when doing ANY task involving Supabase.
  - carries: `CHANGELOG.md`, `assets/feedback-issue-template.md`, `references/skill-feedback.md`
- **`supabase-postgres-best-practices`** — "Postgres best practices maintained by Supabase, for Postgres running anywhere.
  - carries: `CHANGELOG.md`, `references/_contributing.md`, `references/_sections.md`, `references/_template.md`, `references/advanced-full-text-search.md`, `references/advanced-jsonb-indexing.md`, `references/conn-idle-timeout.md`, `references/conn-limits.md`, `references/conn-pooling.md`, `references/conn-prepared-statements.md`, `references/data-batch-inserts.md`, `references/data-n-plus-one.md`, `references/data-pagination.md`, `references/data-upsert.md`, `references/lock-advisory.md`, `references/lock-deadlock-prevention.md`, `references/lock-short-transactions.md`, `references/lock-skip-locked.md`, `references/monitor-explain-analyze.md`, `references/monitor-pg-stat-statements.md`, `references/monitor-vacuum-analyze.md`, `references/query-composite-indexes.md`, `references/query-covering-indexes.md`, `references/query-index-types.md`, `references/query-missing-indexes.md`, `references/query-partial-indexes.md`, `references/schema-constraints.md`, `references/schema-data-types.md`, `references/schema-foreign-key-indexes.md`, `references/schema-lowercase-identifiers.md`, `references/schema-partitioning.md`, `references/schema-primary-keys.md`, `references/security-privileges.md`, `references/security-rls-basics.md`, `references/security-rls-performance.md`
- **`supabase-server`** — Use when planning or writing server-side code that uses `@supabase/server` — Edge Functions, Hono apps, webhook handlers, or any backend that creates…
- **`verify-in-browser`** — Verify a change to sydomega-live by rendering the real pages in headless Chromium, and run repo-wide scans (page errors, mobile tap targets, horizontal…
  - carries: `harness/sbstub.js`, `harness/scan.js`, `harness/serve.js`, `harness/session.js`
- **`visual-assets`** — Design or change any visual element of sydomega-live — SVG assets, sigils, emblems, share cards, page marks, palette, typography — so it matches the…
- **`web-trend-scout`** — Researches external platforms, APIs, and open-source trends via real web search, then writes a proposal-only feature idea grounded in this repo's actual…

## 2 · Agents

`.claude/agents/*.md`. These are conversational role definitions, not a runtime —
this repo has no multi-agent execution engine (see `CLAUDE.md` §6).

| Agent | Role | ~tokens | Last touched |
|---|---|---|---|
| `claudeconcil` | Multi-turn guided interface for Claude Council deliberations. | 1,524 | 2026-08-18 |

## 3 · Platform census

Counted at generation time. These are the numbers that kept going stale in prose.

| What | Count |
|---|---|
| `.html` pages | 187 |
| pages loading `bg.js` | 187 of 187 |
| `omega-*.js` modules | 144 (1137 KB) |
| root `.js` files | 153 |
| `supabase/*.sql` (flat bag) | 126 |
| `supabase/migrations/*.sql` | 157 (106 numbered `NNNN_`, 51 timestamped) |
| Edge Functions | 11 |
| skills | 19 |
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
end-to-end for the first time"*. The 63 files added since (numbered and
timestamped alike) were **not part of that validation**, and no run has covered
all 157. Treat the validated scope as `0001`–`0094` only.

**`bg.js` is loaded by all 187 pages.** It is a hard single point of
failure for the entire platform, not a partial one — if it fails to parse, every
page is down. This is why `node --check` on it gates CI.

