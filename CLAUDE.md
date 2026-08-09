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
  only scripts), and the one open item: it has not yet been executed
  against a live/test database, so run it against a scratch Supabase
  project before pointing any real deployment at it. The flat
  `supabase/*.sql` bag at repo root is unchanged and still the source of
  truth for new schema changes — see `REPO_AUDIT.md` §4 for the still-open
  duplicate-table-definitions list (47 tables defined in more than one
  file; not deduplicated by the migrations/ work, only reordered).
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

## 8. Known debt (see `REPO_AUDIT.md` for detail)

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
  meant to happen server-side). **This session has no live Supabase
  access, so the file has NOT been run against the database yet** — apply
  it (`supabase db push` or paste into the SQL editor) before expecting
  these two pages to show real data.
- **Finance pages: inconsistent persistence, needs a product decision.**
  `wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`,
  `investment.html`, `expenses.html`, and `budget.html` persist entirely
  to `localStorage` — no Supabase table backs any of it, so account
  balances, net-worth snapshots, and holdings a member enters don't sync
  across devices and are lost if browser storage is cleared. This is
  inconsistent with the rest of the platform's Supabase+RLS model, and
  with `income.html`/`ledger.html`/`contracts.html`/`portfolio.html`,
  which already do persist server-side (the last of these confirms a
  `user_assets`-style table was clearly intended for holdings). Whether
  the localStorage-only pages are deliberately client-side for privacy or
  simply an unfinished migration is a product call, not a code question —
  left undecided and undocumented-as-a-bug on purpose; don't "fix" it by
  unilaterally building new schema/RLS without that decision first.
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
  non-urgent (see `REPO_AUDIT.md`).

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
