# Gap Analysis — sydomega-live

**Date:** 2026-08-10. **Companion documents:** [`REPOSITORY_AUDIT.md`](./REPOSITORY_AUDIT.md),
[`CAPABILITY_INVENTORY.md`](./CAPABILITY_INVENTORY.md).

Every item below is either a **confirmed, fixed-in-code gap still pending an owner action**
(applying SQL to a live database — no session in this project's history has held live
Supabase credentials), a **confirmed, still-open gap**, or a **product decision deliberately
left undone**. Nothing here is speculative; each cites the evidence. Priority follows this
project's own established convention (security/data-integrity first).

## 1. P0 — Security (all fixed in code this session)

| Gap | Evidence | Status |
|---|---|---|
| Stored XSS in `approvals.html`/`profile.html` | `display_name`/`email` rendered via raw `.innerHTML`; `display_name` is self-updatable by any member (`omega_profile_fields.sql`) | **Fixed** — `esc()` helper added, both files escaped |
| Stored XSS in `sovereigns.html` | `profiles.sign` (self-updatable, `chunk_02b_migrations.sql`'s per-column GRANT list) queried for every `access_approved` member and rendered raw via `.innerHTML` in two places (table row, throne card) — no `user_id` filter, so reachable by/visible to the whole membership, not just the owner | **Fixed** — `esc()` helper added, both occurrences escaped |
| Stored XSS in `queue.html`'s dispatch log | `dispatches.category`/`title`/`body` are member-writable (RLS `"wire insert"` policy checks only row ownership, not column values) and were rendered raw via `.innerHTML` in the OPS queue's "PLATFORM DISPATCH LOG" panel, visible to the owner | **Fixed** — see §4.6 (bundled with the same panel's wrong-column-name fix) |
| Stored XSS in `graph.html`'s constellation-graph tooltip | `profiles.display_name` (self-updatable, every `access_approved` member queried with no `user_id` filter) rendered into the member-node tooltip's `.innerHTML`. The code *attempted* to escape it — `nm.textContent=m.name` then read `nm.textContent` back — but reading `.textContent` returns the original unescaped string (that trick only works if you read `.innerHTML` back instead), so the "escaping" was a no-op. Reachable by hovering any member node; visible to any other approved member or the owner who opens the page | **Fixed** — added a real `escGraph()` helper and used it in place of the broken round-trip |

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

**Owner action required:** apply `supabase/migrations/0013` and `0089`–`0092` (or the
equivalent loose files) via `supabase db push` or the Supabase SQL editor. This is the single
highest-leverage remaining action — it activates five already-written, already-validated
fixes at once.

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
  has still not been performed — five passes now (`REPOSITORY_AUDIT.md` §6 items 1-9, then
  items 11, 13, 14, and 15) have each covered a growing subset, not the full set. Items 14-15
  were script-assisted (cross-referencing every `.from()`/`.rpc()` call site and every
  write-error-check site programmatically) rather than manual page-by-page reading, which is
  why they could cover all remaining candidate files for those two bug classes in one pass. The
  `.innerHTML`-interpolation check is manual per-file (tracing each variable's data source) but
  is now exhaustive across three shapes: template-literal (`${...}`), string-concatenation
  (`+`), and bare-variable (`.innerHTML=someVar` with the variable built up earlier) —
  10 + 54 + 12 = 76 files, all individually traced (see §1) — and confirmed via grep that no
  file uses `outerHTML=`/`insertAdjacentHTML(`/`document.write(` with any of the three shapes
  (zero matches). **Not covered:** `.innerHTML` assignments inside a function passed as a
  callback/argument rather than a direct `var.innerHTML=` statement (e.g. framework-style
  render props, if any exist), and any bug class entirely outside these three
  (XSS/silent-failure/missing-table) — e.g. auth/authorization logic bugs, injection via
  `dangerouslySetInnerHTML`-equivalents in dynamically-`eval`'d strings, or logic errors with no
  security implication. `CAPABILITY_INVENTORY.md`'s unmarked pages remain "not individually
  audited," not "confirmed clean."
- **5.2** Live-database verification of anything in §2 — no session has held credentials.
- **5.3** Supabase MCP server (`.mcp.json`, added this session) is configured but not
  authenticated — that requires an interactive `claude` session, which was confirmed
  un-completable headlessly. Once authenticated, §2's "not applied" items become directly
  actionable from a Claude Code session instead of requiring a manual SQL-editor paste.

## 6. Priority-ordered action list

1. **Apply `supabase/migrations/0013` and `0089`–`0092` to the live database.** (Owner action
   — highest leverage, activates 5 already-built fixes at once.)
2. Authenticate the Supabase MCP server (`claude` → `/mcp` → approve → OAuth) so future
   sessions can verify §2 directly instead of inferring from client-code reads.
3. Decide the finance-pages persistence question (§4.2) — product decision, not code.
4. Decide whether/how to build real payment wiring for `enterprise.html` (§3.2) — business +
   legal decision, not code.
5. Consolidate the 47 duplicate table definitions toward `supabase/migrations/` as sole
   source of truth (§3) — housekeeping, no functional urgency.
6. Continue the page-by-page sweep (§5.1) — five passes done; all three `.innerHTML`
   interpolation shapes are now exhaustively traced (76 files, 4 real stored-XSS instances
   found and fixed across the passes). Remaining candidates for a next pass: pages with zero
   `.innerHTML` interpolation at all (not yet checked for other bug shapes — raw string
   concatenation without `+` syntax visible to a simple grep, or non-XSS logic bugs), and any
   bug class outside the three this sweep has focused on.

`nav.js`'s duplicate keys (previously here) — done, see §4.4.
