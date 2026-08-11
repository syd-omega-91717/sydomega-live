---
name: autonomous-coder
description: Implements a feature-architect blueprint into real files in this repo (static .html page, optional omega-*.js module, idempotent supabase/*.sql, nav.js wiring), verifies with the repo's actual checks, and commits to the current branch — never to main, never auto-merged, never with a live-flipped feature flag. Use after feature-architect has produced a blueprint.
---

# AUTONOMOUS CODER

## What this is

The implementation skill. It writes the files a `feature-architect`
blueprint specifies, using this repo's real conventions — not a generic
scaffold. If no blueprint exists yet for what's being asked, run
`feature-architect` first rather than guessing at file layout.

## Steps

1. **Implement the page.** Copy the `<head>`/loader boilerplate from the
   comparable existing page the blueprint named (same `bg.js`/`nav.js`
   `<script>` tags, same `data-page` attribute on `#omega-side`, same
   approval-guard-compatible structure — i.e. real content lives inside
   `#app`/`.shell`/`main.main`, per `CLAUDE.md` §3). Use only the shared
   classes/tokens from `bg.js`'s injected stylesheet; if the blueprint
   calls for a new shared component, add it to that stylesheet block
   (not page-local `<style>`).

2. **Implement the module, if the blueprint calls for one.** Add the new
   `omega-<name>.js` file, and wire it into `bg.js`'s loader exactly like
   the existing entries: `if(!document.querySelector('script[data-omega-<name>]')){...}`
   guard, `defer=true`, appended to `document.body`. An unreferenced
   `omega-*.js` file is flagged by `scripts/audit.py` as orphaned — the
   wiring is not optional.

3. **Implement the data layer.** Write the `supabase/omega_<feature>_fix.sql`
   file the blueprint specified: idempotent DDL, `ENABLE ROW LEVEL
   SECURITY` on every new table, policies built on `is_platform_owner()`
   for the owner-elevated case plus a member-scoped policy (`auth.uid() =
   user_id` or equivalent) — never ship a table without RLS. If the
   blueprint specifies a `platform_settings` flag, insert it with
   `bool_value = false` via `INSERT ... ON CONFLICT DO NOTHING`, and make
   every RPC/query touching the feature check that flag before doing
   anything monetizable or legally-sensitive. **Do not flip any
   `platform_settings` flag to `true`** — that is an explicit human,
   business/legal decision per `CLAUDE.md` §9, not an engineering one.
   This file only adds to the flat `supabase/*.sql` bag — do not also try
   to regenerate `supabase/migrations/`, which is a separate, not-yet
   fully validated effort per `CLAUDE.md` §5.

4. **Wire navigation.** Update `nav.js`'s `PS` map and the correct
   `SECTIONS[].sub` array exactly as the blueprint specified. Skipping
   this leaves the page unreachable.

5. **Gate UI copy honestly.** If the feature sits behind a `false`
   `platform_settings` flag, any user-facing copy about it must be
   future-tense / explicitly marked not-yet-active — copy the
   `sovereign-covenant.html` convention (`PLANNED · NOT YET ACTIVE`
   tags), never "live" language for something that isn't on.

6. **Verify.**
   - `node --check` on every new/changed `.js` file.
   - `python3 scripts/audit.py` from the repo root — must introduce no
     new CRITICAL finding (missing RLS, broken module graph). New
     warnings (e.g. a new SQL file) are expected and fine.
   - Confirm every new `src=`/`href=` in the new page resolves to a real
     committed file (what CI's broken-asset check does).
   - Re-grep for `service_role`/`SUPABASE_SERVICE` in anything touched —
     must never appear in client-shipped code (CI check 5, blocking).

7. **Keep the audit docs current, same commit.** Per `CLAUDE.md` §9,
   update the relevant section of `REPOSITORY_AUDIT.md`,
   `CAPABILITY_INVENTORY.md`, and/or `GAP_ANALYSIS.md` for whatever
   changed (new page, new table, new RPC, new module) — evidence-cited,
   not upgraded to "verified"/"applied to live database" unless it
   actually was run against the live database in this session. A new SQL
   fix file that hasn't been run against production is "added, not yet
   applied" — say exactly that, matching the existing convention in those
   files for prior fixes.

8. **Commit only — no push to main, no merge, no CI/workflow edits.**
   Commit the change to the branch already checked out for this session's
   work. Never edit `.github/workflows/`, never touch Supabase secrets,
   never open or merge a PR unless the user explicitly asks for one (this
   matches the platform-wide instruction already governing this session).
   Leave the flag flip and any production SQL apply as an explicit,
   separate human step — this skill's job ends at "reviewable, working,
   dormant-by-default code on a branch."

## Guardrails

- Never introduce a build step, bundler, or framework dependency —
  `vercel.json` disables install/build on purpose (`CLAUDE.md` §1, §9).
- Never write a table without RLS, and never grant broader-than-`own-row`
  access without going through `is_platform_owner()`.
- Never mark a `platform_settings` flag `true`, never claim in docs or UI
  copy that a gated feature is "live" or "applied to production."
- If `scripts/audit.py` reports a new CRITICAL finding after your change,
  fix it before considering the task done — it is CI-gating.
