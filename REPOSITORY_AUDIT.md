# Repository Audit — sydomega-live

**Date:** 2026-08-10
**Scope:** full working tree, branch `claude/syd-omega-agent-architecture-clko5e`, after all
fixes applied earlier in this branch's history (see §6 for the session log).
**Companion documents:** [`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md) (what exists),
[`GAP_ANALYSIS.md`](./GAP_ANALYSIS.md) (what's missing/broken and what to do about it).
**Relationship to `REPO_AUDIT.md`:** that file (2026-08-08) has been retired — it was never
one of the three companion documents `CLAUDE.md` §9 designates for upkeep, and by the time it
was retired this document already superseded it for every current number. Its two still-live
findings were folded in here first: the `setup.md` PII/project-ref note (§3) and the docx/mp4
LFS-migration debt (§4's binary-size row). Its §5 (token-economy present-tense language) had
already been independently fixed and documented in `CLAUDE.md` §8 before retirement, so nothing
there needed carrying forward.

---

## 1. What this repository actually is

A framework-free static site — 170 standalone `.html` pages, 93 root-level `omega-*.js`
modules — deployed to Vercel with no build step (`vercel.json`: `installCommand`/`buildCommand`
are both no-ops, `echo skip-install` / `echo static-no-build`). Backend is Supabase (Postgres +
Row Level Security + Edge Functions + Storage). There is no `src/`, no bundler, no framework;
every page loads `bg.js` (module loader / design-system injector / approval guard) via a plain
`<script>` tag. `nav.js` (sidebar) is auto-injected by `bg.js` — **this claim was false until
fixed this session** (see `CLAUDE.md` §8): `bg.js` loaded ~90 other modules but never actually
requested `/nav.js`, so the sidebar was empty on the ~160 pages without their own legacy
`<script src="/nav.js">` tag, confirmed with a real headless-Chromium render, not just a grep of
this claim. `package.json` declares zero dependencies — it exists only to document Node/npm
version constraints for tooling scripts, not for a build.

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
7 · CLIENT-REACHABLE SCHEMA REFERENCES — WARNING — 2 .from() tables never CREATE TABLE'd
                             (transactions, wallet_balances — both already known, §2.1)
8 · DIVERGING CLIENT-CALLED RPC DEFINITIONS — WARNING — 11 client-called RPCs with
                             non-identical definitions across supabase/*.sql
SUMMARY                    — critical: 0   warnings: 6   PASSED
```

All 6 warnings are pre-existing and understood — covered in §4 below or
`GAP_ANALYSIS.md` §2.1/§3.1 — not new findings. The important number is **critical: 0**,
meaning: every module `bg.js` / `omega-notify.js` / any page requests exists on disk, and
every table has RLS enabled.

**Checks 7 and 8 are new this session** — they automate two patterns this project has
repeatedly had to rediscover by hand across multiple audit sessions: a `.from()`/`.rpc()`
call site referencing a table/view/function that no `supabase/*.sql` file ever creates
(GAP_ANALYSIS.md §2.1's `transactions`/`wallet_balances` gap, and the historical
`user_assets`/`notifications`/`extend_trial` gaps before they were fixed), and a
client-called RPC whose `supabase/*.sql` definitions genuinely diverge across files —
argument list or body, not just whitespace (GAP_ANALYSIS.md §3.1's `is_platform_owner`/
`my_matrix`/`complete_task`/`apply_subscription` finding, discovered by a one-off
"script-assisted" pass in a prior session). Both are heuristic and source-only (like check
4's RLS finding, they say "verify against the live DB" rather than assert ground truth), and
both were validated against this repo's real, already-documented findings before being
wired in: check 7 correctly reproduces exactly the 2 known-dormant tables and zero false
positives; check 8's 11-function list includes all 3 of GAP_ANALYSIS §3.1's flagged
divergences (`my_matrix`, `complete_task`, `apply_subscription` — the last confirmed to
genuinely have 5-arg vs. 7-arg overloads once `supabase/functions/**/*.ts` was added to the
scanned call sites) plus 8 more that hadn't been individually named before. Point of both:
turn a manual sweep that depended on someone remembering to re-run it into something CI
runs on every push, so this class of bug can't silently regress again.

Other CI checks (`ci.yml`, not reproduced in `audit.py`): `node --check` on every root
`.js` file (syntax), a `service_role`/`SUPABASE_SERVICE` scan (blocking, 0 hits), `deno check`
on all 8 Edge Functions (non-blocking; `market-price`, added this session, not yet deployed —
see `CAPABILITY_INVENTORY.md` §3), `sw.js` precache vs. actual files (blocking),
`manifest.json` icon paths vs. actual files (blocking). All currently pass.

## 3. Security posture

- **RLS:** enabled and policy-scoped across all 104 tables; CI fails the build on any gap.
  `public.is_platform_owner()` is the consistent helper for owner-elevated access.
- **Secrets:** no hardcoded API keys/service-role keys found in tracked client code; CI's
  dedicated scan enforces this on every push. Edge Function secrets
  (`STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, etc.) are documented in
  `scripts/check-secrets.sh` as owner-managed via `supabase secrets set`, never committed.
  `setup.md` (deployment instructions, not client-shipped code, so outside CI's scan) does
  contain the owner's real personal email (`s.y.dagher@gmail.com`) and real Supabase
  project ref (`ydqhzvvoyufiiqvzcjns`) in plain text. Neither is a secret by itself — the
  project ref is already a public identifier visible in `bg.js`'s client-side Supabase URL —
  but if this repo is ever made public, that's worth a conscious decision rather than an
  accidental one (folded in from the now-retired `REPO_AUDIT.md` §3).
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

## 4. Schema organization

`supabase/` holds 111 loose `.sql` files, applied manually/in sequence; only 9 carry a
numeric prefix. 47 tables are defined in more than one file (`platform_settings`: 12 files,
`platform_owners`/`dispatches`: 10 each, down to `profiles`: 4) — reordered, not deduplicated,
in `supabase/migrations/` (94 files, `0001`–`0094`, Supabase-CLI convention). A full
end-to-end replay of all 94 files against a fresh scratch PostgreSQL 16 instance now succeeds
with zero manual intervention (first time this exact file set was verified — see
`migrations/README.md`'s "Full 94-file sequence validated" entry) — but that only proves
internal consistency on a **blank** database, not that it matches the owner's live schema.
It provably doesn't in at least one case: `task_completions` on the live database (`id bigint`,
an `axis`/`increment` column pair) matches none of the 3 competing `CREATE TABLE IF NOT EXISTS`
definitions for that table in the SQL bag. **The 47-duplicate-tables "safe because idempotent"
framing is therefore only safe relative to a fresh database, not proven safe as a stand-in for
what's actually live** — consolidating to one canonical definition per table needs a live
`information_schema.columns` check per table, not a bulk sweep (`GAP_ANALYSIS.md` §3/§6 item 8).
Owner-held live Supabase credentials have since been used this session (the `pg_proc`
verification query in `GAP_ANALYSIS.md` §3.1, and the `task_completions` schema check above),
and as of this session **every SQL fix file — `trial_access.sql`, `migrations/0013`,
`0089`–`0094` — has been applied to the live database and verified** via the new
`scripts/verify_fixes.sql` (see `GAP_ANALYSIS.md` §2/§3.1/§6). The 47-duplicate-table
consolidation itself (§3, item 8 above) remains the one open item in this section.

**Functions are a separate, higher-risk duplication class** — see `GAP_ANALYSIS.md` §3.1:
unlike tables, `CREATE OR REPLACE FUNCTION` overwrites unconditionally. Confirmed live via the
`pg_proc` query: `is_platform_owner()` and `my_matrix()` resolved to their correct definitions
(no action needed); `complete_task()` and `apply_subscription()` did not — both fixed, see
`CLAUDE.md` §8 and `GAP_ANALYSIS.md` §3.1 for the full writeup.

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
6. `roadmap.html`: fixed a broken reference to a `RUN_ORDER.md` file that had never existed
   in either repo (same bug already fixed once in `dashboard.html`, still present here at the
   time), and corrected stale decorative counts (Edge Function count, page/engine/SQL-file counts) to
   measured values. (Update, later session: that only fixed the dead link, not the underlying
   gap — `supabase/RUN_ORDER.md` itself still didn't exist, despite six other `.sql` files in
   `supabase/` depending on it by name for real ordering guidance. Created it; see root
   `CLAUDE.md` §8's "6 pre-existing audit.py warnings" entry.)
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
    (the `dispatches` RLS INSERT policy checks only `auth.uid() = user_id`, not column
    values — at the time of this fix via a policy named `"wire insert"`, since superseded by
    `dispatches_self_insert` in a later session's RLS consolidation, same self-or-owner shape)
    and were about to be rendered raw via `.innerHTML` with no escaping — a stored-XSS
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
    **Follow-up (later session):** owner ran the `pg_proc` query and provided results.
    `is_platform_owner()`/`my_matrix()` confirmed correct as deployed, no fix needed.
    `complete_task()`/`apply_subscription()` confirmed real and, worse, already live-breaking
    (every Stripe webhook call and every task-completion call failing in production, not just
    "could" break) — both reproduced against a scratch PostgreSQL 16 instance and fixed
    (`supabase/omega_apply_subscription_fix.sql`, `omega_complete_task_dedup_fix.sql`,
    `migrations/0093`–`0094`, plus the 5 client call sites). Full detail in `GAP_ANALYSIS.md`
    §3.1 and `CLAUDE.md` §8. **Applied to the live database and verified** this session via
    `scripts/verify_fixes.sql`.
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

20. **Eighth-wave sweep, this session — continued item 8 of `GAP_ANALYSIS.md`'s priority list
    (no live DB credentials held, so the DB-dependent action items 1-4 there aren't actionable;
    picked up the remaining code-only sweep instead).** Two parts:
    - Closed the one specific gap `GAP_ANALYSIS.md` §5.1 flagged as still not covered:
      `.innerHTML` built via string concatenation using `.concat()` rather than a literal `+`
      (invisible to the prior passes' `+`-grep). Found 8 files with `.innerHTML=[].concat(...)`
      (`contributions.html`, `governance.html`, `heritage.html`, `notifications.html`,
      `publications.html`, `treasury.html`, plus 2 more using `.concat()` for non-`innerHTML`
      array math). Traced every one: all six `.innerHTML=[].concat(...)` call sites read from
      `localStorage` only (`JSON.parse(localStorage.getItem(...))`), no `.from()`/`.rpc()` call
      anywhere in any of the six files — same self-scoped, non-cross-user category already
      established as safe for the finance/journal pages in `GAP_ANALYSIS.md` §4.2. Zero new
      findings from this half of the sweep, but it closes the specific open item.
    - Extended the `bg.js`-loaded-module check (item 18's category) to the 16 `omega-*.js`
      modules with both `.innerHTML` and `.from()`/`.rpc()` calls that item 18 hadn't
      individually traced yet. Found one real (if currently dormant) gap:
      **`omega-notify.js`'s notification panel** (`buildPanel()`, the widget `bg.js` injects
      platform-wide for the badge/toast/panel UI added in items 6/9/19) rendered
      `n.message`/`n.content`/`n.notification_type` from `public.notifications` rows straight
      into `.innerHTML` with no escaping — same unescaped-DB-field shape as every other
      stored-XSS instance in this log. Checked whether it's currently reachable: confirmed via
      `omega_notify_triggers.sql`'s `GRANT EXECUTE` list and `omega_notifications_fix.sql`'s
      `GRANT SELECT, UPDATE ON public.notifications TO authenticated` (no `INSERT` grant
      anywhere in any SQL file) that the only rows ever written are the five owner-gated
      `SECURITY DEFINER` trigger functions from item 19, each inserting a static string
      literal — so `message`/`content` are not attacker-controlled today. Same category as the
      `activity_feed` ticker in item 18: **fixed preemptively anyway**, since a future
      notification-generating event with free-text content (already flagged in
      `GAP_ANALYSIS.md` §2.2 as deliberately-undone future work) would silently re-open this
      exact hole otherwise. Added an `esc()` helper to `omega-notify.js` and applied it to all
      three fields. Also traced the same 16-module list's other `.innerHTML` sites
      (`omega-membership.js`, `omega-tier-gate.js`, `omega-user.js`, `omega-onboard.js`,
      `omega-chronometer.js`, `omega-demo-video.js`, `omega-realtime.js`, others) — all either
      interpolate static config (`omega-canon.json` tier/label data), numeric-only values, or
      the viewer's own session-scoped profile row (`omega-user.js`'s `hero-badges`, which does
      render the member-self-updatable `sign` field per the `sovereigns.html` finding in item
      1, but only ever the *viewing* member's own profile — every call site fetches via
      `.eq('id', session.user.id)` — so it's self-XSS-only, not a cross-user vector, matching
      the established non-issue category). One exception worth recording as a **positive**
      finding rather than a gap: `omega-realtime.js`'s live ticker also reads
      `activity_feed.title`/`member_name` (the same cross-user, member-writable table as item
      18's dormant ticker) but renders it via `.textContent`, not `.innerHTML` — correctly
      escaped by construction, no fix needed.

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
| Stored XSS (owner admin panels, public leaderboard, dispatch log, constellation graph, contracts/reservations queue, error monitor, dormant activity ticker, external RSS feed, dormant notification panel) | 9 pages/vectors found and fixed across the second through eighth waves (§6.1, §6.11, §6.14, §6.15, §6.16, §6.18, §6.20) — `.innerHTML`-interpolation check exhaustive across all four shapes (template-literal, `+`-concatenation, bare-variable, `.concat()` — 82 files) plus `bg.js`-loaded modules (all 93, including the 16 with both `.innerHTML` and `.from()`/`.rpc()` calls individually traced) and external content sources, plus every RPC-consumer on `approvals.html` checked against its actual response shape |
| Silent-failure writes | Fixed (5 instances across two waves); established convention now checked repo-wide, no new gaps in the fifth-wave sweep |
| Wrong-table/wrong-shape query (chart, dispatch log, `access_audit_log`, `error_summary`, `my_points_balance`) | 5 instances found and fixed (§6.2, §6.14, §6.15, §6.16) — same bug class each time: client code assumes a response shape the server doesn't return |
| Missing tables (`notifications`, `user_assets`) | Fixed in code (§6.4, §6.7); **applied live and verified** via `scripts/verify_fixes.sql` |
| `notifications` population | Fixed this session (§6.9); production-tested this session (§6.19) — first attempt failed with `42P13`, corrected file re-applied and verified; a second gap caught by verification (`extend_trial` missing its insert, an older copy had won a run-order race) fixed by re-running once more |
| `consultancy.html` booking flow (missing columns) | Fixed this session (§6.11); **applied live and verified** |
| `owner_apex_lock.sql` dead `nodes_earned` assignment | Fixed this session (§6.12) — owner-run manual script, not auto-applied |
| SQL schema organization — tables | Needs work — 47 duplicate table defs; "safe, idempotent" only proven true on a fresh database, not against live (§4, `task_completions` counterexample) |
| **SQL schema organization — functions** | **Found this session (§6.16)** — 10 functions with diverging (not just cosmetic) duplicate definitions, 3 with real behavioral risk including `is_platform_owner()` itself; unsafe (`CREATE OR REPLACE` overwrites unconditionally), needs a live `pg_proc` check — see `GAP_ANALYSIS.md` §3.1 |
| `nav.js` dead-key data quality | Found and fixed this session (§6.10) |
| `queue.html` dispatch log (wrong columns + stored XSS) | Found and fixed this session (§6.14) — pure client-code fix, no database action needed |
| `access_audit_log`/`error_summary` RPCs never worked for any caller | Found and fixed this session (§6.15, §6.16) — pure client-code fix, no database action needed |
| 3 `DROP TABLE`-containing files | **Confirmed dead this session (§6.17)** — zero references anywhere in CI/scripts/pages/functions |
| `omega-live.js`/`pulse.html` XSS | Found and fixed this session (§6.18) — pure client-code fix, no database action needed |
| Second repo (`V18`) drift | Resolved this session — fully resynced |
| Committed binary size (docx/mp4) | Unchanged, non-urgent — `.gitattributes` marks both `-diff -text`; neither is on Git LFS, so both permanently bloat every clone (folded in from the now-retired `REPO_AUDIT.md` §2; see `CLAUDE.md` §8 for the `.vercelignore`-is-the-only-deploy-time-defense detail) |

The `trial_access.sql` fix aside — that one is a live-or-was-live security hole, treat as
urgent — nothing else here is a critical blocker for the app as deployed today. The
highest-leverage next steps: apply the patched `trial_access.sql` first (§0), then the
corrected `migrations/0013` and `0089`–`0092` (item 19's fix) to the live database —
everything else is either already fixed in code, or genuine hygiene debt with no functional
impact.

## 8. Cross-repository survey — is there anything in the other 17 repos worth porting in?

This session was asked to analyze every repo in the `syd-omega-91717` account (all 18 were
already cloned locally, no `add_repo` needed) and pull in anything that would improve
`sydomega-live`. Full results below — recorded so a future session doesn't have to re-clone and
re-survey the same ground from scratch.

**7 repos are empty** (`1-18-2026`, `Omega-91717_syd`, `SYD_OMEGA_91717`,
`SydOmega91717_NoteBook-main`, `syd-omega-91717-hpn8`, `sydomega91717`,
`sydomega91717_vercel` — zero commits, `git branch -a` returns nothing). Nothing to check.

**`-_V18_SYDOMEGA91717` is a byte-for-byte match of this repo** (`diff -rq`, zero output,
excluding `.git`) — expected, a prior session (§6 item, "Second repo drift") fully resynced it.
Still nothing new; keep syncing it after future pushes if that's still wanted.

**The remaining 9 populated repos are earlier, divergent, or abandoned drafts — none had
content safe or valuable to port in:**

- `sydomega91717-chatgbt` (11 files) — pure aspirational scaffold. Its `bg.js`/`audio.js` are
  literal directory-tree diagrams (17 and 6 lines), not code; its README describes a
  Node/Express/PostgreSQL/Docker/Kubernetes "Enterprise Transformation Program" that was never
  built. Nothing to take.
- `sydomega91717-Claude` (180 files, last commit 2026-07-12 — a month behind this repo's
  2026-08-10) — an earlier snapshot of this same static site. 155 of its filenames already
  match this repo's current files. Checked its few genuinely unique files: `omega-fx.js` (the
  cosmology canvas animation) is **already merged into this repo's `bg.js` inline** — `bg.js`
  literally says "No external /omega-fx.js file required. Updating bg.js is enough." at the
  point it was folded in. `cosmos-canon-fix.js` patches a Virgo→Athena / duplicate-deity bug in
  `cosmos.html` that **this repo's current `cosmos.html` already has correct** (verified: line
  317 and 637 both read `deity:'ATHENA'` for Virgo, and the "duplicate" deity count is expected
  — each of the 12 deities legitimately appears once in the compact `SIGNS` array and once in
  the fuller compatibility-matrix array, not a real duplicate). `portal.html` is a
  public-marketing landing page (Twitter/OG cards, "sovereign multi-platform ecosystem" pitch)
  that contradicts this platform's deliberate non-public posture (`vercel.json` rewrites `/` to
  `/enter`, the login gate, and ships `X-Robots-Tag: noindex, nofollow` platform-wide) — not
  ported, on purpose. Net: this repo's useful ideas are already upstream; nothing left to take.
- `Project_SYD_91717` (101 files, 2 commits), `OMEGA_91717` (672 files, 50 commits),
  `SYD-OMEGA-91717` (27,353 files incl. `dist/`+`node_modules/`, a Next.js/React/Three.js
  rebuild), `S.Y.D_Omega_9171` (29 files), `SYD_OMEGA_91717_18-1-2026` (36 files) — all
  independent, ungrounded "sovereign empire" scaffolds (Solidity contracts never deployed,
  Python scripts named `.deadman_switch.py`/`.nano_defence.py`/`.self_audit.py`, investor
  pitch-deck drafts, Next.js/Docker/Kubernetes rebuilds) with near-zero filename overlap with
  this repo (9/672 for `OMEGA_91717`, lower for the others) and no working deployment. Their
  existence is exactly what `CLAUDE.md`'s opening paragraph already warns about — mythic
  "sovereign" framing without concrete engineering behind it. Importing any of their code would
  mean adopting a build step/framework this repo deliberately avoids (`CLAUDE.md` §9); importing
  their monetization/blockchain/NFT claims would reintroduce exactly the premature-claims problem
  `sovereign-covenant.html`'s dormant-token disclaimers were added to fix. Not ported.
- `SydOmega91717_NoteBook` (367 files, 50 commits) — a pnpm/turbo microservices monorepo
  (`packages/`, `services/`, `docker/`) — a different, abandoned architectural direction, only 6
  filenames in common. Its `docs/legal/` folder has draft `PrivacyPolicy.md`/
  `TermsOfService.md`/`NFT_Disclosure.md`/`corporate-structure.md` — **not imported**: this
  repo's actual `terms.html` is already a carefully-worded, 11-article page that specifically
  gates economics/tokens pending legal review (matching the dormant-token convention throughout
  this codebase); swapping in an unreviewed draft with an `NFT_Disclosure.md` would contradict
  that discipline and is a legal decision, not a code one — exactly the kind of thing `CLAUDE.md`
  says needs an explicit decision, not a unilateral import.
- `sydomega91717_Netifly` (21,536 files, single commit — a Vite/React/Three.js SPA build
  export, a different rebuild direction, not this repo's architecture) — **the one resource
  worth flagging for a future session, not acted on now:** `assets/generated/` holds roughly
  19,600 AI-generated PNGs across 7 categories (medals, certificates, horoscopes, UI, logos,
  gallery, backgrounds — ~2,800 files / ~12 MB each). This repo currently ships almost no
  custom art at all (`find . -iname '*.png' -o -iname '*.jpg' -o -iname '*.svg'` → 3 files
  total, the PWA icons) — real art could genuinely improve pages like `honors.html`/
  `awards.html`/certificate rendering, which are pure CSS/Unicode today. **Not imported this
  session**: the files are raw, uncurated batch-generation output (`prompt_XXXX_*.png` naming,
  no indication of which were selected as final), so pulling any of them in requires a human
  visually picking a small curated set — bulk-importing is both irresponsible (no way to vet
  thousands of images programmatically) and would recreate the binary-bloat problem this repo's
  own `CLAUDE.md` already flags for its two existing committed binaries. If the owner wants to
  pursue this, the concrete next step is: browse `sydomega91717_Netifly/assets/generated/<category>/`,
  hand-pick a handful of final images (not the whole batch), and add just those.

**Conclusion:** `sydomega-live` is the mature, actively-developed, canonical repo in this
account — every other populated repo is either an exact stale mirror (already resynced), a
superseded earlier draft whose useful fixes are already merged upstream, or a divergent,
never-completed rebuild attempt. No code or legal content from any of them was safe to bring in
without contradicting decisions this repo has already deliberately made. The one real asset —
`sydomega91717_Netifly`'s generated art library — needs human curation before it's actionable.

## 9. Navigation/IA audit — 64 of 169 pages (38%) have no entry in the persistent sidebar

Prompted directly by external usability feedback ("beautiful but hard to navigate"). This is a
research/planning pass, not a rebuild — findings and a proposed remediation, no `nav.js` changes
made yet (see the action item added to `GAP_ANALYSIS.md` §6).

**Method.** Parsed `nav.js`'s `PS` object (91 unique page-slug→section keys, after the
already-fixed dead-key cleanup, §5 above) and its `SECTIONS` array (15 desktop sections, 96
tooltip sub-links covering the same slug set) against the actual 169 `.html` files on disk.
Cross-referenced every page absent from both against every other page's raw content for any
`href=`/`location.href=` reference to it (not just `<a>` tags — `onclick="location.href=..."`
card patterns are common in this codebase, e.g. `intelligence.html`'s `.intel-card` grid), and
separately against `omega-search.js`'s Ctrl+K search index. Every number below is a direct count
from that parse, not an estimate.

- **64 of 169 pages have zero presence in `nav.js`'s sidebar** (not in `PS`, not in any
  `SECTIONS[].sub` tooltip link) — after excluding the 8 pages correctly exempted for being the
  pre-auth/system funnel itself (`account`, `enter`, `reset`, `terms`, `pending`, `404`,
  `offline`, `demo-check` — the same list `bg.js`'s own `PUBLIC` array already exempts from the
  approval guard, so this exclusion isn't a guess, it matches an existing, deliberate platform
  boundary).
- **61 of those 64 are reachable, but only through `dashboard.html`'s own separate "quick
  actions" link grid** — a parallel, informal navigation system with no connection to `nav.js`
  at all. 8 of the 61 (`atlas`, `cipher`, `codex`, `mindmap`, `nexus`, `pulse`, `sigma`,
  `signal`) are *also* independently linked from `intelligence.html`'s own separate
  `.intel-card` grid — a second, different informal hub with its own curated subset. Practical
  effect: a member on, say, `sleep.html` (reachable only via the dashboard grid) has no sidebar
  path to `budget.html` (same situation) — they'd have to navigate back to `dashboard.html`
  first and find the right tile again, because the one navigation surface that's present on
  every page (`nav.js`'s sidebar) doesn't know either page exists. These 61 pages span coherent,
  substantial domains that read as fully-built feature sets, not stragglers — averaging 438
  lines each, smallest is 114 (`maintenance.html`): a wellness/habit-tracking suite
  (`affirmations`, `breath`, `fasting`, `gratitude`, `habits`, `journal`, `meditate`, `mood`,
  `nutrition`, `oath`, `rituals`, `sleep`, `stoic`, `targets`, `water`, `weekly`, `workout`), 3
  of the 7 pages in the documented `localStorage`-only finance suite (`budget`, `expenses`,
  `wealth` — `wallet`/`treasury`/`revenue`/`investment`, the other 4, *are* in `nav.js`, so this
  specific suite is split half-navigable, half-not), a personal-productivity set (`contacts`,
  `decisions`, `missions`, `network`, `notes`, `projects`, `quotes`, `time`, `vision`), a
  lore/cosmos set (`chronicle`, `dna`, `graph`, `map`, `mirror`, `oracle`, `realm`, `rune`,
  `tribe`), the 8 `intelligence.html`-only "intel modules" above, and a study/reference set
  (`architect`, `clarity`, `codex`, `flashcard`, `focus`, `forge`, `library`, `mentors`,
  `ops`, `physiology`, `principles`, `reading`, `skills`, `vocabulary`).
- **3 pages have no page-to-page link anywhere in the repository at all**: `awards.html`,
  `maintenance.html`, `publications.html`. Checked a third discovery path for these
  specifically — the Ctrl+K search index (`omega-search.js`) — since a page could still be
  findable there even with zero direct links. `awards` and `publications` are indexed there
  (`{t:'AWARDS',...,u:'/awards.html'}`, `{t:'PUBLICATIONS',...,u:'/publications.html'}`), so a
  member who thinks to search for them can still find them. **`maintenance.html` is not in the
  search index either** — confirmed via direct grep, not assumed — meaning it has *no* discovery
  path anywhere on the platform: not the sidebar, not any other page's content, not search. The
  only way to reach it is knowing the exact URL. It's a real, substantial page (114 lines, a
  working feature), not a stub.
- **Mobile navigation covers even less than desktop.** `nav.js`'s `DRAWER_SECTIONS` (the
  hamburger-menu drawer that's the *only* way to reach anything beyond the 4 fixed bottom-bar
  icons — `command`/`ascend`/`vault`/`cosmos` — on a phone) lists 9 of the 15 desktop
  `SECTIONS` keys. The missing 6 — `arena`, `govern`, `invest`, `achieve`, `archive`, `media` —
  cover 54 distinct sub-pages between them (AI/analytics/automation/research, governance/
  compliance/privacy/roadmap, portfolio/wallet/revenue/treasury/blockchain, the entire
  achievements/leaderboard/gates/levels/ascension gamification track, identity documents/
  passport/KYC/credentials, and cinema/series/social/news/events). These pages *are* in the
  desktop sidebar and fully functional — this is purely a mobile-drawer omission, distinct from
  the 64-page gap above (some overlap: e.g. `wallet`/`portfolio` are desktop-navigable but
  mobile-invisible). Given how much of this repo's own history is already mobile-focused
  (`bg.js`'s "MOBILE GLOBAL FIXES" block, touch-target sizing, WCAG passes), this specific gap —
  40% of top-level sections simply absent from the one mobile navigation surface that exists —
  reads as an oversight from when `DRAWER_SECTIONS` was written against an earlier, smaller
  `SECTIONS` list and never kept in sync as the desktop nav grew to 15, not a deliberate
  trim.

**Proposed remediation (not implemented this pass — planning only, per the scope this audit was
asked for):**
1. Fold the 61 dashboard/intelligence-only pages into `nav.js`'s `PS` map and the relevant
   existing `SECTIONS[].sub` array (most map cleanly onto an existing section by theme — e.g.
   the wellness suite under a new or existing personal-tracking section, `budget`/`expenses`
   into the existing `invest` section alongside `wealth`) rather than inventing new top-level
   sections for all of them — 15 is already a lot of icons in a fixed-width dock.
2. Add a 16th `maintenance` entry somewhere reachable (even a single `govern` sub-link would
   take it from zero discovery paths to one) — the smallest, cheapest fix in this whole finding.
3. Sync `DRAWER_SECTIONS` to the full 15-section list, or at minimum add the 6 missing sections
   — this is a self-contained `nav.js` change with no page-content risk, the most isolated fix
   here.
4. Leave `dashboard.html`'s and `intelligence.html`'s own quick-action grids in place — they're
   a reasonable "featured shortcuts" pattern for a subset of pages, not the bug; the bug is that
   they're currently the *only* path for 61 pages instead of a convenience alongside a sidebar
   entry that also exists.
This is real surface-area work across a file every page loads (`nav.js`) — sized similarly to
the `.card`/`.tab-btn` sweeps already done this session, but touching navigation structure
rather than typography, so flagged for an explicit go-ahead rather than started unprompted.

### 9.1 Addendum — implemented, per go-ahead given in response to `UX_REDESIGN_BRIEF.md`

All three remediation items above were implemented as scripted, anchor-verified string edits
(each insertion point checked for uniqueness before writing, so nothing could silently land in
the wrong place):

- **All 64 orphaned pages folded into `nav.js`'s `PS` map and the matching `SECTIONS[].sub`
  array**, grouped by theme into existing sections rather than inventing new top-level ones:
  wellness/habit-tracking + `body`/`physiology` → `services` (alongside the existing
  `health.html` anchor, 19 pages); `budget`/`expenses`/`wealth` → `invest` (3); personal-
  productivity (`contacts`, `decisions`, `missions`, `network`, `notes`, `projects`, `quotes`,
  `time`, `vision`) → `command` (9); lore/cosmos (`chronicle`, `dna`, `graph`, `map`, `mirror`,
  `oracle`, `realm`, `rune`, `tribe`) → `cosmos` (9); the `dashboard.html`/`intelligence.html`-
  only "intel modules" (`atlas`, `cipher`, `codex`, `mindmap`, `nexus`, `pulse`, `sigma`,
  `signal`) → `intel` (8, confirmed by reading each page's own `<title>` rather than assumed);
  study/reference (`architect`, `clarity`, `flashcard`, `focus`, `forge`, `library`, `mentors`,
  `principles`, `reading`, `skills`, `vocabulary`) → `ascend` (11); `maintenance`/`ops` →
  `govern` (2); `queue` → `arena` (1, its own title reads "SOVEREIGN QUEUE" — an
  automation/task-execution fit); `awards` → `achieve` (1); `publications` → `media` (1).
  `maintenance.html` — the one page with zero discovery path anywhere on the platform — now has
  one, via `govern`.
- **`DRAWER_SECTIONS` (mobile) synced from 9 to all 15 desktop sections** — added `arena`,
  `govern`, `invest`, `achieve`, `archive`, `media` with the same icon/color/href as their
  `SECTIONS` array entry and a curated links list matching the existing drawer entries' density.
- **Verified, not just written**: a scripted re-run of the same gap-detection method used to
  find the original 64 confirms 0 pages now missing from the sidebar; `node --check nav.js`
  passes; `scripts/audit.py` reconfirms 0 critical / 6 pre-existing warnings (unchanged, no
  regressions); no duplicate `PS` keys were introduced (155 keys, 0 duplicates — the exact bug
  class `nav.js`'s own comments already warn about, §5); headless Chromium confirms all 64 new
  hrefs resolve to real pages (HTTP 200) and the desktop sidebar renders exactly 15 icon glyphs
  (one per section, matching `SECTIONS.length`) with the correct mobile drawer section count.
  Full authenticated-session hover/click interaction wasn't practical to verify in this
  environment (`bg.js`'s approval guard hides the shell for an unauthenticated test session) —
  worth a manual check post-deploy. Not a new issue: the same nested-tooltip-inside-anchor HTML
  pattern this uses was already present, unchanged, in every pre-existing section before this
  edit.
