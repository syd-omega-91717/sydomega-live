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
current pathname.

**Consequence for anyone editing a page:** don't hand-roll the auth check,
the design tokens, or the sidebar. Load `bg.js` and `nav.js` the way every
other page does, and use the existing CSS classes/tokens (`.card`, `.kpi`,
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
  **Left for manual review** (the same failure modes as `.honor-card`,
  needing individual judgment, not a mechanical fix): `academy.html`
  `.exam-card`, `achievements.html` `.ach-card`, `advertising.html`
  `.tier-card`, `agents.html`/`sovereign-ai.html`/`sovereign.html`
  `.agent-card`, `analytics.html` `.algo-card`, `chronicle.html`
  `.future-card`/`.event-card`, `city.html` `.district-card`,
  `cosmos.html`/`elements.html` `.el-card`, `dna.html` `.dna-card`,
  `evolution.html` `.gate-card`, `exam.html` `.q-card`/`.exam-card`,
  `family.html` `.sg-card`, `feed.html` `.post-card`, `gaming.html`
  `.g-card`/`.e-card`, `honors.html` `.phase-card` (in addition to
  `.honor-card`), `intelligence.html` `.log-card`, `investment.html`
  `.holding-card`, `lab.html` `.tech-card`, `map.html` `.stat-card`,
  `notes.html` `.note-card`, `oracle.html` `.reading-card`,
  `prediction.html` `.pred-card`, `projects.html` `.proj-card`,
  `publications.html` `.rec-card`, `queue.html` `.worker-card`,
  `revenue.html` `.stream-card`, `series.html` `.ser-card`,
  `social.html` `.plat-card`, `sovereign-covenant.html` `.article-card`,
  `studio.html` `.axis-card`/`.create-card`, `triads.html`
  `.triad-card`, `tribe.html` `.elem-card`/`.tribe-rank-card`,
  `trophies.html` `.medal-card`, `wallet.html` `.account-card`,
  `wealth.html` `.asset-class-card`. (`vault.html`'s `.article-card` was
  already reviewed and added earlier — its `::before` turned out to be
  an exact duplicate of `.card`'s, not a real conflict — so it
  re-appears in the scanner's conservative flag list but needed no
  further action.)
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
- **`user_assets` table is missing from the live schema — action needed.**
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
- **`notifications` table missing from the live schema — action needed.**
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
- **`advertising.html`'s entire Live Ads / Submit feature was completely broken, both read and
  write — fixed.** Found by scanning every `.insert()`/`.update()`/`.upsert()` payload across all
  ~250 pages against the actual `CREATE TABLE` column lists in `supabase/*.sql` (a broader sweep
  than any prior session's — earlier passes covered `omega-*.js` modules and silent-failure-write
  checks, but not a column-level check across every page). `public.advertisements`
  (`chunk_06_migrations.sql:469-484`) has columns `company`/`title`/`description`/`url`/
  `rate_tier`; `advertising.html` wrote and read `company_name`/`headline`/`body`/
  `destination_url`/`tier` instead — a near-total naming mismatch, not one or two fields. Same
  silent-failure shape as every bug in this section: PostgREST rejects the whole
  `select()`/`insert()` when any referenced column doesn't exist, so `loadLiveAds()` always fell
  into its catch block ("PLACEMENTS UNAVAILABLE" for every visitor, always) and `submitAd()`'s
  insert always failed too — though its catch block already showed an honest non-success message
  ("SUBMISSION NOTED. CONTACT THE ORDER DIRECTLY TO PROCEED."), so this wasn't a false-success
  toast, just a feature that has never once worked since it shipped. Also included
  `timeline_period`/`submitted_at` keys with no matching column anywhere — `submitted_at` is
  dropped (the table's `created_at DEFAULT now()` already covers it); `timeline_period` has no
  equivalent column at all and is now simply not persisted (the form field is left in place, but
  the value isn't saved) — flagged as a known, deliberately undone gap rather than inventing a new
  column unprompted, matching this file's own rule against guessing at schema decisions. Fixed all
  field names in both the `select()` and the `insert()` to match the live schema exactly.
  **Not yet applied to the live database** — no SQL changes needed, this is a client-side
  field-name fix only.
- **`approvals.html`'s dispatch-send fallback path showed a false "✓ DISPATCH RECORDED" success
  toast on a write that would always fail — fixed.** `sendDispatch()` tries the `post_dispatch`
  RPC first (which correctly inserts `title`/`body`/`category` into `public.dispatches`, per its
  own definition in `supabase/omega_dispatch.sql`); only if that RPC throws or returns
  `{ok:false}` does it fall back to a direct `.insert()` — and that fallback wrote
  `sent_by`/`sent_at`, columns that exist in **neither** of the two genuinely divergent
  `dispatches` table shapes in the SQL bag (the newer `title`/`body`/`category` shape the RPC
  itself uses, or the older `user_id`/`sign`/`body` shape some other files still define — see
  `GAP_ANALYSIS.md` §3.1's broader note on divergent definitions). The fallback's `.error` was
  never checked, so on the rare path where it's actually reached (the RPC missing or erroring),
  the owner would see a false success toast while nothing saved. Fixed by matching the fallback's
  `INSERT` shape to exactly what `post_dispatch` itself writes (`title`/`body`/`category` — the
  table has no sender-tracking column at all, so `sent_by`/`sent_at` were never accurate names for
  anything that exists) and adding a real `.error` check. **Not yet applied to the live
  database** — no SQL changes needed, this is a client-side fix only.

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
- Keep `REPOSITORY_AUDIT.md`, `CAPABILITY_INVENTORY.md`, and
  `GAP_ANALYSIS.md` current as part of the same change, not a followup:
  adding/removing a page, module, table, RPC, or Edge Function; fixing or
  discovering a gap; or applying pending SQL to a live database all mean
  one of these three is now stale. Update the specific section that
  changed rather than rewriting the file. Every claim in these three
  stays evidence-cited (a file:line, a command's actual output, a query
  result) — never mark something fixed, applied, or verified unless it
  actually was in that session; an unmarked/unverified item should stay
  that way rather than be upgraded on assumption. This is how
  `REPO_AUDIT.md`'s counts drifted stale before `REPOSITORY_AUDIT.md`
  replaced them — don't repeat it.

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
