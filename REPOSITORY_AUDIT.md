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
- **Full owner-approval bypass — the most severe finding on this branch, found and fixed this
  session:** `supabase/trial_access.sql` defined `grant_permanent_access`/`grant_trial_access`/
  `expire_trial` with no caller check at all, despite being `GRANT`ed to `authenticated`. See
  §6 item 16 and `GAP_ANALYSIS.md` §0 for the full writeup, exploit, fix, and validation.

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

**Functions are a separate, higher-risk duplication class** — see `GAP_ANALYSIS.md` §3.1:
unlike tables, `CREATE OR REPLACE FUNCTION` overwrites unconditionally, and 10 functions
(including `is_platform_owner()` itself) have genuinely diverging definitions across files.

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
14. Fourth-wave sweep — this time systematic rather than manual: script-cross-referenced every
    `.from()`/`.rpc()` call site against the schema (no new gaps beyond the already-documented
    `transactions`/`wallet_balances`), traced the data source of every remaining
    `.innerHTML`-with-interpolation file (10 files; all either `localStorage`-only or static
    config arrays except one real finding), and checked every remaining Supabase-write file for
    unchecked `.error` (23 files; all 9 not already covered by a prior fix check it correctly —
    no new gap). The one real finding: `queue.html`'s "PLATFORM DISPATCH LOG" panel selected
    `*` from `public.dispatches` and read `d.type`/`d.action`/`d.payload`/`d.status` — none of
    which exist in any `dispatches` definition across the 10 files that define it (real columns:
    `title`/`body`/`category`/`is_published`/`created_at`/`user_id`/`sign`), so every row
    rendered as placeholder junk (`-`, `{}`, `PENDING`) regardless of content — same
    wrong-shape-query bug class as item 2. Compounding it: the real columns are member-writable
    (the `dispatches` `"wire insert"` RLS policy checks only `auth.uid() = user_id`, not column
    values) and were about to be rendered raw via `.innerHTML` with no escaping — a stored-XSS
    vector into a page the owner views, same threat model as items 1 and 11's `sovereigns.html`
    fix. Fixed both at once: corrected the query to the real columns and added escaping,
    matching `news.html`'s existing `esc()` convention for the same table. See
    `GAP_ANALYSIS.md` §4.6 for full detail.
15. Fifth-wave sweep — extended item 14's `.innerHTML` check from template-literal
    interpolation to the two remaining interpolation shapes: string-concatenation (54
    candidate files) and bare-variable assignment (`.innerHTML=someVar`, 12 more files found
    while grepping for the concatenation shape). All 54 concatenation files traced clean
    (localStorage-only, static config arrays, self-scoped queries, or already-escaped —
    `marketing.html`/`news.html`/`sovereigns.html`/`hall.html` confirmed to already use `esc()`
    correctly rather than assumed). Of the 12 bare-variable files, one real finding:
    `graph.html`'s member-node tooltip attempted to escape `display_name` via
    `nm.textContent=m.name` then reading `nm.textContent` back — which returns the original
    unescaped string, since only reading `.innerHTML` back would apply escaping. The
    "escaping" was a complete no-op; every approved member's `display_name` (self-updatable,
    queried with no `user_id` filter for the whole membership) rendered raw into a tooltip any
    other approved member or the owner could trigger by hovering. Fixed with a real `esc()`
    equivalent. Along the way, also found (not part of the XSS sweep, but same "response shape
    doesn't match what the client assumes" bug class as item 2/14): `access_audit_log()`
    (owner-only RPC, `omega_access_audit.sql`) returns `{ok,rows:[...]}`, but both of its only
    two callers (`approvals.html`, `vault.html`) read `r.data` as if it were the array directly
    — `vault.html`'s `.slice()` on the object threw on every call, permanently falling back to
    5 hardcoded fake "demo" audit entries; `approvals.html`'s length-check on the object always
    read as empty, showing "NO AUDIT ENTRIES". Both have shown zero real access-decision
    history to anyone, including the owner, since the RPC was added. Fixed both call sites to
    unwrap `r.data.rows` and use the RPC's actual field names (`action`/`subject`/`actor`, not
    the assumed `event`/`status`/`user_id`); `subject`/`actor` are resolved `display_name`
    values (member-controllable) so both are now escaped too. See `GAP_ANALYSIS.md` §4.8-§4.9
    for full detail on both.
16. Sixth-wave sweep — extended beyond the three established bug classes for the first time.
    **Most significant finding of any session on this branch:** `supabase/trial_access.sql`
    defined `grant_permanent_access(uuid)`, `grant_trial_access(uuid)`, and `expire_trial(uuid)`
    — all `SECURITY DEFINER`, all `GRANT`ed to `authenticated` — with **no caller check at
    all**. Any signed-in member could call `grant_permanent_access` on their own uid from the
    browser console and instantly self-approve to full platform access, or call `expire_trial`
    on another member's uid to wipe their progress. `supabase/0003_privilege_lockdown.sql`
    (already in the repo) documents and fixes this exact vulnerability class for 7 other copies
    of these same three functions — every one of them already carries the
    `auth.uid() <> p_uid AND NOT is_platform_owner()` guard. `trial_access.sql` was the one file
    that never got it, and because each of its functions opens with an unconditional
    `DROP FUNCTION IF EXISTS`, applying it after any of the 7 guarded copies (the flat SQL bag
    has no enforced order) would silently reopen the hole on a platform that already believed
    it was closed. Fixed by adding the identical, already-proven guard used by the other 7
    copies. **Validated end-to-end against a real, throwaway local PostgreSQL 16 instance**
    (this environment has `postgresql-16` installed) — 4 scenarios run: attacker
    self-approve (denied), attacker wiping a victim's trial (denied, victim's row and
    `task_completions` confirmed untouched), owner granting access (succeeded), member
    self-expiring their own trial (succeeded). Database dropped after. See `GAP_ANALYSIS.md` §0
    for the full writeup and the historical-exploitation check the owner should run.
    Also this pass: cross-referenced every `.rpc()` call's consumed response shape against the
    actual SQL `RETURNS` clause for all 25 distinct RPCs called from client code (not just the
    2 already known from item 15) — found `error_summary()` has the identical `{ok,rows}`-vs-
    assumed-array bug as `access_audit_log()` (fixed, same pattern), and `my_points_balance()`
    returns `{ok,balance}` but `blockchain.html` ran `Number()` on the whole object, always
    showing "Ω NaN" (fixed). While investigating `error_summary`'s siblings on the same
    `approvals.html` page, found `review_contracts()`/`review_reservations()`'s results
    (`media_reservations.title` — member-writable, no approval gate — and
    `commission_contracts`) rendered raw via `.innerHTML` with no escaping, unlike every other
    field on that page; `error_summary`'s underlying data is reachable by **unauthenticated**
    callers via `report_client_error()` (granted to `anon`), the widest reach of any stored-XSS
    instance found on this branch. All three escaped to match the page's existing `esc()`.
    Separately, extended the "47 duplicate tables" schema-hygiene check (§4) to *functions* —
    tables are safe to duplicate (`CREATE TABLE IF NOT EXISTS`), functions are not
    (`CREATE OR REPLACE FUNCTION` unconditionally overwrites). Found 10 functions with
    genuinely diverging (not just whitespace) definitions across files; 3 have real behavioral
    consequences (`is_platform_owner()` itself checks two different data sources depending on
    which file ran last; `my_matrix()` and `complete_task()` diverge in ways that could leave
    client code silently non-functional; `apply_subscription()`'s two different arities could
    coexist as ambiguous overloads and break every Stripe webhook call). Not fixed — cannot
    tell from source alone which side of each fork is live; left as a prioritized owner action
    with the exact `pg_proc` verification query to run. See `GAP_ANALYSIS.md` §3.1 for full
    detail and the query.
17. Verified `GAP_ANALYSIS.md` §3's open item ("confirm the 3 `DROP TABLE`-containing files
    aren't wired into anything automatic") rather than leaving it as an assumption. All three
    DROPs target only `public.dispatches`, not distinct tables; `chunk_07_migrations.sql`'s is
    literally `omega_dispatch_reset.sql` pasted into a legacy bundle file whose own header says
    "run this ONLY if OMEGA_DISPATCH.sql still errors"; `migration_runner.sql`'s DROP comes
    after two earlier `CREATE TABLE dispatches` in the same file with no recreation
    afterward — genuinely destructive if that file were ever run start-to-finish, but grepped
    `ci.yml`, `scripts/`, every `.html`/`.js` file, and `supabase/functions/`: zero references
    to any of the three files anywhere. Confirms and adds concrete verification to
    `migrations/README.md`'s existing "must not be wired into any automated path" analysis.
    No code change — a verification pass, closing an open question rather than a fix.
18. Seventh-wave sweep — extended beyond `.html` pages and `.from()`-call-centric checks for
    the first time: `bg.js`-loaded modules and external (non-Supabase) content sources.
    `omega-live.js`'s activity-feed ticker (`startTicker()`, loaded by `bg.js` on every page)
    rendered `activity_feed.title` raw via `innerHTML` — `activity_feed`'s RLS lets any
    authenticated member insert their own `is_public=true` row with an arbitrary title, same
    stored-XSS shape as `sovereigns.html`. Currently dormant (no shipped page has a
    `[data-live-ticker]` element yet) but fixed preemptively since the module clearly exists to
    power one. `pulse.html`'s news ticker rendered `item.title` from an external Reuters feed
    (proxied via `api.rss2json.com`, a plain `fetch()` call — not a `.from()` call, which is
    why prior `.from()`-centric sweeps didn't catch it) raw via `innerHTML` — the only
    unescaped field on the page. Added `esc()` to both.
19. **Real-world bug, caught only once the owner actually ran `0092` against the live
    database:** `supabase/omega_notify_triggers.sql`/`migrations/0092` failed with
    `42P13: cannot change return type of existing function` on `grant_permanent_access` — the
    live database already had a version of that function with a different return type than
    the `jsonb` this file assumed (from `trial_access.sql`, item 16 — its pre-fix version
    `RETURNS void`), and `CREATE OR REPLACE FUNCTION` cannot change a return type.
    `omega_access_control.sql` (the file that originally created these 5 functions) already
    anticipated exactly this scenario with a dynamic drop-all-prior-versions block, but `0092`
    didn't reuse that same defensive pattern. Fixed by adding the identical block (drops any
    existing version of the 5 functions it touches, by whatever signature `pg_proc` actually
    reports, before redefining them). Validated by reproducing the exact production error
    first — created a stub `grant_permanent_access` returning `boolean` instead of `jsonb` in
    a throwaway local PostgreSQL 16 instance, confirmed the unfixed file hit `42P13` there too,
    then confirmed the fixed file resolves it cleanly and all 5 functions + notification
    inserts work correctly afterward. This is the first pending-SQL item on this branch that
    was actually attempted against a live database, and it surfaced a real gap no local
    validation could have caught (there was nothing pre-existing to conflict with in any
    throwaway test database) — worth remembering for any future SQL fix in this family, and a
    concrete illustration of why item 16's `pg_proc`-divergence findings matter in practice.

**None of the SQL additions (items 4, 7, 9, and the `consult_requests` column additions in
item 11) have been applied to any live database**, except `0092`, whose first live attempt
surfaced the bug fixed in item 19 above — the corrected file has not yet been re-run. That
remains an owner action requiring real Supabase credentials, which no session in this
project's history has held generally, though item 19 shows this owner does have live access
and has begun applying the pending SQL. **Highest priority of all: apply the patched
`supabase/trial_access.sql` from item 16** — see `GAP_ANALYSIS.md` §0/§6 for why this ranks
above every other pending-SQL item.

## 7. Summary

| Area | Status |
|---|---|
| Module graph integrity | Clean — 0 critical, CI-enforced |
| RLS coverage | Clean — 0 tables missing RLS, CI-enforced |
| Secrets in tracked code | Clean — CI-enforced |
| **Full owner-approval bypass in `trial_access.sql`** | **Found and fixed this session (§6.16)** — validated against a live local PostgreSQL 16 instance; see `GAP_ANALYSIS.md` §0. The most severe finding on this branch |
| Stored XSS (owner admin panels, public leaderboard, dispatch log, constellation graph, contracts/reservations queue, error monitor, dormant activity ticker, external RSS feed) | 9 pages/vectors found and fixed across the second through seventh waves (§6.1, §6.11, §6.14, §6.15, §6.16, §6.18) — `.innerHTML`-interpolation check exhaustive across all three shapes (76 files) plus `bg.js`-loaded modules and external content sources, plus every RPC-consumer on `approvals.html` checked against its actual response shape |
| Silent-failure writes | Fixed (5 instances across two waves); established convention now checked repo-wide, no new gaps in the fifth-wave sweep |
| Wrong-table/wrong-shape query (chart, dispatch log, `access_audit_log`, `error_summary`, `my_points_balance`) | 5 instances found and fixed (§6.2, §6.14, §6.15, §6.16) — same bug class each time: client code assumes a response shape the server doesn't return |
| Missing tables (`notifications`, `user_assets`) | Fixed in code (§6.4, §6.7); **not applied live** |
| `notifications` population | Fixed this session (§6.9); production-tested this session (§6.19) — first attempt failed with `42P13`, corrected file **not yet re-applied** |
| `consultancy.html` booking flow (missing columns) | Fixed this session (§6.11); **not applied live** |
| `owner_apex_lock.sql` dead `nodes_earned` assignment | Fixed this session (§6.12) — owner-run manual script, not auto-applied |
| SQL schema organization — tables | Needs work — 47 duplicate table defs, unchanged from `REPO_AUDIT.md`; safe today (idempotent) |
| **SQL schema organization — functions** | **Found this session (§6.16)** — 10 functions with diverging (not just cosmetic) duplicate definitions, 3 with real behavioral risk including `is_platform_owner()` itself; unsafe (`CREATE OR REPLACE` overwrites unconditionally), needs a live `pg_proc` check — see `GAP_ANALYSIS.md` §3.1 |
| `nav.js` dead-key data quality | Found and fixed this session (§6.10) |
| `queue.html` dispatch log (wrong columns + stored XSS) | Found and fixed this session (§6.14) — pure client-code fix, no database action needed |
| `access_audit_log`/`error_summary` RPCs never worked for any caller | Found and fixed this session (§6.15, §6.16) — pure client-code fix, no database action needed |
| 3 `DROP TABLE`-containing files | **Confirmed dead this session (§6.17)** — zero references anywhere in CI/scripts/pages/functions |
| `omega-live.js`/`pulse.html` XSS | Found and fixed this session (§6.18) — pure client-code fix, no database action needed |
| Second repo (`V18`) drift | Resolved this session — fully resynced |
| Committed binary size (docx/mp4) | Unchanged, non-urgent (see `REPO_AUDIT.md` §2) |

The `trial_access.sql` fix aside — that one is a live-or-was-live security hole, treat as
urgent — nothing else here is a critical blocker for the app as deployed today. The
highest-leverage next steps: apply the patched `trial_access.sql` first (§0), then the
corrected `migrations/0013` and `0089`–`0092` (item 19's fix) to the live database —
everything else is either already fixed in code, or genuine hygiene debt with no functional
impact.
