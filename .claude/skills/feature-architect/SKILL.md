---
name: feature-architect
description: Turns a FEATURE_IDEAS.md proposal into an exact, file-by-file implementation blueprint for this repo's real static-HTML/Supabase architecture (no framework, no build step). Planning only, no code written. Use after a proposal in FEATURE_IDEAS.md has been picked to move forward.
---

# FEATURE ARCHITECT

## What this is

A planning skill. It reads one proposal from `FEATURE_IDEAS.md` (or a spec
the user gives directly) and produces a concrete, file-by-file blueprint
that `autonomous-coder` can implement without guessing. It never writes
application code itself.

Everything here targets the architecture documented in root `CLAUDE.md`
§§2–6: standalone `.html` pages, `bg.js`/`nav.js` shared loaders,
`omega-*.js` single-purpose modules, a flat `supabase/*.sql` directory,
`public.platform_settings` as the feature-flag store, `is_platform_owner()`
for owner-elevated RLS, and `OmegaCanon.tierUnlocks(membership_tier,
featureKey)` (see `omega-canon.js`) for subscriber-tier gating. Do not
design against Prisma, Next.js routes, or a `packages/`/`apps/` monorepo —
none of that exists in this repo.

## Steps

1. **Read the proposal** — the `FEATURE_IDEAS.md` entry (or user-given
   spec) plus everything it cites. Re-verify its "Grounded in" claims are
   still accurate (grep the referenced file/table again) before designing
   against them.

2. **Page & nav plan.**
   - Name the new `.html` file (or the existing page it extends).
   - State which existing page's `<head>`/loader boilerplate to copy from
     (pick a structurally similar real page, e.g. a dashboard-style page
     for a KPI widget, a hub page for a new content area) — every page
     must load `bg.js` and `nav.js` exactly the way existing pages do
     (`CLAUDE.md` §9: "don't write a new page without loading bg.js and
     nav.js the way existing pages do").
   - Give the exact `nav.js` change: which key to add/reuse in the `PS`
     map (line ~10) and which `SECTIONS` entry's `sub` array (line ~47+)
     gets the new `[slug, LABEL, href]` tuple. A page not wired into both
     is unreachable and `scripts/audit.py` will flag it.
   - Use only existing shared classes/tokens (`.card`, `.kpi`, `.btn-gold`,
     `.tbl-*`, `--gold`/`--cyan`/etc.) per `CLAUDE.md` §4. If a genuinely
     new component is needed, specify the exact addition to bg.js's
     injected `<style>` block (search `Ω-GVP` for the extension-layer
     precedent) instead of page-local CSS that will drift.

3. **Module plan (only if truly needed).** Most features fit as inline
   `<script>` in the page, matching the existing convention (this repo has
   no shared component system). Only propose a new `omega-*.js` module if
   the logic must be shared across pages or deferred-loaded. If proposed,
   specify: filename, the `data-omega-<name>` guard attribute (see the
   loader pattern in `bg.js` around its module-loader section), and
   exactly where in `bg.js` it gets injected.

4. **Data plan.**
   - If new tables/RPCs are needed, specify them as a single new
     `supabase/omega_<feature>_fix.sql` file (matching the existing
     `omega_*_fix.sql` naming convention), idempotent
     (`CREATE TABLE IF NOT EXISTS`, `ON CONFLICT DO NOTHING`), with RLS
     enabled on every table and an `is_platform_owner()`-based owner
     policy alongside a member-scoped one — never a table without RLS
     (`CLAUDE.md` §5, CI check 4 is blocking).
   - If the feature is monetizable or legally-sensitive (payments, tokens,
     new personal-data collection, anything Stripe-adjacent), specify a
     new `public.platform_settings` boolean key, **defaulted `false`**,
     and every RPC/query path gated behind it — matching the
     `tokens_enabled` pattern in `supabase/omega_tokens.sql`. State this
     explicitly in the blueprint; `autonomous-coder` must not flip it to
     `true`.
   - If the feature is subscriber-tier-gated, specify the
     `OmegaCanon.tierUnlocks(profile.membership_tier, 'featureKey')` check
     and what `featureKey` string to register, rather than inventing a
     parallel access-control mechanism.

5. **Verification plan.** List the exact checks `autonomous-coder` must
   run before calling the work done: `node --check` on any new/changed
   `.js`, `python3 scripts/audit.py` (no new CRITICAL findings), a check
   that every new `src=`/`href=` resolves to a real file (CI check 4).

6. **Write the blueprint** as a new `## Blueprint` section appended to the
   bottom of the same `FEATURE_IDEAS.md` entry (don't create a separate
   file — keeps the idea and its plan in one place, same as this repo's
   existing single-file convention for proposals).

## Guardrails

- No code in this step — HTML/JS/SQL file *contents* are
  `autonomous-coder`'s job. This skill only specifies exact filenames,
  exact insertion points, and exact schema/flag shapes.
- If the proposal doesn't cleanly fit the existing patterns above (needs a
  build step, needs a framework, needs data that can't be modeled with
  `platform_settings` + RLS), say so plainly in the blueprint instead of
  forcing a fit — that's a signal for the user to reconsider scope, not
  something to route around silently.
