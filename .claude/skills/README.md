# Skills

**19 skills live here.** The full generated inventory — including which reference
doc names each one, and whether its frontmatter makes it discoverable at all —
is `OMEGA_SKILL_REGISTRY.md` at the repo root, produced by
`scripts/omega-registry.py` and gated in CI. Prefer it over any count written
into prose here: this file said "Four skills" for long enough that three of the
eight went undocumented, and `CLAUDE.md` disagreed with it in two places.

Eight are the feature-proposal pipeline and its support skills, described
below. Eight are **domain skills** — reference for a specific surface of the
platform, or (in `omega-platform`'s case) across all of them:

- **omega-platform** — the cross-discipline production-engineering skill:
  one place covering GitHub, Vercel/static delivery, Supabase (Postgres, Auth,
  Storage, Edge Functions), AI/agents, security, accessibility, performance,
  testing, observability, data lifecycle and release ops. Invoke for a
  substantial change that spans more than one of the single-surface skills
  below.
- **deploy-gate** — release gating (Vercel static site + Supabase backend are
  separate planes), `.vercelignore`, rollback.
- **runtime-verify** — `scripts/verify-runtime.js` (headless render of the
  capability entrypoints) and keeping `docs/capabilities/registry.json`'s
  six-part contracts honest. Invoke after any `bg.js`/`nav.js`/`omega-*.js`/
  markup change, and before promoting a capability's status.
- **edge-functions** — the 11 `supabase/functions/*` (Deno/TS): the secrets,
  `check-secrets.sh`, the secret-gated-dormant convention, `stripe-webhook`
  signature validation, `concierge`'s graceful fallback, the hand-deploy path.
- **visual-assets** — canonical palette/type tokens from `bg.js` `:root`,
  SVG-only asset rules, the sigil/emblem/share-card modules.
- **cinematic-media** — the demo video, faststart remux, the transition/2.5D/
  motion engines and their traps.
- **image-pipeline** — procedural SVG first, the canvas→PNG generators,
  `OmegaStorage` uploads, raster-add rules.
- **i18n** — `T_EN` in `i18n.js` + the 6 `i18n/*.json` packs; the four things
  `scripts/i18n-contract.py` blocks on (parse, unresolved key, orphan pack
  key, HTML entity in a value) and the workflows for adding a key / value /
  language. Invoke before touching any `data-i18n` key or dictionary value.

Three are the **vendored Supabase skills** — this repo is a Supabase project, and its single most
recurring bug class is Supabase-shaped (`CLAUDE.md` §8.1: wrong column names,
missing `GRANT`s, RLS gaps, upsert-conflict targets, migration drift), so the
official guidance is kept in-tree:

- **supabase** — the general Supabase skill (Database, Auth, Edge Functions,
  Realtime, Storage, RLS, CLI/MCP, migrations, debugging PostgREST/Postgres
  errors and reading logs). Vendored from `supabase/agent-skills`.
- **supabase-postgres-best-practices** — load **before** creating or altering a
  table/column, writing an RLS policy or its test, an index, a trigger, a DB
  function, a `pg_cron`/`pgmq` job, or a migration — and when diagnosing a slow
  query, a timeout, a lock, or a row visible to the wrong tenant. 33 reference
  files under `references/`. Vendored from `supabase/agent-skills` (MIT).
- **supabase-server** — for Edge Function / inbound-auth code. This repo's 11
  functions still use the legacy `Deno.serve` + `createClient(Deno.env.get(...))`
  pattern this skill treats as a migration target; load it before touching
  `supabase/functions/`. Vendored from `supabase/server`.

## Autonomous feature-proposal pipeline

Four of the eight form a pipeline, meant to run in this order, each a separate
Claude Code invocation (`/web-trend-scout`, `/feature-architect`,
`/autonomous-coder`, `/subscriber-portal`):

1. **web-trend-scout** — research only. Writes a grounded, proposal-only
   idea into `FEATURE_IDEAS.md`. No code.
2. **feature-architect** — planning only. Turns one chosen proposal into an
   exact file-by-file blueprint (page name, nav.js wiring, SQL file,
   flag). No code.
3. **autonomous-coder** — implementation. Writes the actual `.html`/
   `omega-*.js`/`supabase/*.sql` files per the blueprint, verifies with
   `scripts/audit.py` + `node --check`, commits to the current branch.
   Never flips a `platform_settings` flag to `true`, never merges to
   main, never edits CI.
4. **subscriber-portal** — exposure. Only runs once a human has decided a
   shipped-but-dormant feature is ready and its flag is actually `true`;
   wires it into the real dashboard/hub pages and the real tier system
   (`OmegaCanon`/`membership_tier`), not a parallel one.

## Safety gate (HIGH-RISK changes only)

- **grill-me-codex** — runs *before* `feature-architect` when a change touches
  auth, database schema, payments/Stripe, RLS policies, or adds a new
  public-callable function/RPC. Forces a threat-model review against this
  repo's eight real failure classes and writes a decision record (`PLAN.md`)
  plus an audit trail (`CODEX_REVIEW.md`). It carries `THREAT_MODEL.md`.
  Until 2026-08-24 this skill had no YAML frontmatter at all — so it had no
  `name:` or `description:` for an agent to match on, making the one skill
  whose job is stopping unexamined high-risk changes the least discoverable
  skill in the repo. `scripts/omega-registry.py` now fails CI on that shape.

## Standalone skills (not part of the pipeline)

- **verify-in-browser** — renders the real pages in headless Chromium and runs
  repo-wide scans (page errors, mobile tap targets, horizontal overflow,
  duplicate ids, fixed-chrome collisions, dead inline handlers). Not a stage in
  the pipeline: it is the check you run *after* any change to `bg.js`, `nav.js`,
  an `omega-*.js` module, or page markup, and before claiming a UI fix works.
  It carries the reusable harness (`harness/session.js`, `harness/sbstub.js`,
  `harness/serve.js`, `harness/scan.js`) plus the sandbox gotchas that have
  produced a wrong conclusion at least once each — the blocked `esm.sh` import
  that makes every module look broken, the service worker that defeats
  `page.route`, the four first-visit overlays that swallow clicks, and why
  `git stash` cannot give you a working "before".

- **context-budget** — keeps the per-session context cost down: measures what
  every session loads before it starts, says where new documentation belongs so
  `CLAUDE.md` does not regrow, and gives cheap read recipes for this repo's very
  large files. Backed by `scripts/context-budget.py`, blocking in CI. Invoke it
  when adding to any audit doc.

- **interface-guidelines** — audits the platform against the Web Interface
  Guidelines, using only the rules that transfer to a no-build vanilla-HTML
  stack. Records which upstream rules are React-only rather than importing the
  list wholesale (see `CLAUDE.md` §10.1).

## Skill reference table

| Skill | Purpose | Input | Output | Safety Guardrails | Gating |
|-------|---------|-------|--------|-------------------|--------|
| **web-trend-scout** | Research real platforms and trends, propose new ideas grounded in this codebase | External URLs/requests + existing `FEATURE_IDEAS.md` + grep verification | New numbered proposal entry in `FEATURE_IDEAS.md` (status: proposal only) | Cannot assume frameworks/build steps; must cite real files/tables/RPCs; no code written | Never marks idea as decided—that's the owner's call |
| **feature-architect** | Turn a proposal into exact file-by-file blueprint, architecture only | One `FEATURE_IDEAS.md` entry (or user spec) + existing codebase reference | New `## Blueprint` section in same `FEATURE_IDEAS.md` entry specifying exact filenames, nav.js changes, data-layer shape, feature flags, tier gates | Never assumes Prisma/Next.js/monorepo; RLS required on all new tables; flags defaulted `false`; no code written | Explicitly marks if feature needs `platform_settings` gate + blocks code until architect decides |
| **autonomous-coder** | Implement the blueprint into real `.html`/`omega-*.js`/`supabase/*.sql` files | One complete `feature-architect` blueprint from `FEATURE_IDEAS.md` | Committed, pushed code on working branch (never to `main`); audit.py reports 0 new CRITICAL | Passes `node --check` + `audit.py` + broken-asset check; `service_role` never in client code; every write checks `.error`; member-writable data escaped with `esc()` | Never flips `platform_settings` flags to `true`; never merges to `main`; never edits CI/workflows |
| **subscriber-portal** | Surface an already-built, human-approved feature in real UI | Live feature with `platform_settings` flag already `true` + confirmation flag is actually on | Feature visible and usable in dashboard/hubs with tier gating via `OmegaCanon.tierUnlocks()` | Never renders as "unlocked" for false flag state; checks real gate before rendering; uses existing systems (`omega-canon.js`, `notifications`) not new ones; silent-failure checks on every write | Only runs after human explicitly flips the flag on; same branch/audit/commit rules as autonomous-coder |

## Why it stops short of full autonomy

This repo is a single-owner platform with real Stripe payments and a
documented history of serious, silently-shipped bugs (stored XSS in the
admin panel, a Stripe webhook that failed on every call, a task-completion
RPC that never committed anything — see root `CLAUDE.md` §8). Its own
rules (`CLAUDE.md` §9) say: no monetizable/legally-sensitive feature ships
"live" without an explicit gating decision, and changes should stay
reviewable rather than irreversible. This pipeline is built to match that:
every stage up through step 3 produces reviewable, dormant-by-default
output on a branch — nothing reaches an actual subscriber until a human
looks at the diff and flips a flag. Step 4 only ever activates something a
human already decided to turn on.

If a task genuinely needs to skip a stage (e.g. the blueprint is trivial
enough that architecture and coding happen in one pass), that's fine — but
the safety defaults in each `SKILL.md` (RLS required, flags default
`false`, no auto-merge, docs updated same-commit) still apply regardless
of which skill produced the change.

## Detailed skill instructions

Full instructions for each skill are available in their respective `SKILL.md` files:
- **web-trend-scout:** [`.claude/skills/web-trend-scout/SKILL.md`](web-trend-scout/SKILL.md)
- **feature-architect:** [`.claude/skills/feature-architect/SKILL.md`](feature-architect/SKILL.md)
- **autonomous-coder:** [`.claude/skills/autonomous-coder/SKILL.md`](autonomous-coder/SKILL.md)
- **subscriber-portal:** [`.claude/skills/subscriber-portal/SKILL.md`](subscriber-portal/SKILL.md)
