# CLAUDE.md — sydomega-live

This file orients any engineer or AI agent working in this repository. It
describes what actually exists today, not an aspirational target. Where the
product's own branding uses mythic/"sovereign" language, this document
translates it to concrete engineering terms so decisions can be made on
facts.

## 1. What this is

A single-owner, membership-gated personal platform ("Ω SYD OMEGA 91717"):
habits, learning, finance tracking, media, and social/community features,
themed around a consistent zodiac/Greek-god/element brand system. It is a
static site with a Supabase backend — no framework, no build step, no
bundler.

- **Owner:** one account (`profiles.is_owner = true`, keyed to
  `s.y.dagher@gmail.com`) has elevated access across the schema.
- **Members:** other accounts request access, sit in a pending/approved
  state (`access_approved`, `pending.html`, `approvals.html`), and once
  approved get full app access. This is an invite/approval-gated personal
  platform, not an open public SaaS signup flow.
- **Deployment:** Vercel, static file serving, no server-side rendering.
  `vercel.json` explicitly disables install/build (`echo skip-install`,
  `echo static-no-build`) — every `.html`/`.js` file ships as-is.
- **Backend:** Supabase (Postgres + Row Level Security + Edge Functions +
  Storage). All data access from the client goes through the Supabase JS
  client using the anon/publishable key; RLS policies are the actual
  authorization boundary, not application code.

## 2. Repository layout

```
/                    Standalone .html pages, one per feature. Each is a
                     full HTML document with inline <script>, not a
                     component — no page template engine. Shared behavior
                     comes from loader scripts injected at runtime.
                     (Counts drift; run `scripts/omega-registry.py`.)
bg.js                The "nervous system": injected first, loaded by every
                     page. Injects the design-system <style>, the approval
                     guard, a synchronous fetch recorder, and defer-loads
                     every other omega-*.js module. If it fails to parse
                     the whole platform is down — a total, not partial,
                     single point of failure.
nav.js               Sidebar navigation: maps every page slug to a nav
                     section (COMMAND, IDENTITY, ASCEND, COSMOS, VAULT,
                     ORDER, INTEL, ...) and renders the icon dock.
omega-*.js           Single-purpose modules (auth gate, copilot, telemetry,
                     charts, motion, data guard, PWA, ...), loaded by bg.js
                     or by the pages that need them.
vendor/              Third-party code served from this origin rather than a
                     CDN — currently the Supabase client (see §4).
omega-*.json         Static config/data: agent roster (omega-agents.json),
                     element/house tables, content catalog, canon lore.
supabase/*.sql       Backend schema, a flat bag applied in sequence (see
                     "Known debt"). live-schema.json snapshots what the
                     database actually has.
supabase/functions/  Edge Functions (Deno/TypeScript) — 11: checkout,
                     stripe-webhook, concierge (Anthropic-backed), notify-
                     access, weekly-digest, and the pg_cron jobs (rankings,
                     snapshot-leaderboard, …). Full map: the `edge-functions`
                     skill. Deployed by hand via the Supabase CLI, not CI.
core/                The Ω Intelligence Fabric — provider-neutral Python
                     primitives (execution boundary, policy firewall, model
                     router, proof engine, skill registry, evidence matrix).
                     Never deployed (`*.py` is in `.vercelignore`); driven
                     against the real platform by `scripts/omega_fabric_audit.py`.
scripts/             Repo tooling: audit.py (CI-gating integrity check),
                     verify-runtime.js (headless render check),
                     capability-audit.py / release-gate.py (the §10 registry
                     gates), check-secrets.sh, one-off migration/patch scripts.
.github/workflows/   CI: syntax check, repo audit, prettier/eslint
                     (non-blocking), broken-asset check, service-role key
                     scan, Edge Function syntax check, PWA asset checks,
                     capability-evidence (incl. the runtime render).
```

There is no `src/`, no `components/`, no `dist/`. What you see in the repo
root is what gets deployed.

## 3. How a page actually works

Every page is a self-contained `.html` file. The shared platform behavior
comes entirely from `bg.js`, which every page loads via `<script src="/bg.js">`
(or equivalent):

1. `bg.js` injects the global CSS design system (design tokens under
   `:root` — colors, fonts, spacing — see §4) as a `<style>` tag.
2. It injects an "approval guard": a CSS rule that hides `#app`/`.shell`/
   `main.main` by default, lifted only once the session is confirmed
   *and* the profile is approved (`body.omega-approved`). This exists
   specifically because per-page auth checks used to have a timing gap
   between "session exists" and "profile approved" — see the comment
   block at the top of `bg.js`. A fixed list of public pages
   (`account`, `enter`, `reset`, `terms`, `pending`, `index`, `/`) is
   exempt, since they must render for signed-out visitors.
3. It defer-loads the platform modules (`omega-sovereign-os.js`,
   `omega-copilot.js`, `omega-threat.js`, etc.) via injected `<script>`
   tags, guarded by `data-omega-*` attributes so nothing double-loads.

`nav.js` renders the sidebar, keyed off `data-page` or the pathname.
`bg.js` auto-injects it (guarded by `data-omega-nav`); the ~9 pages with
their own `<script src="/nav.js">` predate that and are harmless, since
double-injection is guarded. That auto-injection was itself a bug fix
(`FIXES_LOG.md`) after being absent for a long stretch — so verify claims
like this one with a real render, not a grep for the script tag.

**Consequence for anyone editing a page:** don't hand-roll the auth check,
the design tokens, or the sidebar. Load `bg.js` the way every other page
does, and use the existing CSS classes/tokens (`.card`, `.kpi`,
`.btn-gold`, `--gold`, `--cyan`, etc. — all defined once, in `bg.js`).

## 4. Design system (as it exists, not as a target)

Tokens and layout primitives are defined once, in `bg.js`'s injected
`<style>` block. **Paint is not.** This section used to say bg.js *is* the
design system; a live render of `dashboard.html` enumerates **53
stylesheets** and bg.js is sheet 1 of 53, so every later sheet wins an
equal-specificity tie. Five global layers redefine the same surfaces, and
the effective owner differs per selector — check the render, not this list,
before styling a shared class:

| surface | real owner |
|---|---|
| tokens, layout, `.glass`, `.kpi-n`, `.chip`, `.bar-*`, `.btn`, `.tbl-head` | `bg.js` (sheet 1) |
| `.card`/`.kpi`/`.kpi-card` shadow + border, `.topbar`, `.sechead`, `body::before` field | `omega-visual-evolution.css` (13) |
| `#omega-side` (with `!important`) | `nav.js` (16) |
| `body{background}` (with `!important`) | `omega-backdrop.js` (20) — tints to the member's element and page; a feature, don't fight it |
| **the palette itself** — `--void`, `--crim`, `--ink`, `--muted`, `--line` | `theme.js` (`#omega-theme-css`, 19) — a "Sovereign Dusk" layer that re-declares them and, being later, **beats bg.js**. Change a token there too, or the change does not ship |

A page's own `<style>` is sheet **0**, so bg.js (1) beats it: 62 pages redefine
canonical tokens in their own `:root` and every one of those is dead code
(measured). Only the 51 sheets after bg.js can win.

A rule written in bg.js for a surface it does not own is dead code that
looks correct in the diff. That is exactly how the Ω-HORIZON v2 layer came
to be invisible (§8.4).

**The Supabase client is self-hosted at `/vendor/supabase-js.js`** — the
official UMD bundle plus an ESM export footer, no bundler. Do not reintroduce
`import ... from 'https://esm.sh/@supabase/supabase-js@2'`: that was 146
imports putting a third-party CDN on the critical path of every page view, and
a top-level import that never resolves runs *none* of that module's code, so
the page paints its placeholders and sits there forever. The browser harness
stubs that local path, not esm.sh. Upgrade with `npm pack`, per `FIXES_LOG.md`.

**Motion and load-state have single owners too.** `bg.js` wraps `fetch`
synchronously (a recorder only) and `omega-dataguard.js` surfaces slow/failed
data; `omega-motion.js` owns entrance, value roll-up, tilt and press via the
Web Animations API with `fill:'none'`, so nothing ever holds a persistent
hidden state. It defers to the two pre-existing reveal systems —
`omega-content.js` (`.oc-hidden`) and `omega-animated.js` (`.oa-reveal`) —
which already own `opacity` on what they manage.

**Bottom chrome has a single measured owner.** Five modules anchor fixed bars
and buttons to the viewport floor and used to coordinate through hardcoded
constants (`bottom:102px`, `66px`, `224px`, and `bg.js`'s `36/98/146/228`
ladder) — each right at one viewport, wrong elsewhere, and none measured
against `#omega-consent`, whose height varies 80–134 with its copy.
`omega-bottom-stack.js` publishes `--omega-chrome-bottom` (persistent
furniture) and `--omega-transient-bottom` (that plus any banner). Transient
banners clear the furniture with the first; the floating ladder steps over the
banners with the second. Never add a bottom-anchored constant — read a
property, and mark new furniture `data-omega-bottom-chrome`.

- Palette: `--void`/`--void2` (near-black background), `--gold`/`--solar`
  (primary accent), `--cyan` (secondary accent), `--crim` (danger/red),
  `--green`, `--purple`, `--muted`, `--ink` (text).
- Type: `--D` (Cinzel Decorative, display/headers), `--R` (Rajdhani, body),
  `--M` (Courier Prime, labels/mono/letter-spaced UI chrome).
- Layout primitives: `.shell`/`.side`/`.main` (sidebar + content), `.kpi`/
  `.kpi-row`, `.card`/`.card-grid`, `.tbl-*`, `.tab-*`, `.chip`, `.glass`/
  `.glass-cyan`, `.bar-track`/`.bar-fill`. **`.shell` is a flex _row_**, so a
  page-level block written after `</main>` is not below the content — it is a
  third column taking its own width out of the page (23 pages once rendered
  ~300px narrow this way). Put page-level blocks inside the content column.
- Responsive breakpoints at 1200/900/700/480px, all defined in the same
  block.

If a new page needs a component not covered here, extend the shared block
in `bg.js` rather than defining page-local styles that will drift.

### 4.1 Ω-GVP extension layer

`bg.js`'s injected stylesheet has a second section below the v3 tokens
above: an additive "Glass-Vector Platform" layer (search `Ω-GVP` in
`bg.js`) that upgrades the existing shared classes rather than
replacing them — every rule targets `.card`/`.kpi`/`.kpi-card`/`.glass`/
`.glass-cyan`/`.tbl-row`/`.inp`/`.btn-*`, so it reaches all 178 pages
through this one file with no per-page markup changes:

- **Glass shimmer + cursor-reactive light** — `.card`/`.kpi`/`.glass` panels get
  a hover shimmer sweep and a pointer-following radial highlight (`--mx`/`--my`,
  set by one passive rAF-throttled `pointermove` listener in bg.js — a single
  `getBoundingClientRect()` per frame, only while hovering a match).
- **Glow-edge borders** on `.card`/`.kpi-card` (gradient `border-image`
  + box-shadow glow, both **hover-only**, never static). Hover-only is a
  correction, not the original design, and the reason is the standing
  rule: `border-image` wins the border paint regardless of selector
  specificity, so a *static* version silently discarded any page's own
  per-instance border the moment `.card` was added to its markup
  (`matrix.html`'s inline `border-color`, `family.html`'s `.mc.heir`,
  `cosmos.html`'s JS-set `.el-card` left border — all three). Confining it
  to `:hover` keeps every page's resting-state border exactly as that page
  intended, retroactively for pre-existing `.card` usage too. `.kpi` is
  excluded outright: it already carries a per-instance `--kc` accent color,
  so it gets a matching hover glow in that color instead.
  A page-local `::before` setting `background` collides with `.card::before`
  per *property*. **That collision is solvable, and this file twice said it was
  not**: `.card::before` is the same 2px top bar, and it reads `--card-accent`,
  which takes a colour *or* a gradient (proven in a render). Set
  `--card-accent` on the page-local class and delete its own pseudo —
  `honors.html`'s five `.tier-*` gradients and `gaming.html`'s two bars
  translated losslessly. Check *which properties* collide, never the mere
  presence of a pseudo.
- **Platform-wide `.card` sweep.** `.card` was added to ~187 page-local
  `*-card` classes across 117 files by scanner. **The standing fact:** ~34
  classes were deliberately **not** swept, because `.card`'s hover-only
  `border-image`/glow collides with something they already own — a page-local
  `::before`/`::after` that sets `background` (pseudo-elements cascade per
  *property*, and only one can win that one), or a per-instance border on the
  card element itself (inline `style=`, JS `.style.border*`, or a same-element
  modifier like `.mc.heir{border-left:…}`). State-modifier classes
  (`.sel`/`.active`/`.unlocked`…) that set `border-color` *were* swept in —
  hover-only masking hides them only during a simultaneous hover. Check a class
  against those two failure modes before adding `.card`; the per-class list,
  the scanner and the verification are in `FIXES_LOG.md`. Two facts before any
  sweep. **A sweep is not additive**: `omega-visual-evolution.css` styles
  `.card,…,[class*="card"]` — that substring selector already gives *every*
  `*-card` class the glass surface — and it loads after the page's `<style>`,
  so at equal specificity it wins; measured, it rewrote resting
  border/background/padding/radius on 130 swept elements. Re-assert anything
  the page means at `.x.card`. **And `.card` enrols the element in the
  `oa-fade-up` reveal**, whose last keyframe pins `opacity:1` — that silently
  un-dimmed 16 `.honor-card.locked` badges; an animation beats a plain
  declaration, and only `!important` outranks it.
- **`.card-edge`, the left-edge accent.** `.card::before` is a *top* bar, which
  is why 124 hand-rolled `border-left:Npx solid <colour>` sites across 68 files
  were all excluded from the sweep. `.card.card-edge` runs the same
  `--card-accent` bar down the left instead (width `--card-edge-w`, default
  3px). Check the element's own `::before` first — `chronicle.html`'s
  `.event-card` draws its timeline connector there, so it stays excluded.
- **Active-tab beam** — `.tab-btn::after`, a positioned 3px bar (not a border)
  growing from the tab centre in the page axis colour. 40 pages own `.tab-btn`
  rules and win the cascade; none owns a pseudo — established by parsing
  `<style>` blocks, since a whole-file grep counts every
  `querySelectorAll('.tab-btn')` as a CSS rule.
- **Telemetry utilities**: `.trend.up`/`.down`/`.flat` badges, `.tbl-row.up`/
  `.down` colouring, zebra striping, `.sparkline`. `.trend` sets
  `justify-self:start` deliberately — `.tbl-row` is `display:grid`, and without
  it a `.trend` child fills the implicit track. **Draw them through
  `omega-sparkline.js`** (`data-omega-spark` + `data-spark-values`; per page, not
  bg.js), never by hand: a badge asserts a direction, so it draws nothing below
  two real readings and its 6 adopters exclude the open day/month — §8.1 class 9
  in code, not memory.
- **Glass form controls**: `.inp` gets deeper blur + a focus glow ring;
  `.field` + `.field label` gives an opt-in floating-label pattern.
- **`.btn-fill`, the filled primary action.** bg.js had only *ghost* buttons, so
  pages hand-rolled `.btn{background:var(--gold);color:var(--void)}` at the same
  (0,1,0) specificity — and lost, since this sheet loads after the page block.
  Measured: `account.html`'s CREATE ACCOUNT/LOG IN and `reset.html`'s SEND
  RECOVERY LINK at **1.01:1**, invisible to signed-out visitors;
  `mindmap.html`'s CREATE MAP at exactly **1:1**, gold on gold. Use
  `.btn.btn-fill` (retint with `--btn-fill`), never a page-local override. The
  ghost variants now set `background:none` themselves — without it a
  `<button class="btn-gold">` lacking `.btn` kept the browser's grey face
  (2.33:1, 8 pages).
- **Fallback skin for genuinely bare elements**: `input`/`textarea`/`select`/
  `button` with `:not([class])` get the `.inp`/`.btn` glass treatment — so
  anything with a page-local class or inline `style=` is untouched. Chosen after
  an audit found ~380 raw `<input>`s and dozens of raw `<button>`s with no shared
  class. Page-local table classes are skipped and remain open work.
- **Brand webfonts now actually load.** `--D`/`--R`/`--M` named Cinzel
  Decorative / Rajdhani / Courier Prime but nothing ever loaded them — zero
  `@font-face`, zero font files, zero Google Fonts links anywhere — so every
  page rendered in the browser defaults. `bg.js` injects the Google Fonts
  `<link>` (plus `preconnect`) once per page, guarded by `#omega-fonts`.
- **Ambient noise overlay**: a fixed `pointer-events:none` `<div
  id="omega-noise-overlay">` injected by bg.js — a real element, not a
  `body::before`, because 5 pages define their own and a bare-selector rule
  would collide.
- **`omega-constellation.js`** (`.ocn-`): the ring-of-emblems diagram —
  `<div data-omega-constellation="agents|signs|custom">`, each node a real link.
  It draws no artwork: it emits `data-omega-emblem` for `omega-emblems.js`. Node
  size is a geometric constraint, not a taste — read its header. `cosmos.html`
  has its own agent wheel.
- **`.omega-spin-slow`**: the signature motion motif — `animation:spin-slow 60s
  linear infinite`, static under `prefers-reduced-motion`. Used deliberately on
  emblem marks, not scattered; currently only `#ph-sigil` on `profile.html`.
- **`omega-cinematic-system.css` reaches every page** (bg.js, guarded by
  `#omega-cinematic-css`): `.omega-cinematic`, `.omega-emblem`,
  `.omega-depth-card`, `.omega-node` — it was on **1 of 189** pages. Additive; its
  `:root` declares only names it invents, having redeclared `--omega-void`/
  `--omega-line` against three sheets that disagree (`FIXES_LOG.md` 108).
  `--omega-line` is undefined outside `index.html` — read it with a fallback.
- Motion respects `prefers-reduced-motion`.

Every change here was verified before shipping by rendering an isolated
test harness (all the shared classes, plus raw unclassed elements) through
headless Chromium — not just `node --check` on the syntax.

### 4.2 Ω-HORIZON extension layer

A third layer in the same `bg.js` stylesheet (search `Ω-HORIZON`): motion
and elevation tokens, hover elevation, focus bloom, `.omg-ring`, a
`.btn-gold` sweep, scroll parallax. Its constraints, and the
animation-beats-declaration trap it hit, are in `FIXES_LOG.md`.

## 5. Backend / data model

- **Auth & authorization:** Supabase Auth for identity; RLS policies on
  every table for authorization. `public.is_platform_owner()` is the
  recurring helper used to grant the owner elevated read/write on
  otherwise member-scoped tables. CI fails if any table lacks RLS
  (`scripts/audit.py`, check 4) and if a `service_role` key ever appears
  in client-shipped code (`ci.yml`, step 5) — treat both as invariants,
  not suggestions.
- **Schema management: `supabase/migrations/` is authoritative; the flat
  `supabase/*.sql` bag is reference material.** This file said the opposite until
  2026-09-05, and the contradiction with `migrations/README.md:69` made
  `migration-consistency` fail every PR. Production settled it: the live
  `supabase_migrations.schema_migrations` ledger matches `migrations/` file for
  file (**171** on 2026-09-05, `0001` .. `20260905211725`). The flat bag
  has no ledger and is applied by hand, so **schema declared only there never
  deploys** — the one asymmetry the gate now checks (`FIXES_LOG.md` 99). New
  schema goes in a **new** timestamped migration; never renumber or rewrite an
  applied one (`README.md:60`), and `apply_migration` writes a remote row with no
  local file, so add both plus `remote-migrations.json` in the same change.
  **The sequence is still not fresh-appliable, but only by ordering now**:
  `20260819071913` does an unguarded `ALTER POLICY … ON
  public.council_deliberations` and sorts *before* `20260905211725`, which is
  what finally creates that table and `advertisements` — both transcribed from
  live, so a fresh apply reproduces production (`FIXES_LOG.md` 102) — so use it
  for scratch/staging with that caveat, and for
  production use the individually live-verified files. A migration is also not
  proof of live state: `task_completions` (live `id bigint` + `axis`/`increment`)
  matches none of its 3 competing definitions in the bag. Duplicate-definition
  list: `REPOSITORY_AUDIT.md` §4; derive counts from `evidence-audit.py`.
- **Feature flags:** `public.platform_settings` is the flag store (e.g.
  `tokens_enabled`, currently `false`). Anything not yet legally/
  operationally ready should ship dormant behind a flag here, matching
  the existing pattern in `supabase/omega_tokens.sql` — don't ship a new
  feature "live" if it isn't actually ready for members to use.
- **Payments:** real Stripe integration (`supabase/functions/checkout`,
  `supabase/functions/stripe-webhook`). Any change touching payment code
  needs the same care as production payment code anywhere — this isn't a
  toy.
- **AI:** `supabase/functions/concierge` calls the Anthropic API
  server-side (key lives in Supabase secrets, never client code) to back
  the in-app copilot (`omega-copilot.js`, `chatbot.html`).

## 6. The "12 agents" / brand system

`omega-agents.json` defines 12 personas (Sentinel, Merchant, Scout, Warden,
Sovereign, Auditor, Proxy, Oracle, Beacon, Analyst, Tutor, Historian), each
mapped to a zodiac sign, element, and Greek god, each owning a domain
(security, commerce, discovery, family/privacy, governance, validation,
execution, prediction, onboarding, finance, education, archive). This is
the platform's UI/UX personality system — it's how the in-app copilot and
nav sections are named and voiced — not a technical multi-agent runtime.
When adding a feature, "which agent does this belong to" is really "which
domain/nav-section does this belong to" (see `nav.js`'s `PS` mapping);
treat it as an information-architecture decision.

## 7. CI — what's enforced automatically

`.github/workflows/ci.yml` runs on every push/PR to `main`:

1. `node --check` on every root `.js` file (syntax; catches the
   single-point-of-failure risk in `bg.js`).
2. `python3 scripts/audit.py` — module graph integrity, RLS coverage,
   duplicate-table warnings, dead-file/oversized-asset warnings.
3. Prettier + ESLint (non-blocking, reports drift only).
4. Broken local asset reference check (every `src=`/`href=` in every page
   must resolve to a file that exists).
5. `service_role`/`SUPABASE_SERVICE` scan across client code (blocking).
6. **Nothing type- or syntax-checks the Edge Functions.** This line used to
   claim `deno check` ran here; a grep of `.github/workflows/` and
   `ci-local.sh` for `deno` returns **zero** hits. Their only automated
   coverage is `resilience-audit.py`'s import-pin rules. Parse them with
   `npx typescript@5` in a scratchpad before deploying (see `FIXES_LOG.md`).
7. `sw.js` precache list vs. actual files (blocking).
8. `manifest.json` icon paths vs. actual files (blocking).
9. `python3 scripts/i18n-contract.py` (blocking) — every `i18n/*.json` parses,
   every static `data-i18n` key resolves in `T_EN`, no pack key `T_EN` lacks,
   no HTML entity in any value (they render literally; every write path is
   textual). Translation *coverage* is reported, not blocked — a missing pack
   key falls back to English by design — but it cannot silently regress either:
   `omega-registry.py` commits each pack's key count to the census, so a loss
   is drift and fails `--check`.

Anything you add should keep this pipeline green. If you add a new
`omega-*.js` module, make sure it's actually referenced somewhere (`bg.js`
injection or a `<script>` tag) — `audit.py` will otherwise flag it as an
orphaned file.

## 8. Known debt and the bug classes that keep recurring (full history: `FIXES_LOG.md`)

The full, evidence-cited history of every bug found and fixed in this repo
lives in **`FIXES_LOG.md`** — 89 entries, each citing the file:line, command
output, or query result behind its claim. It was moved out of this file
verbatim (see that file's own header for the measurements: it was 88% of
CLAUDE.md, ~60,700 of ~68,900 tokens, loaded into every session before any
work began). **Search `FIXES_LOG.md` before concluding a bug is new** — most
bug classes here have recurred, and the prior entry usually names the root
cause and how it was verified.

What follows is the part that stays load-bearing for a session starting work.

### 8.1 The recurring bug classes — check these first

Every one of these produced multiple real, separately-discovered bugs. They
are listed in rough order of how often they have recurred.

1. **A write that silently does nothing while the UI reports success.** The
   single most repeated root cause in this repo. Supabase resolves to
   `{data:null,error}` — it does **not** throw — so a `try/catch` around a
   `.from()`/`.rpc()` call catches nothing, and a fallback written on the
   assumption that it throws never runs. See §9's rule; it is non-negotiable.
2. **A column name that does not exist.** PostgREST rejects the *entire*
   query or write when any single column is unknown, so one wrong name empties
   a whole page with no visible error. Recurring wrong names, all now swept:
   `zodiac_sign`→`sign`, `full_name`→`display_name`, `agent_name`→`agent`,
   `created_at`→`occurred_at` on event tables. `scripts/schema-dictionary.py`
   gates this in CI against `supabase/live-schema.json` — a dated snapshot of
   the real schema, folded in additively. Regenerate it whenever schema is
   applied live; a stale snapshot re-opens the false positives (see its README).
3. **Measuring an element before the approval guard reveals it.** §3's guard
   hides `#app`/`.shell`/`main.main` until the profile is approved, and that
   reveal fires **no resize event**. Anything reading `offsetWidth`/
   `offsetHeight`/`getBoundingClientRect` at `DOMContentLoaded` reads 0. A
   canvas sized that way gets a zero drawing buffer and can never paint. Use a
   `ResizeObserver`, or check for an already-set value before overriding.
4. **A global that only one page ever assigns.** Two shapes. (a) A function
   declared inside `<script type="module">` but called from an inline `onclick=`
   is not global, so the click throws `ReferenceError` silently; `window.fn = fn`.
   Swept to 0. (b) **A shared accessor that nothing publishes.**
   `window.OmegaSupabase` was read by 11 files and assigned by one
   (`graphify.html:168`), so the knowledge-graph and council features never
   initialised — `graph-admin.html:83` re-polled every 100ms forever. `bg.js`
   now publishes it from `OmegaSB.get()`; the same shape broke
   `omega-hercules.js`, which guarded on `window.sb`. **Grep a `window.*`
   accessor's assignment, not just its readers.**
5. **An injection guard that discards, or that two modules share.** Two
   shapes. (a) `if (document.body) document.body.appendChild(x)` drops the work
   entirely when body does not exist yet; `bg.js` now routes every injection
   through `__omegaAppend()`, which queues to `DOMContentLoaded`. (b) **Two
   modules behind one `data-omega-*` attribute.** `omega-emblems-catalog.js`
   (bg.js:90) and `omega-emblems.js` (bg.js:611) both used
   `data-omega-emblems`, so the first to run permanently satisfied the
   second's guard and the second never loaded on any page — invisible to
   `audit.py` (the injection exists in source) and disguised by near-identical
   exports (`OmegaEmblems` vs `OmegaEmblem`). **A guard
   attribute is the module's identity, not the feature area's.**
6. **A privilege and a policy that do not meet.** Three faces of one class:
   (a) Postgres grants `EXECUTE` to `PUBLIC` automatically on
   `CREATE FUNCTION`, so a narrowing `GRANT ... TO authenticated` is decorative
   unless the default is revoked first. (b) An RLS policy with
   `WITH CHECK(true)` on a table that has a `user_id` column is almost always a
   spoofing gap. (c) **The reverse, and the most expensive one found so far: a
   correct RLS policy on a table with no table-level `GRANT` at all.** A GRANT
   is checked *before* row security, so the policy never runs and every query
   fails with `42501 permission denied` — 60 tables were in this state, 22 of
   them queried by live client code. Check grants and policies together; either
   one alone tells you nothing.
7. **An upsert whose conflict target matches no unique index.** Two shapes,
   both silent. `onConflict` naming columns with no matching unique index
   raises `42P10` and the statement never runs; *omitting* `onConflict` on a
   table that has a non-PK unique constraint is worse, because PostgREST then
   defaults to the primary key — and if the payload does not carry it, the
   write succeeds once and raises `23505` forever after, so the feature freezes
   at its first value. Four places had this. `scripts/upsert-conflict-check.py`
   gates it, but only against the SQL bag: a constraint the bag declares and
   live lacks (`ai_memory`) is invisible to it.
8. **Two divergent copies of one canonical table.** The 12 signs/elements/gods
   and the 12 labors were each duplicated across many files and had drifted;
   in the worst case the live onboarding flow assigned the wrong god and agent
   to 9 of 12 signs. Read from the one module that owns the data.
9. **Fabricated data rendered as fact.** `hercules.html` drew
   `Math.random() * 100` as the member's own progress. Worse than a false
   success toast. If the data model records completion, show completion — do
   not invent a percentage it cannot support. **Recurred on money**:
   `ad-network.html` rendered "TOTAL REVENUE $0.10 / CREATOR SHARE $0.07" from
   `REVENUE.total += 0.05` per specimen-ad paint, under "Creators earn 70%
   revenue share". `scripts/commerce-contract.py` gates both shapes (blocking).
   §9's dormancy rule had no shared implementation until `omega-flags.js` /
   `data-omega-flag` — so it depended on memory, and memory failed.
10. **An attribute value the parser never received.** An unquoted value ends at
   the first space, and a curly quote is not a delimiter at all — so
   `class=tab-pane active` gives class `"tab-pane"` plus a stray `active`, and
   three pages rendered **blank** because `.tab-pane.active` never matched. 294
   such sites on 8 pages, plus 171 unstyled badges from `class=”page-badge`.
   Detect it in a render, never a grep: an attribute whose value is `""` and
   which is not a real valueless attribute. **DOM presence is not visibility** —
   `querySelectorAll` happily counts 171 rows inside a `display:none` panel.

### 8.2 What is genuinely open

**The full list lives in `GAP_ANALYSIS.md` §S** — ~19 standing items, each with the reason it
is open and the evidence behind it (dormant payment/token tables, the ~83-table SaaS scaffold,
39 tables with policies and no grant, `storage.objects` DELETE, member location, LFS debt,
`OmegaGuardian`'s unemitted signals, the advisor counts, and the rest). It moved there on
2026-09-05 because this file is capped at 16,000 tokens and §8.2 had reached the cap: the only
way to add a fact was to compress an older one, and that had begun costing information. Consult
it when you touch one of those areas.

Only what changes what you do in the **first minutes** stays here:

- **Live Supabase access works from this session type.** `mcp__Supabase__*` against project
  `ydqhzvvoyufiiqvzcjns` executes SQL, applies migrations and reads advisors — verified
  2026-09-05, despite a harness banner that says authorization is required. **Try the call
  before reporting it blocked.** Several sessions wrongly recorded this as unavailable and
  deferred real work; `GAP_ANALYSIS.md`'s header said no session had ever held credentials.
  With it you can settle live what no scan can (§8.4's impersonation test), and you are then
  responsible for regenerating `supabase/live-schema.json` in the same change.
- **A dated snapshot lies in both directions.** `live-schema.json` at 2026-08-29 called 8
  relations "declared but absent live"; one had existed all along — a false positive purely
  from staleness. Regenerate before trusting a finding built on it.
- **The Vercel integration merges estate-wide PRs that leave `main` red** — twice in one hour
  (#250, #252), each adding `omega-*.js` modules and a script tag to ~193 pages without
  regenerating the census. Remedy: `python3 scripts/omega-registry.py`. Never auto-commit it in
  CI — that gate is the only one here that notices a third party editing the estate.
- **Once a PR is open, its head is frozen — never amend or force-push it.** GitHub merges
  the head it had when it computed the merge, so a force-push loses exactly what an extra
  trailing commit does. Measured twice: four PRs lost their trailing commit, then #267 merged
  as `df6fa6c2` while an amend to `0ae2f7a2` was in flight and the fix did not land
  (`FIXES_LOG.md` 93a). Follow-up work is a **new** commit on a branch restarted from the
  merged `main`, in a **new** PR. Always confirm with
  `git merge-base --is-ancestor <sha> origin/main`, never from a merge notification.
- **Production 404s because NOTHING PROMOTES IT, and two gates go green anyway.** Measured via
  the Vercel MCP 2026-09-06 (`FIXES_LOG.md` 107): the newest `target:production` deployment
  serves **200 with the full index.html** at its own URL, while the production alias serves a
  **404** with `age: 68498`. The build is fine; the alias is stale. `vercel-production.yml`'s
  `deploy` job is **skipped on every run** (`ready=false`, no `VERCEL_TOKEN`) and
  `vercel.json` sets `git.deploymentEnabled {"*": false}` — so no promotion path is active.
  Only `VERCEL_TOKEN` is still needed; org/project ids now default in the workflow. Also
  `ssoProtection=all_except_custom_domains`: `*.vercel.app` returns **401** to anonymous curl
  while the custom domain returns **404** — two failures that look like one. Read a deployment
  URL with `web_fetch_vercel_url`, never curl. `Production Surface Verification` stays green by
  design and marks the outage with `::warning::` (105) — **a green board does not mean the site
  is up**.
- **Vercel BUILDS; it no longer serves the repo root.** `scripts/vercel-build.sh` copies the
  web surface into `public/` from a fixed directory allow-list, so a top-level directory not on
  it is absent from production — that already cost `/vendor/supabase-js.js` on 127 pages while
  printing `VERCEL_BUILD=PASS` (`FIXES_LOG.md` 97). **Add any new web directory to that list**;
  never commit `public/`. The *Framework Settings Override* notice is expected.
- **The self-hosted Windows runner is DEAD; `queued` on it means never.** This bullet called
  `queued` normal draining. Measured 2026-09-05: `runner-probe.yml`, whose only job is to prove
  that runner works, had sat `queued` since 08:12 with no run starting, and the two blocking
  gates pinned to it had **never once reached a conclusion** (`FIXES_LOG.md` 106). Both now use
  `ubuntu-latest`; `page-overlap-audit.yml` and `runner-probe.yml` are still pinned and still
  never run. **A pending check is not a passing one** — read `status`, not just `conclusion`.
  `./scripts/ci-local.sh` runs every blocking step locally; `.githooks/pre-push` runs it on push
  (`git config core.hooksPath .githooks`, bypass `--no-verify`).

### 8.3 Current verification baseline

Compare against these, not against numbers quoted inside older `FIXES_LOG.md`
entries (which were accurate when written):

| check | current baseline |
|---|---|
| `python3 scripts/audit.py` | 0 critical / **7** warnings |
| `python3 -m unittest discover -s scripts/tests` | **265** tests, all passing |
| `python3 -m unittest discover -s tests` | **23** tests — the Ω Intelligence Fabric's own; `ci.yml` and `ci-local.sh` both discover this directory |
| `python3 scripts/omega_fabric_audit.py` | `VERIFIED=8 UNVERIFIED=1`, 12 agents, 60 governed skills; RND-01 stays UNVERIFIED without a browser **by design** |
| `python3 scripts/check-inline-js.py` | clean |
| `python3 scripts/schema-dictionary.py` | **0** findings (the `map.html` gap was fixed in `3f8a17d7`) |
| `python3 scripts/context-budget.py` | PASS — CLAUDE.md is at its 16,000-token budget, so a new paragraph means trimming an old one. `.gitattributes` pins LF (`core.autocrlf` inflated it ~250 tokens on Windows) |
| `python3 scripts/upsert-conflict-check.py` | 0 findings |
| `python3 scripts/rls-auditor.py` | 0 findings, exit 0 (was 39 CRITICAL, blocking every PR; the live database had none of them — `FIXES_LOG.md` 93) |
| `python3 scripts/silent-failure-detector.py` | 0 findings, exit 0 (was **51**; 42 were scanner noise and 9 were real §8.1 class 1 bugs, all fixed — `FIXES_LOG.md` 94) |
| `python3 scripts/i18n-contract.py` | 0 violations; all 6 packs at 100% of `T_EN` |
| `python3 scripts/omega-registry.py --check` | matches the repo |
| `python3 scripts/capability-audit.py --check` | 15 capabilities, each with a complete six-part `contract` (§10's registry); **0** still `BLOCKED` live |
| `python3 scripts/release-gate.py` | PASSED |
| `node scripts/verify-runtime.js` | PASS on the 13 capability entrypoints (headless; `SKIPPED` without a browser — see the `runtime-verify` skill). **Also gates text contrast**: blocking under 3:1, advisory 3–4.5:1 |
| `python3 scripts/commerce-contract.py` | 0 findings |
| `python3 scripts/brand-glyph-check.py` | 0 findings; scans literal, HTML-entity and JS-escape forms |
| `python3 scripts/reachability-contract.py` | 0 unreachable |
| `python3 scripts/evidence-audit.py --summary` | 95 BUILT / 27 PARTIAL / 45 LOCAL_ONLY / 18 STATIC / 2 BROKEN / 2 UNREACHABLE (189 pages); **0 declared relations absent live**, and **120** declared (see §8.4 on the phantom 121st) |
| `./scripts/ci-local.sh` | **23** blocking checks, all passing (`contract-suite.py` holds **17** gates). **Its non-blocking tail is not advisory** — those **seven** audits block on GitHub and are all green. It mirrored only five until `migration-history-contract` and `supabase-migration-security-audit` were added, and both were failing unsatisfiably: mirror every blocking gate, from every workflow (`FIXES_LOG.md` 93, 94, 102, 103, 104) |
| `python3 scripts/resilience-audit.py` | 0 findings; 1 warning (the single CI runner) |
| broken asset references | 0 |
| service-role key scan | clean |

### 8.4 Method notes that save a session real time

- **Stub `esm.sh` before any browser scan, or the results are worthless.**
  Gated pages import the client at the top of a module script; the sandbox
  blocks that host, and a failed top-level import runs *none* of that module's
  code — so every `window.`-exposed function reports missing. A scan once
  reported 44 broken pages this way; the real number was 6.
  `.claude/skills/verify-in-browser/` handles it.
- **A signed-in stub needs `terms_accepted: true`**, or `bg.js:1002` redirects to
  `terms.html` and the page never renders.
- **Verify a "0 findings" result is real.** A stopped static server reports 0; so
  does a regex damaged in transit (a rule moved out of a template literal kept
  doubled backslashes, matched no digits, reported a serene zero). Cross-check
  with a run that must find something.
- **`git show <rev>:<file>` to pin a real BEFORE**, not `git stash` — once the
  change is committed there is nothing to stash and the "before" run silently
  executes the fixed code. Serve pinned files with the content type matching
  their extension, or an `.html` served as `text/javascript` makes every
  element report absent, which looks exactly like a dramatic improvement.
- **Test RLS by impersonating a real member, in-database.** `execute_sql`
  through the Supabase MCP runs privileged, so it proves nothing about what a
  member can see. `set_config('role','authenticated',true)` plus
  `set_config('request.jwt.claims', json_build_object('sub', <uuid>, 'role',
  'authenticated')::text, true)` reproduces exactly what PostgREST does, and is
  what surfaced the missing-GRANT class above. Always compare the non-owner
  count against the privileged count — equal counts on a table that should be
  scoped is the finding.
- **Classifying a policy by substring is not reading it.** A qual containing
  `is_platform_owner` was labelled "owner-only" by a first-pass classifier and
  turned out to be `is_platform_owner() OR status = 'active'` — a second branch
  that makes rows member-visible. The classifier's own false-positive pass is
  what caught it, but only because the result was checked against real row
  counts rather than trusted. Read the full `qual` before acting on a label.
- **A shallow clone answers `git log -1 -- <path>` with the graft boundary; it does
  not fail.** At `--depth 1` every file dates to the clone itself, so any per-file
  date derived that way is a guess. `actions/checkout@v4` is shallow by default,
  which made `omega-registry.py --check` a guaranteed CI failure and had already
  put three wrong dates in the committed registry. The generator now checks the
  SHA against `.git/shallow` and refuses rather than writing a date it cannot
  know; `ci.yml` sets `fetch-depth: 0`. Detect the boundary, not the shallowness.
- **A browser check that reuses one context measures the wrong baseline.** `i18n.js`
  auto-applies `localStorage['omega_lang']`, and `localStorage` survives
  `page.goto()` within an origin — so a loop that snapshots "English", switches
  language, then moves on compares against the *previous* iteration's choice. The
  first such run happened to be right; the re-run with a fresh context per (page,
  language) is what measured it. Any state the code under test persists — theme,
  language, a dismissed banner — needs a fresh context, not a fresh `goto`. The
  harness also defaults to a **signed-in** stub, and a public auth page redirects
  a signed-in visitor away, so its buttons report absent: use
  `launch({signedIn:false})` for `account`/`reset`/`terms`/`enter`.
- **A visual change needs a noise floor before it means anything.** A
  before/after screenshot diff here reads ~1.6% of pixels as "changed" with *no
  change at all* — the particle canvas and drift keyframes never settle. A
  design layer measured at 0.66–2.21% was inside that noise and invisible at
  rest, which no computed-style check would reveal: every rule *applied*, all of
  it behind `:hover`, `:focus-visible` or scroll. Diff same-build pairs first.
  Decoding PNGs needs no PIL — draw them to a canvas in the running Chromium and
  read `getImageData`.
- **A pseudo whose box paints but whose text never does is
  `-webkit-text-fill-color`, not `content`.** `bg.js:1290` adds `.ofx-sheen` to
  every childless `.sechead` under 48 chars, filling heading text via
  `background-clip:text` + `-webkit-text-fill-color:transparent`, which
  **inherits into pseudo-elements**. Borders are not text fill, so a `::before`
  ring drew perfectly with nothing inside it. Generated text on a sheened
  element needs its own `-webkit-text-fill-color`.
- **A gate that asserts a rewrite exists cannot observe whether it fires.**
  The site's front door was a lone `vercel.json` rewrite `{"source":"/"}` with no
  `index.html` behind it, and it served **404 in production** while the same
  response carried this repo's CSP and HSTS headers — the file was read, the
  rewrite was not applied. `user-journey-contract.py` had passed throughout by
  checking the rewrite's presence. Routing evidence is a **filesystem** entry or
  a real fetch, never a config line; `omega_fabric_audit.py`'s SRC-01 now holds
  both halves (index present, and no `/` rewrite left to shadow it).
- **A snapshot's date is not its freshness, and a scanner that finds less is not
  more correct.** `supabase/live-schema.json` was stamped with the current day and
  was already one relation behind live (216 vs 217) — it was taken at 01:36 and
  the table landed after. In the same pass `evidence-audit.py` was reporting a
  relation named **`as`**, captured by `create\s+table\s+([a-z0-9_]+)` from
  inside the literal `command_tag in ('CREATE TABLE','CREATE TABLE AS',…)`. Its
  comment-stripper already existed for exactly this class; string literals were
  the half nobody had closed. Both are fixed, but the transferable rule is the
  check that followed: declared relations fell 121 → 120, so the run named the
  one relation that disappeared and re-asserted five real ones (including a
  *view*) before the smaller number was believed.
- **A repo-wide grep is a candidate generator, not a verdict.** Confident
  source-grep findings (`theme-color` missing on 121 pages, 131 unreplaced
  `outline:none`) were false — the runtime showed 172/173 fine, since `bg.js`
  injects them.
- **A scanner needs its own false-positive pass before its number means
  anything.** A fixed-widget collision scan reported 177/178 pages by counting
  full-viewport backdrops (`omega-fx`, the particle canvas, the noise overlay)
  as colliding with everything. Excluding `pointer-events:none` and full-bleed
  elements gave the same number for entirely different, genuine reasons. Right
  by luck is not measured.
- **A programmatic edit inside `bg.js`'s injected stylesheet can silently
  no-op.** That CSS is one single-quoted JS string, and its section headers use
  real box-drawing characters (`──`), not escapes — so a `replace()` written
  against `\u2500` matches nothing and returns the string unchanged. Assert the
  match count before replacing, then confirm the rule applies *in a render*:
  a rule that reached the file but not the cascade reports `z-index:auto` and
  0 background layers at runtime while looking correct in the diff.
- **"Built" is three different claims, so measure which one you mean.**
  `scripts/evidence-audit.py` classifies every page by what the repo can prove
  and writes `EVIDENCE_MATRIX.md` (report-only; `--strict` gates). It now also
  runs a **live-schema cross-check**: relations `supabase/` declares that
  `supabase/live-schema.json` lacks. Absent *and read by a page* is a silent
  empty state and fails `--strict`; absent and unread is a dormant backend and
  never gates. That snapshot is **dated, not a connection**, and a stale one
  produces false findings in *both* directions (§8.2) — but sessions have live
  access, so regenerate it in the same change rather than reasoning around it.
  Columns, `GRANT`s and policies still are not checked by the matrix, and each
  has been a real shipped bug (§8.1 classes 2 and 6).
- **A number in member-visible *copy* drifts too — and your own fix can stale
  it.** Six pages asserted a page count to the member; every one was wrong
  against the real 189, and `settings.html`'s "48 pages keep what you enter in
  this browser only" went stale *because* wiring three pages to Postgres moved
  them out of LOCAL_ONLY. `scripts/page-count-claims.py` gates it and found two
  more than a hand-grep did — the grep missed `170 PAGES` in caps. A
  `data-i18n` string also lives in `i18n.js`'s `T_EN` **and** all six packs;
  fixing only the HTML leaves five translations lying.
- **A number stored in prose drifts; derive it instead.** Every hand-typed count
  describing this repo — skills, `.html` pages (~250 vs 178), bg.js coverage,
  module size — had gone stale, and one (`grill-me-codex`'s missing frontmatter)
  had silently broken skill discovery. Re-derive before quoting:
  `python3 scripts/omega-registry.py --check` regenerates the census and fails on
  drift. A fact that is a *number* belongs in the generator, not a paragraph.
- **Ask a script what it does before reading it.** Every `scripts/*.py`
  answers `--help` with its docstring and exits 0 — claimed here while **21 of
  47 ignored it**, running the whole job instead (one never returned). It was
  enforced per-script, so a script with no test went unchecked;
  `test_script_help_contract.py` now sweeps all of them, with a planted
  violator.
- **External repo research is partly blocked at the egress proxy.**
  `raw.githubusercontent.com` returns 200, so named files (`README.md`,
  `template/SKILL.md`) are fetchable — but `api.github.com/repos/...`,
  `github.com` HTML and `codeload` tarballs are all **403**, and `agentskills.io`
  is blocked outright. So stars, contributor counts, commit recency and
  dependency-tree security **cannot be measured** in this environment, and a repo
  cannot be cloned or its tree listed. Do not present those dimensions as
  assessed; `OMEGA_EXTERNAL_ECOSYSTEM_AUDIT.md` marks them NOT VERIFIED. Also:
  the file tree cannot be enumerated, so a path guess that 404s means nothing.
- **Per-session context cost is gated.** `scripts/context-budget.py` is blocking
  in CI; `.claude/skills/context-budget/` says where new documentation belongs
  and how to read this repo's very large files cheaply (`FIXES_LOG.md`,
  `profile.html`, `bg.js` each cost more in one read than the whole auto-loaded
  context).
- **Presentation is measured in a render, never reasoned from the codepoint.**
  A grep over-reports (✓ ★ ☰ ✦ ⚔ are pure typography) and under-reports — the
  twelve zodiac signs are ordinary BMP symbols that default to *emoji*
  presentation, so the platform's own sign system shipped as colour stickers.
  Draw each candidate white-on-black to a canvas in the harness Chromium and
  read the pixels back: channel spread means a colour glyph, and U+FE0E fixes
  the BMP ones in place. `scripts/brand-glyph-check.py` gates it, and must scan
  all three encodings — literal, `&#127805;`, `'\u{1F311}'` — since every one
  decodes before paint; it flags only the emoji sub-ranges, because Alchemical,
  Chess and Geometric-Extended sit in the same span and are monochrome type.
- **Runtime verification is automated — use it before claiming a UI or
  data-layer change works.** `node scripts/verify-runtime.js` renders the
  capability entrypoints headless and asserts load / approval-guard-lifts /
  no-throw / no-overflow / no-dup-id plus an advisory a11y pass; `--all` sweeps
  every page. It stubs Supabase, so it proves the client is wired, never
  production RLS. **A `SKIPPED` is usually a browser *layout* mismatch, not a
  missing browser** — the `runtime-verify` skill has the symlink fix and the
  `OMEGA_SCRATCHPAD` variable it needs. Do not substitute an ad-hoc harness:
  this one asserts the §10 capability contracts.


## 9. Working in this repo — practical rules

- Don't introduce a build step or framework migration without discussing
  it first — "no build step" is a deliberate, load-bearing property of
  this deploy (`vercel.json`, CI's syntax-only checks).
- Don't write a new page without loading `bg.js` and `nav.js` the way
  existing pages do, and without adding it to `nav.js`'s `PS` map and the
  relevant `SECTIONS` entry — otherwise it's unreachable from navigation
  (and `audit.py` treats unreachable-but-deployed files as a warning).
- Don't touch RLS policies without keeping `is_platform_owner()` semantics
  intact and without running `scripts/audit.py` before pushing.
- Don't ship a new monetizable or legally-sensitive feature (tokens,
  payments, data-sharing) as "live" — gate it behind
  `public.platform_settings` the way `tokens_enabled` already does, and
  keep any user-facing copy about it in future tense until it's actually
  on.
- Secrets (`STRIPE_*`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`) are set via
  `supabase secrets set`, never committed. Run `scripts/check-secrets.sh`
  before deploying Edge Function changes.
- Keep `FIXES_LOG.md`, `REPOSITORY_AUDIT.md`, `CAPABILITY_INVENTORY.md`,
  `GAP_ANALYSIS.md`, and `OMEGA_TAXONOMY.md` current as part of the same
  change, not a
  followup: adding/removing a page, module, table, RPC, or Edge Function;
  fixing or discovering a gap; applying pending SQL to a live database; or
  resolving/adding a term in the taxonomy's pending-terminology list all
  mean one of these five is now stale. Update the specific section that
  changed rather than rewriting the file. **A fixed bug's evidence-cited
  entry goes in `FIXES_LOG.md`, appended at the end — not in §8**, which
  stays short on purpose: it is loaded into every session, and it was 88% of
  this file before the split. Add to §8 only when the fix changes a
  *standing* fact: a new recurring bug class (§8.1), an item opening or
  closing (§8.2), a moved baseline number (§8.3), or a method note that
  would save the next session real time (§8.4). Every claim in all five
  stays evidence-cited (a file:line, a command's actual output, a query
  result) — never mark something fixed, applied, or verified unless it
  actually was in that session; an unmarked/unverified item should stay
  that way rather than be upgraded on assumption. This is how
  `REPO_AUDIT.md`'s counts drifted stale before `REPOSITORY_AUDIT.md`
  replaced them — don't repeat it.
- **Never show a success state without checking the write's actual result
  first.** This is the single most repeated root cause of real bugs found
  in this repo's history (§8.1 bug class 1; `FIXES_LOG.md`: `extend_trial`, `complete_task`,
  `member_presence`, onboarding, the GDPR export, the activity ticker, the
  dispatch fallback — each one silently did nothing while the UI reported
  success). Every new `sb.from(...)`/`sb.rpc(...)` call that isn't a pure
  read must check `.error` (Supabase resolves to `{data:null,error}`, it
  does not throw) before rendering a success toast, updating in-memory
  state optimistically, or advancing a flow — the pattern already used
  correctly by `omega-onboard.js`, `social.html`, and `family.html` since
  their fixes.
- Before adopting a term, pattern, or piece of external research into this
  repo (from a proposal, a taxonomy, or a `web-trend-scout` pass), ground
  it against what's actually real here first rather than assuming a
  generic version applies — see `OMEGA_TAXONOMY.md` for the categorized
  vocabulary and its per-category "grounded in" citations. A term with no
  clear meaning in this repo's context goes into that document's pending-
  terminology list, not into a design decision.

## 10. Autonomous feature-proposal pipeline (`.claude/skills/`) — with safety gating

The skills under `.claude/skills/` (exact count and per-skill token cost in
`OMEGA_SKILL_REGISTRY.md`, generated — do not hard-code it here) fall in four
groups; `.claude/skills/README.md` is the full index:

1. **The feature-proposal pipeline** (this section) — five skills that turn
   outside research into shipped-but-dormant features on this actual
   static-HTML/Supabase stack, no framework, no build step (§§1–6).
2. **Standalone verification** — `verify-in-browser`, `runtime-verify`
   (`scripts/verify-runtime.js` + the §10-registry contracts),
   `context-budget`, `interface-guidelines`.
3. **Domain skills** — `deploy-gate`, `edge-functions`, `i18n`,
   `visual-assets`, `cinematic-media`, `image-pipeline`: reference for one
   surface, invoked when a change touches it.
4. **Vendored Supabase skills** — `supabase`, `supabase-postgres-best-practices`,
   `supabase-server`, kept in-tree because §8.1's most recurring bug class is
   Supabase-shaped.

The pipeline intentionally stops at "reviewable, dormant-by-default code on a
branch" rather than auto-deploying to subscribers, matching §9's rule against
shipping monetizable/legally-sensitive features live without an explicit
gating decision — and this repo's own history of serious bugs that shipped
silently (§8.1, and `FIXES_LOG.md` in full) is why that gating exists.

**Standard pipeline (LOW-RISK features: UI, docs, non-data changes)**:

```
web-trend-scout → feature-architect → autonomous-coder → [human review] → subscriber-portal
```

**HIGH-RISK pipeline (auth, schema, payments, RLS, new public-callable functions)**:

```
web-trend-scout → grill-me-codex [lock intent] → feature-architect → autonomous-coder → [human review] → subscriber-portal
```

**The skills**:

- `web-trend-scout` — research only, writes a grounded proposal into
  `FEATURE_IDEAS.md`. No code.
- **`grill-me-codex` (HIGH-RISK decisions only)** — forces a threat-model
  review + decision record (`PLAN.md` + `CODEX_REVIEW.md`) before any
  architecture or code, grounded in §8.1's eight failure classes (stored XSS,
  silent-failure writes, RLS gaps, column-name mismatches, module-boundary
  bugs, unguarded RPCs, races, missing edge cases). Modes and framework:
  `.claude/skills/grill-me-codex/SKILL.md`, `.claude/grill-me-codex.md`.
- `feature-architect` — planning only, turns one proposal (+ Codex approval
  if HIGH-RISK) into an exact file-by-file blueprint (page, `nav.js`
  wiring, `supabase/*.sql`, `platform_settings` flag). No code.
- `autonomous-coder` — implements the blueprint for real, verifies with
  `scripts/audit.py`/`node --check`, commits to the current branch. Never
  flips a `platform_settings` flag to `true`, never merges to `main`,
  never edits CI or touches secrets.
- `context-budget` — keeps the per-session context cost down: measures what
  every session loads before it starts, says where new documentation belongs
  so `CLAUDE.md` does not regrow, and gives cheap read recipes for this repo's
  very large files. Backed by `scripts/context-budget.py`, which runs blocking
  in CI. Invoke it when adding to any of the audit docs.
- `subscriber-portal` — exposure. Only wires a feature into real
  subscriber-facing pages (using the real `membership_tier`/
  `OmegaCanon.tierUnlocks()` system, not an invented one) once a human has
  already turned its flag on.

### 10.1 External repos and skills — what has been evaluated, and the bar

This platform is a no-build, no-framework, `noindex` membership-gated static
site with one owner. That rules out most of the public skill ecosystem, which
targets React/Next/Tailwind, npm-packaged apps, or public marketing funnels.
Adopting something because it is popular, rather than because it fits *this*
stack, adds instructions a session must read and then ignore.

**The bar**, adapted from `vercel-labs/skills`'s own `find-skills` guidance
(check install count, source reputation, and repo stars before recommending —
prefer 1K+ installs, be sceptical under 100) plus one rule this repo needs on
top: **the skill must name a mechanism that exists here.** A skill whose steps
assume a build step, a component tree, or a package manager does not become
applicable by rewriting its examples.

Evaluated so far — recorded so a future session does not re-clone and re-read
the same repositories:

| source | what it is | outcome |
|---|---|---|
| `vercel-labs/agent-skills` | React/Next/web-design skills | **2 of 9 applicable.** Its Web Interface Guidelines found the `color-scheme` bug on 173 pages. Which rules transfer is in `.claude/skills/interface-guidelines/SKILL.md` — read that, do not import the upstream list. |
| `vercel-labs/skills` → `find-skills` | wrapper over `npx skills find/add` | **Not installed** — this session already has skill discovery. Its quality-gate criteria (adopted above) were the transferable part. |
| `anthropics/claude-plugins-official` | official plugin directory, 39 plugins | **`claude-md-management` was the find** — its conciseness rubric is what prompted measuring CLAUDE.md at ~68,900 tokens per session, §8 being 88% (`FIXES_LOG.md` header). The LSP plugins target languages this repo barely has; `frontend-design` is React-oriented; `skill-creator`/`code-review`/`pr-review-toolkit` duplicate this session. |
| `krusemediallc/arcads-claude-code` | 247 files, 10 ad-production skills | **0 applicable.** Built for public paid-acquisition funnels; this platform is `noindex` and invite-gated, with no ad surface. Evaluated twice — do not re-evaluate unless what the platform is changes. |
| `anthropics/skills` | official skills + Agent Skills spec/template | **Concept adopted, nothing installed.** `template/SKILL.md` confirms `name`+`description` are the whole frontmatter contract and that a description must say *when* to use the skill — what `grill-me-codex` was missing. |
| `cursor/plugins` | 17 official Cursor plugins | **Concept adopted, 0 installed.** `cli-for-agent`'s criteria, applied to `scripts/`, found all 18 agent-facing scripts ran their job on `--help`. |
| `affaan-m/everything-claude-code` (+ 4 forks) | Claude Code config collection | **WATCH.** Stars/activity unverifiable — GitHub API is egress-blocked. |
| `vercel-labs/agent-browser`, `vercel-labs/json-render`, `deepseek-ai/deepseek-harness`, `openai/*`, `google*/*`, `cursor/cookbook`, `cporter202/ai-growth-stack` | agent harnesses, generative-UI, other SDKs, one empty repo | **0 applicable.** Each needs npm, a build step, a component tree, or a non-Anthropic runtime; `agent-browser` duplicates `verify-in-browser`. |

Full evidence, per-repo blockers, and what could not be verified this session:
**`OMEGA_EXTERNAL_ECOSYSTEM_AUDIT.md`**. Read that before re-evaluating any of
the above; the GitHub REST API, `github.com` HTML and `codeload` tarballs are all
403 at the egress proxy, so stars/activity/dependency dimensions stay
**NOT VERIFIED** until a session has API access.


## 11. Concern taxonomy / shared vocabulary (`OMEGA_TAXONOMY.md`)

`OMEGA_TAXONOMY.md` is a documentation-only reference — not a subsystem,
registry, or runtime — that organizes the broad set of engineering/research
concern-areas this project touches or might touch (prompting patterns,
security, data, AI/ML, UI, infrastructure, art) into categories, each
cross-referenced against what actually exists in this repo today. Its
purpose is narrow: give a future `FEATURE_IDEAS.md` proposal or
`web-trend-scout` research pass a category to point at instead of
re-deriving context from scratch, and give unfamiliar terminology
(commands, tool names, abbreviations encountered in a request) a place to
be recorded honestly as "undefined here" rather than guessed at.

It explicitly does **not** define a slash-command system, an AI-agent
runtime, a prompt library, or any other structure this repo doesn't
actually have — where the source material behind it assumed something
this repo lacks (MCP as a runtime dependency, vector databases, 3D
rendering), the document says so instead of building toward it. The real
equivalent of a "command registry" here is the skill pipeline in §10, with
the full generated inventory in `OMEGA_SKILL_REGISTRY.md`.
Individual categories only become real work the normal way: a
`FEATURE_IDEAS.md` proposal → `feature-architect` blueprint →
`autonomous-coder` implementation → human review — the taxonomy itself is
never a justification to build something on its own.
