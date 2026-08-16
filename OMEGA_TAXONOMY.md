# Ω Concern Taxonomy — sydomega-live

**Date:** 2026-08-16. **Companion documents:** [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md)
(technical/security state), [`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md) (what exists),
[`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) (what's missing), [`FEATURE_IDEAS.md`](./FEATURE_IDEAS.md)
(proposals awaiting a decision).

**What this is.** A shared vocabulary for talking about engineering/research concern-areas
(prompting, security, data, AI, UI, infrastructure, etc.) that this project touches or might
touch, organized so a future proposal in `FEATURE_IDEAS.md` or a `web-trend-scout` research pass
can point at a category instead of re-deriving it from scratch. It is **not** a new subsystem,
registry, page, or schema — nothing here changes runtime behavior. Where a category already
corresponds to something real in this repo, this document cites it (file, line, or existing doc).
Where it doesn't, it's marked as vocabulary/reference only, per `CLAUDE.md` §9's rule against
building things "because the taxonomy suggests it" rather than because a task needs it.

**What this is not.** It does not introduce a "Ω Command Registry," a prompt library, an
agent-orchestration runtime, or any of the speculative structures a generic version of this
taxonomy might imply. This repo's 12-agent system (`omega-agents.json`) is explicitly documented
in `CLAUDE.md` §6 as a UI/UX persona system, not a technical multi-agent runtime — that
distinction holds throughout this document too.

---

## 1. How to use this document

- Picking a `web-trend-scout` research topic, or writing a `FEATURE_IDEAS.md` entry: find the
  matching category below, check its "grounded in" line (if any) for what already exists, and
  cite it the way every existing `FEATURE_IDEAS.md` entry does.
- Encountering an unfamiliar term in a request (a slash-command, a tool name, an abbreviation):
  check §9 (Pending Terminology) before guessing at a meaning. If it's not there, add it — don't
  invent a definition and let it drift into design decisions.
- This document does **not** get "implemented." Individual categories only turn into real work
  the normal way this repo already works: a `FEATURE_IDEAS.md` proposal → `feature-architect`
  blueprint → `autonomous-coder` implementation → human review → optional `subscriber-portal`
  exposure (`.claude/skills/README.md`).

## 2. Categories grounded in something real in this repo today

| Category | What it actually is here |
|---|---|
| AI agents / personas | `omega-agents.json` — 12 personas (sign/element/god/domain), driving `omega-copilot.js`'s voice and `nav.js`'s section naming. UI/UX layer, not a runtime (`CLAUDE.md` §6). |
| Skills / autonomous pipeline | `.claude/skills/` — 4 real skills (`web-trend-scout`, `feature-architect`, `autonomous-coder`, `subscriber-portal`), documented in `.claude/skills/README.md`. This *is* this repo's actual "command registry" — see §8. |
| MCP | Not present in this repo's runtime. Claude Code (the tool used to develop this repo) uses MCP servers for its own tooling (e.g. Supabase, GitHub) — that's development tooling, not something `sydomega-live` itself implements or depends on. |
| Evaluation / quality gates | `scripts/audit.py` (module graph, RLS coverage, duplicate-table/RPC divergence warnings — CI-blocking) + `.github/workflows/ci.yml`'s 8 checks (`CLAUDE.md` §7). This is the real eval engine for this repo; there is no separate AI-output eval harness. |
| Red-team / adversarial review | The `security-review` skill (session-level, not project-specific) plus this repo's own RLS-policy audit pattern (`CLAUDE.md` §8's "RLS policy audit" entry — every `FOR INSERT/UPDATE/ALL` policy checked for a missing `WITH CHECK` scope). No client-side threat detection exists despite `omega-threat.js`'s name (§8's naming-mismatch note) — treat "security" claims in this repo's own UI copy (`omega-guardian.js`'s badge) skeptically, per the same section. |
| Prediction / forecasting | Not implemented anywhere in this repo. `oracle.html`/`horoscope.html` are lore/UX pages (zodiac flavor text), not statistical forecasting — don't conflate the two if a future proposal touches either. |
| Data / analytics | Real: `analytics.html`, `omega-chart.js`, `leaderboard_snapshots`, `platform_metrics`. See `CAPABILITY_INVENTORY.md` §1 (COSMOS/INTEL sections) for the actual page-by-page state. |
| Database administration | Real: `supabase/*.sql` (flat, ~105 files) + `supabase/migrations/` (ordered copy, not yet canonical — `CLAUDE.md` §5). `supabase/RUN_ORDER.md` documents real apply order. |
| Connection pooling / PgBouncer | Supabase-managed; not something this repo configures directly. No PgBouncer config exists in this repo — if a future page needs to reason about connection limits, that's Supabase project settings, not repo code. |
| DevOps / CI | Real: `.github/workflows/ci.yml`, `vercel.json` (explicitly no-build — `CLAUDE.md` §1). |
| UI/UX design system | Real: `bg.js`'s injected `<style>` block, the Ω-GVP extension layer (`CLAUDE.md` §4, §4.1). |
| Playwright / E2E testing | Used ad hoc by prior audit sessions (headless-Chromium verification, per `CLAUDE.md` §8's many entries) but **not committed to the repo** — no `tests/`, `playwright.config.*`, or CI step runs it. Treat any future "add Playwright tests" proposal as new work, not a gap in existing tooling. |
| i18n | Real: `i18n.js` (7 languages, RTL for Arabic), wired into `omega-controls.js`'s language dock and (as of the sidebar fix, `CLAUDE.md` §8) `nav.js`'s 15 section labels. Sub-navigation and in-page content are not yet covered — real, open gap, not proposed here. |
| Knowledge management / taxonomy | This document is itself the first artifact in this category for the repo. No knowledge graph, embeddings, or semantic search exist anywhere in the codebase today. |

## 3. Categories that are general engineering vocabulary, not repo-specific

These are real, standard concern-areas (software architecture, algorithms, programming
languages, mathematics, Linux/infra fundamentals, DevSecOps practice) that apply to any codebase
and don't need a repo-specific mapping — they're listed here only so a future proposal can cite
"this touches [category]" without re-explaining what the category means:

architecture & design (SOLID/DRY/KISS/YAGNI, coupling/cohesion, design patterns) · algorithms &
data structures (graph traversal incl. Dijkstra, DP, sorting/searching) · mathematics
(algebra, probability/statistics, discrete math, linear algebra) · programming languages in use
here specifically (plain JS/HTML/CSS client-side, PL/pgSQL + SQL server-side, Deno/TypeScript for
Edge Functions — **no Python, React, Next.js, or Node backend exists in this repo**, despite
those appearing in generic tech-stack lists) · Linux/shell fundamentals · cloud/infra concepts
(this repo specifically uses Vercel + Supabase only, per `CLAUDE.md` §1 — AWS/Azure/GCP/K8s are
not part of this stack and shouldn't be proposed without a reason to change platforms) ·
control-flow/structured-programming principles.

## 4. AI/ML vocabulary not yet applicable to this repo

Deep learning, model training/fine-tuning, vector databases, RAG, embeddings, knowledge graphs,
recommendation systems, multimodal models: **none of these exist in this repo.** The only AI
integration is `supabase/functions/concierge` (`CLAUDE.md` §5) — a server-side Anthropic API call
backing the in-app copilot, with the key held in Supabase secrets. Any future proposal invoking
these terms should first check whether it's actually proposing a change to `concierge` (the one
real AI surface) or something net-new — the taxonomy source material's assumption of an existing
"agent orchestration / RAG / vector DB" layer does not match this repo's actual architecture.

## 5. Art / 3D / cinematic-universe vocabulary

Real presentational content exists (`cosmos.html`'s per-element styling, `character.html`,
`cinema.html` — all corrected for zodiac/element/god accuracy per `CLAUDE.md` §8's "9-elements
sign mapping" entry). No 3D rendering (WebGL/Three.js/WebGPU), procedural art generation, or
AI-image-generation pipeline exists in this repo. `CLAUDE.md` §1 is explicit that operational
technology (auth, RLS, payments) is kept separate from the fictional/cinematic lore layer — any
future art/3D proposal should preserve that separation, not blend brand fiction into
security-relevant claims (the same overclaim pattern already fixed repeatedly in `CLAUDE.md` §8,
e.g. the marketplace/compliance/family-page "51% stake" fixes).

## 6. Research-source tiering (for `web-trend-scout` and any future research pass)

Adapting the general tiering to this repo's actual stack, so a research pass prioritizes sources
that are actually relevant:

- **Tier 1 — standards directly relevant here:** OWASP (RLS/auth is this repo's real security
  boundary, `CLAUDE.md` §5), W3C/WHATWG (HTML/CSS/JS — the entire client), IETF (HTTP/TLS).
- **Tier 2 — official docs for the actual stack:** Supabase (Postgres/RLS/Edge
  Functions/Storage), PostgreSQL, Vercel, Stripe, Anthropic API, Deno.
- **Tier 3 — academic/standards bodies:** relevant only if a proposal touches genuinely novel
  algorithmic work; rarely applicable to a static-HTML/Supabase CRUD platform.
- **Tier 4 — engineering practice:** postmortems/case studies from teams running comparable
  stacks (Supabase + static hosting), most useful for `web-trend-scout`'s actual job.
- **Tier 5 — community (Stack Overflow, Reddit, dev blogs):** treat as experience/opinion to be
  independently verified against Tier 1–2, never cited as sole justification in a
  `FEATURE_IDEAS.md` entry — matching this repo's existing rule (`CLAUDE.md` §9) that changes
  stay evidence-cited.

## 7. Human oversight / factuality framing

Two general principles worth keeping explicit for this specific repo, given its history
(`CLAUDE.md` §8 documents many silent-failure bugs that shipped because a claim — "extended
+9:17 minutes," "export ready," "DISPATCH RECORDED" — was shown without checking whether the
underlying write actually succeeded):

1. **Distinguish fact / inference / prediction / fiction / user-provided data** in anything
   AI-generated or auto-computed that reaches a user-facing page — this repo's own lore (zodiac
   signs, Olympian gods) is fiction by design, and its own token-economy copy was previously
   fixed for stating dormant features in the present tense (`CLAUDE.md` §8's "token economy...
   present tense" entry). Any new AI-assisted or predictive feature should carry the same
   explicit framing.
2. **Never show a success state without checking `.error`** — this is not a new principle, it's
   the single most repeated root cause in `CLAUDE.md` §8 (extend_trial, complete_task,
   member_presence, onboarding, GDPR export, activity ticker, dispatch fallback — all silently
   "succeeded" while writing nothing). Any new write path must check the result before rendering
   success, full stop.

## 8. This repo's actual "command registry" — the 4 real skills

The source taxonomy proposed a formal `/ooda`, `/truth`, `/redteam`, `/eval`, `/predict`, etc.
slash-command registry with per-command PURPOSE/INPUT/OUTPUT/AGENT/TOOLS/PERMISSIONS/SAFETY
fields. **None of those commands exist in this repository** — grep confirms no `.claude/commands/`
directory and no slash-command definitions anywhere in the repo. What this repo *does* have,
serving the equivalent purpose (a defined, safety-gated pipeline for turning an idea into
shipped code), is `.claude/skills/`:

| Skill | Purpose | Output | Gating |
|---|---|---|---|
| `web-trend-scout` | Research external platforms/APIs, ground a proposal in real repo code | `FEATURE_IDEAS.md` entry | No code written |
| `feature-architect` | Turn one chosen proposal into an exact file-by-file blueprint | Blueprint (page, `nav.js` wiring, SQL, flag) | No code written |
| `autonomous-coder` | Implement the blueprint for real | Committed `.html`/`omega-*.js`/`supabase/*.sql` on the current branch | Never flips a `platform_settings` flag live, never merges to `main`, never touches CI/secrets |
| `subscriber-portal` | Expose an already-shipped, already-flagged-on feature in real subscriber UI | Dashboard/hub wiring using the real tier system | Only runs after a human has already turned the flag on |

This is the concrete instantiation of the taxonomy's "command registry" idea, already built and
already following the PURPOSE/OUTPUT/GATING shape the source material asked for — see
`.claude/skills/README.md` for the full rationale (§"Why it stops short of full autonomy").

## 9. Pending terminology — do not guess

The following terms appeared in the source material without enough context in this repository to
define confidently. Per this document's own rule (§1), they are recorded here rather than given
an invented meaning:

- `L-99`
- `Claude_Flake5`
- `kimiKy3`
- `alt3`
- `killcritic`
- `/i = V-1`, `/i² = -1` (standard imaginary-unit notation, unclear what a slash-command by this
  name would do)
- `/Pi = 1.618` (1.618 is the golden ratio φ, not π ≈ 3.14159 — likely a mislabel in the source
  material; not corrected into a definition here, just flagged)

If any of these turn out to name a real tool, model, or convention relevant to this repo, replace
its entry above with a real definition and a citation — don't remove it silently.
