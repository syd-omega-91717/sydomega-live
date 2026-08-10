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
and the fix are both provable against a schema-only scratch instance. **Owner action:** none
required to close the hole — the fix is in the SQL source file itself, so it takes effect the
next time `trial_access.sql` (or the whole bag) is applied to the live database, same as any
other pending SQL in §2. If this file was *ever* applied to the live production database in its
original unguarded form — worth checking `select * from public.access_grant_audit order by
occurred_at desc;` and cross-referencing `select id, display_name, access_approved, is_trial,
created_at from public.profiles where access_approved=true order by created_at desc;` for any
approved member the owner doesn't remember approving, per `0003_privilege_lockdown.sql`'s own
verification section, which applies identically here.

## 1. P0 — Security (all fixed in code this session)

| Gap | Evidence | Status |
|---|---|---|
| Stored XSS in `approvals.html`/`profile.html` | `display_name`/`email` rendered via raw `.innerHTML`; `display_name` is self-updatable by any member (`omega_profile_fields.sql`) | **Fixed** — `esc()` helper added, both files escaped |
| Stored XSS in `sovereigns.html` | `profiles.sign` (self-updatable, `chunk_02b_migrations.sql`'s per-column GRANT list) queried for every `access_approved` member and rendered raw via `.innerHTML` in two places (table row, throne card) — no `user_id` filter, so reachable by/visible to the whole membership, not just the owner | **Fixed** — `esc()` helper added, both occurrences escaped |
| Stored XSS in `queue.html`'s dispatch log | `dispatches.category`/`title`/`body` are member-writable (RLS `"wire insert"` policy checks only row ownership, not column values) and were rendered raw via `.innerHTML` in the OPS queue's "PLATFORM DISPATCH LOG" panel, visible to the owner | **Fixed** — see §4.6 (bundled with the same panel's wrong-column-name fix) |
| Stored XSS in `graph.html`'s constellation-graph tooltip | `profiles.display_name` (self-updatable, every `access_approved` member queried with no `user_id` filter) rendered into the member-node tooltip's `.innerHTML`. The code *attempted* to escape it — `nm.textContent=m.name` then read `nm.textContent` back — but reading `.textContent` returns the original unescaped string (that trick only works if you read `.innerHTML` back instead), so the "escaping" was a no-op. Reachable by hovering any member node; visible to any other approved member or the owner who opens the page | **Fixed** — added a real `escGraph()` helper and used it in place of the broken round-trip |
| Stored XSS in `approvals.html`'s reservations queue | `review_reservations()` RPC (owner-only) returns `media_reservations` rows verbatim; `title` is a `NOT NULL text` column any authenticated member can set to anything via the `mr_insert` policy (`auth.uid()=user_id`, no content restriction — the same page members use to submit ad reservations). `approvals.html`'s queue rendered `row.title` raw via `.innerHTML`, unlike every other field on the same page. The sibling `review_contracts()` render had the identical unescaped pattern; `commission_contracts` has no `title`/`type` column today so it wasn't exploitable *yet*, but was fixed defensively for the same reason | **Fixed** — both now go through the page's existing `esc()` |
| Error-monitor free text unescaped, reachable **without authentication** | `report_client_error()` is `GRANT`ed to `anon` *and* `authenticated` (by design — it needs to catch errors from signed-out visitors too) and stores `p_page`/`p_message` with only a length truncation, no sanitization. `error_summary()` (owner-only) aggregates and returns them; `approvals.html`'s error-monitor panel rendered `row.message`/`row.page` raw via `.innerHTML` — reachable by literally anyone on the internet with no login, the widest possible reach of any stored-XSS instance found across this whole audit | **Fixed** — same `esc()`, bundled with the response-shape fix below |

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
  `workout.html` — safe by construction). Of the remaining 34: `marketing.html`/`news.html`/
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
- **Silent-failure-write sweep:** every `.html` file calling `.insert()`/`.update()`/
  `.upsert()`/`.delete()` against Supabase (23 files) checked for whether the write's
  `.error` gates the success message. `account.html`, `contracts.html`, `health.html`,
  `marketplace.html`, `oath.html`, `publishing.html`, `research.html`, `terms.html`, and
  `consultancy.html` — the files not already covered by a prior session's fix — all correctly
  check `.error`/throw-and-catch before reporting success. No new silent-failure-write gaps
  found.
- **Incidental finding, not XSS but turned up by the same sweep — `access_audit_log` RPC
  response-shape mismatch, fixed:** see §2 (new row) and §4.8.
- **Incidental finding, not fixed — `member_events` is a dead write.** `events.html:199`
  inserts into `public.member_events` (RLS: `"events are visible to all members"`, public
  SELECT), but grep confirms **no page anywhere in the repo ever selects from it** — the
  table has been write-only since whatever session added the insert. Not a security issue
  (nothing renders the data, so no XSS surface exists despite the permissive read policy),
  but a real completeness gap: building the missing read/display view is a feature decision
  (what does a "member events" UI look like — a calendar? a feed panel on `events.html`
  itself?), not a bug fix, so left undone per this file's own convention for undone-on-purpose
  work. Noted here rather than silently ignored.

A full re-sweep of all 170 pages for every possible bug class still has not been performed —
five session-level passes now (this one covering three `.innerHTML`-shape sub-waves plus the
missing-table/RPC and silent-failure checks) cover a growing subset, not an exhaustive one —
see §5.1.

## 2. P0/P1 — Data integrity: fixed in code, not applied to a live database

| Gap | Evidence | Fix location | Live DB status |
|---|---|---|---|
| `public.notifications` table missing | `omega-notify.js` (platform-wide via `bg.js`) queries it; no `CREATE TABLE` existed anywhere | `supabase/omega_notifications_fix.sql`, `migrations/0091` | **Not applied** |
| `public.user_assets` table missing | `portfolio.html`/`vault.html` query it; no `CREATE TABLE` existed anywhere | `supabase/omega_user_assets_fix.sql`, `migrations/0089` | **Not applied** |
| `extend_trial` RPC missing | `approvals.html`'s extend button calls it; function never existed | `supabase/omega_extend_trial_fix.sql`, `migrations/0090` | **Not applied** |
| `notifications` table never populated | Table existed (once applied) but nothing inserted a row | `supabase/omega_notify_triggers.sql`, `migrations/0092` (5 RPCs now insert on event) | **Not applied** |
| Authority History chart queried wrong table | `omega-chart.js` queried nonexistent `authority_snapshots`; real table is `leaderboard_snapshots` | Table name corrected in `omega-chart.js` directly | N/A — no schema change needed, fix is live in code |
| `consult_requests` missing 3 columns `consultancy.html` sends | Form sends `{domain,contact,preferred_time,brief}`; table only had `domain`/`message`/`urgency`/`commission_rate`/`confidentiality_accepted` — every submission errored, booking flow fully non-functional | `supabase/omega_consult.sql`, `migrations/0013` (non-destructive `ALTER ADD COLUMN`) | **Not applied** |
| `access_audit_log` RPC response shape mismatch | Both callers (`approvals.html`, `vault.html`) treated `r.data` as a plain array; the RPC actually returns `{ok, rows:[...]}` (all 3 definitions agree). Result: `vault.html`'s `.slice()` on the object always threw, silently falling back to fabricated demo entries presented as real security log; `approvals.html`'s `!rows.length` on the object always read as empty, showing "NO AUDIT ENTRIES" even when real rows existed. Broken for every caller, including the owner — the RPC's actual intended audience | Both files' client code corrected to read `r.data.rows`; field names remapped to what the RPC actually returns (`action`/`subject`/`actor`, not the imagined `event`/`event_type`/`status`/`user_id`) | N/A — no schema change needed, both fixes are pure client-code, live the moment deployed |
| `error_summary` RPC — same response-shape bug as `access_audit_log` | Same `{ok,rows:[...]}` wrapper convention (all 3 definitions agree), same wrong assumption in `approvals.html`'s error-monitor panel (`r.data\|\|[]`) — always showed "NO CLIENT ERRORS RECORDED" regardless of real content; also referenced a `row.count` field the RPC doesn't return (real field is `hits`) | Corrected to `r.data.rows`, field name `hits`, and escaped (see §1 — this RPC's data is reachable by unauthenticated `anon` callers via `report_client_error()`) | N/A — pure client-code, live the moment deployed |
| `my_points_balance` RPC response shape mismatch | Returns `{ok,balance}`; `blockchain.html` did `Number((await sb.rpc(...)).data).toFixed(0)` — `Number()` on an object is `NaN`, so the Ω points balance display always showed "Ω NaN" regardless of the member's real balance | `blockchain.html` corrected to read `.data.balance` | N/A — pure client-code, live the moment deployed |

**Owner action required:** apply `supabase/migrations/0013` and `0089`–`0092` (or the
equivalent loose files) via `supabase db push` or the Supabase SQL editor — this activates five
already-written, already-validated fixes at once. **Higher priority than all of these: apply
the patched `supabase/trial_access.sql` (§0)** — unlike the others, this isn't adding something
missing, it's closing a full owner-approval bypass that may already be live if this file (in
its original unguarded form) was ever applied to the production database. Not yet added to
`supabase/migrations/` as a numbered file — fixed in place since the bug is in this specific
file's own logic, not a missing-schema gap needing a new file, matching how `0003_privilege_lockdown.sql`
fixed the other 7 copies of these same functions in place.

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
| 47 tables defined in >1 SQL file | `scripts/audit.py` output — `platform_settings` in 12 files, `platform_owners`/`dispatches` in 10 each | Not urgent (idempotent `CREATE TABLE IF NOT EXISTS` makes replay safe today); real fix is consolidating to `supabase/migrations/` as sole source of truth |
| 3 files contain `DROP TABLE`/`DROP SCHEMA` | `chunk_07_migrations.sql`, `migration_runner.sql`, `omega_dispatch_reset.sql` — `audit.py` warning | Confirm none is wired into anything automatic (none currently are, per `migrations/README.md`'s exclusion list) |
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

| Function | Divergence | Consequence if the "wrong" file was applied last |
|---|---|---|
| `is_platform_owner()` | 8 files check `EXISTS (SELECT 1 FROM platform_owners WHERE user_id=auth.uid())`; 3 files (`chunk_02a_migrations.sql` ×2, `chunk_04_migrations.sql`, `chunk_07_migrations.sql`) instead check `profiles.is_owner`. **This is the single most security-critical function in the schema** — every RLS policy and every `SECURITY DEFINER` guard fixed in this pass (§0, §1) calls it. If the `profiles.is_owner`-checking version is what's actually live, then owner status is determined by that column rather than the `platform_owners` table, and the two are only guaranteed to agree if `sync_platform_owner()`'s trigger (itself also duplicated, `chunk_02b_migrations.sql`/`chunk_08_migrations.sql`/`migration_runner.sql`/`omega_master_deploy.sql`) is correctly firing on every relevant write. **Already flagged and partially mitigated by a prior session**: `supabase/0003_privilege_lockdown.sql` (see §0) independently found this exact ambiguity ("not yet settled which one is authoritative... D-012") and wrote `omega_is_owner()` as a defensive OR of both checks, but `omega_is_owner()` is only used by the three functions §0 covers — every *other* `SECURITY DEFINER` function and RLS policy in the schema still calls the ambiguous `is_platform_owner()` directly. |
| `my_matrix()` | `chunk_03_migrations.sql`/`migration_runner.sql` (first def): `RETURNS TABLE(track,sign,element,a,b,c,node,pct)` — no `phase` column, reads `matrix_progress`. `chunk_08_migrations.sql`/`migration_runner.sql` (second def): `RETURNS TABLE(track,phase,sign,element,a,b,c,authority,node,pct)` — has `phase`, reads `profiles.matrix_track`/`matrix_phase` directly. **`matrix.html:609` filters `r.phase===1`** — if the no-`phase` version is what's live, `r.phase` is always `undefined`, the filter always excludes every row, and the Phase 1 panel is permanently empty for every member regardless of real progress. Not fixed client-side: which representation is canonical (per-track vs. per-phase progression) is a data-model decision, not a bug fix — see recommendation below. |
| `complete_task(...)` | Two versions with the *same* argument types (`text,text,text,text,numeric`) but *different* parameter names — `(p_kind,p_task,p_axis,p_title,p_weight)` vs. `(p_task_name,p_task_type,p_axis_type,p_description,p_points)`. Same type signature means `CREATE OR REPLACE` replaces one with the other in-place (no coexisting overload) — but PostgREST's RPC calls use named JSON parameters, so `publishing.html`'s call (`{p_kind:'contribution',p_task:...}`) only succeeds if the matching-named version is what's live; otherwise it fails silently (already wrapped in try/catch, so the only symptom is the "+0.25 Contribution axis" bonus message never appearing) |
| `apply_subscription(...)` | One version takes 5 params, another takes 7 (2 extra `DEFAULT NULL`). **Different arity means these are two distinct overloaded functions in Postgres, not a replace-in-place — both can exist simultaneously.** `supabase/functions/stripe-webhook/index.ts` always calls with exactly the 5 mandatory named params. If both overloads exist live, Postgres cannot disambiguate a 5-named-argument call between "the 5-arg function" and "the 7-arg function using its 2 defaults" and raises `42725 function ... is not unique` — every Stripe webhook call (checkout completed, subscription updated/deleted, payment failed) would fail, meaning **a member who successfully paid via Stripe would never have `subscription_status` set to `active`, i.e. paying and getting access could silently decouple.** Both versions correctly check `is_platform_owner()`/`service_role` — this is not a privilege-escalation risk, purely an availability one. Not fixed: cannot tell from source alone whether both overloads coexist live (that requires a `pg_proc` query against the real database), and consolidating requires knowing which of `subscription_period_start`/`p_tier_num` the owner actually wants going forward — a real schema decision, not a client bug. |

**Not fixed** (unlike `trial_access.sql` in §0, these three are not "one file everyone else
agrees against" — they're genuine, live forks where I cannot determine from source alone which
side is deployed, and picking one to delete without that knowledge risks breaking whichever
side turns out to be live). **Owner action, highest priority after applying the pending SQL in
§2:** run this against the live database to see which side actually won for each:

```sql
select proname, pg_get_function_identity_arguments(oid) as args,
       pg_get_functiondef(oid) as body
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in ('is_platform_owner','my_matrix','complete_task','apply_subscription')
order by proname, args;
```

If `apply_subscription` returns more than one row, that alone confirms the overload-ambiguity
risk is live and payments are at risk — collapse to one signature immediately. For the other
three, the query result determines which SQL files are now safe to delete/consolidate as the
stale duplicate.

### 3.2 `enterprise.html` — pricing display with no purchase flow

`enterprise.html` shows $199/$999/$4,999/Custom tiers but has **zero Stripe/checkout wiring**
behind any of them (confirmed by direct grep — no `stripe`/`checkout`/`subscribe` reference
in the file at all). This is not a bug to fix casually: per `CLAUDE.md`, shipping a new
monetizable feature "live" requires gating + legal sign-off first. Tracked here as a real gap
between what the page implies (pricing = purchasable) and what exists (pricing = display
only), not acted on.

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

### 4.2 Finance pages: `localStorage`-only persistence

`wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`, `investment.html`,
`expenses.html`, `budget.html` persist entirely client-side — no cross-device sync, lost on
storage clear. Inconsistent with `income.html`/`ledger.html`/`portfolio.html`, which do
persist server-side. **Explicitly left as a product decision, not a bug** — `CLAUDE.md` §8
is direct about this: could be deliberate (privacy) or an unfinished migration, and
unilaterally building schema/RLS for it without that decision is the wrong move.

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

## 5. Explicitly out of scope / not verified in this pass

- **5.1** A full re-audit of all 170 pages for the XSS/silent-failure/missing-table bug classes
  has still not been performed — six passes now (`REPOSITORY_AUDIT.md` §6 items 1-9, then
  items 11, 13, 14, 15, and 16) have each covered a growing subset, not the full set. Items
  14-15 were script-assisted (cross-referencing every `.from()`/`.rpc()` call site and every
  write-error-check site programmatically) rather than manual page-by-page reading, which is
  why they could cover all remaining candidate files for those two bug classes in one pass. The
  `.innerHTML`-interpolation check is manual per-file (tracing each variable's data source) but
  is now exhaustive across three shapes: template-literal (`${...}`), string-concatenation
  (`+`), and bare-variable (`.innerHTML=someVar` with the variable built up earlier) —
  10 + 54 + 12 = 76 files, all individually traced (see §1) — and confirmed via grep that no
  file uses `outerHTML=`/`insertAdjacentHTML(`/`document.write(` with any of the three shapes
  (zero matches). Item 16 went beyond the original three bug classes for the first time: cross-
  referenced every client `.rpc()` call's consumed shape against the actual SQL `RETURNS`
  clause (found the `error_summary`/`my_points_balance` shape bugs and the `approvals.html`
  contracts/reservations XSS in §1), and separately diffed every duplicated function signature
  across the SQL bag rather than just duplicated table names (found §0's auth-bypass and §3.1's
  three divergent-function forks). **Still not covered:** `.innerHTML` built via string
  concatenation without a literal `+` visible to grep (e.g. `.concat()`), any bug class outside
  XSS/silent-failure/missing-table/RPC-contract-mismatch/auth-bypass, and a live-database check
  of which side of each §3.1 fork is actually deployed. `CAPABILITY_INVENTORY.md`'s unmarked
  pages remain "not individually audited," not "confirmed clean."
- **5.2** Live-database verification of anything in §2 — no session has held credentials.
- **5.3** Supabase MCP server (`.mcp.json`, added this session) is configured but not
  authenticated — that requires an interactive `claude` session, which was confirmed
  un-completable headlessly. Once authenticated, §2's "not applied" items become directly
  actionable from a Claude Code session instead of requiring a manual SQL-editor paste.

## 6. Priority-ordered action list

1. **Apply the patched `supabase/trial_access.sql` to the live database** (§0) — closes a full
   owner-approval bypass, higher priority than anything below since it's a live authorization
   hole, not a missing feature.
2. **Run the `pg_proc` verification query in §3.1** against the live database to determine
   which side of the `is_platform_owner()`/`my_matrix()`/`complete_task()`/`apply_subscription()`
   forks is actually deployed, then delete the losing/stale copies from the SQL bag. The
   `apply_subscription` case in particular risks silently breaking Stripe webhook processing if
   both overloads coexist — worth checking before the other three.
3. **Apply `supabase/migrations/0013` and `0089`–`0092` to the live database.** (Owner action
   — activates 5 already-built fixes at once.)
4. Authenticate the Supabase MCP server (`claude` → `/mcp` → approve → OAuth) so future
   sessions can verify §2/§3.1 directly instead of inferring from client-code reads.
5. Decide the finance-pages persistence question (§4.2) — product decision, not code.
6. Decide whether/how to build real payment wiring for `enterprise.html` (§3.2) — business +
   legal decision, not code.
7. Consolidate the 47 duplicate table definitions toward `supabase/migrations/` as sole
   source of truth (§3) — housekeeping, no functional urgency (unlike the function duplicates
   in §3.1, these are safe today).
8. Continue the page-by-page sweep (§5.1) — six passes done; all three `.innerHTML`
   interpolation shapes are now exhaustively traced (76 files, 4 real stored-XSS instances
   found and fixed across the passes). Remaining candidates for a next pass: pages with zero
   `.innerHTML` interpolation at all (not yet checked for other bug shapes — raw string
   concatenation without `+` syntax visible to a simple grep, or non-XSS logic bugs), and any
   bug class outside the three this sweep has focused on.

`nav.js`'s duplicate keys (previously here) — done, see §4.4.
