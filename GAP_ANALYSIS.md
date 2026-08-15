# Gap Analysis — sydomega-live

**Date:** 2026-08-10. **Companion documents:** [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md),
[`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md).

Every item below is either a **confirmed, fixed-in-code gap still pending an owner action**
(applying SQL to a live database — no session in this project's history has held live
Supabase credentials), a **confirmed, still-open gap**, or a **product decision deliberately
left undone**. Nothing here is speculative; each cites the evidence. Priority follows this
project's own established convention (security/data-integrity first).

## 0. P0 — CRITICAL: full owner-approval bypass in `supabase/trial_access.sql` (fixed this session, validated against a live PostgreSQL 16 instance)

**This is the most severe finding across every session on this branch — a complete authentication/approval bypass, not just a data-exposure bug.**

`supabase/trial_access.sql` defines `grant_permanent_access(uuid)`, `grant_trial_access(uuid)`,
and `expire_trial(uuid)` — all three `SECURITY DEFINER`, all three `GRANT EXECUTE ... TO
authenticated`, and **none of them checked who was calling**. Any signed-in member could open
the browser console on any page (the anon/publishable key is public by design) and run:

```js
await sb.rpc('grant_permanent_access', { p_uid: (await sb.auth.getUser()).data.user.id })
```

— instantly, permanently self-approving to full platform access, completely bypassing the
pending queue, the owner review step, and the entire approval system this platform is built
around. `expire_trial(uuid)` was worse in the other direction: it took *any* uuid with no
ownership check, so one member could call it against another member's id to revoke their
access, reset all three of their axes to 1.0, and permanently delete their `task_completions`
— a griefing/data-destruction vector against arbitrary other members.

**Why this had gone unnoticed:** `supabase/0003_privilege_lockdown.sql` (already in the repo,
predates this session) documents and fixes this *exact* vulnerability class, and 7 other files
that also define these same three functions (`chunk_02b_migrations.sql`,
`chunk_07_migrations.sql`, `migration_runner.sql`, `omega_access_control.sql`,
`omega_master_deploy.sql`, `omega_notify_triggers.sql`, `trial_fix.sql`) all already carry the
guard (`IF auth.uid() <> p_uid AND NOT public.is_platform_owner() THEN ... forbidden`). It
looks, at a glance, like the hole was closed platform-wide. **`trial_access.sql` itself was the
one copy that was missed** — and critically, each of its three functions opens with an
unconditional `DROP FUNCTION IF EXISTS ...`, which sidesteps Postgres's own protection against
silently replacing a function with an incompatible signature (`42P13`). This means applying
`trial_access.sql` *after* any of the 7 guarded copies — entirely possible, since the flat
`supabase/*.sql` bag has no enforced application order (`CLAUDE.md` §5) — would silently
overwrite the guarded, safe functions with these unguarded ones, **reopening the hole on a
platform that already believed it was fixed**.

**Fixed** by adding the identical, already-proven `IF auth.uid() <> p_uid AND NOT
public.is_platform_owner()`-style guard used verbatim by the other 7 copies — not a new
design, the one file that never got the established convention. Then **validated end-to-end
against a real, throwaway local PostgreSQL 16 instance** (this environment has `postgresql-16`
installed; spun up a scratch database, stubbed `auth.uid()`/`is_platform_owner()`, applied the
patched file, and ran four scenarios):

| Scenario | Expected | Result |
|---|---|---|
| Attacker calls `grant_permanent_access(own-uid)` | Denied, `access_approved` stays `false` | ✅ Denied |
| Attacker calls `expire_trial(victim-uid)` | Denied, victim's row and `task_completions` untouched | ✅ Denied, victim's `access_approved` still `true`, 1 task_completion still present |
| Owner calls `grant_permanent_access(attacker-uid)` | Succeeds — legitimate path preserved | ✅ `access_approved` becomes `true` |
| Member calls `expire_trial(own-uid)` | Succeeds — self-service path preserved | ✅ `access_approved` becomes `false` |

Database dropped after the test; no live credentials were used or required, since the exploit
and the fix are both provable against a schema-only scratch instance. **Applied to the live
database and verified this session** — `scripts/verify_fixes.sql` confirmed
`grant_permanent_access`'s live body now contains the `is_platform_owner()` guard. The hole is
closed. Whether this file was *ever* applied to production in its original unguarded form
before this fix — worth checking `select * from public.access_grant_audit order by
occurred_at desc;` and cross-referencing `select id, display_name, access_approved, is_trial,
created_at from public.profiles where access_approved=true order by created_at desc;` for any
approved member the owner doesn't remember approving, per `0003_privilege_lockdown.sql`'s own
verification section, which applies identically here — remains open and worth a look, since
verifying the *current* guard says nothing about what may have happened before it existed.

## 1. P0 — Security (all fixed in code this session)

| Gap | Evidence | Status |
|---|---|---|
| Stored XSS in `approvals.html`/`profile.html` | `display_name`/`email` rendered via raw `.innerHTML`; `display_name` is self-updatable by any member (`omega_profile_fields.sql`) | **Fixed** — `esc()` helper added, both files escaped |
| Stored XSS in `sovereigns.html` | `profiles.sign` (self-updatable, `chunk_02b_migrations.sql`'s per-column GRANT list) queried for every `access_approved` member and rendered raw via `.innerHTML` in two places (table row, throne card) — no `user_id` filter, so reachable by/visible to the whole membership, not just the owner | **Fixed** — `esc()` helper added, both occurrences escaped |
| Stored XSS in `queue.html`'s dispatch log | `dispatches.category`/`title`/`body` are member-writable (RLS `"wire insert"` policy checks only row ownership, not column values) and were rendered raw via `.innerHTML` in the OPS queue's "PLATFORM DISPATCH LOG" panel, visible to the owner | **Fixed** — see §4.6 (bundled with the same panel's wrong-column-name fix) |
| Stored XSS in `graph.html`'s constellation-graph tooltip | `profiles.display_name` (self-updatable, every `access_approved` member queried with no `user_id` filter) rendered into the member-node tooltip's `.innerHTML`. The code *attempted* to escape it — `nm.textContent=m.name` then read `nm.textContent` back — but reading `.textContent` returns the original unescaped string (that trick only works if you read `.innerHTML` back instead), so the "escaping" was a no-op. Reachable by hovering any member node; visible to any other approved member or the owner who opens the page | **Fixed** — added a real `escGraph()` helper and used it in place of the broken round-trip |
| Stored XSS in `approvals.html`'s reservations queue | `review_reservations()` RPC (owner-only) returns `media_reservations` rows verbatim; `title` is a `NOT NULL text` column any authenticated member can set to anything via the `mr_insert` policy (`auth.uid()=user_id`, no content restriction — the same page members use to submit ad reservations). `approvals.html`'s queue rendered `row.title` raw via `.innerHTML`, unlike every other field on the same page. The sibling `review_contracts()` render had the identical unescaped pattern; `commission_contracts` has no `title`/`type` column today so it wasn't exploitable *yet*, but was fixed defensively for the same reason | **Fixed** — both now go through the page's existing `esc()` |
| Error-monitor free text unescaped, reachable **without authentication** | `report_client_error()` is `GRANT`ed to `anon` *and* `authenticated` (by design — it needs to catch errors from signed-out visitors too) and stores `p_page`/`p_message` with only a length truncation, no sanitization. `error_summary()` (owner-only) aggregates and returns them; `approvals.html`'s error-monitor panel rendered `row.message`/`row.page` raw via `.innerHTML` — reachable by literally anyone on the internet with no login, the widest possible reach of any stored-XSS instance found across this whole audit | **Fixed** — same `esc()`, bundled with the response-shape fix below |
| Stored XSS in `omega-live.js`'s ticker (dormant) | `activity_feed.title` rendered raw via `.innerHTML`; RLS lets any member insert their own `is_public=true` row with an arbitrary title. Currently unreachable — no page has a `[data-live-ticker]` element yet — but `bg.js` loads this module on every page and it clearly exists to power one | **Fixed preemptively** — `esc()` added |
| Reflected XSS in `pulse.html` (external source, not a Supabase table — a different vector than the rest of this sweep) | `item.title` from a Reuters feed proxied via `api.rss2json.com` (plain `fetch()`, no `.from()` call) rendered raw via `.innerHTML` — a compromised/MITM'd feed response would execute script. Missed by the `.from()`-call-centric sweep below since it isn't a database read | **Fixed** — `esc()` added |
| Stored XSS in `omega-notify.js`'s notification panel (dormant) | `n.message`/`n.content`/`n.notification_type` from `public.notifications` rendered raw via `.innerHTML` in `buildPanel()`. Currently unreachable — no `GRANT INSERT` exists on the table for `authenticated`, so the only writers are the 5 owner-gated `SECURITY DEFINER` trigger functions in `omega_notify_triggers.sql`, each inserting a static string literal — but a future free-text notification event (already flagged in §2.2 as deliberately-undone work) would silently re-open this, same shape as the `omega-live.js` ticker above | **Fixed preemptively** — `esc()` added |

This session ran a systematic, evidence-based sweep for all three established bug classes
(stored XSS via unescaped `.innerHTML`, silent-failure writes, and queries against
tables/RPCs absent from the schema) across every page not yet covered by a prior pass:
- **Missing table/RPC check:** cross-referenced every `.from('table')` and `.rpc('fn')` call
  site across all 170 `.html` files against `CREATE TABLE`/`CREATE FUNCTION` statements in
  `supabase/*.sql` (script-assisted, not manual). Only the already-documented gaps in §2/§2.1
  turned up (`transactions`, `wallet_balances`) — `top_pages` initially flagged is a `VIEW`
  (`omega_telemetry.sql`), a false positive from a `CREATE TABLE`-only grep. No new missing
  table/RPC gaps found.
- **innerHTML sweep (template-literal pass):** every file with template-literal interpolation
  into `.innerHTML` (`atlas.html`, `cosmos.html`, `honors.html`, `matrix.html`, `media.html`,
  `mentors.html`, `mindmap.html`, `queue.html`, `targets.html`, `vocabulary.html`, plus the
  already-fixed `family.html`/`profile.html`) checked for its data source. `atlas.html`/
  `mentors.html`/`mindmap.html` read `localStorage` only (self-scoped, not a cross-user
  vector, same category as the finance-pages client-only design in §4.2). `cosmos.html`/
  `honors.html`/`matrix.html`/`media.html`/`targets.html`/`vocabulary.html` interpolate
  static local config arrays (zodiac/agent/phase/system rosters baked into the page), not
  database content. `queue.html` was the one real finding — see §4.6.
- **innerHTML sweep (string-concatenation pass, second wave):** the 54 files building
  `.innerHTML` via `+`-concatenation rather than template literals, traced the same way.
  20 have zero `.from()` calls at all (pure local/computed state — `affirmations.html`,
  `architect.html`, `body.html`, `breath.html`, `budget.html`, `exam.html`, `fasting.html`,
  `mood.html`, `nutrition.html`, `ops.html`, `passport.html`, `projects.html`, `pulse.html`,
  `quotes.html`, `reading.html`, `skills.html`, `time.html`, `water.html`, `weekly.html`,
  `workout.html` — safe from a *Supabase-XSS* perspective, though `pulse.html` turned out to
  have the separate external-feed XSS above, since that sweep was scoped to `.from()` calls
  specifically). Of the remaining 34: `marketing.html`/`news.html`/
  `sovereigns.html`/`hall.html` already use their own `esc()` on the one field that needed it
  (confirmed, not just assumed); `kings.html`/`cinema.html`/`travel.html` already escape their
  Wikipedia-API `extract` field; `tribe.html`'s one member-sourced field (`display_name`) goes
  through `.textContent`, not `.innerHTML`; `health.html`/`travel.html`/`publishing.html`/
  `research.html` query self-scoped tables only (`*_own`-style RLS or an explicit
  `.eq('user_id', ...)` — confirmed per-table, not assumed) so any unescaped free text is a
  self-XSS-only vector, same non-issue category as §4.2's localStorage pages; the rest
  (`beacon.html`, `ecosystem.html`, `elements.html`, `events.html`, `factions.html`,
  `forge.html`, `income.html`, `membership.html`, `prediction.html`, `realm.html`,
  `search.html`, `sigil.html`, `sovereign.html`/`sovereign-ai.html`, `subscriptions.html`,
  `demo-check.html`, `codex.html`) interpolate static config arrays or the viewer's own
  `.eq('id', session.user.id)`-scoped profile. Zero new instances in the `+`-concatenation
  pass itself.
- **innerHTML sweep (bare-variable pass, third wave):** while grepping for the
  string-concatenation shape, also checked the adjacent pattern `.innerHTML=someVar` with no
  visible `+` or `${}` at the assignment site (the variable was built up earlier) — 12 files
  matched (`automation.html`, `charter.html`, `command.html`, `exam.html`, `gates.html`,
  `graph.html`, `grid.html`, `habits.html`, `marketing.html`, `profile.html`, `realm.html`,
  `stoic.html`). Traced each variable's construction back to its source: `charter.html`/
  `command.html`/`stoic.html`/`exam.html` have zero `.from()` calls (static/local only);
  `automation.html`'s `r.icon` and `grid.html`'s grid cells come from static config arrays, not
  the DB rows they're joined against; `habits.html` is `localStorage`-only; `gates.html`/
  `marketing.html`/`profile.html`/`realm.html` are self-scoped or already-escaped (confirmed
  above). **`graph.html` was a real finding** — see the table above and §4.9.
- **omega-live.js pass:** `bg.js`-loaded modules aren't `.html` pages, so weren't covered by
  the per-page sweeps above; checked separately and found the dormant ticker XSS above.
- **`omega-*.js` module pass, extended (this session):** all 16 `bg.js`-loaded modules that
  have both `.innerHTML` and `.from()`/`.rpc()` calls traced individually (`omega-notify.js`
  found above; `omega-chrono.js`, `omega-chronometer.js`, `omega-demo-video.js`,
  `omega-emblems.js`, `omega-feedback.js`, `omega-gate.js`, `omega-membership.js`,
  `omega-onboard.js`, `omega-progress.js`, `omega-realtime.js`, `omega-share.js`,
  `omega-shell.js`, `omega-tier-gate.js`, `omega-user.js` all interpolate static config,
  numeric-only values, or the *viewing* member's own session-scoped profile row — self-XSS-only
  at worst, matching the established non-issue category). `omega-realtime.js` is worth noting
  as a positive control: it reads the same cross-user, member-writable `activity_feed` table as
  the dormant `omega-live.js` ticker, but renders it via `.textContent`, correctly escaped by
  construction — no fix needed, confirming the bug class isn't systemic to every ticker.
- **`.concat()` innerHTML pass (closes the one specific §5.1 gap from the prior session):**
  files build `.innerHTML` via `[].concat(...)` rather than a `+`-visible-to-grep
  concatenation. All 7 that actually feed `.innerHTML` — `contributions.html:172,199`,
  `governance.html:209,229,245`, `heritage.html:154,169`, `kings.html:158`,
  `notifications.html:164,181`, `publications.html:162`, `treasury.html:250,290` (13 instances
  total; re-verified by direct grep during the merge that reconciled this session with the
  prior one, which had undercounted by one file — `kings.html`'s `studyNotes` array was missed)
  — read from `localStorage` only — zero `.from()`/`.rpc()` calls for any of the underlying
  arrays in any of the seven — same self-scoped category as §4.2's finance pages. No new
  findings, but the 7-file/13-instance count (not 6/unspecified) is the accurate one.
- **Silent-failure-write sweep:** every `.html` file calling `.insert()`/`.update()`/
  `.upsert()`/`.delete()` against Supabase (23 files) checked for whether the write's
  `.error` gates the success message. `account.html`, `contracts.html`, `health.html`,
  `marketplace.html`, `oath.html`, `publishing.html`, `research.html`, `terms.html`, and
  `consultancy.html` — the files not already covered by a prior session's fix — all correctly
  check `.error`/throw-and-catch before reporting success. No new silent-failure-write gaps
  found in that pass — but that pass checked `.error`-gating, not whether the written column
  names actually match the live schema, which is a different failure mode (PostgREST rejects the
  whole write before `.error` even becomes "did we handle it correctly"). A later, broader sweep
  (see `CLAUDE.md` §8) diffed every page's `.insert()`/`.update()`/`.upsert()` payload keys
  against the real `CREATE TABLE` column lists and found two more this way:
  `advertising.html`'s entire Live Ads/Submit feature (near-total column-name mismatch against
  `public.advertisements`) and `approvals.html`'s dispatch-send fallback path (wrote
  `sent_by`/`sent_at`, columns that exist in neither divergent `dispatches` shape, with no
  `.error` check at all — the false-success-toast variant this section was originally looking
  for, just missed because the column-mismatch masked it). Both fixed; see `CLAUDE.md` §8 for
  full detail.
- **Incidental finding, not XSS but turned up by the same sweep — `access_audit_log` RPC
  response-shape mismatch, fixed:** see §2 (new row) and §4.8.
- **`member_events` dead-write gap — fixed (`FEATURE_IDEAS.md` #1).** `events.html:199`
  inserts into `public.member_events` (RLS: `"events are visible to all members"`, public
  SELECT), but grep had confirmed **no page anywhere in the repo ever selected from it** — the
  table had been write-only since whatever session added the insert. Not a security issue
  (nothing rendered the data, so no XSS surface existed despite the permissive read policy),
  but a real completeness gap. Smallest-scope fix per `FEATURE_IDEAS.md` #1: a read-only
  "RECENT MEMBER SUBMISSIONS" feed added to `events.html`'s existing SUBMIT tab
  (`.from('member_events').select(...).order('created_at',{ascending:false}).limit(20)`), using
  the same `esc()`-escaping convention as `contracts.html`/`dashboard.html`/`approvals.html`/
  `profile.html` since `title`/`description`/`event_type`/`format` are member-writable text. No
  schema/RLS change. Verified with a Node harness feeding the render function real data
  (including an XSS payload in `title`/`description`) plus empty and `.error` cases — escaping,
  empty-state, and error-state all confirmed correct.

A full re-sweep of all 170 pages for every possible bug class still has not been performed —
eight session-level passes now (this one covering three `.innerHTML`-shape sub-waves, the
`omega-live.js`/`pulse.html` non-page-scoped pass, the missing-table/RPC and
silent-failure checks, and this session's `.concat()`-shape pass plus the extended
`omega-*.js` module trace) cover a growing subset, not an exhaustive one — see §5.1.

## 2. P0/P1 — Data integrity: fixed in code, applied to the live database and verified

The owner applied every file in this section to the live database, then ran
`scripts/verify_fixes.sql` (added this session) against it, which confirmed each one directly
via `information_schema`/`pg_proc` — not inferred from "no rows returned." One real gap the
verification caught: `extend_trial` initially lacked its notification-insert (an older copy of
the function had won a run-order race against `omega_notify_triggers.sql`); re-running
`omega_notify_triggers.sql` once more, last, fixed it — confirmed via a follow-up query. That's
the concrete version of the "whichever file runs last wins" risk this file has warned about —
worth remembering for any future SQL applied outside a strict, deliberate order.

| Gap | Evidence | Fix location | Live DB status |
|---|---|---|---|
| `public.notifications` table missing | `omega-notify.js` (platform-wide via `bg.js`) queries it; no `CREATE TABLE` existed anywhere | `supabase/omega_notifications_fix.sql`, `migrations/0091` | **Applied, verified** |
| `public.user_assets` table missing | `portfolio.html`/`vault.html` query it; no `CREATE TABLE` existed anywhere | `supabase/omega_user_assets_fix.sql`, `migrations/0089` | **Applied, verified** |
| `extend_trial` RPC missing | `approvals.html`'s extend button calls it; function never existed | `supabase/omega_extend_trial_fix.sql`, `migrations/0090` | **Applied, verified** |
| `notifications` table never populated | Table existed (once applied) but nothing inserted a row | `supabase/omega_notify_triggers.sql`, `migrations/0092` (5 RPCs now insert on event) | **Applied, verified — required a second run.** First live attempt hit `42P13: cannot change return type of existing function` on `grant_permanent_access` (fixed by adding a dynamic drop-prior-versions block, see prior entry in this file's history). After that fix was applied, `extend_trial` specifically still lacked the notification insert — a per-function check (`pg_get_functiondef(oid) ilike '%insert into public.notifications%'`) showed the other 4 functions had it but `extend_trial` didn't, meaning something else with its own copy of `extend_trial` ran after this file. Re-running `omega_notify_triggers.sql` once more (idempotent, safe) fixed it; re-verified via the same per-function query, now all 5 pass. |
| Authority History chart queried wrong table | `omega-chart.js` queried nonexistent `authority_snapshots`; real table is `leaderboard_snapshots` | Table name corrected in `omega-chart.js` directly | N/A — no schema change needed, fix is live in code |
| `consult_requests` missing 3 columns `consultancy.html` sends | Form sends `{domain,contact,preferred_time,brief}`; table only had `domain`/`message`/`urgency`/`commission_rate`/`confidentiality_accepted` — every submission errored, booking flow fully non-functional | `supabase/omega_consult.sql`, `migrations/0013` (non-destructive `ALTER ADD COLUMN`) | **Applied, verified** |
| `access_audit_log` RPC response shape mismatch | Both callers (`approvals.html`, `vault.html`) treated `r.data` as a plain array; the RPC actually returns `{ok, rows:[...]}` (all 3 definitions agree). Result: `vault.html`'s `.slice()` on the object always threw, silently falling back to fabricated demo entries presented as real security log; `approvals.html`'s `!rows.length` on the object always read as empty, showing "NO AUDIT ENTRIES" even when real rows existed. Broken for every caller, including the owner — the RPC's actual intended audience | Both files' client code corrected to read `r.data.rows`; field names remapped to what the RPC actually returns (`action`/`subject`/`actor`, not the imagined `event`/`event_type`/`status`/`user_id`) | N/A — no schema change needed, both fixes are pure client-code, live the moment deployed |
| `error_summary` RPC — same response-shape bug as `access_audit_log` | Same `{ok,rows:[...]}` wrapper convention (all 3 definitions agree), same wrong assumption in `approvals.html`'s error-monitor panel (`r.data\|\|[]`) — always showed "NO CLIENT ERRORS RECORDED" regardless of real content; also referenced a `row.count` field the RPC doesn't return (real field is `hits`) | Corrected to `r.data.rows`, field name `hits`, and escaped (see §1 — this RPC's data is reachable by unauthenticated `anon` callers via `report_client_error()`) | N/A — pure client-code, live the moment deployed |
| `my_points_balance` RPC response shape mismatch | Returns `{ok,balance}`; `blockchain.html` did `Number((await sb.rpc(...)).data).toFixed(0)` — `Number()` on an object is `NaN`, so the Ω points balance display always showed "Ω NaN" regardless of the member's real balance | `blockchain.html` corrected to read `.data.balance` | N/A — pure client-code, live the moment deployed |

**Also applied and verified this session (not previously tracked in this table):**
`supabase/omega_apply_subscription_fix.sql`/`migrations/0093` and the amended
`omega_complete_task_dedup_fix.sql`/`migrations/0094` (§3.1) — see there for the full
verification detail, including the `pg_get_function_identity_arguments()` gotcha (it never
includes `DEFAULT` clauses, so verifying a function's signature must compare bare names/types).
`supabase/trial_access.sql`'s owner-approval-bypass guard (§0) — confirmed live via
`pg_get_functiondef(oid) ilike '%is_platform_owner%'` on `grant_permanent_access`.

Every SQL fix tracked in this file has now been applied to the live database and verified —
none of the previously-"Not applied" items remain outstanding as of this session.

### 2.1 Still genuinely missing (not fixed — no code exists yet)

| Gap | Evidence |
|---|---|
| `subscriptions.html` queries `public.transactions` | Table doesn't exist. Page's own empty-state copy already says "PAYMENT ACTIVATION PENDING LEGAL REVIEW" — reads as intentional, not accidental |
| `vault.html` queries `public.wallet_balances` | Table doesn't exist. Consistent with the Ω token economy being documented elsewhere as dormant (`platform_settings.tokens_enabled = false`) |

Both left undone on purpose per `CLAUDE.md`'s own rule against building monetizable/token
infrastructure without an explicit gating decision first — not silently fixed in this pass
either.

### 2.2 `user_assets`: table exists in code, nothing populates it

Per `omega_user_assets_fix.sql`'s own header: rows are meant to be written server-side
(mission outcomes, trade, sovereign grants), and neither `portfolio.html` nor `vault.html`
ever calls `.insert()`/`.update()` on it. **No trigger events for this exist in the codebase
yet** (no "trade" mechanism, no "mission outcome" reward pipeline) — unlike `notifications`
(§2, fixed this session), this one was deliberately left unbuilt because building it would
mean inventing business logic that doesn't exist, not just wiring up already-defined events.

## 3. P1 — Schema hygiene

| Gap | Evidence | Recommendation |
|---|---|---|
| 47 tables defined in >1 SQL file | `scripts/audit.py` output — `platform_settings` in 12 files, `platform_owners`/`dispatches` in 10 each | "Idempotent, safe to replay" is only proven true *relative to each other on a fresh database* — this session validated the full `migrations/0001`–`0094` sequence end-to-end for the first time (see `migrations/README.md`'s "Full 94-file sequence validated" entry) and found a concrete counterexample: none of the 3 competing `task_completions` definitions match what's actually live (different `id` type, an `axis`/`increment` column pair present in *none* of them). Consolidating to one canonical definition per table needs the same per-table live-schema check done for `task_completions`, not a bulk pick-the-most-complete-looking-file sweep — see `migrations/README.md` for detail. |
| 3 files contain `DROP TABLE`/`DROP SCHEMA` | `chunk_07_migrations.sql`, `migration_runner.sql`, `omega_dispatch_reset.sql` — `audit.py` warning | **Confirmed dead.** All three DROPs target only `public.dispatches` (not 3 different tables); `chunk_07_migrations.sql`'s is literally `omega_dispatch_reset.sql` pasted into a bundle file, whose own header says "run this ONLY if OMEGA_DISPATCH.sql still errors." `migration_runner.sql`'s DROP comes *after* two earlier `CREATE TABLE dispatches` in the same file with no recreation afterward — destructive if that file were ever run start-to-finish, but grepped CI (`ci.yml`), `scripts/`, every `.html`/`.js` page, and `supabase/functions/`: zero references to any of the three files anywhere. Matches `migrations/README.md`'s existing "must not be wired into any automated path" analysis; this adds the concrete grep-based confirmation. |
| `supabase/migrations/` untested against a live database | `migrations/README.md`'s own stated open item | Run against a scratch Supabase project before treating it as canonical |
| `2` files added to `migrations/` (0087/0088) without a README note | Confirmed by comparing directory listing against README's last dated section, corrected this session | **Fixed** — README updated with a note and corrected file-count claims |

### 3.1 Duplicate `CREATE OR REPLACE FUNCTION` definitions that genuinely diverge — higher risk than the 47 duplicate tables, owner action needed

The 47-duplicate-*tables* finding above is explicitly "not urgent" because `CREATE TABLE IF NOT
EXISTS` makes re-running any of them a no-op. **Functions are a different risk class entirely:
`CREATE OR REPLACE FUNCTION` unconditionally overwrites, so when two files define the same
function differently, whichever was applied *last* silently wins — there is no "IF NOT
EXISTS" safety net.** A script-assisted pass (parsing every `CREATE [OR REPLACE] FUNCTION
public.*` signature across all 111 files) found 95 unique function names, of which **10 have
signatures that actually differ across files** (not just whitespace) — most are harmless
(missing `SET search_path=public` on some copies of `order_stats`/`approve_member`/
`grant_permanent_access`/`sync_platform_owner` — a hardening inconsistency worth closing but not
a functional bug), but three are real:

**Resolved this session** — the owner ran the `pg_proc` verification query below against the
live database and pasted the results back:

```sql
select proname, pg_get_function_identity_arguments(oid) as args,
       pg_get_functiondef(oid) as body
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_platform_owner','my_matrix','complete_task','apply_subscription')
order by proname, args;
```

| Function | What's actually live | Outcome |
|---|---|---|
| `is_platform_owner()` | Only the `platform_owners`-table-checking version — the 3 files checking `profiles.is_owner` instead (`chunk_02a_migrations.sql` ×2, `chunk_04_migrations.sql`, `chunk_07_migrations.sql`) never won. | **Non-issue, confirmed.** No fix needed. Those 3 files remain a latent risk only if ever re-run standalone (they'd overwrite the correct live version with `CREATE OR REPLACE`) — not urgent since nothing in this repo's normal flow re-runs them, but worth deleting/neutralizing in a future housekeeping pass. |
| `my_matrix()` | Only the version *with* `phase` (`RETURNS TABLE(track,phase,sign,element,a,b,c,authority,node,pct)`). | **Non-issue, confirmed.** Matches what `matrix.html:609`'s `r.phase===1` filter needs — the Phase 1 panel is not broken. |
| `complete_task(...)` | Only `(p_task_name,p_task_type,p_axis_type,p_description,p_points)` — but every client call site (`omega-matrix.js`, `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`) used the other, non-live naming (`p_kind`/`p_task`/`p_axis`/`p_title`/`p_weight`). | **Real, confirmed, fixed — plus a fourth bug found on the owner's first live apply attempt.** Reproduced in a scratch PostgreSQL 16 instance using the live function body: the old param names raise `function ... does not exist` — every task completion, axis increment, authority update, and `nodes_earned` count has been silently failing platform-wide (not just publishing.html's bonus message as originally guessed), all 5 call sites swallow the error via try/catch. Fixing the param names alone would have exposed a second, previously-inert bug found in the same pass: the live function has **no deduplication** despite `omega-progress.js`'s own header comment and `publishing.html`'s copy both promising "keyed on (user, task)" / "farm-proof" — reproduced by calling twice with the same `task_name` and getting two separate axis increments. **Then a third, independent bug surfaced when the owner actually ran the fix**: `CREATE INDEX ... (user_id, task_name)` failed with `column "task_name" does not exist` — the owner's live `public.task_completions` table turns out to have an older, simpler shape (`id bigint, user_id, kind, task, completed_at, axis, increment, created_at` — confirmed via `information_schema.columns`) than what the live `complete_task()` function's own `INSERT` statement targets (`task_name`, `task_type`, `axis_type`, `points_earned`, `axis_a_before`, etc.). Multiple `CREATE TABLE IF NOT EXISTS` definitions for this table exist across the SQL bag with genuinely different shapes (`matrix_engine.sql`'s "rich" version vs. `migration_runner.sql`/`omega_backend_sync.sql`/`omega_master_deploy.sql`'s simpler `task`/`kind`-only version) — whichever ran first on the live database won, and it matches neither exactly. Practical consequence, reproduced against a scratch instance seeded with the real reported column list: **`complete_task()` has never actually committed anything for anyone** — since a plpgsql function with no exception handler rolls back its whole body on an unhandled error, even the `profiles.axis_a/b/c`/`authority`/`nodes_earned` update immediately before the failing `INSERT` was always rolled back too. All three fixed together in `supabase/omega_complete_task_dedup_fix.sql` (`migrations/0094`, amended in place after the owner's failed first attempt rather than added as a new file, since nothing from the original attempt had landed): non-destructive `ALTER TABLE ADD COLUMN IF NOT EXISTS` for the missing columns (old `kind`/`task`/`axis`/`increment` columns and any existing rows left untouched), then the `(user_id, task_name)` dedup check plus supporting index, and an `applied` boolean in the return so the 3 call sites that already read `d.applied` finally get a real value. Client-side param names fixed in the same commit across all 5 call sites; `omega-matrix.js` also had its own bug reading `d.a`/`d.b`/`d.c` from a return shape that has always been `d.axis_a`/`d.axis_b`/`d.axis_c` — fixed alongside. Re-verified end-to-end against a scratch instance seeded with the owner's exact real schema: first call on a task applies, an identical repeat call is a no-op, a different task still applies, `profiles` updates correctly. |
| `apply_subscription(...)` | **Both** the 5-arg and 7-arg overloads are live simultaneously. | **Real, confirmed, fixed — was actively breaking every payment.** Reproduced in a scratch instance using both live function bodies verbatim: the exact 5-named-arg call `supabase/functions/stripe-webhook/index.ts` makes on every webhook event raises `function ... is not unique` — meaning every Stripe webhook call has been failing on production right now, so a member who pays never gets `subscription_status` set to `active`. The 7-arg overload turned out to be independently broken too (not just an ambiguity risk): `membership_tier = COALESCE(p_tier_num, membership_tier)` fails with `COALESCE types integer and text cannot be matched`, since `profiles.membership_tier` is `text` but `p_tier_num` is `integer` — a static type error that fires regardless of the runtime value, so simply dropping the 5-arg overload instead would not have fixed anything. Fixed in `supabase/omega_apply_subscription_fix.sql` (`migrations/0093`): dropped the broken 7-arg overload; the 5-arg one was already correct (nothing in the codebase ever called the 7-arg one with its extra params populated) and is re-verified end-to-end in the scratch instance to update the row and return cleanly with the webhook's exact call. |

Both SQL fixes were reproduced against a scratch PostgreSQL 16 instance end-to-end (not
guessed from source), then **applied to the live database and verified** via
`scripts/verify_fixes.sql`: `apply_subscription` has exactly one live version with the correct
5-arg signature; `complete_task` has the correct signature (`p_task_name text, p_task_type
text, p_axis_type text, p_description text, p_points numeric` — note
`pg_get_function_identity_arguments()` never includes `DEFAULT` clauses, an easy false-FAIL if
you compare against the full `CREATE FUNCTION` text instead of bare names/types) and its dedup
guard. Production payments and progression tracking are unblocked.

**This finding is now automated** (`scripts/audit.py` checks 7 and 8, added in a later
session) — every CI run now re-derives, from source, which client-called RPCs have
non-identical `supabase/*.sql` definitions, so a future file addition that reintroduces or
adds to this problem shows up as a build warning instead of needing another manual sweep.
The live `pg_proc` verification above is still the only way to know which side actually
deployed — the automated check can't reach the live database — but the source-side half of
this finding no longer depends on anyone remembering to re-run the script-assisted pass.

### 3.2 `enterprise.html` — pricing display with no purchase flow (re-scoped: not customer-facing)

**Corrected this session — the original framing overstated the risk.** `enterprise.html` shows
$199/$999/$4,999/Custom tiers with **zero Stripe/checkout wiring** behind any of them (still
true — no `stripe`/`checkout`/`subscribe` reference in the file), but the page itself is
**owner-only**: `if(!pr.is_owner){location.replace('/dashboard.html');return;}` (confirmed by
direct read, not assumed). No member, prospect, or member of the public can ever reach this
page — it's an internal dashboard for the owner previewing enterprise-sales tiers/MRR/accounts,
not a public storefront. The 4 tier CTA buttons ("REQUEST DEMO"/"CONTACT FOUNDER"/"REQUEST
PROPOSAL") also have no `onclick` handler at all — genuinely dead — but since only the owner
ever sees them, wiring them to anything (a `mailto:`, a lead-capture form) would mean the owner
"requesting a demo" from themselves. Considered and rejected: building that wiring would be
solving a problem that doesn't exist, the opposite of the original finding's implied urgency.
**No action taken, and none needed** — this was miscategorized as a customer-facing gap when
investigated at the level GAP_ANALYSIS.md's own convention requires (read the actual gating
logic, don't infer from page content alone). If this page is ever meant to become
customer-facing (a real public pricing/signup page), that's a genuine new feature — build the
gating removal, the real Stripe wiring, and the legal sign-off together as one deliberate
decision, not by incrementally patching the current internal mockup.

## 4. P2 — Code/data quality

### 4.1 Silent-failure writes (5 instances, fixed this session)

`social.html`'s connect/disconnect buttons and `family.html`'s heir-toggle/remove buttons
updated UI state before/regardless of the actual database write result. `settings.html`'s
background-color save discarded the profile-sync result in a bare `try/catch` (message said
"saved" regardless). `travel.html` credited progress XP before confirming the journey-save
succeeded. `marketing.html`'s campaign APPROVE/REJECT buttons (owner-only moderation queue)
discarded the update result entirely — a failure left the item in the queue with zero
feedback. All five fixed to check `.error`, matching the convention already established in
`events.html`/`automation.html`/`advertising.html` from an earlier session — `settings.html`'s
fix is proportionate to a cosmetic preference (distinguishes "saved locally" from "synced" in
the message, no `alert()`) rather than blocking the user.

### 4.2 Finance pages: `localStorage`-only persistence — decided this session

`wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`, `investment.html`,
`expenses.html`, `budget.html` persist entirely client-side — no cross-device sync, lost on
storage clear. Inconsistent with `income.html`/`ledger.html`/`portfolio.html`, which do
persist server-side. Previously left as an open product decision. **Decided this session:
stays client-side, deliberately** — this is unusually sensitive data (net worth, income,
holdings), moving it server-side is a real schema-design commitment across 7 pages that's
hard to walk back once member data lives there, and this repo's own session history includes
multiple real RLS/security bugs found and fixed (§1, §0) — "RLS protects it" isn't a settled
guarantee here. Local-only is the safer default absent a specific reason to take on that
exposure, and it's a reversible choice: sync can be added later as a clean, additive change.
The real cost of local-only (data loss on cleared storage or a new device) is mitigated rather
than left as a silent risk: added `omega-local-backup.js` (dependency-free, makes no network
request — writes a JSON file the member saves themselves, reads one back) and an "EXPORT
BACKUP"/"IMPORT BACKUP" control plus a plain-language disclosure on all 7 pages. Verified:
all 14 new `onclick` handlers syntax-checked individually via `node --check`; the
broken-asset-reference CI check (`ci.yml`'s exact grep logic) re-run locally, 0 missing;
`scripts/audit.py` still 0 critical.

### 4.3 `sovereign-covenant.html` / `system_manifest.json` token-economy language

**Already resolved** (prior session) — both now carry explicit "PLANNED · NOT YET ACTIVE"
disclaimers, gated on `platform_settings.tokens_enabled`. Listed here only for completeness;
no action remains.

### 4.4 `nav.js`: 19 dead/overridden keys in the section-mapping object

Finding from `REPOSITORY_AUDIT.md` §5 — the `PS` object literal assigned 19 page-slug keys
twice; the second assignment silently won in JS, so the first was dead code. **Fixed the same
session** — removed the 19 dead first assignments; verified programmatically (parsed the
effective key→value mapping before/after the edit) that this changed zero runtime behavior.

### 4.5 `consultancy.html` booking flow (see §2)

Distinct from the finance-persistence question in §4.2: this wasn't a design choice, it was a
genuine schema/client mismatch that made the feature 100% non-functional. Fixed — see §2.

### 4.6 `queue.html` "PLATFORM DISPATCH LOG" panel queried nonexistent columns (fixed this session)

The OPS queue page's dispatch table selected `*` from `public.dispatches` and rendered
`d.type`, `d.action`, `d.payload`, `d.status` — none of which exist anywhere in the schema
(`dispatches` has `title`/`body`/`category`/`is_published`/`created_at`/`user_id`/`sign`
across its several definitions, confirmed by grep). Every real row rendered as `TYPE: -`,
`PAYLOAD: {}`, `STATUS: PENDING` regardless of actual content — same "queried the wrong
shape" bug class as the Authority History chart fix in §2. Separately, the columns that
*do* exist and that the fix now reads (`title`/`category`/`body`) are member-writable: the
`dispatches` table's `"wire insert"` RLS policy (`supabase/dispatches.sql`,
`chunk_06_migrations.sql`) allows any authenticated user to insert a row with
`auth.uid() = user_id` and no column restriction, so a member could set `category`/`title`/
`body` to an HTML/script payload via a direct REST call (no UI required, same threat model
as the `sovereigns.html`/`approvals.html` stored-XSS fixes) and have it render unescaped in
this page — which the owner views. Fixed by (a) selecting the real columns
(`title,body,category,is_published,created_at`), and (b) adding an `esc()`-equivalent
helper and escaping all four rendered fields, matching the convention already used in
`news.html`'s dispatches/wire rendering (confirmed clean, uses its own `esc()`).

### 4.7 `owner_apex_lock.sql`: dead `nodes_earned` assignment (fixed this session)

A `--` line comment on the `authority` line ran to end-of-line and silently swallowed the
following `nodes_earned = 104976` assignment as dead text — the script ran without error every
time it was manually run, it just never actually set `nodes_earned`. Fixed; validated
end-to-end against a throwaway local PostgreSQL 16 instance (`REPOSITORY_AUDIT.md` §6.12).
This file is intentionally excluded from `supabase/migrations/` and requires the owner's own
authenticated session to run correctly (`grant_permanent_access()` checks `auth.uid()`) — not
something any session in this project's history could have applied live either way.

### 4.8 `access_audit_log` RPC response-shape mismatch — both callers broken (fixed this session)

`supabase/omega_access_audit.sql` (and its two duplicate definitions in `chunk_05_migrations.sql`
and `migration_runner.sql` — all three agree) defines `access_audit_log(p_limit)` as
`SECURITY DEFINER`, owner-only (`is_platform_owner()` check inside), returning
`jsonb_build_object('ok', true, 'rows', result)` — an object wrapping the array, not the array
itself. Both client call sites assumed the latter:

- `vault.html`'s `loadAuditLog()` did `(r.data||[]).slice(0,60)` — since `r.data` is the
  `{ok,rows}` object, not an array, `.slice` doesn't exist on it and the call threw on every
  invocation, silently caught and replaced with 5 hardcoded `DEMO` entries
  (`"OWNER APEX LOCKED..."`, `"RLS ENABLED ON ALL 42 DATABASE TABLES"`, etc.) presented as if
  they were the real audit trail. This happened for every caller, including the owner —
  the feature has never shown real data to anyone.
- `approvals.html`'s `loadAudit()` did `r.data||[]` then checked `!rows.length` — on the
  `{ok,rows}` object this reads as falsy-length (no `.length` property), so it always rendered
  "NO AUDIT ENTRIES" instead of throwing, same root cause, different symptom.

Both also referenced field names the RPC never returns (`event`, `event_type`, `status`,
`user_id`) instead of what it actually provides (`action`, `subject`, `actor`, `prev`, `next`,
`created_at` — `subject`/`actor` are pre-resolved `display_name`/`email` strings per the RPC's
own `COALESCE`). Fixed both call sites to read `r.data.rows` and use the real field names;
`subject`/`actor` are member-controllable (`display_name` self-update, same field class as the
`approvals.html`/`sovereigns.html` stored-XSS fixes) so both are now escaped — `approvals.html`
via its existing `esc()`, `vault.html` via a new equivalent helper added to match. This is why
the owner's approval console's "Audit Log" tab and the Vault's audit panel have never shown a
real access decision (grant/reject/revoke/expiry) despite the underlying trigger and table
working correctly since the RPC was added — a client-side bug on top of already-correct backend
plumbing, same shape as the Authority History chart fix in §2.

### 4.9 Stored XSS in `graph.html`'s constellation-graph tooltip — broken self-escaping attempt (fixed this session)

`graph.html` renders a force-directed D3 graph of elements/gods/signs/members; hovering a
member node shows a tooltip built via string-concatenated `.innerHTML`. The member-node
branch tried to escape the member's name before use:

```js
var nm=document.createElement('div');nm.textContent=m.name;
inner='<b>'+nm.textContent+'</b><br>...';
```

This looks like the standard "create a scratch element, assign `textContent`, read the escaped
HTML back" trick — but it reads `nm.textContent` back, not `nm.innerHTML`. The `textContent`
*getter* returns the plain original string, unescaped; only reading `.innerHTML` back would
have returned the HTML-entity-escaped version. So the assignment did nothing: `inner` still
contains the raw, unescaped `m.name`. `m.name` is `display_name` (self-updatable by any
member, per the same `omega_profile_fields.sql` grant already cited for the `approvals.html`/
`sovereigns.html`/`profile.html` fixes), sourced from
`sb.from('profiles').select(...).eq('access_approved',true)` — every approved member, no
`user_id` filter. Reachable by any approved member setting a script payload as their
`display_name` and having any other approved member (or the owner) hover their node on
`/graph.html`. The adjacent `m.sign`/`m.element`/`m.gate`/`m.auth` fields interpolated into
the same tooltip are all constrained to static lookup-table values (`SIGNS`/`SE`/`GC`/gate
tables), not raw member input, and the separate members-list tab (`buildMembersTab`, line
~179) already uses `.textContent` correctly — only this one tooltip path was broken. Fixed by
adding a real `escGraph()` helper (matching the `esc()` convention used elsewhere) and
escaping `m.name` directly instead of relying on the broken round-trip.

### 4.10 `services.html`'s status board claimed `PAYMENT` is `'live'`, contradicting the
platform's own established position elsewhere (fixed this session)

`services.html`'s "21 Sovereign Microservices" status board is a hardcoded array (`SVCS`, no
`sb.from`/`sb.rpc` — purely presentational) marking each claimed microservice `live`/`pending`/
`planned`. `PAYMENT` (`'Stripe/fiat subscription and transaction processing'`) was marked
`'live'` — but this directly contradicts copy already shipped on three other pages:
`subscriptions.html:108` ("Payment processing activates after legal review... Until then,
access is granted by the Sovereign Architect"), `subscriptions.html:226` ("PAYMENT ACTIVATION
PENDING LEGAL REVIEW"), and `terms.html:86` ("Marketplace, token purchase, payments, and KYC
activate only under completed legal review. Until then, no funds move..."). This is exactly
the overclaim `CLAUDE.md` §9 warns against — the real Stripe integration code exists and works
(`supabase/functions/checkout`/`stripe-webhook`, audited clean elsewhere in this file), but
real fund movement isn't actually authorized yet, so a public status board calling it "LIVE" is
a legally-relevant misstatement, not just a UI nit. Fixed by changing its status to `'pending'`
(matching `KYC`'s existing label for "built, not yet activated") and updating its description to
point at `subscriptions.html` for the real status. Cross-checked every other `'live'`/`'pending'`/
`'planned'` claim on the board against the corresponding real page/table before touching only
this one: `ANALYTICS` is marked `'planned'` despite a real, working `analytics.html` existing,
but its description ("AI logs, dimension viewer, reasoning") matches the unwired
`intelligence.html` (zero `sb.from`/`sb.rpc` calls, confirmed via grep) more closely than
`analytics.html`'s actual chart-rendering feature set — genuinely ambiguous, not a clear
misstatement like `PAYMENT`, so left alone rather than force a subjective call.
`node --check`-equivalent syntax validation on all three of the page's inline script blocks;
`scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings. No SQL/schema change —
pure content/status-label correction.

## 5. Explicitly out of scope / not verified in this pass

- **5.1** A full re-audit of all 170 pages for the XSS/silent-failure/missing-table bug classes
  has still not been performed — eight passes now (`REPOSITORY_AUDIT.md` §6 items 1-9, then
  items 11, 13, 14, 15, 16, 17, and the `.concat()`-innerHTML check noted below) have each
  covered a growing subset, not the full set. Items
  14-15 were script-assisted (cross-referencing every `.from()`/`.rpc()` call site and every
  write-error-check site programmatically) rather than manual page-by-page reading, which is
  why they could cover all remaining candidate files for those two bug classes in one pass. The
  `.innerHTML`-interpolation check is manual per-file (tracing each variable's data source) but
  is now exhaustive across four shapes: template-literal (`${...}`), string-concatenation
  (`+`), bare-variable (`.innerHTML=someVar` with the variable built up earlier), and
  `.innerHTML=[].concat(...)` — 10 + 54 + 12 + 7 = 83 files, all individually traced (see §1
  and the corrected 7-file/13-instance `.concat()` count above — an earlier pass here had
  undercounted by one file, `kings.html`) — and confirmed via grep that no file uses
  `outerHTML=`/`insertAdjacentHTML(`/`document.write(` with any of the four shapes (zero
  matches). Item 16 went beyond the original three bug classes for the first time: cross-
  referenced every client `.rpc()` call's consumed shape against the actual SQL `RETURNS`
  clause (found the `error_summary`/`my_points_balance` shape bugs and the `approvals.html`
  contracts/reservations XSS in §1), and separately diffed every duplicated function signature
  across the SQL bag rather than just duplicated table names (found §0's auth-bypass and §3.1's
  three divergent-function forks). Item 17 covered `bg.js`-loaded modules and external-API
  (non-Supabase) content sources, catching `omega-live.js`'s dormant ticker and `pulse.html`'s
  RSS-feed XSS — both outside the `.from()`-call-centric scope of items 14-16. An eighth pass
  (this session) closed the `.concat()` gap specifically: grepped every `.html`/`.js` file for
  `.concat(`, found 24 matches, and traced the 13 that feed an `.innerHTML=` assignment across
  7 files (`publications.html:162`, `contributions.html:172,199`, `heritage.html:154,169`,
  `treasury.html:250,290`, `notifications.html:164,181`, `governance.html:209,229,245`,
  `kings.html:158`). All 13 interpolate unescaped fields (titles, notes, story bodies, etc.)
  straight into the markup — but every one of the underlying arrays (`pubs`, `contribs`,
  `gifts`, `ancestors`, `stories`, `assets`, `flows`, `notifs`, `reminders`, `risks`,
  `policies`, `decisions`, `studyNotes`) is read from and written to `localStorage` only (no
  Supabase table), confirmed per-file (`JSON.parse(localStorage.getItem(...))` /
  `localStorage.setItem(...)`, no matching `.from('<table>')` calls for any of those variable
  names). That makes this self-XSS at most — a member could only inject a payload into their
  own browser's own storage, with no path for it to render in another session (unlike the
  `display_name`/`approvals.html` class of bug, which crossed from a member's write into the
  owner's browser) — so left unfixed as out-of-scope-by-design rather than "fixed." One
  adjacent false lead ruled out: `publications.html`'s `pubs` shares a name with the *different*,
  genuinely cross-user `public.publications` Supabase table (`feed.html`'s public post feed,
  written by `publishing.html`), but `publications.html` itself never touches that table — it's
  an unrelated localStorage reading-list feature that happens to share a name; `feed.html`'s
  own rendering of the real table already escapes (`.replace(/</g,'&lt;')`, confirmed at
  `feed.html:162-166`). **Still not covered:** any bug class outside XSS/silent-failure/
  missing-table/RPC-contract-mismatch/auth-bypass, and a live-database check of which side of
  each §3.1 fork is actually deployed. `CAPABILITY_INVENTORY.md`'s unmarked pages remain "not
  individually audited," not "confirmed clean."
- **5.2** Live-database verification of anything in §2 — no session has held credentials.
- **5.3** Supabase MCP server (`.mcp.json`, added this session) is configured but not
  authenticated — that requires an interactive `claude` session, which was confirmed
  un-completable headlessly. Once authenticated, §2's "not applied" items become directly
  actionable from a Claude Code session instead of requiring a manual SQL-editor paste.

## 6. Priority-ordered action list

1. ~~Apply the patched `supabase/trial_access.sql` to the live database~~ — **done this
   session, verified** (§0). The owner-approval bypass is closed on the live database.
2. ~~Apply `supabase/omega_apply_subscription_fix.sql` and
   `omega_complete_task_dedup_fix.sql`~~ — **done this session, verified** (§3.1). Stripe
   webhook processing and all task-completion/axis-progression tracking are unblocked.
3. ~~Run the `pg_proc` verification query in §3.1~~ — **done this session**, results in §3.1.
   `is_platform_owner()` and `my_matrix()` confirmed correct as deployed, no action needed;
   `complete_task()` and `apply_subscription()` were the real, now-fixed bugs in item 2 above.
4. ~~Apply `supabase/migrations/0013` and `0089`–`0092` to the live database~~ — **done this
   session, verified** (§2), including a second run of `omega_notify_triggers.sql` after
   verification caught `extend_trial` missing its notification insert the first time.
5. Authenticate the Supabase MCP server (`claude` → `/mcp` → approve → OAuth) so future
   sessions can verify directly instead of via a copy-paste-and-report loop with the owner —
   `scripts/verify_fixes.sql` closes most of the practical gap this created for now, but a
   live connection remains more robust for anything not already covered by that script.
6. ~~Decide the finance-pages persistence question~~ — **decided this session** (§4.2):
   stays `localStorage`-only, deliberately, with export/import added to mitigate the data-loss
   downside.
7. ~~Decide whether/how to build real payment wiring for `enterprise.html`~~ — **resolved this
   session, no action needed** (§3.2): the page is owner-only, never customer-facing, so the
   "pricing display with no purchase flow" framing didn't describe a real gap.
8. Consolidate the 47 duplicate table definitions toward `supabase/migrations/` as sole
   source of truth (§3) — no longer pure housekeeping now that `task_completions` proved a
   fresh-replay definition can silently diverge from the live schema (§3, `migrations/README.md`);
   do this one table at a time with a live `information_schema.columns` check each, not a bulk
   sweep.
9. Continue the page-by-page sweep (§5.1) — nine passes done across two sessions; all four
   `.innerHTML` interpolation shapes are now exhaustively traced (83 files across pages — the
   `.concat()` shape is 7 files/13 instances, not 6, per the correction above — 6 real
   stored-XSS instances found and fixed among them, plus 3 more via the non-page-scoped
   `bg.js`-module/external-content pass). All 16 `bg.js`-loaded modules with both `.innerHTML`
   and `.from()`/`.rpc()` calls are now individually traced too (§1's extended module pass).
   Remaining candidates for a next pass: pages with zero `.innerHTML` interpolation at all (not
   yet checked for other bug shapes), and any bug class outside the ones this sweep has focused
   on (XSS, silent-failure writes, missing-table/RPC, RPC-response-shape mismatches,
   auth-bypass).
10. ~~Wire `nav.js` for the 64-page navigation gap found this session~~ — done, see
    `REPOSITORY_AUDIT.md` §9 addendum. Prompted directly by friend/early-tester feedback
    ("navigation friction") in `UX_REDESIGN_BRIEF.md`; the go-ahead this item was waiting on.

`nav.js`'s duplicate keys (previously here) — done, see §4.4.
