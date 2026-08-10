# Repository Audit — sydomega-live

**Date:** 2026-08-10
**Scope:** full working tree, branch `claude/syd-omega-agent-architecture-clko5e`, after all
fixes applied earlier in this branch's history (see §6 for the session log).
**Companion documents:** [`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md) (what exists),
[`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) (what's missing/broken and what to do about it).
**Relationship to `REPO_AUDIT.md`:** that file is an earlier, still-valid hygiene/secrets audit
(2026-08-08). This document supersedes it for current numbers and adds the CI-tool findings,
the session's fix log, and a fresh code-quality finding (§5); `REPO_AUDIT.md`'s §5
(token-economy tense fix) and §2/§3 (gitattributes, secrets posture) are not re-litigated here —
still accurate, not repeated.

---

## 1. What this repository actually is

A framework-free static site — 170 standalone `.html` pages, 93 root-level `omega-*.js`
modules — deployed to Vercel with no build step (`vercel.json`: `installCommand`/`buildCommand`
are both no-ops, `echo skip-install` / `echo static-no-build`). Backend is Supabase (Postgres +
Row Level Security + Edge Functions + Storage). There is no `src/`, no bundler, no framework;
every page loads `bg.js` (module loader / design-system injector / approval guard) and `nav.js`
(sidebar) via plain `<script>` tags. `package.json` declares zero dependencies — it exists only
to document Node/npm version constraints for tooling scripts, not for a build.

A second repository, `syd-omega-91717/-_V18_SYDOMEGA91717`, exists on GitHub under the same
account. It was found this session to be a stale, incomplete snapshot (16 "Add files via
upload" commits vs. this repo's 140+ incremental commits, missing 187 tracked files including
85 of 93 `omega-*.js` modules) with zero independently-developed content. It has been
fully resynced to match this repository exactly, on this same branch — see §6.

## 2. Current `scripts/audit.py` results (CI-gating, `.github/workflows/ci.yml` step 2)

```
1/2 · MODULE GRAPH        — on disk: 93   injected by loader: 88   in <script> tags: 6
                             OK — every requested module exists.
3/4 · SQL SCHEMA INTEGRITY — files: 111   tables: 104   policies: 398
                             ordered (numeric-prefixed) files: 9/111
                             WARNING — 47 tables defined in >1 file (see §4)
                             WARNING — 3 files contain DROP TABLE/SCHEMA (see §4)
5/6 · DEPLOY HYGIENE       — WARNING — 1 unreachable-but-deployed file (Legal-IP-Brief.docx)
                             WARNING — 1 asset over 1000 KB (demo .mp4, 3.7 MB)
SUMMARY                    — critical: 0   warnings: 4   PASSED
```

All 4 warnings are pre-existing, understood, and covered in `REPO_AUDIT.md` §2/§4 — not
new findings. The important number is **critical: 0**, meaning: every module `bg.js` /
`omega-notify.js` / any page requests exists on disk, and every table has RLS enabled.

Other CI checks (`ci.yml`, not reproduced in `audit.py`): `node --check` on every root
`.js` file (syntax), a `service_role`/`SUPABASE_SERVICE` scan (blocking, 0 hits), `deno check`
on all 7 Edge Functions (non-blocking), `sw.js` precache vs. actual files (blocking),
`manifest.json` icon paths vs. actual files (blocking). All currently pass.

## 3. Security posture

- **RLS:** enabled and policy-scoped across all 104 tables; CI fails the build on any gap.
  `public.is_platform_owner()` is the consistent helper for owner-elevated access.
- **Secrets:** no hardcoded API keys/service-role keys found in tracked client code; CI's
  dedicated scan enforces this on every push. Edge Function secrets
  (`STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, etc.) are documented in
  `scripts/check-secrets.sh` as owner-managed via `supabase secrets set`, never committed.
- **Stored XSS — found and fixed this session:** `approvals.html` and `profile.html`
  (the owner's own member-management admin panels — the highest-privilege pages in the app)
  rendered `display_name`/`email` straight into `.innerHTML` with no escaping.
  `display_name` is self-updatable by any authenticated member, so any pending/approved
  member could set it to an HTML/script payload and have it execute in the **owner's**
  browser. Fixed by adding a per-page `esc()` helper matching the convention already used
  elsewhere in the codebase (`contracts.html`, `dashboard.html`, `family.html`) and escaping
  every field sourced from another user's profile.

## 4. Schema organization (unchanged from `REPO_AUDIT.md` §4, numbers refreshed)

`supabase/` holds 111 loose `.sql` files, applied manually/in sequence; only 9 carry a
numeric prefix. 47 tables are defined in more than one file (`platform_settings`: 12 files,
`platform_owners`/`dispatches`: 10 each, down to `profiles`: 4) — safe today because most
statements use `CREATE TABLE IF NOT EXISTS`, but fragile to reason about. `supabase/migrations/`
(92 files, `0001`–`0092`, Supabase-CLI convention) now exists as an ordered, deduplicated-order
copy of this same content — see its own `README.md` for the full derivation history and the
still-open 47-tables-in-multiple-files redundancy (reordered, not deduplicated). **Neither the
loose bag nor `migrations/` has been applied to a live database from any session in this
project's history** — no session has held live Supabase credentials.

## 5. New finding — `nav.js`'s section-mapping object has 19 dead/overridden keys

`nav.js`'s `PS` object (maps a page slug to its sidebar section, used to highlight the active
icon) is written as a single JS object literal with 108 key:value entries — but only 89 are
unique. 19 keys appear twice with *different* values (`passport`, `kyc`, `character`,
`horoscope`, `gates`, `triads`, `kings`, `cinema`, `universe`, `treasury`, `wallet`,
`payments`, `membership`, `portfolio`, `bloodline`, `heritage`, `charter`, `grid`, `identity`).
In a JS object literal, the second assignment silently wins — the first is dead code with no
runtime effect. Confirmed via direct parse of the object body (not a guess): e.g. `identity`
is assigned `'identity'` at line 13, then reassigned `'archive'` at line 38, so
`/profile.html?...#identity`-style pages that used to want the `identity` section highlighted
in the sidebar now highlight `archive` instead — not necessarily wrong (both may be defensible
UX choices), but the first assignment's intent is silently lost and undiscoverable without
reading the whole object. **Fixed in the same session** (§6.10) — removed the 19 dead first
assignments, verified programmatically to be exactly behavior-preserving (zero change to any
key's effective value).

## 6. This session's fix log (all on branch `claude/syd-omega-agent-architecture-clko5e`)

In commit order, both repos kept in sync throughout:

1. Stored XSS in `approvals.html`/`profile.html` (§3) — fixed.
2. `omega-chart.js`'s Authority History chart queried a nonexistent `authority_snapshots`
   table; real table is `leaderboard_snapshots` — fixed (table-name correction only).
3. Silent-failure writes in `social.html` (connect/disconnect showed false success) and
   `family.html` (heir-toggle/remove gave no failure feedback) — fixed, matching the
   `.error`-check-and-alert convention already established elsewhere in the codebase.
4. Added `supabase/omega_notifications_fix.sql` — `public.notifications` table was queried
   platform-wide by `omega-notify.js` but never existed; added with RLS (members read/update
   own rows, owner reads all).
5. `-_V18_SYDOMEGA91717` found to be a stale, incomplete mirror (see §1) — fully resynced
   to this repository's state on this branch.
6. `roadmap.html`: fixed a broken reference to a `RUN_ORDER.md` file that has never existed
   in either repo (same bug already fixed once in `dashboard.html`, still present here), and
   corrected stale decorative counts (Edge Function count, page/engine/SQL-file counts) to
   measured values.
7. Added `supabase/migrations/0089`–`0091` — the three pending schema-fix files
   (`omega_user_assets_fix.sql`, `omega_extend_trial_fix.sql`, `omega_notifications_fix.sql`)
   existed as loose files but had never been copied into the ordered `migrations/` directory.
8. Added project-scoped Supabase MCP server config (`.mcp.json`) per Supabase's own setup
   instructions. Authentication requires an interactive `claude` session — not completable
   headlessly; confirmed by attempting it (correctly refused, pointed at running `claude`
   interactively).
9. Added `supabase/omega_notify_triggers.sql` (`migrations/0092`) — the five owner-gated
   member-status RPCs (`approve_member`, `grant_permanent_access`, `reject_member`,
   `revoke_member`, `extend_trial`) now each insert a `public.notifications` row on their
   respective event. Validated end-to-end against a throwaway local PostgreSQL 16 instance
   (not the real project) before being committed — not just syntax-checked.
10. `nav.js`: removed the 19 dead/overridden `PS` keys found in §5. Verified
    programmatically (not by inspection) that the fix is exactly behavior-preserving — parsed
    the effective key→value mapping before and after and confirmed zero changes.
11. Second-wave page sweep (§5.1's "not yet performed" caveat) — found and fixed 4 more real
    bugs: stored XSS in `sovereigns.html` (`profiles.sign`, self-updatable, rendered raw via
    `innerHTML` for every approved member — wider blast radius than the `approvals.html`/
    `profile.html` fix, since it's visible to the whole membership, not just the owner);
    `consultancy.html`'s booking form was completely non-functional (`consult_requests` was
    missing the `contact`/`preferred_time`/`brief` columns the form actually sends — every
    submission errored); `settings.html`'s background-color save discarded the sync-to-profile
    result silently; `travel.html` credited progress XP before confirming the journey save
    succeeded. All fixed; SQL change (`supabase/omega_consult.sql`, `migrations/0013`)
    validated the same way as item 9.
12. `supabase/owner_apex_lock.sql` (the owner-authenticated, manual, one-off admin script that
    sets the owner account to maximum values on every axis — see `migrations/README.md`'s
    "owner_apex_lock.sql removed from the automatic sequence" section for why it's
    intentionally not in `migrations/`) had a real bug: a `--` comment on the `authority` line
    ran to end-of-line and silently swallowed the following `nodes_earned = 104976` assignment
    as dead text — the script ran without error every time but never actually set
    `nodes_earned`. Fixed by moving that assignment to its own line. Cross-checked every other
    column/table the script touches against the real schema (all exist or are already
    existence-guarded) and validated end-to-end against a throwaway local PostgreSQL 16
    instance: confirmed `nodes_earned` now lands at 104976 and all 12 trophies/12 medals/12
    certificates rows are actually inserted.
13. Third-wave page sweep — `marketing.html`'s `decide()` (backs the owner-only campaign
    APPROVE/REJECT buttons on `public.media_reservations`) discarded the update's `.error`
    entirely: on failure the item silently stayed in the queue with no feedback, same bug
    class as `family.html`/`social.html` from the first wave, missed until now. Fixed to check
    `.error` and alert on failure. No other pending SQL this round — this was a pure client-code
    fix, live the moment it's deployed, no database action needed.

**None of the SQL additions (items 4, 7, 9, and the `consult_requests` column additions in
item 11) have been applied to any live database.** That remains an owner action requiring
real Supabase credentials, which no session in this project's history has held.

## 7. Summary

| Area | Status |
|---|---|
| Module graph integrity | Clean — 0 critical, CI-enforced |
| RLS coverage | Clean — 0 tables missing RLS, CI-enforced |
| Secrets in tracked code | Clean — CI-enforced |
| Stored XSS (owner admin panels + public leaderboard) | Fixed this session (2 pages/vectors) |
| Silent-failure writes | Fixed this session (4 instances); established convention for future ones |
| Wrong-table query (chart) | Fixed this session |
| Missing tables (`notifications`, `user_assets`) | Fixed in code (§6.4, §6.7); **not applied live** |
| `notifications` population | Fixed this session (§6.9); **not applied live** |
| `consultancy.html` booking flow (missing columns) | Fixed this session (§6.11); **not applied live** |
| `owner_apex_lock.sql` dead `nodes_earned` assignment | Fixed this session (§6.12) — owner-run manual script, not auto-applied |
| SQL schema organization | Needs work — 47 duplicate table defs, unchanged from `REPO_AUDIT.md` |
| `nav.js` dead-key data quality | Found and fixed this session (§6.10) |
| Second repo (`V18`) drift | Resolved this session — fully resynced |
| Committed binary size (docx/mp4) | Unchanged, non-urgent (see `REPO_AUDIT.md` §2) |

Nothing here is a critical blocker for the app as deployed today. The highest-leverage next
step is applying the pending SQL (§6 items 4, 7, 9, 11) to the live database — everything else
is either already fixed in code, or genuine hygiene debt with no functional impact.
