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

## Gating HIGH-RISK Decisions — Before You Blueprint

**For any proposal touching auth, schema, payments, RLS, or new public-callable functions, run `/grill-me-codex` *before* architecting.**

The `grill-me-codex` framework is a structured interrogation that locks down intent before code is written, by forcing explicit threat-model review and decision documentation. It exists specifically to prevent the silent bugs (stored XSS, RLS escapes, column-name mismatches, unguarded RPCs, silent-failure writes) this repo's own history documents in CLAUDE.md §8.

| Decision Type | When | How |
|---|---|---|
| Auth changes (privilege, sessions, tokens) | Always | Run `/grill-me-codex type=auth <proposal>` (3 rounds, Codex review, then blueprint) |
| Schema changes (new tables, RLS policies, migrations) | Always | Run `/grill-me-codex type=schema <proposal>` (3 rounds, Codex review, then blueprint) |
| Payment/Stripe integration | Always | Run `/grill-me-codex type=payments <proposal>` (3 rounds, Codex review, then blueprint) |
| New RPCs without privilege guard | Always | Run `/grill-me-codex type=auth <proposal>` (Codex checks for unguarded access) |
| Member-writable data + rendering | Always | Run `/grill-me-codex <proposal>` (base model checks for stored XSS) |
| Low-risk features (UI, docs, non-data) | Optional | Run `/grill-me-codex quick <proposal>` if you want a decision record (no Codex review) |

**Outcome**: You'll receive a `PLAN.md` file with `# Status: APPROVED-BY-CODEX` (or `OVERRIDE` with justification), plus a `CODEX_REVIEW.md` audit trail. Proceed to blueprinting only with an APPROVED status.

---

## Guardrails

- No code in this step — HTML/JS/SQL file *contents* are
  `autonomous-coder`'s job. This skill only specifies exact filenames,
  exact insertion points, and exact schema/flag shapes.
- If the proposal doesn't cleanly fit the existing patterns above (needs a
  build step, needs a framework, needs data that can't be modeled with
  `platform_settings` + RLS), say so plainly in the blueprint instead of
  forcing a fit — that's a signal for the user to reconsider scope, not
  something to route around silently.
- For HIGH-RISK decisions: blueprinting without a grill-me-codex approval is
  a sign that intent may be unclear. If a proposal skipped `/grill-me-codex`,
  recommend running it before proceeding to architecture — better a 3-round
  interrogation now than silent bugs later.
