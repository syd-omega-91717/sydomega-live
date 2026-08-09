# Repository Audit — sydomega-live

Date: 2026-08-08
Scope: full working tree at commit `84e3c61` (single squashed history — this
clone is shallow, so no deeper git-history audit was possible from here).

This audit builds on the repo's own `scripts/audit.py` (run in CI on every
push — see `.github/workflows/ci.yml`), which already checks module-graph
integrity, RLS coverage, and duplicate SQL table definitions. Current result:
**0 critical, 4 warnings, PASSED.** This report covers what that script does
not: repo hygiene, git/gitignore posture, secrets, dependency surface, and
one content-level compliance risk.

---

## 1. What this repository actually is

A framework-free static site (~250 standalone `.html` pages + ~90 root-level
`omega-*.js` modules), deployed to Vercel with no build step
(`vercel.json`: `installCommand`/`buildCommand` are both no-ops). Backend is
Supabase (Postgres + RLS + Edge Functions). There is no `package.json`
dependency list, no bundler, no framework — every page loads `bg.js` (the
"module loader" / design-system injector) and `nav.js` (navigation) via
plain `<script>` tags.

This is a legitimate, coherent architecture for its scale, not an
accidental one — the CI pipeline, RLS-everywhere policy, and dormant-flag
gating on the token economy (see §5) show real engineering discipline
already in place. The audit below is about tightening it, not fixing a
mess.

## 2. `.gitignore` / `.gitattributes` / LFS

**Current `.gitignore`** covers Python/Node caches, `.env*`, key/pem files,
editor/OS cruft, and a few repo-specific patterns
(`*.bak`, `*.archive.txt`, `*.stale-backup-reference`). It is small and
mostly correct for a no-build static site — there's no `node_modules/` to
generate since nothing runs `npm install` in this repo.

**Gaps:**

- **[Fixed]** No `.gitattributes` file existed. The repo commits one binary
  video (`SYDOMEGA91717_DEMOD-1-.mp4`, 3.7 MB) and one binary document
  (`SYD-OMEGA-Legal-IP-Brief.docx`, 15 KB) directly into git. A
  `.gitattributes` now marks both `-diff -text` so they're never treated as
  text in diffs/merges. Still open, non-urgent: neither is on Git LFS, so
  both permanently bloat every clone; either migrate via `git lfs migrate
  import` or move them to Supabase Storage/Vercel Blob and reference by
  URL.
- **[Corrected]** `scripts/audit.py` flags `SYD-OMEGA-Legal-IP-Brief.docx`
  as **"unreachable but deployed"** because it sits in the repo's deploy
  root with nothing linking to it — but that check only looks at the
  working tree, not at `.vercelignore`. `.vercelignore` (present since
  before this audit was written) excludes `*.docx`/`*.md`/`*.pdf`/`*.sql`
  from the actual Vercel deployment, and is the *only* defense — an
  earlier vercel.json extension-redirect backup for the same extensions
  was removed for invalid route-source syntax and never restored (see
  `.vercelignore`'s own header comment, now corrected). So the docx is not
  live-served today, but the safety margin is thinner than "defense in
  depth" implies: one `.vercelignore` edit away from exposure, with no
  redirect backstop. `scripts/audit.py`'s warning is still worth keeping
  as a tripwire; it just isn't proof of live exposure by itself.
- **[Resolved]** `*.stale-backup-reference` is ignored going forward, and
  the previously-tracked `supabase/achievements.sql.stale-backup-reference`
  is no longer in the tree (`git ls-files` confirms it's gone) — no action
  needed.

## 3. Secrets posture

- No hardcoded API keys, private keys, or high-entropy secret-shaped
  strings were found in tracked `.js`/`.html`/`.json`/`.ts` files.
- CI already runs a dedicated **service-role key scan**
  (`.github/workflows/ci.yml`, step 5) that fails the build if
  `service_role` or `SUPABASE_SERVICE` appears in client-shipped code —
  this is the single most important secret class for a Supabase app
  (a leaked service-role key bypasses every RLS policy) and it's already
  covered.
- `scripts/check-secrets.sh` documents which Edge Function secrets
  (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ANTHROPIC_API_KEY`,
  `RESEND_API_KEY`, ...) must be set server-side in Supabase, not in the
  repo. This is correct practice and nothing contradicts it in the tree.
- `setup.md` contains a real personal email address and a real Supabase
  project ref (`ydqhzvvoyufiiqvzcjns`). A project ref is not a secret by
  itself (it's a public identifier, visible in the client bundle anyway
  via `bg.js`/`omega-*.js` calls to the Supabase URL), but if this repo is
  ever made public, worth a conscious decision rather than an accidental
  one.
- The anon/publishable Supabase key appearing in `bg.js` is expected and
  fine (CI comment says so explicitly) — publishable keys are meant to be
  client-visible; RLS is the actual security boundary.

**No action required here beyond what CI already enforces**, other than
the docx placement question in §2.

## 4. Repository hygiene / `scripts/audit.py` findings (context)

Reproduced from the tool already in this repo, for visibility:

- **47 tables are defined in more than one SQL file** (e.g.
  `platform_settings` in 12 files, `platform_owners` and `dispatches` in
  10 each). `supabase/` has 105 loose `.sql` files with no consistent
  ordering — only 9 of 105 carry a numeric prefix (`0001_...` style).
  This works today because most statements use `CREATE TABLE IF NOT
  EXISTS` / `ON CONFLICT DO NOTHING`, but it means the actual schema is
  effectively "whatever order these files happened to run in," which is
  fragile and hard to reason about or replay from scratch. **Recommendation:**
  adopt Supabase's own migration convention
  (`supabase/migrations/<timestamp>_<name>.sql`, applied via `supabase db
  push`/`migration up`) so there's one linear, replayable history instead
  of a flat bag of idempotent patch files. This is the highest-leverage
  cleanup in the repo.
- Three files contain `DROP TABLE`/`DROP SCHEMA` statements
  (`chunk_07_migrations.sql`, `migration_runner.sql`,
  `omega_dispatch_reset.sql`) sitting alongside files that assume the
  schema exists. Worth confirming none of these are wired into anything
  that runs automatically.
- One asset exceeds 1 MB in the deploy root (the 3.7 MB demo video, §2).

## 5. Content-level finding — [Fixed since this audit was written]

`sovereign-covenant.html` now opens with a visible `sc-notice` banner
("TOKEN ECONOMY STATUS: DORMANT... issuance is not live... Read the marked
articles as roadmap, not present-tense fact") and tags Articles II, VIII,
and IX individually with "PLANNED · NOT YET ACTIVE". `system_manifest.json`
now states `monetary_policy.status` explicitly as "PLANNED — NOT YET
ACTIVE" with the same `tokens_enabled` gating spelled out. The finding
below is kept for context on why that change was made; no action remains.

`sovereign-covenant.html` (a real, deployed, linked-to page — reachable
from the nav under "Order" in `nav.js`) previously stated as covenant text,
in the present tense:

> "51% Master Stake — 467,756,700,000 Ω permanently locked in the
> Sovereign Vault. Irrevocable by any mechanism."
> "51% Safety Net — flash-crash protection via physical sovereign-grade
> reserve holdings: Gold, Rhodium, Silver."
> "20% Reinvestment Sweep — automatic acquisition of sovereign-grade
> physical assets on every revenue cycle."

Separately, `system_manifest.json` at the repo root makes the same claims
in machine-readable form (token allocations, "Anti-Bankruptcy Shield",
100% ownership, "Autonomous Global Regulation Auto-Update System").

I checked the actual backend (`supabase/omega_tokens.sql`): the token
economy is real code, but it is **explicitly dormant** — gated behind a
`tokens_enabled` flag that defaults `false`, with the file's own header
noting it stays off "until legal sign-off." That's the right engineering
call. But the *front-end page* and the *manifest* both state the 51%
stake, the physical-metal reserve backing, and the reinvestment sweep as
accomplished fact, with no "planned" / "not yet active" qualifier visible
to a reader — and this page is live and reachable, not an internal design
doc.

That gap matters because the same site also runs real Stripe checkout and
webhook Edge Functions (`supabase/functions/checkout`,
`stripe-webhook`). A live product page asserting real financial-asset
backing ("physical sovereign-grade reserve holdings") for a token, next to
a real payment flow, is the kind of claim that needs to be either (a) true
and disclosed with real backing, or (b) clearly marked as in-universe
lore/roadmap rather than a present-tense financial claim. Right now it
reads as (nothing marks it as either).

**Recommendation:** until the token economy is actually enabled and
legally reviewed, change the covenant/manifest language from present
tense ("is locked", "provides flash-crash protection") to explicit
future/planned tense, or add a visible "PLANNED — NOT YET ACTIVE" marker
on `sovereign-covenant.html` and in `system_manifest.json`. This is a
five-minute copy change that removes a real ambiguity, and it's worth
doing regardless of who ends up reading that page.

## 6. What's *not* wrong here

Worth stating plainly, since a lot of this repo's surface language
(sovereign/covenant/apex framing) could read as alarming out of context:

- `owner_apex_lock.sql` sets the platform owner's own gamification profile
  fields (matrix axis values, cosmology sign, subscription tier) — it's a
  self-referential app-data script, not a claim about the codebase's legal
  ownership or a mechanism that touches anyone else's data or access.
- RLS is enabled and policy-scoped consistently across the schema; the
  audit script enforces this in CI and currently reports 0 tables missing
  RLS.
- The zodiac/Greek-god/element theming (`omega-agents.json`, `nav.js`
  section names) is a consistent, deliberate brand system for a personal
  growth/gamification product, applied uniformly — it's a design choice,
  not a functional claim.

## 7. Summary

| Area | Status |
|---|---|
| Secrets in tracked code | Clean; CI enforces it |
| RLS coverage | Clean; CI enforces it (0 critical) |
| `.gitignore` correctness | Adequate; `.gitattributes` now present, LFS migration still open |
| SQL schema organization | Needs work — 107 loose files, 47 tables redefined across files |
| Dead/unreachable committed files | 0 open — stale-backup-reference gone, docx mitigated by `.vercelignore` |
| Committed binary size | Fine today (3.7 MB), no growth plan |
| Content/compliance | Fixed — §5, dormant-token-economy disclaimers now live on both pages |

Nothing here is a critical blocker. §5's tense fix and the stale-backup
cleanup are done. What remains, highest-value first: validate and adopt
`supabase/migrations/` against a live database and resolve the 47
duplicate-table-definitions (§4), then migrate the two committed binaries
off plain git (LFS or object storage) as a housekeeping item (§2).
