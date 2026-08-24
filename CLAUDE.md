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
/                    ~250 standalone .html pages, one per feature/page.
                     Each is a full HTML document with inline <script>,
                     not a component — there is no shared page template
                     engine. Shared behavior comes from loader scripts
                     injected at runtime (see below).
bg.js                The "nervous system": injected first, loaded by every
                     page. Injects the global design-system <style> block,
                     the approval-guard CSS, and defer-loads the other
                     omega-*.js modules. If bg.js fails to parse, the
                     entire platform is down (see ci.yml comment) — 104+
                     of ~250 pages depend on it.
nav.js               Sidebar navigation: maps every page slug to a nav
                     section (COMMAND, IDENTITY, ASCEND, COSMOS, VAULT,
                     ORDER, INTEL, ...) and renders the icon dock.
omega-*.js           ~90 single-purpose modules (auth gate, AI copilot,
                     threat/telemetry, chart rendering, share cards,
                     progress tracking, PWA/service-worker registration,
                     etc.), each loaded on-demand by bg.js or by the pages
                     that need them.
omega-*.json         Static config/data: agent roster (omega-agents.json),
                     element/house tables, content catalog, canon lore.
supabase/*.sql       Backend schema. Flat directory of ~105 files, applied
                     manually/in sequence — see "Known debt" below. Not a
                     Supabase-CLI-managed migrations/ directory yet.
supabase/functions/  Edge Functions (Deno/TypeScript): checkout,
                     stripe-webhook, concierge (Anthropic API-backed
                     assistant), notify-access, intel-feed, rankings,
                     snapshot-leaderboard.
scripts/             Repo tooling: audit.py (CI-gating integrity check),
                     check-secrets.sh (verifies Edge Function secrets are
                     set before deploy), one-off migration/patch scripts.
.github/workflows/   CI: syntax check, repo audit, prettier/eslint
                     (non-blocking), broken-asset check, service-role key
                     scan, Edge Function syntax check, PWA asset checks.
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

`nav.js` separately renders the sidebar, keyed off `data-page` or the
current pathname. `bg.js` auto-injects it (guarded by `data-omega-nav`, same
pattern as the other modules) — a page only needs its own explicit
`<script src="/nav.js">` tag if it deliberately wants the sidebar to render
before `bg.js` finishes loading; the ~9 pages that still do this predate the
auto-injection and are harmless (double-injection is guarded against, not
just deduped). This auto-injection didn't exist until it was added as a bug
fix — see `FIXES_LOG.md` — after being missing for an unknown but apparently long
stretch of this repo's history; verify with a real browser render, not just
a grep for the script tag, before trusting that a "no page-level nav.js
needed" claim like this one is actually true.

**Consequence for anyone editing a page:** don't hand-roll the auth check,
the design tokens, or the sidebar. Load `bg.js` the way every other page
does, and use the existing CSS classes/tokens (`.card`, `.kpi`,
`.btn-gold`, `--gold`, `--cyan`, etc. — all defined once, in `bg.js`).

## 4. Design system (as it exists, not as a target)

Defined once, in `bg.js`'s injected `<style>` block — this *is* the
design system; there is no separate token file to keep in sync.

- Palette: `--void`/`--void2` (near-black background), `--gold`/`--solar`
  (primary accent), `--cyan` (secondary accent), `--crim` (danger/red),
  `--green`, `--purple`, `--muted`, `--ink` (text).
- Type: `--D` (Cinzel Decorative, display/headers), `--R` (Rajdhani, body),
  `--M` (Courier Prime, labels/mono/letter-spaced UI chrome).
- Layout primitives: `.shell`/`.side`/`.main` (sidebar + content), `.kpi`/
  `.kpi-row`, `.card`/`.card-grid`, `.tbl-*`, `.tab-*`, `.chip`, `.glass`/
  `.glass-cyan`, `.bar-track`/`.bar-fill`.
- Responsive breakpoints at 1200/900/700/480px, all defined in the same
  block.

If a new page needs a component not covered here, extend the shared block
in `bg.js` rather than defining page-local styles that will drift.

### 4.1 Ω-GVP extension layer

`bg.js`'s injected stylesheet has a second section below the v3 tokens
above: an additive "Glass-Vector Platform" layer (search `Ω-GVP` in
`bg.js`) that upgrades the existing shared classes rather than
replacing them — every rule targets `.card`/`.kpi`/`.kpi-card`/`.glass`/
`.glass-cyan`/`.tbl-row`/`.inp`/`.btn-*`, so it reaches all ~250 pages
through this one file with no per-page markup changes:

- **Glass shimmer + cursor-reactive light** — `.card`/`.kpi`/`.glass`
  panels get a hover shimmer sweep and a soft radial highlight that
  follows the pointer (`--mx`/`--my` custom properties, set by a single
  passive, `requestAnimationFrame`-throttled `pointermove` listener in
  bg.js — one `getBoundingClientRect()` per frame, only while hovering a
  matched element; GPU-cheap, no layout thrash).
- **Glow-edge borders** on `.card`/`.kpi-card` (gradient `border-image`
  + box-shadow glow, both **hover-only**, not static). Deliberately not
  applied to `.kpi` itself, since `.kpi` already uses a per-instance
  `--kc` custom property for its top-accent color (e.g.
  `style="--kc:var(--cyan)"`) — `.kpi` gets a matching hover glow in
  that same color instead, so the existing color-coding isn't
  overridden. The hover-only gating was a correction, not the original
  design: `border-image` always wins the border paint regardless of
  selector specificity, so a *static* version silently discarded any
  page's own per-instance border customization the moment `.card` was
  added to its markup — found while extending `.card` to more pages
  (`profile.html`, `cosmos.html`, `matrix.html`, `family.html`,
  `journal.html`) and testing each one for real, not just in the
  isolated harness: `matrix.html`'s Authority Score `.astat` sets
  `style="border-color:rgba(0,229,255,.3)"` inline to distinguish it
  from the other 3 axis cards; `family.html`'s
  `.mc.heir{border-left:3px solid var(--gold)}` marks succession heirs;
  `cosmos.html`'s `.el-card` sets a per-element colored left border via
  `c.style.cssText+=` in JS (fire/water/earth/etc.) — all three would
  have been silently overridden by a static `border-image`. Fixed by
  moving `border-image` into the existing `:hover` rule so every page's
  resting-state border stays exactly as that page intended, and the
  gradient border is a hover reward, not a default override — this also
  retroactively protects every pre-existing `.card` usage platform-wide
  (`vault.html`, `media.html`, etc.) that this session never even
  touched. `honors.html`'s `.honor-card` was never given the `.card`
  class at all — its own `::before` rule does 5-way tier color-coding
  (omega/gold/silver/bronze/cyan) which `.card`'s pre-existing v3
  `::before` top-accent bar would fully replace (`::before` can only
  render one rule's declarations, last-in-cascade wins, never merges),
  and that conflict isn't fixable by hover-gating since it's about the
  achievement badges' permanent resting-state appearance, not a hover
  effect — left on its own local styling instead.
- **Platform-wide `.card` sweep, done with a scanner, not by hand.** A
  repo-wide grep found ~230 page-local `*-card` classes across ~150
  pages (far beyond the dozen or so pages checked individually above),
  making one-by-one manual verification impractical. Wrote a scanner
  (used, not committed to the repo — logic summarized here) that
  detects the two real failure modes found by hand above:
  1. a page-local `::before`/`::after` rule on the class (would be
     silently replaced by `.card`'s own `::before`, not merged), and
  2. a per-instance border set directly on the card element itself —
     either inline (`style="border..."` on the same tag, or JS
     `el.style.border`/`el.style.cssText+=` right after the class is
     assigned) or via a same-element modifier class combo like
     `.mc.heir{border-left:...}`.
  Classes matching either were left untouched (45 classes across 44
  pages — see below). A third category — modifier classes like
  `.sel`/`.active`/`.mine`/`.unlocked`/`.vip` that set border-color as a
  persistent *state* indicator — were included rather than excluded:
  since `.card`'s border-image is hover-only (see above), a state
  modifier's border stays fully visible at rest and is only ever
  masked while *simultaneously* hovering that same element, a narrow,
  low-consequence interaction rather than a permanent loss. 187 class
  additions across 117 files were applied this way, each verified by
  regex round-trip (confirming the inserted `card` landed as a whole
  word with the rest of the string, including significant trailing
  spaces in JS concatenation like `'rule-card '+(on?'active':'paused')`,
  preserved byte-for-byte) and a full-repo `querySelector`/
  `getElementsByClassName` scan (7 exact-class-selector hits found, all
  `querySelectorAll(...).forEach(...classList...)` patterns unaffected
  by an added class). Spot-verified visually (`account.html`'s
  `.sign-card`, in addition to the pages already covered above) before
  shipping.
  **Manual-review pass completed** (a later session worked through the
  full flagged list below, class by class, checking each against the
  same two failure modes — a page-local `::before`/`::after` rule, or a
  per-instance border via inline `style=` / JS `.style.border*`/
  `.style.setProperty('--x',...)`/`.style.cssText+=` on the card element
  itself). Verified with `node --check` on every touched page's inline
  scripts, a headless-Chromium resting-state computed-style check
  confirming `.card`'s hover-only `border-image` doesn't mask any
  page's own resting border color, and `scripts/audit.py` reconfirming
  0 critical / 6 pre-existing warnings.
  - **Safe, `.card` added** (3): `evolution.html` `.gate-card` (only
    modifier-class border-color rules — `.reached`/`.current`/`.locked`
    — the same "persistent state indicator" category already established
    as safe to include, since `.card`'s border-image only ever masks it
    during a simultaneous hover); `trophies.html` `.medal-card` (same
    shape — `.earned`'s `border-left` keyed off a JS-set `--mc` custom
    property is a state indicator, not a bare per-instance override).
    Both confirmed by injecting a real element with the exact class
    string used by that page's own render code and reading
    `getComputedStyle` at rest: border-image is `none`, and the page's
    own border colors render unmasked.
  - **Already done, no action needed** (1): `wealth.html`
    `.asset-class-card` — all 4 usages already carry `class="asset-class-card
    card"` in the markup; this session's list was stale on this one
    entry specifically.
  - **Dead CSS, nothing to sweep** (1): `map.html` `.stat-card` — the
    class has exactly one occurrence repo-wide (its own `CREATE`... no,
    its own CSS rule) and is never applied to any element in the page's
    markup or JS. Adding `.card` to a selector nothing uses would be a
    no-op; left as-is rather than invented a usage.
  - **Confirmed real conflicts, left alone** (remaining ~34, same two
    failure modes as before): `academy.html` `.exam-card` (`::before` +
    a `--ec` custom-property top-accent, same `.kpi`-pattern exclusion
    reason below); `achievements.html` `.ach-card` (inline
    `style="border-color:..."` per instance); `advertising.html`
    `.tier-card` (`::before`); `agents.html` `.agent-card` (JS
    `card.style.borderLeftColor=...` on the card itself — `sovereign.html`
    doesn't exist in this repo, `sovereigns.html` does and has no
    `.agent-card` at all, so that part of the original list was stale);
    `sovereign-ai.html` `.agent-card` (its base rule itself reads
    `border-top:2px solid var(--ac,var(--gold))`, a per-instance custom
    property on every card, not a modifier — structurally the same
    pattern that got `.kpi` excluded from the glow-edge treatment
    entirely, so excluded here too rather than hover-mask it);
    `analytics.html` `.algo-card` (inline `border-top-color`, 10
    instances); `chronicle.html` `.future-card` (`::before`) and
    `.event-card` (`::before` + inline border, 17 instances);
    `city.html` `.district-card` (JS `card.style.borderLeftColor`);
    `cosmos.html` `.el-card` (the exact conflict already documented
    above — JS `cssText+=` per-element border) and `elements.html`
    `.el-card` (separately, JS `card.style.borderColor`); `dna.html`
    `.dna-card` (`::before`); `exam.html` `.q-card` (inline
    `border-left-color`) and `.exam-card` (`::before`); `family.html`
    `.sg-card` (`::before` + inline border); `feed.html` `.post-card`
    (`::before`); `gaming.html` `.g-card`/`.e-card` (both `::before`);
    `honors.html` `.phase-card` (JS `c.style.borderTopColor`);
    `intelligence.html` `.log-card` (inline `border-left-color` per
    instance, on top of its own already-safe `.type-*` modifiers);
    `investment.html` `.holding-card` (inline `border-left`); `lab.html`
    `.tech-card` (inline `border-top`); `notes.html` `.note-card`
    (inline `border-left-color`, on top of its own already-safe
    `.pinned` modifier); `oracle.html` `.reading-card` (`::before` +
    inline border); `prediction.html` `.pred-card` (JS
    `c.style.borderTopColor` + `--pc`); `projects.html` `.proj-card`
    (inline `border-left-color`, on top of its own already-safe
    `.status-*` modifiers); `publications.html` `.rec-card` (inline
    `border-top-color`, 6 instances); `queue.html` `.worker-card`
    (`::before`); `revenue.html` `.stream-card` (inline
    `border-left-color`); `series.html` `.ser-card` (`::before`);
    `social.html` `.plat-card` (JS `card.style.borderTopColor`, on top
    of its own already-safe `.connected` modifier); `sovereign-covenant.html`
    `.article-card` (`::before` — checked against `vault.html`'s
    already-merged `.article-card` specifically, since that one turned
    out to be an exact duplicate; this one isn't — it adds
    `opacity`/`transition`/a gradient background and is hover-revealed,
    a materially different rule, so it stays a real conflict, not a
    second free pass); `studio.html` `.axis-card`/`.create-card` (both
    `::before`); `triads.html` `.triad-card` (`::after`); `tribe.html`
    `.elem-card` (JS `card.style.borderColor`) and `.tribe-rank-card`
    (JS `card.style.borderTop`); `wallet.html` `.account-card` (inline
    `border-top`). (`vault.html`'s `.article-card` remains already
    reviewed and added from the earlier pass — no change here.)
- **Telemetry table utilities** (opt-in, not yet used by any page):
  `.trend.up`/`.trend.down` badges (colored, glowing, with a
  `▲`/`▼` marker), `.tbl-row.up`/`.tbl-row.down` row coloring, even-row
  zebra striping, `.sparkline` (stroke/glow styling for an inline SVG
  polyline a page renders itself). `.trend` sets `justify-self:start`
  deliberately — `.tbl-row` is `display:grid`, and without that, a
  `.trend` child stretches to fill the implicit grid track by default
  (confirmed by rendering a test harness before shipping).
- **Glass form controls**: `.inp` gets deeper blur + a focus glow ring;
  `.field` + `.field label` gives an opt-in floating-label pattern.
- **Fallback skin for genuinely bare elements**: `input:not([class])`,
  `textarea:not([class])`, `select:not([class])`, and
  `button:not([class])` get the same glass treatment as `.inp`/`.btn`,
  scoped strictly to elements with *no* `class` attribute at all, so any
  element with its own page-local class or inline `style=` (inline
  always wins the cascade regardless) is left untouched. This was
  chosen after a repo-wide audit found ~380 raw `<input>`s and dozens of
  raw `<button>`s with no shared class — hand-editing every occurrence
  across ~250 pages wasn't attempted; this reaches them all from one
  file instead. (This paragraph used to say "27 pages still use native
  `<table>` markup" — that is **stale**: a repo-wide grep now finds zero
  `<table>` elements anywhere, so the conversion is complete. See `FIXES_LOG.md`'s
  correction, including what the conversion cost in ARIA semantics.)
  Pages with page-local table classes are
  *not* addressed by the fallback skin (they already have their own
  classes, so `:not([class])` correctly skips them) and still open,
  page-by-page, structural work — not a quick CSS fix.
- **Brand webfonts now actually load.** `--D`/`--R`/`--M` reference
  Cinzel Decorative / Rajdhani / Courier Prime, but no page, stylesheet,
  or asset in this repo ever loaded them — zero `@font-face` rules, zero
  font files, zero Google Fonts links existed anywhere (confirmed by a
  repo-wide grep before writing the fix), so every page has silently
  rendered in the browser's default serif/sans-serif/monospace the
  entire time. `bg.js` now injects a Google Fonts `<link>` (plus
  `preconnect`) once per page, guarded by `#omega-fonts` so it never
  double-injects.
- **Ambient noise overlay**: a fixed, `pointer-events:none`,
  `opacity:.035` `<div id="omega-noise-overlay">`, injected by bg.js —
  deliberately a real DOM element rather than a `body::before`
  pseudo-element, since 5 pages (`cosmos.html`, `family.html`,
  `offline.html`, `reset.html`, `terms.html`) already define their own
  `body::before` and a bare-selector CSS rule would have collided with
  those.
- Motion respects `prefers-reduced-motion`.

Every change here was verified before shipping by rendering an isolated
test harness (all the shared classes, plus raw unclassed elements) through
headless Chromium — not just `node --check` on the syntax.

## 5. Backend / data model

- **Auth & authorization:** Supabase Auth for identity; RLS policies on
  every table for authorization. `public.is_platform_owner()` is the
  recurring helper used to grant the owner elevated read/write on
  otherwise member-scoped tables. CI fails if any table lacks RLS
  (`scripts/audit.py`, check 4) and if a `service_role` key ever appears
  in client-shipped code (`ci.yml`, step 5) — treat both as invariants,
  not suggestions.
- **Schema management:** currently a flat `supabase/*.sql` directory,
  mostly idempotent (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO
  NOTHING`) so re-running files is safe. `supabase/migrations/` now holds
  an ordered, Supabase-CLI-convention copy of this same content
  (`NNNN_<name>.sql`, applied via `supabase db push`) — see
  `supabase/migrations/README.md` for how the order and content were
  derived, what was deliberately excluded (a conditional `DROP TABLE`
  file, the legacy manual SQL-editor-paste bootstrap bundle, diagnostic-
  only scripts). All 94 files now apply cleanly end-to-end against a fresh
  scratch PostgreSQL 16 instance (`migrations/README.md`'s "Full 94-file
  sequence validated" entry) — but that only proves the sequence is
  internally consistent on a **blank** database, not that it matches the
  owner's actual live schema; `task_completions` is a proven
  counterexample (live `id bigint` + `axis`/`increment` columns match none
  of the 3 competing `CREATE TABLE IF NOT EXISTS` definitions in the SQL
  bag). Do not run the full `migrations/` sequence against the live
  production database expecting it to safely "catch up" existing state —
  use it for a scratch/staging project, and use the individually
  live-verified fix files (`trial_access.sql`, `migrations/0013`,
  `0089`–`0094`) for production. The flat `supabase/*.sql` bag at repo
  root is unchanged and still the source of truth for new schema changes
  — see `REPOSITORY_AUDIT.md` §4 for the still-open duplicate-table-
  definitions list (47 tables defined in more than one file; not
  deduplicated by the migrations/ work, only reordered — consolidating
  needs a per-table live-schema check, not a bulk sweep).
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
6. `deno check` on every Edge Function (non-blocking).
7. `sw.js` precache list vs. actual files (blocking).
8. `manifest.json` icon paths vs. actual files (blocking).

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
   gates this in CI now — but only against schema defined in `supabase/*.sql`.
3. **Measuring an element before the approval guard reveals it.** §3's guard
   hides `#app`/`.shell`/`main.main` until the profile is approved, and that
   reveal fires **no resize event**. Anything reading `offsetWidth`/
   `offsetHeight`/`getBoundingClientRect` at `DOMContentLoaded` reads 0. A
   canvas sized that way gets a zero drawing buffer and can never paint. Use a
   `ResizeObserver`, or check for an already-set value before overriding.
4. **A global that only one page ever assigns.** Two shapes. (a) A function
   declared inside `<script type="module">` but called from an inline
   `onclick=` — module top-level declarations are not global, so the click
   throws `ReferenceError` silently; fix with `window.fn = fn`. Swept to 0.
   (b) **A shared accessor that nothing publishes.** `window.OmegaSupabase` was
   read by 11 files and assigned by exactly one (`graphify.html:168`), so the
   entire knowledge-graph and council feature set never initialised anywhere
   else — `graph-admin.html:83` re-polled every 100ms forever. `bg.js` now
   publishes it from `OmegaSB.get()`. The same shape broke `omega-hercules.js`,
   which guarded on `window.sb`, a global nothing assigns. **Before using a
   `window.*` accessor, grep for its assignment, not just its readers.**
5. **An injection guard that discards instead of deferring.**
   `if (document.body) document.body.appendChild(x)` drops the work entirely
   when body does not exist yet. `bg.js` now routes every injection through
   `__omegaAppend()`, which queues to `DOMContentLoaded` instead.
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
   not invent a percentage it cannot support.

### 8.2 What is genuinely open — each on purpose, with a reason

Nothing below is a bug masquerading as done. Each has an explicit reason it is
open, recorded in `FIXES_LOG.md`:

- **`transactions` / `wallet_balances` tables do not exist** (queried by
  `subscriptions.html` / `vault.html`). Deliberate: payment and Ω-token
  infrastructure is dormant pending legal review, per §9's gating rule.
  `subscriptions.html`'s own copy already says so. The user was asked directly
  and chose to keep it dormant.
- **48 pages persist to `localStorage` only — not 7.** The 7 finance pages
  (`wealth`, `wallet`, `treasury`, `revenue`, `investment`, `expenses`,
  `budget`) were a decision, not a default: unusually sensitive data, hard to
  walk back once member data lives server-side, mitigated with
  `omega-local-backup.js` export/import. `scripts/evidence-audit.py` shows the
  same shape reaches 48 pages, and only 5 of them carry that export path — 43
  store member data with no server copy and no way to get it out
  (`achievements`, `notes`, `projects`, `passport`, `targets`, `mood`,
  `reading`, `workout` …). That is a scope finding, not a decision: nobody has
  chosen it for the other 41 pages. A further 24 pages are `PARTIAL` — they
  write to Postgres *and* keep a parallel `localStorage` copy. Run the scanner
  for the current list rather than quoting these numbers.
- **`.mp4` (3.7 MB) and `.docx` committed to git, no LFS.** The user was asked
  directly and chose to leave it; `.vercelignore` already keeps both out of
  the deploy, so this is hygiene debt, not a functional bug. A real fix means
  history rewrite + force-push — do not attempt without explicit permission.
- **`map.html` queries `profiles.lat/lon/gate`** — no member-location data
  exists anywhere on this platform. Building collection is a feature and
  privacy decision, not a bug fix. (`country` *is* a real live column.)
- **`ops.html`'s event-bus metrics table never renders** — it looks up
  `#evt-metrics-body`, an id that exists nowhere. Building the container means
  designing UI that was never built.
- **`OmegaGuardian.gate()` is defined but never called**, and the
  `threat_signal` event it listens for is never emitted. The topbar badge
  therefore always effectively reads 100. Not a security hole on its own
  (client-side gating was never the boundary — RLS is, §5), but the badge
  implies protection that is not happening. Wiring it is an architecture
  decision; removing the badge is a product one.
- **`omega-threat.js` is not threat detection** — it is the digital-thread
  traceability engine (`window.OmegaThread`). The filename mismatch is
  deliberate and was left alone rather than guessed at.
- **`supabase/migrations/` is validated only against a blank database.** Do not
  run the full sequence against production expecting it to catch up existing
  state — `task_completions` is a proven counterexample. The flat
  `supabase/*.sql` bag remains the source of truth for new changes.
- **Performance advisor: `unused_index` (125) and `unindexed_foreign_keys` (61
  remaining).** Both INFO-level. The "unused" signal reflects a platform with
  9 real profiles and near-zero traffic, not badly designed indexes — nearly
  every one is the `user_id` pattern every RLS policy filters on. The 61
  remaining unindexed FKs are all on the 45-table scaffold schema below.
- **~83 tables live on production that this repo's SQL never created** — a
  generic multi-tenant SaaS scaffold (LMS, billing, workspaces, calendars).
  RLS is enabled with no policies, which is the *safe* state (total lockout),
  and they are empty. Inventing policies for schema of unknown purpose would
  be fabricating behaviour. Needs a human decision: drop, adopt, or leave.
- **`platform_events` and `platform_metrics` still have `WITH CHECK(true)` on
  INSERT**, on tables that carry a `user_id`. That is the spoofing shape in
  §8.1(b): any member could insert rows attributed to anyone. `authenticated`
  is deliberately **not** granted INSERT on either, so it is currently
  unreachable — but the policy itself is still wrong and should be scoped
  before that grant is ever added.
- **`feature_flags` and `governance_policies` are readable by every approved
  member**, by pre-existing policy (`USING(true)`, and
  `is_platform_owner() OR status='active'` respectively). Both look deliberate
  — published governance policies and feature flags are meant to be visible —
  but they became *reachable* only when the missing grants were added, so they
  are recorded here rather than assumed fine. 10 governance rows are visible to
  a non-owner and all 10 are `status='active'`; no drafts leak.
- **38 tables still have RLS policies and no grant.** Not referenced by any
  client code here; most are the ~83-table scaffold below. Left locked out (the
  safe state) rather than granted on the assumption that a policy's existence
  implies it should be reachable.
- **GitHub Actions cannot assign a runner on this account.** Since 2026-08-22
  every run fails in 2–5s with `runner_id: 0`, no `steps` array, 0 billable ms
  and a completely empty check-run output — reproduced on `pull_request`,
  `push` to `main`, and `workflow_dispatch` alike, so it is not trigger- or
  branch-specific. This repo is **private on a personal account**, so Actions
  minutes draw on the account allowance; the last green run was #344 on Aug 22
  at 11:56 UTC. Nothing in the code affects it — clear it under Settings →
  Billing and licensing → Budgets and alerts. Meanwhile `./scripts/ci-local.sh`
  runs every blocking step locally, so a commit can still be verified, and
  `.githooks/pre-push` runs it automatically on every push — enable per clone
  with `git config core.hooksPath .githooks`, bypass one push with
  `git push --no-verify`.
- **`auth_leaked_password_protection`** is a Supabase Auth dashboard toggle,
  not a SQL object — `apply_migration`/`execute_sql` cannot reach it.
- **`scripts/audit.py`'s 7 warnings are all understood**, and the tool now
  reports which parts of each are real risk vs. known noise. They cannot be
  driven to 0 from source alone without live-schema verification, and forcing
  them down would trade a known-unknown for an unverified "fixed".
- **87 `omega-*.js` modules (747 KB) load on every page.** 41 expose a global
  nothing calls — but that metric is a trap: `omega-a11y.js` is one of them
  and does real work on every page. Self-activation with no caller is the norm
  here. Establishing which are genuinely page-specific is a real audit.

### 8.3 Current verification baseline

Compare against these, not against numbers quoted inside older `FIXES_LOG.md`
entries (which were accurate when written):

| check | current baseline |
|---|---|
| `python3 scripts/audit.py` | 0 critical / **7** warnings |
| `python3 -m unittest discover -s scripts/tests` | **58** tests, all passing |
| `python3 scripts/check-inline-js.py` | clean |
| `python3 scripts/schema-dictionary.py` | **4** findings, all the `map.html` gap |
| `python3 scripts/context-budget.py` | CLAUDE.md ~**13,550** approx tokens / 16,000 budget |
| `python3 scripts/upsert-conflict-check.py` | 0 findings |
| `python3 scripts/evidence-audit.py --summary` | 95 BUILT / 24 PARTIAL / 48 LOCAL_ONLY / 8 STATIC / 2 BROKEN / 1 UNREACHABLE |
| `./scripts/ci-local.sh` | all **10** blocking checks pass |
| broken asset references | 0 |
| service-role key scan | clean |

### 8.4 Method notes that save a session real time

- **Stub `esm.sh` before any browser scan, or the results are worthless.**
  Every gated page does `import{createClient}from'https://esm.sh/...'` at the
  top of a module script, the sandbox blocks that host, and a failed top-level
  import means *none* of that module's code runs — so every `window.`-exposed
  function reports as missing. A scan once reported 44 broken pages this way;
  the real number was 6. `.claude/skills/verify-in-browser/` handles this.
- **A signed-in stub needs `terms_accepted: true`**, or `bg.js:1002` redirects
  to `terms.html` and the page under test never renders.
- **Verify a "0 findings" result is real.** A scan against a stopped static
  server also reports 0. Cross-check with a scan that should find something.
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
- **A repo-wide grep is a candidate generator, not a verdict.** Several
  confident source-grep findings (missing `theme-color` on 121 pages,
  131 unreplaced `outline:none`) were false — the runtime showed 172/173 fine
  for both, because `bg.js` injects them.
- **A scanner needs its own false-positive pass before its number means
  anything.** A fixed-widget collision scan first reported 177/178 pages by
  counting full-viewport backdrops (`omega-fx`, the particle canvas, the noise
  overlay) as colliding with everything on screen. Excluding
  `pointer-events:none` and full-bleed elements gave the real answer — which
  happened to be the same number, for entirely different and genuine reasons.
  Getting the right number by luck is not the same as measuring.
- **A programmatic edit inside `bg.js`'s injected stylesheet can silently
  no-op.** That CSS is one single-quoted JS string, and its section headers use
  real box-drawing characters (`──`), not escapes — so a `replace()` written
  against `\u2500` matches nothing and returns the string unchanged. Assert the
  match count before replacing, then confirm the rule applies *in a render*:
  a rule that reached the file but not the cascade reports `z-index:auto` and
  0 background layers at runtime while looking correct in the diff.
- **"Built" is three different claims, so measure which one you mean.**
  `scripts/evidence-audit.py` classifies every page by what the repo can prove
  — reaches Postgres, keeps data in the browser, names a relation nothing
  declares, or is unreachable from `nav.js` — and writes `EVIDENCE_MATRIX.md`.
  It is deliberately report-only (`--strict` to gate). What it cannot do is the
  important half: it has no database connection, so a `BUILT` row means the
  *client* is wired and nothing more. The live table, its columns, its `GRANT`
  and its policy are all still unverified, and each has been a real shipped bug
  (§8.1 classes 2 and 6). Do not let a green matrix stand in for a live check.
- **Per-session context cost is now gated.** `scripts/context-budget.py` runs
  blocking in CI. See `.claude/skills/context-budget/` for where new
  documentation belongs and how to read this repo's very large files cheaply
  (`FIXES_LOG.md`, `profile.html`, `bg.js` each cost more in one full read than
  the entire auto-loaded context).


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

Five skills orchestrate turning outside research into shipped-but-dormant
features on this actual static-HTML/Supabase stack — no framework, no
build step, adapted to the real architecture in §§1–6. The pipeline
intentionally stops at "reviewable, dormant-by-default code on a branch"
rather than auto-deploying to subscribers, matching §9's rule against
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
- **`grill-me-codex` (HIGH-RISK decisions only)** — structured interrogation
  framework. Locks down intent by forcing explicit threat-model review and
  decision documentation before any architecture or code. Three invocation
  modes: Standard (3 rounds, structured interrogation + Codex review),
  Extended (5 rounds for complex decisions), Quick (single-shot wizard for
  low-risk features). Outputs: `PLAN.md` (decision record with threat
  analysis) + `CODEX_REVIEW.md` (audit trail of verdicts and revisions).
  See `.claude/skills/grill-me-codex/SKILL.md` for quick start, and
  `.claude/grill-me-codex.md` for full framework reference. Grounded in
  eight threat classes from this repo's own failure history (CLAUDE.md §8.1,
  with the full evidence in `FIXES_LOG.md`):
  stored XSS, silent-failure writes, RLS policy gaps, column-name
  mismatches, module-boundary bugs, unguarded RPCs, race conditions, missing
  edge cases.
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

See `.claude/skills/README.md` for the full pipeline.

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
| `vercel-labs/agent-skills` | React/Next/web-design skills | **2 of 9 applicable.** Its Web Interface Guidelines found the `color-scheme` bug affecting 173 pages. Which rules transfer and which are React-only is recorded in `.claude/skills/interface-guidelines/SKILL.md` — read that rather than importing the upstream list wholesale. |
| `vercel-labs/skills` → `find-skills` | discovery wrapper over `npx skills find/add` | **Not installed.** This session already has skill discovery. Its quality-gate criteria are adopted above; that was the transferable part. |
| `anthropics/claude-plugins-official` | official plugin directory, 39 internal + external plugins | **`claude-md-management` was the find.** Its conciseness/currency rubric is what prompted measuring CLAUDE.md, which turned out to be ~68,900 tokens loaded per session with §8 as 88% of it — see `FIXES_LOG.md`'s header. The LSP plugins target languages this repo barely has; `frontend-design` is React-oriented; `skill-creator`, `code-review` and `pr-review-toolkit` duplicate what this session already provides. |
| `krusemediallc/arcads-claude-code` | 247 files, 10 ad-production skills (UGC ads, video hooks, ad copy) | **0 applicable.** Built for public paid-acquisition funnels. This platform is `noindex, nofollow` and invite-gated — it has no ad surface to produce for. Evaluated twice; do not re-evaluate without a change in what the platform is. |
| `cporter202/ai-growth-stack` | 1 README, 0 code | **0 applicable.** Nothing to adopt. |

Marketing/course URLs (e.g. contentcreator.com's AI creator course) are
reading material, not sources of adoptable code — nothing in them maps to a
file in this repo, so they are noted and not acted on.

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
equivalent of a "command registry" here is the 4-skill pipeline in §10.
Individual categories only become real work the normal way: a
`FEATURE_IDEAS.md` proposal → `feature-architect` blueprint →
`autonomous-coder` implementation → human review — the taxonomy itself is
never a justification to build something on its own.
