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
fix — see §8 — after being missing for an unknown but apparently long
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
  file instead. 27 pages still use native `<table>` markup with
  page-local classes instead of the `.tbl-wrap`/`.tbl-row` system —
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

## 8. Known debt (see `REPOSITORY_AUDIT.md`, `GAP_ANALYSIS.md`, `CAPABILITY_INVENTORY.md` for detail)

- **No real client-side threat-detection exists, despite the security
  narrative implying it does — a naming mismatch made this hard to spot.**
  `omega-threat.js` (loaded by every page via `bg.js`) is actually the
  "digital thread" requirements-traceability engine (`window.OmegaThread`
  — REQ registry, change log, DORA metrics) — unrelated to security. There
  is no separate `omega-thread.js` on disk; a previous session already
  found this (see the comment at `bg.js` around the module-loader section)
  and left it as-is rather than guess at the fix, which was the right call
  — renaming risks breaking whatever the filename mismatch was deliberately
  worked around for, and writing a real threat-detection module from
  scratch is a feature decision, not a bug fix. Only fixed what was
  unambiguously wrong: `omega-threat.js`'s own header comment mis-identified
  itself as `omega-thread.js`, and a stale comment in `bg.js` pointed at a
  `DECISIONS.md` file that doesn't exist anywhere in this repo. Both
  corrected to state the actual situation instead of a broken pointer.
  Consequence worth knowing: `omega-guardian.js` (`window.OmegaGuardian`,
  a client-side "Zero Trust" session-scoring system with a visible score
  badge in every topbar) listens for a `threat_signal` event that is never
  emitted anywhere in the codebase — confirmed via repo-wide grep. More
  significantly, `OmegaGuardian.gate()` — the function meant to wrap and
  deny privileged actions below a risk threshold — is defined but never
  called by any page or module. No action on the platform is actually
  gated by it today; the badge always effectively reads "100" (only the
  module's own standalone 30-minute idle timer ever moves the score, and
  nothing consumes that score to deny anything). This isn't a security
  hole on its own — client-side gating was never a real security boundary
  regardless (RLS is, per §5) — but the badge visually implies active
  protection that isn't happening. Left as a documented gap rather than
  either wiring `gate()` into real actions (an architecture decision:
  which actions, at what thresholds) or removing the badge (a product
  decision), matching this file's own rule against guessing at those.
- **[Fixed, needs deploy] `extend_trial` RPC was missing — the approvals
  page's "extend" button silently did nothing.** `approvals.html`'s
  `extend(uid)` calls `sb.rpc('extend_trial',{p_uid,p_seconds:557})` to
  give a pending member +9:17 more minutes, wrapped in try/catch with a
  client-side `.update()` fallback written on the assumption that
  `sb.rpc()` throws on a missing function. It doesn't — like `.from()`,
  it resolves to `{data:null,error}` — so the fallback never ran, and the
  owner would see the "EXTENDED +9:17 MINUTES" success toast while nothing
  changed in the database. `grant_permanent_access`/`reject_member`/
  `revoke_member` (the sibling buttons on the same page) all have real
  RPCs already and are unaffected. Added
  `supabase/omega_extend_trial_fix.sql`, matching this function family's
  existing convention (`omega_access_control.sql`) exactly. **Applied to
  the live database and verified** — `scripts/verify_fixes.sql` confirmed
  `extend_trial` exists; a follow-up check confirmed it also carries the
  notification-insert from `omega_notify_triggers.sql` (see below) after
  a re-run was needed when an older copy of the function briefly won a
  run-order race against it.
- **Cross-referenced every `.from('table')`/`.rpc('fn')` call site against
  the schema; two more misses found, deliberately left undone.**
  `subscriptions.html` queries `public.transactions` (payment history) and
  `vault.html` queries `public.wallet_balances` (Ω token wallet) — neither
  table exists. Unlike `user_assets`/`extend_trial` above, these don't
  read as accidental: `subscriptions.html`'s own empty-state copy already
  says "PAYMENT ACTIVATION PENDING LEGAL REVIEW", and `wallet_balances` is
  Ω-token balance display, consistent with the token economy already
  being documented elsewhere as dormant (`platform_settings.tokens_enabled
  = false`, no tokens issued — see `sovereign-covenant.html`). Building
  either is real payment/token-infrastructure design work, not a bug fix
  — left undone pending an explicit decision, per this file's own rule
  against shipping monetizable features without gating them first.
- **`user_assets` table was missing from the live schema — fixed.**
  `portfolio.html` (SOVEREIGN ASSETS panel) and `vault.html` (NFT grid)
  both query `public.user_assets`, and portfolio.html's own copy calls it
  "the user_assets ledger... updated by mission outcomes, trade, and
  sovereign grants" — but no `CREATE TABLE` for it existed anywhere in
  `supabase/*.sql`. Supabase's JS client doesn't throw on a missing-table
  error, it returns `{data:null,error}`, and both pages silently fall back
  to their empty state — so every member's asset/NFT list has always shown
  empty, with no visible error. Added `supabase/omega_user_assets_fix.sql`
  (idempotent, RLS: read-only for `authenticated` on own rows + owner,
  matching that neither page ever writes to it directly — population is
  meant to happen server-side). **Applied to the live database and
  verified** — `scripts/verify_fixes.sql` confirmed `user_assets` now
  exists.
- **Finance pages: localStorage-only persistence — decided this session, stays
  client-side.** `wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`,
  `investment.html`, `expenses.html`, and `budget.html` persist entirely to
  `localStorage` — no Supabase table backs any of it, so balances/holdings
  don't sync across devices and are lost if browser storage is cleared. This
  is inconsistent with the rest of the platform's Supabase+RLS model, and
  with `income.html`/`ledger.html`/`contracts.html`/`portfolio.html`, which
  already persist server-side. Previously left as an open product question;
  decided this session in favor of keeping it client-side, deliberately, not
  by default: this is unusually sensitive data (net worth, income, holdings),
  converting it to server storage is a real schema-design commitment across
  7 pages that's hard to walk back once member data lives there, and this
  repo's own history this session includes multiple real RLS/security bugs
  found and fixed — "RLS protects it" isn't a settled guarantee here yet.
  Keeping data local-only is the safer default absent a specific reason to
  take on that exposure. The real downside (data loss on cleared storage or
  a new device) is mitigated instead of ignored: added `omega-local-backup.js`
  (a small, dependency-free, network-free export/import helper — writes a
  JSON file the member saves themselves, reads one back) and wired an
  "EXPORT BACKUP"/"IMPORT BACKUP" control plus a plain-language disclosure
  into all 7 pages. If server sync is wanted later, that's still a clean,
  additive, backward-compatible change — nothing here forecloses it.
- `supabase/migrations/` now exists (ordered, Supabase-CLI convention,
  content verified to match the current loose files) but is untested
  against a live database and the 47-tables-in-multiple-files redundancy
  is still unresolved — see `supabase/migrations/README.md`. The flat
  `supabase/*.sql` bag remains the working source for new changes until
  migrations/ is validated and adopted as canonical.
- ~~`sovereign-covenant.html` and `system_manifest.json` stated the token
  economy's 51%-stake / physical-reserve-backing language in the present
  tense~~ — fixed: both now carry explicit dormant/planned disclaimers
  (`sc-notice` block and per-article `PLANNED · NOT YET ACTIVE` tags in
  `sovereign-covenant.html`; `monetary_policy.status` in
  `system_manifest.json`), gated on `platform_settings.tokens_enabled`.
- `SYD-OMEGA-Legal-IP-Brief.docx` and one binary video (3.7 MB,
  `SYDOMEGA91717_DEMOD-1-.mp4`) are committed directly to git in the repo
  root. `.vercelignore` excludes `*.docx`/`*.md`/`*.pdf` from the actual
  Vercel deployment (see `.vercelignore` — it is the *only* defense, an
  earlier vercel.json redirect backup was removed for invalid syntax), so
  the docx is not live-served, but both files still bloat every clone with
  no LFS story. `.gitattributes` now marks them `-diff -text`; moving them
  to Supabase Storage/Vercel Blob and migrating to Git LFS remain open,
  non-urgent (see `REPOSITORY_AUDIT.md` §4).

- **Stored XSS in the owner's own admin panels — fixed.** `approvals.html`
  and `profile.html` (member-list views, the highest-privilege pages in the
  app) rendered `display_name`/`email` straight into `.innerHTML` with no
  escaping. `display_name` is self-updatable by any authenticated member
  (`supabase/omega_profile_fields.sql`), so any pending/approved member
  could set it to an HTML/script payload via a direct `.update()` call (no
  UI needed — the anon key is public) and have it execute in the **owner's**
  browser the next time they opened the approvals/members dashboard. Fixed
  by adding a per-page `esc()` helper (matching the convention already used
  elsewhere, e.g. `contracts.html`, `dashboard.html`) and escaping
  `display_name`/`email`/the avatar initial in both files.
- **`notifications` table was missing from the live schema — fixed.**
  `omega-notify.js` (injected platform-wide by `bg.js` on every approved
  page) queries `public.notifications` for the badge/toast/panel widget
  (`user_id`, `notification_type`, `message`, `content`, `created_at`,
  `read_at`), but no `CREATE TABLE` for it existed anywhere in
  `supabase/*.sql` — distinct from `public.dispatches` (the global
  owner-broadcast channel with no per-user state). Same silent-failure
  shape as `user_assets`/`extend_trial`: the badge always showed 0 and the
  panel always showed "NO NOTIFICATIONS" for every member, with no visible
  error. Added `supabase/omega_notifications_fix.sql` (idempotent, RLS:
  members read/update only their own rows, owner reads all). Nothing in
  the codebase currently inserts a notification row — deciding which
  server-side events should generate one is separate, undone-on-purpose
  work, same as `user_assets`'s population. **Applied to the live
  database and verified** — `scripts/verify_fixes.sql` confirmed
  `notifications` now exists, and `omega_notify_triggers.sql` (below)
  confirms the 5 member-status RPCs populate it.
- **Authority-history chart queried the wrong table — fixed.**
  `omega-chart.js`'s `API.auth()` (used by `analytics.html` and
  `studio.html`'s "Authority History" chart) queried
  `public.authority_snapshots`, which never existed; the real table with
  matching `snapshot_date`/`authority`/`user_id` columns is
  `leaderboard_snapshots` (`supabase/entreprise_schema_v2.sql`). Fixed by
  pointing the query at the correct table name — no schema change needed.
- **Silent-failure writes — fixed.** `social.html`'s platform
  connect/disconnect buttons updated the in-memory `connections` object
  and re-rendered "CONNECTED" before checking whether the
  `social_connections` upsert/delete actually succeeded; `family.html`'s
  heir-toggle/remove buttons gave no feedback at all on a failed write.
  Both fixed to check `.error` and alert the user on failure, matching the
  established convention from the `events.html`/`automation.html`/
  `advertising.html` fixes above.

- **[Fixed, needs deploy — was actively breaking production] Every Stripe webhook call and
  every task-completion/axis-progression call has been silently failing.** The owner ran a
  `pg_proc` introspection query against the live database (see `GAP_ANALYSIS.md` §3.1 for the
  full trace) confirming two real, live bugs, both reproduced and re-verified end-to-end
  against a scratch PostgreSQL 16 instance before any fix was written:
  - `public.apply_subscription()` has two overloads live simultaneously (5-arg and 7-arg).
    `supabase/functions/stripe-webhook/index.ts` always calls with the 5 shared params, which
    Postgres cannot resolve unambiguously (`function ... is not unique`) — every webhook event
    (checkout completed, subscription updated/deleted, payment failed) has been failing, so a
    member who pays via Stripe never gets `subscription_status` set to `active`. The 7-arg
    overload was independently broken too (`COALESCE(p_tier_num::integer, membership_tier::text)`
    — a static type mismatch, `profiles.membership_tier` is `text`), so dropping the 5-arg one
    instead would not have worked. Fixed by dropping the 7-arg overload
    (`supabase/omega_apply_subscription_fix.sql`, `migrations/0093`).
  - `public.complete_task()` — only the `(p_task_name,p_task_type,p_axis_type,p_description,
    p_points)` signature is live, but all 5 client call sites (`omega-matrix.js`,
    `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`) used older, non-matching
    parameter names (`p_kind`/`p_task`/`p_axis`/`p_title`/`p_weight`) — every task completion,
    axis increment, authority-score update, and `nodes_earned` count has been silently no-oping
    platform-wide (habits, publishing, workflows, dedication, gaming, academy, exam,
    contributions), not just one bonus message as originally suspected. Fixing the param names
    alone would have exposed a second, previously-inert bug in the same function: no
    deduplication existed despite `omega-progress.js`'s own header comment and
    `publishing.html`'s copy both promising "keyed on (user, task)" / "farm-proof" behavior —
    confirmed by calling the live function body twice with an identical task and getting two
    separate increments. **A fourth, independent bug then surfaced when the owner actually ran
    the fix**: `CREATE INDEX ... (user_id, task_name)` failed with `column "task_name" does not
    exist` — the owner's live `public.task_completions` has an older, simpler shape (`id
    bigint, user_id, kind, task, completed_at, axis, increment, created_at`, confirmed via
    `information_schema.columns`) than what the live `complete_task()` function's own `INSERT`
    targets. Multiple `CREATE TABLE IF NOT EXISTS` definitions for this table exist across the
    SQL bag with genuinely different shapes; whichever ran first on the live database won, and
    it matches none of them exactly. Reproduced against a scratch instance seeded with the real
    reported columns: since a plpgsql function with no exception handler rolls back its entire
    body on any unhandled error, **`complete_task()` has never actually committed anything for
    anyone** — even the `profiles` axis/authority/`nodes_earned` update immediately before the
    failing `INSERT` was always rolled back too. Fixed by amending `migrations/0094` in place
    (nothing from the owner's failed first attempt had landed, since Postgres rolled back that
    whole transaction) to add a non-destructive `ALTER TABLE ADD COLUMN IF NOT EXISTS` for the
    missing columns before the index/function statements — old columns and any existing rows
    untouched. All three bugs fixed together: `supabase/omega_complete_task_dedup_fix.sql`
    (`migrations/0094`) adds the missing columns, the `(user_id, task_name)` dedup check, a
    supporting index, and an `applied` boolean in the return value; the 5 client call sites'
    parameter names are fixed in the same commit, plus `omega-matrix.js`'s separate bug reading
    `d.a`/`d.b`/`d.c` from a return shape that has always been `d.axis_a`/`d.axis_b`/`d.axis_c`.
  **Applied to the live database and verified.** The owner ran both fix files, then
  `scripts/verify_fixes.sql` (added this session) against the live database confirmed:
  `apply_subscription` has exactly one version live with the correct 5-arg signature;
  `complete_task` has the correct signature (`p_task_name text, p_task_type text, p_axis_type
  text, p_description text, p_points numeric` — `pg_get_function_identity_arguments()` never
  includes `DEFAULT` clauses, so compare against bare names/types, not the full `CREATE
  FUNCTION` text) and its dedup guard; `task_completions` has the columns the function needs.
  Production payments and progression tracking are unblocked.

- **[Fixed, needs deploy] `member_presence` writes have been silently failing on every page,
  every 30 seconds, for every member — same bug class as `extend_trial`/`complete_task` above.**
  Found while auditing `omega-*.js` modules loaded platform-wide by `bg.js` with zero call sites
  anywhere, looking for genuine wiring gaps (`FEATURE_IDEAS.md` #7–#13's pattern). Most turned out
  to be either already-working self-contained systems (`omega-legal.js`'s GDPR consent banner
  boots itself on `DOMContentLoaded`, confirmed correctly gated — nothing to fix) or genuinely
  dormant UI wiring gaps (already fixed as #10–#13). `omega-presence.js` was neither: it's fully
  self-activating (`setTimeout(startSync, 2000)`, no wiring needed) and has been calling
  `sb.from('member_presence').upsert({...})` on every page load and every 30-second sync since it
  was written — but two of its payload keys never matched the live schema
  (`supabase/entreprise_schema_v2.sql:47-52`): it sent `session_started` where the real column is
  `session_started_at`, and `dedication_today`, which doesn't exist as a column anywhere in the
  SQL bag (confirmed via a full-repo grep, not assumed). Supabase's REST layer (PostgREST) rejects
  writes referencing unknown columns, and the call is wrapped in `.catch(function(){})` — so like
  `complete_task()` before its fix, this has silently never committed a single row. Fixed by
  renaming `session_started`→`session_started_at` and dropping `dedication_today` (no such column
  exists to write to; adding one would be new schema, not this bug fix) in `omega-presence.js`.
  Verified with a schema-validating test harness that emulates PostgREST's actual
  unknown-column-rejection behavior (not just "doesn't throw") — confirmed the old code fails this
  check with exactly the two bad keys above, and the fixed code passes with all six keys matching
  the live schema exactly. **Not yet applied to the live database** — this fixes the client-side
  write shape only; no SQL changes were needed since the table already existed correctly, only the
  JS was wrong.
  Since `member_presence`'s own RLS already grants every authenticated member `SELECT` access
  (`"members see presence" ON public.member_presence FOR SELECT USING(true)`,
  `entreprise_schema_v2.sql:56-57` — matching the module's own header comment, "Inspired by
  Discord's presence system," an intentional design choice already baked into the schema, not a
  new privacy decision made here) and nothing anywhere displayed this data, added a minimal
  "ONLINE NOW" KPI card to `dashboard.html`'s main overview row, reading
  `member_presence` filtered to `is_online=true` within a 90-second recency window (covers one
  missed 30s sync before a member reads as offline). No new table/RPC/`platform_settings` flag.

- **[Fixed, needs deploy — likely the highest-impact bug found this session] New-member onboarding
  has never actually saved a member's chosen sign/element/god/agent/token — every visit re-showed
  the "SELECT YOUR ZODIAC SIGN" overlay, and every confirm silently failed while still showing a
  false "Welcome, Sovereign!" success toast.** `omega-onboard.js` is fully self-activating
  (fires on the real, reliably-dispatched `omega:populated` event — confirmed dispatched from
  `window.__omegaPopulate()`, the same population function 92+ pages already call, unlike the
  separate, rarely-fired `omega:user-loaded` event discussed above) and its own trigger condition
  is exactly `!pr.sign && !pr.element && !pr.is_owner` — so this reproduces for every new member,
  every time, until the fields actually save. They never did: the confirm handler's
  `profiles.update()` call sent `olympian`, `agent_name`, and `token_affinity` — none of which
  are real column names. A repo-wide grep confirms the real columns are `god`, `agent`, and
  `token` (all three already correctly read elsewhere, e.g. `omega-share-card.js`'s `pr.god`/
  `pr.agent`/`pr.token`) — this was a naming mismatch against columns that already exist, not
  missing schema. A fourth field, `onboarded_at`, has no equivalent column anywhere in the SQL
  bag; dropped rather than added, since `needsOnboarding()`'s own check (`!pr.sign && !pr.element`)
  already serves as the "has onboarded" signal once `sign`/`element` correctly save — adding a
  redundant timestamp column would be new schema, not this bug fix. PostgREST rejects the whole
  update when any field is unrecognized, so `sign`/`element` never saved either, even though
  those two were spelled correctly. The update result was never checked for `.error` (same
  silent-failure shape as every fix above), so the flow always proceeded to show success. Fixed
  both: corrected the three field names, and added an explicit `.error` check that now shows a
  real "could not save" error and re-enables the button on failure instead of a false success.
  Verified with the same schema-validating mock as the `member_presence` fix above, driven
  through an actual click-through of the onboarding UI (select a sign, click confirm) rather than
  just inspecting the code: confirmed the pre-fix code produces exactly the four wrong keys and
  the post-fix code produces exactly `sign`/`element`/`god`/`agent`/`token` matching the live
  schema, with the correct values for each (cross-checked against `ZODIAC_MAP`'s own data, e.g.
  Aries → Ares/Sentinel/ARENITE). **Not yet applied to the live database** — no SQL changes
  needed, this is a client-side field-name and error-handling fix only.
- **`omega-workflow.js`'s `query_dedications` step queried a column that doesn't exist — fixed;
  found while auditing whether the module is even reachable in the first place.** Auditing the
  remaining unexplored `omega-*.js` modules (`omega-capability.js`, `omega-page-emblem.js`,
  `omega-workflow.js`, `omega-experiment.js`, `omega-intelligence.js`, `omega-memory.js` —
  continuing the `FEATURE_IDEAS.md` #7–#14 pattern) found that `omega-workflow.js`'s
  `report_generate` workflow's `query_dedications` step selected and ordered by
  `sovereign_events.created_at`, but the live table (`entreprise_schema_v2.sql:65-76`) has no
  `created_at` column at all — only `occurred_at` (confirmed via a full-repo grep, not assumed;
  `record_sovereign_event()` and every other real writer of this table already use
  `occurred_at` correctly). Same silent-failure shape as every bug above: PostgREST rejects a
  `select`/`order` referencing an unknown column, the call is wrapped in try/catch, so this step
  has always silently returned an empty dedications array instead of erroring visibly. Fixed by
  correcting both the `select()` and `order()` calls to `occurred_at`. Verified with an extended
  version of the schema-validating mock (added read-side column validation alongside the
  existing write-side check, since this is the first bug this session found in a *read* rather
  than a *write*) — confirmed the pre-fix code returns 0 dedications against 2 seeded rows, the
  post-fix code returns both, no regressions across the other 8 existing verification tests after
  extending the mock. **Not yet applied to the live database** — no SQL changes needed, this is a
  client-side column-name fix only. Separately, but discovered in the same audit: this bug was
  latent in effectively dead code — `OmegaWorkflow.run(...)` (which is how `query_dedications`
  would ever execute) has no external caller anywhere in the repo today. See `FEATURE_IDEAS.md`'s
  "Flagged, not proposed" section for why wiring the workflow engine up to something is a
  scoping decision left undone, not a bug.
- **[Fixed, needs deploy — legally-sensitive] The GDPR Article 20 data-export button
  (`privacy.html`, `omega-export.js`) has always exported a mostly-empty package — 4 of its 6
  datasets silently failed on every single request.** Continuing the module audit, checked every
  `.select()` in `omega-export.js`'s `gather()` against the live schema, column by column, rather
  than assuming the file's own comments ("Exported datasets: 1. Profile & identity... 2. Task
  completions...") reflected reality. They didn't, in 4 of 6 cases — the same
  guessed-column-name silent-failure shape as `complete_task`/`member_presence`/
  `omega-onboard.js`/`omega-workflow.js` above, just never audited until now because nothing
  about a GDPR export *looks* broken from the outside (no error, no empty-state UI — the button
  always shows a "Export ready" success toast and downloads a real file, it's just missing most
  of its content):
  - `profiles` select used `agent_name` (real column: `agent` — same mismatch already fixed in
    `omega-onboard.js`) and `onboarded_at` (no such column anywhere in the SQL bag, same as the
    `omega-onboard.js` finding). PostgREST rejects the whole select on any unknown column, so the
    exported "profile" dataset has never contained more than a client-computed
    `_computed_authority` value — no `display_name`, `email`, `sign`, `element`, `god`, `agent`,
    `token`, etc., ever.
  - `task_completions` select used `weight_applied` — no such column exists anywhere (the real
    column, added by `migrations/0094`/`omega_complete_task_dedup_fix.sql`, is `points_earned`).
    Exported task-completion history has always been empty.
  - `sovereign_events` select and order used `created_at` — same wrong-column bug as
    `omega-workflow.js` above (real column: `occurred_at`). Exported event history has always
    been empty.
  - `leaderboard_snapshots` select used `tier` — no such column exists on this table
    (`entreprise_schema_v2.sql:126-140`; confirmed via grep, not assumed). Exported ranking
    history has always been empty. Changed to `element` (a real column already selected
    elsewhere in this same file for other tables, and meaningful ranking context) rather than
    dropped outright.
  - `interest_signals` and `activity_feed` selects were already correct — both actually worked.
  Fixed all four by correcting column names to match the live schema (`agent`, dropped
  `onboarded_at`, `points_earned`, `occurred_at`, `element`). Verified with the schema-validating
  Playwright mock, driven through an actual click on the export flow (not just code inspection):
  captured the real downloaded JSON blob via a `URL.createObjectURL` interception, confirmed the
  pre-fix package has an empty/near-empty profile (missing `display_name`) and zero rows across
  `task_completions`/`sovereign_events`/`leaderboard_snapshots` despite seeded data existing for
  all of them, and the post-fix package correctly contains all 6 datasets with their seeded rows.
  No regressions across the other 4 verification tests. **Not yet applied to the live database**
  — no SQL changes needed, this is a client-side column-name fix only.
- **The bottom-bar live activity ticker (`omega-realtime.js`, every page) has always stayed
  stuck on "LOADING LIVE FEED…" — fixed.** Completing the sweep of every remaining `omega-*.js`
  module with a `.from()`/`.rpc()` call (30 modules audited this session in total; see
  `CAPABILITY_INVENTORY.md` §2 for the full list), `pollActivityFeed()` selected
  `activity_type,title,member_name,created_at` from `public.activity_feed` — but that table has
  no `member_name` column at all (`platform_expansion.sql:9-19`: `id, user_id, activity_type,
  title, body, metadata, is_public, likes_count, created_at`; confirmed via grep, not assumed).
  PostgREST rejects the whole select on the unknown column, the call is wrapped in try/catch, so
  `_tickerItems`/`_eventFeed` have never once been populated — every member on every page has
  always seen the ticker's static placeholder text, never real content, with no visible error.
  Fixed by dropping `member_name` from both the select and the template string (no join to
  `profiles` added — that's a bigger change than this bug fix, and `title` alone reads fine,
  e.g. "Completed Habit Streak · 1s ago"). Verified with the schema-validating Playwright mock,
  driven through `OmegaRealtime.refresh()` on a live page: confirmed the pre-fix code leaves the
  ticker on its placeholder text with `feed()` returning 0 rows despite 2 seeded activity_feed
  rows, and the post-fix code populates both correctly. No regressions across the other 5
  verification tests. **Not yet applied to the live database** — no SQL changes needed, this is
  a client-side column-name fix only.
- **RLS policy audit (first full pass): every FOR INSERT/UPDATE/ALL policy's WITH CHECK clause
  cross-referenced against whether its table has a user-identity column that should be scoping
  it — 4 real gaps found and fixed, plus 1 storage-policy gap, all in
  `supabase/omega_rls_scoping_fix.sql`.** `scripts/audit.py` check 4 only confirms every table
  has RLS *enabled* (0 tables missing it, confirmed clean) — this pass checked policy
  *correctness*, which that check doesn't cover. All five gaps share the same shape: `WITH
  CHECK(true)` (or, for storage, no owner-bypass) lets any authenticated account — including one
  still pending approval — write or read rows it shouldn't, via a direct REST call to the
  anon/publishable key, not through the app UI (RLS is the actual authorization boundary here,
  §5, not application code). Each was confirmed to have zero legitimate client writer that the
  fix would break, by grepping every `.js`/`.html`/edge-function file for the table name before
  touching its policy:
  - `capability_kpi_log` — `FOR SELECT` is owner-only (`omega_capability_registry.sql`), but
    `FOR INSERT` was `WITH CHECK(true)`: any signed-up account could inject fake KPI rows into a
    table only the owner is meant to see. Zero client writers anywhere in the repo. Fixed by
    restricting INSERT to the owner too, matching SELECT.
  - `policy_eval_log` — identical shape and fix (`omega_policy_engine.sql`'s SELECT is
    owner-only; INSERT was wide open; zero client writers).
  - `threat_events` — `FOR INSERT` was `WITH CHECK(true)` with **no scoping to the table's own
    `user_id` column** — worse than the two above, since a malicious signed-up account could
    insert a row attributing `threat_type` values like `'brute_force'` or
    `'privilege_escalation'` to a *different* member's `user_id`, framing them on the owner's SOC
    dashboard (`dashboard.html`/`observatory.html` both show a threat count read from this
    table). Zero client writers exist today — only reads, for the dashboard counts. Fixed with
    `auth.uid() = user_id` rather than owner-only, since the table having a `user_id` column at
    all implies the intended design is eventual self-reported client telemetry, not owner-only
    writes.
  - `telemetry_events` — has a real, currently-working client writer (`omega-telemetry.js`,
    audited earlier this session and found correct) that already always sets `user_id` to the
    caller's own profile id before any insert fires (`_uid` is only ever set from the
    `omega:populated` event's own profile, and `flush()` requires `_uid` set first) — so
    tightening `WITH CHECK` to `auth.uid() = user_id` closes the same spoofing gap as
    `threat_events` without touching the real write path. `platform_metrics` and
    `platform_events` were checked too and deliberately left alone: `platform_metrics` has no
    `user_id` column at all (a platform-level aggregate, not per-member — `WITH CHECK(true)` is
    correct there), and `platform_events`'s real writer (`omega-sovereign-os.js`) never sets
    `user_id` by design for anonymous-until-populated beacons, so scoping it would break the real
    write path instead of closing a gap.
  - `storage.objects` **"uploads" bucket read policy** (`storage.sql`) — a member can submit a
    KYC document (`profile.html`'s upload flow writes into `uploads/<their-uid>/...` and sets
    `profiles.kyc_doc_path`), but the bucket's read policy only ever let a member read their own
    folder — no owner-bypass, unlike every other owner-elevated policy in this schema. Confirmed
    via grep that `approvals.html` has zero KYC references (the review UI itself was never
    built), so this isn't exploited today, but it silently blocks the review half of a
    half-built feature. Fixed by adding the same `is_platform_owner()` OR-clause used everywhere
    else in this schema.
  **Verified against a real scratch PostgreSQL 16 instance**, not just read by eye: loaded the
  real source files that create all 4 tables plus `storage.sql`, applied the fix file (clean,
  idempotent — confirmed safe to re-run twice), then ran 7 functional tests simulating two
  member sessions and an owner session via a configurable `auth.uid()` stub: (1) member A
  attributing a fake threat to member B → rejected, (2) member A self-reporting → accepted, (3)
  member A injecting fake KPI data → rejected, (4) member A spoofing telemetry under member B's
  uid → rejected, (5) member A's own telemetry → accepted, (6) member A reading member B's
  uploads folder → 0 rows, (7) the owner reading the same folder → the row is visible (the actual
  new capability). All 7 passed. `python3 scripts/audit.py` reconfirmed 0 critical / 6
  pre-existing warnings (file/policy counts increased by exactly 1 file / 5 policies, matching
  the new fix file, no new duplicate-table or RLS-missing warnings introduced). **Applied to the
  live database and verified** (2026-08-17, via the Supabase MCP connector once authorized) —
  queried `pg_policies` on the live project (`ydqhzvvoyufiiqvzcjns`) before applying and
  confirmed all 5 gaps present exactly as described (`capability_kpi_log`/`policy_eval_log`
  INSERT policies both `WITH CHECK(true)`, `threat_events`/`telemetry_events` INSERT unscoped,
  `storage.objects` "uploads read" with no owner-bypass); applied
  `omega_rls_scoping_fix.sql` via `apply_migration`; re-queried `pg_policies` afterward and
  confirmed all 5 policies now read exactly as the fix file specifies (`owner inserts kpi`/`owner
  inserts eval` → `is_platform_owner()`, both `threat_events`/`telemetry_events` INSERT →
  `auth.uid() = user_id`, `uploads read` → own-folder-or-owner). `get_advisors(security)`
  re-run afterward with zero findings referencing any of the 5 touched policies.
- **Edge Function audit (all 7 functions read in full): 2 real findings — a daily cron job that
  has never written a single row, and a fully orphaned duplicate file.**
  - **`snapshot-leaderboard`'s upsert has always silently failed — fixed.** This function (meant
    to run on a daily Supabase cron at 00:05 UTC per its own header comment, also callable
    on-demand by the owner from `leaderboard.html`) upserts
    `user_id, snapshot_date, authority, axis_a, axis_b, axis_c, rank_global, display_name,
    element, sign, tier, is_owner` into `public.leaderboard_snapshots` — but the table's only
    `CREATE TABLE` (`entreprise_schema_v2.sql:126-140`; confirmed via grep, no other file
    ALTERs it) has no `display_name`, `sign`, `tier`, or `is_owner` columns at all. PostgREST
    rejects the entire upsert on any unknown payload key, so this cron job has never written a
    single row — and its own per-batch error handling still returns `{ok:true, rows_written:0}`,
    a false success with no visible failure. This directly explains why `leaderboard_snapshots`
    read empty everywhere else it was touched this session (the `omega-export.js` GDPR-export
    fix earlier needed seeded test data specifically because the real table has likely never
    held a row). Fixed by adding the 4 missing columns
    (`supabase/omega_leaderboard_snapshots_columns_fix.sql`) rather than stripping them from the
    edge function's payload, since `leaderboard.html`'s own `renderPodium()`/`renderTable()` (the
    documented tier-2 fallback reader for this exact table) already read `r.display_name` and
    `r.sign` from snapshot rows — the writer and reader already agree on this shape; only the
    table was missing it. **Verified against a real scratch PostgreSQL 16 instance**: loaded the
    actual `entreprise_schema_v2.sql`, reproduced the exact failure with the edge function's
    literal upsert payload (`column "display_name" of relation "leaderboard_snapshots" does not
    exist`), applied the fix, confirmed the same payload now succeeds and reads back exactly the
    shape the client expects, and confirmed the fix file is idempotent (clean second run).
    **Applied to the live database and verified** (2026-08-17, via the Supabase MCP connector) —
    queried `information_schema.columns` on the live project (`ydqhzvvoyufiiqvzcjns`) before
    applying and confirmed `leaderboard_snapshots` had only the original 12 columns; applied
    `omega_leaderboard_snapshots_columns_fix.sql` via `apply_migration`; re-queried and confirmed
    `display_name`/`sign`/`tier`/`is_owner` now exist with the correct types (`text`/`text`/
    `text`/`boolean`). The cron job itself wasn't separately re-triggered this session (it runs
    on its own daily schedule), so the next scheduled or owner-triggered run is the first one
    that will actually write rows — but the column-shape blocker that made every prior run
    silently write 0 is now gone.
  - **`checkout/stripe-webhook/index.ts` — a fully orphaned duplicate, removed.** A second,
    45-line Stripe-webhook implementation existed nested inside the `checkout` function's own
    directory (`supabase/functions/checkout/stripe-webhook/index.ts`), structurally distinct from
    (and much less complete than) the real, comprehensively-documented top-level
    `supabase/functions/stripe-webhook/index.ts` (272 lines — Web Crypto signature verification,
    4 event types, deploy instructions). Confirmed genuinely dead, not "which one is live"
    ambiguity like the SQL duplicate-function situation elsewhere in this repo: Supabase Edge
    Functions only recognize top-level `supabase/functions/<name>/index.ts` directories as
    deployable — a subdirectory nested inside another function's own folder was never a valid
    deployment target under any standard Supabase workflow. `checkout/index.ts` itself never
    references it, and a full-repo grep for "stripe-webhook" found every other reference in the
    codebase (`CLAUDE.md`, `GAP_ANALYSIS.md`, `CAPABILITY_INVENTORY.md`,
    `scripts/check-secrets.sh`, `supabase/migrations/README.md`) pointing exclusively at the
    top-level file. Removed the nested `checkout/stripe-webhook/` directory entirely.
  - All 5 other functions (`checkout`, `concierge`, `intel-feed`, `notify-access`, `rankings`,
    and the top-level `stripe-webhook`) were read in full and checked column-by-column /
    param-by-param against the live schema — all correct, no bugs found. (`rankings` and
    `snapshot-leaderboard` share near-identical AUTH-computation logic; `rankings` is read-only
    and unaffected by the column bug above.)
- **HTML-page audit (built a repo-wide schema dictionary and scanned every `.html` page's
  inline JS against it — the first automated, not manual, pass this session): 8 more
  column-name silent failures, plus a systemic 26-instance bug class affecting 24 pages'
  clickable UI.** Method: parsed every `CREATE TABLE`/`ALTER TABLE ADD COLUMN` in
  `supabase/*.sql` into a table→known-columns dictionary (had to fix a real bug in the
  parser itself first — a SQL line comment containing a comma, e.g.
  `-- 'task_complete','gate_unlock',...`, was corrupting the column split and produced a
  false positive on `activity_feed.title`; also had to manually add `task_completions`'
  `kind`/`task`/`axis`/`increment` columns, which are confirmed live per this file's own
  `complete_task()` entry above but never appear in any `CREATE TABLE` in the SQL bag at
  all, having been created out-of-band), then scanned every `.from('table').select()/
  .insert()/.update()/.upsert()` call across all 169 `.html` pages for column names absent
  from that table's known set. Every finding below was independently confirmed by hand
  (reading the real `CREATE TABLE`, the real RLS policies, and the actual downstream code)
  before fixing — the automated pass finds *candidates*, not verdicts.
  - **`feed.html`** — `publications` select referenced `author_name` (doesn't exist; the
    column is `user_id`, no display-name join was ever built). The platform-wide "recent
    publications" feed has always shown "PUBLICATIONS UNAVAILABLE." Fixed by dropping the
    field (matches the existing `||'ANONYMOUS'` fallback already in the render code, same
    minimal-fix precedent as `omega-realtime.js`'s `member_name` fix earlier this session).
  - **`graph.html`, `nexus.html`, `sigma.html`** — all three select `zodiac_sign`/`full_name`
    from `profiles` (real columns: `sign`/`display_name`). Same copy-pasted wrong names
    across all three — the member constellation graph, the nexus visualization, and the
    element-breakdown leaderboard have never rendered a single real member, silently
    degrading to empty (`||[]` fallbacks swallow the query error with no visible failure).
    Fixed by renaming `zodiac_sign`→`sign` everywhere (including downstream `SIGN_ELEM[...]`
    lookups) and dropping `full_name` (the existing `display_name||full_name||'Sovereign'`
    fallback chains already degrade gracefully once the nonexistent field is removed).
  - **`tribe.html`** — selected `authority_score`/`gate_level`, neither a real column
    (`profiles.authority` exists but is never written by anything — confirmed via grep, a
    dormant column, not a usable substitute), and ordered by the nonexistent
    `authority_score`. The tribes/rankings page has always shown 0 real members (its
    `try/catch` around the query never actually triggers, since a PostgREST schema error
    resolves rather than throws — the page silently shows an empty tribe, not the
    `generateDemoProfiles()` fallback some might expect from reading the code without
    testing it). Fixed by selecting `axis_a/axis_b/axis_c/is_owner` instead and computing
    `authority_score`/`gate_level` client-side with the same `calcAuth()`/gate-threshold
    pattern already used identically on `sigma.html` and several other pages, sorting
    client-side since a computed value can't be used in a server-side `.order()`.
  - **`advertising.html`** — both `loadLiveAds()`'s select and `submitAd()`'s insert used a
    completely different, wrong set of column names (`headline`/`body`/`tier`/
    `company_name`/`destination_url`/`timeline_period`/`submitted_at` vs. the real
    `title`/`description`/`rate_tier`/`company`/`url`/no-timeline-column/`created_at`
    auto-default) — the ad marketplace has never displayed a real ad or successfully
    recorded a submission. A second, independent bug in the same page: `loadLiveAds()` and
    the KPI counter in `boot()` both filtered `status='active'`, a value nothing in the
    codebase ever assigns (the schema comment documents only `pending`/`approved`/
    `rejected`, and the RLS read policy checks `status = 'approved'`) — fixed to match. A
    third, independent bug found only by testing the fix in a real browser, not by reading
    the code: `loadLiveAds()` is declared inside the page's `<script type="module">` block,
    but is called from `setTab()` in a separate, non-module `<script>` via
    `onclick="setTab('live')"` — module top-level declarations aren't global, so clicking
    the "LIVE ADS" tab has always thrown `loadLiveAds is not defined` in the real browser
    console (silently, since inline `onclick=` errors don't surface to the user), meaning
    the ad grid never populated even after this session's column-name fix, until this was
    separately corrected by exposing `window.loadLiveAds=loadLiveAds`. Also added the
    missing RLS `INSERT` policy (`supabase/omega_advertisements_insert_fix.sql`) — see
    below, `submitAd()` was RLS-blocked independent of the column names.
  - **`approvals.html`** — `sendDispatch()`'s fallback path (used when the real
    `post_dispatch()` RPC call fails) inserted directly into `dispatches` with 2 wrong
    column names (`sent_by`/`sent_at`, neither exists) *and* `dispatches` has no INSERT
    policy for anyone except via that RPC's `SECURITY DEFINER` bypass — so the fallback was
    doubly non-functional, yet the code never checked the insert's result and always showed
    "✓ DISPATCH RECORDED" regardless. Fixed by removing the non-functional fallback insert
    entirely (a raw write that bypasses `post_dispatch()`'s own input sanitization would be
    a worse fix than making the real failure visible) and showing an honest failure toast
    when the RPC itself fails.
  - **`map.html`** — flagged, not fixed: selects `lat`/`lon`/`country`/`gate` from
    `profiles`, none of which exist anywhere in the schema — this isn't a naming mismatch
    like the others, there is no member-location data anywhere in this platform at all.
    Building real geolocation collection is a genuine new feature (consent flow, collection
    method, privacy-policy implications), not a bug fix — see `FEATURE_IDEAS.md`.
  - **A systemic module-boundary bug, found only by testing a fix in a real browser and
    then deliberately searching for the same pattern elsewhere: 26 instances across 24
    pages, the single highest-count bug class found this session.** Many pages split their
    inline JS into a plain `<script>` (usually just a `setTab()`/`switchTab()`-style
    function, called from `onclick=` attributes in the markup) and a separate
    `<script type="module">` (the Supabase logic). Inline event-handler attributes always
    execute in global scope, but a function declared at the top level of a
    `<script type="module">` is scoped to that module, not global — so whenever the
    tab/action function itself was accidentally written *inside* the module script instead
    of the plain one, every click on that control has thrown `ReferenceError` in the
    browser console, silently, with the click doing nothing. Found by writing a script that
    parses every page's script tags, determines which top-level functions are
    module-scoped-only (never `window.`-exposed), and cross-references every inline
    `onclick=`/`onchange=`/etc. attribute against that set. Confirmed by hand on a sample
    across the list (`awards.html`, `network.html`, `nutrition.html`, `maintenance.html`
    each individually verified with a real declaration read, not just trusted from the
    scan) before batch-fixing all 26 by inserting `window.<fn>=<fn>;` immediately before
    each affected declaration (function declarations hoist, so placement is safe regardless
    of call order) — 22 are `setTab(name)`/`switchTab(...)` tab-switchers (`awards.html`,
    `beacon.html`, `ecosystem.html`, `enterprise.html`, `events.html`, `factions.html`,
    `feed.html`, `health.html`, `maintenance.html`, `marketplace.html`, `membership.html`,
    `prediction.html`, `privacy.html`, `publishing.html`, `search.html`, `series.html`,
    `sovereign-ai.html`, `sovereigns.html`, `trailers.html`, `travel.html`), the remaining 4
    are page-specific actions (`decisions.html`'s `renderChoiceButtons()`, `network.html`'s
    `editContact()`/`deleteContact()`/`openLog()`, `nutrition.html`'s `searchFood()`,
    `publications.html`'s `renderCatalog()`). Verified with a dedicated Playwright test
    clicking the real inline `onclick=` handler (not calling the function directly) on a
    sample of the fixed pages — tab panels now actually switch, zero page errors — plus a
    re-run of the automated scanner confirming 0 remaining instances across all 169 pages.
  All fixes verified: the column-name fixes with a schema-validating Playwright mock seeded
  with real-shaped data (confirming the previously-broken queries now return it); the RLS
  fix with a real scratch PostgreSQL 16 instance (member submits own ad → succeeds; member
  spoofs another member's `submitted_by` → rejected; a different member reads the approved
  ad afterward → succeeds); the module-boundary fixes with real inline-attribute clicks in
  headless Chromium. `node --check`-equivalent syntax validation on every touched page's
  inline `<script>` blocks, and `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
  warnings throughout. **Applied to the live database and verified** (2026-08-17) — queried
  `pg_policies` on `public.advertisements` before applying and confirmed only `owner_manage_ads`
  and `read_approved_ads` existed, no INSERT policy for a non-owner member; applied
  `omega_advertisements_insert_fix.sql` via the Supabase MCP connector's `apply_migration`, then
  re-queried and confirmed `"member submits own ad"` (`FOR INSERT`, `WITH CHECK (submitted_by =
  auth.uid())`) now exists alongside the other two. Matching local migration file added at
  `supabase/migrations/20260817233805_omega_advertisements_insert_fix.sql`, named with the exact
  version string the remote recorded.
  - **`dna.html` had the identical `tribe.html`-class bug, found and fixed separately**: its
    personalization panel read `pr.authority_score`/`pr.gate_level`, neither of which exists,
    so every member saw the same generic default (`gate 1`, `auth 3.14`) regardless of real
    progress. Fixed the same way as `tribe.html` below.
  - **Reconciliation correction, found merging two independent sessions' overlapping fixes for
    this exact bug class:** the fix above for `tribe.html`/`dna.html` initially read the stored
    `profiles.authority` column directly. That column is real, but trusting it is inconsistent
    with the platform-wide convention every other authority-displaying page already
    uses — `nexus.html`, `sigma.html`, `omega-export.js`, etc. all compute authority
    **client-side** from `axis_a/b/c` with an explicit `is_owner ? 27.8367 : calcAuth(...)`
    special case, specifically because the stored column isn't guaranteed to reflect the owner's
    apex status. Corrected both pages to match that convention instead (compute from
    `axis_a/b/c` client-side, sort client-side since a computed value can't drive a server-side
    `.order()`) — same bug class, more correct fix.
- **[Fixed — likely the highest-impact bug found in this repo's history] `bg.js` never loaded
  `nav.js` — the sidebar navigation was completely empty on the ~162 pages that rely on `bg.js`
  alone, contradicting this file's own (wrong) claim that "every page loads `bg.js`... and
  `nav.js`" (§9, and `REPOSITORY_AUDIT.md`'s methodology note).** Found while investigating a
  user request to internationalize the sidebar: `nav.js` builds the entire sidebar (`<aside
  id="omega-side">`) and is real, complete, and correctly written (confirmed via
  `node --check` and reading it in full) — but `bg.js`'s module-injection block, which loads
  essentially every other `omega-*.js` file (~90 of them, plus `audio.js`/`i18n.js`/`theme.js`/
  `emblem.js`/`omega-controls.js`), never once requested `/nav.js`. Verified empirically, not
  just by grep: served the real repo over a local static server and drove real headless Chromium
  (Playwright) to `dashboard.html` — `#omega-side` had zero children after full page load, and
  the browser's actual network log confirmed `/nav.js` was never requested despite ~90 other
  local scripts loading successfully. Cross-checked the claim wasn't a fluke of one page: only
  7–9 of 169 pages carry their own explicit `<script src="/nav.js">` tag (a legacy pattern from
  before `bg.js` apparently lost this injection at some point); the other ~160 have the `<aside
  id="omega-side">` shell with nothing to render into it — meaning the primary navigation UI has
  been invisible on the large majority of this platform's pages, on every visit, for however long
  this regression has existed, without a single prior audit session (many of which did real
  browser/Playwright verification on other features) catching it. Fixed by adding `nav.js` to
  `bg.js`'s injection block, guarded against both the new `data-omega-nav` marker and the old bare
  `<script src="/nav.js">` form so the ~9 legacy pages don't render the sidebar twice. Re-verified
  with the same Chromium harness after the fix: `dashboard.html` (no own nav.js tag) now renders
  all 15 sidebar sections correctly; `cosmos.html` (has its own legacy tag) also renders correctly
  with exactly one `/nav.js` script tag present, not two. `python3 scripts/audit.py`: 0 critical,
  same 6 pre-existing warnings (checks 7/8, `sw.js` precache and manifest icons, were already
  correct — `sw.js` already precached `/nav.js`, it just was never being fetched by real page
  loads). No SQL/schema involved; pure client-side fix, live the moment it's deployed.
- **i18n coverage extended to the sidebar** (prompted by the same investigation above): `i18n.js`
  is a fully working, platform-wide-loaded translation engine (7 languages, correct RTL handling
  for Arabic, a working language-switcher dock in `omega-controls.js` that already correctly
  calls `OmegaI18n.translate()`) — but virtually no page markup carried `data-i18n` attributes,
  so switching languages changed almost nothing visible, even though the fix above means the
  sidebar now actually renders platform-wide. Added `data-i18n="nav_sec_<key>"` to all 15
  sidebar-section labels (both the desktop dock's tooltip headings and the mobile drawer's
  section headings in `nav.js`) and the matching 15 new dictionary entries (`nav_sec_command`
  through `nav_sec_media`) to `i18n.js`, across all 7 existing languages. Verified with the same
  Chromium harness: calling `OmegaI18n.translate('ar')` correctly set `dir="rtl"`/`lang="ar"` on
  `<html>` and replaced all 15 sidebar labels with their Arabic translations. This covers the
  single highest-leverage surface (present on every page) but is not full-platform coverage —
  translating the ~90 sub-navigation links and all in-page content remains a much larger,
  separate effort, intentionally out of scope here.
- **Sound-toggle dock button never actually controlled the audio engine — fixed, two bugs.**
  `audio.js`'s own header comment says it built `window.__omegaAudioToggle`/
  `window.__omegaAudioIsOn` specifically "for omega-controls.js's unified dock, so the SOUND
  toggle in one place actually starts/mutes this engine" — but `omega-controls.js`'s sound
  button never called either hook; it only toggled its own local flag, wrote to `localStorage`,
  and dispatched an `omega:sound` `CustomEvent` that nothing anywhere listens for (confirmed via
  grep). Separately, `audio.js` read its mute state from `omega_audio_muted`, a key the dock
  never wrote to (the dock uses `omega_sound`) — so even a correct call from the dock would have
  raced against a stale, disconnected flag. And the hook itself had a latent bug: it called
  `update()`, a function that only exists inside a different, disabled sibling function
  (`injectControl`, whose own visible button was deliberately turned off to avoid duplicating the
  dock) — calling `window.__omegaAudioToggle()` as intended would have thrown
  `ReferenceError: update is not defined`. Fixed all three: unified both files on the single
  `omega_sound` key, removed the dangling `update()` call, and wired the dock's click handler to
  actually call `__omegaAudioToggle()`. Verified with the Chromium harness by clicking the real
  dock button twice (not calling the function directly): first click starts the ambient engine
  and flips the label to "♪ ON", second click mutes it and flips to "♪ OFF", `localStorage`
  persists correctly, zero page errors either time. Also fixed a matching `zodiac_sign`→`sign`
  column-name bug in `omega-music.js` (same bug class as elsewhere in this file) found while
  reading the file for this — low-impact today since the surrounding `omega:user-loaded` event
  is documented above as rarely-fired, but correct now if that's ever wired up.
- **The `zodiac_sign`/`full_name`/`agent_name` wrong-property bug (previously fixed piecemeal in
  `omega-music.js`, `graph.html`, `nexus.html`, `sigma.html`, `omega-onboard.js`,
  `omega-export.js`) was still live in 18 more files — swept and fixed platform-wide.** Every
  prior fix of this exact bug class was found one file at a time, as a side effect of auditing
  something else; this pass instead grepped every `.js`/`.html` file directly for the three known-
  wrong property names (`.zodiac_sign`, `.full_name`, `.agent_name` — real columns are `sign`,
  `display_name`, `agent`) to find every remaining instance at once, rather than waiting to trip
  over the rest one by one. 7 of the 18 read a fresh, reliable `sb.from('profiles').select('*')`
  result every page load (`blockchain.html`, `character.html`, `cipher.html`, `credentials.html`,
  `horoscope.html`, `oracle.html`, `sigil.html`) — real, every-visit impact: a member's actual
  stored zodiac sign was never used, silently falling back to a generic or date-computed default
  instead, on every single page load. `profile.html` had one more instance in its share-card data
  (dead fallback only, `display_name` already checked first — dropped rather than renamed). The
  remaining 6 (`omega-ambient.js`, `omega-event-bus.js`, `omega-particles.js`, `omega-passport.js`,
  `omega-realm.js`, `omega-sigil-gen.js`) all read from the `omega:user-loaded` event's
  `e.detail.profile`, already documented above as rarely-fired — low practical impact today, fixed
  for correctness regardless. `omega-intelligence.js` and `omega-workflow.js` had the
  `agent_name`→`agent` variant. Two already-harmless instances (`news.html`, `realm.html`) had a
  correct fallback already earlier in the same `||` chain, masking the dead wrong-named one after
  it — cleaned up rather than left as confusing dead code. `signal.html`'s `repo.full_name` is a
  real, unrelated GitHub API response field (not a profile column) — confirmed and left untouched,
  not a false "fix." Also re-ran the write/read/RPC column-mismatch scanners from earlier in this
  file (all clean, confirming no regressions and no new instances of those bug classes) and the
  scanner behind the "26-instance module-boundary bug" fix (0 remaining; its 2 new hits were both
  false positives — `esc(...)` calls happening at template-string build time inside a module
  script, not literal runtime `onclick=` handlers). `node --check`-equivalent syntax validation on
  every touched file's inline `<script>` blocks; `scripts/audit.py` reconfirmed 0 critical / 6
  pre-existing warnings. No SQL/schema changes — pure client-side property-name fixes.
- **[Fixed — the most severe onboarding bug found in this repo's history] The 9-elements sign
  mapping was wrong in 13+ files, sometimes catastrophically, and `omega-onboard.js` — the live
  onboarding flow — assigned the wrong god and agent to 9 of 12 signs for every real new
  member.** Prompted by an explicit request to audit the 12-agent persona system for accuracy,
  not just wiring. Cross-referenced every sign→element and sign→god assignment in the repo
  against two independent, structured, canonical sources that already agreed with each other on
  all 12 signs — `omega-agents.json` (`by_sign`) and `omega-elements.json` (`elements[].members`,
  explicit "elements 1–5 map to the 12 signs" / "elements 6–8 are class-based, assigned, not
  sign-derived" structure) — rather than trusting whichever version was already most common in
  the code.
  - **The dominant `SIGN_ELEM` table, duplicated identically across 15 files** (`omega-ambient.js`,
    `omega-event-bus.js` ×2, `omega-music.js`, `omega-passport.js`, `omega-realm.js`,
    `omega-sigil-gen.js`, `cipher.html`, `nexus.html`, `oracle.html`, `realm.html`, `sigma.html`,
    `graph.html`'s own `SE`) had exactly 3 of 12 signs wrong: `Taurus:'Water'` (real: Metal),
    `Scorpio:'Soul'` (real: Water — and Soul is explicitly a class-based metaphysical element per
    `omega-elements.json`, never sign-derived at all, so this wasn't just the wrong element, it
    was a category error), `Aquarius:'Metal'` (real: Wind). Even `omega-copilot.js`'s own AI
    knowledge-base fallback answer already stated the correct mapping — the assistant would tell
    a member the right answer in chat, then contradict it on their own profile page. Fixed all 3
    values in all 15 files with a verified `sed` sweep (confirmed zero remaining instances after).
  - **`character.html`'s own `ELEMS` array — which `omega-particles.js`'s code comment explicitly
    (and incorrectly) claimed to "match" — was far more wrong: 9 of 12 signs, not 3.** It reads
    as the 9 elements cycled and wrapped in definition order (Fire→Water→Wind→Sand→Soul→Metal→
    Space→Void→TheAll) against the 12 signs in zodiac order, with no relationship to the actual
    canonical per-sign mapping at all — coincidentally correct only at Aries, Gemini, Pisces. The
    exact same wrapped sequence, independently reproduced, was also found in `horoscope.html`'s
    12 sign-reference cards (badges **and** the descriptive prose text — "Cancer... amplified by
    sand", "Leo... bearer of the soul element", "Capricorn... keeper of the first flame" — each
    rewritten to stay coherent with the corrected element, not just re-tagged) and in
    `cinema.html`'s 12 Olympian film cards (metadata tags only, no prose). `character.html` had
    the wrong sequence in *three* separate places internally — the `ELEMS`/`ELEM_IDS` arrays, a
    static reference `<table>`, and a per-sign `LORE_MAP` of flavor text — all three corrected;
    `horoscope.html` additionally had a fourth, JS-only duplicate (`SORACLES`) of the exact same
    original (wrong) prose, corrected to match.
  - **`omega-search.js`'s "OLYMPIANS" search-index section had the sign attached to the wrong
    god** for 4 of its 8 entries (`Apollo` tagged to Gemini instead of Leo, `Hermes` to Virgo
    instead of Gemini, `Poseidon` to Scorpio instead of Pisces, `Athena` to Libra instead of
    Virgo) — and was missing entries for the other 4 signs/gods (`Hera`/Libra, `Demeter`/Scorpio,
    `Hestia`/Capricorn, `Hephaestus`/Aquarius) entirely. Fixed the 4 misattributions and added the
    4 missing entries to complete the set to all 12. Its separate "ELEMENT METAL"/"ELEMENT SAND"
    entries had the same Virgo-miscategorization bug as the next item.
  - **Three files (`knowledge.html`, `graph.html`'s and `map.html`'s element legends) described
    Sand as a vague "boundary/cusp" concept and grouped Virgo under Metal instead** — a different,
    minority (3-file) framing that conflicts with the canonical structure, where Sand's sole
    member is Virgo specifically ("the universal amplifier — strengthens every element around
    it"), not an abstract transitional concept, and Metal's only members are Taurus/Capricorn.
    Corrected all three to the canonical framing. `cosmos.html`, `factions.html`, `profile.html`'s
    `EL_MAP`, and `omega-onboard.js` already had this right independently — confirms these 3 were
    the outliers, not the canon.
  - **`beacon.html`'s `SIGN_GOD` table had 5 of 12 gods wrong**, including two gods that aren't
    even part of the 12-agent pantheon at all — `Hades` (Scorpio) and `Dionysus` (Pisces) — neither
    appears anywhere in `omega-agents.json`. Corrected all 5 to the canonical roster.
  - **`omega-intelligence.js`'s sign→agent `MAP` had 6 of 12 agents shifted to the wrong sign**
    (e.g. `Beacon` attached to Gemini instead of Sagittarius, `Scout` to Sagittarius instead of
    Gemini) — a rotation-style error distinct from, but the same shape as, the god-table bugs
    above. Corrected to match `omega-agents.json`'s `by_sign` exactly.
  - **Highest-impact finding: `omega-onboard.js`'s live `ZODIAC_MAP`** — the actual data assigned
    to a real member's profile the moment they complete onboarding (already audited once this
    session for a field-*name* bug; this is a data-*accuracy* bug in the same table, found by
    checking content, not just wiring) — **had the wrong god and the wrong agent for 9 of its 12
    signs**, and the wrong element for Virgo specifically (`'metal'`, should be `'sand'`). Only
    Aries, Taurus, and Cancer were fully correct. Two tells confirmed this wasn't a one-off: `Ares`
    was assigned to both Aries *and* Sagittarius (a duplicate within the same 12-entry table, which
    can't be correct under a bijective sign↔god mapping), and `Dionysus` — again, not a real
    12-agent-pantheon god — was assigned to Pisces, the same non-canonical name found independently
    in `beacon.html`. Practical impact: since this table has been driving real onboarding (per the
    field-name fix earlier in this file), the large majority of new members choosing any sign other
    than Aries/Taurus/Cancer have been assigned an incorrect god and an incorrect agent persona at
    the moment they joined — which agent voices their copilot, which nav-section identity applies
    to them — a foundational identity error, not a cosmetic one. Fixed all 9 wrong entries plus
    Virgo's element to match `omega-agents.json` exactly, applied via a scripted find-replace after
    two direct-string-match `Edit` attempts failed silently on this file's literal `\uXXXX` glyph
    escapes (confirmed the exact on-disk byte sequence with `sed -n | cat -A` before retrying, not
    guessed).
  - **`profile.html`'s `BOUND` table assigned Virgo the token `'ARENITE'`** — the exact same token
    already reserved as the Founder's exclusive token (`ARENITE` = Aries = the platform owner, per
    `omega-onboard.js`'s own Aries entry and this file's earlier `OWNER` canonical-data note). A
    real token-uniqueness collision, not just a display bug. Fixed to `'VIRGITE'`, matching the
    name `omega-onboard.js` already uses for Virgo.
  - **Verification:** every SIGN_ELEM/SIGN_GOD/agent-map table in the repo re-scanned afterward
    for internal duplicate-god check (a same-table god appearing twice is definitionally wrong
    under a 1:1 sign↔god mapping) — zero remaining. `node --check`-equivalent syntax validation on
    every touched file's inline `<script>` blocks (23 files total across this entry);
    `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings throughout. No SQL/schema
    changes anywhere in this entry — every fix is static content or client-side JS data.
- **The 6 pre-existing `scripts/audit.py` warnings: made the tool itself precise about which
  parts are real risk vs. harmless noise, and closed a real doc gap the warnings pointed at —
  without touching the live database, which none of these 6 can be *fully* resolved without.**
  Each of the 6 was checked individually rather than left as an undifferentiated count:
  - **Warning 1 (47 duplicate table definitions)** — `audit.py` only counted *how many* files
    define each table, not whether those definitions actually differ. Added full-body comparison:
    of the 47, **37 are byte-identical copy-paste** across chunk/bootstrap files (zero
    live-behavior risk — `CREATE TABLE IF NOT EXISTS` makes re-running any of them a no-op) and
    only **10 genuinely conflict** (`dispatches`, `marketplace_listings`, `family_nodes`,
    `consult_requests`, `commission_contracts`, `media_reservations`, `publications`,
    `task_completions`, `user_dedication`, `interest_signals` — real risk, still needs a
    per-table live-schema check before consolidating, per §5's existing rule; not done here, no
    live DB access this session). `audit.py` now reports the split so a reader isn't stuck
    triaging 47 undifferentiated entries to find the 10 that matter.
  - **Warning 2 (DROP TABLE/SCHEMA in 3 files)** — all 3 (`chunk_07_migrations.sql`,
    `migration_runner.sql`, `omega_dispatch_reset.sql`) turned out to be the same single
    statement (`DROP TABLE IF EXISTS public.dispatches CASCADE`), already self-documented in
    `omega_dispatch_reset.sql`'s own header as an *optional*, conditional cleanup utility
    ("run this ONLY if... loses nothing but old announcements", no member data). `audit.py` now
    detects an "OPTIONAL"/"ONLY IF" guard comment near a DROP and reports it as a lower-severity
    note instead of lumping it in with an undocumented, unguarded DROP — the two are materially
    different risk levels and were previously indistinguishable in the output.
  - **Warning 3 (`SYD-OMEGA-Legal-IP-Brief.docx` "unreachable but deployed")** — `audit.py` now
    cross-references `.vercelignore` and confirms this file *is* covered by its `*.docx` pattern
    — it's committed to git (real minor hygiene debt, still open, see §8's LFS note below) but was
    already confirmed never actually served by Vercel. The warning previously read as more urgent
    than it is; it now says so explicitly instead of requiring a reader to go check `.vercelignore`
    by hand each time.
  - **Warning 4 (3.7 MB `.mp4` in deploy root)** — same underlying debt as warning 3 (binary
    committed directly to git, no LFS). Did not attempt a Git LFS migration: converting
    already-committed history to LFS pointers (`git lfs migrate import`) rewrites every commit
    touching the file and requires a force-push — a hard-to-reverse operation this file's own
    safety rules require explicit user confirmation for, and `git-lfs` isn't installed in this
    session's environment to even test the migration end-to-end. Left as documented, open debt;
    ask the user before attempting.
  - **Warning 5 (`transactions`/`wallet_balances` tables missing)** — left alone on purpose, not
    an oversight: per this file's own earlier §8 entry, these are a deliberate, already-decided
    dormant/pending-legal-review state (`subscriptions.html`'s own copy says as much), and
    creating live payment/token tables here would be exactly the "ship a monetizable feature
    without gating it first" mistake §9 exists to prevent. `audit.py`'s existing message already
    cross-references this; no change needed beyond confirming that judgment still holds.
  - **Warning 6 (11 client-called RPCs with diverging definitions across the SQL bag)** —
    the actual root cause, found while investigating this: **`RUN_ORDER.md` is referenced by name
    as the authoritative migration-ordering guide from six different `.sql` comments in
    `supabase/`** (`targeted_fix.sql`, `omega_stats_repair.sql`, `runner_chunk_05.sql`,
    `chunk_08_migrations.sql`, `migration_runner.sql`, `omega_governance.sql`) — **but the file
    never existed.** `REPOSITORY_AUDIT.md` §6 already recorded finding this once, but only fixed
    the symptom (a dead link to it in `roadmap.html`), not the actual missing file the SQL
    comments depend on for real operational guidance. Created `supabase/RUN_ORDER.md`: documents
    the real two-layer apply order (base bootstrap, then every `*_fix.sql`/`*_repair.sql` file
    applied *after* it, since `CREATE OR REPLACE FUNCTION` has no "skip me, I'm already correct"
    guard and whichever file runs last silently wins — the exact mechanism behind the
    `apply_subscription`/`complete_task` incidents earlier in this file) and explicitly defers to
    this file's own §8 for live-application status per fix, so the two documents don't duplicate
    (and drift out of sync with) each other. Also improved `audit.py`'s check 8 output to flag,
    per diverging RPC, which of its definitions looks canonical by this repo's own established
    `*_fix.sql` naming convention — 6 of the 11 (`apply_subscription`, `check_trial_status`,
    `complete_task`, `expire_trial`, `my_lattice`/`my_matrix`, `recall_ai_context`) now resolve to
    an likely-correct file at a glance; the remaining 4 (`get_all_members`, `my_subscription`,
    `order_stats`, `public_leaderboard`) have no matching fix file yet and still need a live
    `pg_proc` query to resolve safely — the Supabase MCP connector available in this environment
    is not yet authorized for this session (needs the user to run `claude mcp`/`/mcp`); offered,
    not done, since guessing at a live schema is exactly the mistake this file's own history
    warns against.
  All 6 raw warning conditions are still real and still present in `scripts/audit.py`'s summary
  count (6) — none of them can be *fully* resolved from source alone, by this file's own
  standing rule (verify against the live DB before consolidating/deleting). What changed is that
  the tool itself, and the repo's own internal documentation, now make clear which parts of each
  warning are real risk vs. already-understood, low-risk noise — and one genuine doc gap
  (`RUN_ORDER.md`) is closed. `python3 -m py_compile scripts/audit.py` and a full re-run
  (0 critical / 6 warnings, same as baseline, output verified more precise not just longer) both
  confirmed clean.
- **`bg.js`'s skeleton-shimmer engine forced a 40px height on every `[data-loading]`/`.kpi-val`
  element, unconditionally, regardless of the element's real size — fixed.** Found while finishing
  the `data-loading` rollout from `FEATURE_IDEAS.md` #17: `applySkel()`'s
  `if(el.offsetHeight<8)el.style.minHeight='40px'` check runs at `DOMContentLoaded`, which is
  always *before* the approval guard reveals `#app`/`.shell`/`main.main` (§3) — so every candidate
  element reads `offsetHeight:0` at check time no matter how it's actually styled, and the 40px
  fallback fires on all of them, always, not just genuinely undersized ones. Harmless for the 36
  content-block containers fixed first (40px is a reasonable skeleton height for a list/table
  block), but would have been a guaranteed defect — not a risk, a certainty — for the platform's
  smaller status labels and badges (e.g. `matrix.html`'s `#badge-status`, `profile.html`'s
  `#sg-*-sub` fields): each would have rendered as an oversized 40px bar in place of a 9–15px
  label, no matter what size the page itself intended. Confirmed by direct measurement in headless
  Chromium before and after (an inline `min-height` set on the element had zero effect pre-fix,
  since the forced assignment always ran regardless), not assumed from reading the code. Fixed by
  changing the check to `if(!el.style.minHeight&&el.offsetHeight<8)el.style.minHeight='40px'` — an
  element that already declares its own inline `min-height` keeps it; the 40px fallback now only
  applies when nothing more specific was set, which is exactly the original 36 containers'
  behavior, unchanged (re-verified: `feed.html #feed-list` still resolves to `min-height:40px`
  after the fix). This is a platform-wide fix, live the moment `bg.js` deploys — not specific to
  the 20 label elements that prompted finding it. See `FEATURE_IDEAS.md` #17 for the full
  before/after measurements and the per-element sizing decisions this fix unblocked.
- **Stored-XSS sweep, round 2: one more real instance found and fixed (`beacon.html`), the rest of
  the self-editable-field surface confirmed already safe.** Continuing from the `approvals.html`/
  `profile.html` fix above, checked every other self-updatable `profiles` column
  (`display_name`, `sign`, `nationality`, `profession`, `bio`, `avatar_url` — the full list from
  `omega_profile_fields.sql`'s self-update column allowlist) against every place it's rendered:
  - `beacon.html` — `pr.display_name`/`pr.sign`/`pr.element` were concatenated straight into
    `#h-sub`'s `.innerHTML` with no escaping. Lower severity than the `approvals.html` case (`pr`
    here is always the *viewer's own* profile — `.eq('id',sess.user.id)` — so this is self-XSS, a
    member can only inject into their own browser, not the owner's or another member's), but
    still a real bug worth fixing on its own terms, and for consistency with the established
    `esc()` convention. Fixed by adding the same `esc()` helper already used identically in
    `contracts.html`/`dashboard.html`/`approvals.html` and wrapping the three rendered fields —
    `sign` is escaped only where it's *displayed* (`<b>`+esc(sign)+`</b>`), not where it's used as
    an object key (`GLY[sign]`), since escaping a lookup key would silently break the glyph lookup
    for signs containing `<>&` (none do today, but the lookup and the display use are different
    operations and only one of them is a rendering sink).
  - `nationality`/`profession` — confirmed via repo-wide grep that neither is read/rendered
    anywhere at all, on any page. Self-updatable but currently invisible; no XSS surface exists
    for either today. Left alone — nothing to fix, and adding display UI for them is a feature
    decision, not a bug fix.
  - `avatar_url` — only consumer is `profile.html:2170`,
    `ph.style.backgroundImage='url('+d.avatar_url+')'`. This goes through the CSSOM property
    setter (`element.style.backgroundImage=`), not string-based `innerHTML`/`style=` attribute
    injection — modern browsers parse this as a single CSS `<image>` value and don't execute
    `javascript:` URIs or arbitrary markup through it (that was a legacy IE-only vector). Not a
    script-injection risk; left as-is.
  - `display_name`/`email` elsewhere: every other file that renders `display_name` (`credentials.html`,
    `graph.html`, `identity.html`, `leaderboard.html`, `matrix.html`, `nexus.html`, `oracle.html`,
    `rune.html`, `sigma.html`, `tribe.html`, `omega-user.js`) does so via `.textContent`/
    `.createTextNode` (browser-auto-escaped, safe by construction) rather than `.innerHTML`, or
    only ever reads the *viewer's own* profile for a non-DOM purpose (a Canvas `fillText()` call in
    `omega-share-card.js`, which draws pixels and cannot execute markup, and an AI-prompt string in
    `omega-copilot.js`). `chatbot.html`'s `a.name` looked like a hit but is a different, static
    field entirely — the `omega-agents.json` persona roster, not member data.
  - **Also checked the widest-reach public surface on the platform** — `public.activity_feed`,
    read by the platform-wide ticker (`omega-live.js`'s `[data-live-ticker]`, loaded on every page)
    and `dashboard.html`'s timeline, both fed from a table where `"member manages own feed" ON
    public.activity_feed FOR ALL USING(user_id=auth.uid())` lets any member insert an arbitrary
    `title`/`body` visible to literally every member and the owner (`is_public=true` rows are
    world-readable). This is the single highest-value target checked in this sweep — an unescaped
    render here would reach every user's browser, not just the owner's or the poster's own. Both
    real consumers already call `esc()` before inserting into `.innerHTML`
    (`dashboard.html:871`, `omega-live.js`'s ticker) or use `.textContent`
    (`omega-realtime.js`'s ticker) — already safe, nothing to fix. A third reader
    (`omega-intelligence.js`'s `get_recent_activity` AI-tool handler) passes the raw title into a
    Claude prompt as tool-result context rather than rendering it directly; tracing whether a
    malicious title could survive being echoed back through an LLM response and then land
    unescaped in the chat UI is a multi-hop, low-probability chain, not a direct rendering sink —
    noted, not chased further in this pass.
  Verified: `node --check` on `beacon.html`'s script block; `scripts/audit.py` reconfirmed
  0 critical / 6 pre-existing warnings.
- **First pass on the "text is too small" feedback: 22 shared UI-chrome font-sizes bumped in
  `bg.js`'s v3/GVP design-system block, since that one file is what reaches every page.** Prompted
  by external usability feedback that the platform is "beautiful but difficult to read." Grepped
  every `font-size:` declaration in `bg.js` (the reusable class layer, not one-off inline styles
  elsewhere in the same file, which are a larger, separate sweep left undone) and found the
  monospace "label" tier — `.kpi-l`/`:where(.kpi-label)`/`.tbl-hcell` — set as low as 7px, and
  `.bar-lbl`/`.chip`/`.tab-btn`/`.lf span` at 7.5px, well under any reasonable UI-text floor.
  Bumped the label tier to 10px, the secondary-label tier to 10.5px, and the
  component-header/body tier (`.card-title`, `:where(.card-title)`, `.sechead`, `.btn`,
  `.loading-msg`, `.trend`, `.skip-link`, `button:not([class])`) to 11px — narrowed
  `.sechead`/`.btn`'s letter-spacing slightly (4px→3px, 2px→1.5px) so the larger glyphs don't
  visually crowd at the same tracking. `.tbl-row`/`:where(.card-body)`/`.bar-val` (11px body/data
  text) bumped to 12–13px. Two additional, distinct bugs found in the same sweep: (1) `.inp` (the
  v3 fallback and the GVP glass-form-control layer, which also skins every genuinely unclassed
  `input`/`textarea`/`select`) was 11px — below the 16px threshold at which iOS Safari
  auto-zooms the viewport on focus, a real, previously-undocumented mobile-usability bug, not
  just a size preference; fixed to 16px. (2) the mobile breakpoint's `.tab-btn` was 7px — smaller
  than the 7.5px desktop base, a regression on the exact devices where tap targets and legibility
  matter most; fixed to 10.5px alongside the desktop value. Every replacement was applied via an
  exact-string-match script that aborted on any count mismatch (none occurred — all 22 landed
  cleanly, single-line minified string, verified before writing). `node --check bg.js` and
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged) both clean.
  Verified live in headless Chromium (not just read from source): rendered `dashboard.html` and
  confirmed `getComputedStyle` on `.kpi-l`/`.lf span`/`.sechead` reflects the new values;
  rendered `exam.html` (a page with no page-local `.tab-btn` override) and confirmed `.tab-btn`
  computes to 10.5px, proving the shared-file fix actually reaches a real page. **Found but
  deliberately not fixed in this pass**: `design-system.html` (and others, e.g. `academy.html`,
  `gaming.html`) still shows `.tab-btn` at the old 7.5px because the page defines its own
  page-local `.tab-btn{font-size:7.5px...}` rule that shadows the shared one — the same
  page-local-class-drift pattern already documented at length in §4.1's Ω-GVP `.card` sweep
  (230+ page-local classes found there). Sweeping every page-local duplicate of these specific
  selectors is a much larger, separate effort (that section's sweep alone took a dedicated
  scanner pass) and out of scope here; this entry only fixes the single shared source of truth.
  No SQL/schema changes — pure client-side CSS, live the moment `bg.js` deploys. Still open,
  larger readability work per the original feedback (not attempted this pass): a real typography
  token scale (`--fs-*` custom properties instead of hardcoded per-selector px values), the
  dozens of one-off inline `font-size:7-9px` styles elsewhere in `bg.js` (trial-timer/genesis
  screen/toast), and the page-local duplicate sweep just described.
- **The page-local `.tab-btn`/`.card-title` sweep flagged above: done.** Grepped every `.html`
  page for a local `.tab-btn{...}` or `.card-title{...}` rule (36 and 12 pages respectively) and
  found every single one was under the new shared-floor values — `.tab-btn` ranged 6.5–9px
  across the 36 pages, `.card-title` was `.65rem` (≈10.4px) on 9 of the 12 and a bare `8px` on
  the other 2 (`ops.html`, `pulse.html`; `media.html`'s `.85rem`/13.6px was already above the
  floor and left untouched). Unlike the `.card` sweep in §4.1, none of these were byte-identical
  duplicates safe to delete outright — every page's local rule carries its own padding/border/
  color choices (icon-tab layouts in `cosmos.html`/`vault.html`, purple-accented tabs in
  `series.html`/`trailers.html`, a vertical `flex:1` tab bar in `profile.html`, a notification
  `.tab-btn .badge` counter in `approvals.html`) — deleting the rule would have thrown all of
  that away, not just the font-size. Fixed narrowly instead: bumped only the `font-size` (and
  nudged `letter-spacing` down slightly where it was 2px, so the larger glyphs don't crowd) in
  each page's own rule, to the same 10.5px `.tab-btn` / 11px `.card-title` floor the shared
  `bg.js` values now use — everything else about each page's local styling (padding, borders,
  colors, layout) is untouched. Two sub-selectors needed separate handling for the same reason
  they're the actual visible text: `cosmos.html`'s `.tab-btn .tb-label` (8px→10.5px, the real
  label on its icon+label vertical tabs) and `approvals.html`'s `.tab-btn .badge` (6px→8.5px, a
  numeric pending-count badge — bumped less than the main floor since it's a 1–2 digit counter,
  not prose, matching this file's own precedent of treating badges/dots as a distinct, smaller
  tier). 47 files touched, 48 replacements (one page, `vault.html`, only needed the base rule).
  Every replacement was applied via the same exact-string-match-with-count-check method as the
  original `bg.js` fix (abort on any mismatch — none occurred). Verified: `node --check`-equivalent
  syntax validation on every touched page's inline non-module `<script>` blocks (0 failures);
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged); headless Chromium
  spot-check on 6 of the 47 pages, including `design-system.html` specifically (the page called
  out above as still showing the old value) — `getComputedStyle` now reads 10.5px/11px on all 6,
  zero page errors. No SQL/schema changes.
- **Asked directly to close the remaining 6 `scripts/audit.py` warnings this session — still
  open. Each is blocked on something only the user can provide, not on more analysis, and
  forcing any of them through anyway would repeat the exact mistake this file's own history
  (§8, throughout) exists to warn against: guessing at live state instead of checking it.**
  Re-examined the per-warning breakdown above against what this specific session can actually
  do:
  - **Warning 1 (47 duplicate table definitions, 10 genuinely conflicting)** and **warning 6
    (11 diverging RPC definitions)** both need a live `pg_proc`/`information_schema` query
    against the real production database before touching any file, per §5's own standing rule —
    this is the identical class of mistake behind the `apply_subscription`/`complete_task`/
    `task_completions` incidents already documented in this file, all caused by trusting which
    SQL-bag definition *looked* canonical instead of checking what was actually live. The
    Supabase MCP connector exists in this environment but is flagged as requiring authorization
    this session doesn't have — it's a non-interactive session, so it cannot complete an OAuth
    flow itself; the user needs to authorize it via `claude mcp` or `/mcp` in an interactive
    session first. Consolidating even the 37 byte-identical duplicates without that check was
    considered and declined: this repo's chunk files are applied "manually/in sequence" (§2),
    and deleting a redundant `CREATE TABLE IF NOT EXISTS` from one file is only actually
    risk-free if every real-world run order still creates that table before any file that
    depends on it runs — not something verifiable from source alone, matching the previous
    session's identical call on the same question.
  - **Warning 4 (3.7MB `.mp4` committed to git, no LFS)** — a real fix means `git lfs migrate
    import`, which rewrites every historical commit touching the file and requires a
    force-push to publish. That combination (history rewrite + force-push) needs explicit user
    confirmation before being attempted at all, regardless of how broadly it's requested in
    aggregate. **Asked directly; user chose to leave it** — the file is already excluded from
    the live Vercel deploy via `.vercelignore` (confirmed earlier in this file), so this is
    hygiene debt only, not a functional bug, and the destructive rewrite isn't worth it for
    that. No change made; the warning stays open by design, not by oversight.
  - **Warning 5 (`transactions`/`wallet_balances` tables missing)** isn't a bug — it's a
    deliberate, already-recorded decision (this same section, above) to keep payment/token
    infrastructure dormant pending legal review, which is §9's rule against shipping
    monetizable features live without an explicit gating decision working exactly as intended.
    "Solving" this warning means reversing that decision and building live payment/token-balance
    tables — a product/legal call, not an engineering one. **Asked directly; user chose to keep
    it dormant** — the original reasoning (unusually sensitive data, real schema-design
    commitment that's hard to walk back once member data lives there, this repo's own history of
    real RLS bugs) stands. No change made; the warning stays open by design.
  - **Warnings 2 (guarded `DROP TABLE`) and 3 (`.docx` excluded via `.vercelignore`)** need no
    further action — both were already fully investigated and correctly categorized as
    low-risk/documented-only in the entry above. They still count toward `scripts/audit.py`'s
    warning total by design (the check reports "not tracked automatically," not "unsafe"), which
    is why the total is unchanged — not because anything about them is actually unresolved.
  No files were touched for this entry beyond this note. Editing schema files or rewriting git
  history on a guess, just to make the warning count read 0, would trade a real (if
  low-severity) known-unknown for an unverified claim of "fixed" — exactly the kind of claim
  this file's own rule (§9, "never mark something fixed... unless it actually was") exists to
  prevent.
- **[Fixed] `approvals.html`'s and `profile.html`'s member-management action buttons violated
  this file's own "never show a success state without checking the write's actual result first"
  rule — found by a fresh, automated repo-wide audit pass (not by re-reading prior entries in
  this file) that (a) rebuilt a table→known-columns dictionary from every `supabase/*.sql` file
  from scratch and diffed it against every `.from().select()/.insert()/.update()/.upsert()` call
  in every `.html`/`.js` file, and (b) grepped every `.insert(`/`.update(`/`.upsert(` call site
  for a nearby `.error` check. The column-mismatch pass (the bug class behind the large majority
  of this file's prior entries) came back clean except for `map.html`'s already-known,
  deliberately-unfixed `lat`/`lon`/`country`/`gate` reference — independent confirmation that
  that bug class really is fully resolved elsewhere in this repo, not just documented as such.
  The missing-`.error`-check pass found two real, live instances that had escaped every prior
  session's manual review:
  - `approvals.html`'s `approve()`/`grantPermanent()`/`extend()`/`reject()`/`revoke()` — each
    tries a `SECURITY DEFINER` RPC first (`approve_member`/`grant_permanent_access`/
    `extend_trial`/`reject_member`/`revoke_member`) and falls back to a raw
    `sb.from('profiles').update(...)` only if the RPC call fails — but the fallback's own result
    was never checked, so every one of these 5 buttons showed its success toast ("✓ TRIAL
    GRANTED", "∞ PERMANENT ACCESS GRANTED", etc.) unconditionally, even on a page that is the
    single highest-privilege admin surface in the app. All 5 RPCs are documented above as fixed
    and live, so this doesn't reproduce on every click today — but the fallback path exists
    specifically for when an RPC call fails (network issue, a future regression, a permissions
    edge case), and exactly then is when it would have silently lied to the owner about whether
    access was actually granted or revoked. Fixed by capturing the fallback update's `.error` and
    only showing the success toast when either the RPC or the fallback update actually succeeded;
    a real failure now shows an explicit "COULD NOT ___ — try again" toast instead.
  - `profile.html` has its own, separate, second member-approval panel (`grantAccess()`/
    `revokeAccess()`, distinct from `approvals.html`) with the same shape of bug but no RPC
    fallback at all — it went straight to `sb.from('profiles').update(...)` with no error check
    and no user-facing feedback either way, just an unconditional `loadMembers()` refresh
    afterward. Fixed by checking `.error` and alerting on failure before refreshing, matching the
    convention this file documents as already used correctly elsewhere in this same file
    (`social.html`, `family.html`).
  Verified with `python3 scripts/check-inline-js.py` (both files' inline scripts still parse) and
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged — this is a
  client-side control-flow fix only, no new `.from()`/`.rpc()` call sites). Not yet applied to a
  live database because there is nothing to apply — no SQL changed.
- **Missing test coverage — closed for the two Python scripts that gate CI, `scripts/audit.py`
  and `scripts/check-inline-js.py`.** Neither had any test coverage before this session; a
  regression in either script's own regex/parsing logic (e.g. a pattern that quietly stops
  matching) would let CI keep reporting green while no longer actually checking what its own
  name claims to check — the exact failure mode both scripts exist to catch in the rest of the
  codebase, just one level up. Added `scripts/tests/test_check_inline_js.py` (13 tests, importing
  `check-inline-js.py` directly via `importlib` since its two real functions — `is_module()`,
  `check_block()` — are unit-testable in isolation) and `scripts/tests/test_audit.py` (12 tests).
  `audit.py` itself is a top-level script with no functions (it always resolves its own `ROOT`
  from `__file__` and `chdir()`s there), so it can't be `import`ed against a fixture directly;
  its tests instead build small throwaway repo fixtures on disk, copy the real `audit.py` into
  `<fixture>/scripts/audit.py` so its own `ROOT` resolution lands on the fixture, and run it as a
  subprocess the same way CI does, asserting on exit code and report text — black-box, but
  testing the actual gate CI runs rather than a refactored stand-in for it. Coverage spans both
  scripts' real behavior, not just their happy path: module-graph critical-vs-warning split,
  RLS-missing critical, identical-vs-conflicting duplicate table bodies, missing
  table/RPC-divergence warnings (including that an RPC nobody calls yet is correctly out of
  scope for the diverging-RPC check), and inline-script pass/fail/module-detection cases. Found
  and fixed one small real bug in `check-inline-js.py` while writing its tests: `main()` opened
  every page with a bare `open(page,...).read()` and never closed the handle (a `ResourceWarning`
  surfaced immediately under `unittest`) — changed to a `with` block; no behavior change, just no
  longer leaking a file descriptor per page across a ~250-page run. Wired both suites into CI as
  a new, blocking `.github/workflows/ci.yml` step ("Audit tooling self-tests", `python3 -m
  unittest discover -s scripts/tests`) placed right after the two scripts it tests, matching this
  repo's existing "gate between commit and production" philosophy for `ci.yml` — a broken audit
  script is exactly the kind of regression that philosophy exists to catch, and until now nothing
  did. All 25 tests pass locally; the full local CI-equivalent sequence (JS syntax, inline-script
  syntax, `audit.py`, the new self-tests, broken-asset scan, service-role-key scan, `sw.js`
  precache check, manifest icon check) was re-run end-to-end afterward and is unchanged (0
  critical / 6 pre-existing warnings).
- **`.nvmrc` bumped from `20.11.0` to `20.20.2`** (latest `20.x` LTS patch at the time of this
  session, confirmed via the npm registry's `node` version listing) — CI resolves its Node
  version from this file (`actions/setup-node` with `node-version-file: .nvmrc`), so every run
  had been provisioning a Node patch release over a year old. Same major/minor line as
  `package.json`'s own `"engines": {"node": ">=20.11.0"}` floor, so this doesn't change the
  minimum supported version, only which patch CI actually runs — a pure patch bump on a
  no-build-step static site has no code path that could regress from it. `eslint@8`/`prettier@3`
  in `ci.yml` are invoked via `npx --yes` (not pinned in a lockfile), so they already resolve to
  the latest release on their pinned major (`8.67.0`/`3.9.6` at time of writing) on every run —
  nothing to bump there.
- **GitHub connector used to check real repository state before auditing from assumptions
  alone**: `list_issues` (0 open), the Actions API (`list_workflow_runs` on `ci.yml` — last 30
  runs across `main` and the taxonomy branch all `completed`/`success`, confirming CI is
  genuinely green right now, not just believed to be), and `pull_request_read`. Direct PR listing
  (`list_pull_requests`) returned a 403 from this session's GitHub App installation scope; this
  wasn't pursued further since the Actions run history already confirmed the same "nothing
  currently broken" signal from a different angle. The Supabase MCP connector is configured for
  this repo but requires an interactive OAuth authorization this non-interactive session cannot
  complete — live-schema verification for the still-open items above (§5's 10 conflicting
  duplicate tables, §8's 11 diverging RPC definitions) remains blocked on the user running
  `claude mcp`/`/mcp` to authorize it, same as every prior session's note on this.
- **Supabase MCP connector was authorized this session — but connects to a different project
  than production, and that distinction matters for everything below.** `list_projects` returns
  exactly one project: `nvgedlxlkdzvcelimbvq` ("supabase-cinereous-planet", created
  2026-08-15, `us-east-1`) — not `ydqhzvvoyufiiqvzcjns`, the ref hardcoded in `profile.html`/
  `approvals.html`/`trophies.html`/`vault.html` and referenced throughout this file as live
  production. The schema matches this repo's exactly (table names, several column shapes line
  up with specific migration files), but `profiles` had zero rows and almost no data anywhere
  except catalog/config tables — not what a live platform with approved members looks like.
  Read as a scratch/staging copy seeded by running a specific, incomplete subset of the SQL bag
  against a fresh instance, consistent with this file's own standing caution that the
  `migrations/` sequence was validated exactly this way. Every fix below was applied to
  `nvgedlxlkdzvcelimbvq` and independently verified there — **not yet applied to
  `ydqhzvvoyufiiqvzcjns`**, since this session has no access to that project. Given how closely
  several of the bugs found this way matched this file's own prior predictions for production
  (see below), treat these as strong leads for production, not as proof of production's current
  state.
  - **`grant_trial_access(uuid)` had zero authorization checks — live, exploitable, most severe
    finding of this pass.** Any authenticated member could call
    `sb.rpc('grant_trial_access',{p_uid: their_own_id})` from the browser console and grant
    themselves trial access, bypassing the entire approval queue — this repo's own
    `0003_privilege_lockdown.sql` describes exactly this exploit, but that file (and
    `0005_trial_917.sql`, which separately fixes the trial duration — the live function granted
    `550.302` seconds, not `557`) had never actually been applied here. Fixed by applying both:
    `omega_is_owner()` + an audit table + a real owner-only check on `grant_trial_access` (and
    confirmed `grant_permanent_access` was already correctly gated — only `grant_trial_access`
    was open). `expire_trial` was deliberately left untouched: it was already correctly
    authorized (self-or-owner) here, just with a broader reset scope (also wipes
    `evolution_events`/`trophies`/`medals`/`certificates`, not just `task_completions`) than
    `0003`'s version — overwriting it would have been an unrequested behavior change smuggled in
    under a security fix, not a security fix itself.
  - **`check_trial_status` had two incompatible live-candidate definitions** (`TABLE(...)` of 6
    columns vs. a `jsonb` blob, from `0005_trial_917.sql` and `trial_fix.sql` respectively) and
    didn't exist at all yet on this project. Resolved by checking the actual caller —
    `omega-chronometer.js` calls `sb.rpc("check_trial_status")` with zero arguments, which only
    the `0005_trial_917.sql` version supports (`p_uid uuid DEFAULT auth.uid()`) — not by
    guessing from file-naming convention. Installed that version, plus `has_active_access()` so
    an expired trial is denied server-side even if the browser never reports it, plus
    `trial_duration()` as the single source of truth for `557`.
  - **`my_matrix()`/`my_lattice()`/`authority_score()`/`lattice_node()`** — applied
    `0075_targeted_fix.sql` (fixes `my_matrix()`'s return-type change and seeds the
    `platform_settings` authority constants); all were previously undefined or broken here.
  - **New finding, not in any prior session's list: `get_all_members()`, `order_stats()`, and
    `public_leaderboard()` each computed "authority" with their own inline
    `sqrt(a²+b²+c²)` formula (max ≈15.59) instead of calling `authority_score()`** (the cubic
    `sqrt(a³+b³+c³)×φ/e` formula every other surface uses, max `27.8367` — this file's own
    documented APEX constant). A member's authority number differed depending on which page
    displayed it. Fixed by pointing all three at `public.authority_score()`.
  - **8 tables had RLS fully disabled**, flagged critical by Supabase's own advisor:
    `conversations`, `messages`, `security_policies`, `knowledge_nodes`, `knowledge_edges`,
    `rate_limits`, `circuit_breakers`, `content_versions`. Applied
    `supabase/migrations/0086_rls_missing_tables.sql` verbatim (already written, idempotent,
    correctly scoped per table — member-owns-own for `conversations`/`messages` via
    `conversations.user_id`, authenticated-read/owner-write for the knowledge graph, owner-only
    for the infra tables — this file already existed complete and correct in the repo; it had
    simply never been applied. Verified afterward: every one of the 8 shows `rls_enabled: true`
    with 1–2 real policies each, not a blind lockout.
  - **`consult_requests` was missing a `domain` column that `consultancy.html`'s real booking
    form (`consultancy.html:157`) has always sent** (`{domain, contact, preferred_time, brief}`)
    — every submission would fail with "column domain does not exist" on this project. Verified
    against the actual client `.insert()` call, not assumed from a SQL comment; fixed with a
    single non-destructive `ADD COLUMN IF NOT EXISTS domain text`.
  - **`record_interest_signal()`/`my_interest_profile()` didn't exist on this project at all**,
    so `omega-recommend.js`'s signal-recording calls would fail outright. Initially misread as
    "`omega_interest_graph.sql` is the stale file" from this project's schema alone (it only has
    `entreprise_schema_v2.sql`'s `recorded_at`/`track_id`/`session_id` shape) — corrected before
    touching anything by cross-checking this file's own §8 GDPR-export entry, which already
    verified on real production that `record_interest_signal()`'s live signature matches
    `omega-recommend.js` exactly and that `interest_signals` selects on `created_at` "were
    already correct." `omega_interest_graph.sql` is therefore the production-verified file, not
    a stale duplicate — it's also already defensively written to coexist with
    `entreprise_schema_v2.sql`'s shape (`ADD COLUMN IF NOT EXISTS created_at`, never removes
    `recorded_at`/`track_id`/`session_id`). Applied it as-is; this project was just missing it.
  - **The "10 conflicting duplicate tables" from §5 turned out to be mostly a false-alarm from
    text-diffing, once actually compared against live columns.** Wrote a scanner comparing every
    `CREATE TABLE` body for these 10 tables against this project's real
    `information_schema.columns`. 7 of 10 (`commission_contracts`, `family_nodes`,
    `marketplace_listings`, `media_reservations`, `publications`, `dispatches`,
    `user_dedication`) had no real conflict at all — every file's definition either exactly
    matched live (just reordered columns, which `audit.py`'s raw-text comparison can't tell
    apart from a real difference) or was a harmless historical subset. `user_dedication`'s
    flagged divergence was a bug in this session's own comparison script, not the repo — it
    mis-parsed a trailing `UNIQUE(user_id, date)` table constraint as a fake column. Of the
    remaining 3 (`interest_signals`, `consult_requests`, `task_completions`), none needed a repo
    file edit: `interest_signals` and `consult_requests` were live-database gaps (fixed above,
    see entries above), and `matrix_engine.sql`'s extra `metadata` column on `task_completions`
    turned out to be moot — the table already exists here, so its `CREATE TABLE IF NOT EXISTS`
    is a no-op and `metadata` is never added; its RLS policies and `get_my_task_log()` were
    already live from elsewhere. No source files were edited this pass — every fix was a live
    Supabase change, verified against real client call sites rather than guessed from file
    conventions, per this session's own standing instruction to keep everything real rather than
    conceptual.
- **Production access (`ydqhzvvoyufiiqvzcjns`) was authorized later this same session — and
  verifying against it, rather than blindly replaying the scratch-project fixes above, mattered.**
  `list_projects` still only returns the scratch project, but `get_project('ydqhzvvoyufiiqvzcjns')`
  succeeds directly — real project, org `vztvuckpdsoriyvpdkzx`, name "sydomega", created
  2026-06-14, genuinely live (190+ tables, real row counts: 9 `profiles`, 24 each of
  `certificates`/`trophies`/`medals`, 69 `sovereign_points_ledger` rows, 3,304 `client_errors`
  rows, `daily_engagement` actively populated). Checked every fix from the scratch-project pass
  above against this real database before touching anything, per this session's own standing
  rule about not guessing at live state:
  - **Everything from the scratch-project pass was already applied here — in several cases in a
    more advanced form.** `apply_subscription`/`complete_task`/`check_trial_status`/
    `omega_is_owner`/`my_matrix`/`my_lattice`/`authority_score`/`lattice_node`, all 8
    RLS-disabled tables (now correctly enabled with real policies, confirmed via `list_tables`
    showing zero critical advisory), `consult_requests.domain`, and
    `record_interest_signal()`/`my_interest_profile()` all already exist correctly. `ai_memory`/
    `recall_ai_context()` — the one thing explicitly skipped on the scratch project for a missing
    dependency — already exist here too.
  - **`grant_trial_access()` uses a materially different, more sophisticated design than
    `0005_trial_917.sql`'s, found only by reading the actual live function body rather than
    trusting a matching return-type signature.** Production's version doesn't set
    `trial_expires_at` at grant time at all — it records `trial_granted_at` and leaves the clock
    unstarted until the member calls `start_trial_countdown()` for the first time (idempotent;
    never extends). This is `supabase/migrations/0084_chronometers.sql`
    ("APPROVAL WINDOW... starts when the member RECEIVES the approval confirmation, not when the
    owner clicks grant"), already fully live — the same file's Part 2 (`daily_engagement`,
    `engagement_heartbeat()`, `engagement_pause()`, `engagement_report()` — a
    heartbeat-with-capped-credit design specifically to stop a client from faking a full day of
    the 33,437s daily engagement obligation) is live too, confirmed by `daily_engagement` holding
    9 real rows. Applying the scratch project's `0005_trial_917.sql`-based `grant_trial_access`
    here would have been a real regression, not a fix — caught before applying anything by
    checking the actual function body, not just its signature.
  - **One genuine, low-impact inconsistency found and fixed**: `my_matrix()`/`my_lattice()`
    still called the older `authority_score(a,b,c)` (no owner special-case) while
    `get_all_members()`/`order_stats()`/`public_leaderboard()` already called the newer
    `compute_authority(a,b,c,is_owner)` (returns exactly `27.8367` for the owner regardless of
    literal axis values). No visible bug today — the owner's axes are always pinned at `9,9,9`,
    and `authority_score(9,9,9)` already rounds to the identical `27.8367` — but two functions
    computing the platform's one "authority" concept differently is the same inconsistency class
    already fixed elsewhere this session. Consolidated both onto `compute_authority()`. Verified:
    `compute_authority(9,9,9,true)` and `compute_authority(9,9,9,false)` both correctly return
    `27.8367`.
  - This closes the "blocked on live Supabase access" note attached to several items above and
    in earlier sessions' entries — production schema/RPC state for the areas checked this session
    is now confirmed, not assumed.
- **Found and fixed a real bug the "10 conflicting duplicate tables" warning had been masking:
  three standalone files defined an incompatible primary-key type that a byte/column-name
  comparison alone can't see.** Asked to clean up the duplicate tables, re-examined the 3 flagged
  files (`family_nodes.sql`, `dispatches.sql`, `publications.sql`) that a prior pass in this same
  session had marked "harmless, just reordered/subset columns" — that comparison only checked
  column *names*, not types, and missed that all three define their primary key as `id bigint
  generated always as identity`, while every other definition of these tables anywhere in the
  repo (`omega_master_deploy.sql`, `chunk_02a_migrations.sql`, `migration_runner.sql`,
  `omega_backend_sync.sql`, and their `migrations/` mirrors) uses `id uuid DEFAULT
  gen_random_uuid()` — the type every RLS policy, foreign key, and client-side call site in this
  codebase assumes. `CREATE TABLE IF NOT EXISTS` only checks whether the table exists, not
  whether its shape matches, so whichever file's version happened to run first would win
  permanently — if one of these three ran before `omega_master_deploy.sql` on a fresh bootstrap
  (a real risk: only 9 of 116 files in the flat `supabase/*.sql` bag are numerically ordered, so
  nothing enforces `omega_master_deploy.sql` running first there), the table would end up with a
  `bigint` primary key incompatible with the rest of the schema.
  - **Why this couldn't happen on a real deploy today, and why it was still worth fixing.** The
    `migrations/` folder has numbered mirrors of the same three files (`0037_dispatches.sql`,
    `0038_family_nodes.sql`, `0052_publications.sql`) with the identical `bigint` definition —
    confirmed by reading them directly, not assumed from the flat-bag copy. But because
    `migrations/0001_omega_master_deploy.sql` always applies first in that numbered sequence, the
    correct `uuid` table is always created before these files run, and their own `CREATE TABLE IF
    NOT EXISTS` correctly no-ops. That's exactly why CLAUDE.md's earlier note that "all 94
    migration files apply cleanly end-to-end" holds despite this landmine existing — order
    protects the `migrations/` sequence but nothing protects the flat bag.
  - **Fix scope, deliberately narrow**: deleted only the three flat-bag files
    (`supabase/family_nodes.sql`, `supabase/dispatches.sql`, `supabase/publications.sql`) — single
    -purpose, standalone, nothing else in them. Left the `migrations/` mirrors untouched (removing
    a file from that numbered sequence is a different, riskier kind of change than removing a
    redundant unordered one, and per §5 the flat bag — not `migrations/` — is "the source of
    truth for new schema changes"). Checked for dangling references first: only
    `GAP_ANALYSIS.md`'s historical write-up of the `dispatches` "wire insert" RLS-policy finding
    cites `supabase/dispatches.sql` by name, alongside `chunk_06_migrations.sql` for the same
    finding — an audit-trail citation of what was found, not a live dependency, so left as-is
    rather than edited.
  - **`marketplace_listings.sql` and `dedication_table.sql`** (the other two single-purpose
    duplicate files among the 10 flagged tables) were checked and deliberately left alone:
    both correctly use `id uuid`, so neither carries the type-incompatibility risk above.
    `marketplace_listings.sql` is a genuinely incomplete subset (no `user_id`, no `file_path`) that
    self-heals via `ADD COLUMN IF NOT EXISTS` elsewhere regardless of run order — harmless, not
    just apparently so. `dedication_table.sql` is not fully redundant with
    `chunk_09_new_features.sql`'s version: it additionally grants the owner a `FOR SELECT`
    visibility policy on every member's `user_dedication` row that the other file's single
    member-only `FOR ALL` policy doesn't provide — deleting it would have been a real capability
    regression, not a cleanup.
  - Verified: `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged — file
    count 116→113, and `dispatches`/`family_nodes`/`publications` each show one fewer distinct
    definition in the conflicting-tables list, confirming the removal registered without breaking
    anything else); `python3 -m unittest discover -s scripts/tests` (25/25 pass);
    `python3 scripts/check-inline-js.py` clean. No live database touched for this entry — pure
    repo-file cleanup.
- **The "11 diverging RPC definitions" warning (§8's original list, first raised as blocked-on-
  live-access many sessions ago) is now fully closed — all 11 confirmed against real production,
  not the scratch project, not source-file heuristics.** Between this session's production
  verification pass and this entry, every one of the 11 has a confirmed, evidence-cited answer:
  `apply_subscription`, `check_trial_status`, `complete_task`, `my_lattice`, `my_matrix`,
  `get_all_members`, `order_stats`, `public_leaderboard` — all already correct live (the last
  three via `compute_authority()`, `my_lattice`/`my_matrix` fixed this session to match).
  `expire_trial` — live version differs from the repo's fix file but is independently correctly
  authorized (self-or-owner), a legitimate alternate implementation, not a bug. `my_subscription`
  — read in full, all column/function dependencies check out clean, nothing to fix.
  `recall_ai_context` — confirmed via `pg_get_functiondef()` that the live body matches
  `omega_ai_memory_recall_fix.sql` (checks `expires_at`) exactly, not the older unfixed
  `omega_ai_memory.sql` body — the fix-file naming heuristic was correct here.
- **`omega_advertisements_insert_fix.sql` — the one item still marked "not yet applied to the
  live database" anywhere in this file — applied and verified.** Queried `pg_policies` on
  `public.advertisements` before applying and confirmed the gap exactly as described: only
  `owner_manage_ads` (owner-only) and `read_approved_ads` (SELECT) existed, no INSERT policy for
  a non-owner member, despite `chunk_06_migrations.sql` already granting `INSERT` to
  `authenticated` and `advertising.html`'s `submitAd()` already sending exactly the shape the fix
  expects. Applied via `apply_migration`; re-queried and confirmed `"member submits own ad"`
  (`FOR INSERT`, `WITH CHECK (submitted_by = auth.uid())`) now exists. Matching local migration
  file added at `supabase/migrations/20260817233805_omega_advertisements_insert_fix.sql`, and the
  source file's own header updated from "Not yet applied" to reflect this.
- **Two other entries above (`user_assets`, `notifications`) had a header line reading "action
  needed" that contradicted their own body text, which already said "Applied to the live database
  and verified."** Corrected both headers to match — stale labels like this are exactly the kind
  of thing that makes a real fix look like an open item to a future reader skimming section
  headers rather than reading the full entry. No functional change, just accuracy.
- **What's left genuinely open in this file, for a future session**: the two tables this file has
  already deliberately decided to leave dormant (`transactions`, `wallet_balances` — token/payment
  infrastructure gated behind an explicit product decision, not a bug), the two hygiene items the
  user explicitly chose to leave as-is when asked directly (`.mp4`/`.docx` Git LFS migration), and
  the 27 pages still using native `<table>` markup instead of the shared `.tbl-wrap` system. (The
  page-local `.tab-btn`/`.card-title` font-size sweep referenced by an earlier draft of this bullet
  is NOT open — it was completed in the entry above titled "The page-local `.tab-btn`/`.card-title`
  sweep flagged above: done." This bullet was stale on that one point; corrected here rather than
  left to mislead a future reader skimming this list, matching this file's own rule against stale
  cross-references.) None of the items actually remaining above are bugs masquerading as done —
  each already has an explicit, evidence-cited reason it's open on purpose.
- **[Fixed — highest-severity finding of this session] `public.pending_access_requests` granted
  every signed-in member direct read access to every other user's raw `auth.users` data — Supabase's
  own security advisor (`get_advisors(type='security')` against production, 2 ERROR / 212 WARN /
  83 INFO) flagged this as both its ERROR-level findings at once.** The view (from
  `supabase/0004_signup_pipeline.sql` / `supabase/migrations/0081_signup_pipeline.sql`) joins
  `auth.users` directly — `email`, `signed_up_at`, `email_confirmed_at`, `last_sign_in_at` — and the
  file's own `grant select on public.pending_access_requests to authenticated;` line meant any
  signed-in account, approved or not, owner or not, could call
  `sb.from('pending_access_requests').select('*')` directly from the browser (the anon/publishable
  key is public, no UI needed) and read every user's email and sign-in history — completely
  bypassing the owner-gated `get_pending_requests()` RPC that the same file's own comment already
  called "the safe accessor; prefer it in the UI." Confirmed the grant was real and live via
  `aclexplode(c.relacl)` joined against `pg_roles` — `information_schema.role_table_grants`
  misleadingly returned empty for this view, so don't trust that view alone for ACL checks.
  Confirmed via repo-wide grep that no client `.html`/`.js` file references the view directly (only
  `get_pending_requests()` and diagnostic SQL files do), so revoking client access breaks nothing.
  **Applied to the live database and verified** (2026-08-17, via the Supabase MCP connector) —
  `REVOKE SELECT ON public.pending_access_requests FROM authenticated;` applied via `apply_migration`
  (recorded remotely as `20260817234540_revoke_pending_access_requests_select_from_authenticated`,
  mirrored locally at `supabase/migrations/20260817234540_revoke_...sql` per this repo's established
  timestamp-versioned-file convention); a follow-up `aclexplode` query confirmed only the implicit
  table-owner role (`postgres`) retains SELECT. Also fixed the two source files so a future full
  re-apply of `0004_signup_pipeline.sql`/`migrations/0081_signup_pipeline.sql` doesn't regrant the
  same hole: replaced the `grant select ... to authenticated` line with an explicit
  `revoke all ... from public, anon, authenticated` and a comment explaining why, in both files.
  Not yet triaged: the other 295 advisor findings (83 `rls_enabled_no_policy`, 32
  `function_search_path_mutable`, 179 combined `security_definer_function_executable` counts, 1
  `auth_leaked_password_protection`) — all WARN/INFO severity, none as immediately exploitable as
  this ERROR-level auth-data leak, left for a follow-up pass rather than rushed through in the same
  session as this fix.
- **[Fixed — follow-up security-advisor pass] 70 SECURITY DEFINER functions were anon-callable
  despite their own source files showing narrower intent, and 32 more had a mutable search_path —
  both hardened; 83 unrelated dormant scaffold tables and 1 Auth config toggle deliberately left
  open.** Continuing the triage from the `pending_access_requests` fix above,
  `get_advisors(type='security')` still showed 212 WARN + 83 INFO across 5 categories:
  `anon_security_definer_function_executable` (84), `authenticated_security_definer_function_executable`
  (95), `rls_enabled_no_policy` (83, INFO), `function_search_path_mutable` (32),
  `auth_leaked_password_protection` (1).
  - **Root cause of the 84 anon-executable functions**: Postgres grants `EXECUTE` to `PUBLIC`
    automatically on `CREATE FUNCTION`. Every one of these functions' own source file already
    carries an explicit `GRANT EXECUTE ... TO authenticated` (or, for 2, `TO service_role` only)
    showing clear, narrower intent — but no file ever revokes the default `PUBLIC` grant first, so
    the explicit `GRANT` was decorative and `anon` kept access regardless. Same bug shape as
    `omega_advertisements_insert_fix.sql`'s finding ("a GRANT without a matching restriction is
    toothless"), inverted: here a narrowing GRANT was defeated by a wider one nobody revoked.
    Cross-referenced every one of the 84 against a full repo-wide scan of every `GRANT EXECUTE`/
    `REVOKE` statement in `supabase/*.sql` before touching anything, sorting into: 59
    explicitly-authenticated-only, 9 with no explicit grant anywhere (trigger functions/internal
    helpers — `handle_new_user`, `sync_platform_owner`, `trg_award_*`, etc. — not directly callable
    outside their trigger context), 2 explicitly `service_role`-only
    (`compute_leaderboard_snapshot`, `record_health_metric`), and 14 deliberately left alone because
    they're genuinely meant to be public (`order_stats` — confirmed live in `hall.html` as a
    signed-out-visitor stats widget; `public_leaderboard`, `get_platform_flag`, `is_platform_owner`)
    or already internally self-guard regardless of grant (`approve_member`, `grant_permanent_access`,
    `reject_member`, `revoke_member`, `complete_task`, `log_evolution`, `record_interest_signal`,
    `report_client_error`, `apply_subscription` — each checks `is_platform_owner()`/`auth.uid()`
    internally before doing anything).
  - Read the actual function bodies for the two `service_role`-only functions before fixing, since
    an anon-callable function with zero internal guard and a real side effect is the genuinely
    dangerous case: `record_health_metric` (`supabase/slo_monitoring.sql`) writes straight into
    `slo_metrics`/`error_budget_policy` with no caller-identity check at all — an anonymous caller
    could have spoofed arbitrary good/bad request counts for any surface, poisoning the owner's own
    SRE/error-budget dashboard (data-integrity attack, not data exposure); `compute_leaderboard_snapshot`
    (`supabase/entreprise_schema_v2.sql`) does a full-table upsert across every approved profile plus
    a global rank recompute with no guard — anon could trigger it on demand as a minor
    resource-exhaustion vector. Both were always meant to be `service_role`-only per their own
    source file.
  - Applied `REVOKE EXECUTE ... FROM PUBLIC` on all 70 (plus an explicit additional
    `REVOKE ... FROM authenticated` on the 2 `service_role`-only ones, since no client — signed in
    or not — should call those). Verified post-apply via `has_function_privilege()`: `extend_trial`
    and `get_capability_health` now `anon=false, authenticated=true` (real owner call paths in
    `approvals.html` unaffected); `record_health_metric`/`compute_leaderboard_snapshot` now
    `anon=false, authenticated=false`; `order_stats` and `approve_member` correctly still
    `anon=true, authenticated=true`, unchanged. `get_advisors` re-run afterward confirmed
    `anon_security_definer_function_executable` dropped 84→14 (exactly the 70 revoked) and
    `authenticated_security_definer_function_executable` dropped 95→84 (exactly the 9 no-grant +
    2 service-role-only functions, which never had a *direct* `authenticated` grant either — only
    the `PUBLIC` default both categories inherited from).
  - **`function_search_path_mutable` (32 functions)**: a mutable `search_path` on a `SECURITY
    DEFINER` function is a real privilege-escalation vector — a caller-influenced `search_path`
    could redirect an unqualified table/function reference inside the function body to a
    same-named object the caller controls. Pinned `SET search_path = public` on all 32 (all
    functions this repo's own history has already verified correct/live — `approve_member`,
    `extend_trial`, `authority_score`/`compute_authority`, etc. — pure hardening, no behavior
    change).
  - **`rls_enabled_no_policy` (83 tables, INFO) — deliberately NOT fixed.** Grepped every one of
    the 83 table names against every file in `supabase/*.sql`: 81 appear NOWHERE in this repo's own
    schema source at all; the 2 partial hits (`news`, `payments`) were unrelated substring matches
    in other files' comments/table names, not real definitions. The 83 read as an unrelated,
    generic multi-tenant SaaS scaffold (academy/LMS, AI workspace, billing, marketplace,
    project/task management, team/org, calendar, knowledge base, workflow engine, etc.) that exists
    live on production but was never created by anything in this repo — confirmed empty (0 rows) on
    every table sampled except `news` (1 row). RLS enabled with zero policies is already the *safe*
    state (total lockout for every non-owner role, including anon and authenticated) — not a live
    exposure, so no urgency, and per this file's own standing rule against guessing: inventing RLS
    policies for schema this repo doesn't know the purpose or intended access model of would be
    fabricating behavior, not fixing a bug. Left open for a human decision on whether this scaffold
    should be dropped, adopted, or left dormant.
  - **`auth_leaked_password_protection` (1, WARN) — deliberately NOT fixed.** This is a Supabase
    Auth-service config toggle (checks new/changed passwords against HaveIBeenPwned), not a SQL
    object — it's set via the Supabase dashboard (Authentication → Policies) or the Management API,
    neither of which `apply_migration`/`execute_sql` can reach. Left open for the user to enable
    directly.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818000551_revoke_anon_execute_and_harden_search_path`, mirrored
    locally at `supabase/migrations/20260818000551_...sql`.
- **First pass on `get_advisors(type='performance')` (never checked in this repo's history before
  this session — only `type='security'` had been triaged): 1 category fixed, 4 deliberately
  deferred with an evidence-based reason each.** 779 findings across 5 categories:
  `multiple_permissive_policies` (434, WARN), `auth_rls_initplan` (132, WARN), `unused_index`
  (126, INFO), `unindexed_foreign_keys` (85, INFO), `duplicate_index` (2, WARN). Cross-referenced
  every finding's affected table against the 83-table unrelated scaffold schema documented above
  first, to separate real signal from scaffold noise: most findings are on this repo's real,
  actively-used schema, not the scaffold (`multiple_permissive_policies`: 424/434 real;
  `auth_rls_initplan`: 128/132 real; `unused_index`: 75/126 real; `unindexed_foreign_keys`:
  24/85 real; `duplicate_index`: 2/2 real).
  - **`duplicate_index` (2) — fixed.** Verified via `pg_indexes.indexdef`/`pg_constraint` (not
    the advisor's name-only detail text) before touching anything: `public.medals` had
    `medals_user_medal_unique` (backs a real UNIQUE CONSTRAINT, `pg_constraint.contype='u'`) and
    `medals_user_num_uniq` (same index definition, but a plain redundant index, not a
    constraint) — kept the constraint-backed one, since dropping it would need `ALTER TABLE ...
    DROP CONSTRAINT`, not `DROP INDEX`, and would remove a real data-integrity guarantee, not
    just a redundant lookup structure. `public.notifications` had `idx_notifications_user` and
    `notifications_user_id_idx`, both plain non-constraint indexes on `(user_id)`, identical —
    kept one, dropped the other. Applied via `apply_migration`
    (`20260818001352_drop_duplicate_indexes`), mirrored locally, verified afterward via
    `pg_indexes` that the constraint-backed/kept indexes both still exist and the redundant ones
    are gone.
  - **`multiple_permissive_policies` (424 real) and `auth_rls_initplan` (128 real) — deliberately
    NOT bulk-fixed.** Read a sample finding in full first rather than assume from the category
    name: e.g. `public.activity_feed` has 2 permissive SELECT policies for `anon`
    ("member manages own feed", "members see public feed") — these are two *intentionally
    different* access rules that both legitimately apply to the same role/action (own rows OR
    public rows), not accidental duplicates; Supabase's own description calls this
    "suboptimal for performance," not incorrect. Consolidating 424 of these safely means reading
    each table's exact policy semantics and merging the USING/WITH CHECK logic with an OR by
    hand, at real risk of silently changing access behavior if any single merge gets the boolean
    logic wrong — and this repo's own history (§8, throughout) is largely a record of exactly
    that class of RLS mistake, made worse by bulk/rushed changes. `auth_rls_initplan` (wrapping
    `auth.uid()` in policies as `(select auth.uid())` so it's evaluated once per query instead of
    once per row) is lower-risk since it's a pure rewrite with no semantic change, but still means
    precisely reproducing 128 existing policies' full USING/WITH CHECK clauses one at a time — a
    real, scoped follow-up task, not a same-session bulk edit. Both are pure performance
    (query-planner cost), not correctness or security, so there's no urgency forcing a rushed
    pass. Left open for a dedicated follow-up session with room to verify each table individually.
  - **`unused_index` (75 real) and `unindexed_foreign_keys` (24 real) — deliberately NOT
    bulk-fixed.** Both are INFO-level and lower-priority than the WARN items above.
    `unused_index` requires confidence an index is genuinely dead (not just unused during
    Supabase's own observation window) before dropping — wrong on even one could silently
    reintroduce a slow query path. `unindexed_foreign_keys` (adding indexes) is lower-risk to
    apply than dropping, but still needs a per-table check of query patterns to prioritize
    correctly rather than blindly index all 24. Left open alongside the two WARN categories above
    for the same follow-up pass.
  - **Not yet checked**: whether any of the 653 real-schema findings across the 4 deferred
    categories overlap with tables already flagged as having genuinely conflicting duplicate
    definitions elsewhere in this file (§5's 10-table list) — if so, resolving the duplicate-
    definition question first would likely resolve some `multiple_permissive_policies` findings
    as a side effect, rather than as two separate efforts.
- **[Fixed — RLS-policy follow-up, explicitly requested] `auth_rls_initplan` (132 real findings)
  fully resolved; 15 of the 424 `multiple_permissive_policies` findings resolved as genuine
  byte-identical duplicates, the other 409 deliberately left as still-open, judgment-requiring
  work.** Continuing from the `duplicate_index` fix above at the user's explicit request to keep
  going on the RLS-policy consolidation.
  - **`auth_rls_initplan` (132/132 fixed)** — every policy in `public.*` whose `USING`/`WITH
    CHECK` expression called a bare `auth.uid()`/`auth.role()` (confirmed via a full
    `regexp_matches` scan that no other `auth.<fn>()` call exists anywhere in this schema's
    policies) was rewritten to `(select auth.uid())`/`(select auth.role())`, letting Postgres
    evaluate the call once per query instead of once per row — pure performance, zero
    access-control change (spot-checked before running: `is_platform_owner()` calls in the same
    expressions were correctly left untouched, since the regex only ever matches `auth.*`).
    Applied as a `DO` block that dynamically finds and fixes every matching policy (not a
    hardcoded list), so it's naturally idempotent. Verified 0 remaining afterward — the first
    verification attempt falsely showed "132 remaining" because Postgres re-pretty-prints
    `(select auth.uid())` as `( SELECT auth.uid() AS uid)` on storage and the case-sensitive
    check was looking for lowercase `select`; caught by spot-checking one policy's actual stored
    definition directly rather than trusting the aggregate count, then corrected the verification
    query to be case-insensitive.
  - **15 true duplicate pairs dropped.** Dumped all 223 policies in `public.*` via `pg_policies`,
    grouped by (table, cmd, role), and normalized each qual/with_check (handling OR-clause and
    equality-operand reordering) to separate genuine duplicates from policies that only
    superficially look similar. Found 15 pairs that are byte-identical, not just
    logic-equivalent — re-verified each by eye against the raw text before touching anything
    (e.g. `messages`' two `ALL`-policies both read, word for word, `EXISTS (SELECT 1 FROM
    conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid()))`
    under two different names: `member manages own messages` and `messages_owner_all`). Same root
    cause as the duplicate-table-definition problem documented throughout this file — two
    `supabase/*.sql` files each independently defined the same table and added their own copy of
    the same policy under a different name — here surfacing as a literal runtime RLS duplicate,
    not just a source-file one. Dropped the less-descriptive name from each pair, kept the other;
    verified afterward that all 15 dropped names return 0 rows and every one of the 14 affected
    tables still has ≥1 policy (no accidental total lockout).
  - **The other ~409 `multiple_permissive_policies` findings — deliberately still NOT touched.**
    Sampled one (`activity_feed`'s two `SELECT` policies for `anon`, `"member manages own feed"`
    and `"members see public feed"`) and confirmed these are genuinely different rules (own rows
    OR public rows) that Supabase's linter correctly calls "suboptimal for performance," not
    incorrect — merging them means precisely reproducing each table's exact boolean logic as a
    single OR'd policy by hand, at real risk of subtly changing access behavior if any one merge
    gets it wrong, across roughly 66+ tables' worth of policies. This remains genuinely open,
    judgment-requiring, per-table work — not attempted in this pass, consistent with the original
    reasoning in the entry above for deferring it.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818002535_wrap_auth_uid_calls_in_rls_policies` and
    `20260818002831_drop_redundant_duplicate_rls_policies`, both mirrored locally under
    `supabase/migrations/`.
- **[Fixed — second RLS-consolidation pass] 15 more `multiple_permissive_policies` findings
  resolved, dropping the count 254→209.** Continuing the follow-up at explicit request ("keep
  going on the remaining 254"). Re-dumped all 208 live permissive policies fresh (post the first
  merge pass) and grouped by `(table, cmd, exact roles array)` — not just "same role name," the
  literal array, so a `{public}` (all-roles) policy is never conflated with a same-named
  `{authenticated}`-only one even though they overlap for authenticated callers. Any group with
  2+ policies sharing the *exact* same role scope is safe to OR-merge by construction: Postgres
  already evaluates multiple permissive policies for the same role as an OR of all of them, so
  merging just makes that explicit as one physical policy instead of two — zero access-control
  change. Groups whose role scopes differed even slightly were left alone, same caution as every
  prior pass.
  - Found 15 such groups (30 individual policies → 15 merged): `ai_memory`, `contribution_log`
    (×2: INSERT, SELECT), `conversations`, `expert_bookings`, `interest_signals`,
    `marketplace_listings`, `medals`, `media_reservations`, `publications`, `sovereign_events`,
    `task_completions`, `user_dedication`, `user_journeys`, `workflow_executions`. Generated the
    merge SQL programmatically (not hand-written per table) to eliminate transcription risk,
    verified no new policy name collided with an existing one on its table before applying.
  - Verified post-apply: every merged `(table, cmd)` shows exactly 1 policy where it showed 2
    before; every affected table confirmed to still have policies covering every command it had
    before (no accidental total lockout on any action). `get_advisors` re-run afterward confirmed
    `multiple_permissive_policies` dropped 254→209 — a larger drop than 15 since several merged
    groups were on commands the advisor counts per underlying CRUD action, same pattern as the
    first merge pass. `unused_index` (125) and `unindexed_foreign_keys` (85) unchanged, as
    expected for untouched categories.
  - The remaining 209 are the same category as before: genuinely different access rules that
    happen to share a role/action (or share a role/action only partially, e.g. one `{public}`
    policy overlapping one `{authenticated}` policy for the same command) — still needs per-table
    judgment, not a mechanical merge. Applied to the live database and verified (2026-08-18, via
    the Supabase MCP connector), recorded remotely as
    `20260818063011_merge_second_pass_duplicate_role_scoped_rls_policies`, mirrored locally at
    `supabase/migrations/`.
- **[Fixed — third RLS-consolidation pass] 9 more `multiple_permissive_policies` findings
  resolved by dropping outright (not merging), 209→171.** Continuing the follow-up at explicit
  request ("keep going on the remaining 209"). This pass targeted a different, more common shape
  than the first two: a table with a `FOR ALL` policy *plus* a separate command-specific policy
  (e.g. `FOR SELECT`) whose condition is fully implied by the ALL policy's own condition for that
  command — since `FOR ALL` already covers every command, the specific policy adds nothing.
  - Detected programmatically, not by eye: for every table with exactly one `FOR ALL` policy,
    checked every other policy on that table whose role scope is a subset of (or equal to) the
    ALL policy's role scope, normalizing both conditions into OR-clause sets (handling equality-
    operand reordering, same technique as the earlier duplicate-detection passes) and confirming
    the specific policy's clause set is a subset of the ALL policy's — meaning the specific policy
    can never grant access the ALL policy doesn't already grant for that role+command. Verified
    the detector correctly *excludes* real non-redundant cases: `activity_feed`'s ALL policy
    ("own rows") plus its separate SELECT policy ("public rows OR own rows") was correctly left
    alone, since the SELECT policy's `is_public = true` clause isn't present in the ALL policy's
    condition — that pair stays two policies on purpose, same as this file's standing example.
  - 9 found and dropped, several byte-identical to their table's ALL condition, not just
    logically implied: `commission_contracts`, `consent_records`, `consult_requests`,
    `data_lineage`, `error_budget_policy`, `media_reservations`, `publications`, `slo_metrics`,
    `threat_events`.
  - Verified post-apply: every affected table's `FOR ALL` policy remains intact, and every command
    the dropped policy covered is still covered by the surviving ALL policy — no lockout on any
    action. `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped
    209→171 (again a larger drop than 9, since several affected policies were `{public}`-scoped,
    which the advisor's per-role reporting counts against every role that inherits from `public`
    — `anon`, `authenticated`, and Supabase's internal roles alike — not just the two member-facing
    ones).
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818064201_drop_policies_redundant_vs_all_policy`, mirrored locally
    at `supabase/migrations/`.
- **[Fixed — fourth RLS-consolidation pass, real bug found and fixed in the detector itself]
  28 more `multiple_permissive_policies` findings resolved by dropping, 171→123.** Continuing
  the follow-up at explicit request. Before running the same "redundant-vs-ALL-policy" pattern
  again, re-derived the detector script from scratch rather than assuming the previous pass's
  logic was complete — and found it had a real bug: `split_top_or()` only split an expression on
  `OR` at bracket-depth 0, but several ALL-policy conditions are wrapped in an *extra* pair of
  parens around the whole OR expression (e.g. `((auth.uid()=user_id) OR is_platform_owner())`),
  pushing the actual `OR` to depth 1 and hiding it from the splitter — so the previous pass's
  detector silently treated these as a single opaque clause instead of two ORed ones. This was a
  false-negative bug (missed real, safe redundancies), not a false-positive one — nothing unsafe
  was ever proposed by the buggy version, it just found fewer of the safe cases than actually
  existed. Confirmed the fix by hand against `certificates` before trusting it: its "own
  certificates read"/"cert_self" policies (`auth.uid()=user_id`) should have been recognized as
  implied by `certificates_own`'s `auth.uid()=user_id OR is_platform_owner()` and weren't, under
  the old code; the fixed version correctly detects the subset relationship.
  - Re-ran the fixed detector across every table and found **38 total candidates** — 9 were the
    same ones already dropped in the previous pass (expected, confirms continuity), leaving 28
    new ones across `certificates`, `commission_contracts`, `consult_requests`,
    `contribution_log`, `dispatches`, `evolution_events`, `family_nodes`, `media_reservations`,
    `publications`, `task_completions`, `trophies`.
  - Notable: 2 of the 28 (`contribution_log_insert_merged`, `contribution_log_select_merged`)
    were themselves created by the second consolidation pass earlier in this session — they
    turned out to be fully redundant against `contribution_log_own`'s own `FOR ALL` policy once
    correctly detected. Not a contradiction of that earlier fix, a natural continuation: the
    second pass correctly merged two same-role-scope duplicates into one policy; this pass then
    correctly noticed that merged policy was itself redundant against a *third*, broader ALL
    policy on the same table that the second pass wasn't checking against.
  - Verified post-apply: every affected table's `FOR ALL` policy remains, and every command the
    dropped policies covered is still covered by it — no lockouts (re-checked per-table,
    per-command policy counts before and after, same method as every prior pass in this section).
    `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped 171→123 —
    a 72% reduction from the original 434 across all four passes combined, all verified, zero
    access-control changes throughout.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818065025_drop_more_policies_redundant_vs_all_policy`, mirrored
    locally at `supabase/migrations/`.


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
- Keep `REPOSITORY_AUDIT.md`, `CAPABILITY_INVENTORY.md`, `GAP_ANALYSIS.md`,
  and `OMEGA_TAXONOMY.md` current as part of the same change, not a
  followup: adding/removing a page, module, table, RPC, or Edge Function;
  fixing or discovering a gap; applying pending SQL to a live database; or
  resolving/adding a term in the taxonomy's pending-terminology list all
  mean one of these four is now stale. Update the specific section that
  changed rather than rewriting the file. Every claim in these four
  stays evidence-cited (a file:line, a command's actual output, a query
  result) — never mark something fixed, applied, or verified unless it
  actually was in that session; an unmarked/unverified item should stay
  that way rather than be upgraded on assumption. This is how
  `REPO_AUDIT.md`'s counts drifted stale before `REPOSITORY_AUDIT.md`
  replaced them — don't repeat it.
- **Never show a success state without checking the write's actual result
  first.** This is the single most repeated root cause of real bugs found
  in this repo's history (§8: `extend_trial`, `complete_task`,
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

## 10. Autonomous feature-proposal pipeline (`.claude/skills/`)

Four skills exist for turning outside research into shipped-but-dormant
features on this actual static-HTML/Supabase stack — no framework, no
build step, adapted to the real architecture in §§1–6, not the generic
Next.js/Prisma/monorepo shape a build tool might default to:

- `web-trend-scout` — research only, writes a grounded proposal into
  `FEATURE_IDEAS.md`. No code.
- `feature-architect` — planning only, turns one proposal into an exact
  file-by-file blueprint (page, `nav.js` wiring, `supabase/*.sql`,
  `platform_settings` flag). No code.
- `autonomous-coder` — implements the blueprint for real, verifies with
  `scripts/audit.py`/`node --check`, commits to the current branch. Never
  flips a `platform_settings` flag to `true`, never merges to `main`,
  never edits CI or touches secrets.
- `subscriber-portal` — exposure. Only wires a feature into real
  subscriber-facing pages (using the real `membership_tier`/
  `OmegaCanon.tierUnlocks()` system, not an invented one) once a human has
  already turned its flag on.

See `.claude/skills/README.md` for the full pipeline and why it
deliberately stops at "reviewable, dormant-by-default code on a branch"
rather than auto-deploying to subscribers — this matches §9's rule against
shipping monetizable/legally-sensitive features live without an explicit
gating decision, and this repo's own history of serious bugs that shipped
silently (§8) is the reason that rule exists.

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
