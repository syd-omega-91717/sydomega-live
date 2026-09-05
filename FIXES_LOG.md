# FIXES_LOG.md — the evidence-cited record of every bug found and fixed

This is CLAUDE.md §8's full history, moved here **verbatim and unedited**, in
its original order. Nothing was summarised, shortened, or dropped in the move:
the byte content below is identical to what §8 held, so every internal
"see above" / "the entry above" reference inside it still resolves correctly
against its neighbours here.

## Why it moved

CLAUDE.md is loaded into the context of every session in this repository,
before any work begins. Measured immediately before the split:

| | bytes | approx tokens | lines |
|---|---|---|---|
| CLAUDE.md, whole file | 275,623 | ~68,900 | 3,304 |
| §8 alone | 242,802 | ~60,700 | 2,756 |
| every other section combined | 32,821 | ~8,200 | 548 |

§8 was 88% of the file. The large majority of it is *closed* work — entries
that end in "Applied to the live database and verified", or a browser-verified
before/after — which is exactly what an audit trail should preserve and exactly
what a session does not need loaded to start reading code. CLAUDE.md §8 now
carries the parts that are still load-bearing (the recurring bug classes, the
genuinely open items, the current verification baseline, the method notes) and
points here for the evidence behind each.

## How to use it

- **Before concluding a bug is new**, search this file for the file or table
  name. Most bug classes in this repo have recurred, and the prior entry
  usually names the exact root cause and how it was verified.
- **Before claiming something is unfixed**, check here — several entries record
  work that a later reader mistook for open because they skimmed a header.
- **When you fix something**, append the new entry to CLAUDE.md §8's own
  "recent" list if it is still open, and here once it is closed and verified.
  CLAUDE.md §9's rule is unchanged: every claim stays evidence-cited (a
  file:line, a command's real output, a query result), and nothing is marked
  fixed, applied, or verified unless it actually was in that session.

---

- **No real client-side threat-detection exists, despite the security
  narrative implying it does — a naming mismatch made this hard to spot.**
  `omega-threat.js` (loaded by every page via `bg.js`) is actually the
  "digital thread" requirements-traceability engine (`window.OmegaThread`
  — REQ registry, change log, DORA metrics) — unrelated to security. There
  is no separate `omega-thread.js` on disk; a previous session already
  found this (see the comment at `bg.js` around the module-loader section)
  and left it as-is rather than guess at the fix, which was the right call
  — renaming risks breaking whatever the filename mismatch was deliberately
  worked around for, and writing a real threat-detection module from
  scratch is a feature decision, not a bug fix. Only fixed what was
  unambiguously wrong: `omega-threat.js`'s own header comment mis-identified
  itself as `omega-thread.js`, and a stale comment in `bg.js` pointed at a
  `DECISIONS.md` file that doesn't exist anywhere in this repo. Both
  corrected to state the actual situation instead of a broken pointer.
  Consequence worth knowing: `omega-guardian.js` (`window.OmegaGuardian`,
  a client-side "Zero Trust" session-scoring system with a visible score
  badge in every topbar) listens for a `threat_signal` event that is never
  emitted anywhere in the codebase — confirmed via repo-wide grep. More
  significantly, `OmegaGuardian.gate()` — the function meant to wrap and
  deny privileged actions below a risk threshold — is defined but never
  called by any page or module. No action on the platform is actually
  gated by it today; the badge always effectively reads "100" (only the
  module's own standalone 30-minute idle timer ever moves the score, and
  nothing consumes that score to deny anything). This isn't a security
  hole on its own — client-side gating was never a real security boundary
  regardless (RLS is, per §5) — but the badge visually implies active
  protection that isn't happening. Left as a documented gap rather than
  either wiring `gate()` into real actions (an architecture decision:
  which actions, at what thresholds) or removing the badge (a product
  decision), matching this file's own rule against guessing at those.
- **[Fixed, needs deploy] `extend_trial` RPC was missing — the approvals
  page's "extend" button silently did nothing.** `approvals.html`'s
  `extend(uid)` calls `sb.rpc('extend_trial',{p_uid,p_seconds:557})` to
  give a pending member +9:17 more minutes, wrapped in try/catch with a
  client-side `.update()` fallback written on the assumption that
  `sb.rpc()` throws on a missing function. It doesn't — like `.from()`,
  it resolves to `{data:null,error}` — so the fallback never ran, and the
  owner would see the "EXTENDED +9:17 MINUTES" success toast while nothing
  changed in the database. `grant_permanent_access`/`reject_member`/
  `revoke_member` (the sibling buttons on the same page) all have real
  RPCs already and are unaffected. Added
  `supabase/omega_extend_trial_fix.sql`, matching this function family's
  existing convention (`omega_access_control.sql`) exactly. **Applied to
  the live database and verified** — `scripts/verify_fixes.sql` confirmed
  `extend_trial` exists; a follow-up check confirmed it also carries the
  notification-insert from `omega_notify_triggers.sql` (see below) after
  a re-run was needed when an older copy of the function briefly won a
  run-order race against it.
- **Cross-referenced every `.from('table')`/`.rpc('fn')` call site against
  the schema; two more misses found, deliberately left undone.**
  `subscriptions.html` queries `public.transactions` (payment history) and
  `vault.html` queries `public.wallet_balances` (Ω token wallet) — neither
  table exists. Unlike `user_assets`/`extend_trial` above, these don't
  read as accidental: `subscriptions.html`'s own empty-state copy already
  says "PAYMENT ACTIVATION PENDING LEGAL REVIEW", and `wallet_balances` is
  Ω-token balance display, consistent with the token economy already
  being documented elsewhere as dormant (`platform_settings.tokens_enabled
  = false`, no tokens issued — see `sovereign-covenant.html`). Building
  either is real payment/token-infrastructure design work, not a bug fix
  — left undone pending an explicit decision, per this file's own rule
  against shipping monetizable features without gating them first.
- **`user_assets` table was missing from the live schema — fixed.**
  `portfolio.html` (SOVEREIGN ASSETS panel) and `vault.html` (NFT grid)
  both query `public.user_assets`, and portfolio.html's own copy calls it
  "the user_assets ledger... updated by mission outcomes, trade, and
  sovereign grants" — but no `CREATE TABLE` for it existed anywhere in
  `supabase/*.sql`. Supabase's JS client doesn't throw on a missing-table
  error, it returns `{data:null,error}`, and both pages silently fall back
  to their empty state — so every member's asset/NFT list has always shown
  empty, with no visible error. Added `supabase/omega_user_assets_fix.sql`
  (idempotent, RLS: read-only for `authenticated` on own rows + owner,
  matching that neither page ever writes to it directly — population is
  meant to happen server-side). **Applied to the live database and
  verified** — `scripts/verify_fixes.sql` confirmed `user_assets` now
  exists.
- **Finance pages: localStorage-only persistence — decided this session, stays
  client-side.** `wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`,
  `investment.html`, `expenses.html`, and `budget.html` persist entirely to
  `localStorage` — no Supabase table backs any of it, so balances/holdings
  don't sync across devices and are lost if browser storage is cleared. This
  is inconsistent with the rest of the platform's Supabase+RLS model, and
  with `income.html`/`ledger.html`/`contracts.html`/`portfolio.html`, which
  already persist server-side. Previously left as an open product question;
  decided this session in favor of keeping it client-side, deliberately, not
  by default: this is unusually sensitive data (net worth, income, holdings),
  converting it to server storage is a real schema-design commitment across
  7 pages that's hard to walk back once member data lives there, and this
  repo's own history this session includes multiple real RLS/security bugs
  found and fixed — "RLS protects it" isn't a settled guarantee here yet.
  Keeping data local-only is the safer default absent a specific reason to
  take on that exposure. The real downside (data loss on cleared storage or
  a new device) is mitigated instead of ignored: added `omega-local-backup.js`
  (a small, dependency-free, network-free export/import helper — writes a
  JSON file the member saves themselves, reads one back) and wired an
  "EXPORT BACKUP"/"IMPORT BACKUP" control plus a plain-language disclosure
  into all 7 pages. If server sync is wanted later, that's still a clean,
  additive, backward-compatible change — nothing here forecloses it.
- `supabase/migrations/` now exists (ordered, Supabase-CLI convention,
  content verified to match the current loose files) but is untested
  against a live database and the 47-tables-in-multiple-files redundancy
  is still unresolved — see `supabase/migrations/README.md`. The flat
  `supabase/*.sql` bag remains the working source for new changes until
  migrations/ is validated and adopted as canonical.
- ~~`sovereign-covenant.html` and `system_manifest.json` stated the token
  economy's 51%-stake / physical-reserve-backing language in the present
  tense~~ — fixed: both now carry explicit dormant/planned disclaimers
  (`sc-notice` block and per-article `PLANNED · NOT YET ACTIVE` tags in
  `sovereign-covenant.html`; `monetary_policy.status` in
  `system_manifest.json`), gated on `platform_settings.tokens_enabled`.
- `SYD-OMEGA-Legal-IP-Brief.docx` and one binary video (3.7 MB,
  `SYDOMEGA91717_DEMOD-1-.mp4`) are committed directly to git in the repo
  root. `.vercelignore` excludes `*.docx`/`*.md`/`*.pdf` from the actual
  Vercel deployment (see `.vercelignore` — it is the *only* defense, an
  earlier vercel.json redirect backup was removed for invalid syntax), so
  the docx is not live-served, but both files still bloat every clone with
  no LFS story. `.gitattributes` now marks them `-diff -text`; moving them
  to Supabase Storage/Vercel Blob and migrating to Git LFS remain open,
  non-urgent (see `REPOSITORY_AUDIT.md` §4).

- **Stored XSS in the owner's own admin panels — fixed.** `approvals.html`
  and `profile.html` (member-list views, the highest-privilege pages in the
  app) rendered `display_name`/`email` straight into `.innerHTML` with no
  escaping. `display_name` is self-updatable by any authenticated member
  (`supabase/omega_profile_fields.sql`), so any pending/approved member
  could set it to an HTML/script payload via a direct `.update()` call (no
  UI needed — the anon key is public) and have it execute in the **owner's**
  browser the next time they opened the approvals/members dashboard. Fixed
  by adding a per-page `esc()` helper (matching the convention already used
  elsewhere, e.g. `contracts.html`, `dashboard.html`) and escaping
  `display_name`/`email`/the avatar initial in both files.
- **`notifications` table was missing from the live schema — fixed.**
  `omega-notify.js` (injected platform-wide by `bg.js` on every approved
  page) queries `public.notifications` for the badge/toast/panel widget
  (`user_id`, `notification_type`, `message`, `content`, `created_at`,
  `read_at`), but no `CREATE TABLE` for it existed anywhere in
  `supabase/*.sql` — distinct from `public.dispatches` (the global
  owner-broadcast channel with no per-user state). Same silent-failure
  shape as `user_assets`/`extend_trial`: the badge always showed 0 and the
  panel always showed "NO NOTIFICATIONS" for every member, with no visible
  error. Added `supabase/omega_notifications_fix.sql` (idempotent, RLS:
  members read/update only their own rows, owner reads all). Nothing in
  the codebase currently inserts a notification row — deciding which
  server-side events should generate one is separate, undone-on-purpose
  work, same as `user_assets`'s population. **Applied to the live
  database and verified** — `scripts/verify_fixes.sql` confirmed
  `notifications` now exists, and `omega_notify_triggers.sql` (below)
  confirms the 5 member-status RPCs populate it.
- **[Live — achievement unlock notifications wired into task completion] Task
  completion now triggers notifications for both the task itself and any newly-
  unlocked achievements.** `public.complete_task()` (migration 0094 / 20260818224748)
  augmented with full achievement-unlock logic: computes milestones crossed via
  `public.milestones_for_axis()`, awards certificates/trophies/medals for each
  new milestone, and inserts notification rows gated behind
  `platform_settings.notifications_enabled` (default: false per §9). Task
  completion message: "Completed: {task_name}"; achievement messages via
  `public.notify_achievement()`: "Certificate Earned: Knowledge {n}" / "Trophy
  Unlocked: Mastery {n}" / "Medal Earned: Contribution {n}". Composite gate
  logic at (3,3,3)/(6,6,6)/(9,9,9) triggers "Gate Unlocked: Level {n}" when all
  three axes hit that threshold simultaneously. Returns jsonb with applied status,
  final axis values, authority_score, and unlocked achievements array. **Applied
  to live database and verified** (migration 20260818224748, confirmed via
  `pg_get_functiondef()` on production ydqhzvvoyufiiqvzcjns) — function exists
  with correct signature and full achievement logic deployed. Feature is live
  but dormant by default (notifications_enabled=false); owner must explicitly
  enable to surface achievement toasts to members.
- **Authority-history chart queried the wrong table — fixed.**
  `omega-chart.js`'s `API.auth()` (used by `analytics.html` and
  `studio.html`'s "Authority History" chart) queried
  `public.authority_snapshots`, which never existed; the real table with
  matching `snapshot_date`/`authority`/`user_id` columns is
  `leaderboard_snapshots` (`supabase/entreprise_schema_v2.sql`). Fixed by
  pointing the query at the correct table name — no schema change needed.
- **Silent-failure writes — fixed.** `social.html`'s platform
  connect/disconnect buttons updated the in-memory `connections` object
  and re-rendered "CONNECTED" before checking whether the
  `social_connections` upsert/delete actually succeeded; `family.html`'s
  heir-toggle/remove buttons gave no feedback at all on a failed write.
  Both fixed to check `.error` and alert the user on failure, matching the
  established convention from the `events.html`/`automation.html`/
  `advertising.html` fixes above.

- **[Fixed, needs deploy — was actively breaking production] Every Stripe webhook call and
  every task-completion/axis-progression call has been silently failing.** The owner ran a
  `pg_proc` introspection query against the live database (see `GAP_ANALYSIS.md` §3.1 for the
  full trace) confirming two real, live bugs, both reproduced and re-verified end-to-end
  against a scratch PostgreSQL 16 instance before any fix was written:
  - `public.apply_subscription()` has two overloads live simultaneously (5-arg and 7-arg).
    `supabase/functions/stripe-webhook/index.ts` always calls with the 5 shared params, which
    Postgres cannot resolve unambiguously (`function ... is not unique`) — every webhook event
    (checkout completed, subscription updated/deleted, payment failed) has been failing, so a
    member who pays via Stripe never gets `subscription_status` set to `active`. The 7-arg
    overload was independently broken too (`COALESCE(p_tier_num::integer, membership_tier::text)`
    — a static type mismatch, `profiles.membership_tier` is `text`), so dropping the 5-arg one
    instead would not have worked. Fixed by dropping the 7-arg overload
    (`supabase/omega_apply_subscription_fix.sql`, `migrations/0093`).
  - `public.complete_task()` — only the `(p_task_name,p_task_type,p_axis_type,p_description,
    p_points)` signature is live, but all 5 client call sites (`omega-matrix.js`,
    `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`) used older, non-matching
    parameter names (`p_kind`/`p_task`/`p_axis`/`p_title`/`p_weight`) — every task completion,
    axis increment, authority-score update, and `nodes_earned` count has been silently no-oping
    platform-wide (habits, publishing, workflows, dedication, gaming, academy, exam,
    contributions), not just one bonus message as originally suspected. Fixing the param names
    alone would have exposed a second, previously-inert bug in the same function: no
    deduplication existed despite `omega-progress.js`'s own header comment and
    `publishing.html`'s copy both promising "keyed on (user, task)" / "farm-proof" behavior —
    confirmed by calling the live function body twice with an identical task and getting two
    separate increments. **A fourth, independent bug then surfaced when the owner actually ran
    the fix**: `CREATE INDEX ... (user_id, task_name)` failed with `column "task_name" does not
    exist` — the owner's live `public.task_completions` has an older, simpler shape (`id
    bigint, user_id, kind, task, completed_at, axis, increment, created_at`, confirmed via
    `information_schema.columns`) than what the live `complete_task()` function's own `INSERT`
    targets. Multiple `CREATE TABLE IF NOT EXISTS` definitions for this table exist across the
    SQL bag with genuinely different shapes; whichever ran first on the live database won, and
    it matches none of them exactly. Reproduced against a scratch instance seeded with the real
    reported columns: since a plpgsql function with no exception handler rolls back its entire
    body on any unhandled error, **`complete_task()` has never actually committed anything for
    anyone** — even the `profiles` axis/authority/`nodes_earned` update immediately before the
    failing `INSERT` was always rolled back too. Fixed by amending `migrations/0094` in place
    (nothing from the owner's failed first attempt had landed, since Postgres rolled back that
    whole transaction) to add a non-destructive `ALTER TABLE ADD COLUMN IF NOT EXISTS` for the
    missing columns before the index/function statements — old columns and any existing rows
    untouched. All three bugs fixed together: `supabase/omega_complete_task_dedup_fix.sql`
    (`migrations/0094`) adds the missing columns, the `(user_id, task_name)` dedup check, a
    supporting index, and an `applied` boolean in the return value; the 5 client call sites'
    parameter names are fixed in the same commit, plus `omega-matrix.js`'s separate bug reading
    `d.a`/`d.b`/`d.c` from a return shape that has always been `d.axis_a`/`d.axis_b`/`d.axis_c`.
  **Applied to the live database and verified.** The owner ran both fix files, then
  `scripts/verify_fixes.sql` (added this session) against the live database confirmed:
  `apply_subscription` has exactly one version live with the correct 5-arg signature;
  `complete_task` has the correct signature (`p_task_name text, p_task_type text, p_axis_type
  text, p_description text, p_points numeric` — `pg_get_function_identity_arguments()` never
  includes `DEFAULT` clauses, so compare against bare names/types, not the full `CREATE
  FUNCTION` text) and its dedup guard; `task_completions` has the columns the function needs.
  Production payments and progression tracking are unblocked.

- **[Fixed, needs deploy] `member_presence` writes have been silently failing on every page,
  every 30 seconds, for every member — same bug class as `extend_trial`/`complete_task` above.**
  Found while auditing `omega-*.js` modules loaded platform-wide by `bg.js` with zero call sites
  anywhere, looking for genuine wiring gaps (`FEATURE_IDEAS.md` #7–#13's pattern). Most turned out
  to be either already-working self-contained systems (`omega-legal.js`'s GDPR consent banner
  boots itself on `DOMContentLoaded`, confirmed correctly gated — nothing to fix) or genuinely
  dormant UI wiring gaps (already fixed as #10–#13). `omega-presence.js` was neither: it's fully
  self-activating (`setTimeout(startSync, 2000)`, no wiring needed) and has been calling
  `sb.from('member_presence').upsert({...})` on every page load and every 30-second sync since it
  was written — but two of its payload keys never matched the live schema
  (`supabase/entreprise_schema_v2.sql:47-52`): it sent `session_started` where the real column is
  `session_started_at`, and `dedication_today`, which doesn't exist as a column anywhere in the
  SQL bag (confirmed via a full-repo grep, not assumed). Supabase's REST layer (PostgREST) rejects
  writes referencing unknown columns, and the call is wrapped in `.catch(function(){})` — so like
  `complete_task()` before its fix, this has silently never committed a single row. Fixed by
  renaming `session_started`→`session_started_at` and dropping `dedication_today` (no such column
  exists to write to; adding one would be new schema, not this bug fix) in `omega-presence.js`.
  Verified with a schema-validating test harness that emulates PostgREST's actual
  unknown-column-rejection behavior (not just "doesn't throw") — confirmed the old code fails this
  check with exactly the two bad keys above, and the fixed code passes with all six keys matching
  the live schema exactly. **Not yet applied to the live database** — this fixes the client-side
  write shape only; no SQL changes were needed since the table already existed correctly, only the
  JS was wrong.
  Since `member_presence`'s own RLS already grants every authenticated member `SELECT` access
  (`"members see presence" ON public.member_presence FOR SELECT USING(true)`,
  `entreprise_schema_v2.sql:56-57` — matching the module's own header comment, "Inspired by
  Discord's presence system," an intentional design choice already baked into the schema, not a
  new privacy decision made here) and nothing anywhere displayed this data, added a minimal
  "ONLINE NOW" KPI card to `dashboard.html`'s main overview row, reading
  `member_presence` filtered to `is_online=true` within a 90-second recency window (covers one
  missed 30s sync before a member reads as offline). No new table/RPC/`platform_settings` flag.

- **[Fixed, needs deploy — likely the highest-impact bug found this session] New-member onboarding
  has never actually saved a member's chosen sign/element/god/agent/token — every visit re-showed
  the "SELECT YOUR ZODIAC SIGN" overlay, and every confirm silently failed while still showing a
  false "Welcome, Sovereign!" success toast.** `omega-onboard.js` is fully self-activating
  (fires on the real, reliably-dispatched `omega:populated` event — confirmed dispatched from
  `window.__omegaPopulate()`, the same population function 92+ pages already call, unlike the
  separate, rarely-fired `omega:user-loaded` event discussed above) and its own trigger condition
  is exactly `!pr.sign && !pr.element && !pr.is_owner` — so this reproduces for every new member,
  every time, until the fields actually save. They never did: the confirm handler's
  `profiles.update()` call sent `olympian`, `agent_name`, and `token_affinity` — none of which
  are real column names. A repo-wide grep confirms the real columns are `god`, `agent`, and
  `token` (all three already correctly read elsewhere, e.g. `omega-share-card.js`'s `pr.god`/
  `pr.agent`/`pr.token`) — this was a naming mismatch against columns that already exist, not
  missing schema. A fourth field, `onboarded_at`, has no equivalent column anywhere in the SQL
  bag; dropped rather than added, since `needsOnboarding()`'s own check (`!pr.sign && !pr.element`)
  already serves as the "has onboarded" signal once `sign`/`element` correctly save — adding a
  redundant timestamp column would be new schema, not this bug fix. PostgREST rejects the whole
  update when any field is unrecognized, so `sign`/`element` never saved either, even though
  those two were spelled correctly. The update result was never checked for `.error` (same
  silent-failure shape as every fix above), so the flow always proceeded to show success. Fixed
  both: corrected the three field names, and added an explicit `.error` check that now shows a
  real "could not save" error and re-enables the button on failure instead of a false success.
  Verified with the same schema-validating mock as the `member_presence` fix above, driven
  through an actual click-through of the onboarding UI (select a sign, click confirm) rather than
  just inspecting the code: confirmed the pre-fix code produces exactly the four wrong keys and
  the post-fix code produces exactly `sign`/`element`/`god`/`agent`/`token` matching the live
  schema, with the correct values for each (cross-checked against `ZODIAC_MAP`'s own data, e.g.
  Aries → Ares/Sentinel/ARENITE). **Not yet applied to the live database** — no SQL changes
  needed, this is a client-side field-name and error-handling fix only.
- **`omega-workflow.js`'s `query_dedications` step queried a column that doesn't exist — fixed;
  found while auditing whether the module is even reachable in the first place.** Auditing the
  remaining unexplored `omega-*.js` modules (`omega-capability.js`, `omega-page-emblem.js`,
  `omega-workflow.js`, `omega-experiment.js`, `omega-intelligence.js`, `omega-memory.js` —
  continuing the `FEATURE_IDEAS.md` #7–#14 pattern) found that `omega-workflow.js`'s
  `report_generate` workflow's `query_dedications` step selected and ordered by
  `sovereign_events.created_at`, but the live table (`entreprise_schema_v2.sql:65-76`) has no
  `created_at` column at all — only `occurred_at` (confirmed via a full-repo grep, not assumed;
  `record_sovereign_event()` and every other real writer of this table already use
  `occurred_at` correctly). Same silent-failure shape as every bug above: PostgREST rejects a
  `select`/`order` referencing an unknown column, the call is wrapped in try/catch, so this step
  has always silently returned an empty dedications array instead of erroring visibly. Fixed by
  correcting both the `select()` and `order()` calls to `occurred_at`. Verified with an extended
  version of the schema-validating mock (added read-side column validation alongside the
  existing write-side check, since this is the first bug this session found in a *read* rather
  than a *write*) — confirmed the pre-fix code returns 0 dedications against 2 seeded rows, the
  post-fix code returns both, no regressions across the other 8 existing verification tests after
  extending the mock. **Not yet applied to the live database** — no SQL changes needed, this is a
  client-side column-name fix only. Separately, but discovered in the same audit: this bug was
  latent in effectively dead code — `OmegaWorkflow.run(...)` (which is how `query_dedications`
  would ever execute) has no external caller anywhere in the repo today. See `FEATURE_IDEAS.md`'s
  "Flagged, not proposed" section for why wiring the workflow engine up to something is a
  scoping decision left undone, not a bug.
- **[Fixed, needs deploy — legally-sensitive] The GDPR Article 20 data-export button
  (`privacy.html`, `omega-export.js`) has always exported a mostly-empty package — 4 of its 6
  datasets silently failed on every single request.** Continuing the module audit, checked every
  `.select()` in `omega-export.js`'s `gather()` against the live schema, column by column, rather
  than assuming the file's own comments ("Exported datasets: 1. Profile & identity... 2. Task
  completions...") reflected reality. They didn't, in 4 of 6 cases — the same
  guessed-column-name silent-failure shape as `complete_task`/`member_presence`/
  `omega-onboard.js`/`omega-workflow.js` above, just never audited until now because nothing
  about a GDPR export *looks* broken from the outside (no error, no empty-state UI — the button
  always shows a "Export ready" success toast and downloads a real file, it's just missing most
  of its content):
  - `profiles` select used `agent_name` (real column: `agent` — same mismatch already fixed in
    `omega-onboard.js`) and `onboarded_at` (no such column anywhere in the SQL bag, same as the
    `omega-onboard.js` finding). PostgREST rejects the whole select on any unknown column, so the
    exported "profile" dataset has never contained more than a client-computed
    `_computed_authority` value — no `display_name`, `email`, `sign`, `element`, `god`, `agent`,
    `token`, etc., ever.
  - `task_completions` select used `weight_applied` — no such column exists anywhere (the real
    column, added by `migrations/0094`/`omega_complete_task_dedup_fix.sql`, is `points_earned`).
    Exported task-completion history has always been empty.
  - `sovereign_events` select and order used `created_at` — same wrong-column bug as
    `omega-workflow.js` above (real column: `occurred_at`). Exported event history has always
    been empty.
  - `leaderboard_snapshots` select used `tier` — no such column exists on this table
    (`entreprise_schema_v2.sql:126-140`; confirmed via grep, not assumed). Exported ranking
    history has always been empty. Changed to `element` (a real column already selected
    elsewhere in this same file for other tables, and meaningful ranking context) rather than
    dropped outright.
  - `interest_signals` and `activity_feed` selects were already correct — both actually worked.
  Fixed all four by correcting column names to match the live schema (`agent`, dropped
  `onboarded_at`, `points_earned`, `occurred_at`, `element`). Verified with the schema-validating
  Playwright mock, driven through an actual click on the export flow (not just code inspection):
  captured the real downloaded JSON blob via a `URL.createObjectURL` interception, confirmed the
  pre-fix package has an empty/near-empty profile (missing `display_name`) and zero rows across
  `task_completions`/`sovereign_events`/`leaderboard_snapshots` despite seeded data existing for
  all of them, and the post-fix package correctly contains all 6 datasets with their seeded rows.
  No regressions across the other 4 verification tests. **Not yet applied to the live database**
  — no SQL changes needed, this is a client-side column-name fix only.
- **The bottom-bar live activity ticker (`omega-realtime.js`, every page) has always stayed
  stuck on "LOADING LIVE FEED…" — fixed.** Completing the sweep of every remaining `omega-*.js`
  module with a `.from()`/`.rpc()` call (30 modules audited this session in total; see
  `CAPABILITY_INVENTORY.md` §2 for the full list), `pollActivityFeed()` selected
  `activity_type,title,member_name,created_at` from `public.activity_feed` — but that table has
  no `member_name` column at all (`platform_expansion.sql:9-19`: `id, user_id, activity_type,
  title, body, metadata, is_public, likes_count, created_at`; confirmed via grep, not assumed).
  PostgREST rejects the whole select on the unknown column, the call is wrapped in try/catch, so
  `_tickerItems`/`_eventFeed` have never once been populated — every member on every page has
  always seen the ticker's static placeholder text, never real content, with no visible error.
  Fixed by dropping `member_name` from both the select and the template string (no join to
  `profiles` added — that's a bigger change than this bug fix, and `title` alone reads fine,
  e.g. "Completed Habit Streak · 1s ago"). Verified with the schema-validating Playwright mock,
  driven through `OmegaRealtime.refresh()` on a live page: confirmed the pre-fix code leaves the
  ticker on its placeholder text with `feed()` returning 0 rows despite 2 seeded activity_feed
  rows, and the post-fix code populates both correctly. No regressions across the other 5
  verification tests. **Not yet applied to the live database** — no SQL changes needed, this is
  a client-side column-name fix only.
- **RLS policy audit (first full pass): every FOR INSERT/UPDATE/ALL policy's WITH CHECK clause
  cross-referenced against whether its table has a user-identity column that should be scoping
  it — 4 real gaps found and fixed, plus 1 storage-policy gap, all in
  `supabase/omega_rls_scoping_fix.sql`.** `scripts/audit.py` check 4 only confirms every table
  has RLS *enabled* (0 tables missing it, confirmed clean) — this pass checked policy
  *correctness*, which that check doesn't cover. All five gaps share the same shape: `WITH
  CHECK(true)` (or, for storage, no owner-bypass) lets any authenticated account — including one
  still pending approval — write or read rows it shouldn't, via a direct REST call to the
  anon/publishable key, not through the app UI (RLS is the actual authorization boundary here,
  §5, not application code). Each was confirmed to have zero legitimate client writer that the
  fix would break, by grepping every `.js`/`.html`/edge-function file for the table name before
  touching its policy:
  - `capability_kpi_log` — `FOR SELECT` is owner-only (`omega_capability_registry.sql`), but
    `FOR INSERT` was `WITH CHECK(true)`: any signed-up account could inject fake KPI rows into a
    table only the owner is meant to see. Zero client writers anywhere in the repo. Fixed by
    restricting INSERT to the owner too, matching SELECT.
  - `policy_eval_log` — identical shape and fix (`omega_policy_engine.sql`'s SELECT is
    owner-only; INSERT was wide open; zero client writers).
  - `threat_events` — `FOR INSERT` was `WITH CHECK(true)` with **no scoping to the table's own
    `user_id` column** — worse than the two above, since a malicious signed-up account could
    insert a row attributing `threat_type` values like `'brute_force'` or
    `'privilege_escalation'` to a *different* member's `user_id`, framing them on the owner's SOC
    dashboard (`dashboard.html`/`observatory.html` both show a threat count read from this
    table). Zero client writers exist today — only reads, for the dashboard counts. Fixed with
    `auth.uid() = user_id` rather than owner-only, since the table having a `user_id` column at
    all implies the intended design is eventual self-reported client telemetry, not owner-only
    writes.
  - `telemetry_events` — has a real, currently-working client writer (`omega-telemetry.js`,
    audited earlier this session and found correct) that already always sets `user_id` to the
    caller's own profile id before any insert fires (`_uid` is only ever set from the
    `omega:populated` event's own profile, and `flush()` requires `_uid` set first) — so
    tightening `WITH CHECK` to `auth.uid() = user_id` closes the same spoofing gap as
    `threat_events` without touching the real write path. `platform_metrics` and
    `platform_events` were checked too and deliberately left alone: `platform_metrics` has no
    `user_id` column at all (a platform-level aggregate, not per-member — `WITH CHECK(true)` is
    correct there), and `platform_events`'s real writer (`omega-sovereign-os.js`) never sets
    `user_id` by design for anonymous-until-populated beacons, so scoping it would break the real
    write path instead of closing a gap.
  - `storage.objects` **"uploads" bucket read policy** (`storage.sql`) — a member can submit a
    KYC document (`profile.html`'s upload flow writes into `uploads/<their-uid>/...` and sets
    `profiles.kyc_doc_path`), but the bucket's read policy only ever let a member read their own
    folder — no owner-bypass, unlike every other owner-elevated policy in this schema. Confirmed
    via grep that `approvals.html` has zero KYC references (the review UI itself was never
    built), so this isn't exploited today, but it silently blocks the review half of a
    half-built feature. Fixed by adding the same `is_platform_owner()` OR-clause used everywhere
    else in this schema.
  **Verified against a real scratch PostgreSQL 16 instance**, not just read by eye: loaded the
  real source files that create all 4 tables plus `storage.sql`, applied the fix file (clean,
  idempotent — confirmed safe to re-run twice), then ran 7 functional tests simulating two
  member sessions and an owner session via a configurable `auth.uid()` stub: (1) member A
  attributing a fake threat to member B → rejected, (2) member A self-reporting → accepted, (3)
  member A injecting fake KPI data → rejected, (4) member A spoofing telemetry under member B's
  uid → rejected, (5) member A's own telemetry → accepted, (6) member A reading member B's
  uploads folder → 0 rows, (7) the owner reading the same folder → the row is visible (the actual
  new capability). All 7 passed. `python3 scripts/audit.py` reconfirmed 0 critical / 6
  pre-existing warnings (file/policy counts increased by exactly 1 file / 5 policies, matching
  the new fix file, no new duplicate-table or RLS-missing warnings introduced). **Applied to the
  live database and verified** (2026-08-17, via the Supabase MCP connector once authorized) —
  queried `pg_policies` on the live project (`ydqhzvvoyufiiqvzcjns`) before applying and
  confirmed all 5 gaps present exactly as described (`capability_kpi_log`/`policy_eval_log`
  INSERT policies both `WITH CHECK(true)`, `threat_events`/`telemetry_events` INSERT unscoped,
  `storage.objects` "uploads read" with no owner-bypass); applied
  `omega_rls_scoping_fix.sql` via `apply_migration`; re-queried `pg_policies` afterward and
  confirmed all 5 policies now read exactly as the fix file specifies (`owner inserts kpi`/`owner
  inserts eval` → `is_platform_owner()`, both `threat_events`/`telemetry_events` INSERT →
  `auth.uid() = user_id`, `uploads read` → own-folder-or-owner). `get_advisors(security)`
  re-run afterward with zero findings referencing any of the 5 touched policies.
- **Edge Function audit (all 7 functions read in full): 2 real findings — a daily cron job that
  has never written a single row, and a fully orphaned duplicate file.**
  - **`snapshot-leaderboard`'s upsert has always silently failed — fixed.** This function (meant
    to run on a daily Supabase cron at 00:05 UTC per its own header comment, also callable
    on-demand by the owner from `leaderboard.html`) upserts
    `user_id, snapshot_date, authority, axis_a, axis_b, axis_c, rank_global, display_name,
    element, sign, tier, is_owner` into `public.leaderboard_snapshots` — but the table's only
    `CREATE TABLE` (`entreprise_schema_v2.sql:126-140`; confirmed via grep, no other file
    ALTERs it) has no `display_name`, `sign`, `tier`, or `is_owner` columns at all. PostgREST
    rejects the entire upsert on any unknown payload key, so this cron job has never written a
    single row — and its own per-batch error handling still returns `{ok:true, rows_written:0}`,
    a false success with no visible failure. This directly explains why `leaderboard_snapshots`
    read empty everywhere else it was touched this session (the `omega-export.js` GDPR-export
    fix earlier needed seeded test data specifically because the real table has likely never
    held a row). Fixed by adding the 4 missing columns
    (`supabase/omega_leaderboard_snapshots_columns_fix.sql`) rather than stripping them from the
    edge function's payload, since `leaderboard.html`'s own `renderPodium()`/`renderTable()` (the
    documented tier-2 fallback reader for this exact table) already read `r.display_name` and
    `r.sign` from snapshot rows — the writer and reader already agree on this shape; only the
    table was missing it. **Verified against a real scratch PostgreSQL 16 instance**: loaded the
    actual `entreprise_schema_v2.sql`, reproduced the exact failure with the edge function's
    literal upsert payload (`column "display_name" of relation "leaderboard_snapshots" does not
    exist`), applied the fix, confirmed the same payload now succeeds and reads back exactly the
    shape the client expects, and confirmed the fix file is idempotent (clean second run).
    **Applied to the live database and verified** (2026-08-17, via the Supabase MCP connector) —
    queried `information_schema.columns` on the live project (`ydqhzvvoyufiiqvzcjns`) before
    applying and confirmed `leaderboard_snapshots` had only the original 12 columns; applied
    `omega_leaderboard_snapshots_columns_fix.sql` via `apply_migration`; re-queried and confirmed
    `display_name`/`sign`/`tier`/`is_owner` now exist with the correct types (`text`/`text`/
    `text`/`boolean`). The cron job itself wasn't separately re-triggered this session (it runs
    on its own daily schedule), so the next scheduled or owner-triggered run is the first one
    that will actually write rows — but the column-shape blocker that made every prior run
    silently write 0 is now gone.
  - **`checkout/stripe-webhook/index.ts` — a fully orphaned duplicate, removed.** A second,
    45-line Stripe-webhook implementation existed nested inside the `checkout` function's own
    directory (`supabase/functions/checkout/stripe-webhook/index.ts`), structurally distinct from
    (and much less complete than) the real, comprehensively-documented top-level
    `supabase/functions/stripe-webhook/index.ts` (272 lines — Web Crypto signature verification,
    4 event types, deploy instructions). Confirmed genuinely dead, not "which one is live"
    ambiguity like the SQL duplicate-function situation elsewhere in this repo: Supabase Edge
    Functions only recognize top-level `supabase/functions/<name>/index.ts` directories as
    deployable — a subdirectory nested inside another function's own folder was never a valid
    deployment target under any standard Supabase workflow. `checkout/index.ts` itself never
    references it, and a full-repo grep for "stripe-webhook" found every other reference in the
    codebase (`CLAUDE.md`, `GAP_ANALYSIS.md`, `CAPABILITY_INVENTORY.md`,
    `scripts/check-secrets.sh`, `supabase/migrations/README.md`) pointing exclusively at the
    top-level file. Removed the nested `checkout/stripe-webhook/` directory entirely.
  - All 5 other functions (`checkout`, `concierge`, `intel-feed`, `notify-access`, `rankings`,
    and the top-level `stripe-webhook`) were read in full and checked column-by-column /
    param-by-param against the live schema — all correct, no bugs found. (`rankings` and
    `snapshot-leaderboard` share near-identical AUTH-computation logic; `rankings` is read-only
    and unaffected by the column bug above.)
- **HTML-page audit (built a repo-wide schema dictionary and scanned every `.html` page's
  inline JS against it — the first automated, not manual, pass this session): 8 more
  column-name silent failures, plus a systemic 26-instance bug class affecting 24 pages'
  clickable UI.** Method: parsed every `CREATE TABLE`/`ALTER TABLE ADD COLUMN` in
  `supabase/*.sql` into a table→known-columns dictionary (had to fix a real bug in the
  parser itself first — a SQL line comment containing a comma, e.g.
  `-- 'task_complete','gate_unlock',...`, was corrupting the column split and produced a
  false positive on `activity_feed.title`; also had to manually add `task_completions`'
  `kind`/`task`/`axis`/`increment` columns, which are confirmed live per this file's own
  `complete_task()` entry above but never appear in any `CREATE TABLE` in the SQL bag at
  all, having been created out-of-band), then scanned every `.from('table').select()/
  .insert()/.update()/.upsert()` call across all 169 `.html` pages for column names absent
  from that table's known set. Every finding below was independently confirmed by hand
  (reading the real `CREATE TABLE`, the real RLS policies, and the actual downstream code)
  before fixing — the automated pass finds *candidates*, not verdicts.
  - **`feed.html`** — `publications` select referenced `author_name` (doesn't exist; the
    column is `user_id`, no display-name join was ever built). The platform-wide "recent
    publications" feed has always shown "PUBLICATIONS UNAVAILABLE." Fixed by dropping the
    field (matches the existing `||'ANONYMOUS'` fallback already in the render code, same
    minimal-fix precedent as `omega-realtime.js`'s `member_name` fix earlier this session).
  - **`graph.html`, `nexus.html`, `sigma.html`** — all three select `zodiac_sign`/`full_name`
    from `profiles` (real columns: `sign`/`display_name`). Same copy-pasted wrong names
    across all three — the member constellation graph, the nexus visualization, and the
    element-breakdown leaderboard have never rendered a single real member, silently
    degrading to empty (`||[]` fallbacks swallow the query error with no visible failure).
    Fixed by renaming `zodiac_sign`→`sign` everywhere (including downstream `SIGN_ELEM[...]`
    lookups) and dropping `full_name` (the existing `display_name||full_name||'Sovereign'`
    fallback chains already degrade gracefully once the nonexistent field is removed).
  - **`tribe.html`** — selected `authority_score`/`gate_level`, neither a real column
    (`profiles.authority` exists but is never written by anything — confirmed via grep, a
    dormant column, not a usable substitute), and ordered by the nonexistent
    `authority_score`. The tribes/rankings page has always shown 0 real members (its
    `try/catch` around the query never actually triggers, since a PostgREST schema error
    resolves rather than throws — the page silently shows an empty tribe, not the
    `generateDemoProfiles()` fallback some might expect from reading the code without
    testing it). Fixed by selecting `axis_a/axis_b/axis_c/is_owner` instead and computing
    `authority_score`/`gate_level` client-side with the same `calcAuth()`/gate-threshold
    pattern already used identically on `sigma.html` and several other pages, sorting
    client-side since a computed value can't be used in a server-side `.order()`.
  - **`advertising.html`** — both `loadLiveAds()`'s select and `submitAd()`'s insert used a
    completely different, wrong set of column names (`headline`/`body`/`tier`/
    `company_name`/`destination_url`/`timeline_period`/`submitted_at` vs. the real
    `title`/`description`/`rate_tier`/`company`/`url`/no-timeline-column/`created_at`
    auto-default) — the ad marketplace has never displayed a real ad or successfully
    recorded a submission. A second, independent bug in the same page: `loadLiveAds()` and
    the KPI counter in `boot()` both filtered `status='active'`, a value nothing in the
    codebase ever assigns (the schema comment documents only `pending`/`approved`/
    `rejected`, and the RLS read policy checks `status = 'approved'`) — fixed to match. A
    third, independent bug found only by testing the fix in a real browser, not by reading
    the code: `loadLiveAds()` is declared inside the page's `<script type="module">` block,
    but is called from `setTab()` in a separate, non-module `<script>` via
    `onclick="setTab('live')"` — module top-level declarations aren't global, so clicking
    the "LIVE ADS" tab has always thrown `loadLiveAds is not defined` in the real browser
    console (silently, since inline `onclick=` errors don't surface to the user), meaning
    the ad grid never populated even after this session's column-name fix, until this was
    separately corrected by exposing `window.loadLiveAds=loadLiveAds`. Also added the
    missing RLS `INSERT` policy (`supabase/omega_advertisements_insert_fix.sql`) — see
    below, `submitAd()` was RLS-blocked independent of the column names.
  - **`approvals.html`** — `sendDispatch()`'s fallback path (used when the real
    `post_dispatch()` RPC call fails) inserted directly into `dispatches` with 2 wrong
    column names (`sent_by`/`sent_at`, neither exists) *and* `dispatches` has no INSERT
    policy for anyone except via that RPC's `SECURITY DEFINER` bypass — so the fallback was
    doubly non-functional, yet the code never checked the insert's result and always showed
    "✓ DISPATCH RECORDED" regardless. Fixed by removing the non-functional fallback insert
    entirely (a raw write that bypasses `post_dispatch()`'s own input sanitization would be
    a worse fix than making the real failure visible) and showing an honest failure toast
    when the RPC itself fails.
  - **`map.html`** — flagged, not fixed: selects `lat`/`lon`/`country`/`gate` from
    `profiles`, none of which exist anywhere in the schema — this isn't a naming mismatch
    like the others, there is no member-location data anywhere in this platform at all.
    Building real geolocation collection is a genuine new feature (consent flow, collection
    method, privacy-policy implications), not a bug fix — see `FEATURE_IDEAS.md`.
  - **A systemic module-boundary bug, found only by testing a fix in a real browser and
    then deliberately searching for the same pattern elsewhere: 26 instances across 24
    pages, the single highest-count bug class found this session.** Many pages split their
    inline JS into a plain `<script>` (usually just a `setTab()`/`switchTab()`-style
    function, called from `onclick=` attributes in the markup) and a separate
    `<script type="module">` (the Supabase logic). Inline event-handler attributes always
    execute in global scope, but a function declared at the top level of a
    `<script type="module">` is scoped to that module, not global — so whenever the
    tab/action function itself was accidentally written *inside* the module script instead
    of the plain one, every click on that control has thrown `ReferenceError` in the
    browser console, silently, with the click doing nothing. Found by writing a script that
    parses every page's script tags, determines which top-level functions are
    module-scoped-only (never `window.`-exposed), and cross-references every inline
    `onclick=`/`onchange=`/etc. attribute against that set. Confirmed by hand on a sample
    across the list (`awards.html`, `network.html`, `nutrition.html`, `maintenance.html`
    each individually verified with a real declaration read, not just trusted from the
    scan) before batch-fixing all 26 by inserting `window.<fn>=<fn>;` immediately before
    each affected declaration (function declarations hoist, so placement is safe regardless
    of call order) — 22 are `setTab(name)`/`switchTab(...)` tab-switchers (`awards.html`,
    `beacon.html`, `ecosystem.html`, `enterprise.html`, `events.html`, `factions.html`,
    `feed.html`, `health.html`, `maintenance.html`, `marketplace.html`, `membership.html`,
    `prediction.html`, `privacy.html`, `publishing.html`, `search.html`, `series.html`,
    `sovereign-ai.html`, `sovereigns.html`, `trailers.html`, `travel.html`), the remaining 4
    are page-specific actions (`decisions.html`'s `renderChoiceButtons()`, `network.html`'s
    `editContact()`/`deleteContact()`/`openLog()`, `nutrition.html`'s `searchFood()`,
    `publications.html`'s `renderCatalog()`). Verified with a dedicated Playwright test
    clicking the real inline `onclick=` handler (not calling the function directly) on a
    sample of the fixed pages — tab panels now actually switch, zero page errors — plus a
    re-run of the automated scanner confirming 0 remaining instances across all 169 pages.
  All fixes verified: the column-name fixes with a schema-validating Playwright mock seeded
  with real-shaped data (confirming the previously-broken queries now return it); the RLS
  fix with a real scratch PostgreSQL 16 instance (member submits own ad → succeeds; member
  spoofs another member's `submitted_by` → rejected; a different member reads the approved
  ad afterward → succeeds); the module-boundary fixes with real inline-attribute clicks in
  headless Chromium. `node --check`-equivalent syntax validation on every touched page's
  inline `<script>` blocks, and `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing
  warnings throughout. **Applied to the live database and verified** (2026-08-17) — queried
  `pg_policies` on `public.advertisements` before applying and confirmed only `owner_manage_ads`
  and `read_approved_ads` existed, no INSERT policy for a non-owner member; applied
  `omega_advertisements_insert_fix.sql` via the Supabase MCP connector's `apply_migration`, then
  re-queried and confirmed `"member submits own ad"` (`FOR INSERT`, `WITH CHECK (submitted_by =
  auth.uid())`) now exists alongside the other two. Matching local migration file added at
  `supabase/migrations/20260817233805_omega_advertisements_insert_fix.sql`, named with the exact
  version string the remote recorded.
  - **`dna.html` had the identical `tribe.html`-class bug, found and fixed separately**: its
    personalization panel read `pr.authority_score`/`pr.gate_level`, neither of which exists,
    so every member saw the same generic default (`gate 1`, `auth 3.14`) regardless of real
    progress. Fixed the same way as `tribe.html` below.
  - **Reconciliation correction, found merging two independent sessions' overlapping fixes for
    this exact bug class:** the fix above for `tribe.html`/`dna.html` initially read the stored
    `profiles.authority` column directly. That column is real, but trusting it is inconsistent
    with the platform-wide convention every other authority-displaying page already
    uses — `nexus.html`, `sigma.html`, `omega-export.js`, etc. all compute authority
    **client-side** from `axis_a/b/c` with an explicit `is_owner ? 27.8367 : calcAuth(...)`
    special case, specifically because the stored column isn't guaranteed to reflect the owner's
    apex status. Corrected both pages to match that convention instead (compute from
    `axis_a/b/c` client-side, sort client-side since a computed value can't drive a server-side
    `.order()`) — same bug class, more correct fix.
- **[Fixed — likely the highest-impact bug found in this repo's history] `bg.js` never loaded
  `nav.js` — the sidebar navigation was completely empty on the ~162 pages that rely on `bg.js`
  alone, contradicting this file's own (wrong) claim that "every page loads `bg.js`... and
  `nav.js`" (§9, and `REPOSITORY_AUDIT.md`'s methodology note).** Found while investigating a
  user request to internationalize the sidebar: `nav.js` builds the entire sidebar (`<aside
  id="omega-side">`) and is real, complete, and correctly written (confirmed via
  `node --check` and reading it in full) — but `bg.js`'s module-injection block, which loads
  essentially every other `omega-*.js` file (~90 of them, plus `audio.js`/`i18n.js`/`theme.js`/
  `emblem.js`/`omega-controls.js`), never once requested `/nav.js`. Verified empirically, not
  just by grep: served the real repo over a local static server and drove real headless Chromium
  (Playwright) to `dashboard.html` — `#omega-side` had zero children after full page load, and
  the browser's actual network log confirmed `/nav.js` was never requested despite ~90 other
  local scripts loading successfully. Cross-checked the claim wasn't a fluke of one page: only
  7–9 of 169 pages carry their own explicit `<script src="/nav.js">` tag (a legacy pattern from
  before `bg.js` apparently lost this injection at some point); the other ~160 have the `<aside
  id="omega-side">` shell with nothing to render into it — meaning the primary navigation UI has
  been invisible on the large majority of this platform's pages, on every visit, for however long
  this regression has existed, without a single prior audit session (many of which did real
  browser/Playwright verification on other features) catching it. Fixed by adding `nav.js` to
  `bg.js`'s injection block, guarded against both the new `data-omega-nav` marker and the old bare
  `<script src="/nav.js">` form so the ~9 legacy pages don't render the sidebar twice. Re-verified
  with the same Chromium harness after the fix: `dashboard.html` (no own nav.js tag) now renders
  all 15 sidebar sections correctly; `cosmos.html` (has its own legacy tag) also renders correctly
  with exactly one `/nav.js` script tag present, not two. `python3 scripts/audit.py`: 0 critical,
  same 6 pre-existing warnings (checks 7/8, `sw.js` precache and manifest icons, were already
  correct — `sw.js` already precached `/nav.js`, it just was never being fetched by real page
  loads). No SQL/schema involved; pure client-side fix, live the moment it's deployed.
- **i18n coverage extended to the sidebar** (prompted by the same investigation above): `i18n.js`
  is a fully working, platform-wide-loaded translation engine (7 languages, correct RTL handling
  for Arabic, a working language-switcher dock in `omega-controls.js` that already correctly
  calls `OmegaI18n.translate()`) — but virtually no page markup carried `data-i18n` attributes,
  so switching languages changed almost nothing visible, even though the fix above means the
  sidebar now actually renders platform-wide. Added `data-i18n="nav_sec_<key>"` to all 15
  sidebar-section labels (both the desktop dock's tooltip headings and the mobile drawer's
  section headings in `nav.js`) and the matching 15 new dictionary entries (`nav_sec_command`
  through `nav_sec_media`) to `i18n.js`, across all 7 existing languages. Verified with the same
  Chromium harness: calling `OmegaI18n.translate('ar')` correctly set `dir="rtl"`/`lang="ar"` on
  `<html>` and replaced all 15 sidebar labels with their Arabic translations. This covers the
  single highest-leverage surface (present on every page) but is not full-platform coverage —
  translating the ~90 sub-navigation links and all in-page content remains a much larger,
  separate effort, intentionally out of scope here.
- **Sound-toggle dock button never actually controlled the audio engine — fixed, two bugs.**
  `audio.js`'s own header comment says it built `window.__omegaAudioToggle`/
  `window.__omegaAudioIsOn` specifically "for omega-controls.js's unified dock, so the SOUND
  toggle in one place actually starts/mutes this engine" — but `omega-controls.js`'s sound
  button never called either hook; it only toggled its own local flag, wrote to `localStorage`,
  and dispatched an `omega:sound` `CustomEvent` that nothing anywhere listens for (confirmed via
  grep). Separately, `audio.js` read its mute state from `omega_audio_muted`, a key the dock
  never wrote to (the dock uses `omega_sound`) — so even a correct call from the dock would have
  raced against a stale, disconnected flag. And the hook itself had a latent bug: it called
  `update()`, a function that only exists inside a different, disabled sibling function
  (`injectControl`, whose own visible button was deliberately turned off to avoid duplicating the
  dock) — calling `window.__omegaAudioToggle()` as intended would have thrown
  `ReferenceError: update is not defined`. Fixed all three: unified both files on the single
  `omega_sound` key, removed the dangling `update()` call, and wired the dock's click handler to
  actually call `__omegaAudioToggle()`. Verified with the Chromium harness by clicking the real
  dock button twice (not calling the function directly): first click starts the ambient engine
  and flips the label to "♪ ON", second click mutes it and flips to "♪ OFF", `localStorage`
  persists correctly, zero page errors either time. Also fixed a matching `zodiac_sign`→`sign`
  column-name bug in `omega-music.js` (same bug class as elsewhere in this file) found while
  reading the file for this — low-impact today since the surrounding `omega:user-loaded` event
  is documented above as rarely-fired, but correct now if that's ever wired up.
- **The `zodiac_sign`/`full_name`/`agent_name` wrong-property bug (previously fixed piecemeal in
  `omega-music.js`, `graph.html`, `nexus.html`, `sigma.html`, `omega-onboard.js`,
  `omega-export.js`) was still live in 18 more files — swept and fixed platform-wide.** Every
  prior fix of this exact bug class was found one file at a time, as a side effect of auditing
  something else; this pass instead grepped every `.js`/`.html` file directly for the three known-
  wrong property names (`.zodiac_sign`, `.full_name`, `.agent_name` — real columns are `sign`,
  `display_name`, `agent`) to find every remaining instance at once, rather than waiting to trip
  over the rest one by one. 7 of the 18 read a fresh, reliable `sb.from('profiles').select('*')`
  result every page load (`blockchain.html`, `character.html`, `cipher.html`, `credentials.html`,
  `horoscope.html`, `oracle.html`, `sigil.html`) — real, every-visit impact: a member's actual
  stored zodiac sign was never used, silently falling back to a generic or date-computed default
  instead, on every single page load. `profile.html` had one more instance in its share-card data
  (dead fallback only, `display_name` already checked first — dropped rather than renamed). The
  remaining 6 (`omega-ambient.js`, `omega-event-bus.js`, `omega-particles.js`, `omega-passport.js`,
  `omega-realm.js`, `omega-sigil-gen.js`) all read from the `omega:user-loaded` event's
  `e.detail.profile`, already documented above as rarely-fired — low practical impact today, fixed
  for correctness regardless. `omega-intelligence.js` and `omega-workflow.js` had the
  `agent_name`→`agent` variant. Two already-harmless instances (`news.html`, `realm.html`) had a
  correct fallback already earlier in the same `||` chain, masking the dead wrong-named one after
  it — cleaned up rather than left as confusing dead code. `signal.html`'s `repo.full_name` is a
  real, unrelated GitHub API response field (not a profile column) — confirmed and left untouched,
  not a false "fix." Also re-ran the write/read/RPC column-mismatch scanners from earlier in this
  file (all clean, confirming no regressions and no new instances of those bug classes) and the
  scanner behind the "26-instance module-boundary bug" fix (0 remaining; its 2 new hits were both
  false positives — `esc(...)` calls happening at template-string build time inside a module
  script, not literal runtime `onclick=` handlers). `node --check`-equivalent syntax validation on
  every touched file's inline `<script>` blocks; `scripts/audit.py` reconfirmed 0 critical / 6
  pre-existing warnings. No SQL/schema changes — pure client-side property-name fixes.
- **[Fixed — the most severe onboarding bug found in this repo's history] The 9-elements sign
  mapping was wrong in 13+ files, sometimes catastrophically, and `omega-onboard.js` — the live
  onboarding flow — assigned the wrong god and agent to 9 of 12 signs for every real new
  member.** Prompted by an explicit request to audit the 12-agent persona system for accuracy,
  not just wiring. Cross-referenced every sign→element and sign→god assignment in the repo
  against two independent, structured, canonical sources that already agreed with each other on
  all 12 signs — `omega-agents.json` (`by_sign`) and `omega-elements.json` (`elements[].members`,
  explicit "elements 1–5 map to the 12 signs" / "elements 6–8 are class-based, assigned, not
  sign-derived" structure) — rather than trusting whichever version was already most common in
  the code.
  - **The dominant `SIGN_ELEM` table, duplicated identically across 15 files** (`omega-ambient.js`,
    `omega-event-bus.js` ×2, `omega-music.js`, `omega-passport.js`, `omega-realm.js`,
    `omega-sigil-gen.js`, `cipher.html`, `nexus.html`, `oracle.html`, `realm.html`, `sigma.html`,
    `graph.html`'s own `SE`) had exactly 3 of 12 signs wrong: `Taurus:'Water'` (real: Metal),
    `Scorpio:'Soul'` (real: Water — and Soul is explicitly a class-based metaphysical element per
    `omega-elements.json`, never sign-derived at all, so this wasn't just the wrong element, it
    was a category error), `Aquarius:'Metal'` (real: Wind). Even `omega-copilot.js`'s own AI
    knowledge-base fallback answer already stated the correct mapping — the assistant would tell
    a member the right answer in chat, then contradict it on their own profile page. Fixed all 3
    values in all 15 files with a verified `sed` sweep (confirmed zero remaining instances after).
  - **`character.html`'s own `ELEMS` array — which `omega-particles.js`'s code comment explicitly
    (and incorrectly) claimed to "match" — was far more wrong: 9 of 12 signs, not 3.** It reads
    as the 9 elements cycled and wrapped in definition order (Fire→Water→Wind→Sand→Soul→Metal→
    Space→Void→TheAll) against the 12 signs in zodiac order, with no relationship to the actual
    canonical per-sign mapping at all — coincidentally correct only at Aries, Gemini, Pisces. The
    exact same wrapped sequence, independently reproduced, was also found in `horoscope.html`'s
    12 sign-reference cards (badges **and** the descriptive prose text — "Cancer... amplified by
    sand", "Leo... bearer of the soul element", "Capricorn... keeper of the first flame" — each
    rewritten to stay coherent with the corrected element, not just re-tagged) and in
    `cinema.html`'s 12 Olympian film cards (metadata tags only, no prose). `character.html` had
    the wrong sequence in *three* separate places internally — the `ELEMS`/`ELEM_IDS` arrays, a
    static reference `<table>`, and a per-sign `LORE_MAP` of flavor text — all three corrected;
    `horoscope.html` additionally had a fourth, JS-only duplicate (`SORACLES`) of the exact same
    original (wrong) prose, corrected to match.
  - **`omega-search.js`'s "OLYMPIANS" search-index section had the sign attached to the wrong
    god** for 4 of its 8 entries (`Apollo` tagged to Gemini instead of Leo, `Hermes` to Virgo
    instead of Gemini, `Poseidon` to Scorpio instead of Pisces, `Athena` to Libra instead of
    Virgo) — and was missing entries for the other 4 signs/gods (`Hera`/Libra, `Demeter`/Scorpio,
    `Hestia`/Capricorn, `Hephaestus`/Aquarius) entirely. Fixed the 4 misattributions and added the
    4 missing entries to complete the set to all 12. Its separate "ELEMENT METAL"/"ELEMENT SAND"
    entries had the same Virgo-miscategorization bug as the next item.
  - **Three files (`knowledge.html`, `graph.html`'s and `map.html`'s element legends) described
    Sand as a vague "boundary/cusp" concept and grouped Virgo under Metal instead** — a different,
    minority (3-file) framing that conflicts with the canonical structure, where Sand's sole
    member is Virgo specifically ("the universal amplifier — strengthens every element around
    it"), not an abstract transitional concept, and Metal's only members are Taurus/Capricorn.
    Corrected all three to the canonical framing. `cosmos.html`, `factions.html`, `profile.html`'s
    `EL_MAP`, and `omega-onboard.js` already had this right independently — confirms these 3 were
    the outliers, not the canon.
  - **`beacon.html`'s `SIGN_GOD` table had 5 of 12 gods wrong**, including two gods that aren't
    even part of the 12-agent pantheon at all — `Hades` (Scorpio) and `Dionysus` (Pisces) — neither
    appears anywhere in `omega-agents.json`. Corrected all 5 to the canonical roster.
  - **`omega-intelligence.js`'s sign→agent `MAP` had 6 of 12 agents shifted to the wrong sign**
    (e.g. `Beacon` attached to Gemini instead of Sagittarius, `Scout` to Sagittarius instead of
    Gemini) — a rotation-style error distinct from, but the same shape as, the god-table bugs
    above. Corrected to match `omega-agents.json`'s `by_sign` exactly.
  - **Highest-impact finding: `omega-onboard.js`'s live `ZODIAC_MAP`** — the actual data assigned
    to a real member's profile the moment they complete onboarding (already audited once this
    session for a field-*name* bug; this is a data-*accuracy* bug in the same table, found by
    checking content, not just wiring) — **had the wrong god and the wrong agent for 9 of its 12
    signs**, and the wrong element for Virgo specifically (`'metal'`, should be `'sand'`). Only
    Aries, Taurus, and Cancer were fully correct. Two tells confirmed this wasn't a one-off: `Ares`
    was assigned to both Aries *and* Sagittarius (a duplicate within the same 12-entry table, which
    can't be correct under a bijective sign↔god mapping), and `Dionysus` — again, not a real
    12-agent-pantheon god — was assigned to Pisces, the same non-canonical name found independently
    in `beacon.html`. Practical impact: since this table has been driving real onboarding (per the
    field-name fix earlier in this file), the large majority of new members choosing any sign other
    than Aries/Taurus/Cancer have been assigned an incorrect god and an incorrect agent persona at
    the moment they joined — which agent voices their copilot, which nav-section identity applies
    to them — a foundational identity error, not a cosmetic one. Fixed all 9 wrong entries plus
    Virgo's element to match `omega-agents.json` exactly, applied via a scripted find-replace after
    two direct-string-match `Edit` attempts failed silently on this file's literal `\uXXXX` glyph
    escapes (confirmed the exact on-disk byte sequence with `sed -n | cat -A` before retrying, not
    guessed).
  - **`profile.html`'s `BOUND` table assigned Virgo the token `'ARENITE'`** — the exact same token
    already reserved as the Founder's exclusive token (`ARENITE` = Aries = the platform owner, per
    `omega-onboard.js`'s own Aries entry and this file's earlier `OWNER` canonical-data note). A
    real token-uniqueness collision, not just a display bug. Fixed to `'VIRGITE'`, matching the
    name `omega-onboard.js` already uses for Virgo.
  - **Verification:** every SIGN_ELEM/SIGN_GOD/agent-map table in the repo re-scanned afterward
    for internal duplicate-god check (a same-table god appearing twice is definitionally wrong
    under a 1:1 sign↔god mapping) — zero remaining. `node --check`-equivalent syntax validation on
    every touched file's inline `<script>` blocks (23 files total across this entry);
    `scripts/audit.py` reconfirmed 0 critical / 6 pre-existing warnings throughout. No SQL/schema
    changes anywhere in this entry — every fix is static content or client-side JS data.
- **The 6 pre-existing `scripts/audit.py` warnings: made the tool itself precise about which
  parts are real risk vs. harmless noise, and closed a real doc gap the warnings pointed at —
  without touching the live database, which none of these 6 can be *fully* resolved without.**
  Each of the 6 was checked individually rather than left as an undifferentiated count:
  - **Warning 1 (47 duplicate table definitions)** — `audit.py` only counted *how many* files
    define each table, not whether those definitions actually differ. Added full-body comparison:
    of the 47, **37 are byte-identical copy-paste** across chunk/bootstrap files (zero
    live-behavior risk — `CREATE TABLE IF NOT EXISTS` makes re-running any of them a no-op) and
    only **10 genuinely conflict** (`dispatches`, `marketplace_listings`, `family_nodes`,
    `consult_requests`, `commission_contracts`, `media_reservations`, `publications`,
    `task_completions`, `user_dedication`, `interest_signals` — real risk, still needs a
    per-table live-schema check before consolidating, per §5's existing rule; not done here, no
    live DB access this session). `audit.py` now reports the split so a reader isn't stuck
    triaging 47 undifferentiated entries to find the 10 that matter.
  - **Warning 2 (DROP TABLE/SCHEMA in 3 files)** — all 3 (`chunk_07_migrations.sql`,
    `migration_runner.sql`, `omega_dispatch_reset.sql`) turned out to be the same single
    statement (`DROP TABLE IF EXISTS public.dispatches CASCADE`), already self-documented in
    `omega_dispatch_reset.sql`'s own header as an *optional*, conditional cleanup utility
    ("run this ONLY if... loses nothing but old announcements", no member data). `audit.py` now
    detects an "OPTIONAL"/"ONLY IF" guard comment near a DROP and reports it as a lower-severity
    note instead of lumping it in with an undocumented, unguarded DROP — the two are materially
    different risk levels and were previously indistinguishable in the output.
  - **Warning 3 (`SYD-OMEGA-Legal-IP-Brief.docx` "unreachable but deployed")** — `audit.py` now
    cross-references `.vercelignore` and confirms this file *is* covered by its `*.docx` pattern
    — it's committed to git (real minor hygiene debt, still open, see §8's LFS note below) but was
    already confirmed never actually served by Vercel. The warning previously read as more urgent
    than it is; it now says so explicitly instead of requiring a reader to go check `.vercelignore`
    by hand each time.
  - **Warning 4 (3.7 MB `.mp4` in deploy root)** — same underlying debt as warning 3 (binary
    committed directly to git, no LFS). Did not attempt a Git LFS migration: converting
    already-committed history to LFS pointers (`git lfs migrate import`) rewrites every commit
    touching the file and requires a force-push — a hard-to-reverse operation this file's own
    safety rules require explicit user confirmation for, and `git-lfs` isn't installed in this
    session's environment to even test the migration end-to-end. Left as documented, open debt;
    ask the user before attempting.
  - **Warning 5 (`transactions`/`wallet_balances` tables missing)** — left alone on purpose, not
    an oversight: per this file's own earlier §8 entry, these are a deliberate, already-decided
    dormant/pending-legal-review state (`subscriptions.html`'s own copy says as much), and
    creating live payment/token tables here would be exactly the "ship a monetizable feature
    without gating it first" mistake §9 exists to prevent. `audit.py`'s existing message already
    cross-references this; no change needed beyond confirming that judgment still holds.
  - **Warning 6 (11 client-called RPCs with diverging definitions across the SQL bag)** —
    the actual root cause, found while investigating this: **`RUN_ORDER.md` is referenced by name
    as the authoritative migration-ordering guide from six different `.sql` comments in
    `supabase/`** (`targeted_fix.sql`, `omega_stats_repair.sql`, `runner_chunk_05.sql`,
    `chunk_08_migrations.sql`, `migration_runner.sql`, `omega_governance.sql`) — **but the file
    never existed.** `REPOSITORY_AUDIT.md` §6 already recorded finding this once, but only fixed
    the symptom (a dead link to it in `roadmap.html`), not the actual missing file the SQL
    comments depend on for real operational guidance. Created `supabase/RUN_ORDER.md`: documents
    the real two-layer apply order (base bootstrap, then every `*_fix.sql`/`*_repair.sql` file
    applied *after* it, since `CREATE OR REPLACE FUNCTION` has no "skip me, I'm already correct"
    guard and whichever file runs last silently wins — the exact mechanism behind the
    `apply_subscription`/`complete_task` incidents earlier in this file) and explicitly defers to
    this file's own §8 for live-application status per fix, so the two documents don't duplicate
    (and drift out of sync with) each other. Also improved `audit.py`'s check 8 output to flag,
    per diverging RPC, which of its definitions looks canonical by this repo's own established
    `*_fix.sql` naming convention — 6 of the 11 (`apply_subscription`, `check_trial_status`,
    `complete_task`, `expire_trial`, `my_lattice`/`my_matrix`, `recall_ai_context`) now resolve to
    an likely-correct file at a glance; the remaining 4 (`get_all_members`, `my_subscription`,
    `order_stats`, `public_leaderboard`) have no matching fix file yet and still need a live
    `pg_proc` query to resolve safely — the Supabase MCP connector available in this environment
    is not yet authorized for this session (needs the user to run `claude mcp`/`/mcp`); offered,
    not done, since guessing at a live schema is exactly the mistake this file's own history
    warns against.
  All 6 raw warning conditions are still real and still present in `scripts/audit.py`'s summary
  count (6) — none of them can be *fully* resolved from source alone, by this file's own
  standing rule (verify against the live DB before consolidating/deleting). What changed is that
  the tool itself, and the repo's own internal documentation, now make clear which parts of each
  warning are real risk vs. already-understood, low-risk noise — and one genuine doc gap
  (`RUN_ORDER.md`) is closed. `python3 -m py_compile scripts/audit.py` and a full re-run
  (0 critical / 6 warnings, same as baseline, output verified more precise not just longer) both
  confirmed clean.
- **`bg.js`'s skeleton-shimmer engine forced a 40px height on every `[data-loading]`/`.kpi-val`
  element, unconditionally, regardless of the element's real size — fixed.** Found while finishing
  the `data-loading` rollout from `FEATURE_IDEAS.md` #17: `applySkel()`'s
  `if(el.offsetHeight<8)el.style.minHeight='40px'` check runs at `DOMContentLoaded`, which is
  always *before* the approval guard reveals `#app`/`.shell`/`main.main` (§3) — so every candidate
  element reads `offsetHeight:0` at check time no matter how it's actually styled, and the 40px
  fallback fires on all of them, always, not just genuinely undersized ones. Harmless for the 36
  content-block containers fixed first (40px is a reasonable skeleton height for a list/table
  block), but would have been a guaranteed defect — not a risk, a certainty — for the platform's
  smaller status labels and badges (e.g. `matrix.html`'s `#badge-status`, `profile.html`'s
  `#sg-*-sub` fields): each would have rendered as an oversized 40px bar in place of a 9–15px
  label, no matter what size the page itself intended. Confirmed by direct measurement in headless
  Chromium before and after (an inline `min-height` set on the element had zero effect pre-fix,
  since the forced assignment always ran regardless), not assumed from reading the code. Fixed by
  changing the check to `if(!el.style.minHeight&&el.offsetHeight<8)el.style.minHeight='40px'` — an
  element that already declares its own inline `min-height` keeps it; the 40px fallback now only
  applies when nothing more specific was set, which is exactly the original 36 containers'
  behavior, unchanged (re-verified: `feed.html #feed-list` still resolves to `min-height:40px`
  after the fix). This is a platform-wide fix, live the moment `bg.js` deploys — not specific to
  the 20 label elements that prompted finding it. See `FEATURE_IDEAS.md` #17 for the full
  before/after measurements and the per-element sizing decisions this fix unblocked.
- **Stored-XSS sweep, round 2: one more real instance found and fixed (`beacon.html`), the rest of
  the self-editable-field surface confirmed already safe.** Continuing from the `approvals.html`/
  `profile.html` fix above, checked every other self-updatable `profiles` column
  (`display_name`, `sign`, `nationality`, `profession`, `bio`, `avatar_url` — the full list from
  `omega_profile_fields.sql`'s self-update column allowlist) against every place it's rendered:
  - `beacon.html` — `pr.display_name`/`pr.sign`/`pr.element` were concatenated straight into
    `#h-sub`'s `.innerHTML` with no escaping. Lower severity than the `approvals.html` case (`pr`
    here is always the *viewer's own* profile — `.eq('id',sess.user.id)` — so this is self-XSS, a
    member can only inject into their own browser, not the owner's or another member's), but
    still a real bug worth fixing on its own terms, and for consistency with the established
    `esc()` convention. Fixed by adding the same `esc()` helper already used identically in
    `contracts.html`/`dashboard.html`/`approvals.html` and wrapping the three rendered fields —
    `sign` is escaped only where it's *displayed* (`<b>`+esc(sign)+`</b>`), not where it's used as
    an object key (`GLY[sign]`), since escaping a lookup key would silently break the glyph lookup
    for signs containing `<>&` (none do today, but the lookup and the display use are different
    operations and only one of them is a rendering sink).
  - `nationality`/`profession` — confirmed via repo-wide grep that neither is read/rendered
    anywhere at all, on any page. Self-updatable but currently invisible; no XSS surface exists
    for either today. Left alone — nothing to fix, and adding display UI for them is a feature
    decision, not a bug fix.
  - `avatar_url` — only consumer is `profile.html:2170`,
    `ph.style.backgroundImage='url('+d.avatar_url+')'`. This goes through the CSSOM property
    setter (`element.style.backgroundImage=`), not string-based `innerHTML`/`style=` attribute
    injection — modern browsers parse this as a single CSS `<image>` value and don't execute
    `javascript:` URIs or arbitrary markup through it (that was a legacy IE-only vector). Not a
    script-injection risk; left as-is.
  - `display_name`/`email` elsewhere: every other file that renders `display_name` (`credentials.html`,
    `graph.html`, `identity.html`, `leaderboard.html`, `matrix.html`, `nexus.html`, `oracle.html`,
    `rune.html`, `sigma.html`, `tribe.html`, `omega-user.js`) does so via `.textContent`/
    `.createTextNode` (browser-auto-escaped, safe by construction) rather than `.innerHTML`, or
    only ever reads the *viewer's own* profile for a non-DOM purpose (a Canvas `fillText()` call in
    `omega-share-card.js`, which draws pixels and cannot execute markup, and an AI-prompt string in
    `omega-copilot.js`). `chatbot.html`'s `a.name` looked like a hit but is a different, static
    field entirely — the `omega-agents.json` persona roster, not member data.
  - **Also checked the widest-reach public surface on the platform** — `public.activity_feed`,
    read by the platform-wide ticker (`omega-live.js`'s `[data-live-ticker]`, loaded on every page)
    and `dashboard.html`'s timeline, both fed from a table where `"member manages own feed" ON
    public.activity_feed FOR ALL USING(user_id=auth.uid())` lets any member insert an arbitrary
    `title`/`body` visible to literally every member and the owner (`is_public=true` rows are
    world-readable). This is the single highest-value target checked in this sweep — an unescaped
    render here would reach every user's browser, not just the owner's or the poster's own. Both
    real consumers already call `esc()` before inserting into `.innerHTML`
    (`dashboard.html:871`, `omega-live.js`'s ticker) or use `.textContent`
    (`omega-realtime.js`'s ticker) — already safe, nothing to fix. A third reader
    (`omega-intelligence.js`'s `get_recent_activity` AI-tool handler) passes the raw title into a
    Claude prompt as tool-result context rather than rendering it directly; tracing whether a
    malicious title could survive being echoed back through an LLM response and then land
    unescaped in the chat UI is a multi-hop, low-probability chain, not a direct rendering sink —
    noted, not chased further in this pass.
  Verified: `node --check` on `beacon.html`'s script block; `scripts/audit.py` reconfirmed
  0 critical / 6 pre-existing warnings.
- **First pass on the "text is too small" feedback: 22 shared UI-chrome font-sizes bumped in
  `bg.js`'s v3/GVP design-system block, since that one file is what reaches every page.** Prompted
  by external usability feedback that the platform is "beautiful but difficult to read." Grepped
  every `font-size:` declaration in `bg.js` (the reusable class layer, not one-off inline styles
  elsewhere in the same file, which are a larger, separate sweep left undone) and found the
  monospace "label" tier — `.kpi-l`/`:where(.kpi-label)`/`.tbl-hcell` — set as low as 7px, and
  `.bar-lbl`/`.chip`/`.tab-btn`/`.lf span` at 7.5px, well under any reasonable UI-text floor.
  Bumped the label tier to 10px, the secondary-label tier to 10.5px, and the
  component-header/body tier (`.card-title`, `:where(.card-title)`, `.sechead`, `.btn`,
  `.loading-msg`, `.trend`, `.skip-link`, `button:not([class])`) to 11px — narrowed
  `.sechead`/`.btn`'s letter-spacing slightly (4px→3px, 2px→1.5px) so the larger glyphs don't
  visually crowd at the same tracking. `.tbl-row`/`:where(.card-body)`/`.bar-val` (11px body/data
  text) bumped to 12–13px. Two additional, distinct bugs found in the same sweep: (1) `.inp` (the
  v3 fallback and the GVP glass-form-control layer, which also skins every genuinely unclassed
  `input`/`textarea`/`select`) was 11px — below the 16px threshold at which iOS Safari
  auto-zooms the viewport on focus, a real, previously-undocumented mobile-usability bug, not
  just a size preference; fixed to 16px. (2) the mobile breakpoint's `.tab-btn` was 7px — smaller
  than the 7.5px desktop base, a regression on the exact devices where tap targets and legibility
  matter most; fixed to 10.5px alongside the desktop value. Every replacement was applied via an
  exact-string-match script that aborted on any count mismatch (none occurred — all 22 landed
  cleanly, single-line minified string, verified before writing). `node --check bg.js` and
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged) both clean.
  Verified live in headless Chromium (not just read from source): rendered `dashboard.html` and
  confirmed `getComputedStyle` on `.kpi-l`/`.lf span`/`.sechead` reflects the new values;
  rendered `exam.html` (a page with no page-local `.tab-btn` override) and confirmed `.tab-btn`
  computes to 10.5px, proving the shared-file fix actually reaches a real page. **Found but
  deliberately not fixed in this pass**: `design-system.html` (and others, e.g. `academy.html`,
  `gaming.html`) still shows `.tab-btn` at the old 7.5px because the page defines its own
  page-local `.tab-btn{font-size:7.5px...}` rule that shadows the shared one — the same
  page-local-class-drift pattern already documented at length in §4.1's Ω-GVP `.card` sweep
  (230+ page-local classes found there). Sweeping every page-local duplicate of these specific
  selectors is a much larger, separate effort (that section's sweep alone took a dedicated
  scanner pass) and out of scope here; this entry only fixes the single shared source of truth.
  No SQL/schema changes — pure client-side CSS, live the moment `bg.js` deploys. Still open,
  larger readability work per the original feedback (not attempted this pass): a real typography
  token scale (`--fs-*` custom properties instead of hardcoded per-selector px values), the
  dozens of one-off inline `font-size:7-9px` styles elsewhere in `bg.js` (trial-timer/genesis
  screen/toast), and the page-local duplicate sweep just described.
- **The page-local `.tab-btn`/`.card-title` sweep flagged above: done.** Grepped every `.html`
  page for a local `.tab-btn{...}` or `.card-title{...}` rule (36 and 12 pages respectively) and
  found every single one was under the new shared-floor values — `.tab-btn` ranged 6.5–9px
  across the 36 pages, `.card-title` was `.65rem` (≈10.4px) on 9 of the 12 and a bare `8px` on
  the other 2 (`ops.html`, `pulse.html`; `media.html`'s `.85rem`/13.6px was already above the
  floor and left untouched). Unlike the `.card` sweep in §4.1, none of these were byte-identical
  duplicates safe to delete outright — every page's local rule carries its own padding/border/
  color choices (icon-tab layouts in `cosmos.html`/`vault.html`, purple-accented tabs in
  `series.html`/`trailers.html`, a vertical `flex:1` tab bar in `profile.html`, a notification
  `.tab-btn .badge` counter in `approvals.html`) — deleting the rule would have thrown all of
  that away, not just the font-size. Fixed narrowly instead: bumped only the `font-size` (and
  nudged `letter-spacing` down slightly where it was 2px, so the larger glyphs don't crowd) in
  each page's own rule, to the same 10.5px `.tab-btn` / 11px `.card-title` floor the shared
  `bg.js` values now use — everything else about each page's local styling (padding, borders,
  colors, layout) is untouched. Two sub-selectors needed separate handling for the same reason
  they're the actual visible text: `cosmos.html`'s `.tab-btn .tb-label` (8px→10.5px, the real
  label on its icon+label vertical tabs) and `approvals.html`'s `.tab-btn .badge` (6px→8.5px, a
  numeric pending-count badge — bumped less than the main floor since it's a 1–2 digit counter,
  not prose, matching this file's own precedent of treating badges/dots as a distinct, smaller
  tier). 47 files touched, 48 replacements (one page, `vault.html`, only needed the base rule).
  Every replacement was applied via the same exact-string-match-with-count-check method as the
  original `bg.js` fix (abort on any mismatch — none occurred). Verified: `node --check`-equivalent
  syntax validation on every touched page's inline non-module `<script>` blocks (0 failures);
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged); headless Chromium
  spot-check on 6 of the 47 pages, including `design-system.html` specifically (the page called
  out above as still showing the old value) — `getComputedStyle` now reads 10.5px/11px on all 6,
  zero page errors. No SQL/schema changes.
- **Asked directly to close the remaining 6 `scripts/audit.py` warnings this session — still
  open. Each is blocked on something only the user can provide, not on more analysis, and
  forcing any of them through anyway would repeat the exact mistake this file's own history
  (§8, throughout) exists to warn against: guessing at live state instead of checking it.**
  Re-examined the per-warning breakdown above against what this specific session can actually
  do:
  - **Warning 1 (47 duplicate table definitions, 10 genuinely conflicting)** and **warning 6
    (11 diverging RPC definitions)** both need a live `pg_proc`/`information_schema` query
    against the real production database before touching any file, per §5's own standing rule —
    this is the identical class of mistake behind the `apply_subscription`/`complete_task`/
    `task_completions` incidents already documented in this file, all caused by trusting which
    SQL-bag definition *looked* canonical instead of checking what was actually live. The
    Supabase MCP connector exists in this environment but is flagged as requiring authorization
    this session doesn't have — it's a non-interactive session, so it cannot complete an OAuth
    flow itself; the user needs to authorize it via `claude mcp` or `/mcp` in an interactive
    session first. Consolidating even the 37 byte-identical duplicates without that check was
    considered and declined: this repo's chunk files are applied "manually/in sequence" (§2),
    and deleting a redundant `CREATE TABLE IF NOT EXISTS` from one file is only actually
    risk-free if every real-world run order still creates that table before any file that
    depends on it runs — not something verifiable from source alone, matching the previous
    session's identical call on the same question.
  - **Warning 4 (3.7MB `.mp4` committed to git, no LFS)** — a real fix means `git lfs migrate
    import`, which rewrites every historical commit touching the file and requires a
    force-push to publish. That combination (history rewrite + force-push) needs explicit user
    confirmation before being attempted at all, regardless of how broadly it's requested in
    aggregate. **Asked directly; user chose to leave it** — the file is already excluded from
    the live Vercel deploy via `.vercelignore` (confirmed earlier in this file), so this is
    hygiene debt only, not a functional bug, and the destructive rewrite isn't worth it for
    that. No change made; the warning stays open by design, not by oversight.
  - **Warning 5 (`transactions`/`wallet_balances` tables missing)** isn't a bug — it's a
    deliberate, already-recorded decision (this same section, above) to keep payment/token
    infrastructure dormant pending legal review, which is §9's rule against shipping
    monetizable features live without an explicit gating decision working exactly as intended.
    "Solving" this warning means reversing that decision and building live payment/token-balance
    tables — a product/legal call, not an engineering one. **Asked directly; user chose to keep
    it dormant** — the original reasoning (unusually sensitive data, real schema-design
    commitment that's hard to walk back once member data lives there, this repo's own history of
    real RLS bugs) stands. No change made; the warning stays open by design.
  - **Warnings 2 (guarded `DROP TABLE`) and 3 (`.docx` excluded via `.vercelignore`)** need no
    further action — both were already fully investigated and correctly categorized as
    low-risk/documented-only in the entry above. They still count toward `scripts/audit.py`'s
    warning total by design (the check reports "not tracked automatically," not "unsafe"), which
    is why the total is unchanged — not because anything about them is actually unresolved.
  No files were touched for this entry beyond this note. Editing schema files or rewriting git
  history on a guess, just to make the warning count read 0, would trade a real (if
  low-severity) known-unknown for an unverified claim of "fixed" — exactly the kind of claim
  this file's own rule (§9, "never mark something fixed... unless it actually was") exists to
  prevent.
- **[Fixed] `approvals.html`'s and `profile.html`'s member-management action buttons violated
  this file's own "never show a success state without checking the write's actual result first"
  rule — found by a fresh, automated repo-wide audit pass (not by re-reading prior entries in
  this file) that (a) rebuilt a table→known-columns dictionary from every `supabase/*.sql` file
  from scratch and diffed it against every `.from().select()/.insert()/.update()/.upsert()` call
  in every `.html`/`.js` file, and (b) grepped every `.insert(`/`.update(`/`.upsert(` call site
  for a nearby `.error` check. The column-mismatch pass (the bug class behind the large majority
  of this file's prior entries) came back clean except for `map.html`'s already-known,
  deliberately-unfixed `lat`/`lon`/`country`/`gate` reference — independent confirmation that
  that bug class really is fully resolved elsewhere in this repo, not just documented as such.
  The missing-`.error`-check pass found two real, live instances that had escaped every prior
  session's manual review:
  - `approvals.html`'s `approve()`/`grantPermanent()`/`extend()`/`reject()`/`revoke()` — each
    tries a `SECURITY DEFINER` RPC first (`approve_member`/`grant_permanent_access`/
    `extend_trial`/`reject_member`/`revoke_member`) and falls back to a raw
    `sb.from('profiles').update(...)` only if the RPC call fails — but the fallback's own result
    was never checked, so every one of these 5 buttons showed its success toast ("✓ TRIAL
    GRANTED", "∞ PERMANENT ACCESS GRANTED", etc.) unconditionally, even on a page that is the
    single highest-privilege admin surface in the app. All 5 RPCs are documented above as fixed
    and live, so this doesn't reproduce on every click today — but the fallback path exists
    specifically for when an RPC call fails (network issue, a future regression, a permissions
    edge case), and exactly then is when it would have silently lied to the owner about whether
    access was actually granted or revoked. Fixed by capturing the fallback update's `.error` and
    only showing the success toast when either the RPC or the fallback update actually succeeded;
    a real failure now shows an explicit "COULD NOT ___ — try again" toast instead.
  - `profile.html` has its own, separate, second member-approval panel (`grantAccess()`/
    `revokeAccess()`, distinct from `approvals.html`) with the same shape of bug but no RPC
    fallback at all — it went straight to `sb.from('profiles').update(...)` with no error check
    and no user-facing feedback either way, just an unconditional `loadMembers()` refresh
    afterward. Fixed by checking `.error` and alerting on failure before refreshing, matching the
    convention this file documents as already used correctly elsewhere in this same file
    (`social.html`, `family.html`).
  Verified with `python3 scripts/check-inline-js.py` (both files' inline scripts still parse) and
  `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged — this is a
  client-side control-flow fix only, no new `.from()`/`.rpc()` call sites). Not yet applied to a
  live database because there is nothing to apply — no SQL changed.
- **Missing test coverage — closed for the two Python scripts that gate CI, `scripts/audit.py`
  and `scripts/check-inline-js.py`.** Neither had any test coverage before this session; a
  regression in either script's own regex/parsing logic (e.g. a pattern that quietly stops
  matching) would let CI keep reporting green while no longer actually checking what its own
  name claims to check — the exact failure mode both scripts exist to catch in the rest of the
  codebase, just one level up. Added `scripts/tests/test_check_inline_js.py` (13 tests, importing
  `check-inline-js.py` directly via `importlib` since its two real functions — `is_module()`,
  `check_block()` — are unit-testable in isolation) and `scripts/tests/test_audit.py` (12 tests).
  `audit.py` itself is a top-level script with no functions (it always resolves its own `ROOT`
  from `__file__` and `chdir()`s there), so it can't be `import`ed against a fixture directly;
  its tests instead build small throwaway repo fixtures on disk, copy the real `audit.py` into
  `<fixture>/scripts/audit.py` so its own `ROOT` resolution lands on the fixture, and run it as a
  subprocess the same way CI does, asserting on exit code and report text — black-box, but
  testing the actual gate CI runs rather than a refactored stand-in for it. Coverage spans both
  scripts' real behavior, not just their happy path: module-graph critical-vs-warning split,
  RLS-missing critical, identical-vs-conflicting duplicate table bodies, missing
  table/RPC-divergence warnings (including that an RPC nobody calls yet is correctly out of
  scope for the diverging-RPC check), and inline-script pass/fail/module-detection cases. Found
  and fixed one small real bug in `check-inline-js.py` while writing its tests: `main()` opened
  every page with a bare `open(page,...).read()` and never closed the handle (a `ResourceWarning`
  surfaced immediately under `unittest`) — changed to a `with` block; no behavior change, just no
  longer leaking a file descriptor per page across a ~250-page run. Wired both suites into CI as
  a new, blocking `.github/workflows/ci.yml` step ("Audit tooling self-tests", `python3 -m
  unittest discover -s scripts/tests`) placed right after the two scripts it tests, matching this
  repo's existing "gate between commit and production" philosophy for `ci.yml` — a broken audit
  script is exactly the kind of regression that philosophy exists to catch, and until now nothing
  did. All 25 tests pass locally; the full local CI-equivalent sequence (JS syntax, inline-script
  syntax, `audit.py`, the new self-tests, broken-asset scan, service-role-key scan, `sw.js`
  precache check, manifest icon check) was re-run end-to-end afterward and is unchanged (0
  critical / 6 pre-existing warnings).
- **`.nvmrc` bumped from `20.11.0` to `20.20.2`** (latest `20.x` LTS patch at the time of this
  session, confirmed via the npm registry's `node` version listing) — CI resolves its Node
  version from this file (`actions/setup-node` with `node-version-file: .nvmrc`), so every run
  had been provisioning a Node patch release over a year old. Same major/minor line as
  `package.json`'s own `"engines": {"node": ">=20.11.0"}` floor, so this doesn't change the
  minimum supported version, only which patch CI actually runs — a pure patch bump on a
  no-build-step static site has no code path that could regress from it. `eslint@8`/`prettier@3`
  in `ci.yml` are invoked via `npx --yes` (not pinned in a lockfile), so they already resolve to
  the latest release on their pinned major (`8.67.0`/`3.9.6` at time of writing) on every run —
  nothing to bump there.
- **GitHub connector used to check real repository state before auditing from assumptions
  alone**: `list_issues` (0 open), the Actions API (`list_workflow_runs` on `ci.yml` — last 30
  runs across `main` and the taxonomy branch all `completed`/`success`, confirming CI is
  genuinely green right now, not just believed to be), and `pull_request_read`. Direct PR listing
  (`list_pull_requests`) returned a 403 from this session's GitHub App installation scope; this
  wasn't pursued further since the Actions run history already confirmed the same "nothing
  currently broken" signal from a different angle. The Supabase MCP connector is configured for
  this repo but requires an interactive OAuth authorization this non-interactive session cannot
  complete — live-schema verification for the still-open items above (§5's 10 conflicting
  duplicate tables, §8's 11 diverging RPC definitions) remains blocked on the user running
  `claude mcp`/`/mcp` to authorize it, same as every prior session's note on this.
- **Supabase MCP connector was authorized this session — but connects to a different project
  than production, and that distinction matters for everything below.** `list_projects` returns
  exactly one project: `nvgedlxlkdzvcelimbvq` ("supabase-cinereous-planet", created
  2026-08-15, `us-east-1`) — not `ydqhzvvoyufiiqvzcjns`, the ref hardcoded in `profile.html`/
  `approvals.html`/`trophies.html`/`vault.html` and referenced throughout this file as live
  production. The schema matches this repo's exactly (table names, several column shapes line
  up with specific migration files), but `profiles` had zero rows and almost no data anywhere
  except catalog/config tables — not what a live platform with approved members looks like.
  Read as a scratch/staging copy seeded by running a specific, incomplete subset of the SQL bag
  against a fresh instance, consistent with this file's own standing caution that the
  `migrations/` sequence was validated exactly this way. Every fix below was applied to
  `nvgedlxlkdzvcelimbvq` and independently verified there — **not yet applied to
  `ydqhzvvoyufiiqvzcjns`**, since this session has no access to that project. Given how closely
  several of the bugs found this way matched this file's own prior predictions for production
  (see below), treat these as strong leads for production, not as proof of production's current
  state.
  - **`grant_trial_access(uuid)` had zero authorization checks — live, exploitable, most severe
    finding of this pass.** Any authenticated member could call
    `sb.rpc('grant_trial_access',{p_uid: their_own_id})` from the browser console and grant
    themselves trial access, bypassing the entire approval queue — this repo's own
    `0003_privilege_lockdown.sql` describes exactly this exploit, but that file (and
    `0005_trial_917.sql`, which separately fixes the trial duration — the live function granted
    `550.302` seconds, not `557`) had never actually been applied here. Fixed by applying both:
    `omega_is_owner()` + an audit table + a real owner-only check on `grant_trial_access` (and
    confirmed `grant_permanent_access` was already correctly gated — only `grant_trial_access`
    was open). `expire_trial` was deliberately left untouched: it was already correctly
    authorized (self-or-owner) here, just with a broader reset scope (also wipes
    `evolution_events`/`trophies`/`medals`/`certificates`, not just `task_completions`) than
    `0003`'s version — overwriting it would have been an unrequested behavior change smuggled in
    under a security fix, not a security fix itself.
  - **`check_trial_status` had two incompatible live-candidate definitions** (`TABLE(...)` of 6
    columns vs. a `jsonb` blob, from `0005_trial_917.sql` and `trial_fix.sql` respectively) and
    didn't exist at all yet on this project. Resolved by checking the actual caller —
    `omega-chronometer.js` calls `sb.rpc("check_trial_status")` with zero arguments, which only
    the `0005_trial_917.sql` version supports (`p_uid uuid DEFAULT auth.uid()`) — not by
    guessing from file-naming convention. Installed that version, plus `has_active_access()` so
    an expired trial is denied server-side even if the browser never reports it, plus
    `trial_duration()` as the single source of truth for `557`.
  - **`my_matrix()`/`my_lattice()`/`authority_score()`/`lattice_node()`** — applied
    `0075_targeted_fix.sql` (fixes `my_matrix()`'s return-type change and seeds the
    `platform_settings` authority constants); all were previously undefined or broken here.
  - **New finding, not in any prior session's list: `get_all_members()`, `order_stats()`, and
    `public_leaderboard()` each computed "authority" with their own inline
    `sqrt(a²+b²+c²)` formula (max ≈15.59) instead of calling `authority_score()`** (the cubic
    `sqrt(a³+b³+c³)×φ/e` formula every other surface uses, max `27.8367` — this file's own
    documented APEX constant). A member's authority number differed depending on which page
    displayed it. Fixed by pointing all three at `public.authority_score()`.
  - **8 tables had RLS fully disabled**, flagged critical by Supabase's own advisor:
    `conversations`, `messages`, `security_policies`, `knowledge_nodes`, `knowledge_edges`,
    `rate_limits`, `circuit_breakers`, `content_versions`. Applied
    `supabase/migrations/0086_rls_missing_tables.sql` verbatim (already written, idempotent,
    correctly scoped per table — member-owns-own for `conversations`/`messages` via
    `conversations.user_id`, authenticated-read/owner-write for the knowledge graph, owner-only
    for the infra tables — this file already existed complete and correct in the repo; it had
    simply never been applied. Verified afterward: every one of the 8 shows `rls_enabled: true`
    with 1–2 real policies each, not a blind lockout.
  - **`consult_requests` was missing a `domain` column that `consultancy.html`'s real booking
    form (`consultancy.html:157`) has always sent** (`{domain, contact, preferred_time, brief}`)
    — every submission would fail with "column domain does not exist" on this project. Verified
    against the actual client `.insert()` call, not assumed from a SQL comment; fixed with a
    single non-destructive `ADD COLUMN IF NOT EXISTS domain text`.
  - **`record_interest_signal()`/`my_interest_profile()` didn't exist on this project at all**,
    so `omega-recommend.js`'s signal-recording calls would fail outright. Initially misread as
    "`omega_interest_graph.sql` is the stale file" from this project's schema alone (it only has
    `entreprise_schema_v2.sql`'s `recorded_at`/`track_id`/`session_id` shape) — corrected before
    touching anything by cross-checking this file's own §8 GDPR-export entry, which already
    verified on real production that `record_interest_signal()`'s live signature matches
    `omega-recommend.js` exactly and that `interest_signals` selects on `created_at` "were
    already correct." `omega_interest_graph.sql` is therefore the production-verified file, not
    a stale duplicate — it's also already defensively written to coexist with
    `entreprise_schema_v2.sql`'s shape (`ADD COLUMN IF NOT EXISTS created_at`, never removes
    `recorded_at`/`track_id`/`session_id`). Applied it as-is; this project was just missing it.
  - **The "10 conflicting duplicate tables" from §5 turned out to be mostly a false-alarm from
    text-diffing, once actually compared against live columns.** Wrote a scanner comparing every
    `CREATE TABLE` body for these 10 tables against this project's real
    `information_schema.columns`. 7 of 10 (`commission_contracts`, `family_nodes`,
    `marketplace_listings`, `media_reservations`, `publications`, `dispatches`,
    `user_dedication`) had no real conflict at all — every file's definition either exactly
    matched live (just reordered columns, which `audit.py`'s raw-text comparison can't tell
    apart from a real difference) or was a harmless historical subset. `user_dedication`'s
    flagged divergence was a bug in this session's own comparison script, not the repo — it
    mis-parsed a trailing `UNIQUE(user_id, date)` table constraint as a fake column. Of the
    remaining 3 (`interest_signals`, `consult_requests`, `task_completions`), none needed a repo
    file edit: `interest_signals` and `consult_requests` were live-database gaps (fixed above,
    see entries above), and `matrix_engine.sql`'s extra `metadata` column on `task_completions`
    turned out to be moot — the table already exists here, so its `CREATE TABLE IF NOT EXISTS`
    is a no-op and `metadata` is never added; its RLS policies and `get_my_task_log()` were
    already live from elsewhere. No source files were edited this pass — every fix was a live
    Supabase change, verified against real client call sites rather than guessed from file
    conventions, per this session's own standing instruction to keep everything real rather than
    conceptual.
- **Production access (`ydqhzvvoyufiiqvzcjns`) was authorized later this same session — and
  verifying against it, rather than blindly replaying the scratch-project fixes above, mattered.**
  `list_projects` still only returns the scratch project, but `get_project('ydqhzvvoyufiiqvzcjns')`
  succeeds directly — real project, org `vztvuckpdsoriyvpdkzx`, name "sydomega", created
  2026-06-14, genuinely live (190+ tables, real row counts: 9 `profiles`, 24 each of
  `certificates`/`trophies`/`medals`, 69 `sovereign_points_ledger` rows, 3,304 `client_errors`
  rows, `daily_engagement` actively populated). Checked every fix from the scratch-project pass
  above against this real database before touching anything, per this session's own standing
  rule about not guessing at live state:
  - **Everything from the scratch-project pass was already applied here — in several cases in a
    more advanced form.** `apply_subscription`/`complete_task`/`check_trial_status`/
    `omega_is_owner`/`my_matrix`/`my_lattice`/`authority_score`/`lattice_node`, all 8
    RLS-disabled tables (now correctly enabled with real policies, confirmed via `list_tables`
    showing zero critical advisory), `consult_requests.domain`, and
    `record_interest_signal()`/`my_interest_profile()` all already exist correctly. `ai_memory`/
    `recall_ai_context()` — the one thing explicitly skipped on the scratch project for a missing
    dependency — already exist here too.
  - **`grant_trial_access()` uses a materially different, more sophisticated design than
    `0005_trial_917.sql`'s, found only by reading the actual live function body rather than
    trusting a matching return-type signature.** Production's version doesn't set
    `trial_expires_at` at grant time at all — it records `trial_granted_at` and leaves the clock
    unstarted until the member calls `start_trial_countdown()` for the first time (idempotent;
    never extends). This is `supabase/migrations/0084_chronometers.sql`
    ("APPROVAL WINDOW... starts when the member RECEIVES the approval confirmation, not when the
    owner clicks grant"), already fully live — the same file's Part 2 (`daily_engagement`,
    `engagement_heartbeat()`, `engagement_pause()`, `engagement_report()` — a
    heartbeat-with-capped-credit design specifically to stop a client from faking a full day of
    the 33,437s daily engagement obligation) is live too, confirmed by `daily_engagement` holding
    9 real rows. Applying the scratch project's `0005_trial_917.sql`-based `grant_trial_access`
    here would have been a real regression, not a fix — caught before applying anything by
    checking the actual function body, not just its signature.
  - **One genuine, low-impact inconsistency found and fixed**: `my_matrix()`/`my_lattice()`
    still called the older `authority_score(a,b,c)` (no owner special-case) while
    `get_all_members()`/`order_stats()`/`public_leaderboard()` already called the newer
    `compute_authority(a,b,c,is_owner)` (returns exactly `27.8367` for the owner regardless of
    literal axis values). No visible bug today — the owner's axes are always pinned at `9,9,9`,
    and `authority_score(9,9,9)` already rounds to the identical `27.8367` — but two functions
    computing the platform's one "authority" concept differently is the same inconsistency class
    already fixed elsewhere this session. Consolidated both onto `compute_authority()`. Verified:
    `compute_authority(9,9,9,true)` and `compute_authority(9,9,9,false)` both correctly return
    `27.8367`.
  - This closes the "blocked on live Supabase access" note attached to several items above and
    in earlier sessions' entries — production schema/RPC state for the areas checked this session
    is now confirmed, not assumed.
- **Found and fixed a real bug the "10 conflicting duplicate tables" warning had been masking:
  three standalone files defined an incompatible primary-key type that a byte/column-name
  comparison alone can't see.** Asked to clean up the duplicate tables, re-examined the 3 flagged
  files (`family_nodes.sql`, `dispatches.sql`, `publications.sql`) that a prior pass in this same
  session had marked "harmless, just reordered/subset columns" — that comparison only checked
  column *names*, not types, and missed that all three define their primary key as `id bigint
  generated always as identity`, while every other definition of these tables anywhere in the
  repo (`omega_master_deploy.sql`, `chunk_02a_migrations.sql`, `migration_runner.sql`,
  `omega_backend_sync.sql`, and their `migrations/` mirrors) uses `id uuid DEFAULT
  gen_random_uuid()` — the type every RLS policy, foreign key, and client-side call site in this
  codebase assumes. `CREATE TABLE IF NOT EXISTS` only checks whether the table exists, not
  whether its shape matches, so whichever file's version happened to run first would win
  permanently — if one of these three ran before `omega_master_deploy.sql` on a fresh bootstrap
  (a real risk: only 9 of 116 files in the flat `supabase/*.sql` bag are numerically ordered, so
  nothing enforces `omega_master_deploy.sql` running first there), the table would end up with a
  `bigint` primary key incompatible with the rest of the schema.
  - **Why this couldn't happen on a real deploy today, and why it was still worth fixing.** The
    `migrations/` folder has numbered mirrors of the same three files (`0037_dispatches.sql`,
    `0038_family_nodes.sql`, `0052_publications.sql`) with the identical `bigint` definition —
    confirmed by reading them directly, not assumed from the flat-bag copy. But because
    `migrations/0001_omega_master_deploy.sql` always applies first in that numbered sequence, the
    correct `uuid` table is always created before these files run, and their own `CREATE TABLE IF
    NOT EXISTS` correctly no-ops. That's exactly why CLAUDE.md's earlier note that "all 94
    migration files apply cleanly end-to-end" holds despite this landmine existing — order
    protects the `migrations/` sequence but nothing protects the flat bag.
  - **Fix scope, deliberately narrow**: deleted only the three flat-bag files
    (`supabase/family_nodes.sql`, `supabase/dispatches.sql`, `supabase/publications.sql`) — single
    -purpose, standalone, nothing else in them. Left the `migrations/` mirrors untouched (removing
    a file from that numbered sequence is a different, riskier kind of change than removing a
    redundant unordered one, and per §5 the flat bag — not `migrations/` — is "the source of
    truth for new schema changes"). Checked for dangling references first: only
    `GAP_ANALYSIS.md`'s historical write-up of the `dispatches` "wire insert" RLS-policy finding
    cites `supabase/dispatches.sql` by name, alongside `chunk_06_migrations.sql` for the same
    finding — an audit-trail citation of what was found, not a live dependency, so left as-is
    rather than edited.
  - **`marketplace_listings.sql` and `dedication_table.sql`** (the other two single-purpose
    duplicate files among the 10 flagged tables) were checked and deliberately left alone:
    both correctly use `id uuid`, so neither carries the type-incompatibility risk above.
    `marketplace_listings.sql` is a genuinely incomplete subset (no `user_id`, no `file_path`) that
    self-heals via `ADD COLUMN IF NOT EXISTS` elsewhere regardless of run order — harmless, not
    just apparently so. `dedication_table.sql` is not fully redundant with
    `chunk_09_new_features.sql`'s version: it additionally grants the owner a `FOR SELECT`
    visibility policy on every member's `user_dedication` row that the other file's single
    member-only `FOR ALL` policy doesn't provide — deleting it would have been a real capability
    regression, not a cleanup.
  - Verified: `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged — file
    count 116→113, and `dispatches`/`family_nodes`/`publications` each show one fewer distinct
    definition in the conflicting-tables list, confirming the removal registered without breaking
    anything else); `python3 -m unittest discover -s scripts/tests` (25/25 pass);
    `python3 scripts/check-inline-js.py` clean. No live database touched for this entry — pure
    repo-file cleanup.
- **The "11 diverging RPC definitions" warning (§8's original list, first raised as blocked-on-
  live-access many sessions ago) is now fully closed — all 11 confirmed against real production,
  not the scratch project, not source-file heuristics.** Between this session's production
  verification pass and this entry, every one of the 11 has a confirmed, evidence-cited answer:
  `apply_subscription`, `check_trial_status`, `complete_task`, `my_lattice`, `my_matrix`,
  `get_all_members`, `order_stats`, `public_leaderboard` — all already correct live (the last
  three via `compute_authority()`, `my_lattice`/`my_matrix` fixed this session to match).
  `expire_trial` — live version differs from the repo's fix file but is independently correctly
  authorized (self-or-owner), a legitimate alternate implementation, not a bug. `my_subscription`
  — read in full, all column/function dependencies check out clean, nothing to fix.
  `recall_ai_context` — confirmed via `pg_get_functiondef()` that the live body matches
  `omega_ai_memory_recall_fix.sql` (checks `expires_at`) exactly, not the older unfixed
  `omega_ai_memory.sql` body — the fix-file naming heuristic was correct here.
- **`omega_advertisements_insert_fix.sql` — the one item still marked "not yet applied to the
  live database" anywhere in this file — applied and verified.** Queried `pg_policies` on
  `public.advertisements` before applying and confirmed the gap exactly as described: only
  `owner_manage_ads` (owner-only) and `read_approved_ads` (SELECT) existed, no INSERT policy for
  a non-owner member, despite `chunk_06_migrations.sql` already granting `INSERT` to
  `authenticated` and `advertising.html`'s `submitAd()` already sending exactly the shape the fix
  expects. Applied via `apply_migration`; re-queried and confirmed `"member submits own ad"`
  (`FOR INSERT`, `WITH CHECK (submitted_by = auth.uid())`) now exists. Matching local migration
  file added at `supabase/migrations/20260817233805_omega_advertisements_insert_fix.sql`, and the
  source file's own header updated from "Not yet applied" to reflect this.
- **Two other entries above (`user_assets`, `notifications`) had a header line reading "action
  needed" that contradicted their own body text, which already said "Applied to the live database
  and verified."** Corrected both headers to match — stale labels like this are exactly the kind
  of thing that makes a real fix look like an open item to a future reader skimming section
  headers rather than reading the full entry. No functional change, just accuracy.
- **What's left genuinely open in this file, for a future session**: the two tables this file has
  already deliberately decided to leave dormant (`transactions`, `wallet_balances` — token/payment
  infrastructure gated behind an explicit product decision, not a bug), the two hygiene items the
  user explicitly chose to leave as-is when asked directly (`.mp4`/`.docx` Git LFS migration), and
  and `ops.html`'s never-built event-bus metrics container. (The native-`<table>` conversion this
  bullet used to list as open is **done** — a repo-wide grep now finds zero `<table>` elements —
  and the ARIA-semantics gap that conversion left behind is now fixed too; see §8. The
  page-local `.tab-btn`/`.card-title` font-size sweep referenced by an earlier draft of this bullet
  is NOT open — it was completed in the entry above titled "The page-local `.tab-btn`/`.card-title`
  sweep flagged above: done." This bullet was stale on that one point; corrected here rather than
  left to mislead a future reader skimming this list, matching this file's own rule against stale
  cross-references.) None of the items actually remaining above are bugs masquerading as done —
  each already has an explicit, evidence-cited reason it's open on purpose.
- **[Fixed — highest-severity finding of this session] `public.pending_access_requests` granted
  every signed-in member direct read access to every other user's raw `auth.users` data — Supabase's
  own security advisor (`get_advisors(type='security')` against production, 2 ERROR / 212 WARN /
  83 INFO) flagged this as both its ERROR-level findings at once.** The view (from
  `supabase/0004_signup_pipeline.sql` / `supabase/migrations/0081_signup_pipeline.sql`) joins
  `auth.users` directly — `email`, `signed_up_at`, `email_confirmed_at`, `last_sign_in_at` — and the
  file's own `grant select on public.pending_access_requests to authenticated;` line meant any
  signed-in account, approved or not, owner or not, could call
  `sb.from('pending_access_requests').select('*')` directly from the browser (the anon/publishable
  key is public, no UI needed) and read every user's email and sign-in history — completely
  bypassing the owner-gated `get_pending_requests()` RPC that the same file's own comment already
  called "the safe accessor; prefer it in the UI." Confirmed the grant was real and live via
  `aclexplode(c.relacl)` joined against `pg_roles` — `information_schema.role_table_grants`
  misleadingly returned empty for this view, so don't trust that view alone for ACL checks.
  Confirmed via repo-wide grep that no client `.html`/`.js` file references the view directly (only
  `get_pending_requests()` and diagnostic SQL files do), so revoking client access breaks nothing.
  **Applied to the live database and verified** (2026-08-17, via the Supabase MCP connector) —
  `REVOKE SELECT ON public.pending_access_requests FROM authenticated;` applied via `apply_migration`
  (recorded remotely as `20260817234540_revoke_pending_access_requests_select_from_authenticated`,
  mirrored locally at `supabase/migrations/20260817234540_revoke_...sql` per this repo's established
  timestamp-versioned-file convention); a follow-up `aclexplode` query confirmed only the implicit
  table-owner role (`postgres`) retains SELECT. Also fixed the two source files so a future full
  re-apply of `0004_signup_pipeline.sql`/`migrations/0081_signup_pipeline.sql` doesn't regrant the
  same hole: replaced the `grant select ... to authenticated` line with an explicit
  `revoke all ... from public, anon, authenticated` and a comment explaining why, in both files.
  Not yet triaged: the other 295 advisor findings (83 `rls_enabled_no_policy`, 32
  `function_search_path_mutable`, 179 combined `security_definer_function_executable` counts, 1
  `auth_leaked_password_protection`) — all WARN/INFO severity, none as immediately exploitable as
  this ERROR-level auth-data leak, left for a follow-up pass rather than rushed through in the same
  session as this fix.
- **[Fixed — follow-up security-advisor pass] 70 SECURITY DEFINER functions were anon-callable
  despite their own source files showing narrower intent, and 32 more had a mutable search_path —
  both hardened; 83 unrelated dormant scaffold tables and 1 Auth config toggle deliberately left
  open.** Continuing the triage from the `pending_access_requests` fix above,
  `get_advisors(type='security')` still showed 212 WARN + 83 INFO across 5 categories:
  `anon_security_definer_function_executable` (84), `authenticated_security_definer_function_executable`
  (95), `rls_enabled_no_policy` (83, INFO), `function_search_path_mutable` (32),
  `auth_leaked_password_protection` (1).
  - **Root cause of the 84 anon-executable functions**: Postgres grants `EXECUTE` to `PUBLIC`
    automatically on `CREATE FUNCTION`. Every one of these functions' own source file already
    carries an explicit `GRANT EXECUTE ... TO authenticated` (or, for 2, `TO service_role` only)
    showing clear, narrower intent — but no file ever revokes the default `PUBLIC` grant first, so
    the explicit `GRANT` was decorative and `anon` kept access regardless. Same bug shape as
    `omega_advertisements_insert_fix.sql`'s finding ("a GRANT without a matching restriction is
    toothless"), inverted: here a narrowing GRANT was defeated by a wider one nobody revoked.
    Cross-referenced every one of the 84 against a full repo-wide scan of every `GRANT EXECUTE`/
    `REVOKE` statement in `supabase/*.sql` before touching anything, sorting into: 59
    explicitly-authenticated-only, 9 with no explicit grant anywhere (trigger functions/internal
    helpers — `handle_new_user`, `sync_platform_owner`, `trg_award_*`, etc. — not directly callable
    outside their trigger context), 2 explicitly `service_role`-only
    (`compute_leaderboard_snapshot`, `record_health_metric`), and 14 deliberately left alone because
    they're genuinely meant to be public (`order_stats` — confirmed live in `hall.html` as a
    signed-out-visitor stats widget; `public_leaderboard`, `get_platform_flag`, `is_platform_owner`)
    or already internally self-guard regardless of grant (`approve_member`, `grant_permanent_access`,
    `reject_member`, `revoke_member`, `complete_task`, `log_evolution`, `record_interest_signal`,
    `report_client_error`, `apply_subscription` — each checks `is_platform_owner()`/`auth.uid()`
    internally before doing anything).
  - Read the actual function bodies for the two `service_role`-only functions before fixing, since
    an anon-callable function with zero internal guard and a real side effect is the genuinely
    dangerous case: `record_health_metric` (`supabase/slo_monitoring.sql`) writes straight into
    `slo_metrics`/`error_budget_policy` with no caller-identity check at all — an anonymous caller
    could have spoofed arbitrary good/bad request counts for any surface, poisoning the owner's own
    SRE/error-budget dashboard (data-integrity attack, not data exposure); `compute_leaderboard_snapshot`
    (`supabase/entreprise_schema_v2.sql`) does a full-table upsert across every approved profile plus
    a global rank recompute with no guard — anon could trigger it on demand as a minor
    resource-exhaustion vector. Both were always meant to be `service_role`-only per their own
    source file.
  - Applied `REVOKE EXECUTE ... FROM PUBLIC` on all 70 (plus an explicit additional
    `REVOKE ... FROM authenticated` on the 2 `service_role`-only ones, since no client — signed in
    or not — should call those). Verified post-apply via `has_function_privilege()`: `extend_trial`
    and `get_capability_health` now `anon=false, authenticated=true` (real owner call paths in
    `approvals.html` unaffected); `record_health_metric`/`compute_leaderboard_snapshot` now
    `anon=false, authenticated=false`; `order_stats` and `approve_member` correctly still
    `anon=true, authenticated=true`, unchanged. `get_advisors` re-run afterward confirmed
    `anon_security_definer_function_executable` dropped 84→14 (exactly the 70 revoked) and
    `authenticated_security_definer_function_executable` dropped 95→84 (exactly the 9 no-grant +
    2 service-role-only functions, which never had a *direct* `authenticated` grant either — only
    the `PUBLIC` default both categories inherited from).
  - **`function_search_path_mutable` (32 functions)**: a mutable `search_path` on a `SECURITY
    DEFINER` function is a real privilege-escalation vector — a caller-influenced `search_path`
    could redirect an unqualified table/function reference inside the function body to a
    same-named object the caller controls. Pinned `SET search_path = public` on all 32 (all
    functions this repo's own history has already verified correct/live — `approve_member`,
    `extend_trial`, `authority_score`/`compute_authority`, etc. — pure hardening, no behavior
    change).
  - **`rls_enabled_no_policy` (83 tables, INFO) — deliberately NOT fixed.** Grepped every one of
    the 83 table names against every file in `supabase/*.sql`: 81 appear NOWHERE in this repo's own
    schema source at all; the 2 partial hits (`news`, `payments`) were unrelated substring matches
    in other files' comments/table names, not real definitions. The 83 read as an unrelated,
    generic multi-tenant SaaS scaffold (academy/LMS, AI workspace, billing, marketplace,
    project/task management, team/org, calendar, knowledge base, workflow engine, etc.) that exists
    live on production but was never created by anything in this repo — confirmed empty (0 rows) on
    every table sampled except `news` (1 row). RLS enabled with zero policies is already the *safe*
    state (total lockout for every non-owner role, including anon and authenticated) — not a live
    exposure, so no urgency, and per this file's own standing rule against guessing: inventing RLS
    policies for schema this repo doesn't know the purpose or intended access model of would be
    fabricating behavior, not fixing a bug. Left open for a human decision on whether this scaffold
    should be dropped, adopted, or left dormant.
  - **`auth_leaked_password_protection` (1, WARN) — deliberately NOT fixed.** This is a Supabase
    Auth-service config toggle (checks new/changed passwords against HaveIBeenPwned), not a SQL
    object — it's set via the Supabase dashboard (Authentication → Policies) or the Management API,
    neither of which `apply_migration`/`execute_sql` can reach. Left open for the user to enable
    directly.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818000551_revoke_anon_execute_and_harden_search_path`, mirrored
    locally at `supabase/migrations/20260818000551_...sql`.
- **First pass on `get_advisors(type='performance')` (never checked in this repo's history before
  this session — only `type='security'` had been triaged): 1 category fixed, 4 deliberately
  deferred with an evidence-based reason each.** 779 findings across 5 categories:
  `multiple_permissive_policies` (434, WARN), `auth_rls_initplan` (132, WARN), `unused_index`
  (126, INFO), `unindexed_foreign_keys` (85, INFO), `duplicate_index` (2, WARN). Cross-referenced
  every finding's affected table against the 83-table unrelated scaffold schema documented above
  first, to separate real signal from scaffold noise: most findings are on this repo's real,
  actively-used schema, not the scaffold (`multiple_permissive_policies`: 424/434 real;
  `auth_rls_initplan`: 128/132 real; `unused_index`: 75/126 real; `unindexed_foreign_keys`:
  24/85 real; `duplicate_index`: 2/2 real).
  - **`duplicate_index` (2) — fixed.** Verified via `pg_indexes.indexdef`/`pg_constraint` (not
    the advisor's name-only detail text) before touching anything: `public.medals` had
    `medals_user_medal_unique` (backs a real UNIQUE CONSTRAINT, `pg_constraint.contype='u'`) and
    `medals_user_num_uniq` (same index definition, but a plain redundant index, not a
    constraint) — kept the constraint-backed one, since dropping it would need `ALTER TABLE ...
    DROP CONSTRAINT`, not `DROP INDEX`, and would remove a real data-integrity guarantee, not
    just a redundant lookup structure. `public.notifications` had `idx_notifications_user` and
    `notifications_user_id_idx`, both plain non-constraint indexes on `(user_id)`, identical —
    kept one, dropped the other. Applied via `apply_migration`
    (`20260818001352_drop_duplicate_indexes`), mirrored locally, verified afterward via
    `pg_indexes` that the constraint-backed/kept indexes both still exist and the redundant ones
    are gone.
  - **`multiple_permissive_policies` (424 real) and `auth_rls_initplan` (128 real) — deliberately
    NOT bulk-fixed.** Read a sample finding in full first rather than assume from the category
    name: e.g. `public.activity_feed` has 2 permissive SELECT policies for `anon`
    ("member manages own feed", "members see public feed") — these are two *intentionally
    different* access rules that both legitimately apply to the same role/action (own rows OR
    public rows), not accidental duplicates; Supabase's own description calls this
    "suboptimal for performance," not incorrect. Consolidating 424 of these safely means reading
    each table's exact policy semantics and merging the USING/WITH CHECK logic with an OR by
    hand, at real risk of silently changing access behavior if any single merge gets the boolean
    logic wrong — and this repo's own history (§8, throughout) is largely a record of exactly
    that class of RLS mistake, made worse by bulk/rushed changes. `auth_rls_initplan` (wrapping
    `auth.uid()` in policies as `(select auth.uid())` so it's evaluated once per query instead of
    once per row) is lower-risk since it's a pure rewrite with no semantic change, but still means
    precisely reproducing 128 existing policies' full USING/WITH CHECK clauses one at a time — a
    real, scoped follow-up task, not a same-session bulk edit. Both are pure performance
    (query-planner cost), not correctness or security, so there's no urgency forcing a rushed
    pass. Left open for a dedicated follow-up session with room to verify each table individually.
  - **`unused_index` (75 real) and `unindexed_foreign_keys` (24 real) — deliberately NOT
    bulk-fixed.** Both are INFO-level and lower-priority than the WARN items above.
    `unused_index` requires confidence an index is genuinely dead (not just unused during
    Supabase's own observation window) before dropping — wrong on even one could silently
    reintroduce a slow query path. `unindexed_foreign_keys` (adding indexes) is lower-risk to
    apply than dropping, but still needs a per-table check of query patterns to prioritize
    correctly rather than blindly index all 24. Left open alongside the two WARN categories above
    for the same follow-up pass.
  - **Not yet checked**: whether any of the 653 real-schema findings across the 4 deferred
    categories overlap with tables already flagged as having genuinely conflicting duplicate
    definitions elsewhere in this file (§5's 10-table list) — if so, resolving the duplicate-
    definition question first would likely resolve some `multiple_permissive_policies` findings
    as a side effect, rather than as two separate efforts.
- **[Fixed — RLS-policy follow-up, explicitly requested] `auth_rls_initplan` (132 real findings)
  fully resolved; 15 of the 424 `multiple_permissive_policies` findings resolved as genuine
  byte-identical duplicates, the other 409 deliberately left as still-open, judgment-requiring
  work.** Continuing from the `duplicate_index` fix above at the user's explicit request to keep
  going on the RLS-policy consolidation.
  - **`auth_rls_initplan` (132/132 fixed)** — every policy in `public.*` whose `USING`/`WITH
    CHECK` expression called a bare `auth.uid()`/`auth.role()` (confirmed via a full
    `regexp_matches` scan that no other `auth.<fn>()` call exists anywhere in this schema's
    policies) was rewritten to `(select auth.uid())`/`(select auth.role())`, letting Postgres
    evaluate the call once per query instead of once per row — pure performance, zero
    access-control change (spot-checked before running: `is_platform_owner()` calls in the same
    expressions were correctly left untouched, since the regex only ever matches `auth.*`).
    Applied as a `DO` block that dynamically finds and fixes every matching policy (not a
    hardcoded list), so it's naturally idempotent. Verified 0 remaining afterward — the first
    verification attempt falsely showed "132 remaining" because Postgres re-pretty-prints
    `(select auth.uid())` as `( SELECT auth.uid() AS uid)` on storage and the case-sensitive
    check was looking for lowercase `select`; caught by spot-checking one policy's actual stored
    definition directly rather than trusting the aggregate count, then corrected the verification
    query to be case-insensitive.
  - **15 true duplicate pairs dropped.** Dumped all 223 policies in `public.*` via `pg_policies`,
    grouped by (table, cmd, role), and normalized each qual/with_check (handling OR-clause and
    equality-operand reordering) to separate genuine duplicates from policies that only
    superficially look similar. Found 15 pairs that are byte-identical, not just
    logic-equivalent — re-verified each by eye against the raw text before touching anything
    (e.g. `messages`' two `ALL`-policies both read, word for word, `EXISTS (SELECT 1 FROM
    conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid()))`
    under two different names: `member manages own messages` and `messages_owner_all`). Same root
    cause as the duplicate-table-definition problem documented throughout this file — two
    `supabase/*.sql` files each independently defined the same table and added their own copy of
    the same policy under a different name — here surfacing as a literal runtime RLS duplicate,
    not just a source-file one. Dropped the less-descriptive name from each pair, kept the other;
    verified afterward that all 15 dropped names return 0 rows and every one of the 14 affected
    tables still has ≥1 policy (no accidental total lockout).
  - **The other ~409 `multiple_permissive_policies` findings — deliberately still NOT touched.**
    Sampled one (`activity_feed`'s two `SELECT` policies for `anon`, `"member manages own feed"`
    and `"members see public feed"`) and confirmed these are genuinely different rules (own rows
    OR public rows) that Supabase's linter correctly calls "suboptimal for performance," not
    incorrect — merging them means precisely reproducing each table's exact boolean logic as a
    single OR'd policy by hand, at real risk of subtly changing access behavior if any one merge
    gets it wrong, across roughly 66+ tables' worth of policies. This remains genuinely open,
    judgment-requiring, per-table work — not attempted in this pass, consistent with the original
    reasoning in the entry above for deferring it.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818002535_wrap_auth_uid_calls_in_rls_policies` and
    `20260818002831_drop_redundant_duplicate_rls_policies`, both mirrored locally under
    `supabase/migrations/`.
- **[Fixed — second RLS-consolidation pass] 15 more `multiple_permissive_policies` findings
  resolved, dropping the count 254→209.** Continuing the follow-up at explicit request ("keep
  going on the remaining 254"). Re-dumped all 208 live permissive policies fresh (post the first
  merge pass) and grouped by `(table, cmd, exact roles array)` — not just "same role name," the
  literal array, so a `{public}` (all-roles) policy is never conflated with a same-named
  `{authenticated}`-only one even though they overlap for authenticated callers. Any group with
  2+ policies sharing the *exact* same role scope is safe to OR-merge by construction: Postgres
  already evaluates multiple permissive policies for the same role as an OR of all of them, so
  merging just makes that explicit as one physical policy instead of two — zero access-control
  change. Groups whose role scopes differed even slightly were left alone, same caution as every
  prior pass.
  - Found 15 such groups (30 individual policies → 15 merged): `ai_memory`, `contribution_log`
    (×2: INSERT, SELECT), `conversations`, `expert_bookings`, `interest_signals`,
    `marketplace_listings`, `medals`, `media_reservations`, `publications`, `sovereign_events`,
    `task_completions`, `user_dedication`, `user_journeys`, `workflow_executions`. Generated the
    merge SQL programmatically (not hand-written per table) to eliminate transcription risk,
    verified no new policy name collided with an existing one on its table before applying.
  - Verified post-apply: every merged `(table, cmd)` shows exactly 1 policy where it showed 2
    before; every affected table confirmed to still have policies covering every command it had
    before (no accidental total lockout on any action). `get_advisors` re-run afterward confirmed
    `multiple_permissive_policies` dropped 254→209 — a larger drop than 15 since several merged
    groups were on commands the advisor counts per underlying CRUD action, same pattern as the
    first merge pass. `unused_index` (125) and `unindexed_foreign_keys` (85) unchanged, as
    expected for untouched categories.
  - The remaining 209 are the same category as before: genuinely different access rules that
    happen to share a role/action (or share a role/action only partially, e.g. one `{public}`
    policy overlapping one `{authenticated}` policy for the same command) — still needs per-table
    judgment, not a mechanical merge. Applied to the live database and verified (2026-08-18, via
    the Supabase MCP connector), recorded remotely as
    `20260818063011_merge_second_pass_duplicate_role_scoped_rls_policies`, mirrored locally at
    `supabase/migrations/`.
- **[Fixed — third RLS-consolidation pass] 9 more `multiple_permissive_policies` findings
  resolved by dropping outright (not merging), 209→171.** Continuing the follow-up at explicit
  request ("keep going on the remaining 209"). This pass targeted a different, more common shape
  than the first two: a table with a `FOR ALL` policy *plus* a separate command-specific policy
  (e.g. `FOR SELECT`) whose condition is fully implied by the ALL policy's own condition for that
  command — since `FOR ALL` already covers every command, the specific policy adds nothing.
  - Detected programmatically, not by eye: for every table with exactly one `FOR ALL` policy,
    checked every other policy on that table whose role scope is a subset of (or equal to) the
    ALL policy's role scope, normalizing both conditions into OR-clause sets (handling equality-
    operand reordering, same technique as the earlier duplicate-detection passes) and confirming
    the specific policy's clause set is a subset of the ALL policy's — meaning the specific policy
    can never grant access the ALL policy doesn't already grant for that role+command. Verified
    the detector correctly *excludes* real non-redundant cases: `activity_feed`'s ALL policy
    ("own rows") plus its separate SELECT policy ("public rows OR own rows") was correctly left
    alone, since the SELECT policy's `is_public = true` clause isn't present in the ALL policy's
    condition — that pair stays two policies on purpose, same as this file's standing example.
  - 9 found and dropped, several byte-identical to their table's ALL condition, not just
    logically implied: `commission_contracts`, `consent_records`, `consult_requests`,
    `data_lineage`, `error_budget_policy`, `media_reservations`, `publications`, `slo_metrics`,
    `threat_events`.
  - Verified post-apply: every affected table's `FOR ALL` policy remains intact, and every command
    the dropped policy covered is still covered by the surviving ALL policy — no lockout on any
    action. `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped
    209→171 (again a larger drop than 9, since several affected policies were `{public}`-scoped,
    which the advisor's per-role reporting counts against every role that inherits from `public`
    — `anon`, `authenticated`, and Supabase's internal roles alike — not just the two member-facing
    ones).
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818064201_drop_policies_redundant_vs_all_policy`, mirrored locally
    at `supabase/migrations/`.
- **[Fixed — fourth RLS-consolidation pass, real bug found and fixed in the detector itself]
  28 more `multiple_permissive_policies` findings resolved by dropping, 171→123.** Continuing
  the follow-up at explicit request. Before running the same "redundant-vs-ALL-policy" pattern
  again, re-derived the detector script from scratch rather than assuming the previous pass's
  logic was complete — and found it had a real bug: `split_top_or()` only split an expression on
  `OR` at bracket-depth 0, but several ALL-policy conditions are wrapped in an *extra* pair of
  parens around the whole OR expression (e.g. `((auth.uid()=user_id) OR is_platform_owner())`),
  pushing the actual `OR` to depth 1 and hiding it from the splitter — so the previous pass's
  detector silently treated these as a single opaque clause instead of two ORed ones. This was a
  false-negative bug (missed real, safe redundancies), not a false-positive one — nothing unsafe
  was ever proposed by the buggy version, it just found fewer of the safe cases than actually
  existed. Confirmed the fix by hand against `certificates` before trusting it: its "own
  certificates read"/"cert_self" policies (`auth.uid()=user_id`) should have been recognized as
  implied by `certificates_own`'s `auth.uid()=user_id OR is_platform_owner()` and weren't, under
  the old code; the fixed version correctly detects the subset relationship.
  - Re-ran the fixed detector across every table and found **38 total candidates** — 9 were the
    same ones already dropped in the previous pass (expected, confirms continuity), leaving 28
    new ones across `certificates`, `commission_contracts`, `consult_requests`,
    `contribution_log`, `dispatches`, `evolution_events`, `family_nodes`, `media_reservations`,
    `publications`, `task_completions`, `trophies`.
  - Notable: 2 of the 28 (`contribution_log_insert_merged`, `contribution_log_select_merged`)
    were themselves created by the second consolidation pass earlier in this session — they
    turned out to be fully redundant against `contribution_log_own`'s own `FOR ALL` policy once
    correctly detected. Not a contradiction of that earlier fix, a natural continuation: the
    second pass correctly merged two same-role-scope duplicates into one policy; this pass then
    correctly noticed that merged policy was itself redundant against a *third*, broader ALL
    policy on the same table that the second pass wasn't checking against.
  - Verified post-apply: every affected table's `FOR ALL` policy remains, and every command the
    dropped policies covered is still covered by it — no lockouts (re-checked per-table,
    per-command policy counts before and after, same method as every prior pass in this section).
    `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped 171→123 —
    a 72% reduction from the original 434 across all four passes combined, all verified, zero
    access-control changes throughout.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818065025_drop_more_policies_redundant_vs_all_policy`, mirrored
    locally at `supabase/migrations/`.
- **[Fixed — fifth RLS-consolidation pass, resolves the prior blocker] The `FOR ALL`/`WITH
  CHECK`-default question is answered; 5 tables restructured into single-purpose per-command
  policies, fully clearing them from `multiple_permissive_policies` (123→98).** Continuing the
  "slow, per-table" approach the user explicitly chose over further bulk passes. Resolved the
  open question blocking the "collapse ALL + specific policies into single-purpose per-command
  policies" technique — whether a `FOR ALL` policy with only `USING` (no explicit `WITH CHECK`)
  implicitly reuses `USING` for `WITH CHECK` on INSERT/UPDATE, or defaults to unrestricted
  (`WITH CHECK (true)`) — empirically, against a real throwaway table/role on this project (a
  documentation lookup wasn't possible: the sandbox's egress policy blocks
  `www.postgresql.org`, and Supabase's own docs search gave an inconclusive answer for this
  specific `FOR ALL` case). A `FOR ALL USING(owner_flag = true)` policy with no explicit `WITH
  CHECK` correctly **rejected** an INSERT violating that condition (SQLSTATE 42501) — confirming
  `USING` is reused as `WITH CHECK`, not defaulted to permissive. (First attempt failed on
  `permission denied to set role` — the migration role, `postgres`, was never granted membership
  in the throwaway test role, a prerequisite for `SET LOCAL ROLE`; fixed by granting it first.
  The failed attempt's own transaction rolled back atomically — reconfirmed via a follow-up
  count query showing 0 rows for every object it tried to create — so nothing unsafe from it
  persisted.) The 3 successful diagnostic `apply_migration` calls used to reach this answer each
  landed a real, but content-free, row in the remote migration-tracking table with no matching
  local file; removed via a follow-up migration
  (`20260818072124_remove_throwaway_test_migration_records.sql`) rather than left as tracking-
  history noise with nothing to point to.
  - **5 tables** (`capability_registry`, `data_domains`, `data_entities`, `knowledge_edges`,
    `knowledge_nodes`) previously flagged as a proven-but-unapplied fix (dropping a genuine
    byte-duplicate `{authenticated}`-scoped `FOR SELECT USING(true)` policy, redundant against a
    coexisting `{public}`-scoped `FOR SELECT USING(auth.uid() IS NOT NULL)` policy — for the
    `authenticated` role specifically, that condition is always true). Applied first
    (`20260818072250`), verified each table left with exactly 1 SELECT policy (was 2). This
    alone did **not** clear the tables from the advisor, though — re-checked live rather than
    assumed, and found each table still carried a real, additive overlap: the same
    `{public}`-scoped `FOR SELECT` policy plus a `{public}`-scoped `FOR ALL USING
    (is_platform_owner())` owner policy, both permissive and both applying to `SELECT` for every
    role — genuinely additive (owner gets full access via ALL; any authenticated user gets read
    via the narrower SELECT policy), not a redundancy, so correctly untouched by every prior
    pass's redundancy-only detectors.
  - Restructured each table's 2 remaining policies into 4 single-purpose ones (`<table>_select`
    = `is_platform_owner() OR auth.uid() IS NOT NULL`; `<table>_owner_insert`/`_owner_update`/
    `_owner_delete` = owner-only, explicit `WITH CHECK` on INSERT/UPDATE) — provably
    behavior-identical, not just similar: today's SELECT access is already the OR of both
    policies' conditions (Postgres evaluates multiple permissive policies for the same
    role+command as an OR), and today's INSERT/UPDATE access is already owner-only via the ALL
    policy's `USING`, already implicitly reused as `WITH CHECK` per the semantics just confirmed
    — the new policies just make both explicit. Applied as `20260818072522`.
  - Verified post-apply: `pg_policies` grouped by (table, cmd) shows exactly 1 policy for all 4
    commands across all 5 tables (20 rows, no gaps, no duplicates — no lockout on any action).
    `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped 123→98, and
    a direct search of the fresh advisor output for these 5 table names inside that category
    returned 0 remaining hits — full clearance, not partial.
  - This is the first pass in this section to use structural restructuring rather than pure
    drop/merge, and unblocks the same technique for the other genuinely-additive ALL+specific
    pairs still open in the remaining 98 findings (e.g. `activity_feed`, `advertisements`,
    flagged in earlier passes as needing exactly this resolved question before touching them).
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818072124_remove_throwaway_test_migration_records`,
    `20260818072250_drop_redundant_authenticated_read_policies_knowledge_graph`, and
    `20260818072522_restructure_knowledge_graph_all_plus_select_into_percommand`, all mirrored
    locally at `supabase/migrations/`.
- **[Fixed — sixth RLS-consolidation pass, largest single pass so far] 18 more tables cleared
  from `multiple_permissive_policies` in one reviewed batch (98→25).** A fresh full
  `pg_policies` dump was run through a corrected detector script — fixing two real bugs found
  while building it, both verified by hand against real examples before trusting the output: (1)
  the OR-splitter only split one level deep, missing redundancies hidden behind nested-but-
  logically-top-level ORs like `(A OR (B OR C))`; (2) equality clauses weren't normalized for
  operand order, so `auth.uid() = user_id` and `user_id = auth.uid()` were treated as different
  clauses when they're identical. Both fixes surfaced real, previously-missed live redundancies
  (`media_reservations_select_merged`, `task_completions_select_merged` — both created by
  earlier passes in this same session and never re-checked against a table's ALL policy after
  being created).
  - **7 pure drops** (redundant or logically dominated by their table's ALL policy): the 2 above,
    plus `interest_signals`' `interest_own_insert`/`member sees own signals` (exact-duplicate or
    subset conditions with a narrower role scope), plus `media_reservations`' `owner updates
    media` and `publications`' `owner updates publications`/`pub_update` — none of these last 3
    are a literal OR-term subset (so the detector correctly didn't auto-flag them), but each was
    verified by hand to be logically dominated: they only ever pass when `is_platform_owner()` or
    `uid=user_id` already holds, which the table's ALL policy already grants unconditionally for
    that command regardless.
  - **16 tables restructured** into single-purpose per-command policies, the same technique
    proven on the 5 knowledge-graph tables in the previous pass, now applied at scale: `api_keys`,
    `governance_policies`, `policy_rules`, `conversations`, `messages`, `member_posts`,
    `member_presence`, `activity_feed` (the long-documented "genuinely additive, don't merge"
    example in this file — now safely resolvable via full restructuring rather than a naive
    OR-merge), `ai_memory`, `advertisements`, `platform_settings`, `threat_events`,
    `feature_flags`, `platform_metrics`. Split into two groups by whether the additive policy's
    role scope was safe to fold into a single `{public}`-scoped policy: 12 were safe (already
    `{public}`-scoped, or a `uid`-based condition that naturally evaluates false for anon
    regardless of scope); 2 (`feature_flags`, `platform_metrics`) had a bare `true` condition at
    `{authenticated}` scope, where folding into `{public}` would have newly exposed anon to
    unconditional access — these keep their exact original `TO authenticated` scope on the
    restructured policy instead. For every table whose ALL policy only granted self-access (no
    owner bypass — `conversations`, `messages`, `member_posts`, `member_presence`,
    `activity_feed`, `ai_memory`), the restructured INSERT/UPDATE/DELETE policies stay self-only
    — no owner bypass was introduced where none existed before.
  - **Deferred, not touched this pass**: `dispatches` and `content_versions` (each mix
    `{public}`- and `{authenticated}`-scoped additive policies with different conditions, needing
    non-uniform per-policy scope handling rather than one clean merge), and `marketplace_listings`
    (5 overlapping policies split across two different columns, `user_id` vs `seller_id` — needs
    the column-consistency question this file already flagged elsewhere resolved first).
  - Verified post-apply: `pg_policies` grouped by (table, cmd) shows exactly 1 policy for every
    command on every one of the 18 tables touched (no gaps, no duplicates, no lockout).
    `get_advisors` re-run afterward confirmed `multiple_permissive_policies` dropped 98→25, and a
    search of the fresh advisor output found the only 3 tables still appearing in that category
    are exactly the 3 deliberately deferred above — confirming this pass didn't miss anything it
    should have caught, and didn't touch anything it shouldn't have. 94% total reduction from the
    original 434 across all six passes combined.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818080246_rls_pass6_drops_and_percommand_restructure`, mirrored
    locally at `supabase/migrations/`.
- **[Fixed — seventh and final RLS-consolidation pass] `multiple_permissive_policies` fully
  cleared: 434 → 0 across seven passes.** Resolved the 3 tables deliberately deferred from pass
  6:
  - `content_versions` — same "bare `true` at `{authenticated}` scope dominates" shape as
    `feature_flags`/`platform_metrics` in pass 6. The `{authenticated}`-scoped
    `content_versions_auth_read` (qual=`true`) already granted every authenticated user
    (owner included) unconditional read, making both the ALL policy's SELECT component and the
    separate `author reads own content_versions` policy fully redundant for that role. Collapsed
    to a single `SELECT TO authenticated USING (true)` policy — exactly reproduces the original:
    anon still gets nothing, authenticated/owner still get unconditional read.
  - `dispatches` — the `{authenticated}`-scoped `wire read` (qual=`true`) and the
    `{public}`-scoped `dispatch_read`/`dispatches_own` SELECT components couldn't be folded by
    widening role scope alone (anon must keep seeing only published dispatches, not everything).
    Resolved with the `(select auth.role()) = 'authenticated'` idiom already used live elsewhere
    in this exact schema (`marketplace_listings_select_merged`, predating this session) — a
    single SELECT policy (`is_published = true OR is_platform_owner() OR (select auth.role()) =
    'authenticated'`) reproduces the original 3-policy behavior exactly. INSERT/UPDATE/DELETE had
    no additive policies beyond the ALL policy's own self-or-owner condition, so those became
    simple 1:1 per-command splits.
  - `marketplace_listings` — checked the live table shape before touching anything, per this
    file's standing rule against guessing at schema: `information_schema.columns` confirmed both
    `user_id` (nullable) and `seller_id` (NOT NULL) exist, and a row-count query confirmed the
    table has 0 rows total, so `user_id` has never been populated by any real insert.
    `seller_id` is therefore the only column any real write path could have used (enforced by its
    NOT NULL constraint), and `marketplace_listings_own`'s `user_id`-based self-access clause was
    already dead code in practice. Restructured around `seller_id`, preserving
    `marketplace_listings_select_merged`'s existing `auth.role()='authenticated'` broad-read
    grant (any authenticated member can browse the whole marketplace, not just active listings —
    an intentional, already-live design predating this session) and `ml_update`'s existing
    seller-or-owner condition unchanged. DELETE previously had no seller-specific policy at all
    (only the ALL policy's dead-`user_id`-OR-owner condition, in practice owner-only) — kept as
    owner-only rather than introducing a new seller-delete capability that didn't previously
    exist, since this pass restructures, it doesn't redesign access.
  - Verified post-apply: `pg_policies` grouped by (table, cmd) shows exactly 1 policy for every
    command on all 3 tables (12 rows, no gaps, no duplicates, no lockout). `get_advisors` re-run
    afterward confirmed `multiple_permissive_policies` at exactly 0 — a 100% reduction from the
    original 434 findings across all seven passes in this session. Only `unused_index` (125) and
    `unindexed_foreign_keys` (85) remain in the performance-advisor output, both already-
    documented INFO-level categories deliberately deferred to a dedicated follow-up.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as
    `20260818081159_rls_pass7_dispatches_content_versions_marketplace_listings`, mirrored
    locally at `supabase/migrations/`.
- **[Fixed — first pass on `unindexed_foreign_keys`; `unused_index` deliberately left alone,
  with reasoning] 24 missing foreign-key indexes added on real schema; the 45-table scaffold's
  61 remaining unindexed FKs and all 125 pre-existing "unused" indexes left untouched on
  purpose.** With `multiple_permissive_policies` fully cleared, moved to the two remaining
  performance-advisor categories.
  - Queried `pg_constraint`/`pg_index` directly for the authoritative list of foreign keys with
    no covering index (85 — matched the advisor's own count exactly). Cross-referenced all 63
    distinct tables against this repo's own `supabase/*.sql` source, the same method already
    established earlier in this file for the RLS-disabled-scaffold finding: only 18 tables have
    a real `CREATE TABLE` anywhere in this repo; the other 45 (`organizations`, `teams`, `tasks`,
    `calendars`, `ai_workspaces`, `knowledge_documents`, `webhooks`, `workflows`,
    `marketplace_orders`, `billing_invoices`, etc.) are the same unrelated, generic multi-tenant
    SaaS scaffold this file already documented finding on this production project — left
    untouched, matching this file's own standing rule against inventing behavior for schema this
    repo doesn't own or understand the purpose of. Added 24 indexes
    (`supabase/omega_..._fk_indexes` — see migration file) covering the 18 real tables' unindexed
    foreign keys — purely additive (`CREATE INDEX IF NOT EXISTS`), no RLS or access-control
    implication. Verified post-apply: all 24 present via `pg_indexes`; `get_advisors` re-run
    confirmed `unindexed_foreign_keys` dropped 85→61, and every one of the 61 remaining is on a
    scaffold table, not one of the 18 touched.
  - **`unused_index` (125 pre-existing findings, excluding the 24 brand-new indexes just added,
    which trivially show as "unused" until real traffic reaches them — expected, not a
    regression) — deliberately NOT touched, with a live check behind the decision rather than a
    guess.** Queried `pg_stat_user_tables` for a sample of the flagged tables before deciding:
    `profiles` has 9 live rows, and nearly every other table sampled (`conversations`,
    `messages`, `activity_feed`, `threat_events`, `platform_events`, `telemetry_events`,
    `user_journeys`, `workflow_executions`, `notifications`, `matrix_progress`, `sovereign_events`,
    `leaderboard_snapshots`) has **0** rows. This platform has essentially no real traffic yet —
    confirming "unused" here reflects the platform's current near-zero usage, not that these
    indexes are badly designed or genuinely unneeded. Nearly every flagged index is a small
    `user_id`/foreign-key-pattern index (`idx_<table>_user_id` and equivalents) — exactly the
    kind of index that becomes essential the moment real query volume arrives, since
    `user_id = auth.uid()` is the single most common filter across literally every RLS policy
    fixed across all seven consolidation passes in this session. Dropping them now would optimize
    for a database with 9 real users, at the cost of real query performance under RLS the moment
    the platform actually grows — not a good trade for an INFO-level, purely-advisory finding, and
    the wrong kind of mistake to make on a stats-based linter whose "unused" signal is only as
    good as the traffic it's observed. Recorded here as a considered decision, not an oversight —
    matching this file's own precedent for `transactions`/`wallet_balances` and the `.mp4`/`.docx`
    Git LFS migration, both left open by explicit choice rather than default.
  - Applied to the live database and verified (2026-08-18, via the Supabase MCP connector),
    recorded remotely as `20260818082309_add_missing_fk_indexes_real_schema`, mirrored locally at
    `supabase/migrations/`.
- **[Fixed — fresh full-repo re-verification sweep, one real finding] Re-ran this session's three
  established scanners (column-name mismatches against live schema, silent-failure writes,
  module-boundary bugs) across all 169 `.html` and 94 `.js` files as a clean re-verification, not
  assuming prior fixes still held.**
  - **Column-mismatch scan**: 10 candidates, 9 false positives (each individually verified
    against `information_schema.columns`, not assumed) — `profiles.created_at`/
    `profiles.membership_tier`/`profiles.matrix_phase` are all real live columns the static
    parser's regex simply missed; `omega-presence.js`'s and `omega-sovereign-os.js`'s "bad"
    fields were nested inside a `client_info`/`metrics` jsonb object, misread as top-level keys
    by the scanner's non-recursive key extractor; `account.html`'s and `omega-memory.js`'s
    `onConflict` hits were a Supabase client *option*, not a table column. The 10th (`map.html`'s
    `lat`/`lon`/`gate`) is the already-documented, deliberately-unfixed geolocation gap — though
    `country` (also flagged there) turned out to already be a real live column, a minor accuracy
    note for that entry, not a new finding. **Net result: zero new column-mismatch bugs** — a
    clean confirmation, not nothing.
  - **Silent-failure-write scan**: 20 raw candidates, all individually read in context (not
    trusted from the regex alone) — most were either a real `.error` check just outside the
    scanner's 12-line window (`profile.html`, `travel.html`, `account.html`, `events.html`,
    `family.html`'s other two handlers, `contracts.html`), an unrelated non-Supabase API
    coincidentally matching `.update(`/`.insert(` (`omega-sw-register.js`'s
    `ServiceWorkerRegistration.update()`, `omega-confetti.js`'s particle `.update()`,
    `omega-ring.js`'s API doc-comment), or a deliberate best-effort write with no user-facing
    success/failure state to get wrong (`bg.js`'s silent owner-profile self-heal, run on every
    page load with no UI feedback either way; `omega-sovereign-os.js`'s unload-time telemetry
    beacon and circuit-breaker-wrapped heartbeat flush; `omega-memory.js`'s try/catch-wrapped AI
    memory cache write, which already has an explicit `sessionStorage` fallback regardless of
    outcome). **One real finding**: `family.html`'s "add family member" handler checked `.error`
    but only ever acted on success (`if(!error){...clear form, show success...}`) — on failure it
    did nothing at all, no alert, no feedback, inconsistent with its own sibling handlers in the
    same file (bloodline node, heritage record — both already correctly `if(error){alert(...);
    return;}`). Fixed to match.
  - **Module-boundary scan** (inline `onclick=`/`onchange=`/etc. attributes calling a function
    declared only inside a `<script type="module">` block, never exposed to `window` — the bug
    class behind the 26-instance fix earlier in this file): **0 findings**, confirming that fix
    is still fully holding, no regression introduced by anything since.
  - `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged),
    `python3 scripts/check-inline-js.py` (clean), `python3 -m unittest discover -s scripts/tests`
    (25/25 pass) all re-confirmed after the fix.
- **[Fixed] Platform-wide link-hijack bug in the page-transition curtain — every internal link's
  ctrl/cmd/shift-click and middle-click ("open in new tab") has been silently broken since
  `omega-cinematic.js` shipped, on all ~250 pages.** Found while investigating the platform's
  existing motion-graphics infrastructure — `omega-cinematic.js` and `omega-animated.js` are both
  loaded on every page (`bg.js:1471`, `bg.js:1528`), and reading both in full to understand the
  overlap turned up a real bug in `omega-cinematic.js`'s page-transition curtain: its
  document-level `click` listener intercepted every same-origin, non-hash, non-download anchor
  click and called `e.preventDefault()` unconditionally, with no check for modifier keys
  (ctrl/cmd/shift/alt) or which mouse button fired the click. A member trying to open any internal
  link in a new tab — the single most common "I'll read this later" gesture on the web — had that
  click silently redirected to navigate the *current* tab instead, on every link, on every page,
  since this module was added. Fixed by bailing out of the interception on
  `e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey` (also added a stale-event
  guard, `e.defaultPrevented`), matching the standard pattern used by SPA routers for exactly this
  reason — the curtain transition still fires for a plain left-click, verified with a headless-
  Chromium test using manually-dispatched `MouseEvent`s (not `page.click()`, whose real-navigation
  side effects raced the readback and gave misleading results on first attempt — caught and
  corrected before trusting it): plain click → `defaultPrevented: true` (curtain unchanged),
  ctrl-click → `defaultPrevented: false` (browser's native new-tab behavior now proceeds).
  - **The `omega-cinematic.js`/`omega-animated.js` overlap itself is real but not a bug**: both
    implement scroll-reveal and count-up, but through different, non-conflicting mechanisms —
    `omega-animated.js` applies automatically by CLASS NAME (`.kpi`, `.card`, etc., zero markup
    changes needed) and exposes a callable `OmegaCountUp(el, target, opts)` already used by
    `omega-live.js`/`omega-particles.js`; `omega-cinematic.js` requires explicit opt-in via
    `data-reveal`/`data-countup`/`data-stagger`/`data-scan` attributes and additionally owns the
    page-transition curtain, a feature the other module doesn't have. Checked real usage before
    concluding anything: `data-reveal` (13 pages) and `data-stagger` (3 pages) are partially wired;
    `data-countup` and `data-scan` have **zero** usage anywhere in this repo's markup — fully
    dormant, same "built but never wired" shape as several other findings in this file. Left the
    module structure as-is (consolidating two working, non-conflicting systems is a larger
    refactor than this session's scope, and `omega-cinematic.js`'s curtain has no equivalent in
    the other file), but used the live, already-tested `OmegaCountUp` API rather than the dormant
    `data-countup` attribute for the fix below, since `OmegaCountUp` is the one already proven to
    handle asynchronously-populated values correctly.
  - **Also wired real count-up animation onto `dashboard.html`'s live KPI values**, using this
    already-built, already-proven infrastructure instead of adding a new system: enhanced the
    page's single shared `sid(id, v)` "set value" helper (used at 23 call sites, both numeric KPIs
    and non-numeric text like gate/element names) to detect a purely-numeric value via a strict
    regex and animate it through `OmegaCountUp` when available, falling through to the exact
    original plain `textContent` assignment for anything else — non-numeric text, and any call
    before `omega-animated.js` has finished loading (graceful degradation, not a hard dependency).
    Verified in headless Chromium: numeric values (`7`, `99.9%`) animate and land on the correctly
    formatted final string; non-numeric text (`SOVEREIGN`, `ORACLE`) passes through completely
    unaffected in both the "no OmegaCountUp yet" and "OmegaCountUp loaded" cases.
  - `node --check omega-cinematic.js`, `python3 scripts/check-inline-js.py`,
    `python3 scripts/audit.py` (0 critical / 6 pre-existing warnings, unchanged), and
    `python3 -m unittest discover -s scripts/tests` (25/25 pass) all confirmed clean after both
    fixes. No SQL/schema changes — pure client-side JS, live the moment these two files deploy.
- **[Fixed — highest-impact of this session] `bg.js` silently loaded NONE of its ~90 platform
  modules on 7 pages, because every injection dropped its work when `document.body` was absent
  instead of waiting for it.** Found by crawling all 178 pages in real headless Chromium and
  noticing that `council.html` and the six `graph-*.html`/`graphify.html` views had **5 script
  tags loaded where `dashboard.html` had 98**. Root cause: 89 separate injection sites in `bg.js`
  were written as `if(document.body)document.body.appendChild(x)` — a guard that silently
  discards rather than defers. Those 7 pages load bg.js as a plain `<script src="/bg.js">` inside
  `<head>` (141 other pages use `defer` or place it in `<body>`), so it executes during head
  parsing while `document.body` is still `null` and every one of those 89 guards evaluates false.
  The injected design-system `<style>` still landed (it appends to `<head>`), so the pages *looked*
  styled — which is exactly why this went unnoticed — while nav, the approval guard's runtime,
  `omega-a11y.js`, copilot, notify and telemetry were all dropped with no error anywhere. Same
  shape as the `nav.js` injection gap already recorded above, one layer deeper. Fixed by adding a
  single `__omegaAppend(el)` helper at the top of `bg.js` that appends immediately when body
  exists and otherwise queues to `DOMContentLoaded` (preserving relative order), then converting
  all 89 sites to it via a scripted exact-string replacement with a count assertion. The
  assertion earned its keep twice: it caught that the helper's own inner
  `if(document.body)document.body.appendChild(el)` matched the same pattern (which would have
  made the helper infinitely recursive), and a first attempt at also rewriting the two
  `if(document.body){…}else requestAnimationFrame(…)` sites left a dangling `else` — those two
  already retry rather than drop and are deliberately left untouched. The noise-overlay block
  used a *compound* `if(document.body && !getElementById(...))` guard that the sweep did not
  match, and was fixed separately. Verified in real Chromium: `council.html` went **5 → 97**
  script tags with `omega-a11y` now loading and the sidebar rendering, all 7 pages now fully
  correct, and `dashboard.html`/`matrix.html` unchanged at 98 (no regression). The remaining raw
  `document.body.appendChild` calls (`bar`, `g`, `ov`, `warn`, `el`) were each read in context
  and left alone: all are async runtime UI created after auth resolves, long after body exists.
- **[Fixed] The platform-wide skip link existed on every page but never moved focus — it failed
  its only job.** `omega-a11y.js` injects `<a id="omega-skip">` (no class, which is why a
  `.skip-link` selector sweep missed it and initially suggested 158 pages had none). Two real
  bugs, both measured rather than inferred: (1) the link's target never got `tabindex="-1"`, and
  a `<div>`/`<main>` is not focusable by default — so activating it scrolled the page but left
  focus on `<body>`, meaning the next Tab restarted at the top of the document and walked back
  into the ~15-section sidebar dock the link exists to skip; (2) `ensureTarget()` resolved the
  content region with `main`, `.main`, `#app` only, none of which match the ~100 pages built as
  `.shell > aside#omega-side + div[flex:1]`, so on `matrix.html`/`media.html`/`terms.html` the
  href stayed at the default `#omega-main-content` — an element that was never created, i.e. a
  dead fragment link. The same too-narrow lookup is why section D left those pages with **zero**
  `<main>`/`[role=main]` landmarks despite the module's own header promising "ensures every page
  has at least one". Fixed with one shared `resolveMain()` used by both sections, which adds
  `.page-shell` and the sidebar's next element sibling as candidates, sets `tabindex="-1"`, and
  focuses the target explicitly on click. Two guards matter: any candidate that *contains*
  `#omega-side` is rejected (`.shell` wraps nav and content together — promoting it would put the
  whole navigation inside the main landmark, worse than no landmark), and decorative tags are
  skipped (`404.html`/`pending.html` put a full-bleed `<canvas>` right after the aside, which the
  naive sibling walk targeted, putting `role="main"` on an empty canvas). Verified by driving a
  real keyboard (Tab, then Enter) with content revealed the way the approval guard reveals it:
  **8 failures before, 18/18 assertions passing after**, and a full-178-page pass with
  `waitUntil:'load'` showed 165 fully correct, 0 landmarks wrapping the sidebar, 0 decorative
  targets (the shortfall being page-load timeouts under 8-way parallelism — each re-passed
  individually). `offline.html` is correctly excluded: it deliberately loads no `bg.js` so it
  still works with no network.
- **[Fixed] `breath.html`'s guided breathing animation froze permanently on the first HOLD
  phase.** `drawBreathCircle()` applied alpha by string-appending a hex pair (`col+'55'`), which
  is valid for the five technique colors (6-digit hex) but produces the unparseable
  `'rgba(201,168,76,.5)55'` for the gold HOLD/PAUSE and idle states — and `addColorStop` *throws*
  on a bad color rather than ignoring it. The throw escaped into `tick()`, which schedules its
  next `requestAnimationFrame` only *after* the draw returns, so the loop died and `done()` was
  never called: BOX BREATHING (the default technique, INHALE/HOLD/EXHALE/HOLD, "Navy SEAL
  standard") froze roughly four seconds into the very first session, and the idle render threw on
  page load. Fixed with a `withAlpha()` helper that accepts either color form. Verified by
  driving a real session through the phases: **before** = phase sequence `["INHALE","HOLD"]` and
  2 page errors, stuck; **after** = `["INHALE","HOLD","EXHALE"]` with 0 errors.
- **[Fixed] `omega-graphify.js` threw `this.loadGraph is not a function` on every `graphify.html`
  load.** `init` is an arrow function on an object literal returned from an IIFE, so `this` is the
  IIFE's `this` (window), not the object — `this.loadGraph()` resolved to `window.loadGraph`,
  undefined. The throw aborted `init()` before `Render.frame()`, leaving the graph canvas blank.
  Fixed by naming the returned object `API` and calling `API.loadGraph()`. Verified: `init()` now
  returns cleanly and the TypeError is gone.
- **[Improved] `i18n.js` cut from 297 KB to 55 KB — 242 KB off every page load, platform-wide.**
  Measured the real payload in headless Chromium first rather than guessing: a `dashboard.html`
  load pulled **93 JS requests totalling 1.25 MB**, of which `i18n.js` alone was 297 KB (24% of
  all JavaScript) — eagerly loaded by `bg.js` on every one of the ~250 pages even though the
  default language is `en` and the markup is already written in English. It inlined all 7
  languages for all 1013 keys in one file. English **must** stay inline because `OmegaI18n.t(key)`
  is synchronous and called at arbitrary times by `profile.html` and `approvals.html` (several
  call sites pass `'en'` explicitly), so only the other six languages were split out to
  `/i18n/<lang>.json`, fetched on demand. JS payload per page: **1.25 MB → 1.01 MB**. The
  dictionary was extracted by *evaluating* `i18n.js` in a sandboxed VM rather than regex-parsing
  it, so escaped quotes (`'S\'inscrire'`) could not corrupt the split; a browser round-trip then
  confirmed all **1013 keys × 7 languages byte-identical** to the pre-split dictionary. Public API
  is unchanged (`translate` now returns a Promise where it previously returned `undefined`; no
  caller used the return value). One real bug was caught by the tests during development:
  memoising the in-flight fetch permanently meant a *failed* pack pinned the member to English for
  the rest of the session with re-selecting the language doing nothing — fixed by clearing the
  in-flight entry once the request settles, so only success suppresses a refetch. Verified with 22
  browser assertions: zero packs fetched for a default English visitor, correct RTL/`dir` and
  translated sidebar on switching to Arabic, a stored non-English preference auto-loading its pack
  on a fresh page load, and an HTTP-500 pack leaving the page cleanly in English with no unhandled
  error, then recovering on retry.
- **[Fixed] Form controls across 66 pages had no accessible name, and `omega-a11y.js`'s own label
  audit could not have helped because it never looked at `<select>` or `<textarea>`.** The crawl
  found 177 controls with no accessible name. Section E queried `<input>` only — but the bulk of
  this platform's unnamed controls are `<select>` dropdowns (`p-cat`, `filter-type`, `af-rel`,
  `triv-diff` …). Worse, its fallback chain ended in `input.type`, so where it *did* apply it
  produced `aria-label="text"` / `"number"` / `"date"` — a screen reader then reads that out **in
  place of** a name, which is worse than staying silent. Measured on a 10-page sample: 12 controls
  carried such a bare type-word as their entire accessible name. The important finding is that
  **111 of the 177 already sit next to a real `<label>` the page author wrote** — "CATEGORY",
  "TIER", "COMMISSION RATE (%)", "ZODIAC SIGN" — which simply has no `for=` attribute and does not
  wrap the control, so it renders correctly on screen while being invisible to assistive tech.
  Rewrote section E to cover `input`/`select`/`textarea` and to prefer *associating* that existing
  label (setting `for=`/`id`, generating an id only when the control lacks one) over inventing a
  string: it recovers the author's own wording and stays correct if the page later rewrites the
  label text, and it is idempotent because `el.labels` is non-empty on the next run. Dropped the
  `input.type` fallback entirely. A `<select>`'s first `<option>` is used only when it reads like a
  **prompt** ("Select a trigger…", "ALL TYPES", "-- choose --"); most first options are real values
  ("Knowledge", "Self", "🏠 HOUSING", "1 — Individual") and naming a category dropdown "Knowledge"
  actively misleads, so those are deliberately left unnamed rather than mislabelled. Verified in
  Chromium with an identical-methodology A/B over a 10-page sample: named **71 → 98**, unnamed
  **35 → 8**, bare-type-word names **12 → 5** — and the 5 remaining were confirmed by hand not to be
  junk at all but genuine author labels that happen to read "DATE"/"EMAIL" on a date/email field.
  Provenance spot-checked on `expenses.html`: every control now resolves through a real
  `<label for>` ("DESCRIPTION", "AMOUNT ($)", "TYPE", "CATEGORY", "DATE", "NOTES (optional)").
  Across all 66 affected pages: 407 controls named, 78 still unnamed (those have no label, no
  placeholder, and no prompt-shaped option — nothing truthful to derive a name from).
- **[Fixed] Three pages were entirely dead on a member's first visit: an invalid-JSON default
  threw at module top level and killed every function below it.** `contributions.html:152`,
  `notifications.html:134` and `treasury.html:203` each did
  `JSON.parse(localStorage.getItem(K)||'{pct:10,income:0}')` — and `'{pct:10,income:0}'` is **not
  valid JSON**, because JSON requires quoted keys. The fallback only runs when the key is absent
  from `localStorage`, i.e. on **every first visit**, and the statement sits at the top level of a
  `<script type="module">`, so the throw aborted the whole module and nothing declared below it
  ever ran. Every `window.<fn>=` exposure further down the module was therefore never assigned:
  `contributions.html` lost its filters plus LOG CONTRIBUTION / LOG GIFT / SET giving-target;
  `notifications.html` lost MARK ALL READ / CLEAR ALL / SAVE REMINDER / REQUEST PERMISSION / SAVE
  SETTINGS; `treasury.html` lost SAVE ASSET / UPDATE RESERVES / LOG FLOW. Found by scanning every
  inline `onclick`/`onchange`/… handler on all 178 pages in a real browser and checking whether
  the function it names actually exists at runtime, then confirmed independently by a static scan
  for `JSON.parse(… || '<literal>')` fallbacks that do not parse — both methods returned exactly
  the same three files. Fixed by quoting the keys. Verified deterministically: each original
  literal throws, each replacement parses, and the parsed keys and values are identical to what
  the author wrote; in-browser, the `SyntaxError` count on each page went **1 → 0**.
  **End-to-end confirmed** (an earlier draft of this entry recorded that it could not be, because
  the pages redirected to `account.html` and then `terms.html`; both gates were then satisfied in
  the harness — the terms one is `bg.js:1002`, `if(d.sign && !d.terms_accepted)`, so the stub
  profile needs `terms_accepted:true`): with an authenticated, approved, terms-accepted session
  and a fresh empty `localStorage`, the handler count on the three pages goes **0/4 → 4/4,
  0/5 → 5/5, 0/3 → 3/3** with the page staying put rather than redirecting.
- **Method note for anyone re-running a browser scan here: stub `esm.sh` first, or the results are
  worthless.** The first pass of the dead-handler scan reported 44 pages and 66 missing functions,
  including `setTab` on 34 pages — which flatly contradicted this file's own record that the
  module-boundary bug was fixed and re-verified at 0 remaining. The contradiction was the tell.
  Every gated page loads Supabase with `import{createClient}from'https://esm.sh/@supabase/supabase-js@2'`
  at the top of a `<script type="module">`, and `esm.sh` is unreachable from a sandboxed
  environment (`curl` returns status 000). When a module's top-level import fails, **none** of its
  code runs, so `window.setTab = setTab` never executes and every such function looks missing.
  Re-running with a Playwright route fulfilling `esm.sh/**` from a local stub dropped the result
  to 9 pages / 13 functions, and `setTab`/`switchTab` disappeared entirely — confirming the
  earlier fix is intact. Of the 13 that survived, 7 (`item`) were a scanner false positive
  matching `item(` inside the string `'Restored '+n+' item(s)…'`, and the other 6 were the real
  bug above. A reusable authenticated-session stub for this
  (`createClient` returning working `auth.getSession`/`from().select().single()` chains) is worth
  rebuilding for any future browser scan of the gated pages; without a session they redirect to
  `account.html`, and with one they redirect to `terms.html`.
- **[Fixed] `i18n.js`'s auto-translate lost a race it usually loses, so `translate()` never ran on
  most page loads — and `approvals.html`, the owner console, rendered with a blank page title.**
  `i18n.js` registered its startup unconditionally as
  `document.addEventListener('DOMContentLoaded', …)`. But `bg.js` injects this file by appending a
  `<script>` at runtime, and a dynamically inserted script is **async** — the browser does not
  delay `DOMContentLoaded` for it. So the file typically finished executing *after* that event had
  already fired, registering a listener for something that would never happen again. Measured on a
  zero-latency local server by instrumenting both timestamps: i18n.js landed after
  `DOMContentLoaded` on 3 of 4 sampled pages (approvals 172ms vs 187ms, dashboard 261 vs 296,
  vault 137 vs 258); only `matrix.html` won the race. `localStorage.omega_lang`, which
  `translate()` writes on every call, was `null` on exactly the three losers — proof it never ran.
  Being a race is why this was never noticed: it works sometimes. Two real consequences: any
  member whose stored language is not English got **no translation at all** on load (the entire
  language switcher being effectively decorative on first paint), and `approvals.html` showed a
  **blank title** because its `<div class="t">` and subtitle `<small>` are empty in the markup and
  filled purely from `data-i18n` — confirmed by calling `OmegaI18n.translate('en')` by hand there
  and watching "INVISIBLE ARCHITECT CONSOLE" appear. Fixed with the `document.readyState` check
  the rest of this codebase already uses for exactly this reason (`bg.js`, `omega-a11y.js`,
  `omega-cinematic.js`). After the fix all four sampled pages store `omega_lang`.
- **[Fixed in the same change, and load-bearing] `translate()` destroyed nested `data-i18n`
  elements — fixing the race above would have turned that latent bug into a visible one on 5
  pages.** `apply()` wrote `el.textContent = txt`, which replaces *every* child node. Seven pages
  nest one `data-i18n` element inside another — the topbar pattern
  `<div class="t" data-i18n="x">TITLE<small data-i18n="y">SUBTITLE</small></div>` on
  `analytics`/`approvals`/`feed`/`matrix`/`profile`/`vault`, and `.sechead` elements wrapping a
  `<span class="sechead-action" data-i18n=…>` on `dashboard`. Setting `textContent` on the parent
  deletes the child, and because `querySelectorAll` returns a **static** list the subtitle is then
  "translated" while already detached from the document — so it is simply gone. This never
  surfaced only because `translate()` itself was never running. Replaced the flat assignment with
  `setOwnText()`, which rewrites only the element's own text nodes and leaves element children
  intact (inserting the text first when the element was authored with no own text, as on
  `approvals.html`, so it still reads title-then-subtitle). Verified by A/B in Chromium: with the
  race fixed but this protection removed, the nested pairs on analytics/approvals/matrix/vault/
  dashboard are gone; with it, all survive and the parent title applies correctly — e.g.
  `approvals.html` now renders "INVISIBLE ARCHITECT CONSOLE" *and* keeps
  "SOVEREIGN ACCESS CONTROL · OWNER-ONLY · ALL-TIME · IRREVOCABLE".
- **[Fixed in the same change — the risk the race fix created] In the base language the markup now
  wins; the dictionary only fills gaps.** Making `translate()` actually run meant the English
  dictionary would, for the first time, overwrite authored page text everywhere. That is not safe
  here: comparing all 420 plain-text `data-i18n` elements against the dictionary found 273
  identical but **106 different**, and the dictionary is the *worse* text in most of them — it is
  an older parallel copy that has drifted from the markup. Concretely, `dashboard.html`'s tabs
  would have lost their glyphs (`"▲ OVERVIEW"` → `"OVERVIEW"`), the brand would have lost its
  sigil (`"Ω COMMAND BRIDGE"` → `"Command Bridge"`), `analytics.html` would have reverted to
  superseded algorithm copy, and `"· 18 <span data-i18n=\"sovereign_modules\">SOVEREIGN
  MODULES</span>"` would have rendered `"· 18 18 SOVEREIGN MODULES"` because the dictionary entry
  repeats a number the markup already renders as a sibling node. So `apply()` now skips any
  element that already has its own authored text when the language is the base one, and writes
  only where the author deliberately left it empty (41 elements — the "i18n supplies this"
  pattern, of which `approvals.html`'s topbar title is one). For every other language the
  dictionary still applies unconditionally, since there is nothing else to show. Verified in
  Chromium: in English the tab keeps `"▲ OVERVIEW"`, the brand keeps `"Ω COMMAND BRIDGE"`, there
  is no duplicated `18`, and the empty approvals title is still filled; switching to French still
  yields `"APERÇU"` and `"Commande"`.
- **[Improved] 160 of 178 pages had no `<h1>`; 152 now expose one without any markup change.**
  A screen-reader user had no level-1 heading to orient on and heading-navigation landed nowhere.
  152 of those pages already render a perfectly good title in the topbar — "ANALYTICS",
  "BLOODLINE", "SOVEREIGN ACADEMY · EXAMS" — marked up as a semantics-free `<div class="t">`.
  `omega-a11y.js` now promotes that existing element with `role="heading" aria-level="1"`, which
  is preferable to injecting a hidden `<h1>`: it names the heading with the title the user can
  actually see and adds no duplicate text for a screen reader to read twice. Nothing visual
  changes — ARIA roles carry no styling. Skipped when the page already has a real `<h1>` (18 do),
  when the element already carries a page-set role, or when the title text is empty once the
  nested `<small>` subtitle is discounted. Verified across all 178 pages: pages with a level-1
  heading went **18 → 170**, with 0 duplicates and 0 applied where a real `<h1>` already existed.
  The 8 still without one (`dashboard`, `account`, `approvals`, `404`, `pending`, `terms`,
  `enterprise`, `observatory`) have no honest title to promote — deriving one from
  `document.title` would announce the same generic "Command Bridge" string on several unrelated
  pages, so they are deliberately left alone rather than given a misleading heading.
- **[Fixed — latent, not yet visible] `omega-sigil-gen.js` gave every generated sigil the same
  `<defs>` ids, so two sigils on one page shared one gradient and one blur filter.** Found by a
  duplicate-element-id sweep of the live DOM across all 178 pages (not of the source text — see
  the false positives below). Each generated sigil embeds its own `<defs>` containing
  `<filter id="sig-glow">` (blur `stdDeviation` derived from the member's **gate**) and
  `<radialGradient id="sig-grad">` (stops derived from the element **palette**) — both hardcoded,
  so N sigils produced N elements sharing one id, and `url(#id)` resolves to the **first** match
  in the document per spec. Proved with two sigils on one page: a Fire sigil (stops
  `#FFA07A|#FF6B35`, blur 4) and a Water sigil (`#90E0EF|#00B4D8`, blur 7.5) — the Water sigil
  *defined* cyan and *painted* orange with the wrong blur. Fixed with a per-call counter
  (`sig-glow-s1`, `sig-grad-s1`, …). After: each sigil resolves to its own defs; before: sigil 2
  resolved to sigil 1's.
  **Honest scope**: `rune.html` renders 7 sigils and is the only page doing so today, but all 7
  currently share one palette and gate (measured: 7 gradients, 1 distinct stop-colour set, all
  blur 3.5), so nothing was visibly wrong on screen. This was a landmine, not an active defect —
  `OmegaSigil.mount()` is public API and any page rendering two differing sigils would have hit
  it. Recorded that way rather than as a user-visible bug fix.
  Three other duplicate-id findings from the same sweep were checked and deliberately left alone:
  `forge.html`'s five `id="exitBtn"` and `clarity.html`'s two `id="total-steps"` are **source-text
  duplicates only** — each lives in a template that *replaces* the previous one, so the live DOM
  never holds two (confirmed by the DOM-level scan finding neither page). `habits.html` really
  does render `hc-h0`…`hc-h3` twice (the same card appears in the "today" and "all" lists), but a
  repo-wide grep confirms those ids are never looked up by `getElementById` or a `#hc-` selector —
  every interaction passes the habit id as a *value* (`toggleHabit('h0')`). Invalid HTML, zero
  functional consequence; inventing a suffix scheme there would carry risk for no behavioural gain.
- **Checked and found clean, recorded so the next session doesn't re-investigate**: all 170
  `.html` link targets in `nav.js` resolve to real files (0 broken nav links). `nav.js`'s `PS`
  page→section map briefly looked like it had two broken keys (`design_system`, `sovereign_ai`
  with underscores while the pages declare `data-page="design-system"`/`"sovereign-ai"`), which
  would have silently fallen back to the COMMAND section via `PS[dp]||'command'` — but evaluating
  the real map showed **both hyphen keys are present too**, alongside redundant underscore
  duplicates. No bug; the static scan had only flagged the underscore keys because it never
  checked whether the hyphen form also existed.
- **[Fixed] `graph-anomalies.html` wrote `<tr><td>` into a CSS-grid `<div>`, so two empty states
  rendered unstyled.** `#anomalyTable` is a `<div>` inside a `.tbl-row` grid, not a `<table>`, and
  the HTML parser **discards** `<tr>`/`<td>` written into a non-table element. Measured: setting
  `'<tr><td colspan="6" class="empty-state">SUPABASE NOT READY</td></tr>'` produced **0 child
  elements** — the text survived only as a bare text node, landing in the first grid cell instead
  of spanning the row, with no `.empty-state` styling. The same file already does it correctly at
  its "NO ANOMALIES DETECTED" branch (`<div style="grid-column: 1 / -1">`), so the fix is that
  page's own established pattern, not an invention. Both the "SUPABASE NOT READY" and "ERROR
  LOADING DATA" branches now use it. A/B through the real code path: before 0 child elements and
  no `grid-column`; after 1 `DIV` with `grid-column: 1 / -1`.
- **Two corrections and one new gap, from auditing the table system**:
  - **The "27 pages still use native `<table>`" item recorded above and in §8's open list is
    stale — the conversion is finished.** A repo-wide case-insensitive grep finds **zero**
    `<table>` elements. Only `ops.html` still contains `<tr>`/`<td>` strings, and that is the
    separate dead-code case below.
  - **`ops.html`'s event-bus metrics table never renders — flagged, not built.** Line 485 does
    `document.getElementById('evt-metrics-body')`, but that id exists **nowhere** in the page
    (verified in a browser: the element is absent), so the `if(tbody && window.OmegaBus)` guard is
    always false and the whole 7-column metrics block is dead. There is no orphaned table head
    waiting for it either — the "EVENT BUS" text on that page is a signal-strength label, not a
    table section. Adding the container means designing UI that was never built, which is a
    feature decision, so it is recorded here rather than guessed at — same treatment as the other
    "built but never wired" gaps in this file.
  - **[Fixed] The `.tbl-wrap`/`.tbl-row` system carried no table semantics, so ~38 pages of data
    tables announced as unstructured text.** The shared classes are plain `display:grid` divs;
    only **1 of 38** pages using `.tbl-wrap` set `role="table"`, so screen readers got no
    row/column structure and no header-to-cell association anywhere in the platform's tables —
    an accessibility cost of the native-`<table>` conversion that the conversion note never
    mentioned. `omega-a11y.js` section D3 now assigns the roles centrally.
    The implementation is deliberately conservative, because a **malformed** ARIA table is worse
    than none — a screen reader can drop content sitting inside a table without valid row/cell
    ancestry. It computes the entire role assignment first and applies **nothing** to an instance
    if anything about it is ambiguous. Two real shapes force that, both measured across the 43
    `.tbl-wrap` instances: in **17 of 43** the rows are injected into an intermediate unclassed
    `<div>` (e.g. `<div id="anomalyTable">`), making `.tbl-row` a *grandchild* of `.tbl-wrap` —
    ARIA requires rows to descend from a table or rowgroup, so each such container is marked
    `role="rowgroup"`; and some instances carry a `.tbl-row` with no element children (an
    empty-state placeholder holding bare text), where a cell-less row can swallow its own text,
    so the whole instance is skipped. A wrapper whose direct children are not all rows or
    row-containers is skipped too, since a search box or footer inside would be content stranded
    in a table.
    **Verified with real accessibility-tree snapshots, not by reading the DOM**: 36 of 43
    instances get `role="table"`, and snapshotting every one of them via
    `page.accessibility.snapshot({root})` gives **36 well-formed (rows AND cells), 0 malformed,
    0 text lost** against a roles-removed baseline of the same subtree — e.g. `character.html`
    13 rows/52 cells, `architect.html` 11 rows/54 cells, `compliance.html` 7 rows/28 cells. The
    7 the guards skip are exactly the ambiguous shapes: 4 whose body container was still empty at
    load (`graph-anomalies`, `graph-centrality`, `nexus`, `vault`) and 3 with an empty-state
    placeholder row (`physiology`, `queue`, `sovereigns`); all are re-evaluated on
    `omega:populated`, so they pick up roles once their rows actually exist.
    *Method note*: a first verification pass compared whole-page a11y trees and reported "text
    lost" on 17 pages. That was the harness, not the code — the two snapshots were taken seconds
    apart and the diffs were the live trial timer (`00:00:03 / 09:17:17`) and the cookie banner.
    Comparing only each `.tbl-wrap` subtree removed the noise. A second limitation had to be
    worked around too: 36 of 43 wrappers sit in `display:none` tab panels and never enter the
    accessibility tree at load, so only 4 could be checked until the panels were force-revealed.
- **[Improved] 47 more form controls named, from labels authors wrote in a `<div>` instead of a
  `<label>` — wired with `aria-labelledby`, not a copied string.** The earlier section-E pass
  recovered controls sitting next to a real `<label>`; measuring what was left showed 31 of 40
  sampled had a *visible* label in a plain element — `<div class="b-label">DATE</div>`,
  `<div class="n-label">STRENGTH (1–5)</div>`, a bare `<div>SEVERITY (1-5)</div>`. Nothing else
  could reach those. Every accepted label was printed and read before shipping, which is how the
  guards were chosen — each rejects a real case seen while measuring: a preceding `<select>`
  whose `textContent` is its whole option list (`bloodline.html`, would have been named
  "SelfParentGrandparent…"), multi-line prose, a full sentence, and anything over 40 characters.
  **`aria-labelledby` rather than `aria-label` is the load-bearing choice.** `mirror.html`'s
  slider labels hold the label *and* the live value in one element, so a copied string would
  freeze as "ENERGY LEVEL5" and then lie on every subsequent move. Referencing the element makes
  the name follow the value — verified by driving the slider: name goes "ENERGY LEVEL5" →
  "ENERGY LEVEL9" as the value changes. Across the 66 affected pages: named **407 → 455**,
  truly unnamed **78 → 31** (a 10-page A/B: named 86 → 128, unnamed 45 → 3, zero suspicious
  names). The 31 that remain have no label, no placeholder, and no prompt-shaped option —
  nothing truthful to derive a name from, so they stay unnamed rather than mislabelled.
  Note for anyone re-measuring: a checker that resolves only `el.labels`/`aria-label`/
  `placeholder` will undercount badly now — it must follow `aria-labelledby` to its target.
- **[Added to the gate] `scripts/audit.py` check 9 — JSON.parse fallback literals that are not
  valid JSON, CRITICAL.** The invalid-`'{pct:10,income:0}'` default that took three pages
  entirely dead on a member's first visit was invisible to every existing check: the JavaScript
  parses fine (`node --check` and `check-inline-js.py` both pass it), the column names are
  correct, and nothing errors until a real browser hits the first-visit path where the key is
  absent from `localStorage`. Since that bug cost three whole pages and this repo has a standing
  philosophy of turning a manual sweep into a permanent automatic one (checks 7 and 8 exist for
  exactly that reason), it is now gated. Implementation notes: the argument is extracted with a
  balanced-paren, quote-aware walk rather than a `[^)]*` regex — the naive pattern stops at
  `getItem(...)`'s own `)` and misses the fallback entirely, which is how the first version of
  this scan reported 0 findings against a repo that had 3. Only `JSON.parse(… || '<literal>')`
  is checked; a non-literal fallback is ignored rather than guessed at. 6 tests added to
  `scripts/tests/test_audit.py` covering the unquoted-key failure, the quoted-key pass, the
  common `'[]'`/`'{}'`/`'null'` forms, the nested-paren extraction, a non-literal fallback being
  ignored, and file:line reporting — all 6 confirmed to FAIL when check 9 is deleted, so they
  test the gate rather than passing vacuously. Suite is now 51 tests. No `ci.yml` change needed:
  check 9 runs inside the existing "Repository audit" step.
- **Performance: measured, but deliberately NOT acted on — recorded so the data isn't re-derived.**
  A page load pulls **93 JS requests / ~1.01 MB** after the i18n split, and `bg.js` injects 87
  `omega-*.js` modules totalling **747 KB** on every page. An obvious-looking optimisation is to
  stop loading modules no page references: 41 of them (336 KB) expose a `window.Omega*` global
  that **zero** pages and zero other modules ever call. That metric is a trap and was not acted
  on. `omega-a11y.js` is in that list — 0 pages reference `OmegaA11y` — yet it injects the skip
  link, the main landmark, and every form-control label, as this session's own fixes prove.
  Self-activation on load, with no caller, is the norm here rather than the exception, so
  "unreferenced global" says nothing about whether a module is dead. Establishing which of the 87
  are genuinely page-specific means reading each one's activation path, and removing any of them
  is a feature/architecture decision (§9), not a cleanup. Left for an explicit decision with the
  measurements above as the starting point.
- **[Fixed] `OmegaSearch.addItems()` was called but never existed, and platform search had no
  touch-reachable entry point at all.** `omega-ui.js:272` has always opened `enhanceSearch()`
  with `if(!window.OmegaSearch||!window.OmegaSearch.addItems) return;` — and `omega-search.js`
  only ever exposed `{open, close, search}`, so that guard took the early return on every page
  load and the index stayed frozen at the 160 entries hardcoded in `omega-search.js`. Same
  silent-failure shape as the rest of §8, one layer up from Supabase: a guard written for a
  method that was never implemented reads as defensive coding rather than as a dead call.
  Consequence measured, not inferred: nine pages `nav.js` links to — `council.html`,
  `hercules.html`, and the six `graph-*.html` views — were absent from the index, so searching
  for any of them returned nothing (0/9 findable before, 9/9 after).
  - Implemented `addItems()` (deduped by normalised URL; calls `_fuse.setCollection(INDEX)`
    when Fuse is already warm, since Fuse copies the collection at construction and pushing to
    `INDEX` alone would leave new pages unfindable by fuzzy search even once indexed). That
    alone makes the pre-existing `omega-ui.js` call work for the first time: index 160 → 200.
  - Added a harvester that reads the anchors `nav.js` actually rendered, run on open. `nav.js`
    is the authoritative list of member-reachable pages and it grows; a hardcoded index does
    not, which is precisely how the 9 went missing. Index → 210. The nav label alone isn't
    enough to find a page by name (`/council.html` is labelled "DECISION ENGINE"), so the slug
    goes into the description in both hyphenated and spaced form — without that, `council`
    matched nothing while `graph admin` did, caught by the verification rather than by reading.
  - **Search was Ctrl+K-only** — an unadvertised shortcut, and one a touch device cannot press,
    so on a phone or tablet the platform's search was simply unreachable. Added a visible
    `⌕ SEARCH` trigger to the `omega-controls.js` dock (alongside the language/sound controls,
    so it reaches every page). `omega-search.js` already listened for `[data-search-trigger]`,
    but bound it with a one-shot `querySelectorAll` at module-eval time — and since `bg.js`
    injects this file as an async script and injects the dock later still, that binding could
    never have caught it, and no page carries the attribute in its own markup either. Switched
    to event delegation, which also makes the attribute work for anything added later.
  - Results are built with `.innerHTML`, and `addItems()`/the harvester now feed it text read
    out of the DOM, so titles and descriptions are escaped before `highlight()` wraps its
    `<mark>`. No output change for the static index (no angle brackets in it), but the dynamic
    path is no longer trusting every future caller.
  Verified in headless Chromium by clicking the real dock button rather than calling the API,
  A/B against `git show HEAD:` copies of both files over a 6-page sample: **before** — visible
  trigger on 0/6 pages, 0/9 nav-only pages findable, no `addItems` on the API at all; **after**
  — 6/6, 9/9, index 210, focus lands in the search input, 0 page errors. Ctrl+K opens on 6/6
  both before and after (unchanged). An item whose title carries `<img src=x onerror=…>`
  renders as text and does not execute. `node --check` on both files, `check-inline-js.py`
  clean, `audit.py` 0 critical / 7 pre-existing warnings, 51/51 tests. No SQL/schema changes.
- **[Fixed] On a phone, every control in the bottom dock was untappable — measured 0 of 9
  reachable at 375px and at 414px.** Found by measuring fixed-position chrome at a real mobile
  viewport rather than by looking at the pages. `omega-controls.js` positions its dock entirely
  with inline styles, which no media query can reach, and `bottom:16px` put it at y 640..684 —
  against `nav.js`'s `#omega-mob` bottom bar at y 651..700 with `z-index:9990` versus the dock's
  `2000`. So 33 of the dock's 44px were behind the nav bar, and `elementFromPoint` over each
  control's own centre returned the nav bar, not the control: the platform's only language
  switcher, its sound toggle, and the search trigger added earlier this session were all dead to
  touch. The dock also measured **389px wide inside a 375px viewport** (x −7..382), clipped past
  both edges — and invisibly so to any overflow check, because `translateX(-50%)` overflow to the
  left never grows `scrollWidth` (the repo-wide 178-page overflow scan run in the same session
  correctly reported 0 pages scrolling horizontally, and was right; this is a different defect).
  - Fixed by giving the dock a real stylesheet (`#omega-controls-css`) with a `≤760px` rule:
    lifted to `bottom:74px` to clear the 66px nav, `max-width:calc(100vw - 12px)` with
    `flex-wrap` as the fallback on narrower devices, and tighter button padding/font so all nine
    controls fit one row (measured after: 187px wide at 375px, no wrap needed).
  - Three neighbouring widgets in the same corner were measured and moved with it, since lifting
    the dock alone would have traded one collision for another: `#omega-ded-widget`
    (`omega-chrono.js`, `bottom:44px` — inside the nav band, clipped by it) → `122px`;
    `#ofb-btn` (`omega-feedback.js`) already had a `bottom:78px` mobile override for the nav bar,
    which is the precedent this fix follows, but 78px lands on the dock's new position → `126px`,
    left-anchored beside the right-anchored dedication widget so they do not overlap
    horizontally; `#omega-cap-badge` (`omega-capability.js`, `bottom:24px`, `z-index:200`) sat
    wholly inside the nav band at y 655..676 and has therefore always been 100% covered on
    mobile — hidden at `≤760px`, which matches what a member already sees rather than inventing
    a new placement for a 6.5px diagnostic label in an already-crowded corner.
  - Verified in headless Chromium with a touch context, A/B against `git show HEAD:` copies of
    all four files, hit-testing each control with `elementFromPoint` after removing the genesis
    intro overlay (geometry alone does not prove a control is reachable when six fixed widgets
    share a corner): **375px** 0/9 → 9/9 tappable, dock clipping gone; **414px** 0/9 → 9/9;
    **1280px byte-identical before and after** for all five widgets, so the desktop layout is
    untouched. A real `tap()` (not a synthetic click) on the search button opens the overlay and
    on the FR button sets `omega_lang=fr`; horizontal overflow at 375px stays 0; 0 page errors.
    `node --check` on all four, `check-inline-js.py` clean, `audit.py` 0 critical / 7 pre-existing
    warnings, 51/51 tests. No SQL/schema changes.
- **[Fixed] 19,754 controls across 177 pages were under the 24×24 CSS-px touch floor on a
  phone — now 349 across 55, a 98% reduction, all from shared files.** Found by measuring every
  `a[href]`/`button`/`input`/`select`/`textarea`/`[role=button]`/`[onclick]` at a real 375×667
  touch viewport across all 178 pages, rather than reading stylesheets. The count is dominated
  by a handful of shared sources, so almost all of it closed in four files:
  - **The mobile navigation drawer itself (14,514 + 2,008 instances).** Below 761px `nav.js`
    hides `aside.omega-side` entirely, so `#omega-drawer` is the *only* navigation a member has
    — and every one of its 82 `.ds-link` entries and 15 `.dss-head` section headings measured
    **21px tall** (`font-size:10px` with `padding:5px 4px`). Raised the padding to `9px 6px`
    plus `min-height:24px` (and `.dss-head` to `5px 2px`); text size deliberately unchanged, only
    the hit area grows. Measured after: 29px, 97/97 → 0 under the floor, drawer still opens from
    `.mob-menu-btn` and its links stay reachable by `elementFromPoint`.
  - **The shared topbar controls (~370 instances).** `omega-ui.js`'s injected prev/next arrows
    and `Ω CMD` dashboard link, and `bg.js`'s `.tnav-btn`, were 21–22px on every page carrying a
    `.topbar`. All three are built with inline styles, but `min-height`/`min-width` are not
    among the properties declared inline, so a stylesheet rule still reaches them — added a
    `≤760px` floor in each file rather than rewriting the inline strings.
  - **The legal footer links** (`omega-legal.js`, TERMS/PRIVACY/COMPLIANCE, on every page) were
    ~10px tall at their deliberate 7.5px fine-print size; given `display:inline-flex` +
    `min-height:24px` so the hit area grows without touching the type.
  - **The controls dock, revisited — and the earlier fix in this file corrected.** The `≤760px`
    rule added a few entries above lifted the dock clear of the nav bar by *shrinking* its
    buttons to fit one row, which took each control to ~20px: reachable, but under the touch
    floor. Fixing reachability by making targets too small to hit is not a fix. Root cause of
    the width pressure turned out to be a CSS detail worth recording: **`left:50%` with
    `width:auto` caps a fixed element's available width at `100% − left`, i.e. 50vw** — 187px on
    a 375px phone — which is why the original dock's 389px of content simply spilled past both
    viewport edges, and why it kept wrapping even with room to spare. Anchored both edges
    (`left:6px;right:6px;transform:none`) to give it the real viewport width, restored full-size
    buttons, and collapsed the seven language buttons into one compact `<select>` under 760px.
    Both controls are built every time and swapped by CSS, not by JS, so a rotate or resize needs
    no listener and they cannot desync; they share the same handler and each updates the other.
    Verified against `7ae8890` (the commit before any of this mobile work): **before** — dock
    x −7..382 in a 375px viewport (clipped), 9 controls at heights [20×7, 30, 30], **0/9** both
    ≥24px and tappable, overlapping `#omega-ded-widget` and `#omega-mob`; **after** — x 6..369,
    3 controls at [24, 26, 26], **3/3**, every neighbour clear. Selecting Arabic from the
    `<select>` at 375px and clicking the AR button at 1280px both give `omega_lang=ar`,
    `dir="rtl"`, a translated sidebar, and leave the select and the active button agreeing —
    0 page errors either way.
  The remaining 349 are page-local classes (`.filter-tag`, `.etag`, `.add-btn`, `.g-cat`, …)
  spread thinly over 55 pages — the same page-local-drift shape as §4.1's `.card` sweep and the
  `.tab-btn` font-size sweep, and the same kind of per-page work; not attempted here, where every
  fix was a shared file reaching all 178 pages at once.
- **[Fixed] The largest element on the dashboard has never rendered a single pixel, and
  `ecosystem.html`'s map neither.** Found with the new `scan.js canvas` detector, not by eye.
  `#galaxy-canvas` sizes itself from `cv.offsetWidth` at DOMContentLoaded — which is *before*
  bg.js's approval guard reveals `#app`/`.shell` (§3) — so it measured 0, set `canvas.width = 0`,
  and **a canvas with a zero drawing buffer can never paint anything**. Its `window.resize`
  listener would have recovered it, but revealing `#app` fires no resize event. Measured live:
  buffer `0x360` against a CSS box of `1286x360`, **0 pixels painted**. `ecosystem.html`'s
  `#eco-canvas` had the identical trap (`0x0` against `1242x458`). Same root cause as the
  skeleton-shimmer bug already in this file — measuring an element before the approval guard
  reveals it. Fixed with a `ResizeObserver` in each page, which fires whenever the element
  actually gets a size, whatever reveals it. After: `1286x360` / **5,944 px painted** and
  `1242x458` / **9,872 px painted**; the repo-wide canvas scan now reports **0** zero-buffer
  canvases, down from 2.
  - **Method note, because the first pass got this wrong:** the scan initially reported *seven*
    dead canvases, naming `account.html`, `pending.html`, `terms.html`, `enterprise.html` and
    `observatory.html` as well. Those five contain no `#galaxy-canvas` at all — with a signed-in
    session they **redirect to the dashboard**, and the scanner was labelling the dashboard's DOM
    with the filename it had requested. Only `dashboard.html` and `ecosystem.html` are real.
    `scan.js canvas` now records `location.pathname` after load and dedupes on it.
  - **Not a bug, recorded so it is not re-investigated:** `#omega-particles-canvas` reads blank at
    the 300x150 default on all ~178 pages. `omega-particles.js` hands it to tsParticles from a CDN
    the sandbox blocks, and it carries `opacity:0` until that loads — it works in production. The
    detector skips it by name. Eleven other canvases paint nothing at load
    (`#an-chart-auth`, three `#bg-canvas`, `#cipher-wave`, …); several plausibly have no data to
    draw under the Supabase stub, so they are flagged as candidates, not asserted as bugs.
- **[Improved] The topbar emblem, on 161 of 173 pages, was a faint arc that barely registered.**
  With the galaxy fixed it was clear the platform's persistent mark was the weaker of the two.
  `emblem.js` was already well built — five motifs, pointer parallax, reduced-motion safe — and
  each page's motif is deliberately different (`omega-page-emblem.js`'s own header explains why:
  "forty pages spinning the same shape says nothing about any of them"), so nothing about the
  per-page motifs was touched. Added a *shared armillary frame* drawn underneath every motif, so
  the mark reads as one instrument platform-wide while each page keeps its own identity inside
  it: a fixed outer bezel, twelve zodiac ticks with every third longer and brighter so the
  twelve-fold structure reads at 64px, and one counter-rotating scan arc in the page's own accent
  colour. All three freeze under `prefers-reduced-motion` (the existing `ti` pin already handles
  it). Painted coverage of the 64x64 mark went **5.8% → 13.1%**, verified by reading the real
  pixel buffer and by screenshotting the element before and after.
  - Coverage was measured rather than assumed, and the assumption would have been wrong:
    `emblem.js` requires a `.topbar`, and **`dashboard.html` has none**, so the emblem never
    renders there — 162 of 173 rendered pages have one, 161 get the emblem. The mark visible on
    the dashboard is `omega-page-emblem.js`'s separate `[data-page-emblem]` canvas.
  - The galaxy's own visual language was raised in the same pass, now that it paints at all: its
    orbit rings were at `.04` alpha and its node-to-core links at `.02` — both invisible, so the
    field read as scattered dots rather than a system. Rings are now dashed at `.2`, links at
    `.055`, plus a slow radar sweep, a twelve-tick armillary ring around the core, and
    phase-offset node breathing. Motion is frozen under `prefers-reduced-motion` by pinning the
    time counter, so the full structure still draws — it just stops moving.
- **[Fixed] `color-scheme` was never declared, so every native control on the platform rendered
  light-mode chrome on a near-black page.** Found by auditing this repo against the Web Interface
  Guidelines (`vercel-labs/web-interface-guidelines`, reached via `vercel-labs/agent-skills`),
  adapted to a no-build vanilla-HTML stack — see the new `.claude/skills/interface-guidelines`
  skill for which upstream rules transfer and which are React/Next/Tailwind-only and must not be
  imported. Measured at runtime across all 173 rendered pages: `color-scheme` resolved to
  `normal` on **173 of 173**, meaning the browser drew its own UI light — every scrollbar, every
  date/time picker, and **312 native `<select>` elements across 172 pages**. Fixed with one
  declaration on `:root` in `bg.js`, which reaches every page. Verified A/B against `HEAD`:
  `color-scheme: dark` 0/6 → 6/6 on a sample, and `<select>` elements now inherit it. The single
  page still reporting `normal` is `offline.html`, which deliberately loads no `bg.js` so it works
  with no network — correct, not a miss.
  - `touch-action: manipulation` added in the same block for `a[href]`, `button`, `[role=button]`,
    `label`, `summary`, `select` and checkbox/radio inputs — only 2 occurrences existed
    platform-wide, so nearly every control carried the 300 ms double-tap-zoom delay on a phone.
    Verified: computed `touch-action` on a button goes `auto` → `manipulation`.
  - **8 icon-only controls across 5 pages had no accessible name** — `command.html`'s three
    priority toggles (empty `<button>`), `budget.html`'s month steppers (`◂`/`▸`),
    `targets.html`'s quarter steppers (`◀`/`▶`) and its templated delete button (`✕`),
    `weekly.html`'s remove-win and `workout.html`'s remove-set buttons. A screen reader announced
    "button" with no name for a *delete* action. All given `aria-label`; the scan now reports 0.
  - **Two of the findings were false, and measuring is what caught them.** A source grep claimed
    `<meta name="theme-color">` was missing on 121 pages and that 131 bare `outline:none`
    declarations had no focus replacement. Rendering the pages showed `bg.js` injects the meta tag
    (172/173) and a global `:focus-visible` rule in `omega-ui.js` covers the outlines (172/173).
    Neither was a bug. A third false positive was in the new scanner itself: its icon-only rule
    flagged any control under 3 characters, which caught score buttons labelled `1`–`10` — those
    are correctly named. The rule now flags only empty labels or pure-symbol glyphs.
  - **`transition: all` left open on purpose.** The scan reports it on all 173 pages, but only
    **2 literal instances** existed in shared code (one fixed, on `.tnav-btn`). The rest come from
    the `transition:.2s` shorthand, which implicitly sets `transition-property: all` and is a
    pervasive idiom throughout this codebase. Rewriting it across ~250 pages risks silently
    killing transitions that currently work, for a performance/polish gain — recorded as debt,
    not swept.
- **[Fixed] The danger colour was effectively invisible, and KPI tiles were 64% empty — both found
  by running the `dataviz` skill's palette validator and measuring tiles, rather than by eye.**
  - **`--crim` re-stepped.** `scripts/validate_palette.js` scored the platform's categorical
    tokens against the real dark surface: **CVD separation PASSES** (worst adjacent pair
    `#3fb27f`↔`#00E5FF`, deutan ΔE 18.9 / normal 19.6 — the gold/cyan/green/purple set is
    genuinely colourblind-safe, worth knowing and not re-deriving), but `--crim:#8B0000` came
    back at **1.74:1 contrast against the surface**, i.e. barely visible on near-black. That
    token is used 191 times via `var(--crim)`, and **77 of those are text `color`** — a real
    legibility failure, not a style preference. Re-stepped to `#C4453C`, the deepest crimson
    that still clears 3:1, re-validated (contrast now PASSES for all slots, CVD separation
    unchanged). Only the token was changed: the 118 raw `#8B0000` literals were deliberately
    left alone, because a raw dark red used as a *background fill* should stay dark and a
    blanket sweep would have lightened those wrongly.
    The validator's remaining "lightness band" FAIL on gold/cyan/green is a design-intent
    difference, not a defect — those are deliberately luminous brand accents on a near-black
    UI, and the band assumes a neutral chart surface. Desaturating the brand to satisfy a
    linter would be the wrong trade; recorded rather than "fixed".
  - **KPI tiles composed instead of pooled.** `.kpi-row` is a grid, so every tile stretched to
    match the tallest — the authority gauge. Measured on `dashboard.html`: six tiles were 188px
    tall carrying 67px of content, leaving **121px (64% of the card) empty** with everything
    pooled at the top. Fixed in two parts, both layout-only: `.kpi` is now a flex column with
    its `.kpi-sub` caption pinned to the bottom edge, and `.kpi-row` gets `align-items:start`
    so a short tile is no longer stretched to a tall neighbour's height. Across
    `dashboard`/`vault`, total dead space went **890px → 255px (−71%)**, worst single tile
    **121px → 17px** (17px is the padding, i.e. correct). `vault.html` improved too without
    being touched.
    No sparkline or trend badge was invented for the empty space: there is no historical series
    behind counts like ACTIVE MEMBERS or TASKS TODAY, and drawing one would have been
    fabricating data — the same failure mode as a success toast over a write that never
    happened (§9).
  - Correction: this file previously said `.trend`/`.sparkline` are "not yet used by any page".
    **5 pages use them.** Stale, corrected here.
- **[Fixed] The last 345 undersized touch targets, across 55 pages — closed by measuring at
  runtime rather than by 55 page edits.** The shared sources (mobile nav drawer, topbar
  controls, legal footer, controls dock) were fixed at source in an earlier entry; what remained
  was ~40 distinct PAGE-LOCAL classes (`.filter-tag`, `.etag`, `.add-btn`, `.g-cat`, `.flt`,
  `.tool-btn`, `.era-dot`, `.area-sl`, …) spread thinly over 55 pages, plus bare
  `<button>`/`<input>`/`<div onclick>` with no class to select at all. Added section **E2** to
  `omega-a11y.js`: at ≤760px it measures every interactive element and applies
  `min-height`/`min-width:24px` only to the ones actually under the WCAG 2.5.8 floor. An element
  whose computed `display` is `inline` is switched to `inline-flex` first, because `min-height`
  does not apply to a non-replaced inline box — and *only* those, since turning a block or grid
  child into inline-flex would wreck the layout around it.
  - **Deliberately not done with a `::before`/`::after` hit-area overlay**, the other standard
    technique for this. §4.1 documents ~230 page-local classes carrying their own
    `::before`/`::after` rules, and a pseudo-element renders one rule's declarations only — an
    overlay would have silently replaced those pages' own decoration. `min-height`/`min-width`
    cannot collide that way.
  - **A first pass left 9 stragglers on 4 pages, all reporting `data-omega-touch` absent** —
    `cipher.html`'s and `realm.html`'s element pickers, `oath.html`'s category buttons and
    `rune.html`'s action button are built by JS *after* both `DOMContentLoaded` and
    `omega:populated`, so they did not exist when the pass ran. Added a debounced
    `MutationObserver` (300 ms, ≤760px only, every handled element marked so re-runs skip it).
  - **345 → 0** across all 178 pages, verified with the same `scan.js taps` command before and
    after. The zero was checked rather than trusted: an identical "0 across 0 pages" earlier in
    the session turned out to be a dead scan against a stopped server, so this run was confirmed
    with `scan.js errors` reporting 5 real pages rendered on the same server.
  - **Visual change worth stating plainly**: `input[type=range]` sliders (`.area-sl` and
    friends) went from hairline tracks to 24px ones. A hairline slider is very hard to hit on a
    phone, so this is the accessibility win working — and the result reads as a filled meter,
    consistent with the platform's existing `.bar-track`/`.bar-fill` components. Confirmed by
    before/after screenshots at 375px: layout intact, horizontal overflow 0 in both.
- **[Improved] The two emblem systems now share one visual language.** The platform draws two
  separate marks — `emblem.js` in the topbar (161 pages, given a shared armillary frame in an
  earlier entry) and `omega-page-emblem.js` via `[data-page-emblem]` (160 pages) — and they had
  no vocabulary in common: the page mark was a plain ring with N pulsing points, chords and a
  rotating triangle. Gave it the same bezel + twelve zodiac ticks (every third longer and
  brighter) + counter-rotating scan arc, scaled to its radius. Each page's own point count,
  glyph and accent colour are untouched — that per-page identity is this module's whole stated
  purpose ("forty pages spinning the same shape says nothing about any of them") — but they now
  sit inside one recognisable instrument. Painted coverage of the 264x264 buffer went
  **7.9% → 9.9%**, verified by reading the real pixel buffer and by screenshotting the canvas
  before and after with the fixed chrome removed (the first capture was obscured by the controls
  dock and the keyboard hint, which sit over that region). Frozen under
  `prefers-reduced-motion`, since `t` never advances there.
- **[Diagnosed + Fixed] The failing CI check is a runner that is never assigned — and separately,
  4 of the workflow's own advisory steps had been failing every run, one of them 98% noise.**
  Asked to focus on the failing PR check, the diagnosis was taken past "0 billable ms" to the
  job object itself. `list_workflow_jobs` on a passing run (344, `main` @ `aab8838`) versus a
  failing one shows the difference plainly: the passing job carries
  `runner_id: 1000015220`, `runner_name`, `runner_group_name` and **24 steps** beginning with
  "Set up job"; the failing job has **no runner fields at all and no `steps` array**, with
  `started_at` → `completed_at` two seconds apart. The job is created and killed before step 1
  can begin, so no repository code is ever executed and no code change can affect it. This is
  billing/enablement (Settings → Billing → Actions spending limit, or Settings → Actions →
  General), confirmed further by the same commit passing in 53s and later failing in 4s.
  `.github/workflows/ci.yml` parses cleanly and `verify` is its only job, so the workflow file
  itself was never the problem.
  - **Every step run locally: all 11 BLOCKING steps pass.** The suite would go green the moment
    a runner picks it up. Extracted the `run:` blocks straight from the workflow rather than
    approximating them, so this tests what CI actually executes.
  - **Three changes that cut minute burn**, which matters if the cause is exhausted included
    minutes: a `concurrency` group so a PR pushed to repeatedly supersedes its own in-flight
    runs instead of running the suite to completion once per push (scoped with
    `cancel-in-progress: ${{ github.event_name == 'pull_request' }}` so a run on `main` — the
    record for a merged commit — is never cancelled); `timeout-minutes: 15` on a job that
    finishes in ~55s, so a hang cannot hold a runner for GitHub's 6-hour default; and an
    `actions/cache` of `~/.npm`, because Prettier and ESLint are fetched with `npx --yes` and
    were measured at **23s and 4s of a 53s run** — half the job, for two steps that only report
    drift. `setup-node`'s own `cache: npm` was deliberately NOT used: there is no
    `package-lock.json`, and it errors out without one, which would have turned a green run red
    once runners returned.
  - **`scripts/schema-dictionary.py` was reporting 892 "column does not exist" findings, of
    which essentially all were false.** It is `continue-on-error`, so it has been exiting 1 on
    every run, unread — a checker that cries wolf is one nobody looks at, and that is precisely
    what happened. Six parser bugs, each verified against the real SQL before fixing:
    1. **Multi-column `ALTER TABLE`** — the pattern anchored `ADD COLUMN` directly to
       `ALTER TABLE`, capturing only the first column. `profiles.membership_tier` (real, in 32
       files) was reported missing against `bg.js` for this reason. `IF NOT EXISTS` was also
       required, so plain forms were missed.
    2. **Nested jsonb keys read as columns** — `.insert({…})` was captured with `\{([^}]+)\}`,
       which stops at the FIRST `}`. For `omega-sovereign-os.js`'s
       `metrics:{ lcp, fcp, ttfb, load }` that meant the inner keys were checked as top-level
       columns of `platform_events`. Replaced with brace-matched extraction plus depth-aware
       key parsing.
    3. **Unbounded search window** — each `.from()` scanned the entire rest of the file, so
       every table was blamed for every `.select()` appearing later anywhere in it (this is why
       `profiles` was reported missing `activity_type` and `title`, which belong to
       `activity_feed`). Now bounded to the next `.from()`.
    4. **`*` and embedded resources** counted as columns.
    5. **SQL comments corrupting the column split** — `activity_feed`'s
       `activity_type text NOT NULL,  -- 'task_complete','gate_unlock',…` has commas inside the
       comment, so the split lost the real column that followed (`title`), which was then
       reported missing against five files that all read it correctly. Same bug class CLAUDE.md
       had already recorded for a different scanner, never fixed in this one. Comments are now
       stripped quote-aware before parsing, and the body is split only on **top-level** commas,
       since `CHECK (x IN ('a','b'))` has the same effect.
    6. **Incomplete type list** — plain `timestamp` was absent (only `timestamptz` was listed),
       so every column declared with it vanished, taking
       `council_deliberations.created_at`/`completed_at` and `sovereign_events.id` with it.
       Replaced with a longest-first list including serial/char/float/decimal/json/bool.
    Plus a documented `KNOWN_LIVE_COLUMNS` allowlist for `task_completions`'
    `kind`/`task`/`axis`/`increment`, which §8 already records as live in production but present
    in no `CREATE TABLE` in this repo. Result: **892 → 10 findings**, parsed columns 995 → 1008.
  - **The 10 survivors are real, and 5 of them are genuine column-name bugs that were invisible
    under the noise** — `graph_entities.verified` and `graph_relationships.confidence`/
    `.verified` are **writes** from `graph-admin.html` against columns that do not exist (the
    tables have `confidence_score` and `strength`), and `intelligence.html` reads
    `graph_events.created_at`/`entity_name` where the table has `occurred_at`/`recorded_at` and
    `entity_id`. Not fixed here: choosing between `occurred_at` and `recorded_at`, or deciding
    whether `verified` should be added as schema versus the code using a different column, is an
    intent question, and this file's own rule is not to guess at it. The remaining 5 are the
    already-documented `map.html` geolocation gap (4) and `task_completions.labor_id`, which
    cannot be confirmed without live schema access.
- **Clean re-verification sweeps run this session, recorded because a clean result is
  evidence too**: a full 178-page runtime-error crawl with the authenticated stub (only 3
  uncaught errors, all of them sandbox artefacts — `d3`, `Leaflet` and `three.js` are CDN
  libraries the sandbox's egress policy blocks, so they'd resolve in production; 0 real page
  errors, 0 real unhandled rejections), and a live-DOM duplicate-id scan across all 178 pages
  (4 duplicated ids on 1 page, none of them referenced by any `for=`/`aria-labelledby`/
  `aria-describedby`/`aria-controls`/`href="#…"`). The duplicate-id scan matters specifically
  because this session wired `aria-labelledby` to generated ids — a duplicate would have
  silently pointed a control at the wrong label.
- **Two stale figures in this file, corrected against actual command output**: `scripts/audit.py`
  reports **7** pre-existing warnings, not 6 (confirmed by stashing all changes and re-running —
  the baseline is 7 both with and without this session's work), and
  `python3 -m unittest discover -s scripts/tests` runs **45** tests, not 25. Several entries above
  still cite "0 critical / 6 pre-existing warnings" and "25/25 pass" from when those numbers were
  accurate; they are left as written since they were true at the time, but 7/45 is the current
  baseline to compare against.
- **[Fixed] The 5 real findings the de-noised schema checker surfaced — 3 write/read bugs in the
  knowledge-graph pages, plus a `task_completions` column that has never existed — and one
  fabricated-data bug found while fixing the last of them.** The `scripts/schema-dictionary.py`
  parser fixes in the entry above cut it from 892 findings to 10; 5 of those were the already-
  documented `map.html` geolocation gap and an unconfirmable one, and the other 5 were real. Each
  was checked against the actual `CREATE TABLE` before touching anything:
  - **`graph-admin.html`'s two verify buttons wrote a column that does not exist, inside a
    `try/catch` that could never fire.** `verifyEntity()` wrote `{confidence_score, verified}` to
    `graph_entities` and `verifyRelationship()` wrote `{confidence, verified}` to
    `graph_relationships` — but `omega_graphify_schema.sql` gives neither table a `verified`
    column, and `graph_relationships`'s strength column is `strength numeric(3,2)`, not
    `confidence`. PostgREST rejects the whole update when any column is unknown, and the Supabase
    client resolves to `{data:null,error}` rather than throwing, so the `try/catch` wrapped around
    both calls never caught anything: the update was discarded in full (so `confidence_score` /
    `strength` were never written either) and the panel reloaded as though the entity had been
    verified — the exact silent-failure shape §9 exists to prevent. Fixed all three parts:
    `confidence` → the real `strength`, an explicit `.error` check that now shows the failure
    instead of a false success, and `supabase/omega_graph_verified_fix.sql` to add the `verified`
    column the feature was written against (idempotent `ADD COLUMN IF NOT EXISTS` + a
    `(user_id, verified)` index matching how both tables' RLS already scopes). **Not applied to
    the live database** — the Supabase connector is unauthorized in this session.
  - **`intelligence.html` read two columns `graph_events` does not have.** It selected
    `entity_name` (no such column; the table carries `entity_id`, a foreign key) and
    `created_at` (the real columns are `occurred_at NOT NULL` and `recorded_at DEFAULT now()`),
    and ordered by the latter — so the activity log has always rendered empty. Fixed with a
    PostgREST embedded resource, `graph_entities(display_name,canonical_name)`, which resolves
    the real entity name through the existing foreign key rather than inventing a denormalised
    column, and `occurred_at` for both the select and the order (chosen over `recorded_at`
    because it is the NOT NULL "when it happened" column, not the bookkeeping timestamp).
  - **A false positive the embed fix then introduced in the checker itself, caught and fixed.**
    The select-field parser split on every comma, so `graph_entities(display_name,canonical_name)`
    was torn into two fragments and the trailing `canonical_name)` was reported as a missing
    column of `graph_events`. The existing guard (`"(" in field`) could not catch it — that
    fragment has only the closing paren. Fixed by splitting with the file's own paren-aware
    `_split_top_level()` rather than `.split(",")`, so an embedded resource stays one field and
    the existing guard skips it correctly. Findings: 10 → 5.
  - **`omega-hercules.js` queried a `labor_id` column that exists nowhere, via a client accessor
    that is never set, using a query shape that returns nothing — three independent bugs, so both
    its database functions have always returned their zero value.** (1) `task_completions` has no
    `labor_id` column in any definition in the SQL bag, and none live per this file's own
    `complete_task()` entry. (2) Both functions guarded on `window.sb`, which **nothing in this
    codebase ever assigns** — bg.js exposes the client as `window.OmegaSB.get()` — so each
    returned early before reaching the network regardless. (3) `getOverallProgress()` passed
    `{count:'exact', head:true}`, which by design returns `data:null`, then mapped over
    `data ?? []` — so it would have reported 0% even on a fully successful query. Rewritten
    against columns that exist, using the platform's own live convention: `task_type='labor'`,
    `task_name='labor-<id>'`, recorded through the already-verified `complete_task()` RPC (which
    dedups on `(user_id, task_name)`), with a `getSB()` helper that resolves `OmegaSB` and a
    `completedLaborIds()` that returns `{ids, error}` so a caller cannot mistake a failed query
    for an empty result.
  - **`hercules.html` displayed `Math.floor(Math.random() * 100)` as each labor's completion
    percentage** — a fabricated number, different on every page load, presented to the member as
    their own progress. Worse than a false success toast, which at least corresponds to an action
    the member took. Replaced with real recorded state: each labor reads completed or not (the
    table records completion, not partial progress, so a per-labor percentage would be inventing
    precision the data does not have), and the only percentage on the page is the genuine N-of-12
    figure. Added a MARK COMPLETE action — the page's own copy already states its purpose as
    "track your own labors", so this implements written intent rather than inventing product
    behaviour — wired to `complete_task` with a real `.error` check and an honest failure
    message. It deliberately passes `p_points: 0`: `complete_task` advances an axis by that
    amount, and deciding what a Hercules labor is worth against knowledge/self/contribution is a
    progression-balance decision for the owner, not one to guess at (it remains a one-number
    edit). The page's own duplicate copies of the 12 labors and 12 themes were deleted in favour
    of the module's — they had already drifted (the module had ids and no descriptions, the page
    had descriptions and no ids), the same two-divergent-copies bug class this file documents at
    length for `SIGN_ELEM`.
  **Verified in real headless Chromium, A/B against the pre-fix files pinned from git**, driving
  the page through a client that rejects unknown columns the way PostgREST does, seeded with two
  real completions (`labor-lion`, `labor-hydra`): **before** — 12 cards showing fabricated
  percentages that changed between two renders of the same page (`83% → 65%`, `24% → 92%`), 0 of
  the 2 seeded completions shown, no overall figure at all, and the module reporting `progress: 0`
  with no `completedLaborIds` on its API; **after** — "2 / 12 LABORS COMPLETE", exactly the two
  seeded labors marked complete, `ids: ["lion","hydra"]`, `progress: 17`, identical across
  re-renders, and a real click on a third labor issuing `complete_task({task_name:'labor-hind',
  task_type:'labor'})` and re-rendering to "3 / 12". 0 page errors in both runs. The failure path
  was verified separately against a client whose read fails: the page shows
  `COULD NOT LOAD YOUR RECORD — column "x" does not exist` and hides the action buttons rather
  than rendering "0 / 12", since an empty set means "none completed" only when the query actually
  succeeded. Full local CI re-run clean afterward: `node --check` on every root `.js`,
  `check-inline-js.py` clean, `audit.py` 0 critical / 7 pre-existing warnings (unchanged),
  51/51 self-tests, 0 broken asset references, service-role scan clean, `sw.js` precache and
  manifest icons both intact.

- **The `localStorage`-only persistence gap is 48 pages, not the 7 finance
  pages CLAUDE.md §8.2 recorded — and 43 of them have no export path.**
  Not a fix; a measurement, and the reason a new scanner
  (`scripts/evidence-audit.py`) now exists instead of another prose audit.
  §8.2 documented `wealth`/`wallet`/`treasury`/`revenue`/`investment`/
  `expenses`/`budget` as a deliberate decision — sensitive data, hard to walk
  back once it lives server-side — mitigated by `omega-local-backup.js`
  export/import. That decision stands for those 7. What was never measured is
  how far the same shape spread: scanning every page for a `localStorage
  .setItem` with no `.from()`/`.rpc()`/Edge-Function call finds 48
  (`python3 scripts/evidence-audit.py --summary` → `LOCAL_ONLY 48`), of which
  exactly 5 reference `OmegaLocalBackup` (`budget`, `expenses`, `revenue`,
  `wallet`, `wealth`). The other 43 — `achievements.html`, `notes.html`,
  `projects.html`, `passport.html`, `targets.html`, `mood.html`,
  `reading.html`, `workout.html`, `vocabulary.html` and 34 more — hold member
  data with no server copy and no way to export it. The 5 pages carrying
  that export path are exactly the 5 finance pages that classify
  `LOCAL_ONLY`; the other two of the original 7 (`treasury.html`,
  `investment.html`) each make one Supabase call and so classify `PARTIAL`
  — Postgres *and* a parallel browser copy, a quieter version of the same
  problem that 24 pages are in.
  **False-positive pass, because the raw number would otherwise mean nothing
  (CLAUDE.md §8.4).** The obvious way to be wrong here is a page that persists
  through a shared module rather than its own call, which the per-page scan
  would miss. `omega-chrono.js:121`, `omega-matrix.js:58` and `omega-user.js:244`
  do exactly that for their own state, so the risk is real — but grepping all
  48 pages for every persisting global those modules publish
  (`OmegaMatrix`, `OmegaChrono`, `omegaCompleteTask`, `omegaProgress`,
  `omegaTaskButton`, `OmegaLocalBackup`) returns 0 hits for anything except the
  5 `OmegaLocalBackup` pages above. No generic localStorage→Postgres sync
  exists; the 43 are genuinely unpersisted.
  Two further scanner bugs were caught the same way and are covered by
  regression tests in `scripts/tests/test_evidence_audit.py`: SQL comments were
  being matched as DDL (`-- create table for …` produced phantom tables named
  `for`, `is`, `above`, `alone`, `bodies`, inflating the duplicate-definition
  count to 52 against `audit.py`'s correct 47), and Supabase Auth calls were
  not counted as backend contact, which classified `reset.html` — a page that
  is entirely an auth operation, and complete — as making no backend call at
  all. Both fixed; the two tools now agree at 47.
  Verified: `./scripts/ci-local.sh` all 10 blocking checks pass,
  `python3 -m unittest discover -s scripts/tests` 58/58 (51 pre-existing + 7
  new), `audit.py` 0 critical / 7 pre-existing warnings unchanged,
  `context-budget.py` CLAUDE.md ~13,546 / 16,000.
  **Still unverified, and deliberately left that way:** whether the live
  database matches any of this. The Supabase MCP server required
  authentication this session and none was available, so no table, column,
  `GRANT` or policy was checked against production. `EVIDENCE_MATRIX.md`'s
  UNVERIFIED section lists what that leaves open, including a live conflict
  between two committed docs — `MIGRATION_STATE.md:5` states "All migrations
  synchronized. No pending conflicts." while `CLAUDE.md:532` records the
  migration sequence as validated against a blank database only. Nothing in
  this session can break that tie.

- **The 43-page persistence gap now has a fix, shipped dormant:
  `public.member_state` + `omega-member-state.js`.** The measurement above said
  43 pages hold member data with no server copy and no export path. This is the
  server side of that: one row per `(user_id, key)`, RLS scoped to
  `auth.uid()`, and — the part that has bitten this repo hardest — an explicit
  `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` alongside the
  policies, since a grant is checked *before* row security and a policy without
  one never runs (CLAUDE.md §8.1 class 6).
  **Verified against a real PostgreSQL 16, not by reading the SQL.** A scratch
  cluster with a minimal Supabase-shaped scaffold (`anon`/`authenticated`
  roles, `auth.users`, `auth.uid()` reading `request.jwt.claims`) ran the file,
  then five assertions: member A sees 1 row while the privileged role sees 2
  (equal counts would have meant RLS was not scoping at all — the check
  CLAUDE.md §8.4 insists on); A inserting a row attributed to B raises
  `new row violates row-level security policy`; the same `(user_id, key)`
  upserted twice updates in place with no `23505`, because the conflict target
  *is* the primary key (class 7); `anon` raises `permission denied`. Re-running
  the file is idempotent and the seeded row survives.
  **The first version of these tests was worthless and said so loudly.** Written
  without transaction blocks, every `SET LOCAL role` was a no-op — psql warned
  `SET LOCAL can only be used in transaction blocks`, every statement ran as
  superuser (which bypasses RLS regardless), so "member A" saw 2 rows, the spoof
  insert "succeeded", and `anon` "read" 3 rows. Wrapping each case in
  `begin/commit` produced the real results above. A permission test that runs as
  superuser proves nothing and looks like a pass.
  **`bg.js` regression, caught only in the browser.** `window.OmegaSB.get()`
  returns a *promise*, not a client (`bg.js:190-206`). The first draft used it
  synchronously, so `client.auth` was `undefined` and every page threw
  `Cannot read properties of undefined (reading 'getSession')`:
  `scan.js errors` went from the documented baseline of 3 pages to **177 of
  178**. `node --check` passed the whole time. Fixed by resolving the promise
  and tolerating its rejection (the sandbox blocks esm.sh, and a real network
  can too); the scan is back to 3, and those 3 are the known CDN-blocked pages
  (`graph.html` d3, `map.html` Leaflet, `realm.html` three.js).
  **Named `omega-member-state.js`, not `omega-state.js`.** That filename was
  already taken by an unrelated module — a UI component state machine owning
  `window.OmegaState` — which `bg.js:1610` already injects. An earlier draft
  overwrote it and added a second injection; both were reverted with
  `git checkout HEAD --` and the new module took a distinct filename, guard
  attribute (`data-omega-member-state`) and global (`window.OmegaMemberState`).
  Check `git cat-file -e HEAD:<path>` before creating a file whose name follows
  an obvious convention — in a repo with 90 `omega-*.js` modules the obvious
  name is usually taken.
  **It is a mirror, not a sync, and that is a safety decision.** Data moves up
  only; restore is an explicit call. A hydrating two-way sync would race each
  LOCAL_ONLY page's synchronous render — the page paints from an empty cache,
  the member edits what they see, and that empty-derived write overwrites good
  server data, losing real data to a feature meant to prevent exactly that.
  It also polls and diffs rather than wrapping `localStorage.setItem`:
  patching `Storage.prototype` would mutate a global for all 178 pages,
  including the ~130 this module has no business touching.
  **Failure path verified, not assumed.** Against a client stubbed to return
  PostgREST's `42P01`, the module disables itself, reports
  `disabled: 42P01 relation "public.member_state" does not exist (has
  supabase/omega_member_state.sql been applied?)`, leaves `lastSync` **null**
  rather than claiming a success it did not get (class 1), returns the error
  from `restore()`, and leaves the page's own `localStorage` byte-identical.
  The harness's *default* stub returns a fake success, so an early run showing
  `lastError: null` proved nothing — that reading was discarded rather than
  reported.
  **Not applied to production.** `apply_migration` against the live project was
  permission-blocked, so `member_state` does not exist yet and the module is
  inert by design until someone applies
  `supabase/omega_member_state.sql` (or `migrations/0095_omega_member_state.sql`,
  byte-identical). `types/database.types.ts` already regenerated to include it
  via the repo's own `types-from-schema.py`.
  **Live database facts established the same session** (project
  `ydqhzvvoyufiiqvzcjns`, confirmed as production by 21 client references):
  190 base tables and 5 views live against 118 declared in `supabase/`;
  **194** policies, not the 398 quoted in an earlier brief; 9 profiles.
  `transactions` and `wallet_balances` genuinely do **not** exist live,
  confirming `subscriptions.html:224` and `vault.html` as real silent
  empty-states rather than a repo/live drift. `top_pages` *is* a live view, so
  classifying it as an undefined relation would have been a false positive.
  `check_gate` — which `audit.py` flags as called by `omega-guardian.js` but
  never `CREATE FUNCTION`'d anywhere in `supabase/` — **does exist live**, so
  that warning is a source-of-truth gap in the SQL bag, not a broken call.
  Full local CI re-run clean afterward: all 10 blocking checks, `audit.py`
  0 critical / 7 pre-existing warnings (unchanged).

---

## Close the unauthenticated RPC surface: 23 anon-callable SECURITY DEFINER functions → 2

**Found:** Supabase security advisor on project `ydqhzvvoyufiiqvzcjns`, 2026-08-24:
205 findings, of which `anon_security_definer_function_executable` × 23 and
`function_search_path_mutable` × 5.

`anon` is the role the publishable key maps to, and that key ships in client
code by design (`bg.js`). Anything `anon` can EXECUTE is reachable by anyone on
the internet at `POST /rest/v1/rpc/<name>` with no account, on an otherwise
invite-gated platform.

Querying `pg_proc` for an internal guard (`is_platform_owner` / `auth.uid()` /
`auth.role()` anywhere in the body) split the 23 into 13 guarded and **10 with
no authorization check of their own**:

| function | why it mattered |
|---|---|
| `notify_member(p_user_id, p_type, p_message, p_content)` | writes a notification with attacker-chosen body to any member id — phishing inside the platform's own trusted UI |
| `upsert_graph_entity(p_user_id, …)` | takes the owning user id as a parameter; unauthenticated write-as-anyone |
| `add_graph_relationship(p_user_id, …)` | same shape |
| `log_evolution(p_axis, p_note)` | unauthenticated arbitrary row insert |
| `order_stats()` | commerce aggregates to unauthenticated callers |
| `_notify_approved`, `_notify_owner_member_approved`, `_notify_owner_member_rejected` | trigger functions, directly REST-callable |
| `get_platform_flag`, `public_leaderboard` | flag values / leaderboard to anon; only callers are gated pages |

`upsert_graph_entity` and `add_graph_relationship` were additionally
`SECURITY DEFINER` with a mutable `search_path` — the classic definer-privilege
escalation shape.

**The mistake worth recording.** The first draft wrote
`REVOKE EXECUTE … FROM anon`. Run against live inside a transaction, the
verification query came back **completely unchanged at 24** before rollback.
The privilege was never granted to `anon` individually — it was granted to
**PUBLIC** on `CREATE FUNCTION`, and `anon` merely inherits it, so revoking from
`anon` removes a grant that does not exist and silently does nothing. This is
CLAUDE.md §8.1 class 6(a) from the other direction, and it is why an earlier
pass (`migrations/20260818000551_…`) that revoked 70 of these saw 23 return:
every `CREATE OR REPLACE FUNCTION` re-grants PUBLIC.

**Fixed** in `supabase/omega_anon_execute_hardening.sql` (+ `migrations/0096`),
applied live 2026-08-24: revoke from `PUBLIC`, then grant back per **actual
caller**, each checked in this repo first — `authenticated` for the gated-page
callers (`order_stats`, `public_leaderboard`, `get_platform_flag`,
`get_all_members`, `complete_task`, `check_gate`, `record_interest_signal`) and
the owner-guarded membership functions (`approve_member`, `reject_member`,
`revoke_member`, `grant_permanent_access`), `service_role` only for the
Edge-Function-invoked ones (`queue_weekly_digest`, `send_weekly_digests`), and
**nothing at all** for the four unguarded functions with no caller anywhere.
Five functions had `search_path` pinned to `public, pg_temp`.

**Deliberately left reachable by `anon`** — the two remaining:
- `report_client_error` — `bg.js` installs the error reporter on every page
  including the public ones; revoking blinds error reporting exactly where a
  signed-out member hits a problem. It has its own guard.
- `is_platform_owner` — called from inside RLS policies across the schema.
  Policy evaluation runs in the caller's role, so revoking risks breaking policy
  evaluation for anonymous requests rather than merely denying an RPC. It
  already returns false for anon.

**Verified:**
- Whole script run against live inside `BEGIN … ROLLBACK` first, asserting the
  end state per function before anything was committed.
- Post-apply, live: `anon_secdef_remaining` **2** (was 23),
  `secdef_mutable_path` **0** (was 5).
- Per-function grants confirmed: `notify_member`/`upsert_graph_entity` reachable
  by no role; `approve_member`/`get_all_members`/`complete_task`/`order_stats`
  still `authenticated`; `send_weekly_digests` `service_role` only.
- No signed-out surface calls a revoked function — `account`, `enter`, `reset`,
  `terms`, `pending`, `404`, `offline`, plus `bg.js` and `nav.js`, all clean.
- `scripts/audit.py` 0 critical / 7 warnings; `./scripts/ci-local.sh` 10/10;
  browser error scan 3/178, the documented CDN-blocked pages, unchanged.

**Still open:** `authenticated_security_definer_function_executable` × 93 — a
separate decision, recorded in CLAUDE.md §8.2. Also
`auth_leaked_password_protection`, which is a dashboard toggle no SQL can reach.

---

## The other 93 advisor findings: three real, ninety already guarded

**Context:** after the anon pass above, the security advisor still reported
`authenticated_security_definer_function_executable` × 93.

**What the number actually was.** The advisor reports every SECURITY DEFINER
function `authenticated` can execute; it cannot see an internal guard, so the
count reads far worse than the exposure. Reading the real bodies on production,
the owner-sensitive ones already guard themselves — through
`public.omega_is_owner()` rather than `is_platform_owner()`:

```
get_pending_requests():
  if not public.omega_is_owner() then
    raise exception 'Not authorised.' using errcode = '42501';
```

A first-pass classifier here searched only for `is_platform_owner`,
`auth.uid()` and `auth.role()`, and so reported `get_pending_requests` (which
returns pending access requests) and `engagement_report` (which returns member
emails) as unguarded. **Both are fine.** Caught by reading the bodies instead of
trusting the label — CLAUDE.md §8.4, "classifying a policy by substring is not
reading it", now demonstrated for functions too.

Of the genuinely unguarded remainder, most are unguarded deliberately and have
real callers: `published_dispatches` (body is `WHERE is_published = true`),
`public_leaderboard`, `order_stats` (aggregate counts only), `get_platform_flag`.
Revoking those would break member-facing pages to clear an advisor line.

**Fixed** in `supabase/omega_authenticated_execute_hardening.sql`
(+ `migrations/0097`), applied live 2026-08-24 — the three that are unguarded
**and** called by nothing in this repo:

| function | why |
|---|---|
| `get_activity_feed(int,int)` | joins `activity_feed` to `profiles`, returning every member's `display_name`, `element` and activity — the only cross-member read path in the authenticated surface, and unused |
| `get_capability_health()` | internal capability registry: health, lifecycle, SLO p95 timings |
| `log_evolution(text,text)` | a write; delegates to `complete_task` so it was never a spoofing hole, but an uncalled write endpoint is still surface |

**The check that mattered more than the function count.** The leak question is
not "how many functions can a member call" but "can one member read another's
rows". Tested on production by impersonating a real non-owner member across 17
member-data tables, comparing member-visible counts against privileged counts:

```
certificates 0/24 · sovereign_points_ledger 0/69 · task_completions 0/10
trophies 0/24 · medals 0/24 · exam_results 0/3 · feedback 0/1
```

Every populated table scoped; none leaked. `profiles` policy is
`((SELECT auth.uid()) = id) OR is_platform_owner()`, so no member email is
reachable by another member.

**Verified:** post-apply, `get_activity_feed` / `get_capability_health` /
`log_evolution` are `anon:false, authed:false`; `order_stats`,
`public_leaderboard`, `published_dispatches`, `get_pending_requests`,
`my_matrix`, `complete_task` all still `authed:true`. Browser error scan 3/178
unchanged; `audit.py` 0 critical / 7 warnings.

**Not fixable from here:** `auth_leaked_password_protection` is Pro-plan-gated
(docs: "available on the Pro Plan and above") and the org is on `free`
(`get_organization` → `"plan":"free"`), so the toggle is absent from the
dashboard entirely and this advisor line cannot be cleared without upgrading.
The free-tier substitute for the same threat is raising minimum password length
and required characters under Auth → Providers → Email.

---

## member_state applied: the 43 unpersisted pages now have a server copy

**Applied live 2026-08-24** (`supabase/omega_member_state.sql`, `migrations/0095`).

**The decision, and the evidence that changed it.** An earlier note in this
session recommended holding this back on the grounds that mirroring member data
server-side *increases breach surface* — it centralizes mood logs, body
measurements, journals and finances where today they are device-local.

That reasoning rested on an assumption that was never checked, and it was wrong.
Querying live:

| table | policies | `authenticated` data grants |
|---|---|---|
| `health_logs` | 1 | INSERT, SELECT |
| `ai_memory` | 4 | DELETE, INSERT, SELECT, UPDATE |
| `family_nodes` | 1 | DELETE, INSERT, SELECT, UPDATE |
| `heritage_records` | 1 | DELETE, INSERT, SELECT |
| `bloodline_nodes` | 1 | DELETE, INSERT, SELECT |

Medical, genealogical and AI-memory data is **already** stored server-side in
plaintext under exactly this RLS boundary — and that boundary was tested by
member impersonation across 17 tables immediately before (every populated table
scoped, zero cross-member reads, `profiles` = `auth.uid() = id OR owner`).
`member_state` therefore extends a defended boundary rather than opening a new
one, and holding it back would have left 43 pages losing member data on a cache
clear to avoid a risk the platform already carries and already defends.

**Client-side encryption considered and rejected**, on key management. There is
no stable client-side secret — Supabase hands the browser a JWT, not the
password. That leaves a random key in `localStorage` (dies with the very cache
clear the feature exists to survive, producing a backup that silently fails to
restore — §8.1 class 1 in a new hat) or a member-remembered passphrase (loses
the backup when forgotten, and needs real crypto plus a recovery flow for nine
members). Crypto that fails closed without saying so is worse than plaintext
behind working RLS.

**One hardening added over the reviewed version:** `updated_at` is now
server-authoritative via a `BEFORE INSERT OR UPDATE` trigger. A column DEFAULT
fires only on INSERT, so an upsert resolving to UPDATE would have kept whatever
timestamp the browser sent, including a backdated one. The trigger function is
`REVOKE`d from `PUBLIC`/`anon`/`authenticated` — a trigger function has no
business being REST-callable, and `CREATE FUNCTION` grants PUBLIC by default.

**Verified on the live table** by impersonating two real members:

```
A writes own row                      OK
backdated ts overridden by trigger    YES (inserted 1999-01-01, read back now())
A writes as B                         blocked: 42501
B sees A's rows (expect 0)            0
anon reads                            blocked: 42501
probe rows cleaned up                 OK
```

Security advisor after the whole session: **205 → 168** findings.
`anon_security_definer_function_executable` 23 → **2**,
`function_search_path_mutable` 5 → **0**, and `member_state` contributes
**zero** findings of its own.

**Limit of this verification, stated plainly:** the database side is proven
live. The client side was exercised against the browser harness's *stubbed*
Supabase client, not a real signed-in session — so "the module writes real rows
from a real browser" is confirmed by construction and by the SQL-side proof, not
by an end-to-end browser run. First real member session will settle it;
`OmegaMemberState.status()` reports `lastError` and `lastSync` for exactly that.
---

- **The safety gate for high-risk changes was the least discoverable skill in the repo.**
  `.claude/skills/grill-me-codex/SKILL.md` began at line 1 with
  `# Grill-Me-Codex: Safety Gate for High-Risk Decisions` — **no YAML frontmatter at all**,
  where the other 7 skills all open with `---\nname:\ndescription:\n---`. A skill with no
  frontmatter has no `name:` and no `description:`, and the description is what a coding
  agent matches against to decide a skill applies. Its listing fell back to the `#` heading,
  which states what the skill *is* and never says **when to use it** — so the one skill whose
  entire job is stopping an unexamined auth / schema / payments / RLS change from going in was
  the single hardest one to select. Confirmed as the contract, not a house preference, against
  first-party Anthropic material: `anthropics/skills`' `template/SKILL.md` (fetched, 140 bytes,
  HTTP 200) is exactly `name:` + `description:`, and its description field reads *"Replace with
  description of the skill and when Claude should use it."* Fixed by adding frontmatter whose
  description names the four trigger areas. **Verified live in-session, not by inspection**: the
  harness re-emitted its available-skills list immediately after the write, and `grill-me-codex`
  now appears with the real trigger description instead of the heading text. Guarded against
  recurrence — `scripts/omega-registry.py` hard-fails, in both generate and `--check` mode, on
  any `SKILL.md` with no frontmatter or a frontmatter missing `name:`/`description:` (3 of the
  13 new tests cover exactly that shape).

- **Every hand-typed count describing this repo's own agent infrastructure had drifted.**
  `.claude/skills/README.md:3` said *"Four skills"*, `CLAUDE.md:718` said *"Five skills"*, and
  `CLAUDE.md:824` said *"the 4-skill pipeline"* — three documented counts of one thing, all
  three wrong: `ls .claude/skills/*/SKILL.md` returns **8**. The README named only 4 of them;
  `context-budget`, `grill-me-codex` and `interface-guidelines` had **0 mentions** in it. The
  same class in `CLAUDE.md` §2: *"~250 standalone .html pages"* (`ls *.html` → **178**), bg.js
  *"104+ of ~250 pages depend on it"* (`grep -l bg.js *.html` → **178 of 178**, i.e. a total
  rather than partial single point of failure), and §8.2's *"87 `omega-*.js` modules (747 KB)"*
  (**90** modules, **807 KB**). Not a typo problem — what happens when a number that changes is
  stored in prose. Fixed by deriving all of it from the filesystem:
  `scripts/omega-registry.py` generates `OMEGA_SKILL_REGISTRY.md`, and `--check` fails CI on
  drift, the same generated-artifact pattern `types-from-schema.py` already uses. Wired blocking
  into both `.github/workflows/ci.yml` (step 2j) and `scripts/ci-local.sh`. Prose corrected in
  place rather than left to drift again, and the two skill-count claims now point at the
  generated registry instead of restating a number. **Verified in both directions** — the gate
  passing on a clean tree proves nothing on its own (`CLAUDE.md` §8.4: *"a scan against a
  stopped static server also reports 0"*), so each of the 13 new tests pairs a positive
  assertion with a perturbation asserting a non-zero exit: hand-editing a count, adding a skill,
  deleting the registry, and each of the three frontmatter defects. 51 → **64 tests, all
  passing**; `ci-local.sh` 11/11 blocking checks; `audit.py` unchanged at 0 critical / 7 warnings.
  One correction surfaced while counting: `migrations/README.md`'s *"Full 94-file sequence
  validated"* against a scratch PostgreSQL 16 instance is accurate **only for the numbered
  `0001`–`0094` files**; the directory now holds **117** (94 numbered + 23 later timestamped),
  and no run has covered all 117. The registry reports that split so the validated scope stays
  visible instead of being rounded into a single number.

- **All 18 agent-facing scripts in `scripts/` ran their full job when asked for `--help`.**
  Found by grounding an external skill against this repo instead of installing it:
  `cursor/plugins`' `cli-for-agent` states its use as *"reviewing whether an existing tool will
  block agents (interactive prompts, missing examples, ambiguous errors)"*. Tested — every one
  of the 15 `.py` and 3 `.sh` scripts ignored the unknown flag and executed; not one printed a
  usage line. Two costs. **Discovery:** learning what `scripts/rls-auditor.py` does required
  reading it, in a repo that gates per-session context cost precisely because reading is where
  sessions spend themselves (`scripts/context-budget.py`, blocking in CI). **Unrequested
  writes:** `register-shell.py`, `register-chronometer.py`, `register-demo-video.py`,
  `patch-account-auth.py` and `fix-module-loader.py` all modify tracked files and had **no argv
  handling whatsoever** (`grep -cE 'sys\.argv|argparse' → 0` for the three `register-*`), so
  `--help` was a write — masked only because all five are idempotent and already applied, each
  printing *"Already registered. Nothing to do."* On a fresh clone it would have edited the repo.
  `cleanup-dead-files.sh` was **checked rather than assumed** and was already correct: dry-run by
  default, `rm` reached only under `[ "$APPLY" -eq 1 ]`. Fixed by having each script print its
  own module docstring (all 15 `.py` files already had a real one) and exit 0 before any work.
  The guard is deliberately **self-contained per file rather than a shared import**:
  `scripts/tests/` builds fixtures by copying a single script into a temp directory, so a
  `from _agentcli import …` would have raised `ImportError` in every existing test.
  **Verified:** all 18 return a real usage/description and exit 0, and `git status --porcelain`
  is clean afterward — proving no script mutated anything while being asked for help. Normal
  behaviour unchanged: 64 tests, 11/11 blocking checks, `audit.py` 0 critical / 7 warnings,
  `rls-auditor.py` still reporting its one finding. Also removed that script's leftover
  `print(f"DEBUG: __file__={__file__}, ROOT={ROOT}, cwd={os.getcwd()}", file=sys.stderr)`, which
  had been firing on every CI run.

- **Three language packs shipped 14 keys short, and `feed.html`'s topbar resolved to nothing —
  both live on `main`.** `i18n/nl.json`, `zh.json` and `hi.json` each held **1013** keys against
  `T_EN`'s **1027** (`set(T_EN) - set(pack)` → the 14 `cosmos_*` keys: `cosmos_agents_heading`,
  `cosmos_tab_gates`, `cosmos_gates_thresholds`, …), so `cosmos.html` fell back to English for
  Dutch, Chinese and Hindi readers while Arabic, French and Spanish were complete at 1027.
  Separately, `feed.html:33` is the only page markup referencing `feed_topbar_title` and
  `feed_topbar_subtitle`, and **neither key existed in any of the seven sources** — the entry
  lookup in `apply()` (`i18n.js:1200`, `var entry=T[key]; if(entry){…}`) simply skipped both
  elements in every language.
  **Root cause, traced through two commits.** `80adabeb` ("Phase 4.5: Complete cosmos.html
  internationalization") wrote the 14 translations into all three packs but left each file
  unparseable — a delimiter error near the end, not a truncation
  (`nl` 51081 bytes, *Expecting ',' delimiter: line 1 column 50082*; `zh` 46247 bytes, col 33137;
  `hi` 84288 bytes, col 47351). `faac665b` ("Fix: Restore corrupted i18n JSON files") then
  restored all three from their **pre-`80adabeb`** blobs, which cleared the parse error and
  unblocked CI — and discarded the 14 translations along with the corruption. The packs have
  been 14 keys short on `main` ever since; nothing in CI compares pack key sets against `T_EN`,
  so it stayed invisible.
  **Fix, additive only.** The 42 translations were recovered by regex from the corrupted
  `80adabeb` blobs (14/14 for each of nl, zh, hi — the corruption is localised well past every
  `cosmos_*` entry), so no text was re-translated or invented:
  `cosmos_agents_heading` = *"Twaalf Soevereine Agenten"* / *"十二位主权代理"* /
  *"बारह संप्रभु एजेंट"*. The two `feed_topbar_*` keys were added to `T_EN` and to all six packs.
  Every pack is rewritten in `T_EN` key order, which all six already followed exactly
  (`list(pack) == [k for k in T_EN if k in pack]` → True for all six before the change).
  **Verified in a real render, not just by key count.** All seven sources now carry an identical
  **1029**-key set (`set(pack) == set(T_EN)` → True ×6, 0 duplicates in `T_EN`), and a repo-wide
  `data-i18n` scan reports `feed.html` fully resolved. A headless-Chromium harness reproducing
  `feed.html:33`'s nested markup then switched through nl → zh → hi → ar with the packs served
  over HTTP: the title translates, the nested `<span data-i18n="feed_topbar_subtitle">` is
  **still a child of the title div** in every language (`setOwnText`'s text-node path, `i18n.js:1147`,
  doing what its comment promises), `cosmos_agents_heading` renders the recovered translation,
  `dir` flips to `rtl` for Arabic, and **zero page errors**. `node --check i18n.js` clean;
  `ci-local.sh` 16/16 blocking checks; `audit.py` 0 critical / 7 warnings.
  **Two things deliberately left alone.** (1) Switching *back* to English does not restore
  English text — `apply()`'s base-language guard (`if(baseLang && ownText(el)) return;`,
  `i18n.js:1209`) is a deliberate "the markup wins in the base language" rule, and once another
  language has overwritten the text there is no longer an empty gap for it to fill. Present
  identically on `main` before this change, and reverting it would resurrect the 106 drifted
  English entries its own comment documents — a product decision, not a merge fix. (2) Four
  pages still reference keys that exist in no source (`account.html` 8, `analytics.html` 5,
  `matrix.html` 1, `profile.html` 124) — counted identically against `origin/main`'s `i18n.js`,
  so pre-existing and out of scope here; they degrade to authored English rather than breaking.

- **`main` itself was red on two blocking gates, both self-inflicted by contracts that tracked a
  spelling instead of a requirement.** Found by running the full blocking set against a clean
  `origin/main` worktree (`420e17a8`) rather than assuming a red check belonged to the branch in
  hand — `workflow-contract.py` and `omega-registry.py --check` both exited 1 there, identically.
  1. **`scripts/workflow-contract.py` demanded a PowerShell string the workflow no longer
     contains.** Its `REQUIRED` list held the literal `node --check $file.FullName`, but
     `4f33f020` ("ci: remove pwsh dependency from self-hosted verification") rewrote that step in
     `cmd` as `for %%F in (*.js) do node --check "%%F"`. The requirement was still satisfied —
     every root `.js` file is still syntax-checked — yet the gate reported
     *"production-contract.yml: missing required contract"*. `420e17a8`
     ("ci: make workflow contract Windows-shell compatible") did not fix this: its diff touches
     only `.github/workflows/workflow-contract.yml`, the workflow that *runs* the checker, never
     the checker. Fixed by splitting the shell-dependent requirement out of the literal
     `REQUIRED` list into a `REQUIRED_PATTERNS` regex (`node\s+--check\b`), so the contract
     asserts *what* runs and survives the next shell change. **Verified in both directions:**
     PASS as committed, and replacing `node --check "%%F"` with `echo skip` in the workflow
     brings back a FAIL and exit 1 — a gate that only ever passes proves nothing.
  2. **`scripts/omega-registry.py` derived a verification claim from a file count.** Its
     generated census read
     `` the **{numbered}-file numbered sequence** (`0001`–`00{numbered}`) applies cleanly against
     a fresh scratch PostgreSQL 16 instance ``. Only **one** such run exists —
     `supabase/migrations/README.md`'s *"Full 94-file sequence validated end-to-end for the first
     time"*, covering `0001`–`0094` — so every numbered migration added afterwards silently
     enrolled itself in a validation it was never part of. By `main` the directory held **141**
     files (99 numbered + 42 timestamped) and the generator was asserting `0001`–`0099` had been
     validated; five files (`0095`–`0099`) had not. The same expression also mis-rendered past
     99 (`00120` for 120 files, reproduced in the A/B below). Compounding it, the "not part of
     that validation" count only ever counted *timestamped* files, so newly added numbered ones
     were omitted from the unvalidated total as well. Fixed by pinning `VALIDATED_MIGRATIONS = 94`
     as a fact about a run that happened, citing the README heading, with an explicit instruction
     to raise it only after a run that actually reaches higher — and computing the unvalidated
     remainder as `total - validated` so numbered and timestamped files both count.
     `CLAUDE.md` §5's own copy of these numbers (94 / 117 / "23 later timestamped") had gone
     stale the same way and now points at the generator instead of restating a count.
     **A/B'd against `main`'s generator** in a throwaway worktree: both new tests fail there
     (`'`0001`–`0094`' not found`, and `The 8 files added since` absent) and pass here.
  71 → **73 tests**; `ci-local.sh` 16/16 blocking; every blocking `ci.yml` step green. Neither
  fix changes what CI actually verifies — one restores a gate that was rejecting a correct
  workflow, the other stops a generated document from claiming verification it never had.

- **138 `data-i18n` references resolved to nothing, in every language — and nothing in CI had
  ever looked at i18n.** `apply()` does `var entry=T[key]; if(entry){...}` (`i18n.js:1200`), so a
  key with no `T_EN` entry is skipped for **all seven** languages, not just one. 138 references
  across four pages were in that state: `profile.html` **124 of its 158** `data-i18n` elements,
  plus `analytics.html` 5, `account.html` 8, `matrix.html` 1. Invisible in English — the authored
  markup still renders, and the base-language guard (`if(baseLang && ownText(el)) return;`) means
  English never consults the dictionary anyway — so only a non-English reader saw it: a profile
  page that stayed 78% English while its shell translated.
  **`account.html`'s eight were a different defect.** They use a dotted convention
  (`auth.member_access`, `auth.dob`) that matches nothing else in a flat `snake_case` dictionary
  of 1029 keys, and `git log -S` puts them in the page's own creating commit (`90c310d7`) — they
  were never resolvable, not a regression. Renamed to the repo's actual page-prefix convention
  (`account_*`; `auth_` was already taken by `auth_apex`).
  **A third defect surfaced while checking the first: HTML entities in dictionary values reach
  the reader literally.** Every write path is textual — `setOwnText` assigns `nodeValue`
  (`i18n.js:1147`), placeholders and alts are attributes — so `&mdash;` and `&#9670;` are never
  parsed as markup. **Verified in a real render before believing it**: Arabic showed
  `الأبراج السيادية الاثني عشر &mdash; ماندالا البدء` and `&#9670; ثوابت النظام &middot; محرك السلطة`
  to the reader. 45 values across all 7 sources (11 distinct keys) were affected; decoded per
  regex match rather than by whole-string unescape, so a bare `&` in prose is untouched.
  **Fix.** All 138 keys added to `T_EN` and to all six packs, 1029 → **1167** each, with parity
  held (`set(pack) == set(T_EN)` ×6). The English value for every key was **extracted from the
  live DOM**, not retyped — `ownText` semantics, so the 12 keys whose element has children
  (`<span data-canon-lattice>`, `<br>`, or a nested `data-i18n` subtitle) contribute only their
  own text node and cannot swallow a child's content. That is the `dashboard.html` trap
  `i18n.js`'s own comment records ("· 18 18 SOVEREIGN MODULES"), checked for rather than assumed
  past. Only the six translations per key were authored.
  **Verified by rendering all four pages in all six languages** (24 fresh browser contexts):
  every element translates, **0 blank**, **0 page errors**, `dir=rtl` on Arabic. The handful that
  come back identical to English were inspected individually and are genuine identity
  translations — `CONTRIBUTION`, `Courage`, `Vision`, `Justice`, `7 CLASSES`, `PHASE / 12` in
  French. **The first version of that check was wrong and its numbers should not have been
  trusted**: `i18n.js` auto-applies `localStorage['omega_lang']` on load, and reusing one browser
  context across pages meant the "English baseline" was whatever the previous iteration had
  selected. Re-run with a fresh context per (page, language). The headline numbers survived, but
  they had been right by luck, not by measurement.
  **The structural fix is the point: `scripts/i18n-contract.py`, blocking in CI.** Four checks,
  each tied to a defect that actually shipped — every pack parses (the corruption class), every
  static `data-i18n` key resolves in `T_EN` (this one), no pack key `T_EN` lacks (drift the other
  way), no HTML entity in any value (the third). Translation *coverage* is deliberately
  **reported, not blocked**: a missing pack key falls back to English by design, and blocking it
  would only pressure the next contributor into inventing translations to get CI green. Coverage
  still cannot silently regress — `scripts/omega-registry.py` now records each pack's key count in
  the generated census, so a pack losing keys changes a committed number and fails `--check`.
  That is the guard the previous entry's bug needed and did not have. Runtime-built attributes
  (`'data-i18n="'+k+'"'`) are skipped rather than guessed at. **13 new contract tests + 2 census
  tests, every check asserted in both directions** — the census test reproduces the shipped bug
  exactly (20 keys → 6, `--check` exits 1, registry then reads "14 short of `T_EN`").
  73 → **88 tests**; `ci-local.sh` 16 → **17** blocking checks; `audit.py` 0 critical / 8 warnings.

- **`scripts/omega-registry.py --check` was a guaranteed CI failure, and had already
  committed three wrong dates.** Found by running the full blocking set against a clean
  `origin/main` — it exited 1 on drift in the skills table's "Last touched" column alone:
  `autonomous-coder`, `subscriber-portal` and `web-trend-scout` committed as `2026-08-15`,
  regenerated as `2026-08-11`.
  **Root cause: a shallow clone answers `git log -1 -- <path>` with the graft boundary
  rather than failing.** When the commit that really last touched a file lies beyond the
  boundary, git silently substitutes the boundary commit, so the date is whatever that
  commit happens to carry. Reproduced directly: a `--depth 1` clone of this repo reports
  **2026-08-29** — the clone's own date — for a file whose real commit is `90c310d7` on
  2026-08-11. `.github/workflows/ci.yml` used `actions/checkout@v4` with no `fetch-depth`,
  which defaults to **1**, so every CI run would have regenerated all eight dates as the run
  date and failed `--check` on drift that does not exist. Nobody had seen it because no
  runner has been assignable on this account since 2026-08-22 (§8.2).
  **The committed `2026-08-15` values were themselves a guess.** Reading
  `$(git rev-parse --git-dir)/shallow` in this session's clone listed five boundary SHAs, and
  `90c310d7` — the commit the date came from — **is one of them**. After
  `git fetch --unshallow` (480 → **7,362** commits) the real commits appear
  (`3010634a`, `8b647132`) and all three dates are **2026-08-11**. So the previous value was
  one shallow clone's boundary and the new one is the truth, not two equally valid readings.
  **Fixed in both places.** `ci.yml` now sets `fetch-depth: 0`. The generator reads the
  graft set once and, if `git log` returns a SHA that is in it, records `unknown` and exits 1
  naming the files and the remedy — refusing to write a date it cannot know, because a wrong
  date in a generated artifact is indistinguishable from real drift and sends the next
  session chasing it. **The detection is deliberately the boundary, not shallowness itself**:
  a first attempt refused on any shallow clone and broke this very checkout, which is shallow
  at 480 commits yet correct for every file whose commit is inside that window.
  **Verified in both directions**: a depth-1 clone refuses, naming 9 files; this repo
  (post-deepen) generates cleanly and `--check` passes. The new test grafts a fixture's own
  history via `.git/shallow` and asserts exit 0 before and exit 1 after.
  91 → **92 tests**; `ci-local.sh` 17/17; every blocking `ci.yml` step green.

- **First live-database verification this repo has ever had — and it found a whole feature that
  never reached the server.** Everything before this was source- and browser-level only, which
  `CLAUDE.md` §8.4 already warned was the unimportant half: *"a `BUILT` row means the client is
  wired and nothing more. The live table, its columns, its `GRANT` and its policy are all still
  unverified, and each has been a real shipped bug."* With Supabase access finally authorized,
  all 57 tables named in a client `.from(...)` call were checked against production for
  existence, grants to `authenticated`, and policy count. **53 came back fully healthy.** Four
  did not: `transactions` and `wallet_balances` (both MISSING — known and deliberate, tokens
  dormant per §8.2), plus two nobody had recorded.
  **`oaths` did not exist in production.** `oath.html` inserts to and selects from it, and the
  table *is* declared — in `supabase/chunk_09_new_features.sql`, a file that was **never
  applied**: 3 of its 4 tables are absent live (`oaths`, `codex_bookmarks`, `signal_saves`; only
  `user_dedication` exists). Nothing ever crashed, because `oath.html` is written correctly — it
  checks `res.error` and falls back to `localStorage` with a different toast (*"OATH HASHED"*
  rather than *"OATH SEALED"*). So this is **not** the silent-success class of §8.1(1); it is
  quieter and arguably worse. Every oath any member has ever sworn lives only in that member's
  browser, has never been persisted, and dies with their cache.
  Fixed by applying the bag's own declaration, reviewed first rather than pasted:
  `oaths_insert` is `WITH CHECK (auth.uid() = user_id)` — the correctly scoped form, not the
  `WITH CHECK(true)` spoofing shape of §8.1(6b); `oaths_read` is `USING(true)`, which the file
  comments as a deliberate *"transparent ledger"* and which matches `loadOaths()` reading all
  members' oaths; there are no UPDATE/DELETE policies, so oaths are immutable; and the `GRANT`
  is present and matches the policies, so it does not repeat the policy-without-grant class of
  §8.1(6c) that broke 22 features. The client's six `data-cat` values were checked against the
  `CHECK` constraint **before** applying, since a mismatch would have made every insert fail on
  a check violation. `codex_bookmarks` and `signal_saves` were deliberately **not** created —
  `codex.html` uses `localStorage` only and never calls `.from('codex_bookmarks')`, and
  `signal_saves` has zero references repo-wide; creating them would be building unwired
  features.
  **Verified by impersonating a real non-owner member**, all eight checks: SELECT OK; INSERT as
  self allowed **and the row confirmed present afterwards** (not merely "did not error");
  INSERT attributed to another member refused `42501`; UPDATE refused; DELETE refused; anon
  refused; probe rows removed, table left at 0.
  **`top_pages` — and the obvious fix would have been a privacy regression.** The view existed
  live with **no grant to `authenticated`**, so `dashboard.html:953` failed `42501` for
  everyone including the owner; that widget has never rendered, silently, inside a bare
  `try/catch`. Granting it would have leaked: `reloptions` was NULL, so the view had no
  `security_invoker` and ran with its `postgres` owner's privileges, **bypassing RLS on
  `telemetry_events` entirely** — every approved member would have gained platform-wide traffic
  analytics. `dashboard.html` does gate the widget with `if(pr.is_owner)` and renders
  *"N VIEWS · N MEMBERS"*, confirming owner-only intent, but a client-side `if` is not an
  authorization boundary (§5): anyone with the anon key could have read the view directly once
  granted.
  **The first fix was wrong and was replaced.** Adding `AND public.omega_is_owner()` to the view
  body worked (owner 1 row, non-owner 0, anon refused) but kept SECURITY DEFINER — Supabase's
  advisor flagged it `ERROR security_definer_view`, the only ERROR on the project — and it
  duplicated an authorization rule using a *different* owner helper from the one the table's own
  policy uses (`omega_is_owner` vs `is_platform_owner`). They agree today, but a duplicated rule
  that can drift from the one that actually binds is a latent bug, not defence in depth.
  Replaced with `security_invoker = true` and the filter removed, so the base table's existing
  RLS (`owner reads all telemetry USING (is_platform_owner())`) is the single boundary.
  **Verified on a real seeded row** — both cases return 0 on an empty table and would have
  proved nothing: `security_invoker=true` confirmed in `pg_class.reloptions`, owner 1 row,
  non-owner 0, anon `42501`, probe row removed. Security advisor **174 lints / 1 ERROR → 173 /
  0 ERROR**.
  **Two corrections to my own reporting during this pass.** A probe reported `INSERT as self ->
  FAILED 22P02` and I nearly recorded a broken write path; the fault was in the probe —
  `r := r || 'literal'` makes Postgres parse a bare string as an array literal, and the
  exception handler then misattributed its own failure to the INSERT. And a first read of the
  advisor reported **0 lints** where there were 173, because the payload nests under `result`;
  §8.4's *"verify a 0-findings result is real"* is what caught it. Separately, `schema-dictionary.py`
  going **4 → 0** in this same window is **not** attributable here — `map.html` was fixed by
  `3f8a17d7`. What this change moved is `.from()`-never-declared, **4 → 2**, the remainder being
  the two deliberately dormant token tables.
  `audit.py` 0 critical / **7** warnings (was 8); `ci-local.sh` 17/17; 92 tests.

- **All 11 client `.upsert()` calls verified against the LIVE unique indexes — the check
  `upsert-conflict-check.py` says it structurally cannot do.** That script's own docstring is
  explicit: *"WHAT THIS CANNOT CATCH, stated plainly: a constraint the SQL bag declares but the
  live database does not actually have. `ai_memory` was exactly that."* With database access,
  every conflict target was matched against `pg_index` rather than against `supabase/*.sql`:
  `profiles`→`id` (PK), `user_dedication`→`user_dedication_user_id_date_key`,
  `platform_metrics`→`platform_metrics_metric_date_metric_name_key` (both callers),
  `graph_entities`→`graph_entities_user_id_entity_type_canonical_name_key` (both callers),
  `graph_relationships`→`graph_relationships_natural_key`, and
  **`ai_memory`→`ai_memory_user_key (user_id, memory_key)` — the previously-broken one,
  confirmed genuinely fixed in production**, not just in the bag. The §8.1(7) family is closed.
  Three upserts send **no** `onConflict` and so default to the primary key, which is the
  dangerous 23505 shape when the payload does not carry it — and two of them look exactly like
  that on paper: `profile.html:1936` sends `character_records` without `user_id` (PK `user_id`),
  and `social.html:175` sends `social_connections` `{platform, handle}` against PK
  `(user_id, platform)`. **Both are fine, and only live could show why**: `user_id` on both
  tables is `NOT NULL DEFAULT auth.uid()`, so PostgREST's insert fills the key server-side from
  the JWT and the conflict target resolves. Proven rather than reasoned — each upsert was
  executed twice under member impersonation and the repeat did not raise 23505; neither member
  had a pre-existing row, and both probe rows were removed. (`member_presence` passes the
  ordinary way: it sends `user_id` explicitly.)
- **`platform_events` is no longer the spoofing shape §8.2 described, and `platform_metrics`
  never was.** The standing entry claimed both *"still have `WITH CHECK(true)` on INSERT, on
  tables that carry a `user_id` … any member could insert rows attributed to anyone."* Live says
  otherwise: `platform_events`'s INSERT policy is `member inserts own events`,
  `WITH CHECK ((SELECT auth.uid()) = user_id)` — correctly scoped. `platform_metrics` does carry
  `WITH CHECK(true)`, but the table has **no `user_id` column**, so nothing can be attributed to
  anyone; the residual risk is arbitrary metric rows, a data-integrity concern rather than
  impersonation. Both confirmed still ungranted INSERT to `authenticated`, so both are
  unreachable either way. §8.2 corrected. Also re-confirmed live: `task_completions` really does
  carry `id bigint` + `axis` + `increment` (plus `task_name`/`task_type`/`axis_type`/
  `points_earned`/`axis_*_before`/`axis_*_after`/`auth_after`), matching none of the bag's three
  competing definitions — that counterexample stands exactly as documented.

- **All 36 client-called RPCs verified live: none missing, none unreachable.** Tables were only
  half the client's contact surface with the database; `.rpc()` is the other half, and it has
  its own version of the §8.1(6) class — a function that exists but that `authenticated` cannot
  `EXECUTE` returns `42501`, which the Supabase client resolves to `{data:null,error}` rather
  than throwing, exactly like the table case. Checked every name against `pg_proc` and
  `has_function_privilege`: **36 names, 0 missing, 36/36 executable by `authenticated`**, and no
  ambiguous overloads. Exactly **one** is executable by `anon` — `report_client_error`, already
  reviewed and correct (write-only, returns only `{ok:…}`, rate-limited 20 per 10 minutes,
  every input truncated, `search_path` pinned), which public pages need for signed-out visitors.
  That single count corroborates the security advisor's lone
  `anon_security_definer_function_executable` warning from an independent direction.
  **The zero was verified rather than trusted**, per §8.4's *"a scan against a stopped static
  server also reports 0"*: the first query returned an empty result set, so it was re-run as a
  positive count with a control row (`definitely_not_a_real_rpc_xyz` → 0) to prove the join
  actually discriminates between present and absent functions before reading the 0 as good news.

- **Ω-HORIZON v2 — a futuristic design layer added without repeating any of the traps the last
  one hit.** A third additive section in `bg.js`'s injected stylesheet, reaching all 179 pages
  through the one file: motion tokens (`--ease-expo`/`--ease-spring`/`--ease-glide`,
  `--dur-1..3`), a tinted elevation scale (`--elev-1..3`, `--elev-cyan` — each level pairs a dark
  ambient shadow with a *coloured* key-light bloom, so a raised surface reads as lit by the gold
  key rather than floating on grey), hover elevation, a focus bloom, an opt-in `.omg-ring` conic
  progress ring using `@property` so the sweep interpolates instead of snapping, a specular
  sweep across `.btn-gold`, `text-wrap: balance`/`pretty`, and scroll parallax on
  `#omega-depth-field`.
  **Three constraints, each taken from a regression already in this log rather than invented:**
  (1) no `border-image` outside `:hover` — it always wins the border paint and silently erases a
  page's per-instance border; (2) **no `::before`/`::after` on `.card`/`.kpi`/`.glass`** — v3 and
  Ω-GVP already own both pseudos there and a pseudo renders one rule, never a merge, so the
  specular sweep is a `background-image` layer and every new pseudo lives on a new opt-in class;
  (3) bare element selectors wrapped in `:where()` so their specificity is zero and any
  page-local rule still wins — the exact failure mode that let a page-local `nav{}` rule hijack
  the injected mobile nav in the commit before this one.
  **The render caught a real defect the diff could not.** The parallax was first written as
  `transform:translate3d(0,calc(var(--sy) * -14px),0)`. It looked correct and did nothing:
  `#omega-depth-field` already runs the `gvp-depth-drift` keyframe animation, which owns
  `transform`, and **a running animation beats a plain declaration**. Measured rather than
  assumed — scrolling moved `--sy` from `0` to `0.5046` while the matrix shifted by ~0.1px,
  which is the drift animation progressing, not parallax. Rewritten to use the **independent
  `translate` property**, which is a separate animatable property and therefore *composes* with
  the animated `transform` instead of being overridden by it. Re-verified: `translate` goes
  `0px` → `0px -5.348px`, exactly `--sy` 0.382 × −14px, while the animation's matrix continues
  independently. This is the same class as §8.4's note about an edit reaching the file but not
  the cascade, and it is why every token, the ring's computed `conic-gradient`, the `.card`
  transition and the heading `text-wrap` were each read back out of `getComputedStyle` in a real
  page before this was called done.
  Reduced-motion coverage was extended in the same pass, and the scroll listener is **not
  registered at all** under `prefers-reduced-motion` rather than merely neutralised in CSS — a
  user who asked for less motion should not pay for a rAF loop whose result the stylesheet
  discards. The listener otherwise matches the existing pointer handler exactly: one passive,
  rAF-throttled listener reading only `scrollY` and `clientHeight`, never a per-element
  `getBoundingClientRect`, so it cannot thrash layout however long the page is.
  No regressions: overlap 0/24, `chrome` 0/179, `overflow` 0/179, page errors 3/179 (the three
  documented CDN-blocked pages), `ci-local.sh` 17/17.


---

## Ω-GVP `.card` sweep — the full per-class exclusion list

Moved verbatim out of `CLAUDE.md` §4.1, which is auto-loaded into every
session and had only 18 tokens of budget headroom. This is a per-class audit
record, not a standing fact, so it belongs here per §9's rule. §4.1 keeps the
one-line pointer and the two failure modes; the enumeration is below.

**Read this with the corrected mechanism.** §4.1 used to justify these
exclusions with "`::before` can only render one rule's declarations, never
merges". That is wrong: pseudo-elements cascade per *property* like any
element. Proven live in a render of `dashboard.html` — `.card::before`
resolves `content:""`, `position:absolute`, `height:2px` and
`background-color:rgb(201,168,76)` from bg.js **merged with**
`box-shadow:rgba(201,168,76,.18) 0 0 18px` from `omega-visual-evolution.css`.
So an entry excluded merely for *having* a pseudo may not actually conflict;
one whose pseudo sets the same property `.card::before` sets (`background`)
still does. Each entry below is flagged on the old reasoning and should be
re-checked against which properties collide before being treated as settled.

  - **Confirmed real conflicts, left alone** (remaining ~34, same two
    failure modes as before): `academy.html` `.exam-card` (`::before` +
    a `--ec` custom-property top-accent, same `.kpi`-pattern exclusion
    reason below); `achievements.html` `.ach-card` (inline
    `style="border-color:..."` per instance); `advertising.html`
    `.tier-card` (`::before`); `agents.html` `.agent-card` (JS
    `card.style.borderLeftColor=...` on the card itself — `sovereign.html`
    doesn't exist in this repo, `sovereigns.html` does and has no
    `.agent-card` at all, so that part of the original list was stale);
    `sovereign-ai.html` `.agent-card` (its base rule itself reads
    `border-top:2px solid var(--ac,var(--gold))`, a per-instance custom
    property on every card, not a modifier — structurally the same
    pattern that got `.kpi` excluded from the glow-edge treatment
    entirely, so excluded here too rather than hover-mask it);
    `analytics.html` `.algo-card` (inline `border-top-color`, 10
    instances); `chronicle.html` `.future-card` (`::before`) and
    `.event-card` (`::before` + inline border, 17 instances);
    `city.html` `.district-card` (JS `card.style.borderLeftColor`);
    `cosmos.html` `.el-card` (the exact conflict already documented
    above — JS `cssText+=` per-element border) and `elements.html`
    `.el-card` (separately, JS `card.style.borderColor`); `dna.html`
    `.dna-card` (`::before`); `exam.html` `.q-card` (inline
    `border-left-color`) and `.exam-card` (`::before`); `family.html`
    `.sg-card` (`::before` + inline border); `feed.html` `.post-card`
    (`::before`); `gaming.html` `.g-card`/`.e-card` (both `::before`);
    `honors.html` `.phase-card` (JS `c.style.borderTopColor`);
    `intelligence.html` `.log-card` (inline `border-left-color` per
    instance, on top of its own already-safe `.type-*` modifiers);
    `investment.html` `.holding-card` (inline `border-left`); `lab.html`
    `.tech-card` (inline `border-top`); `notes.html` `.note-card`
    (inline `border-left-color`, on top of its own already-safe
    `.pinned` modifier); `oracle.html` `.reading-card` (`::before` +
    inline border); `prediction.html` `.pred-card` (JS
    `c.style.borderTopColor` + `--pc`); `projects.html` `.proj-card`
    (inline `border-left-color`, on top of its own already-safe
    `.status-*` modifiers); `publications.html` `.rec-card` (inline
    `border-top-color`, 6 instances); `queue.html` `.worker-card`
    (`::before`); `revenue.html` `.stream-card` (inline
    `border-left-color`); `series.html` `.ser-card` (`::before`);
    `social.html` `.plat-card` (JS `card.style.borderTopColor`, on top
    of its own already-safe `.connected` modifier); `sovereign-covenant.html`
    `.article-card` (`::before` — checked against `vault.html`'s
    already-merged `.article-card` specifically, since that one turned
    out to be an exact duplicate; this one isn't — it adds
    `opacity`/`transition`/a gradient background and is hover-revealed,
    a materially different rule, so it stays a real conflict, not a
    second free pass); `studio.html` `.axis-card`/`.create-card` (both
    `::before`); `triads.html` `.triad-card` (`::after`); `tribe.html`
    `.elem-card` (JS `card.style.borderColor`) and `.tribe-rank-card`
    (JS `card.style.borderTop`); `wallet.html` `.account-card` (inline
    `border-top`). (`vault.html`'s `.article-card` remains already
    reviewed and added from the earlier pass — no change here.)


---

## Ω-HORIZON v3 / VISUAL EVOLUTION v2 — the resting-state design layer, and the five-layer cascade that made v2 invisible

**Symptom.** The Ω-HORIZON v2 layer (commit `5f141cd3`) added easing tokens,
elevation, focus bloom, a specular sweep, a conic progress ring and scroll
parallax across all 179 pages, and every rule was verified as applied by
computed style. It changed almost nothing that a member would see.

**Measurement.** Screenshots at 1440×900 against a pinned BEFORE
(`S.gitShow('a8d46e48', ['bg.js'])`), pixel-diffed by decoding both PNGs into
a canvas inside the already-running headless Chromium and reading
`getImageData` (PIL is not installed in this environment):

| page | pixels differing perceptibly (Δ>8/765) | mean Δ |
|---|---|---|
| dashboard | 2.21% | 1.28 |
| cosmos | 1.15% | 1.70 |
| vault | 0.66% | 0.76 |
| **same build, 1.2s apart (noise floor)** | **1.59%** | **1.74** |

The change was *smaller than the noise* produced by the drift and particle
animations alone. Cause: all of v2 was `:hover`, `:focus-visible` or scroll
state, and `.omg-ring` was opt-in and unused. Nothing was broken; nothing was
visible either.

**Root cause of the second half — bg.js is sheet 1 of 53.** Enumerating
`document.styleSheets` on a rendered `dashboard.html` found 53 stylesheets.
bg.js (`omega-global-css`) is the *second*, so any later sheet wins an
equal-specificity tie. Four later layers were redefining the same surfaces:

* `omega-visual-evolution.css` (sheet 13, a `<link>` injected by
  `omega-sovereign-os.js` on every page) — owned `.card`/`.kpi`/`.kpi-card`
  `box-shadow` + `border-color`, `.side`, `.topbar`, `.sechead`.
* `theme.js` (`omega-theme-css`, 14) — owned `body::before`'s background.
* `nav.js` (`omega-nav-css`, 16) — owns `#omega-side{background:...!important}`.
* `omega-backdrop.js` (`omega-backdrop-css`, 20) — owns
  `body{background:...!important}`, deliberately: it tints the backdrop to
  the member's element and to the page. A feature, not a conflict.

So the parts of the v3 draft written into bg.js for `body`, `.side`,
`.topbar` and `.sechead` were dead code that looked correct in the diff.
Confirmed by reading the computed values back: `bodyLayers: 1` where 6 were
declared, `.side` `backgroundImage: none`, `.sechead` resolving to
evolution.css's `14px rgba(0,229,255,.14)` rather than the declared 18px.

**Fix — one owner per selector, not a fifth competing layer.**

1. `bg.js` Ω-HORIZON v3 keeps only what nothing later claims: the `.card`/
   `.kpi` background-image wash (composes with evolution.css's
   background-*color*), `.glass` rim, `.kpi-n`/`.kpi-val` halo, `.chip`,
   `.bar-track`/`.bar-fill`, `.btn`, `.tbl-head`. The block header records
   the ownership map so the next session does not repeat the mistake.
2. `omega-visual-evolution.css` → **v2**, carrying the resting-state work for
   the surfaces it owns: machined-glass cards (rim + cyan bounce + ambient),
   a 9-layer ambient field on `body::before` (downward fade, edge vignette,
   three light pools, two grid scales), instrument-column sidebar, topbar
   seam, `.tbl-wrap` rim, stronger `.sechead` halo.
3. `theme.js`'s `body::before` background removed — it supplied only a
   background to a pseudo whose geometry came from evolution.css, i.e. a
   strict subset of the same field, silently replacing it. Divergent-copy
   class (CLAUDE.md §8.1(8)).
4. `nav.js`'s `#omega-side` `!important` background upgraded in place to the
   same instrument-column gradient, since nav.js is the real owner.

**Result, measured the same way, with `prefers-reduced-motion` emulated to
suppress what noise could be suppressed:**

| page | pixels differing perceptibly | mean Δ |
|---|---|---|
| dashboard | 17.25% | 4.97 |
| cosmos | 11.04% | 4.09 |
| vault | 11.61% | 3.54 |
| academy | 14.09% | 4.88 |
| **same build (noise floor, reduced motion)** | **1.63%** | **1.42** |

7–11× the noise floor, where v2 was below it.

**Two constraints this produced, both now in CLAUDE.md §4/§4.1.**

* *Never pair `background-clip:text` with a transparent fill on a shared
  class.* Gradient-filled KPI numerals were designed and then rejected: 32
  pages set `color` on `.kpi-n`/`.kpi-val`, and their colour would win while
  the clip still applied — rendering the glyph invisible on those pages.
  Halos use `text-shadow:0 0 22px color-mix(in srgb,currentColor 40%,
  transparent)` instead, which inherits the page's own colour (so per-instance
  `--kc` coding survives) and cannot erase anything.
* *Pseudo-elements cascade per property.* §4.1 claimed "`::before` can only
  render one rule's declarations, last-in-cascade wins, never merges" and used
  it to exclude ~34 page-local card classes. Disproven live: `.card::before`
  resolves `content:""`, `position:absolute`, `height:2px` and
  `background-color:rgb(201,168,76)` from bg.js **merged with**
  `box-shadow:rgba(201,168,76,.18) 0 0 18px` from evolution.css. The
  `honors.html` exclusion still stands (both rules set `background`), but the
  list needs re-checking against *which properties* collide.

**Verification.** `node --check` on bg.js/theme.js/nav.js; computed-style
read-back confirming all 9 field layers, the sidebar gradient, the card
shadow stack and the merged `.card::before` all resolve as declared;
`scan.js chrome` 0/179 clipped-or-covered fixed widgets; `scan.js overflow`
0/179 pages scrolling horizontally at 375px; `scan.js errors` 3/179 (the
documented CDN-blocked `graph`/`map`/`realm`); `./scripts/ci-local.sh` 17/17.
No geometry property (padding, margin, width, height, position) was touched
anywhere in this change, which is why the overlap and overflow baselines
could not move.


---

## The buffering: a third-party CDN on the critical path of every page, plus the motion layer

### 1. Why pages sat "buffering" and never loaded

Every gated page began its module script with

    import{createClient}from'https://esm.sh/@supabase/supabase-js@2'

**146 such imports across 114 pages and 14 modules.** That is a third-party CDN
on the critical path of every single page view. When a module's top-level
import does not resolve, **none of that module's code runs** -- so the page
paints its static placeholders ("--", empty tables, zeroed KPIs) and sits
there. No spinner clears, because none was shown. No error appears, because
nothing threw. Slow esm.sh, a blocked host, an ad blocker, a corporate proxy
or a rate limit all produce exactly the reported symptom.

It was also **unpinned** (`@2`), so the bundle actually served could change
under the platform between two page loads with no commit anywhere.

**Fix: `vendor/supabase-js.js`, self-hosted.** The official UMD bundle from the
npm tarball (`@supabase/supabase-js@2.112.4`, `dist/umd/supabase.js`),
byte-for-byte, with an ES-module export footer appended. The UMD build is
fully self-contained -- auth-js, postgrest-js, realtime-js, storage-js and
functions-js are inlined -- so it has no bare specifiers and needs no bundler,
keeping the no-build-step property intact (CLAUDE.md 9). In an ES module
`var supabase = ...` is module-scoped, so nothing leaks onto `window`.

All 146 call sites repointed; `grep -rn "esm.sh/@supabase"` returns 0.

Verified in a real browser, without the harness stub: importing
`/vendor/supabase-js.js` and calling `createClient` yields a client with
`from` function, `auth` object, `storage` object, `functions` object and
`channel` function. Also verified under `node --input-type=module`.

**The harness had to follow.** `session.js` stubbed `https://esm.sh/**`
because the sandbox denies CONNECT to it. With imports now local, that stub no
longer intercepts anything and every page would try to reach supabase.co --
which the sandbox also denies -- so the approval guard would never lift and
every scan would report an empty platform. The stub is now routed at
`**/vendor/supabase-js.js`; the esm.sh route stays for the other libraries
(tsparticles, tone, jspdf, d3, Leaflet, three). Confirmed still working:
dashboard renders 69 cards with `body.omega-approved` set.

**To upgrade the client:** `npm pack @supabase/supabase-js@2`, take
`package/dist/umd/supabase.js`, re-apply the export footer. Do NOT reintroduce
the CDN import.

### 2. A waiting page must not look like a finished one

Self-hosting removes the CDN failure, not every failure -- a slow network,
an offline device or a 5xx still leaves placeholders forever, silently,
because Supabase resolves to `{data:null,error}` and never throws
(CLAUDE.md 8.1 class 1).

Split deliberately in two:

* **The recorder is inline at the top of `bg.js`** -- it wraps `window.fetch`
  during head parse, before any `<script type="module">` issues its first
  queries. A dynamically injected script is async by default and would install
  its wrapper *after* exactly the requests that hang. It observes only: the
  request passes through untouched and both settlement paths re-emit what the
  caller would have seen.
* **`omega-dataguard.js` is the UI half**: >=9s in flight -> "CONNECTION SLOW";
  a rejection or >=500 -> "DATA DID NOT LOAD"; the next success clears it.
  4xx deliberately raises nothing -- an unauthorised or absent row is a real
  answer, not a connectivity failure. Neither is an empty result set.

It renders through the `#omega-toasts` / `.omega-toast` contract that has been
sitting in bg.js's stylesheet with **nothing in the repo ever building it**.

**A bug found by hit-testing rather than by looking:** the container is
`pointer-events:none` -- correct for passive notifications, fatal for a RETRY
button. The button rendered perfectly and could not be clicked; a hit-test at
its own centre returned `#galaxy-canvas` underneath. Fixed by re-enabling
pointer events on this one note, leaving the shared stack pass-through.

Verified end to end: healthy page shows no note; a rejected backend request
produces the note within 1.4s, and its RETRY button hit-tests as itself
(56x24, `reachable: true`).

### 3. Motion layer (`omega-motion.js` + visual-evolution v3)

Built on the Web Animations API with `fill:'none'` throughout, so no element
ever carries a persistent hidden state: the resting state stays whatever the
page's CSS says, and if the file never runs, throws, or is blocked, every page
renders normally. Invisible content is not a possible outcome. `rotate` and
`scale` are used rather than `transform`, because `.card:hover` already sets a
`transform` and `#omega-depth-field` runs a keyframe animation that owns it --
the independent properties compose instead of being discarded.

Measured, all six:

| behaviour | evidence |
|---|---|
| entrance choreography | opacity dips 0.87 / 0.77 / 0.58 / 0.26 down the first four cards (the stagger), every element rests at exactly 1.0 |
| value roll-up | 5/5 formats restored byte-exact: `1,284`, `$42,500.75`, `98.6%`, `7`, `0.5` |
| pointer tilt | `rotate` +1.68deg at card top, -1.68deg at bottom |
| surface sheen | hover moves background-position to `-40% 0` |
| press feedback | `getAnimations()` 0 -> 1 on pointerdown |
| ambient field drift | `body::before` background-position moves 0.16% -> 0.37% over 2.5s |

**Coverage checked rather than assumed:** across a 20-page sample, 468 of 489
entrance candidates and 119 of 119 numeric readouts are claimed by this
module. An earlier check reported "0 unclaimed" and was a **test** bug -- it
filtered on `__omgSeen`, which is set when an element is *observed*, not when
it animates, so it excluded everything the module had already taken.

**One owner per element.** Two reveal systems already exist --
`omega-content.js` (`.oc-hidden`) and `omega-animated.js`
(`.oa-reveal`/`.oa-revealed`) -- and both own `opacity` on what they manage.
A viewport-relative scan across 8 pages found **0 elements stuck invisible in
view**, so they work and are left alone; the entrance skips anything carrying
their classes, and the roll-up skips anything `omega-content.js` marked
`__isNum`. Three owners for one property would have meant a visible
double-fade.

**A stripe pattern was designed for `.bar-fill` and rejected:** 18 bars set
`style="background:var(--gold)"` inline, and the `background` SHORTHAND resets
`background-image` to none -- the stripe would have shown on bars without an
inline colour and silently vanished on the ones with it. Two different-looking
progress bars on one page is worse than none. Animated `box-shadow` instead,
which that shorthand cannot reach, so every bar reads identically.

**Verification.** `scan.js errors` 3/179 (the documented CDN-blocked pages);
`scan.js chrome` 0/179; `scan.js overflow` 0/179; `audit.py` 0 critical /
7 warnings; `ci-local.sh` 17/17 after `omega-registry.py` picked up the two
new modules (114 -> 116).


---

## First full live sweep of RLS scoping and owner-guarded RPCs

Run with live database access against project `ydqhzvvoyufiiqvzcjns`.

### Client tables vs live schema — 57/60 healthy

Every table named in a client `.from(...)` call (60 distinct) checked live for
existence, RLS, policy count and a grant to `authenticated`. Three did not come
back clean, and all three are already-known and deliberate:

* `top_pages` — a view, so RLS does not apply; it runs `security_invoker` and
  defers to `telemetry_events`' own policies (fixed earlier, `omega_live_fixes_2026_08_29.sql`).
* `transactions`, `wallet_balances` — MISSING, deliberate: the token/payment
  infrastructure is dormant pending legal review (CLAUDE.md 8.2).

No new broken client feature. The `oaths` fix from the earlier pass is holding.

### One real RLS gap: `dispatches`

Every RLS-enabled public table carrying a `user_id` was counted twice — once
privileged, once impersonating a real non-owner approved member. Empty tables
were skipped (both counts are 0 there and prove nothing). One table returned the
same count to a non-owner as to a superuser.

`dispatches_select` read:

    (is_published = true) OR is_platform_owner() OR ((SELECT auth.role()) = 'authenticated')

The third branch is true for every signed-in member, which makes the first
branch **dead**: `is_published` gated nothing and an unpublished draft was
readable platform-wide. Exactly CLAUDE.md 8.4's "classifying a policy by
substring is not reading it" — a scanner looking for `is_published` or for
`is_platform_owner` calls this policy correctly scoped.

Nothing was exposed at the time: the table held one row and it was published.
That is why it was fixed then — zero blast radius, gap closed before the first
draft exists. The blanket branch was standing in for an author branch, so that
is what replaced it. Write policies were already correct and untouched.

Verified live on a real seeded draft owned by member A (both cases return 0
against a table with no drafts and would have proved nothing):

| assertion | result |
|---|---|
| member B sees A's draft | 0 (was 1) |
| member B total rows | 1 — the published one only |
| author A sees own draft | 1 |
| owner sees all rows | 2 |

Probe draft rolled back; `dispatches` left at its original 1 row.

### A false critical, caught before it was reported

The first pass at the owner-guarded RPCs concluded that **five** privilege-
granting functions were callable by any member — `approve_member`,
`extend_trial`, `academy_promote`, `award_token`, `apply_subscription`. That
would have meant any member could approve members, mint tokens and grant
themselves a paid subscription.

It was wrong, and the bug was in the probe. Those functions **return a refusal
payload instead of raising**:

    IF NOT public.is_platform_owner() THEN
      RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
    END IF;

so `PERFORM fn(...)` inside a `BEGIN ... EXCEPTION` block completes without
error, and an exception-based test reads that as success. This is CLAUDE.md
8.1 class 1 turned around: the same "resolves rather than throws" shape that
makes a failed write look successful to application code also makes a
successfully-blocked call look permitted to a test. **The return value is the
only evidence.** Re-tested by capturing it:

| function | returns to a non-owner |
|---|---|
| `approve_member` | `{"ok": false, "error": "forbidden"}` |
| `extend_trial` | `{"ok": false, "error": "forbidden"}` |
| `apply_subscription` | `{"ok": false, "error": "forbidden"}` |
| `academy_promote` | `{"ok": false, "error": "owner_only"}` |
| `award_token` | `{"ok": false, "note": "economy disabled until legal sign-off"}` |

All correctly guarded. `award_token` additionally confirms the `tokens_enabled`
dormancy gate is live, not just declared.

The owner helpers were checked directly under the same impersonation and are
sound: `omega_is_owner()` and `is_platform_owner()` both return `false` for a
non-owner while `auth.uid()` resolves to that member — so the helper layer every
owner-gated policy depends on is not the weak point.

Every probe in this pass ended in a deliberate `RAISE` so the whole block rolled
back. Confirmed afterwards: `notifications` still 0 rows, the probe target still
approved, `dispatches` back to 1 row.

### Advisors: 173 lints, 0 ERROR

89 INFO `rls_enabled_no_policy` (the scaffold tables — RLS on with no policy is
total lockout, the safe state), 83 WARN `security_definer_function_executable`
(reviewed above; the sensitive ones are guarded), 1 WARN
`auth_leaked_password_protection` (Pro-plan feature, unavailable on `free`).

### Five `USING(true)` SELECT policies reviewed, none changed

`leaderboard_snapshots`, `member_events`, `member_presence`, `oaths`,
`platform_owners`. None is the `dispatches` shape — none has a visibility gate
for a blanket branch to cancel. They are read-only social surfaces meant to be
member-visible; narrowing them is a product decision, not a bug fix.

### Open, needs an owner decision: there are TWO owner accounts

`profiles.is_owner = true` for both `s.y.dagher@gmail.com` and
`slmndghr@gmail.com`. CLAUDE.md 1 describes this as a single-owner platform
keyed to the first address. The second account carries full elevated access
across every owner-gated policy and RPC verified above. Not changed — removing
an owner is an ownership decision, not a fix — but it should be confirmed as
intended.


---

## `live-schema.json` — gating the column-name bug class against reality, not intent

`scripts/schema-dictionary.py` gates CLAUDE.md §8.1 class 2: **a column name
that does not exist**, which makes PostgREST reject the *entire* query or write
and empty a page with no visible error and nothing thrown.

It could only ever build its dictionary from `supabase/*.sql` — from what the
repo *intends* — plus a hand-maintained `KNOWN_LIVE_COLUMNS` dict patching the
places live had already drifted. That patch list drifts again the moment live
does; it is the same failure mode as a count typed into prose.

`supabase/live-schema.json` is now a dated capture of the real `public` schema:
**208 relations** (tables, views, materialized views, partitioned tables) mapped
to their columns in `attnum` order. `parse_sql_files()` folds it in
**additively** — a column live has is accepted even if no `CREATE TABLE`
declares it; a column the bag declares but live lacks is *still* accepted,
because the bag may legitimately be ahead of an unapplied migration. The
snapshot removes false positives; it does not become a second source of truth
about what should exist. A missing or corrupt snapshot falls back to
`KNOWN_LIVE_COLUMNS` rather than failing, so it cannot take CI down.

The standing counterexample is now captured rather than hand-patched. Live
`public.task_completions`:

    id, user_id, kind, task, completed_at, axis, increment, created_at,
    task_name, task_type, axis_type, description, points_earned,
    axis_a_before, axis_b_before, axis_c_before,
    axis_a_after,  axis_b_after,  axis_c_after, auth_after

— matching none of its three competing `CREATE TABLE IF NOT EXISTS` definitions
in the SQL bag.

The snapshot also confirms a §8.2 entry from the other direction: `profiles` has
no `lat`, `lon` or `gate` column, so the `map.html` reads removed in `3f8a17d7`
were genuinely dead.

**Verified the gate still bites, because a checker that reports nothing looks
identical to one that is not running** (§8.4). Negative control: a nonsense
column added to a real `.select()` produced

    FOUND 1 COLUMN-NAME MISMATCH(ES):
      dashboard.html:828 — read from profiles.definitely_not_a_real_column_zzz (column does not exist)

and the file was restored, returning the checker to `OK — all client calls
reference existing columns`. Dictionary size went from the bag's tables to
**216 tables / 1,852 columns** once live was folded in.

Regeneration query and the reasoning live in `supabase/live-schema.README.md`.
Regenerate whenever schema is applied live — a stale snapshot silently re-opens
the false positives it was written to close.


---

## The Windows runner, and a test that could not say why it failed

**GitHub Actions runs again.** CLAUDE.md §8.2 recorded that no runner could be
assigned on this account since 2026-08-22 (every run dying in 2-5s with
`runner_id: 0`). That is no longer the whole picture: jobs now execute on a
**self-hosted Windows runner** (`C:\actions-runner`, `C:\Users\HP` in the job
log), which is what the owner's `ci: explicitly pin every run step to cmd on
Windows runner` commit is for. Cloud-hosted minutes still appear unavailable --
queued jobs drain slowly, one at a time -- but a red check is now real output
from a real run, not an infrastructure no-op, so it has to be read rather than
dismissed.

**The failure that arrived was stale.** `verify` failed on `db24aa46` with 6
failures + 1 error, all of this shape:

    AssertionError: 'UNREACHABLE    1' not found in ''

`db24aa46` is an ancestor of `main`, and the run reports `Ran 88 tests` while the
suite is now 92 -- so it predates the current tree and is superseded, not a
failure of the branch it was delivered against.

**But it exposed a genuine defect in the tests.** Every one of those assertions
is on `self.run_audit().stdout`, and none checked the child's exit code. An
empty stdout means `evidence-audit.py` died; the assertion then reports only
that a needle is missing from an empty string, and says nothing whatsoever about
the traceback that caused it. Six assertions all reading `not found in ''` is
maximally uninformative -- the real cause was only visible by opening the raw
job log, which is precisely the situation CI exists to avoid.

Added `EvidenceAuditFixture.audit_stdout()`: it runs the child, and if the exit
code is non-zero it fails with the code, the stderr and the stdout inline,
instead of letting six downstream assertions misreport. The six stdout-asserting
call sites now use it. The deliberate non-zero cases (`--strict`, which must
exit 1) keep using `run_audit()` and check `returncode` directly, so nothing
about the intended semantics changed.

Verified with a negative control rather than assumed -- a checker that never
fires looks exactly like one that has nothing to report. `evidence-audit.py` was
temporarily made to exit 3, and the test then reported:

    AssertionError: evidence-audit.py exited 3 (expected 0), so its stdout is
    empty and every assertion below would be misleading.
    --- stderr ---
    SIMULATED WINDOWS CRASH
    --- stdout ---
    (empty)

The script was restored (`git status` clean) and the suite returns to 92
passing.

---

## Platform-wide `.card` sweep — scanner logic and per-class exclusion detail

Moved out of `CLAUDE.md` §4.1 (2026-08-30) as an audit record rather than a
standing fact; §4.1 keeps the one-paragraph standing version. The Ω-GVP layer
gives `.card`/`.kpi-card` a gradient `border-image` + box-shadow glow, gated to
`:hover` so a page's own resting-state border is never overridden.

**The sweep.** A repo-wide grep found ~230 page-local `*-card` classes across
~150 pages — too many for one-by-one manual verification. A scanner (used, not
committed) detected the two failure modes found by hand:

1. a page-local `::before`/`::after` rule on the class — pseudo-elements cascade
   per *property*, and both that rule and `.card::before` set `background`, so
   one silently wins;
2. a per-instance border set directly on the card element — inline
   `style="border…"`, JS `el.style.border`/`el.style.cssText+=` right after the
   class is assigned, or a same-element modifier combo like `.mc.heir{border-left:…}`.

Classes matching either were left untouched. Modifier classes
(`.sel`/`.active`/`.mine`/`.unlocked`/`.vip`) that set `border-color` as a
persistent *state* indicator were swept in: `.card`'s `border-image` is
hover-only, so a state border stays fully visible at rest and is masked only
while simultaneously hovering that element.

187 class additions across 117 files were applied, each verified by regex
round-trip (the inserted `card` landed as a whole word, trailing spaces in JS
concatenation like `'rule-card '+(on?'active':'paused')` preserved byte-for-byte)
and a full-repo `querySelector`/`getElementsByClassName` scan (7 exact-class
selector hits, all `querySelectorAll(...).forEach(...classList...)` patterns
unaffected). Spot-verified visually on `account.html` `.sign-card`.

**Manual-review pass (later session).** Worked the full flagged list class by
class against the same two failure modes. Verified with `node --check` on every
touched page's inline scripts, a headless-Chromium resting-state computed-style
check confirming the hover-only `border-image` masks no page's own resting
border color, and `scripts/audit.py` (0 critical / 6 pre-existing warnings).

- **Safe, `.card` added** (3): `evolution.html` `.gate-card`
  (`.reached`/`.current`/`.locked` are state indicators); `trophies.html`
  `.medal-card` (`.earned`'s `border-left` off a JS-set `--mc` is a state
  indicator). Both confirmed by injecting the page's exact class string and
  reading `getComputedStyle` at rest — `border-image: none`, page borders
  unmasked.
- **Already done** (1): `wealth.html` `.asset-class-card` — all 4 usages already
  carry `class="asset-class-card card"`.
- **Dead CSS** (1): `map.html` `.stat-card` — one CSS rule, applied to nothing;
  adding `.card` to an unused selector is a no-op.
- **Confirmed real conflicts, left alone** (~34 classes). Each has a page-local
  `::before`/`::after` on the class, or a per-instance border on the card
  element itself. This is the "full per-class exclusion list" referenced from
  §4.1 — an audit trail, not a standing fact.

---

## Runtime sweep (2026-08-30): bg.js double-load on 29 pages, eager OmegaSupabase read on 6

Found by `scripts/verify-runtime.js --all` (headless render of all 179 pages,
added the same session — issue #175), which asserts the live DOM has no
duplicate id and no uncaught error. Two real classes surfaced.

### bg.js loaded twice → duplicate ids on 29 pages

29 of the oldest self-improvement pages (`affirmations`, `atlas`, `body`,
`breath`, `budget`, `command`, `decisions`, `flashcard`, `focus`, `gratitude`,
`habits`, `journal`, `library`, `meditate`, `mood`, `network`, `nutrition`,
`quotes`, `reading`, `rituals`, `sleep`, `stoic`, `targets`, `time`, `vision`,
`water`, `wealth`, `weekly`, `workout`) each carried **`<script src="/bg.js">`
in `<head>` and a second `<script src="bg.js">` just before `</body>`**. The
different `src` spelling (`/bg.js` vs `bg.js`) meant nothing deduped them, so
`bg.js`'s whole IIFE ran twice: `window.OmegaSB` is not set until near the end
of the first run, so the second run re-injected the four style/overlay elements
it creates before that point — `#omega-approval-guard`, `#ocl-css`,
`#omega-noise-overlay`, `#omega-depth-field` — each appearing twice in the live
DOM on all 29 pages (verified: `verify-runtime.js` reported exactly these four
ids, 29× each). Every deferred `omega-*.js` module load also fired twice.

**Fix:** removed the second `<script src="bg.js"></script>` line from all 29
pages; the `<head>` `/bg.js` still loads. Re-verified: 0 `omega-*` duplicate
ids. (`habits.html` still shows its own page-generated `hc-hN` duplicate ids —
a separate, pre-existing bug in that page's calendar render, tracked not fixed.)

### `const sb = window.OmegaSupabase?.sb` read before it exists — 6 pages

`council.html` and `graph-explorer/timeline/centrality/evidence/anomalies.html`
each did `const sb = window.OmegaSupabase?.sb;` at the top of a synchronous
`<script>`, then `sb.auth.getSession()` / `sb.from(...)`. This is CLAUDE.md
§8.1 class 4 again: `bg.js` publishes `window.OmegaSupabase.sb` **lazily**,
only inside `OmegaSB.get()`'s resolution, so at parse time it is `undefined`
and every call throws `Cannot read properties of undefined`. The pages'
existing `if (!sb) { … "SUPABASE NOT READY" … }` guard set innerHTML but did
not stop the init function.

**Fix:** `let sb = window.OmegaSupabase?.sb || null;` and, as the first line of
each async `init*()`, `sb = sb || (window.OmegaSB ? await window.OmegaSB.get()
: null); if (!sb) return;` — matching the `await window.OmegaSB.get()` pattern
`bg.js` itself uses at lines ~1181/1301/1340. Re-verified clean.

### Not fixed, recorded

- `codex.html` fetches `export.arxiv.org/api` client-side; arxiv sends no CORS
  header, so it fails in production too. Needs an Edge Function proxy, not a
  source fix.
- Platform-wide a11y (advisory): sub-24px tap targets on the `bg.js` footer/nav
  chrome (`.tnav-btn`, `.omega-dash-link`, footer `<a>`), and ~5 unlabelled
  inputs (`mp-type`, `depthSelect`, `dateFilter`, `*-import-file`, `j-date`).
  Tracked as the `accessibility` capability; a dedicated sweep is the next step.

## Storage upload never ran on 2 of 4 pages, and reported success on 3 (#175)

Found while closing the last `BLOCKED` live-verification line in
`docs/capabilities/registry.json` — the `import-export` capability, whose
contract said "Storage bucket RLS still unverified". Verifying it live turned
up a client bug the RLS check itself could not have shown.

### The swapped argument

`upload.js:11` declares `upload:async function(bucket,file)`. Two of the four
call sites passed them the other way round:

```
profile.html:2147      OmegaStorage.upload(fileEl.files[0],'uploads')   // KYC document
marketplace.html:140   OmegaStorage.upload(fileEl.files[0],'uploads')   // listing file
publishing.html:153    OmegaStorage.upload('uploads',fEl.files[0])      // correct order
marketing.html:198     OmegaStorage.upload('uploads',fEl.files[0])      // correct order
```

With the string in the `file` slot the guards all pass — `'uploads'` is truthy,
and `'uploads'.size` is `undefined`, so `undefined > MAX` is `false` — and the
function reaches `file.name.replace(...)` at line 17, where `'uploads'.name` is
`undefined` and `.replace` raises a **TypeError inside upload()**.

Both callers wrapped the call in a try/catch. `marketplace.html`'s was a bare
`catch(e){}`. So the exception was swallowed, `file_path` stayed `null`, the
`marketplace_listings` insert ran anyway, and the page printed

> ✓ LISTED — Your work is now visible in the marketplace.

for a listing whose file had never left the browser. `profile.html`'s KYC
submit surfaced the raw TypeError text instead — no member could ever submit a
KYC document. That is §8.1 bug class 1 (a write that silently does nothing
while the UI reports success), reached through class 4's shape: a shared
accessor used on trust, its signature never checked against its callers.

### The third page, with the arguments right

`publishing.html:153` was `try{var up=await OmegaStorage.upload('uploads',
fEl.files[0]);if(up&&!up.error)filePath=up.path||null;}catch(e){}` — correct
order, and still bug class 1: `upload()` **returns** `{error}` rather than
throwing (Supabase's storage client resolves to `{data,error}`), so a failed
upload left `filePath` null, the `publications` insert ran, and the page said
"Committed to your archive." Only `marketing.html` checked and aborted.

### Fixed

- `upload.js` normalises a swapped pair, and now **returns** `{error:'No
  storage bucket named.'}` / `{error:'No file chosen.'}` instead of throwing a
  TypeError for a bad argument — its contract is to return, so a caller that
  checks `.error` is now sufficient on its own.
- All three call sites corrected: bucket first, `.error` checked, and the
  member told the upload failed *and* that nothing was listed/committed,
  instead of a success toast over a null path.

### Gated

`scripts/tests/test_storage_upload_contract.py`, 7 tests. The static half scans
every real `OmegaStorage.upload(` call and asserts (1) the first argument is a
quoted bucket name and (2) the call's **own** result variable is inspected for
`.error` within six lines. The node half loads `upload.js` with a
never-settling client stub and asserts the four bad-argument shapes return
`{error}` rather than throwing.

Mutation-checked, all four fail it: restoring the swapped args in
`profile.html`; deleting the `.error` check in `marketplace.html`; restoring
`publishing.html`'s swallowing form; restoring `upload.js`'s throw. The first
draft of assertion 2 matched any `.error` in the window and **passed** the
marketplace mutation — it was matching the unrelated `ins.error` two lines
below. Anchoring on the call's own variable is what made it decisive; a
mutation that a test survives is the test's finding, not the code's.

### Live storage RLS — measured, not assumed

Method per §8.4: `set_config('role','authenticated',true)` plus
`request.jwt.claims` with a real member uuid, every attempt inside a rolled-back
transaction, against project `ydqhzvvoyufiiqvzcjns`.

| attempt | result |
|---|---|
| insert into own `<uid>/` prefix (`uploads`) | ALLOWED |
| insert into another member's prefix (`uploads`) | DENIED 42501 |
| insert into another member's prefix (`avatars`) | DENIED 42501 |
| insert into the bucket root, no uid prefix | DENIED 42501 |
| insert into an undeclared bucket | DENIED 42501 |
| delete one's own upload | **DENIED 42501** |

No spoofing gap: both INSERT policies are
`WITH CHECK (bucket_id = <bucket> AND (storage.foldername(name))[1] =
auth.uid()::text)`, and `uploads read` is own-prefix `OR is_platform_owner()`.
`avatars read` is unscoped, which matches that bucket being `public:true`.

**Recorded, not fixed:** there is no DELETE policy on `storage.objects`, so a
member can never remove a file they uploaded. No client code offers a delete,
so this is a gap rather than a shipped bug — adding the policy is a product
decision about whether members may retract a KYC document or a listing file,
not a bug fix, and §9's rule is that an unverified item stays unverified rather
than being upgraded on assumption. Both buckets hold 0 objects today.

With this, `docs/capabilities/registry.json` has **0 of 15** capabilities
carrying a `BLOCKED` live-verification line — issue #175's "no capability may
be marked verified without evidence", measured rather than asserted.

## Time-bombs: the failures that arrive on someone else's schedule (2026-08-31)

Every gate in `scripts/` answered "is this code correct as written today".
None answered "will this same, unchanged code still work in six months". That
second class leaves no diff to blame, is invisible to `node --check`,
`audit.py`, the capability registry and the runtime render, and lands in
production on a third party's timetable. Five instances were already present.

`scripts/resilience-audit.py` now gates the class; `scripts/tests/test_resilience_audit.py`
(13 tests) proves each detector actually fires, since a gate that cannot fail
is not a gate. Wired blocking into `ci-local.sh` (step `2l`) and `ci.yml`.

### Fixed — floating dependency pins in 6 of 11 Edge Functions

`checkout`, `stripe-webhook`, `concierge`, `rankings`, `snapshot-leaderboard`
and `weekly-digest` each imported
`https://esm.sh/@supabase/supabase-js@2` — no minor, no patch. esm.sh resolves
that at *deploy* time, so two deploys of byte-identical source can ship
different libraries, with nothing in the repo to explain the difference.

Pinned all six to **2.112.4** — the version `vendor/supabase-js.js` already
ships to every browser on this platform, so it is the one version here with
production evidence behind it. The two `graphify-*` functions were left on
their existing explicit `2.39.8`: they are *pinned*, so they are not this bug,
and moving them is an upgrade decision, not a resilience fix.

This repo already paid for this lesson once — `vendor/supabase-js.js` exists
because a third-party CDN on the critical path took the whole platform down
(that file's header; CLAUDE.md §4). The Edge Functions were still doing it.

### Fixed — `weekly-digest` imported the frozen `deno.land/std`

`supabase/functions/weekly-digest/index.ts:6` pulled `serve` from
`https://deno.land/std@0.168.0/http/server.ts`. That line is frozen and being
retired in favour of JSR, and Supabase's Edge Runtime has provided `Deno.serve`
natively for years — so the dependency bought nothing and could only ever
break. Removed the import; `serve(async (req) => {` → `Deno.serve(async (req) => {`.
Every other Edge Function in the repo already used `Deno.serve`, so this was
the lone holdout, not a new pattern. Verified: 0 `deno.land` references remain,
braces and parens balanced. `deno check` is not installed in this environment —
CI step 6 covers it (non-blocking there).

### NOT fixed, deliberately — Stripe API version is unpinned

`checkout/index.ts:57` and `stripe-webhook/index.ts:238` call `api.stripe.com`
with no `Stripe-Version` header. Stripe then applies **the account's default
API version**, which moves when Stripe migrates the account or someone clicks
upgrade in a dashboard this repo cannot see. Request and response shapes change
under code that never changed — in real payment code (CLAUDE.md §5).

This is the highest-severity item found, and it is reported as a *warning*
rather than auto-fixed on purpose: the correct value is the account's current
default version, readable only from Stripe Dashboard → Developers → API
versions. Pinning a guessed string breaks checkout **immediately** instead of
eventually. Per CLAUDE.md §10 this is HIGH-RISK (payments) and wants the
`grill-me-codex` gate before the change. Remediation, for whoever has the
dashboard open: read the account's current default, send it as `Stripe-Version`
on every `api.stripe.com` request, then redeploy and verify a real checkout.

### Also reported as warnings — owner decisions, not code bugs

- **All 5 workflows target one label set**, `[self-hosted, Windows, X64]` —
  one physical machine. While it is offline every gate is unrunnable, jobs
  queue indefinitely, and nothing can be validated or merged: CI failure is
  total, not partial. Every `scripts/*.py` gate is platform-independent, so a
  hosted-runner fallback lane is possible without touching the Windows-specific
  steps. Costs money, so it stays the owner's call.
- **`vercel.json` sets `Content-Security-Policy-Report-Only` with no
  `report-uri`/`report-to`.** Report-Only does not enforce, and with no
  endpoint the violations go nowhere — the header costs bytes and buys nothing,
  while reading to a future session as protection that is not happening (the
  same shape as `OmegaGuardian`'s badge, CLAUDE.md §8.2).

### A gate against rot, not just against today

`live-schema.json` is what `schema-dictionary.py` checks every client column
name against — the only defence against §8.1's most expensive recurring bug
class — and it is a hand-captured dated file that nothing ever forced anyone to
refresh. The audit now fails when `_captured` is missing, unparseable, or more
than 90 days old (currently 2026-08-29, 2 days). 90 is deliberately generous:
a gate that cries every fortnight gets ignored, which is worse than no gate.

### Corrected while investigating

A first pass concluded that `workflow-contract.yml` and `runner-probe.yml`
would fail the registry check because they run `ci-local.sh` without
`fetch-depth: 0`. **Wrong** — neither executes it. `workflow-contract.yml` only
asserts the file contains a `--help` string, and `runner-probe.yml` names it in
a comment explaining why it deliberately does *not* run it (no bash on that
runner). The shallow-clone dependency is confined to `ci.yml`, which correctly
sets `fetch-depth: 0`. Recorded because the grep looked conclusive and was not
— CLAUDE.md §8.4's "a repo-wide grep is a candidate generator, not a verdict".

**Scope this audit does NOT cover, stated plainly:** it reads the repository.
It never reached Stripe, esm.sh, npm or the live database, so it proves a pin
is *present*, never that it is *right*. A pinned version that is later
unpublished, or a `Stripe-Version` string that is wrong for the account, both
pass this gate.

## Nine floating CDN dependencies on every page view, and a CSP that would have broken four features (2026-08-31)

Follow-up to the time-bomb entry above, after being told to stop handing
decisions back and make them. Three were outstanding: the Stripe API version,
the single CI runner, and the inert CSP. Working them turned up a larger
problem than any of the three.

### The CSP was never validated against the app it protects

`vercel.json` shipped a `Content-Security-Policy-Report-Only` header. Enforcing
it as written would have broken the platform, which is why it had to be tested
rather than promoted:

- `style-src 'self' 'unsafe-inline'` did **not** include `fonts.googleapis.com`,
  and `bg.js:123` injects the Google Fonts stylesheet. Enforcing would have
  killed the brand webfonts on all 178 pages — the same fonts §4.1 records as
  only recently working at all.
- `script-src 'self' 'unsafe-inline'` did **not** include `esm.sh`,
  `cdn.jsdelivr.net` or `unpkg.com`, all of which the app loads at runtime.

Verified by serving the repo with the policy applied and reading real
`securitypolicyviolation` events in headless Chromium — 5 distinct violations
across 7 of 8 sample pages. The corrected policy produces **0**, then
re-verified across every `.html` page in the repo.

### The finding the grep could not have made: 9 floating CDN dependencies

The violation events named scripts no source scan had reported.
`grep -rhoE '(src|href)="https://...'` over every page and module returns five
social links and nothing else, because **every one of these is injected at
runtime by JavaScript**, never written as markup. CLAUDE.md §8.4 says a
repo-wide grep is a candidate generator, not a verdict; here it was not even a
candidate generator.

`omega-oss.js` — injected by `bg.js` on every page (`bg.js:1712`) — is a
registry of third-party CDN libraries, and every entry floated:

| file | was | now |
|---|---|---|
| `omega-oss.js` | `unpkg.com/lucide@latest` | `lucide@1.37.0` |
| `omega-oss.js` | `chart.js@4` | `4.5.1` |
| `omega-oss.js` | `fuse.js@7` | `7.5.0` |
| `omega-oss.js` | `dayjs@1` (×2, incl. plugin) | `1.11.23` |
| `omega-oss.js` | `marked@12` | `12.0.2` |
| `omega-oss.js` | `highlightjs/cdn-release@11` | `11.12.0` |
| `omega-oss.js` | `@popperjs/core@2` | `2.11.8` |
| `omega-oss.js` | `tippy.js@6` | `6.3.7` |
| `omega-tooltip.js` | `tippy.js@6` (second copy) | `6.3.7` |
| `omega-tour.js` | `shepherd.js@13` (js + css) | `13.0.3` |
| `omega-particles.js` | `tsparticles-slim@2` | `2.12.0` |
| `omega-qr.js` | `qrcode-generator@1` | `1.5.2` |
| `omega-passport.js` | `esm.sh/jspdf@2` | `2.5.2` |
| `omega-music.js` | `esm.sh/tone@14` | `14.9.17` |
| `graph.html` | `esm.sh/d3@7` | `7.9.0` |

`lucide@latest` is the worst of them: whatever the maintainer published minutes
ago, executed on every page view that renders an icon.

**Every version was resolved from `registry.npmjs.org`, not from memory.** The
CDNs themselves are 403 at this environment's egress proxy, but the npm
registry answers 200 — so each pin is the highest release *within the range the
code already requested*, which makes pinning behaviour-preserving today and
frozen from here. A guessed version that does not exist would break the feature
immediately, which is worse than the floating pin it replaced.

This is the same lesson `vendor/supabase-js.js` was created for. That fix
removed one CDN from the critical path and left fifteen.

### Stripe: solved from the code, not the dashboard

The previous entry deferred this for want of the account's default API version.
That was the wrong framing. Reading what the code actually parses settles it:
`stripe-webhook` reads `current_period_end` at the **top level** of the
Subscription object in three places (`:145`, `:179`, `:251`) — a field Stripe
**removed** in `2025-03-31.basil` and moved onto subscription items. So the
account default silently migrating is not a hypothetical: it makes `periodEnd`
null and subscription expiry stops being recorded, silently, in payment code
(§8.1 class 1).

Two of those three sites read the **inbound webhook payload**, whose version is
a property of the endpoint in the Stripe dashboard and cannot be pinned from
code at all. So pinning alone could never have fixed it. Fixed properly with
`periodEndSeconds()`, which reads the pre-basil top-level field **or** the
basil per-item field — correct under either version, needing no dashboard
access. `Stripe-Version: 2025-02-24.acacia` (last pre-basil) is additionally
pinned on both outbound calls for determinism, and `plan.nickname` now falls
back to `price.nickname`, `plan` being the legacy of that pair.

### CI runner: the recommendation was wrong, and is now corrected

The previous entry advised adding a GitHub-hosted fallback lane. That advice
was wrong and has been reversed in the audit's own output.
`docs/CI_RUNNER_RECOVERY.md` records why the repo moved *off* hosted runners:
the hosted lane returned `runner_id: 0` with `steps: []` — reporting success
without executing anything. A fallback lane that lies is worse than no lane.
The real mitigations, now named by the gate: a second self-hosted runner on the
same labels, and `./scripts/ci-local.sh` via `.githooks/pre-push`, which does
not depend on GitHub at all.

### Gate extended

`scripts/resilience-audit.py` now also scans root `*.js`/`*.html` for CDN URLs
without a full `major.minor.patch`, flagging `@latest` separately as
UNVERSIONED. 16 regression tests (up from 13). Warnings are down from 3 to 1;
the survivor is the single physical runner, which no code change can fix.

### CLAUDE.md §7 claimed a CI gate that does not exist (2026-08-31)

§7 item 6 read "`deno check` on every Edge Function (non-blocking)".
`grep -rn deno .github/workflows/ scripts/ci-local.sh` returns **zero hits**.
There is no Deno step anywhere: not in `ci.yml`, not in the four other
workflows, not in the local gate. The Edge Functions — including the Stripe
payment path — have had **no automated syntax or type coverage at all**.

Found while closing a risk this session's own change created: 3 Edge Functions
were edited (`checkout`, `stripe-webhook`, `weekly-digest`) and a syntax error
would have surfaced only at deploy time. A documented-but-absent gate is worse
than a known gap, because the next session trusts it — the exact drift §9's
"keep the docs current" rule exists to prevent, and it had reached the file
that is loaded into every session.

**Corrected in CLAUDE.md** to state the real coverage (the import-pin rules in
`resilience-audit.py`, and nothing else).

**Deliberately not "fixed" by adding a `deno check` CI step.** Deno is not
installed in this environment, so such a step could not be tested before
pushing, and the runner is a single self-hosted Windows box whose behaviour is
documented as fragile (`docs/CI_RUNNER_RECOVERY.md`). Adding an unverifiable
step to the one lane that gates every merge risks turning CI red for everyone
with no way to reproduce it locally. That is a change to make with the runner
in front of you.

**Method that worked here, for the next session.** `deno` is unavailable but
the TypeScript compiler API is: `npm i typescript@5` into the scratchpad, then
`ts.createSourceFile(...).parseDiagnostics` over `supabase/functions/**/*.ts`.
That is a *parse* check, not a type check — it proves the file is well-formed
TypeScript, not that its types are sound — but it catches exactly the class a
scripted edit introduces. All 11 functions parse clean at this commit.
Note `typescript@7` is the native port and does **not** expose
`createSourceFile` from its main entry; `@5` is the one with the classic API.

## Gateway: making the mark the door, and a filter that hid nothing (2026-09-01)

The owner's direction was that the platform should be graphic before textual,
that each page's emblem and name should be the clickable way in, and that no
subject should repeat across pages. Measuring first changed what the work was.

### What the measurement actually showed

A scan of all 178 pages for duplicated content found **2 duplicate `<title>`s
(`membership`/`subscriptions`, `rune`/`sigil`), 0 duplicate headings, and 0
duplicate copy blocks**. There is almost no copy-paste text here, so
"repetitive subject" could not mean repeated wording.

Re-measured against shared data instead — two pages reading the same tables are
showing the member the same thing whatever their headings say — the real
overlap appeared. The first pass was wrong and its own false-positive class is
worth recording: ranking pairs by shared tables put `academy`/`payments`/
`gaming`/`beacon`/`analytics` at "100% overlap" purely because every page reads
`profiles` and `task_completions`. Excluding the universal tables left the
genuine clusters: the **8-page `graph-*` family** on
`graph_entities`/`graph_relationships`/`graph_events`, plus
`honors`↔`trophies` (`certificates`, `medals`, `trophies`),
`publishing`↔`studio`, `news`↔`queue`, `evolution`↔`matrix`,
`portfolio`↔`vault`.

**Only 39 of 178 pages carry a subject-bearing table at all**; 36 have no
table, no RPC and no `localStorage`. That is the root cause of the repetition:
there are not 178 distinct subjects.

### What was already built, and what was missing

`omega-page-emblem.js` already does exactly what the direction described — a
per-page mark derived from what the page IS (lattice, axis, glyph) — and it was
already live on **165 of 178 pages**. Nothing needed inventing. What was
missing was that the mark was decoration *inside* a page you had already
reached; navigation was a sidebar of 15 sections and **223 written labels**,
and there was no hub page anywhere (`index.html` does not exist; `command`,
`atlas`, `grid`, `universe`, `gates` each contain **0** internal page links).

Added `gateway.html` + `omega-gateway.js`: every destination as its own emblem
plus its name, the whole tile a link, grouped by axis, with a filter. 171 tiles
(175 registry entries less the 4 excluded system pages). Ten pages that had no
identity were given one — `architecture`, `council`, `hercules`, `graphify` and
the six `graph-*` pages; `404`, `enter`, `offline` and `reset` deliberately get
none, being states rather than destinations.

**One source of truth.** The tile list and every mark come from
`OmegaPageEmblem.pages`. This module keeps no page list of its own — a second
hand-kept list would be the duplication the page exists to remove.

### The performance constraint that shaped it

`draw()` opens a `requestAnimationFrame` loop per mark that never stops.
Correct for one emblem; on a grid of 171 it would run 171 permanent loops each
repainting a 264x264 canvas every frame. So `draw()` gained an optional `opts`
(`size`, `animate`) — defaults `132`/`true`, so every existing caller is
unchanged — and the gateway draws once, statically, with the rotation moved to
a CSS transform on hover/focus. Regression-tested: `dashboard`, `profile`,
`academy`, `vault`, `cosmos`, `matrix` all still paint at 132px/264px **and
still animate**.

### The bug only the render caught

The filter set `tile.hidden = true` and **every tile stayed on screen**. An
author `.gw-tile{display:flex}` beats the UA stylesheet's `[hidden]{display:none}`.
The harness reported "8 visible" and passed, because it counted the `hidden`
DOM property — which was set perfectly correctly. Only the screenshot showed
171 tiles under a status line reading "8 of 171 match".

Fixed with `.gw-tile[hidden]{display:none!important}`, and the check was
changed to assert **computed `display`** rather than the property, so it can no
longer pass while the UI is broken. This is §8.4's "verify it applies in a
render" in a new shape: the earlier case was a rule that reached the file but
not the cascade; this is a property that was set but overridden.

Also fixed while verifying: the destination count blanked itself on load (the
filter's first pass overwrote `boot()`'s value), and the per-axis count stayed
at its unfiltered total above a filtered grid.

### Verification

19/19 blocking checks, 126 tests, 0 dead links out of 171, no horizontal
overflow, all 171 marks confirmed painted by reading canvas pixel alpha rather
than assuming. `scripts/verify-runtime.js` could not run: the scratchpad's
`playwright-core` expects `chromium_headless_shell-1234` and this environment
ships `chromium-1194`, so it reports SKIPPED — the checks above were run
against `/opt/pw-browsers/chromium-1194` with an explicit `executablePath`.

## Revenue that did not exist, rendered as fact (2026-09-02)

`ad-network.html` reached `main` and showed every approved member three
figures:

```
TOTAL REVENUE  $0.10      CREATOR SHARE  $0.07      PLATFORM SHARE  $0.03
```

directly above the sentence **"Creators earn 70% revenue share."**

Measured, not inferred — a headless render of `0ec01227` returns exactly
`["$0.10","$0.07","$0.03"]` from `document.body.innerText`.

### Where the money came from

`omega-ad-network.js:50-52`, inside `recordImpression()`:

```js
REVENUE.total         += 0.05;
REVENUE.creator_share += 0.035;
REVENUE.platform_share += 0.015;
```

`recordImpression()` fires when one of five **hard-coded specimen
advertisements** is painted. No advertiser was ever billed, no payout path
exists, and `REVENUE` is a module-level variable, so the total resets to zero on
reload — it was not even a persistent fiction. The $0.10 was two ad previews at
five cents each, split 70/30.

That is §8.1 class 9 (fabricated data rendered as fact) landing on a financial
surface, plus §9's dormancy rule going unapplied. The expensive half is not the
broken number: it is a member-visible written statement that people are owed a
70% share of money that does not exist.

### Why the rule did not hold

§9's mechanism existed and was never shared. `get_platform_flag(p_key)` has been
in the schema since `chunk_02b_migrations.sql:532`, but a repo-wide grep finds
**three** pages that only *mention* a flag in prose (`vault`,
`sovereign-covenant`, `compliance`) and exactly **one** that calls the RPC
(`interface-omni.html:215`, to toggle it). There was no shared reader, so
gating was whatever each page's author remembered to do.

### The fix

`omega-flags.js` makes it declarative and platform-wide:

```html
<div data-omega-flag="ad_network_enabled"> … </div>
```

hidden until `get_platform_flag` answers `true`, with a dormancy notice naming
the flag put in its place. Two flags added, both default false
(`supabase/omega_commerce_flags.sql`, `migrations/0106`):
`ad_network_enabled` and `creator_earnings_enabled` — deliberately separate, so
enabling advertising cannot silently promise a member payout.

Three things this got right only after being tested:

**The hide rule cannot live in the module.** `bg.js` injects `omega-flags.js`
through `__omegaAppend`, and a dynamically-created script is **async** — it is
not guaranteed to parse before the approval guard adds `omega-approved` and
reveals the shell. So the `[data-omega-flag]:not([data-omega-flag-on])` rule is
written synchronously in `bg.js`, beside the approval guard's own rule, and
`omega-flags.js` only performs the RPC and the reveal. Unlike the approval
guard it is **not** skipped on public pages: a signed-out visitor must not see a
dormant revenue figure either.

**Failing closed is not the same as never opening.** The first version of
`adsAllowed()` read `window.OmegaFlags` once and returned `false` if absent.
Because of the same async injection, `OmegaFlags` is usually absent when the ad
module's `DOMContentLoaded` runs — so the gate was shut *permanently*, and would
have stayed shut after the owner enabled the network, reading exactly like a
broken feature. Caught by testing the **open** direction, not just the closed
one. Fixed with a bounded frame wait (§8.1 class 5: defer, do not discard);
exhausting the wait still resolves `false`.

**A gate proven only closed is not proven.** All three directions are now
tested in a real browser — flag off: hidden, notice present, 0 ad units; flag
on: revealed, 2 ad units; RPC error: hidden, 0 units, notice present.

### The durable gate

`scripts/commerce-contract.py` (blocking, `ci-local.sh` step 2m, `ci.yml`)
fails on either shape: an earnings claim in a client file that names no gate, or
a hard-coded amount accumulated into a revenue-shaped variable in a file that
renders currency. Cross-checked against the pre-fix commit rather than trusted:
run at `0ec01227` it reports `omega-ad-network.js:50`, `:51`, `:52` and
`ad-network.html` — the exact lines above.

**The false-positive pass mattered more than the detector.** A first run
reported 20 files; 13 were noise, and the noise was measured, not guessed:
`decommission` matching `commission` (`audio.js`, `nav.js`, `omega-a11y.js`),
"earn **points**" matching "you earn" (`i18n.js`), a 20% share of *effort*
(`matrix.html`), a `<label>` over the member's own calculator input
(`contracts.html`), and a code comment quoting the offending label text
(`omega-a11y.js`). The gate now blanks comments and `<label>` text before
matching — replacing with spaces, not deleting, so reported line numbers stay
true.

The seven that survived were real, and none was whitelisted. `marketplace`,
`blockchain`, `income`, `contracts`, `automation`, `cosmos` and `chatbot` all
stated a 9.17%/17% commission in the present tense on an Ω economy that is
dormant behind `tokens_enabled=false`. Each now states that, the way `vault.html`
already did.

Scope was checked before assuming: a render of `contracts`, `income`,
`marketplace`, `blockchain`, `subscriptions`, `revenue`, `investment`, `wealth`,
`treasury` and `payments` found **zero** non-zero currency amounts, so
`ad-network.html` was the only page inventing money and the gate starts with no
legitimate violations to suppress.

### Also fixed: seven pages nothing linked to

A separate finding from the same pass, and the first framing of it was **wrong**
— worth recording, because the two concerns look like one. `nav.js` has two
independent maps: `SECTIONS` decides which links render, `PS` decides which
section highlights as active. A first count said "15 pages unreachable"; the
real numbers are **7 unreachable** (`ad-network`, `architecture`,
`control-plane`, `creator`, `exam`, `project-studio`, `world-shell`) and **15
without an active-state entry** — including `gateway`, the page whose entire
purpose is to be the way in.

Both are now zero. The active-state check first reported all 11 sampled pages
failing *including `dashboard`*, which has always had a `PS` entry — the
selector was wrong, not the nav (§8.4: a scanner needs its own false-positive
pass). nav.js marks `.on-icon.on-active`; with that selector every page
highlights its correct section.

`architecture.html` deserved more than a link. It was a 1.4 KB stub whose only
content read *"See browser console for runtime registration"* — no `#omega-side`
container, so it was the one page in the estate rendering no sidebar at all, and
its own `:root` tokens had drifted from the platform's. Linking it would have
delivered members to a page telling them to open devtools.
`omega-architecture-runtime.js` already exposes `status()` with all 16 blocks
and their evidence, so the page now renders them: 16 blocks, 1 probed as
CONNECTED in-session, no console instruction, no overflow, no errors.

Five emblem registry entries were added for the merged pages, which had none —
so each drew the generic fallback mark and none appeared in the gateway, whose
destination list derives entirely from `OmegaPageEmblem.pages`. Gateway now
renders **176** destinations (was 171), 0 dead links, 0 duplicates.

### Verification

**20/20 blocking checks** (was 19; commerce-contract is new), **144 tests**
(was 126; 18 new in `scripts/tests/test_commerce_contract.py`, covering both
real shapes, all five measured false positives, and each of the three accepted
gate references).

`node scripts/verify-runtime.js` **ran for real this time** — PASS on all 13
capability entrypoints. The previous
entry recorded it as SKIPPED; the cause was a layout mismatch, not a missing
browser. `migrations/0106` was applied against a real scratch PostgreSQL 16 instance
rather than eyeballed: it applies clean, re-applies clean, and — the property
that actually matters — after `ad_network_enabled` is set true, re-running
leaves it true. `ON CONFLICT DO NOTHING` means the file can never switch a flag
back off after the owner has enabled it.

`playwright-core` resolves `chromium-1234/chrome-linux64/chrome` and
`chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell`,
while the image ships `chromium-1194/chrome-linux/chrome` and a headless binary
named `headless_shell`. Symlinking both expected layouts onto the installed 1194
build makes the repo's own verifier run unmodified — worth doing rather than
substituting an ad-hoc harness, since it asserts the capability contracts.

## A pointer event before the first resize killed the background canvas (2026-09-03)

`bg.js:1145` normalised the pointer against the viewport:

```js
window.addEventListener('pointermove',function(e){tmx=e.clientX/W;tmy=e.clientY/H;},{passive:true});
```

`W` and `H` are declared `var W=0,H=0` (`bg.js:870`) and only get real values when
`resize()` first runs. A `pointermove` arriving inside that startup window
divides by zero: `e.clientX/0` is `Infinity`, and `0/0` is `NaN`.

Neither is caught anywhere. `tmx` feeds `mx`, `mx` feeds
`gOff()` → `{x:(mx-0.5)*60}`, and that reaches

```js
var hg=ctx.createRadialGradient(CX+o.x,CY+o.y,2,CX+o.x,CY+o.y,hr);
```

which throws **`Failed to execute 'createRadialGradient' on
'CanvasRenderingContext2D': The provided double value is non-finite.`**

It never recovers. `mx` is eased toward `tmx` every frame, so once `tmx` is
`Infinity` the value stays poisoned and the entire orrery/nebula background is
dead for the rest of the session, on every page — `bg.js` loads on all of them.

### How it was found, and why it looked like something else

`node scripts/verify-runtime.js --all` reported **22 failing pages**. The obvious
reading was that the session's own `bg.js` edit had broken them. It had not, and
the evidence that settled it is worth recording because the first two comparisons
were both misleading:

- A **targeted before/after harness** on the 8 loudest pages reported `0` errors
  at both commits — it simply never hit the race, so it could not discriminate
  at all. A harness that reproduces neither side is not a comparison.
- The **full `--all` sweep at `0ec01227`** reported 19 failures — but the sets
  differed in *both* directions: 10 pages failed only after, and **7 failed only
  before**. A regression cannot fix pages. Re-running those 7 at the *same* HEAD
  commit failed 2 of them again, which proved the failing set is not stable
  across runs of identical code.

So the sweep's page list is noise; only a deterministic reproduction means
anything. Firing `pointermove` repeatedly at 1 ms intervals from
`addInitScript` forces the race every time, and reproduces the throw at
`0ec01227` **and** at HEAD — the same result on both, which is what actually
exonerated the session's change.

Two earlier "0 findings" in this same investigation were also false and are
worth naming: a `nohup`'d sweep was killed with its parent shell and left an
empty file, and `grep -c FAIL` on that empty file returned `0`. That is §8.4's
"verify a 0 findings result is real" and §8.2's Windows note (a crashed child
yields empty stdout) recurring on Linux.

### The fix

Guard the divisor, which is the whole bug:

```js
window.addEventListener('pointermove',function(e){
  if(!(W>0)||!(H>0))return;
  tmx=e.clientX/W;tmy=e.clientY/H;
},{passive:true});
```

`!(W>0)` rather than `W===0` so a `NaN` width is rejected too.

The `deviceorientation` handler two lines below had the same class of hole:
it guarded `e.gamma != null` but then read `e.beta`, and `(null-45)` is `NaN`,
which `Math.min`/`Math.max` propagate rather than clamp. Each axis now checks
its own value.

### Verification

The deterministic reproduction goes **1 throw → 0**. 20/20 blocking checks and
144 tests still pass. This is a pre-existing defect, present at `0ec01227` and
every commit before it — not introduced by the commerce-flag work in the same
branch, which the dual-commit reproduction is the proof of.

## An unenforced rule drifts within hours: the reachability gate (2026-09-03)

CLAUDE.md section 9 has always said it: *"Don't write a new page without ...
adding it to `nav.js`'s `PS` map and the relevant `SECTIONS` entry — otherwise
it's unreachable from navigation."* Like section 9's dormancy rule before
`commerce-contract.py`, it had no enforcement, so it held only as long as
someone remembered.

It did not hold. Seven pages linked from nowhere and fifteen with no
active-state entry were driven to zero earlier the same day; a merge brought
**two more unreachable pages** (`verify-deployment.html`, `verify-modules.html`)
within hours. Two unenforced rules, two identical outcomes — which is the
argument for the gate rather than another sweep.

`scripts/reachability-contract.py` (blocking, `ci-local.sh` step 2n, `ci.yml`).

### The distinction that had to be built in

`nav.js` holds two independent maps, and reporting them as one produced a wrong
number the first time:

| map | decides | a page missing from it |
|---|---|---|
| `SECTIONS` `sub[]` | which links render | **unreachable** — nothing points to it |
| `PS` | which section shows active | renders nav, highlights nothing |

A first pass checked only `PS` and reported "15 pages unreachable". The real
numbers were **7** and **15**. So unreachability blocks and active-state is
advisory, reported separately.

### Keying on the href, not the slug

Several `SECTIONS` entries deep-link into another page:
`['gates','12 GATES','/elements.html#gates']`. That makes `elements.html`
reachable and leaves `gates.html` exactly as unreachable as before. Keying on
the entry's *slug* would have called `gates.html` linked because an entry named
`gates` exists. The gate resolves the href, strips the fragment, and both
behaviours are pinned by tests.

### Exemptions carry their reason

`SYSTEM_PAGES` lists the ten pages that are not member destinations — error
states, the signed-out pages, the two owner diagnostics from the merge — each
with why. "Exempt" with no reason recorded is how an unreachable page gets
quietly normalised. The gate also reports a *stale* exemption (a listed page
that no longer exists); it caught one in its own first run (`sovereign`, a
`vercel.json` redirect target with no file), which was removed.

### What it cannot check

That the sidebar actually appears. `nav.js` returns immediately without an
element with id `omega-side`, so a perfectly-registered page can still render no
navigation — `architecture.html` was exactly that. The `no_nav_container` check
is a best-effort grep; `scripts/verify-runtime.js` is what proves it.

### Verification

Cross-checked against `0ec01227` rather than trusted: run there it reports
precisely the seven pages that were unreachable at that commit. 10 new tests
(154 total), 21/21 blocking checks.

**Note for the next session: CLAUDE.md is now at exactly 16,000 of its 16,000
token budget.** Adding any standing fact to section 8 now requires removing one
first. Two items were compressed to fit this entry's baseline updates.

## skills.html rendered nothing, ever (2026-09-03)

`skills.html:83` was

```html
<div class="shell" id="app" style="display:none">
```

and **nothing on the page ever removed that inline style**. The page has no auth
boot at all — its five `getSession` matches are its own `getSessions()` helper,
not Supabase Auth — so the container stayed `display:none` for every visitor,
approved or not. A whole page, reachable from navigation, showing a blank
screen.

It is the only page in this state: a scan for an inline-hidden `#app` with no
code that reveals it returns exactly one file.

**Fixed by deleting the inline style, not by adding a reveal.** `bg.js`'s
approval guard already owns this element —
`body:not(.omega-approved) #app, .shell, main.main {display:none!important}` —
so the inline hide was redundant for safety and fatal for visibility.
`charter.html` is the same shape without the inline style and works correctly;
`skills.html` now matches it. Verified in both directions: an unapproved visitor
gets `shell.display:none` with the guard style present, and an approved one gets
`flex`.

## habits.html rendered every habit twice with the same id (2026-09-03)

`renderHabitCard()` emitted `id="hc-${habit.id}"`, and `renderToday()` /
`renderAll()` both call it for the same habits into `#today-list` and
`#all-list`. A five-habit account therefore produced `hc-h0`…`hc-h4` twice each:
invalid HTML, and any `getElementById` would silently return whichever came
first. The `showAll` flag already distinguishes the two lists, so it now
namespaces the id (`hc-today-…` / `hc-all-…`). Nothing reads the id — grepped
before changing it — so this is inert beyond correctness. Duplicate count in a
render: 5 → 0.

## Two scanner false positives worth recording (2026-09-03)

Both were produced while chasing the above, both looked alarming, and both were
wrong. They are §8.4's "a scanner needs its own false-positive pass" in two new
shapes.

**"academy.html leaks content to an unapproved visitor."** A harness loaded
`academy.html` with no session and measured `.shell` at `display:flex` with 3,593
characters of visible text. The page had in fact **redirected**: `location.pathname`
was `/account.html`, a public page that is correctly visible and correctly has no
approval guard. The scanner was measuring a different document than the one it
named. **Assert the URL after any page whose auth path can navigate.**

**"settings.html fails open."** 44 pages reveal `#app` from inside a `catch`
block — `}catch(e){document.getElementById('app').style.display='flex';}` — which
is genuinely fail-open in shape. Tested against a stubbed profile read that
throws, `academy`, `dashboard` and `vault` all stayed hidden: `bg.js`'s guard
uses `display:none!important`, and an `!important` stylesheet rule beats a normal
inline style, which is exactly what `bg.js:106` says it is for. `settings.html`
reported `(absent)` only because the harness looked for `.shell` and that page
uses `#app` with no such class — the guard covers all three selectors, the
harness covered one. Corrected to check the same three, and **no page fails
open**: unapproved members bounce to `/pending.html`, and a throwing profile read
leaves every page hidden.

So the 44-page `catch`-reveals pattern is safe as written *because* of the
`!important` guard. Worth knowing before anyone "simplifies" that rule.

## charter.html rendered nothing, because two exempt lists disagreed (2026-09-03)

The last failing page in the full-estate sweep, and the same *symptom* as
`skills.html` from an entirely different cause. `bg.js` keeps two independent
exemption lists and they had drifted apart:

| list | line | contents |
|---|---|---|
| approval guard's `PUBLIC` | `bg.js:219` | account, enter, reset, terms, pending, index, / |
| access guard's `EX` | `bg.js:1231` | '', index, account, terms, **charter**, reset, enter, pending |

`charter` was in one and not the other. So the approval guard **did** inject
`body:not(.omega-approved) .shell{display:none!important}` on charter.html,
while the access guard that calls `__omegaApprove(true)` hit
`if(EX[pg])return;` and never ran. The page was hidden with nothing left to
unhide it — blank for every visitor, approved or not, permanently.

This is CLAUDE.md section 8.1 class 8 (two divergent copies of one canonical
list) in a new place: the previous instances were the 12 signs and the 12
labors, not a pair of security exemption lists.

### Which way to reconcile, and why

Both directions were available. `charter.html` makes **zero** Supabase calls —
`grep -c "supabase\|OmegaSB\|\.from("` returns 0 — so it is static governance
text holding no member data, and `EX` already groups it with `terms`. Gating it
instead would hide the governing document from exactly the pending members it
governs. So `charter` was added to `PUBLIC`, and the comment on that line now
says the two lists must change together.

**This is a visibility change and should be read as one:** charter.html is now
readable without approval, like terms.html. It was previously readable by
nobody, so nothing regressed, but if the owner wants it member-only the fix is
to drop `'charter'` from `EX` instead — one line, the other direction.

### Verification

Runtime verification on `charter` plus two controls (`governance`, `dashboard`)
passes. The guard still holds everywhere it should: an unapproved member bounces
to `/pending.html` on academy/dashboard/vault/settings, and with a profile read
stubbed to throw, all four stay `display:none` — the 44-page
`catch{ #app.style.display='flex' }` pattern remains covered by the guard's
`!important`.

Full estate before this session's runtime work: **22 pages failing**. After:
`node scripts/verify-runtime.js --all` reports **PASS (186 pages)** — zero
failures across the whole estate, confirmed by a full sweep rather than by the
subset runs that guided each individual fix.

## CLAUDE.md described OmegaGuardian wrongly on two of three counts (2026-09-03)

§8.2 carried this, loaded into every session:

> **`OmegaGuardian.gate()` is defined but never called**, and the
> `threat_signal` event it listens for is never emitted. The topbar badge
> therefore always effectively reads 100.

Two of those three claims are false, and the corrected version is a **more**
interesting finding than the wrong one.

### `gate()` is called

`approvals.html` calls it at **three** sites — 541, 568, 613 — each wrapping a
real privileged write:

```js
await window.OmegaGuardian.gate('admin', async function(){
  var ok = await rpcOk('grant_permanent_access', {p_uid: uid});
```

`'admin'` requires a score of 100 in `ACTION_LEVELS`, so the gate is not
decorative: it stands in front of granting permanent access.

### The badge is not frozen at 100

`injectGuardianBadge()` hard-codes `textContent='100'` at injection, which is
probably where the claim came from. But `updateBadge()` runs on
`setInterval(updateBadge, 2000)` and assigns `badge.textContent=_sessionScore`,
recolouring at the 70/40 thresholds. The badge tracks the real score every two
seconds.

And the score does move. `adjustScore` has three callers:

| site | effect | live? |
|---|---|---|
| `omega-guardian.js:104` | `-5` when a gated action throws | yes — inside `gate()`'s own `catch` |
| `omega-guardian.js:122` | `-10` after 30 min idle | yes — `setInterval(…, 300000)` with real activity listeners |
| `omega-guardian.js:129` | `RISK_EVENTS[event](d)` | **no** |

### What is actually true

The third row is the real finding. All six risk events —
`threat_signal`, `rate_limit`, `ua_change`, `console_clear`, `iframe_embed`,
`long_idle` — are **listened for and never emitted**. Checked one by one:

```
threat_signal   emitted in 0 place(s)
rate_limit      emitted in 0 place(s)
ua_change       emitted in 0 place(s)
console_clear   emitted in 0 place(s)
iframe_embed    emitted in 0 place(s)
long_idle       emitted in 0 place(s)
```

So the whole `RISK_EVENTS` table is dead wiring, and the score only ever falls
for idle or a thrown action — never because anything detected a threat. That is
a narrower and more accurate statement of the gap than "never called".

### Two near-misses while establishing this

**A guessed identifier.** `grep -n "_adjust("` returned nothing and briefly
looked like proof that the score can never change. The function is called
`adjustScore`; the name was mine, not the file's. The correct conclusion was the
opposite of the one that grep implied. §8.4's "a repo-wide grep is a candidate
generator, not a verdict", in the shape where the *pattern* is wrong rather than
the results.

**An unterminated comment that was terminated.** `omega-guardian.js:46` renders
as `/* ── SESSION HEALTH SCORE ────…` with no visible `*/`, which would put
`adjustScore` inside a comment and make three call sites throw. It is fine: the
box-drawing run is long and the terminal truncated the line. Counting delimiters
before line 47 gives 12 `/*` and 12 `*/`, and `node --check` passes. Verified
rather than reported.

### Left alone, deliberately

Emitting the six risk signals means building threat detection, which is the
architecture decision §8.2 says it is. `ops.html`'s `#evt-metrics-body` was
re-checked in the same pass and that entry is **correct** — `ops.html:485` looks
the id up and no HTML anywhere defines it.

## CI had not concluded a single run in two days (2026-09-03)

The visible symptom was a wall of failing checks and a runner log reading
`Job Page estate quality completed with result: Failed` nine times over. Neither
was what was happening.

**Measured, via the Actions API rather than the runner log.** Of the last **30
CI runs on `main`** — reaching back to `2026-09-01T14:34Z` — every one had
`conclusion: cancelled`. Zero `success`, zero `failure`. `page-estate-quality.yml`
over its entire history: **68 runs**, not one with a `success` or `failure`
conclusion. One job checked directly, `run_id 33707164446` → job `100498665358`:
`"conclusion":"cancelled"`, `completed_at 2026-09-03T02:35:08Z` — the exact
second the next push landed.

The self-hosted runner logs a cancelled job as `completed with result: Failed`.
So two days of *no CI at all* presented as two days of *failing CI*. The runner
log and the Actions API disagreed, and only the API was right.

**Cause.** Twenty workflows targeted the one serial self-hosted Windows runner.
Eleven of them were a full checkout wrapped around a single short Python script.
Each push queued twenty jobs behind one worker; the next push superseded them
before the runner arrived. Sum of the declared `timeout-minutes` across those
workflows is ~265 minutes of worst-case serial work per commit, against a push
cadence of minutes.

**The gates were never the cost.** Timed locally, all eleven run in **0.79s
combined**. The eleven checkouts around them were the entire expense.

Fixed by `scripts/contract-suite.py` (one list, one process, every gate reported
before exiting non-zero) plus `.github/workflows/contracts.yml` replacing the
eleven. Per-push runs on `main`: 20 → 9. Actions stops a job at the first failing
step and `workflow-contract-lint.py:22` forbids `continue-on-error: true`, so one
process is the only way to learn about more than one failure per queued hour.

Deliberately **not** fixed by moving to a hosted runner: §8.2 forbids it and
`docs/CI_RUNNER_RECOVERY.md` records why.

### Two gates were genuinely red, and the local gate could not see them

`content-uniqueness-contract` and `page-experience-contract` were blocking
workflows on GitHub but absent from `ci-local.sh`'s step list, so
`./scripts/ci-local.sh` and `.githooks/pre-push` both reported green over a red
`main`. §8.4's "verify a 0 findings result is real" in its most literal form: a
clean report from a check that never ran. Both now come from the one shared list.

`page-experience-contract.py` reported `defaults: missing primaryAction`. The
fix exposed a second defect: `config/page-experience.schema.json` sets
`"additionalProperties":false` on `defaults` and does not list `primaryAction`,
so the data file could not satisfy the schema and the gate at the same time —
§8.1 class 8, two divergent copies of one canonical spec. Schema updated to
match the gate. Nothing validates that schema today (`grep -rn '\.schema\.json'
scripts/ .github/` returns only `content-registry-contract.py:9`), which is why
the contradiction survived; it is still checked in, and a spec that contradicts
the live gate misleads whoever reads it next.

`content-uniqueness-contract.py` reported 2 duplicate titles and 3 duplicate
description groups across 13 pages. `subscriptions.html` was titled `Membership`
like `membership.html`; `rune.html` `SIGIL` like `sigil.html`. Thirteen pages
carried the site-wide tagline (`The Code. The Frequency. The Legacy…`) as their
own `<meta name="description">`. Each was rewritten from that page's actual
rendered text — `rune.html` is the `OmegaSigil` SVG generator, `subscriptions.html`
is plan/tier/payment-history — not invented. Billing copy stays future tense:
that feature is dormant (§8.2) and §9 forbids present-tense copy for a feature
that is not on.

### A workflow that could never have passed

`supabase-runtime-contract.yml` declared `shell: python` with the body
`python scripts/supabase-runtime-contract.py`. `shell: python` feeds the block
to the interpreter **as source**, so that line is a `SyntaxError` on line 1 —
reproduced directly:

```
  File "asif.py", line 1
    python scripts/supabase-runtime-contract.py
           ^^^^^^^
SyntaxError: invalid syntax
```

That is the 28-second `Supabase runtime health` failure in the runner log
(02:38:59 → 02:39:27): a checkout, then a parse error, never the contract.
`runner-probe.yml` uses `shell: python` correctly, with real Python in the body;
this one wanted a shell and got pwsh.

## The leaked-password advisory, closed where it actually could be (2026-09-03)

`get_advisors` reports `auth_leaked_password_protection` WARN. §8.2 already said
it could not be enabled on this plan; that claim was **re-verified rather than
repeated**, because three §8.2 claims had turned out wrong in the preceding days.
`get_organization(vztvuckpdsoriyvpdkzx)` → `"plan":"free"`, and the Supabase docs
page the advisory links states verbatim: *"Leaked password protection is
available on the Pro Plan and above."* It is an Auth dashboard property, so
neither `apply_migration` nor `execute_sql` can reach it. The claim stands.

The **corpus** behind the feature is not gated, though. `omega-password-guard.js`
checks strength and HaveIBeenPwned's Pwned Passwords range API at the only two
places this platform sets a password — `account.html` (`signUp`) and
`reset.html` (`updatePw`). k-anonymity: SHA-1 locally, send the first five hex
characters, match the returned suffixes in the browser. `vercel.json`'s enforced
CSP already permits it (`connect-src 'self' https: wss:`), so no CSP change.

**Stated plainly: this is client-side and a direct Auth API call bypasses it.**
Only the Pro-plan server setting is unbypassable. The advisory is not resolved,
and §8.2 says so.

**Verification.** `api.pwnedpasswords.com` is **403 at this environment's egress
proxy** (`curl: (56) CONNECT tunnel failed, response 403`), the same class of
block §8.4 records for `github.com` and `codeload` — so every live call returned
`checked:false`, which is indistinguishable from a broken implementation. That
had to be resolved rather than assumed:

- SHA-1 correctness against the published digest of `"password"`
  (`5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8`), so a wrong digest or a wrong
  prefix/suffix split fails instead of silently agreeing with itself.
- Real-format range responses (CRLF-delimited, `SUFFIX:count`) through a stubbed
  `fetch`, asserting the requested URL is `…/range/5BAA6` and nothing more.
- **In a real browser**, via Playwright with only the remote host routed: this
  exercises the actual `crypto.subtle` SHA-1 path and the real page wiring.
  `window.OmegaPasswordGuard` present on both pages, `breachCheck('password')`
  → `{"breached":true,"count":10382543,"checked":true}`, zero page errors.

The property that matters is that an unreachable API degrades to **unknown**,
never to clean — otherwise the sign-up page tells a member a compromised
password is fine. HTTP 503 and a thrown fetch both return
`{"breached":null,"checked":false}`, and `scripts/tests/test_password_guard.py`
pins it (13 tests; `test_*_degrades_to_unknown_not_to_clean` is the reason the
file exists). It fails **open** on purpose — a third-party outage must not stop
account creation, which is Supabase's own behaviour too — but it never claims a
check it did not perform, §8.1 class 1.

Password floor raised from 6 characters to 12 plus three of four character
classes, per the same docs page's free-tier guidance. Existing members are
unaffected: `signInWithPassword` is not gated, only `signUp` and `updateUser`.

One test assertion was wrong before it was right: `assertNotIn('password', url)`
fails on the hostname `api.pwnedpasswords.com`, which contains that substring.
Asserting on the path after `/range/` is the real property.

## Production audit of www.sydomega.com: GitHub, Vercel, Supabase (2026-09-03)

Asked to find whatever blocks the redesigned platform going live. Checked all
three surfaces. **Two of the three were clean**, which is worth recording as
plainly as the failures:

- **Vercel**: every one of the last 20 deployments `state: READY`. Production is
  `dpl_CrdkAqkaof8t6qKraqB5arzu5n1c` on `9c8707f1`, i.e. current `main`.
  `get_runtime_errors` over 7 days: **"No runtime errors found."** The build is
  not a blocker and never was — `vercel.json` disables install/build, so a
  static deploy cannot fail the way a bundled one can.
- **Supabase**: project `ydqhzvvoyufiiqvzcjns` `ACTIVE_HEALTHY`. Performance
  advisors: **244, every one INFO** (172 `unused_index`, 72
  `unindexed_foreign_keys`) — no ERROR, no WARN. Those two counts have moved
  from the 125/61 recorded in §8.2 but the classification has not; they are the
  same known noise on a platform with 9 profiles.
- Security advisors: **one** finding, `auth_leaked_password_protection`, already
  handled in this session's earlier entry.

`www.sydomega.com` itself returns **HTTP 200** with the enforced CSP intact.
The site is up. What was broken was the part nobody looks at from inside it.

### og-image.png was a 404 in production, on 11 pages

Every page's Open Graph and Twitter card pointed at
`https://www.sydomega.com/og-image.png` — **21 references across 11 pages** —
and the file does not exist in the repo. Fetched against the live domain it
returned **HTTP 404**, with Vercel serving the `404.html` body in its place. So
every share of this platform on WhatsApp, iMessage, Slack, X, LinkedIn or
Facebook has rendered a preview card with no image, for as long as those tags
have existed.

**Why no gate caught it.** `ci-local.sh`'s broken-asset check and `ci.yml` step 4
both resolve *local* `src=`/`href=` paths. An absolute URL is skipped, because an
absolute URL normally points at a third party nobody can validate offline. But a
URL on **our own domain** is a local path wearing an absolute URL, and is exactly
as checkable. `scripts/absolute-asset-check.py` now gates that (blocking, added
to `contract-suite.py`), and it was verified by hiding the file and watching it
fail with the real 11-page reference list, then restoring it.

The asset is produced by `scripts/build-og-image.js`, not hand-drawn: 1200×630
rendered in headless Chromium from bg.js's `:root` tokens and the platform's
three font families, with omega-share-card.js's ring/glow/grid vocabulary. The
`image-pipeline` skill names this the one legitimate raster case ("an OG-style
share PNG") — social scrapers do not render SVG for `og:image`. `--check`
validates dimensions by reading the PNG header, so a truncated or wrong-size
file fails rather than passing as present.

### The same gate immediately found a second live 404

`interface-omni.html` declared `og:url` as
`https://www.sydomega.com/interface_omni.html` — **underscore, where every real
path uses a hyphen**. The canonical share URL for the Control Deck was a 404.

Fixing it exposed a third, quieter bug in the same file. `nav.js:6` keys off
`data-page`, and that page said `data-page="interface_omni"` while `nav.js`'s
`PS` map holds `'interface-omni':'order'`. The lookup missed and fell through to
`nav.js:220`'s `PS[dp]||'command'` default, so the Control Deck highlighted
**COMMAND** instead of **ORDER** — a member was told they were in the wrong
section of the platform. Confirmed in a render before and after:

```
before   {"dataPage":"interface_omni","active":["COMMAND","COMMAND"]}
after    {"dataPage":"interface-omni","active":["⋔ORDER","ORDER"]}
```

`reachability-contract.py` cannot see this: it compares `nav.js`'s two maps
against the page set, and never reads a page's own `data-page` attribute.

**A measurement error worth recording.** The first render of this reported
`data-page: "account"` on `interface-omni.html` *and* on `dashboard.html`, which
would have made it look like a platform-wide fault. Both pages had simply
redirected to `account.html` — the plain Playwright context had no signed-in
stub. §8.4 already records this exact trap ("academy.html leaks content — FALSE.
Page had redirected; I measured /account.html") and it still caught a session
that had read the warning. The harness's `session.js` `launch()` is the fix;
an ad-hoc `chromium.launch()` against a gated page measures the redirect.

### enter.html asserted eight system states and checked none of them

The site's front door. Its STATUS tab shipped eight hard-coded rows with
pulsing green/gold dots:

```
SYSTEM ONLINE · 9.17Hz RESONANCE LOCK · TLS ENCRYPTED (HTTPS)
NODE GOVERNANCE: ACTIVE · Ω RESERVE: PLANNED (DORMANT)
AUTH LAYER: ONLINE · SUPABASE: CONNECTED · MATRIX SYNC: ACTIVE
```

with `LAST CHECK: HH:MM:SS` underneath, driven by the wall clock on a
`setInterval(clock,1000)`. Nothing was ever checked. The ticking timestamp made
it worse than static copy: it asserted a verification *at that exact second*.
CLAUDE.md §8.1 class 9 (fabricated data rendered as fact) and §9's "never show a
success state without checking the actual result", on the first page any visitor
sees.

Rebuilt as three real probes plus a separated, honestly-labelled constants group:

- `TRANSPORT ENCRYPTION` — `location.protocol === 'https:'`
- `PLATFORM RUNTIME` — `window.OmegaSB` published by bg.js
- `SUPABASE CLIENT` — `OmegaSB.get()` resolving to a client object

**Three states, not two**, the same discipline as `omega-password-guard.js`: OK,
UNAVAILABLE, or UNVERIFIED when the check could not complete. Only a verified
pass turns green; a probe that never answers stays muted rather than becoming a
false all-clear *or* a false alarm. `LAST CHECK` is written only by a completed
probe.

The label deliberately reads **SUPABASE CLIENT / READY**, not "CONNECTED": a
constructed client proves the vendored bundle parsed against the project URL, it
does **not** prove the API answered. Claiming otherwise is the same overclaim in
a smaller font. A live network probe was considered and **rejected as
unverifiable from here** — `api.pwnedpasswords.com`, `supabase.co` and
`sydomega.com` are all 403 at this environment's egress proxy, so a CORS
surprise in production would have pinned the front page to a permanent false
"UNREACHABLE". Shipping an unverifiable probe on the front door trades one
wrong claim for another.

Verified in a render: `{"tls":"NOT HTTPS","rt":"LOADED","sb":"READY"}` with zero
page errors. The TLS row reporting **NOT HTTPS** over the `http://localhost`
harness is the proof the check is real — a hard-coded panel would have said
ENCRYPTED.

## The front door rendered all four tabs at once (2026-09-03)

Found by screenshotting `enter.html` to confirm the rebuilt STATUS panel looked
right — the panel was fine, and the screenshot showed the GATEWAY, STATUS and
PROTOCOL panes all painted on top of each other.

`bg.js` defines the shared tab primitive as **`.tab-panel`**:

```
.tab-panel,.tab-panels>.tab-panel{display:none}
.tab-panel.active,.tab-panel.on,.tab-panel.act{display:block}
```

`enter.html` wrote **`.tab-pane`** — one letter short. Nothing in the repo
defines that class (`grep -rn --include=*.css --include=*.js '\.tab-pane\b[^l]'`
returns nothing), so `display:none` never applied and all four panes rendered
stacked. The tab bar was decorative: clicking toggled an `active` class that
changed nothing. `/` rewrites to `/enter`, so this was the first thing every
visitor saw. Measured in a render:

```
before   {"total":4,"visible":4}
after    on load {"visible":["tab-gateway"]}   after status {"visible":["tab-status"]}
         after protocol {"visible":["tab-protocol"]}   after science {"visible":["tab-science"]}
```

### Two measurement errors on the way to a one-page answer

**The grep overcounted six-fold.** `grep -l 'class="tab-pane' *.html` reported
**159 pages** and it looked like a platform-wide failure. `tab-pane` is a prefix
of `tab-panel`, so the pattern matched every *correct* page too. A render across
all 159 gave the real split: 131 use `.tab-panel` correctly, 22 use `.tab-pane`
and define it in their own `<style>`, and **1** — `enter.html` — used it with no
definition anywhere. §8.4's "a repo-wide grep is a candidate generator, not a
verdict", in its most expensive form yet.

A first scan also reported "1 broken, 22 OK" while silently skipping 136 pages
that returned no panes. That number happened to be right, but it was right by
luck until the skips were classified (131 no-`.tab-pane`-in-DOM, 5 redirected to
`/dashboard.html`, 0 errored). Getting the right number by luck is not
measuring.

**The gate written for this bug could not catch it.** `shared-class-check.py`'s
first version collected "locally defined" classes from the whole page source, so
`enter.html`'s own `document.querySelectorAll('.tab-pane')` counted as a
definition and the script reported **0 findings against the broken file**. A
selector in JavaScript is a *use*, not a definition. Only `<style>` blocks
define. Corrected, then verified in both directions before shipping: it reports
`.tab-pane / 1 page(s): enter.html` against `git show HEAD:enter.html`, and 0
findings across the current 186-page estate. This is exactly §8.4's "verify a 0
findings result is real" — a gate that cannot catch its own founding bug is
worse than no gate, because its green is read as evidence.

Scope is deliberately narrow: only class tokens starting with a shared-primitive
prefix (`tab- kpi card glass bar- chip tbl- btn`) are checked, and class
attributes containing a quote or `+` are skipped as JavaScript template
fragments. 0 false positives across the estate; widen only with the same
before/after evidence.

`node scripts/verify-runtime.js --all`: **PASS (186 pages)** after all of this
session's page changes.

## The platform was set in microtype: 78% of visible text below 12px (2026-09-03)

Asked to raise the visual design of the whole project to a professional
standard. The first thing measured, before changing anything, was what the
platform actually looks like — and the measurement inverted the diagnosis.

### Every screenshot this repo had ever taken showed the wrong typeface

`harness/session.js` stubs `fonts.googleapis.com` with an **empty** stylesheet,
deliberately, so correctness scans stay offline and deterministic. The cost was
invisible: no screenshot from this harness has ever shown Cinzel Decorative,
Rajdhani or Courier Prime. Every one showed the browser's fallback serif/sans.

The check that settles it — repeat this rather than trusting a screenshot —
renders one string in the brand face and in the generic fallback and compares
widths. On `dashboard.html` `"Cinzel Decorative",serif` and bare `serif` both
measured **589px**, and Rajdhani vs sans-serif both **622px**. Identical means
fallback. `document.fonts.size` was 0.

Un-stubbing was not enough. From `http://localhost:8765` the font FILES never
arrive in this sandbox — Node fetches the CSS fine, and a page rendered from
`about:blank` gets real Cinzel (which is why `scripts/build-og-image.js` was
correct all along), but from a real http origin gstatic does not resolve.
Injecting the CSS moved `document.fonts.size` to 10 and changed nothing: the
faces were declared and never downloaded. **`document.fonts.size` counts
DECLARED faces, not applied ones** — it is not evidence.

`scripts/visual-review.js` fixes it with no page-origin network at all: Node
downloads the `.ttf` files and base64-inlines them into `@font-face`. Verified:
`cinzel 613 vs serif 589 | rajdhani 465 vs sans 622`. `session.js` gained an
opt-in `webfonts` flag rather than being forked; the default is unchanged so
every existing scan stays offline.

### What the real render then showed

| | |
|---|---|
| visible text at <=11px, 6 pages | **2540 / 3261 = 78%** |
| `dashboard.html` alone | 502 of 599 text nodes |
| sizes in use | 6px, 6.5px, 7px, 7.5px, 8px, 8.5px, 9px, 9.5px, 10px, 10.5px, 11px |

The interface was not "too dark" — that was the wrong diagnosis, and the palette
disproves it. Measured against `--void #0A0A0F`: `--ink` 15.82:1, `--gold`
8.64:1, `--cyan` 12.84:1, `--muted` 5.41:1, `--green` 7.42:1 — every one clears
WCAG body contrast. Only `--crim` (4.01:1) misses body, and CLAUDE.md already
records that as a deliberate 3:1 choice. **The problem was size, not contrast**,
and a palette change would have been a fix for a defect that did not exist.

### Why it could not be fixed from bg.js

There is no type scale to change: `:root` defines three family tokens and a
spacing scale, and **no size scale at all**. Every size is a hardcoded literal,
and they are not where a single fix could reach them:

    2,423  page <style> blocks       (172 pages)
    1,350  inline style= attributes
      280  root .js injected CSS     (bg.js 34, nav.js 11, 40+ omega-* modules)

bg.js holds 1% of them, and CLAUDE.md section 4 records it as stylesheet **1 of
53**, so it loses every equal-specificity tie and cannot override the pages from
above. Sweeping only `<style>` blocks moved 78% to 63% — the rest genuinely was
elsewhere. All three surfaces are swept by `scripts/type-scale.py`.

**Result: 78% -> 4%.** `dashboard.html` went from 502 elements at <=11px to
**zero**. The 4% that remains is `em`/`%` sizing that compounds down a nesting
chain (8.8px, 9.6px, 9.28px on `profile.html`); those need per-rule judgement,
not a blind sweep, and are deliberately out of scope.

### The tool was wrong twice before it was right

**Not idempotent.** The first map spread 4-11px across 11/12/13px. Its outputs
were also inputs, so a second `--apply` re-lifted 11px to 13px and kept
inflating. A sweep over 172 pages that silently grows the type each run is a
trap, and only running it against its own output exposed it.

**It inverted the hierarchy.** That same map lifted 11px to 13px while leaving
12px alone, making former-11px text LARGER than former-12px text. One floor —
everything below 12px becomes 12px, nothing at or above it moves — fixes both:
inputs and outputs are disjoint, and no pair can swap order.

**And the claim about the typeface was wrong.** The first docstring called the
52 elements using Cinzel Decorative at <=14px "the single most amateur-looking
thing in the interface". Reading the selectors corrected it: the 116 such rules
across 60 pages are overwhelmingly ENTITY NAMES (`.award-name`, `.cer-title`,
`.ec-name`, `.ad-title`), where a display face is deliberate brand expression —
and bg.js already uses `--D` correctly, on exactly five title/value rules.
Sweeping the family would have stripped brand character from 60 pages to fix a
problem that did not exist. It is reported and never rewritten.

### The floating copilot button sat on top of the mobile navigation

Found by rendering at 390x844 once the type was legible. Measured, offsets from
the bottom edge:

       0.. 56  x   0..390   #omega-mob            (the tab bar)
      24.. 76  x 314..366   #cp-btn               <- 32px INTO the tab bar
      66.. 94  x   0..390   #omega-ticker-strip   <- and 10px into the ticker

Reproduced identically on 6 of 6 pages. bg.js's desktop ladder is scoped to
`>=761px` and its comment says the mobile ladder "was measured separately at
375px" — which was true for `#ofb-btn`, `#omega-voice-btn`, `#omega-ded-widget`,
`#osh-btn` and `#omega-cap-badge`, every one of which carries a
`@media(max-width:760px)` rule. **`#cp-btn` has none anywhere in the repo**, so
it kept the `bottom:24px` from its own inline cssText. A mobile ladder now
places it at the next free rung (262 + 8 = 270), verified clear before use.

The same scan then found a **pre-existing desktop collision**: `#omega-cap-badge`
overlapping `#omega-ded-widget` by 5px on 6 of 6 pages. The ladder's own comment
shows the cause — it computed `bottom:215 = 146 + 61 + 8`, but the widget
measures 146..220, i.e. **74px tall, not 61**. Corrected to 228, and the
arithmetic in the comment corrected with it.

Both scans re-run after the fix: **0 overlapping pairs at 390px and at 1440px**,
on all 6 pages. The false-positive pass section 8.4 requires (excluding
`pointer-events:none` and full-bleed backdrops) was applied before trusting any
of these numbers.

`scripts/type-scale.py --check` is now a blocking gate in `contract-suite.py`,
so the floor cannot erode back.

## main arrived red: a visual page merged with no bg.js, while CI was down (2026-09-03)

Rebasing the type-scale work onto a freshly-merged `main` turned 22/22 blocking
checks into **4 failures**. None were mine — verified by running the gates in a
clean worktree of `origin/main` with no local changes:

```
RELEASE GATE: FAILED    ERROR: public page does not load /bg.js: omega-visual-home.html
REACHABILITY:  FAILED    omega-visual-home.html -- 1 unreachable page(s)
PRODUCTION:    FAILED    missing /bg.js runtime
REGISTRY:      FAILED    OMEGA_SKILL_REGISTRY.md out of date
```

`omega-visual-home.html` (627de839, "Omega visual universe foundation") is a
genuine new visual gateway — six realm cards into dashboard/cosmos/intelligence/
media/marketplace/creator. It was merged **without `bg.js`** and **unregistered
in nav.js**, and it landed in the window when the self-hosted runner was offline,
so no check ran on it. Exactly the gap the CI-consolidation work exists to close,
arriving in the one interval where CI could not fire.

Fixed:

* `bg.js` added to the page. Section 9 makes this non-negotiable and two
  separate gates encode it.
* Added to **all three** of bg.js's exempt lists — `PUBLIC` (line 254) and BOTH
  `EX` maps (1288, 1362). This is the charter.html trap: that page rendered
  blank for every visitor because it sat in one list and not the other. Verified
  with a **signed-out** context, which is the only way to see it: no redirect,
  `.omega-main` visible, 6 cards, 0 page errors.
* Exempted in `reachability-contract.py` with its reason — it is a landing page
  like `enter`, linking out to the realms and back to `/enter.html` with nothing
  linking in. Whether it should replace or sit beside `/enter` as the site root
  is a product decision, not a gate finding, and is left to the owner.
* Registry census regenerated.

### The same merge shipped two modules nothing loads

`omega-platform-visual-integration.js` and `omega-platform-visual.css` (PR #213,
"integrate platform visual runtime") are referenced by **nothing** — no HTML, no
`bg.js` injection. `audit.py` lists the .js among its orphaned modules. The
"integration" does not run, which is the only reason the platform is unaffected.

Deliberately **not** wired in, because doing so unreviewed would ship three
conflicts with this repo's own rules:

1. **Divergent duplicate tokens.** It defines its own palette, and two values
   disagree with canonical: `--omega-ink #f5f1e6` vs `--ink #e9e6dc`, and
   `--omega-muted #aaa6a0` vs `--muted #8a8676`. Section 8.1 class 8, and the
   `visual-assets` skill's explicit "use the token, never the hex".
2. **A vignette at `z-index:2147483000`**, against a highest-in-bg.js of
   `100001` — roughly 21,000x above every existing layer, painting a permanent
   dark radial over the entire interface including the genesis overlay.
3. **It sets `body{background-image}`**, a surface CLAUDE.md section 4 records as
   owned by `omega-backdrop.js` with `!important` ("tints to the member's
   element and page; a feature, don't fight it").

Enabling it changes the look of all 186 pages, so it is reported for the owner
rather than switched on by a session that did not author it.

---

## Session 2026-09-03 (continued) — the interface stops asserting things it does not know

### `UNKNOWN_CAPABILITY` was printed to members on 163 of 187 pages

Found by looking at a real render rather than at the code: a screenshot of
`social.html` carried a badge at the right edge reading **"UNKNOWN_CAPABILITY /
PLATFORM · SOVEREIGN"**.

`omega-capability.js:62` (before the fix) defaulted every unregistered page to:

```js
cap: 'UNKNOWN_CAPABILITY', domain: 'Platform', owner: 'Sovereign',
slo: {p95: 1000, avail: 99.0}
```

and `injectCapabilityBadge()` rendered all of it, plus a `title` tooltip
asserting `SLO: p95<1000ms | Avail: 99.0%`. Measured:

```
CAP_DEFS entries: 24
pages: 187
pages with NO definition -> UNKNOWN_CAPABILITY: 163
```

So the majority of the estate told the member which domain owned the page, which
of the twelve agents was accountable for it, and what availability the platform
committed to — none of it declared anywhere. That is section 8.1 class 9,
fabricated data rendered as fact, and it is the same shape as `hercules.html`'s
`Math.random()*100` and `ad-network.html`'s revenue figures.

Fixed by making "undeclared" an honest state rather than a placeholder:

* `declared:false` and `cap/domain/owner/slo: null` when no `CAP_DEFS` entry and
  no explicit override supplied a capability name. `cap.declared = !!cap.cap`,
  so the flag can never disagree with the data.
* `injectCapabilityBadge()` returns early unless `cap.declared` — an undeclared
  page shows nothing.
* `checkSLO()` returns `null` unless `cap.declared`, so no `capability:slo_breach`
  event is ever published against an invented target.
* The telemetry event now carries `declared` and `page`, so the fact that most
  pages are undeclared is *measurable* instead of hidden behind a placeholder.

Verified with a real before/after render, the "before" pinned via `gitShow` so
it ran the actual old module (section 8.4's rule — a `git stash` "before" runs
the fixed code once the change is committed):

```
BEFORE  dashboard.html  COMMAND_INTELLIGENCE / OPERATIONS · SOVEREIGN
        social.html     UNKNOWN_CAPABILITY / PLATFORM · SOVEREIGN
        vault.html      TREASURY_RESERVE / FINANCE · MERCHANT
        habits.html     UNKNOWN_CAPABILITY / PLATFORM · SOVEREIGN
AFTER   dashboard.html  COMMAND_INTELLIGENCE / OPERATIONS · SOVEREIGN
        social.html     (no badge)
        vault.html      TREASURY_RESERVE / FINANCE · MERCHANT
        habits.html     (no badge)
```

`window.OmegaCapability` has no consumers anywhere in the repo (grepped: one
hit, its own definition), so the blast radius is exactly the badge, the event
and the telemetry payload.

### The keyboard-shortcut hint was shown to devices with no keyboard

`omega-keyboard.js` popped "PRESS ? FOR KEYBOARD SHORTCUTS" once per session on
every page — including phones, where there is no `?` to press and where it
landed in the middle of a bottom chrome stack that is already short of room
(nav bar 66px, controls dock, copilot button).

Gated on `(hover:hover) and (pointer:fine)` — the media query for "there is a
real pointer", which tracks having a real keyboard on every current browser. The
shortcuts themselves stay bound, so an attached keyboard still works; only the
unusable prompt is withheld. Measured:

```
BEFORE 390 mobile    pointer:coarse hover:none  ->  PRESS ? FOR KEYBOARD SHORTCUTS
BEFORE 1440 desktop  pointer:fine   hover:hover ->  PRESS ? FOR KEYBOARD SHORTCUTS
AFTER  390 mobile    pointer:coarse hover:none  ->  (no hint)
AFTER  1440 desktop  pointer:fine   hover:hover ->  PRESS ? FOR KEYBOARD SHORTCUTS
```

### 92 glyph sequences rendered as colour emoji — the zodiac signs among them

The brand is one palette on near-black. A colour emoji ignores it completely:
the font supplies its own bitmap, so `color:var(--gold)` does nothing and the
glyph lands as a saturated multicolour sticker inside monochrome typography.

**A grep for the emoji planes is not the measurement.** It over-reports (✓ ★ ✕
☰ ☱ ☲ ✦ ⚔ are typographic marks that belong here) and under-reports (the zodiac
signs are ordinary BMP codepoints). The measurement that decided it: draw each
candidate white-on-black to a canvas in the harness Chromium and read the pixels
back — any channel spread means the font supplied a colour glyph.

That measurement over every symbol in every client-shipped file returned **92
colour sequences of 226 tested**, and two of them were not decoration:

* **U+2648..U+2653, the twelve zodiac signs** — the platform's own sign system,
  named in `omega-agents.json` and drawn on `agents`, `cosmos`, `horoscope`,
  `houses`, `elements`. Their *default* Unicode presentation is emoji, so every
  one of them had always shipped as a colour sticker rather than as gold type.
* `⚡ ⚔ ❄ ❤ ☀ ☁ ⛈ 🌫` carried **U+FE0F (VS16)**, the selector that explicitly
  *asks* for the colour form.

The same measurement proved the fix: with **U+FE0E (VS15)** appended, all of
`⏳ ☀ ♈..♓ ⚔ ⚡ ⛅ ⛈ ✍ ✨ ❄ ❤` came back monochrome. The astral plane
(U+1F300..U+1FAFF) has no text form at all, so those 70 had to be replaced.

Applied in three passes over every root `.html`/`.js`/`.json` (35 files
rewritten):

1. Astral-plane pictographs → a curated brand mark, one per glyph, each verified
   monochrome and non-blank in the same canvas measurement. The map is
   thematic, not arbitrary: `🔥→△` and `🌊→▽` are the fire and water triangles
   the element system already uses, `🌑..🌘 → ○ ◔ ◑ ◕ ● ◕ ◐ ◔` is the moon
   filling, `📖→▤ 📚→▥ 📜→▧ 📓→▦ 📋→▨ 📊→▩` reads as a page-density series,
   `🏆→♔ 👑→♕ 🔱→♆ 🔬→⚗ 🔐→⚿ 🏠→⌂`. Within-file collisions were checked
   programmatically and resolved (`🌦→⌇` away from `🌧→☂`, `🌀→⊙` away from
   `🔮→⌾`).
2. Every remaining U+FE0F → U+FE0E.
3. Every bare BMP codepoint with `Emoji_Presentation=Yes` → same character plus
   U+FE0E. The character is *pinned*, never removed, so the zodiac signs keep
   their meaning and gain the brand's colour.

Re-measured after the sweep: **175 distinct glyph sequences remain across the
whole shipped surface and 0 render in colour.**

Gated by `scripts/brand-glyph-check.py` (blocking, gate 15 of the contract
suite). Its "0 findings" was verified real per section 8.4 — run against the
pre-sweep tree from `git archive HEAD` it reports **277 occurrences in 35 files
and exits 1**. First implementation looped per character and cost 9.3s across
357 files, more than every other static gate combined on the serial runner; a
compiled character class brought it to **0.097s**.

Not covered, deliberately: four `supabase/*.sql` files carry an emoji inside a
SQL comment. They are not client-shipped, and editing an already-applied
migration is a worse idea than the comment.

### The 12px type floor was enforced on three surfaces out of five

Found by reading the glyph-sweep diff, not by the gate: `sigil.html`'s "LOCALLY
SEALED — PENDING LEDGER SYNC" notice sits at **6px**, and
`scripts/type-scale.py --check` reported clean. The floor was real; the sweep's
coverage was not.

`process()` looked at `<style>` blocks and quoted `style="…"` attributes in
pages, plus whole root `.js` files. Two surfaces were invisible to it:

```
33 declarations, 9 pages   font-size inside a page's own <script> block
                           (control-plane 20, world-shell 4, chatbot 2, …)
                           sizes 6,7,8,9,10,11px

28 declarations, 5 pages   font-size inside an UNQUOTED style= attribute
                           (ad-network 13, creator 6, project-studio 4, …)
                           sizes 7,8,9,10px
```

The second is the subtler one. Several pages ship minified with no attribute
quotes at all — `style=font-family:var(--M);font-size:7px;color:var(--muted)` —
and the quoted `STYLE_ATTR` pattern cannot match that. An unquoted attribute
value ends at whitespace or `>`, so `STYLE_ATTR_UNQ` matches exactly that shape
and the rewritten attribute stays unquoted.

Both surfaces are now swept, with the same guarantee as the root-`.js` pass:
only a bare `px` literal is rewritten, so a computed size (`'font-size:'+n+'px'`)
has no digits to match and is skipped, and only the number changes so the
surrounding JS or markup syntax cannot move. 61 declarations rescaled, all of
them *up* to the 12px floor.

Verified: `--check` clean and idempotent (a second `--apply` rescales 0);
`scripts/check-inline-js.py` still parses every inline block; the diff on
`ad-network.html` shows the attributes still unquoted with only the numeral
changed.

---

## Session 2026-09-03 (continued) — the signature diagram, and the module it needed that had never loaded

Driven by five reference boards the owner supplied. Their strongest shared
motif is a ring of emblems orbiting a central Ω — the platform's own twelve
agents drawn as a constellation rather than a list. Translating it meant
finding out what this repo already had, and one answer was a surprise.

### `omega-emblems.js` had never loaded on any page — two modules shared one guard

`bg.js` injects each module behind a `data-omega-*` attribute guard so nothing
double-loads. Two different modules were using the same attribute:

```
bg.js:90   omega-emblems-catalog.js   guard: data-omega-emblems
bg.js:611  omega-emblems.js           guard: data-omega-emblems   <-- same
```

Line 90 runs first, so by the time line 611 asks
`document.querySelector('script[data-omega-emblems]')` the answer is always
yes, and `omega-emblems.js` — the 12 living zodiac marks, twin counter-rotating
rings, element-coloured glyph — was never injected. Confirmed in a render
before touching anything, on three pages:

```
   emblem/sigil/ring scripts in DOM: omega-emblems-catalog.js,
     omega-emblem-integration.js, emblem.js, omega-emblem-panel.js,
     omega-page-emblem.js, omega-ring.js, omega-sigil-gen.js
   holding data-omega-emblems  : omega-emblems-catalog.js
   OmegaEmblems=object   <- the CATALOG's export (plural)
   OmegaEmblem =undefined <- this module's export (singular)
```

The near-identical export names are why the collision read as working:
`window.OmegaEmblems` existed, so a spot check found "the emblem module" and
moved on.

**The honest scope, which is smaller than it first looked.** A repo-wide grep
for real mounts — `data-omega-emblem="<Sign>"` and `data-omega-sigil` — returns
**zero** across all 187 pages. So nothing visible was broken; this was a latent
guard collision plus 7 KB of finished brand artwork that nothing had ever
asked for. `audit.py` cannot see it either: the injection *exists* in bg.js
source, so the module is not orphaned — only the runtime knows it never ran.

Fixed by giving it its own guard, `data-omega-emblem-living`. **The rule the
collision teaches: a guard attribute is the module's identity, not the feature
area's.** Two modules in the same area must never share one.

Two follow-ups this forced, because the module is now live on 187 pages for the
first time:

* **Its MutationObserver was unthrottled** — a whole-document
  `querySelectorAll('[data-omega-emblem]')` on *every* mutation. Free while the
  module was unreachable; real work now, since the activity ticker, the
  dedication chronometer and the chat panes all mutate the DOM on a timer.
  Coalesced to one scan per animation frame.
* **`color(sign)` added to its export.** Anything composing these marks needs
  the same colour that painted the mark it wraps. Reading
  `omega-sigil-gen.js`'s `ELEM_PALETTES` instead would put two different Fires
  (`#E86A3A` here, `#FF6B35` there — the drift the `visual-assets` skill
  records) on one node. This keeps a composed mark internally consistent; it
  does **not** resolve the underlying drift, which is still open.

### `omega-constellation.js` — the ring-of-emblems diagram

`<div data-omega-constellation="agents">` renders the twelve agents from the
real `/omega-agents.json` — the same file `agents.html` already consumes, with
the same fallback posture — as marks on an orbit around a central Ω, joined by
hairline spokes. Every node is a real `<a>`: the emblem is the door.

Mounted on `agents.html`'s Council tab, above the existing dossier grid.
**Not** mounted on `cosmos.html`, which already has a working radial agent
wheel — measured before deciding, 50,616 painted pixels in `#agent-wheel`'s
1040x1040 buffer. Two agent wheels on one page would have been the duplication
this repo keeps having to undo.

Three construction decisions, each avoiding a bug class already shipped here:

1. **Nodes are HTML; only spokes and orbit are SVG.** An SVG `<text>` label
   scales with its viewBox, so markup reading 15px on a desktop renders about
   7px on a phone — under the 12px floor, and *invisible* to
   `scripts/type-scale.py`, which matches `font-size:Npx` declarations while an
   SVG font-size attribute is a bare number. HTML labels are real text at a
   real 12px (verified in the render), selectable, translatable, and each node
   is a genuine link with its own focus ring.
2. **It draws no emblem of its own** — it emits `data-omega-emblem="Aries"` and
   lets the owning module fill it. That module scans on boot *and* observes, so
   load order does not matter: no polling, no ordering contract, no second copy
   of a canonical table (§8.1 class 8).
3. **No canvas, so no zero-sized buffer.** Geometry is percentage-positioned in
   an `aspect-ratio:1` box; nothing reads a rendered dimension, so §8.1 class
   3 — a canvas measured at `DOMContentLoaded` while the approval guard still
   hides the page — cannot apply.

### The geometry was wrong twice, and only a render said so

**First version: every one of the 12 nodes overlapped its neighbour.** A node
was `width:23%` on an orbit of radius `.345W`; twelve nodes on that circle get
`2*pi*R/12 = .181W` of arc each, so a `.26W` node overlaps at *every* width. On
an `<a>` that means the wrong link catches a click. Measured 12/12 overlapping
pairs at 390px.

Widening the diagram and narrowing the node to 17% cut it to 4 — and **arc was
the wrong measure**. Overlap is tested on axis-aligned boxes, so what matters
is the centre-to-centre delta between adjacent nodes, `dx = dy = R*W*(cos30 -
cos60)` = 108px at W=860. A 146x125 node overlapped by exactly `146-108` by
`125-108` — the measured `38x16px`, at the four shoulder positions.

Both dimensions had to come under that delta, which fixed three things at once:
the box hugs its content (`width:max-content`, capped at 17%) instead of taking
a fixed share, the mark became a fixed 64px rather than a percentage of a box
that no longer has a fixed width, and W rose to 900 so the delta is 113.6px
against a node measured at 90x105. **Result: 0 overlapping pairs, every node
hit-testable, no sub line clipped** (widest 137px box against 133px of ink).

**A scanner false positive on the way.** The same probe reported 3 of 12 nodes
"not hit-testable at their own centre" — `AUDITOR`, `PROXY`, `ORACLE`, all with
`elementFromPoint` returning `null`. Nothing covered them: their centres were
at y 962–1002 in a 1000px viewport. `elementFromPoint` returns null *outside*
the viewport, so a node below the fold reads as covered. The probe now skips
off-viewport centres. §8.4's rule again — a scanner needs its own
false-positive pass before its number means anything.

Verified at 390px mobile, 390px with `prefers-reduced-motion: reduce`
(`animation-name: none`, every mark still drawn) and 1024px: 12 nodes, 12 marks
filled, labels 12px, 0 page-level horizontal scroll — the wrap scrolls inside
itself, which is what `verify-runtime.js` asserts.

### Correction: "nothing visible was broken" by the emblem guard collision was wrong

The entry above claimed the `data-omega-emblems` guard collision had no visible
effect, on this evidence: a repo-wide grep for `data-omega-emblem="<Sign>"` and
`data-omega-sigil` markup mounts returns zero across 187 pages.

**The grep was the wrong instrument.** Pages do not mount these marks through
the data attribute — they call the module's JS API directly, and six files do:

```
cosmos.html            7 call sites
omega-emblem-panel.js  7
omega-emblem-integration.js  5
honors.html            4
verify-deployment.html 4
omega-sign-codex.js    3
elements.html          3
omega-menu.js          2
family.html            2
```

Each follows the same shape — try `window.OmegaEmblem`, else poll for it:

```js
function fillRing(el, glyph, col, locked){
  if(window.OmegaEmblem){ el.innerHTML=window.OmegaEmblem.ring(glyph,col,{locked}); return; }
  var tries=0;
  var t=setInterval(function(){ tries++;
    if(window.OmegaEmblem){ ...; clearInterval(t); }
    else if(tries>20){ clearInterval(t); }   // gives up after 3s, leaves it EMPTY
  },150);
}
```

The poll is bounded (20 tries at 150ms), so this was not the never-terminating
poll of section 8.1 class 4b — but after three seconds it cleared the interval
and left the container empty. Every one of those call sites drew nothing.

Measured by A/B, isolating exactly one variable: the current `bg.js` with the
colliding guard string put back, against the current `bg.js`. Pinning an older
commit would have dragged in main's other changes.

```
BEFORE (guard collision)   AFTER (own guard)
cosmos.html      0 marks   ->  94
agents.html      0         ->  82
honors.html      0         ->  70
elements.html    0         ->  70
family.html      0         ->  70
dashboard.html   0         ->  70
profile.html     0         ->  70
                 0         -> 526 across 7 pages
```

**And a second correction, in the other direction — 526 would also mislead.**
A mark in the DOM is not a mark on screen. Filtering to marks with a real
laid-out size returns **0 painted on every page at rest**, including
`agents.html`, where a screenshot plainly shows twelve. The reason, measured
rather than assumed by walking up to the ancestor that hides them:

```
agents.html at rest       hidden by DIV#tab-council.tab-panel {display:none}
agents.html COUNCIL open  12 painted
cosmos.html at rest       hidden by DIV#tab-gates.tab-panel   {display:none}
honors.html at rest       hidden by DIV#om-ov                 {display:none}
```

So the accurate statement is narrower than either number on its own: **the fix
restores emblem rendering that was entirely dead across six files, on surfaces
a member reaches by opening a tab or a panel. It changes nothing about what any
page shows on first paint.**

Both errors are the same one twice: section 8.4 says a repo-wide grep is a
candidate generator, not a verdict, and that a scanner needs its own
false-positive pass before its number means anything. The first claim trusted a
grep; the second trusted a DOM count. Only the third measurement — computed
size, then the hiding ancestor — was worth reporting.

### 16 pages carried no emblem of their own — the artwork existed, the mount did not

A survey of all 187 pages at rest (1440x900) measured what each actually shows
before any interaction:

```
living zodiac emblems visible at rest : 0
[data-page-emblem] visible            : 158   (29 pages without)
pages with NO svg and NO canvas above the fold: 0
```

**The last line killed the change that survey was commissioned to justify.** The
plan had been to add graphics to page resting states, on the impression that the
estate was mostly type. Zero pages lack a graphic above the fold. That work was
unnecessary and would have shipped on a hunch.

The 29 without a visible page emblem split into two causes, and only one is a
gap. Measured per page by walking up to the ancestor doing the hiding:

* **7 are correct as they stand** — `approvals`, `family`, `honors`,
  `interface-omni`, `journal`, `media`, `profile`. Every one has its mount, the
  canvas is filled, the CSS size is the normal 132x132; each simply sits on a
  view that is not the default (`#j-main`, `#mtab-record`, `#tab-matrix`,
  `#mtab-bloodline`, `#mtab-science`, `#main`). `approvals` is hidden by
  `#app.shell` — the approval guard itself, on the owner-gated page
  `verify-runtime.js` already reports as expected. Nothing to fix; a second
  measurement stopping a second unnecessary change.
* **22 have no `[data-page-emblem]` in markup at all.** Six of those are public
  or internal-tool pages where no member-facing mark belongs — `404`, `enter`,
  `offline`, `reset`, `verify-deployment`, `verify-modules`. The remaining
  **16 are real content pages that simply never mounted one.**

And the mark was already designed for almost all of them: `omega-page-emblem.js`
carries **181 per-page configs**, and 14 of the 16 were already in that map with
their own fold count, axis colour and glyph — `ad-network` U+25EC, `hercules`
U+2694, `graphify` U+2B21, `council` U+2630, and so on. The artwork existed and
nothing asked for it. A one-line mount per page turns each on.

`gateway` and `omega-visual-home` had no config and would have fallen back to a
generic Omega, so they got real ones: a gate mark (U+26E9) and a frame mark
(U+2394), both checked against the 87 glyphs already in use so no page borrows
another's character, and both rendered white-on-black in the harness first —
they come back monochrome, so `scripts/brand-glyph-check.py` still passes.

Placement anchors on `</main>`, which every one of the 16 has exactly once.
Verified by **reading the canvas pixels back**, not by trusting a box size — a
filled-looking element proves nothing, as the 7 above demonstrate:

```
ok  ad-network        334x166  ink 8062   "12-FOLD ..."
ok  graph-timeline    299x161  ink 6520   "9-FOLD ..."
ok  world-shell      1360x166  ink 6269   "12-FOLD ..."
...
16/16 pages now paint their own emblem at rest
```

Estate total moves 158 -> 174 of 187. The remaining 13 are the 7 tab-hosted
marks and the 6 public/utility pages, both correct as they are.

### Every section heading now carries its page's emblem — and why the glyph would not paint

614 `.sechead` elements across 109 pages were text-only. Each now shows the
glyph from that page's own canon config, inside a slowly-rotating dashed ring,
in that page's axis colour: gold `⌘` on dashboard, green `◆` on vault, gold
`⚖` on compliance, cyan `⍛` on cosmos. One rule in `bg.js`, no per-page markup.

`--pg-glyph` and `--pg-col` are published on `<html>` by `omega-page-emblem.js`
— the module that owns the 183-entry `PAGES` table — so the stylesheet reads
the canonical values rather than carrying a second copy (§8.1 class 8).
`publishVars()` runs regardless of whether the page mounts
`[data-page-emblem]`, because 13 pages legitimately have no mount and their
headings still want the mark.

**The mark rendered as an empty ring for four attempts.** The box drew — right
size, right place, dashed border — and the glyph inside it never did.

What each attempt ruled out, in order:

* A background on the pseudo proved the box existed, 17x17, exactly inside the
  ring. So placement was right and only text was missing.
* The same declarations on a plain `div` rendered the glyph fine. So the rule
  was not wrong in isolation.
* Collapsing two pseudos into one changed nothing, which killed the theory that
  generating two absolutely-positioned pseudos on a `display:flex` parent was
  at fault.
* `getComputedStyle(h,'::before')` reported everything correct: `content:"⚖"`,
  `display:block`, `18x18`, `borderTopStyle:dashed`, gold, 11px, and exactly
  **one** rule in the whole cascade targeting the selector.

**The test that found it: forcing `content:"X" !important`. Still nothing.** A
pseudo that cannot paint a plain ASCII letter is not a glyph problem, a font
problem, or a `var()` problem.

Root cause, `bg.js:1290`:

```js
[].slice.call(document.querySelectorAll('.sechead')).forEach(function(el){
  if(el.children.length===0&&(el.textContent||'').trim().length<48)
    el.classList.add('ofx-sheen');
});
```

`.ofx-sheen` fills heading text with a gradient via
`background-clip:text` + **`-webkit-text-fill-color:transparent`**. That
property **inherits into pseudo-elements**. Borders are not text fill, so the
ring painted; the glyph was filled with transparent. Fixed with an explicit
`-webkit-text-fill-color:var(--pg-col)` on the pseudo.

**Standing hazard worth carrying forward: any `::before`/`::after` text on an
element that receives `.ofx-sheen` is invisible unless it sets its own
`-webkit-text-fill-color`.** The symptom — box paints, text does not — looks
nothing like a text-fill problem.

Two further constraints, both measured rather than assumed:

* **Absolute positioning is required, not stylistic.** `.sechead` is
  `display:flex` with `justify-content:space-between`; a static pseudo becomes
  a flex item and springs each heading's own right-hand content to the far
  edge. Out of flow it cannot disturb anything — A/B on `vault.html`, pinning
  `bg.js` without the rule, measured first-content offset delta **0 across all
  10 headings**. `position:relative` was already set by `omega-content.js`.
* **90s rotation, not the 34s/42s of `omega-emblems.js`'s rings.** 614 of these
  can share one page; anything quicker reads as a swarm. The keyframes repeat
  the transform rather than relying on the declared one, per §4.2's
  animation-beats-declaration trap.

Two process notes from the same work, both already in §8.4 and both hit anyway:
`bg.js`'s CSS section headers use real box-drawing characters, so a `replace()`
written against `─` matched nothing; and inserting CSS into that
single-quoted JS string requires escaping backslashes, then apostrophes, then
newlines — getting the order wrong broke the file, `node --check` caught it,
and it was restored from git rather than patched over.

### Card titles get a subordinate mark, and the runner doc gets the case that blocked it

**393 `.card-title` elements across 82 pages** were text-only, the same shape
the 614 section headings had. `.card-title` is defined once, in `bg.js`, at
`:where()` specificity, and `.card-title::before` was free — checked at runtime
by enumerating every stylesheet rule whose selector matches, not by grep.

**The design decision was to NOT repeat the section emblem.** Putting the
page's ringed glyph on card titles too would show twenty identical rings on a
twenty-card page: that is noise, not hierarchy, and it would spend the
readability the type-floor work bought. Instead a card title gets a 7px open
diamond in the page's axis colour — the ring marks a section, the diamond marks
an item inside it. Two marks, one system.

It is **still at rest** and makes a half turn when its card is hovered. 614
rings already turn platform-wide at 90s; 393 more turning marks makes a page
swarm. Motion as a reward for attention costs nothing when nobody is pointing.

`content` is `""` — an empty box, not text — so unlike the `.sechead` mark this
one is structurally immune to the inherited `-webkit-text-fill-color` from
`.ofx-sheen` that cost four wrong theories on the previous change.

Verified by A/B, pinning `bg.js` with the block removed against the real file:

```
                 BEFORE                           AFTER
ops.html         557x193 557x193 557x182 557x182  identical
fasting.html     813x218 813x458                  identical
expenses.html    778x298 778x160                  identical
```

**A false negative in the probe itself, worth recording.** The first version
measured where each title's TEXT started, via
`range.selectNodeContents(el).getBoundingClientRect().left - el.rect.left`, and
returned **0 both with and without** a `padding-left:16px` that
`getComputedStyle` confirmed was applied. A Range over an element's contents
does not reliably report the content box's left edge. Had the mark actually
shifted a layout, that probe would have said it did not. Card box size is the
metric that works.

The first A/B run also reported `0x0` for every card on `agents.html` — those
cards live in the SCIENCE tab, `display:none` at rest, the same trap that
produced the earlier seven false positives. Re-run against pages whose cards
are visible without interaction.

### `docs/CI_RUNNER_RECOVERY.md` had no entry for the case that actually blocked recovery

Three consecutive attempts to install the runner service failed identically:

```
Cannot configure the runner because it is already configured.
To reconfigure the runner, run 'config.cmd remove' or './config.sh remove' first.
```

Two causes, neither documented:

1. **`--replace` does not clear a local config.** It replaces the registration
   *GitHub* holds under that name. `C:\actions-runner` already had
   `.runner`/`.credentials` from an earlier attempt, and `config.cmd` refuses on
   those **before it ever reads the token**. `.\config.cmd remove --local`
   clears them offline, without a token — which is what an orphaned
   registration needs.
2. **The literal placeholder was pasted as the token**, in every attempt. The
   command is long enough that `PASTE_TOKEN_HERE` reads as part of it. The doc
   now puts the token in a `$T` variable first, so there is exactly one
   substitution and it sits on its own line.

Also recorded: `Get-Service actions.runner.*` printing **nothing at all** means
no service was ever created, so the run stopped at the config step. A service
that exists but is not running prints a row reading `Stopped`. Those two states
look identical if you are only checking whether jobs move.

## The active tab was a 3px flat border on 519 tabs across 128 pages (2026-09-03)

`.tab-btn` is the last large text-only repeated surface in the shared design
system, after section headings (614) and card titles (393). Measured, not
estimated:

```
tab-btn:    519 uses / 128 files
card-title: 403 uses /  83 files
sechead:    614 uses / 109 files
kpi-label:  165 uses /  34 files
chip:        49 uses /  16 files
```

Its entire active-state signal was `border-bottom-color:var(--gold)` plus a
gold text colour — the same for every page, with no motion and no relationship
to the page it belongs to.

**`::after` was free, and that was checked properly.** 40 pages carry their own
`.tab-btn` CSS rules, and a page `<style>` wins over `bg.js` (stylesheet 1 of
53) at equal specificity — so a rule written here for a property those 40 pages
also set would be dead code that looks correct in the diff. The check was a
parse of every `<style>` block in every `.html` file for a selector containing
`.tab-btn`, not a grep over whole files (which would have counted the far more
common `querySelectorAll('.tab-btn')` in page JS as a CSS rule):

```
pages with a page-local .tab-btn CSS rule: 40
pages with .tab-btn::before or ::after:     0
```

The same pass answered the one prerequisite the block has — it needs
`position:relative` on `.tab-btn`, which `bg.js` does not set. Two pages
already establish it themselves (`approvals.html` for a `.tab-btn .badge`
absolute badge, `profile.html` for `.tab-btn.access-tab`), both to the same
value, so nothing conflicts.

**A positioned box, not a border.** `bottom:-3px` resolves against the padding
box, which places a 3px-high absolutely positioned bar exactly over the 3px
border it replaces — so no page-local padding, border width or background can
displace it, and it costs no layout, because absolutely positioned descendants
are out of flow.

The beam grows out of the tab centre when the tab becomes active, is filled
with a gradient in the page's own axis colour (`--pg-col`, published to the
document element by `omega-page-emblem.js` for 183 pages) with `--solar` as its
bright core, and previews at a quarter width on hover — the same
reward-for-attention rule the card marks use, and the reason 519 more
permanently-animating marks were not added to a platform that already turns 614
section rings.

Verified by A/B, pinning `bg.js` with the block removed against the real file:

```
                BEFORE tab boxes                  AFTER
academy.html    127x41 101x41 136x41 119x41       identical  (barH 42 -> 42)
wealth.html     110x41 153x41 145x41 119x41       identical
library.html    127x41 127x41 101x41 119x41       identical
command.html    145x41 127x41 110x41 119x41       identical
cosmos.html     110x76 110x76 101x76 119x76       identical  (barH 77 -> 77)
habits.html     101x41 145x41 101x41 119x41       identical
```

`scrollsX` was `false` on all six before and after. Computed `::after` on the
active tab went from `position:static / background:none` (i.e. the rule did not
exist) to:

```
academy  h=3px op=1 bottom=-3px left=0 right=0  gradient rgb(0,229,255)   shadow rgb(0,229,255)
wealth   h=3px op=1 bottom=-3px left=0 right=0  gradient rgb(201,168,76)  shadow rgb(201,168,76)
```

— i.e. the axis colour really does differ per page rather than being gold
everywhere. On an idle tab it reads `op=0` with `left`/`right` collapsed to the
tab's centre (`50.53px` each on academy), and hovering that same idle tab moves
it to `op=0.55 left=38.41px right=38.41px`. Screenshots at 4x confirm the beam
paints at rest on the active tab only, and that the hover preview appears under
the pointed-at tab.


## `.omg-ring` had shipped in bg.js and no page had ever used it (2026-09-03)

The Ω-HORIZON layer added a conic progress gauge — `@property --omg-p` so the
sweep interpolates instead of snapping, an inner disc via `::after`, a `.cyan`
variant. Adoption, measured:

```
$ grep -oh 'omg-ring' *.html | wc -l
0
```

Shipped CSS reaching every page, drawn by none of them. Meanwhile the reference
boards for this platform's design language lead with ring gauges, and 30 pages
already compute a real percentage and assign it to a bar width:

```
$ grep -lE "style\.width\s*=[^;]*\+\s*['\"]%" *.html | wc -l
30
```

**Two of those 30 were converted, not all thirty.** The rest were checked and
rejected on the merits rather than skipped for time: `missions.html`'s day strip
is a compact 6px bar inside a 12px-padded box, where a 150px ring would be
heavier than the thing it measures; `ascension.html`'s three axis bars sit in a
hidden tab beside a canvas that already draws the same three values.
`levels.html` and `phases.html` were the two hero blocks — a headline
"PROGRESS TO APEX" / "% to Apex" that was a bar, a label and a number in a row.

Both now read as one gauge with the number inside it, which is also less text:
`phases.html`'s readout went from the sentence `19.2% to Apex` to `19.2%` over a
static `TO APEX` label.

The JS changed from setting a width to setting the custom property, so the value
still comes from the same computation and the same `setTimeout` that let the
old bar animate:

```js
var ring=document.getElementById('my-auth-ring');
if(ring)setTimeout(function(){ring.style.setProperty('--p',Math.min(100,pct)+'%');},100);
```

Verified in a render with the harness Supabase stub, which produces a real
non-zero value rather than an empty gauge:

```
levels.html  my-auth-ring   184x184  --p 19.2%  conic-gradient(rgb(201,168,76) 19.2%, ...)  "19.2% AUTHORITY"
phases.html  my-phase-ring  172x172  --p 19.2%  conic-gradient(rgb(0,229,255) 19.2%, ...)   "19.2% TO APEX"
```

no page errors, no horizontal scroll on either.

**Both rings live in a `tab-my` panel that is `display:none` at rest**, so the
first probe reported `0x0 / visible:false` — the same hidden-tab trap that has
now produced false readings three times in this repo. The probe has to click
`.tab-btn[data-tab="my"]` first. That is pre-existing page structure, not
something this change introduced: the bar was equally hidden.

Screenshots also needed the fixed chrome hidden — the keyboard-shortcut hint and
the language bar are `position:fixed` and composite over any clip taken at their
viewport position, which made the first shot look like the ring was broken.

**One real defect found while looking at the result:** `.omg-ring.cyan` set
`--ring` but not the unfilled track, which stayed hard-coded
`rgba(201,168,76,.12)` — a gold remainder behind a cyan arc. The track is now a
`--track` custom property that the variant overrides, confirmed in the render:
`conic-gradient(rgb(0,229,255) 19.2%, rgba(0,229,255,0.12) 0deg)`. Nothing else
used the class, so this could not regress an existing adopter.


## 23 pages rendered a third narrower than they should, because of where one div sat (2026-09-03)

`[data-page-emblem]` is mounted by 181 of 187 pages. A grep says that and stops
there; a render says which of them actually work. Measuring the mount's box
against the height of its own content, across all 181:

```
mounting pages measured: 181
correctly sized:         158
node absent at runtime:    0
STRETCHED:                23
  matrix.html        box=334x2801  content=161  parent=<div class="shell"> flex
  cosmos.html        box=334x1707  content=161  parent=<div class="shell"> flex
  clarity.html       box=299x1627  content=161  parent=<div class="shell"> flex
  achievements.html  box=334x1441  content=161  parent=<div class="shell"> flex
  ... 19 more, every one parented to <div class="shell">
```

**The cause is a single character of placement.** These pages write the mount
after `</main>` and before the `.shell` close:

```html
</main>
<div data-page-emblem="clarity" style="margin:20px auto 0"></div>
</div>
```

`.shell` is `display:flex`, so that div is not "below the content" — it is a
**third flex column**, beside the sidebar and the content, stretched by the
default `align-items` to the full height of the page (2801px on `matrix.html`
for 161px of content) and taking its own width out of the row. The A/B, pinning
the module without the fix:

```
                   BEFORE                          AFTER
achievements.html  emblem 334x1441  main  850px    334x161   main 1184px
clarity.html       emblem 299x1627  main  885px    299x161   main 1184px
cosmos.html        emblem 334x1707  main  866px    334x161   main 1200px
matrix.html        emblem 334x2801  main  n/a      334x161   (column widened)
academy.html       emblem 334x161   main 1200px    unchanged
dashboard.html     emblem 334x161   main 1200px    unchanged
```

The stretched emblem was the visible symptom; **the content column being 850px
instead of 1184px was the actual damage**, and nothing in the repo was looking
for it. `scrollsX` was `false` throughout, so no overflow check would have
caught it either — the page simply gave a third of its width away.

**A source scan does not find these.** Testing whether the mount sits between
`<main>` and `</main>` reports 24 offenders and 75 pages with "no `<main>` at
all" — but `analytics.html` is in that second group and renders perfectly
(334x161), because its shell is not a stretching flex row. Source position is
not the predictor; the rendered box is. The runtime a11y pass also reports only
2 pages missing a `<main>` landmark, against the source scan's 75 — the same
disagreement, in the same direction.

Fixed in `omega-page-emblem.js`, once, for all of them: `reseat()` runs before
`draw()` and moves a host whose parent is a flex container into that parent's
content column. **Relocation rather than a CSS rule, because nothing in CSS
un-columns a flex item** — `align-self:start` stops the vertical stretch but
leaves the column in the row, so the page stays narrowed.

Finding the column takes two rules, and the second one is why the first is not
enough: prefer a `MAIN`/`.main` sibling, else the sibling that **grows**.
`matrix.html` wraps its whole page in an anonymous `<div style="flex:1;
min-width:0">` with no class and no `<main>`, so the named lookup found nothing
and left it at 334x2801 — correct behaviour for the guard, wrong outcome for the
page. `flex-grow > 0` identifies the content column on every layout here, since
the sidebar is `flex-shrink:0` at a fixed width and never grows. With the
fallback, `matrix.html` joins the rest at 334x161.

**The third correction is the one worth reading, and it was a regression I had
already pushed.** The first working version fired on any flex parent, and the
"0 stretched" sweep cannot show what is wrong with that: it counts heights, and
a mount that was already correct reads 161 -> 161 whether or not it was moved.
The parent-identity diff across all 181 pages found it --
**`graph.html`'s correct mount was being relocated into `#tab-graph.tab-panel`**,
a container that is `display:none` whenever another tab is selected, so the
emblem would have vanished from that page depending on the open tab.

Adding a sidebar-sibling requirement did not fix it; `#app.page-shell` has a
sidebar. The missing condition is the flex **axis**:

```
page                    container          direction  sidebar  stretched
clarity/matrix (+21)    .shell             row        yes      yes
graph.html              #app.page-shell    column     yes      NO
analytics.html          #app.page-shell    column     no       NO
```

A vertical stretch is only possible in a row-direction container. In a column
container the cross axis is horizontal and a full-width block is exactly what
the page wanted -- which is why `graph.html` measured 161px in place. The guard
requires `row`/`row-reverse`, which excludes it and cannot affect the 23, all of
which are `.shell` at `flex-direction:row`. `analytics.html` shows the sidebar
check was doing real work too: same container, no sidebar, never touched.

**The false-positive pass itself returned a wrong answer first, and it was the
documented kind.** Its first run printed a clean `0 / 0 / 0` while all 181 of
its lines said `SKIP`: the static server was down, every page load errored, and
a total failure rendered as a perfect score -- §8.4's "verify a 0 findings
result is real", walked into directly. The probe now asserts its own coverage
and exits non-zero if more than five pages fail to load. The server had been
killed by `pkill -f 'harness/serve.js'`, which matches the invoking shell's own
command line because that string appears in it, so the command took down its own
process group including the runtime sweep beside it.

Final measurements, all on the shipped code:

```
emblem box sweep, 181 mounting pages:  181 correctly sized, 0 stretched
parent-identity diff, 181 pages:       skipped 0
                                       parent unchanged 158
                                       moved (were stretched) 23
                                       MOVED THOUGH ALREADY CORRECT 0
verify-runtime.js --all:               PASS (187 pages)
```

The runtime figure is a re-run, not the earlier one: the first PASS(187) was
measured against the module before the axis guard existed, so it said nothing
about the code that actually ships.

One incidental gate failure worth recording as a success: `omega-registry.py`
failed on this change because the module census tracks total `omega-*.js` bytes
and the edit moved it 1134 KB -> 1136 KB. That is the "put the number in the
generator, not the paragraph" rule doing exactly its job.


## The four system pages a member actually sees had no emblem (2026-09-03)

After the reseat fix, 181 of 187 pages mount `[data-page-emblem]` and all 181
render correctly. The six that do not: `verify-deployment` and `verify-modules`
(internal harnesses nobody browses to, and the only two the runtime a11y pass
flags for having no `<main>`), plus `enter`, `reset`, `404` and `offline` --
which a member *does* see, `enter` being the first thing anyone sees at all.

Those four now carry both a mount and their own registry entry, so each draws
its own mark instead of the generic 12-fold omega: `enter` a hollow diamond,
`reset` a return arrow, `404` a circled slash, `offline` a dotted ring.

**A registry entry does not make a page a gateway destination.** `omega-gateway.js`
builds its tile list from `OmegaPageEmblem.pages` and keeps its own `EXCLUDE`
map (`404, enter, offline, reset, terms, pending, account, gateway, sovereign`),
so these stay out of it. Its header comment claimed those pages "deliberately
carry no registry entry" -- true when written, false the moment this landed, so
it now says EXCLUDE is what keeps them out, not the absence of a row.

### Two real defects, and a probe that called them OK

The first render check printed `ALL 4 OK`. Two of the four were broken; the
pass criteria only tested for a missing mount, a hidden ancestor, a zero box and
horizontal scroll:

```
reset.html   box 241x652  content 175   parent body., flex/row
404.html     box 299x29   content 29
```

**`reset.html` reproduced the bug this session just fixed, on a page I had just
edited.** `<body>` there resolves to `display:flex; flex-direction:row`, so a
mount placed as a body-level sibling of the wrapper became a stretched second
column -- 652px for 175px of content. `reseat()` did not rescue it: the page has
no sidebar, so the shell-row guard correctly declined. Moving the mount inside
`div.wrap` fixes it (241x175).

**`404.html:18` was a bare `canvas` selector** --
`canvas{position:fixed;inset:0;z-index:-1;width:100%;height:100%;opacity:.4}`
for the page's own backdrop. It captured the emblem's canvas too, taking it out
of flow so the mount collapsed to its caption (29px) and painting the mark
full-screen at .4 opacity behind the page. Scoping the rule to `#cv` fixes it
(299x161).

**Five other pages have bare `canvas` rules and are all fine** -- `clarity`,
`contacts`, `expenses`, `fasting`, `physiology`, each setting
`display:block;width:100%;max-width:...`. Measured rather than assumed: every
one renders the mark at 132x132 from a 264x264 buffer, identical to the
controls, because `draw()` sets width and height inline and inline wins.
The discriminator is *which property* the page rule touches -- `width`/`height`
are already claimed inline, `position` is not. Five edits avoided by measuring.

The probe now fails a box more than 60px taller than its own content, and a
content height under 140px (a drawn mark plus caption is ~161). Both failures
above would have been caught by those two lines.

Final, all measured on the shipped code: the four render at 161-175px with a
sized canvas, no hidden ancestor and no horizontal scroll; `ci-local.sh` 22/22,
175 tests, registry regenerated (1137 -> 1138 KB), and
`verify-runtime.js --all` **PASS (187 pages)**. The advisory still names
`verify-deployment` and `verify-modules` as the only two pages with no `<main>`
landmark -- the same two deliberately left without an emblem, which is a useful
cross-check that the excluded set is the internal one.


## 116 colour emoji shipped past the gate built to stop them (2026-09-03)

`scripts/brand-glyph-check.py` exists to keep colour emoji out of a monochrome
interface, and it reported the repo clean. It was reading only one of the three
ways a codepoint reaches the screen.

```
literal      🌽                  scanned
entity       &#127805;           NOT scanned  -- 116 occurrences, 18 files
JS escape    '\u{1F311}'         NOT scanned  --  11 occurrences,  3 files
```

Both forms are decoded before anything is painted, so the page renders exactly
the same colour sticker. Measured before touching anything: a render of the 10
worst files found **9 of them painting colour emoji**, 35 distinct, while the
gate was green -- `achievements.html` alone had 9.

`horoscope.html` is the case that proves source scanning alone was never
enough. Its lunar display is computed: the source holds `\u{1F311}` and the
render showed `U+1F316`, a different phase, picked at runtime from a table of
eight escapes.

### The gate over-reported at the same time

Extending it surfaced `consultancy.html:105`, which draws `\u{1F701}` -- an
**alchemical symbol**, ordinary monochrome type. The rule was
`[\U0001F300-\U0001FAFF]`, a span that also contains Ornamental Dingbats,
Alchemical, Geometric Shapes Extended, Supplemental Arrows-C and Chess Symbols.
Measured the way CLAUDE.md prescribes -- each candidate drawn white-on-black to
a canvas in the harness Chromium, pixels read back, channel spread as the
signal:

```
U+1F701 alchemical           spread   0  monochrome
U+1F780 geometric extended   spread   0  monochrome
U+1FA00 chess                spread   0  monochrome
U+25CF  black circle         spread   0  monochrome   (control)
U+1F3A4 microphone           spread  76  COLOUR
U+1F3C6 trophy               spread 231  COLOUR
```

So the rule is now the emoji sub-ranges, not the span between them. Had it been
left as it was, this change would have destroyed a legitimate alchemical mark
to satisfy a false positive.

### The fix, in two classes

**73 pinned, not replaced.** Every BMP codepoint with `Emoji_Presentation=Yes`
already has a text form; appending U+FE0E (`&#65038;`) keeps the exact glyph and
drops the colour. **60 of those 73 are the platform's own twelve zodiac signs**
across `horoscope`, `series` and `omega-emblems.js` -- the brand's own
vocabulary had been shipping as colour stickers.

**43 replaced**, per context rather than per codepoint, because the same emoji
means different things in different places: `&#128293;` is fasting's FAT
BURNING stage, mapped to the alchemical fire triangle, and also Hestia's
`Hearth & Home`, mapped to `⌂`. Examples: trophy → `★`, books → `▤`,
handshake → `⊜`, DNA → `≋`, Hephaestus → `⚒`, Hera → `♔`, Athena → `♘`,
Demeter → `⁂`. The eight lunar phases became the monochrome disc series
(`●  ☽  ◐  ◕  ○  ◔  ◑  ☾`), which reads as a real moon cycle rather than a
row of stickers.

### Verified in a render, with a positive control

19 pages, all loaded, **0 rendering a colour emoji**. The probe injects a known
emoji into each page and asserts its own walker sees it before trusting a clean
result -- **0 control failures** -- because a clean sweep of nothing has already
been reported twice in this session as a perfect score.

Four tests added (12 in the file, 179 in the suite): entity form caught, both
JS escape forms caught, an already-pinned entity accepted, and the monochrome
blocks accepted while real emoji are still rejected.


## PR #224: three conflicts, and 62,245 event listeners on one page (2026-09-03)

The Phase C/D audit branch had been unmergeable since main moved under it. The
conflicts were the small part.

### The conflicts

`nav.js` -- **union**. Both sides only added destinations to the same INTEL
section: the branch added `design-showcase`, main added `architecture`,
`control-plane`, `world-shell`. Dropping either leaves a shipped page
unreachable from navigation, which `audit.py` flags. Kept all four.

`bg.js` -- **both**. Unrelated code that collided only on insertion point:
main's synchronous flag gate and the branch's Phase C/D activation. Main's goes
first, because its hide rule has to be written before anything else runs.

`gateway.html` -- **main's version**, and the only genuine conflict of intent.
The branch rewrites it as a 371-line hand-authored page with **twelve hardcoded
emblem orbs**; main's is 93 lines that mount `omega-gateway.js`, which builds
every tile from `OmegaPageEmblem.pages`. That module's own header calls a second
hand-kept list "exactly the duplication this page exists to remove". Main's also
carries the `[hidden]` filter fix and the page-emblem mount.

### Three defects the branch would have shipped

**1. A divergent copy of the canonical palette, in three files.** `gateway.html`,
`agent-network.html` and `design-showcase.html` each redefined ten brand tokens
page-locally -- `--gold:#ffd700` against the brand's `#C9A84C`, and nine more.
A page `<style>` beats `bg.js`, so those pages would have rendered in a palette
no other page uses. CLAUDE.md 8.1 class 8. Removed from the two new pages, which
now inherit the canonical set; `gateway.html` was resolved to main's version.

**2. 25 unpinned colour glyphs**, the same twelve zodiac signs the emoji sweep
had just cleared from main, re-entering through pages written before it. Pinned
with U+FE0E.

**3. Unbounded listener accumulation -- the serious one.** The activation runs
`querySelectorAll` over the whole document and calls `addEventListener` on every
match with a fresh closure, and a `MutationObserver` on `body`
(`childList`+`subtree`) re-ran it on **every DOM insertion**, unthrottled.
Section 7 bound a `window` scroll listener inside the same function, so those
stacked too, each walking every parallax element per scroll event. Measured on
`dashboard.html` by instrumenting `addEventListener` before page scripts:

```
                                    before      after
interactive elements                   580        580
hover listeners after load          62,245      1,207
added by 10 ordinary insertions      4,640         20
```

1,207 is right: 580 elements x 2, plus a few from other modules. 20 is right:
ten inserted buttons x 2. A 51x reduction with the feature intact.

Three minimal changes: an `__omgCdWired` flag so each element is wired once, a
`__omgCdScrollBound` flag so the scroll listener binds once, and a
`requestAnimationFrame` coalesce so a list render runs the activation once per
frame instead of once per node. Two related fixes while there:
`transition:all` inline became an explicit `transform, box-shadow` list -- `all`
animates layout properties and beat the design system's own transitions on
`.card`/`.kpi`/`.btn` -- and `will-change:transform` was dropped, since it was
promoting all 580 matched elements to their own compositing layer at once.

Both new pages also gained a registry entry and an emblem mount, so the
"every page a member sees carries its own mark" invariant is not lost on the
next merge.


## 40 of 189 pages broken on main, from one unguarded document.body (2026-09-03)

A clean full sweep against main after PR #224 merged:

```
RUNTIME VERIFICATION: 40 page(s) failed
  FAIL affirmations.html   x 1 uncaught error(s):
       EXC Failed to execute 'observe' on 'MutationObserver':
           parameter 1 is not of type 'Node'.
  FAIL agent-network.html  x approval guard never lifted (#app still display:none)
```

Three defects, all from #224, all invisible to every static gate -- `ci-local.sh`
was 22/22 and the 179 tests passed the whole time.

### 1. bg.js threw on every page that loads it from `<head>`

The Phase C/D block called `observer.observe(document.body, ...)` at parse
time. `document.body` is null until the parser reaches it, so on the large part
of the estate that loads `bg.js` from the head this threw immediately -- and
**everything after it in bg.js never ran**: 38 pages with an uncaught error, 2
whose approval guard consequently never lifted.

CLAUDE.md 8.1 class 5a, which is precisely why `bg.js` routes its own injections
through `__omegaAppend()`. `readyState !== 'loading'` does not imply a body
exists, so the gate is `whenBodyReady()`: run now if there is a body, else wait
for `DOMContentLoaded`, else poll a bounded number of frames. Every body-touching
entry point in the block now goes through it -- the activation, the observer,
and `applyToPage(document.body)`.

### 2. Both new pages rendered completely blank

`agent-network.html` and `design-showcase.html` each ship

```html
<div id="app" class="shell" style="display:none">
```

and nothing anywhere removes it. The approval guard hides `#app` with a CSS rule
keyed on `body:not(.omega-approved)` and reveals it by adding that class -- an
**inline** `display:none` cannot be lifted by any rule, at any specificity. Both
pages were permanently empty. The cascade probe is what settled it: every
matching rule said `display:flex`, and the element still computed `none`, because
the value was on the element itself.

Measured on `agent-network.html` before and after removing the attribute:

```
                       before        after
canvas#network-canvas   0x0         505x276
div#app.shell           0x0  none   1280x840  flex
painted pixels            0          47,106
```

### 3. All twelve agent signs were wrong

`agent-network.html` carried its own twelve-agent roster, offset by four
positions against `omega-agents.json` -- **12 of 12 mismatched**:

```
Sentinel  page=Sagittarius  canonical=Aries
Merchant  page=Capricorn    canonical=Taurus
...
```

CLAUDE.md 8.1 class 8, the failure that once had the live onboarding flow
assigning the wrong god to nine of twelve signs. The roster is now derived from
`omega-agents.json` with the same fetch-and-fallback posture
`omega-constellation.js` and `agents.html` already use for that file, and colour
comes from `OmegaEmblem.color(sign)` rather than a third copy of the palette.
Verified at runtime: 12 rows, **0 sign mismatches**, 0 stale-gold colours,
`Sentinel -> Aries -> #E86A3A`.

Two more from the same page while there: an unbroken `requestAnimationFrame`
loop that cleared, reallocated (`canvas.width = ...`) and redrew the whole canvas
sixty times a second forever for a diagram that never moves -- replaced with a
draw on load plus a `ResizeObserver`, because the guard's reveal fires no resize
event; and `design-showcase.html`, a palette **reference** page, was documenting
`#FFD700` as the brand gold. Nineteen swatch values and labels corrected.

**The method note.** Every static gate was green through all of this. Nothing in
the repo can see a page that renders nothing, or a roster that disagrees with its
own source file. Only the runtime sweep catches those -- and the one run before
merging #224 was invalid, because it had been measured across a branch switch.
A sweep is only evidence if the tree held still underneath it.


## The signature ring reaches a second page, and the candidates that were rejected (2026-09-04)

`omega-constellation.js` — the ring of living emblems around a central Ω — had
been mounted on exactly one page (`agents.html`, the Council tab) since it was
written. Which other pages could take it was measured, not guessed: a render of
fourteen candidates looking for a container whose children are a uniform set of
twelve or nine.

```
cosmos.html      12x .ag-card      1136x346
houses.html      12x .hcard        1112x690
pantheons.html   12x (no class)    1112x765
levels.html      12x .lv-card      1112x262
phases.html      12x .phase-card   1112x565
elements/factions/triads/sovereigns/hall/realm/universe/matrix/agents   none
```

**Four of the five were rejected, and the reasons are the useful part.**
`cosmos.html` and `houses.html` each already draw their own circular diagram —
`houses.html` has a 500x500 `#wheel-canvas` behind its WHEEL tab — so a second
ring would duplicate a diagram, not add one. `levels.html` and `phases.html`
hold a *progression*, not a set of peers; a ring implies equal standing, and
both had just gained a ring gauge for their own headline percentage, so a second
ring on the same page would compete with it.

`pantheons.html` was the one real candidate: twelve Olympians, each already
carrying a `sign` the emblem module can draw, and no circular diagram anywhere
on the page.

**Fed from the page's own array, not a copy.** `ringNodes()` maps the existing
`GODS` array, so the ring cannot disagree with the cards below it — the failure
that had `agent-network.html` showing all twelve signs wrong on the same day.
Nodes carry no `href`: the gods have no destination pages, and the module
renders a `<div>` rather than a dead link when `href` is absent.

One real trap in the wiring. `domain` is stored with an HTML entity
(`'Sovereignty &amp; Law'`), and the constellation escapes what it renders — so
passing it through raw painted the literal characters `&amp;`. Decoding through
a detached `<textarea>` before handing it over fixes it; verified in the render
as `SOVEREIGNTY & LAW`. The module also observes `childList`, not attributes, so
setting `data-cn-nodes` after its boot scan needs an explicit
`OmegaConstellation.scan()`.

Measured after mounting: `data-cn-state="ready"`, **12 nodes, 12 marks, 12
filled** with emblem artwork, box 1112x908, no hidden ancestor, no horizontal
scroll, no page errors.

`verify-runtime.js --all`: **PASS (189 pages)**, measured on the shipped code.

**Also corrected: Zeus was `#FFD700`.** The other eleven gods carry deliberate
per-deity accents (silver for Artemis, tan for Hestia) which are page content,
not a palette — measured as 12 distinct values with only 3 overlapping the brand
set, so they were left alone. Zeus's was the stale gold from the same family as
the divergent palettes cleared earlier that day, reading as an off-key gold
beside the real `#C9A84C`.


## The shipped telemetry utilities get a drawing engine, and six honest adopters (2026-09-04)

**Same shape as the `.omg-ring` finding: CSS that ships and nothing renders.**
`bg.js` has styled `.trend.up` / `.trend.down` badges, `.tbl-row.up`/`.down`
row coloring and `.sparkline` (stroke + glow for an SVG polyline) since the
Ω-GVP layer landed, and CLAUDE.md §4.1 recorded them as "opt-in, not yet used
by any page". Measured rather than assumed, with an exact class-token match:

```
.trend      0 uses
.sparkline  1 use   (ops.html)
.up         4 uses  (profile.html, unrelated)
.down       0 uses
```

A `\b`-anchored grep first reported "trend: 15 uses" — wrong, because `-` is a
word boundary in that regex, so it counted page-local `trend-chip`,
`trend-row`, `trend-wrap`, `trends-month-row` and `trend-yr-btn`. One step from
"correcting" a CLAUDE.md claim that was accurate.

**Why this was not "add trend badges to the 34 `.tbl-row` pages".** A
`.trend.up` badge asserts a *direction* — that a number moved against a real
previous value. Most of those pages hold no prior value, and rendering a
direction from nothing is §8.1 class 9 exactly: `hercules.html` drawing
`Math.random()*100` as member progress, `ad-network.html` inventing
`REVENUE.total += 0.05`. So the adoption set was derived from what the pages
actually persist and read back, not from where the markup would fit.

Of 34 pages carrying shared `.tbl-row`, only 4 showed any series signal. Of the
8 pages that provably persist *and* re-read a dated history, reading each
storage shape rather than trusting the regex:

| page | key | shape | verdict |
|---|---|---|---|
| `mirror.html` | `omega_mirror_entries` | `{date,energy,focus,clarity}` per day | 3 numeric series |
| `expenses.html` | `omega_expenses` | `{date,amount,type}` | monthly totals |
| `fasting.html` | `omega_fasting_log` | `{start,elapsed,completed}` | duration per fast |
| `missions.html` | `omega_missions_activity` | `{date: xp}` | XP per day |
| `rituals.html` | `omega_ritual_logs` | `{date:{id:true}}` | kept-count per day |
| `water.html` | `omega_water_log` | `{ts,ml}` | ml per day |
| `gates.html` | `omega_gate_history` | `{outcome,date}` | **no magnitude — skipped** |
| `charter.html` | `omega_charter_history` | version records | **not numeric — skipped** |

**`omega-sparkline.js`** (new, 6.6 KB, loaded per page rather than added to the
90-modules-on-every-page debt in §8.2) draws the geometry once so six pages do
not repeat min/max/scale arithmetic, and encodes the honesty rules in code
instead of in a reviewer's memory:

- fewer than two finite readings -> nothing renders and the mount stays
  `hidden`; there is no placeholder state
- the badge compares the last two *real* values only
- equal values render a new `.trend.flat` (`▬`, muted), never an invented
  direction
- a prior value of 0 renders the absolute delta, because no percentage change
  exists from zero
- every adopter excludes the in-progress day or month from the comparison: a
  half-earned day against a finished one reports a fall that has not happened

Load order is not a hazard: pages set `data-spark-values` from their own render
pass, and the module both scans on load and observes that attribute. This is
the correction to `omega-constellation.js`, which observed `childList` only and
needed an explicit `scan()` from every adopter.

**Verified in a render, with controls, because no static gate can see this.**
`sparkprobe.js` seeds each page's real storage keys, renders, and reads the
drawn SVG back — 10 cases, 0 failures, 0 load failures:

```
OK   mirror rising energy       drawn=3  [3pt up 80%] [3pt up 17%] [3pt up 33%]
OK   CONTROL mirror no data     drawn=0
OK   CONTROL mirror one reading drawn=0
OK   expenses spend falling     spark-exp     [6pt  down 56%   241x32]
OK   fasting shorter last fast  spark-fast    [3pt  down 33%   241x32]
OK   missions rising xp         spark-xp      [14pt up   167%  138x32]
OK   rituals kept per day       spark-rituals [14pt up   200%  239x28]
OK   BRANCH equal values flat   spark-fast    [2pt  flat NO CHANGE]
OK   BRANCH zero prior absolute spark-xp      [14pt up   320]
OK   water yesterday vs prior   spark-water   [0pt  up   57%   102x19]
```

Every percentage was checked against the seeded numbers by hand (5→9 = +80%,
900→400 = −55.6%, 120→320 = +166.7%, 1→3 = +200%, 1400→2200 = +57.1%). The two
CONTROL rows are the reason the run means anything: a probe that cannot report
a failure proves nothing, and both no-data and one-reading must draw nothing.
The two BRANCH rows cover the honesty paths that would otherwise never execute.

The probe found two real problems on its first run, neither of them in the
sparkline code:

- `water.html`'s stat grid lives in the History tab and only renders when
  `switchTab(this,'t2')` fires, so the mount did not exist at load. The probe
  now clicks the tab — the badge is in the right place, the probe was reading
  the wrong moment.
- the expenses fixture wrote `recurring: false` where the page's own writer
  stores the select's *string* value, and `e.recurring.toUpperCase` threw. A
  fixture bug, not a page bug, but it is the reason the run was FAIL rather
  than a quiet pass with one page erroring underneath.

`water.html` takes the badge without a line (`data-spark-line="off"`): the
seven-day bar canvas below it already draws the shape, so the badge adds the
one thing that canvas does not state — the direction of the last complete
change — rather than duplicating it. `missions.html` takes the line *because*
its 90-day heatmap buckets a day into five intensities, so every day above
600 XP looks identical there.

Gates after the change: `./scripts/ci-local.sh` 22/22, `unittest discover`
179 passing, `scripts/audit.py` 0 critical / 7 warnings, `context-budget.py`
PASS at ~15,997 of 16,000 (six paragraphs elsewhere in CLAUDE.md were trimmed
to make room for the §4.1 rewrite), `verify-runtime.js` PASS on the 13
capability entrypoints and `--all` PASS on all 189 pages (exit 0, run to
completion — not a claim written ahead of the run). `omega-registry.py`
regenerated for the new module.

## Which pages are flat text, measured — and what the card sweep actually does (2026-09-04)

**The measurement.** "More graphic than text" is a taste claim until something
counts it. A runtime scan measured, inside the content column only (the sidebar
is identical everywhere and swamps the signal), visible `innerText` characters
against the weight of what actually paints — `canvas`×6 + `svg`×3 + emblem×4 +
`img`×2 + `.card` + bar×2 — over 187 pages, 0 load failures.

The control is what makes it mean anything: `dashboard`, `cosmos` and `matrix`
are the known-cinematic pages, and they ranked 109, 101 and 126 of 187 — the
visual half. A metric that put them at the text end would have been measuring
the wrong thing and nothing else in the output would have counted.

**The top three results were false positives, and checking them was the point.**

```
approvals.html       2662 chars, visual=0
interface-omni.html  2045 chars, visual=0
journal.html          941 chars, visual=0
```

`visual=0` on pages that every emblem census says carry a mount. Walking the
ancestor chain in the browser rather than guessing:

```
journal.html        MAIN.main 0x0 -> DIV.shell 0x0 -> DIV. 0x0 display=none
approvals.html      MAIN.main 0x0 -> DIV.shell 0x0 display=none
interface-omni.html MAIN.main 0x0 -> DIV.shell 0x0 -> DIV. 0x0 display=none
```

`body.omega-approved` was set on all three, so this is not the approval guard.
Reading the source: `approvals.html:149` is `<div class="shell" id="app"
style="display:none">` revealed after an owner check, `interface-omni.html:63`
is `<div id="main" style="display:none">` revealed only for
`profiles.is_owner`, and `journal.html:130` is `<div id="j-main"
style="display:none">` behind a passphrase. All three are correct behaviour
under a non-owner stub. The scan found gates, not design gaps. `innerText`
still returned characters because an unrendered element returns its
`textContent` — which is exactly how a blank page can score as a wall of text.

**Emblem coverage was already complete**, checked before building anything:
188 registry entries in `omega-page-emblem.js`, 187 of 189 pages carrying a
mount, and the 2 without are `verify-deployment` and `verify-modules`, the
internal harnesses the module header excludes on purpose. Nothing to do there.

**What was left was the genuine finding**: the flattest *rendering* pages carry
canvases and SVG but zero `.card` — their content blocks sit raw on the
background under page-local class names. Checked against the two documented
sweep failure modes (a page-local `::before`/`::after` that sets `background`;
a per-instance border via inline `style=`, JS `.style.border*`, or a
same-element modifier):

| class | files | verdict |
|---|---|---|
| `.stat-box` | 20 | clear -> swept (118) |
| `.future-card` | chronicle | clear -> swept (4) |
| `.prog-block` | gaming | clear -> swept (2) |
| `.shelf-item` | library | clear -> swept (1) |
| `.event-card` | graph-timeline | clear -> swept (1) |
| `.e-card`, `.g-card` | gaming | **`::before` sets `background`** — excluded |
| `.event-card` | chronicle | **`::before` sets `background` + 17 inline `border-left`** — excluded |
| `.sci-card`, `.book-card` | — | already carried `.card` |

130 elements swept across 23 files.

**A `.card` sweep is not additive, and this session assumed it was.** The
prediction was that a page's own `<style>` would win the tie and only the
hover-only glow would be added. Measured before and after on real pages, that
is false — `omega-visual-evolution.css` re-declares `.card` and is injected
*after* the page's sheet, so at equal specificity it wins:

```
focus.html .stat-box     border  rgba(201,168,76,.1)  -> rgba(201,168,76,.22)
                         background  transparent      -> rgba(10,10,15,.68)
                         padding     16px             -> 20px
                         shadow      none             -> inset + glow
                         hover.shadow none            -> 0 8px 24px rgba(0,0,0,.35)
achievements.html        border  rgb(26,26,26)        -> rgba(201,168,76,.22)
                         radius  0px                  -> 2px
```

For a bare page-local box that unification is the point of having a design
system. For one whose own value carries meaning it is a loss, and there was
exactly one: `chronicle.html`'s `.future-card` used a **dashed** border to say
"not yet real", and `.card`'s shorthand made it solid. Fixed by re-asserting it
at `.future-card.card` specificity (0,2,0), which beats `.card` regardless of
sheet order — verified back to `borderStyle: "dashed"` in a render.

**A second scanner false positive, caught the same way.** A stuck-invisible
sweep reported `chronicle.html` 4/21 elements at `opacity: 0` inside an open
panel at full 268x205 size — which is what shipping invisible content looks
like. It was the probe: `.card` enrolls an element in `omega-content.js`'s
`.oc-hidden` reveal, and the probe clicked every tab but never scrolled.
Scrolling each card into view the way a member reaches it returned
`opacity: 1`, `revealed` on all four. Across the other 22 pages, 143 elements
checked, 0 stuck.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `sparkprobe.js` 10/10 still
passing after the sweep, `context-budget.py` PASS at ~15,996 of 16,000 (nine
more paragraphs trimmed; the `cporter202/ai-growth-stack` row was merged into
the catch-all 0-applicable row rather than dropped, so the do-not-re-evaluate
record survives — the full evidence is in `OMEGA_EXTERNAL_ECOSYSTEM_AUDIT.md`),
`node scripts/verify-runtime.js --all` PASS on all 189 pages, exit 0.

## The card-sweep exclusion list was not permanent: --card-accent, and two traps it exposed (2026-09-04)

**The standing claim, twice recorded in CLAUDE.md §4.1, was wrong.**
`honors.html`'s `.honor-card` was documented as un-sweepable because "both its
`::before` and `.card`'s set `background`, and only one can win... That one is
not hover-fixable: it is the badges' resting appearance." The collision is real.
The conclusion was not.

Reading what `.card::before` actually is:

```
.card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;
              background:var(--card-accent,var(--gold))}
```

It is the *same 2px top accent bar* those classes draw, and it takes the colour
from a custom property. So the fix is one declaration per class, not an
exclusion. Verified in an isolated harness rendered through headless Chromium
before touching a page — a colour token, a gradient token, and the default:

```
.e-card   --card-accent:var(--gold)       -> ::before  rgb(201, 168, 76)
.g-card   --card-accent:var(--purple)     -> ::before  rgb(155, 107, 240)
.tier-omega --card-accent:linear-gradient(...) -> ::before  linear-gradient(90deg,
                                    rgba(0,0,0,0), rgb(201,168,76), rgba(0,0,0,0))
no token                              -> ::before  rgb(201, 168, 76)  (default)
```

A gradient works as well as a colour, which is what `honors.html` needed: its
base `::before` carried geometry only and five `.tier-*` modifiers carried the
paint. All five translated to `--card-accent` losslessly — measured after the
change, four distinct gradients still rendering across the 16 badges (gold
`rgb(201,…)`, solar `rgb(226,…)`, silver `rgb(192,…)`, cyan `rgb(0,22…)`).

**The scanner found 42 candidate classes; most were noise.** A false-positive
pass is why that number is not the answer: `t`, `a`, `section`, `toggle` and
`toggle-slider` are utility names, not card containers, and `honors.html`'s five
`tier-*` entries are modifiers on `.honor-card`, not classes of their own. The
genuinely-clean accent-bar-plus-anchored set is 21 classes across 18 files.
**Only 3 were adopted here** — `gaming.html`'s `.e-card`/`.g-card` (the flattest
measured page in the repo, ratio 211) and `honors.html`'s `.honor-card` (the
documented counterexample). The other 18 are feature-defining containers
(`charter-doc`, `passport-doc`, `arch-console`…) and sweeping them wholesale
would flatten exactly the per-page character this platform is supposed to have.
They are recorded as unblocked, to be taken one page at a time with judgement.

### Trap 1 — `[class*="card"]` was already doing half the job

Asking the browser which rule supplied the border, rather than reasoning about
it, turned up a selector nothing in this repo's docs records:

```
omega-visual-evolution.css
.card,.kpi,.kpi-card,.panel,.module,.tile,.widget,.modal,.drawer,
[class*="card"],[class*="panel"]{ background-color:var(--omega-glass);
  border-color:var(--omega-edge); box-shadow:... }
```

A **substring** attribute selector. Every class whose *name merely contains*
"card" — `.e-card`, `.honor-card`, `.event-card`, `.future-card` — already
receives the glass surface, edge colour and shadow without ever carrying
`.card`. That is why the excluded classes still looked like cards, and it
sharpens the previous entry's finding: what a sweep actually adds to a `*-card`
class is the hover glow, the shimmer `::after`, the cursor light, `padding:20px`
and enrolment in the reveal systems — not the surface, which was already there.
It also explains the asymmetry in that entry's own before/after: `.stat-box`
(no "card" substring) showed `shadow: none` before, `.future-card` did not.

### Trap 2 — the animation-beats-declaration trap, recurred

Adding `.card` enrols the element in `omega-animated.js`'s `oa-fade-up`, whose
final keyframe sets `opacity:1`. Measured after the sweep:

```
before   .honor-card.locked   opacity 0.45   filter grayscale(0.6)
after    .honor-card.locked   opacity 1      filter grayscale(0.6)
```

`.honor-card.locked{opacity:.45}` is specificity (0,2,0) and still lost, because
**an animation outranks a plain declaration regardless of specificity** — the
same trap §4.2 records the Ω-HORIZON layer hitting. Sixteen locked honors
stopped looking locked. `!important` is the one author declaration that outranks
an animation; applying it restored `opacity: 0.45` in a render.

The same reveal enrolment produced a false alarm worth recording: a visibility
probe reported 2 of 60 `.e-card`s at `opacity: 0.098` and `0.085`. Those are
rising values mid-`oa-fade-up`, not stuck elements — raising the settle from
1000ms to 2600ms gave 132 open elements, **0 transparent**. A single opacity
reading during a 0.5s animation is a measurement, not a finding.

`.honor-card` also needed `padding:0` re-asserted at `.honor-card.card`: it
carries no padding of its own and wraps a full-bleed `.honor-visual`, so
`.card`'s 20px would have inset it. Verified: `firstKidW` unchanged at 267,
box unchanged at 269x430.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `context-budget.py` PASS at
~15,976 of 16,000 (five more §8.2 paragraphs compressed to make room for the
two corrected facts in §4.1), `node scripts/verify-runtime.js --all` PASS on
all 189 pages, exit 0.

## The re-stepped crimson never reached the screen: one late sheet and nine literals (2026-09-04)

**CLAUDE.md records `--crim` as fixed.** bg.js carries the re-step and the
reason, verbatim in its own comment: *"was #8B0000 -- measured at 1.74:1
against this surface, i.e. barely visible, and 77 of its uses are text
`color`. Re-stepped to the deepest crimson that still clears 3:1."* The token
was corrected. **The pixels were not.** Measured across 23 pages, every one of
them painted visible text at `rgb(139, 0, 0)`.

### How the search went wrong first, and what corrected it

A source scan found **62 of 189 pages** redefining canonical tokens in their own
`:root` — 176 overrides, led by `--M` (47), `--crim` (23), `--D` (21), `--R`
(17). The obvious reading was a 62-page regression: `--M:monospace` and
`--D:serif` would mean the brand webfonts never load, and `--crim:#8B0000` would
mean the contrast failure is back.

The render says otherwise, and the two halves disagree *on the same page*:

```
dashboard.html  :root declares  --M:monospace   --crim:#8B0000
resolved        --M="Courier Prime",monospace   --crim=#8B0000
```

Enumerating every sheet that declares them settles it:

```
sheet# 0  <STYLE>                    --M="monospace"                 --crim="#8B0000"
sheet# 1  <style id=omega-global-css> --M="Courier Prime",monospace   --crim="#C4453C"
sheet#19  <style id=omega-theme-css>  --M=""                          --crim="#8B0000"
RESOLVED                              --M="Courier Prime",monospace   --crim="#8B0000"
```

Two facts, neither of them in this repo's docs:

1. **A page's own `<style>` is sheet 0, so bg.js at sheet 1 beats it.** All 176
   page-local token overrides are dead code. CLAUDE.md §4's "bg.js is sheet 1 of
   53, so every later sheet wins" is true of the 51 *module* sheets and the
   opposite of true for the page's own block. The 62-page edit would have been
   62 files changed for no rendered difference.
2. **`theme.js` (`#omega-theme-css`, sheet 19) re-declares the palette** and,
   being later, beats bg.js. It is a deliberate "Sovereign Dusk" layer — `--void`
   darkened to `#08080F`, `--ink` brightened to `#F0EDE6` — but it also carried
   `--crim:#8B0000`, reinstating the value bg.js had measured its way out of.
   §4's stylesheet-owner table did not list it at all.

Against theme.js's own `--void` (`#08080F`):

```
--crim OLD  #8B0000   1.99:1   FAIL (<3:1 floor)
--crim NEW  #C4453C   4.05:1   passes
--gold      #C9A84C   8.74:1     --solar #E2C86D  12.09:1
--cyan      #00E5FF  12.98:1     --green #3fb27f   7.50:1
--ink       #F0EDE6  17.07:1     --muted #8A8880   5.62:1
```

Every other token in that palette clears 4.5:1. `--crim` was the only failure.

### The token fix alone did not finish the job

After correcting theme.js, `--crim` resolved to `#C4453C` on all 23 pages — and
the probe *still* found `rgb(139, 0, 0)` text. The word it kept naming was
`UNIVERSE`, a nav item. The colour was never coming from the token:

```
nav.js:82   {key:'universe', label:'UNIVERSE', col:'#8B0000', ...}
nav.js:377  {label:'UNIVERSE', col:'#8B0000', ...}
```

`sec.col` drives `.on-glyph` colour, `.tip-head` colour and `.dss-emblem`
colour — text, on every page that renders the sidebar. Nine hardcoded literals
were painting text or strokes, each verified individually before being touched:

| file | what the literal paints |
|---|---|
| `nav.js` ×2 | the UNIVERSE section colour — the text found on 21 pages |
| `omega-chrono.js` ×2 | `td.style.color` on the trial countdown — a warning that must be legible |
| `omega-menu.js` | a menu section colour, beside `#C9A84C` and friends |
| `omega-chart.js` ×2 | chart `line`/`point` stroke on a dark canvas |
| `omega-world-shell.js` | a realm colour, beside `#D9B86A` / `#E86A3A` / `#C9A84C` |
| `emblem.js` ×3 | `col` drives a label `color` plus canvas stroke/fill at alpha .42–.75 |

Eight stale `var(--crim,#8B0000)` fallbacks were corrected too — they only fire
if the token is undefined, which it never is, but a wrong fallback is a wrong
fallback.

**Two sites were deliberately left**, and the reason is the false-positive
discipline: `omega-realm.js`'s `Fire:{...outer:'#8B0000'}` is a gradient's dark
outer stop and every other element has one too (`#003366`, `#546E7A`,
`#5D4037`) — it is the dark end by design, not text. `omega-protect.js:91` is a
`console.log` style string.

The first pass at `emblem.js` fixed only the entry the grep had shown
(`factions`); the all-pages sweep then found `cinema` and `settings` still dark,
because the replace had matched one exact string rather than the file's
remaining occurrences. Two more, found by measuring rather than by assuming the
first edit was complete.

### Result

```
BEFORE   23 of 23 sampled pages painting sub-3:1 crimson text
AFTER    189 pages, 0 load failures,
         sub-3:1 crimson text nodes = 0
         re-stepped crimson text nodes = 221
```

The 221 is the positive control and the reason the zero means anything: a probe
that found nothing anywhere would report the same zero. It found the new colour
painting in 221 places and the old colour in none.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `context-budget.py` PASS at
~15,953 of 16,000 (three §8.2 entries compressed to make room for the new
stylesheet-owner row in §4), `node scripts/verify-runtime.js --all` PASS on all
189 pages, exit 0.

## Six buttons nobody could read, found by auditing contrast instead of grepping (2026-09-04)

The crimson fix in the previous entry chased one literal. **The general form is
cheaper and finds more**: walk every visible text node in a render, compute its
contrast against its own effective background, and report what fails the WCAG
floor. Effective background means walking ancestors until something opaque
paints — a naive read of `backgroundColor` returns `rgba(0,0,0,0)` and every
ratio comes out wrong.

First run: **189 pages, 0 load failures, 58,628 passing text nodes, 66 distinct
failing (selector, colour, background) combinations.** The 58,628 is the
positive control; a probe that measured nothing would report zero failures too.

### The worst of it: three pages where the primary action was invisible

```
1.01:1   account.html   #btn-signup  "CREATE ACCOUNT"   rgb(8,8,15) on rgb(7,7,8)
1.01:1   account.html   #btn-login   "LOG IN"
1.01:1   reset.html     #r-send      "SEND RECOVERY LINK"
1:1      mindmap.html   .btn-gold    "CREATE MAP"       gold on gold
```

`account.html` and `reset.html` are **public** pages — in bg.js's signed-out
exemption list — so this is the sign-up, sign-in and password-recovery path.
The `account.html` numbers are a real BEFORE, pinned from `HEAD` with the
harness's `pin` option rather than reasoned from the diff.

**Root cause, one shape, three pages.** bg.js only ever had *ghost* buttons:

```
.btn{ … background:none; … }
.btn-gold{color:var(--gold);border-color:rgba(201,168,76,.3)}
```

A page wanting a solid button hand-rolled
`.btn{background:var(--gold);color:var(--void)}` — the same (0,1,0) specificity,
and bg.js's sheet loads *after* the page block, so bg.js wins. The background is
wiped and dark text is left on the dark page. `mindmap.html` hit the mirror
image: it named its button `.btn-gold`, bg.js's ghost rule won the *colour*, and
gold text sat on the page's own gold background at exactly 1:1.

`terms.html` escaped only because it happens to use a descendant selector,
`.accept .btn` at (0,2,0).

**The fix is the missing component, not a specificity fight.** CLAUDE.md §4 says
to extend the shared block rather than define page-local styles that drift, so
`.btn-fill` now exists in bg.js — a filled primary action, retintable with
`--btn-fill` (the same custom-property pattern as `--card-accent`). The three
pages dropped their colour/background overrides, kept their layout rules, and
took `class="btn btn-fill"`. Measured after: all six buttons at **8.74:1**.

### The widest-reaching failure was in the nav dock

```
2.57:1   179 pages   .on-lbl / .on-logout   #55534e on --void
```

Seven occurrences of `#55534e`, an off-palette grey, for the inactive icon-dock
labels. That is not "dim", it is unreadable. Replaced with `var(--muted)`, which
measures 5.41:1 on bg.js's `--void` and 5.47:1 on theme.js's — and, being a
token, follows theme.js instead of drifting from it.

### A gap the Ω-GVP fallback skin explicitly could not reach

```
2.33:1   8 pages   button.btn-gold   "SEND"   gold on rgb(107,107,107)
```

`rgb(107,107,107)` is the **browser's default button face**. These are
`<button class="btn-gold">` without `.btn`, so bg.js's `background:none` never
applied, and the GVP fallback skin is scoped `button:not([class])` — which
correctly skips them, exactly as §4.1 records. Fixed at the source: the ghost
variants (`.btn-gold`, `.btn-cyan`, `.btn-crim`) now declare `background:none`
themselves, so they no longer depend on `.btn` being present.

### Result, and what is deliberately left

```
                        failing combinations   passing text nodes
before                          66                   58,628
after .btn-fill + nav           61                   61,355
after ghost-variant fix         60                   61,371
```

Two findings were measured and **not** changed, on purpose:

- **`.tip-head` at 3.92:1 on 180 pages** is the re-stepped `--crim` at 12px on a
  panel. bg.js's own comment says it was chosen as "the deepest crimson that
  still clears 3:1" — this is a stated brand trade-off, not a regression, and
  re-stepping the danger colour again is a design decision rather than a bug fix.
- **~59 page-local grey combinations** (`#666`, `#555`, `#333`), each reaching
  1–9 pages. Real, but several are deliberate de-emphasis that happens to be too
  dim, and a bulk sweep of 59 combinations without per-page judgement is the
  antipattern this log keeps recording.

### Method notes

The first filled-button run measured only 9 of 25 buttons and printed
`COVERAGE FAILED`; the other 16 sat in modals or closed tabs. Since *colour* was
under test and not layout, unhiding the ancestors and re-measuring lifted
coverage to 21 and is what surfaced `mindmap.html`. Four remained unreachable
and were reported as unmeasured rather than assumed fine.

`account.html` stayed unmeasured even then — because the harness defaults to a
**signed-in** stub and a public auth page redirects a signed-in visitor away.
`launch({signedIn:false})` is required for `account`/`reset`/`terms`/`enter`,
and it is what produced the 1.01:1 reading above.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `context-budget.py` PASS at
~15,999 of 16,000 (four §8.4 method notes compressed to make room),
`node scripts/verify-runtime.js --all` PASS on all 189 pages, exit 0.

## main landed red: PR #235 reintroduced 18 colour emoji and sub-12px type (2026-09-04)

Merging `origin/main` into this branch turned **three blocking gates and one
unit test red**, none of them from this branch's work. `2d4638bc` (PR #235,
"Phase C/D: Enhance dashboard with cinematic emblems and 3D visual elements")
had merged with those gates failing.

```
FAIL  brand-glyph   18 colour-emoji occurrences in dashboard.html
FAIL  type-scale    dashboard.html declares type below the 12px floor
FAIL  registry      omega-*.js modules 1147 KB -> 1152 KB, uncommitted
FAIL  test_brand_glyph_check.test_repo_is_clean
```

**The first is a same-day regression of a swept fix.** Earlier in this session
116 colour emoji were removed platform-wide and
`scripts/brand-glyph-check.py` was extended to catch all three encodings
(literal, `&#127805;`, `'\u{1F311}'`). PR #235 put 18 back on
`dashboard.html` — the flagship page — as `.emblem-orb` marks:

```
📖 🧠 🎯 💰 🤝 💪 🛡        astral-plane pictographs, no text form
♈ ♓ ♎ ♏ ♑ ⚡ ✨ ♂          BMP, default to colour presentation
```

The gate did exactly its job: it caught the regression before deploy rather
than after. That is the argument for the gate, recorded as evidence.

**The same file already mixed conventions** — `⚖`, `♦`, `✦`, `◈`, `⊕`, `☯`
were monochrome in the very same KPI rows — so the fix was to finish the
convention, not invent one. Seven pictographs were replaced with BMP marks
already in this repo's vocabulary, chosen for meaning:

| KPI | was | now | why |
|---|---|---|---|
| JOURNAL ENTRIES | 📖 | `▤` | square with horizontal fill, a lined page |
| CARDS DUE TODAY | 🧠 | `◉` | the emblem registry's "intelligence" mark |
| VISION SCORE AVG | 🎯 | `◎` | bullseye |
| SAVINGS RATE | 💰 | `⊙` | circled dot |
| CONTACTS DUE | 🤝 | `⊛` | circled asterisk |
| BODY WEIGHT | 💪 | `✹` | the agent-network mark |
| ADMIN ACTIONS | 🛡 | `⌘` | the repo's "command" glyph, and these are owner controls |

Twelve BMP symbols were pinned with `U+FE0E`.

**Verified by pixel readback, not by the codepoint tables** — the repo's
standing rule. Each replacement drawn white-on-black at 34px and read back:

```
mono   "▤"  spread=0  ink=292      mono   "♈︎"  spread=0  ink=142
mono   "◉"  spread=0  ink=326      mono   "♓︎"  spread=0  ink=184
mono   "◎"  spread=0  ink=218      mono   "⚡︎"  spread=0  ink=100
mono   "⊙"  spread=0  ink=186      mono   "✨︎"  spread=0  ink=162
mono   "⊛"  spread=0  ink=243      mono   "♂︎"  spread=0  ink=177
mono   "✹"  spread=0  ink=226      mono   "⌘"   spread=0  ink=229
mono   "●"  spread=0  ink=355
COLOUR "📖" spread=186 ink=978     <- positive control
```

13 of 13 monochrome, none with zero ink (a missing glyph draws an empty box,
which passes a colour check while looking broken), and the control emoji
registers colour at spread 186 — so the detector is detecting.

**The type floor** was `.status-indicator{font-size:8px}` with a `10px`
`::before`. Raised to the 12px floor, with the dot's smaller optical size kept
as `.85em` rather than a second absolute value below the floor.

Gates after: `./scripts/ci-local.sh` 22/22, 179 tests, `brand-glyph-check.py`
clean across 362 shipped files, `node scripts/verify-runtime.js --all` PASS on
all 189 pages, exit 0.

## The rest of the sub-floor text: 137 greys to the canonical token (2026-09-04)

The previous entry fixed the six invisible buttons and the 179-page nav dock,
and left ~59 page-local grey combinations as "each needs judgement". Reading
them together, they were not 59 judgements — they were **four values**, used the
same way everywhere: `#666`, `#555`, `#444`, `#333` as a de-emphasised label
colour on a near-black page.

```
#666  3.44:1     #555  2.65:1     #444  2.03:1     #333  1.56:1
var(--muted) #8a8676  5.41:1 on bg.js's --void, 5.47:1 on theme.js's
```

**The static list would have misled, and the runtime audit is what stopped it.**
A scan of `color:` declarations against `--void` also flagged `#000` — 34 uses
across 28 pages at a nominal 1.06:1. Every one of those is dark text on a
*filled* button, and the runtime probe measures them at 7.5–15:1 because it
resolves the effective background. Sweeping the static list would have destroyed
28 pages' button labels to fix a number that was never real.

So the sweep took only the four values the runtime audit showed failing on a
dark surface: **116 declarations in `<style>` blocks across 16 files**, then a
second pass for **21 more in inline `style=` attributes** (markup and JS-built
strings) that a stylesheet-only sweep cannot see — `investment.html`'s
"NO HOLDINGS YET — ADD HOLDING" at 1.56:1 and `passport.html`'s "PERSONAL
SOVEREIGNTY RECORD" at 2.65:1 were both in that second group.

```
                              failing combinations   passing text nodes
before (previous entry)               60                   61,371
after the <style> sweep               39                   61,504
after the inline sweep                37                   61,561
```

### A probe "fix" that was reverted

Two rows still read 1.01:1 — `chronicle.html`'s `.era-badge` and
`family.html`'s `.btn-add`. Both were checked by hand earlier and are fine:
their backgrounds are `--solar` and a gold gradient, and the probe's `effBg`
only reads `backgroundColor`, so it walks past them to the page ground.

Teaching it to read gradient stops looked like the obvious correction. It made
the probe **worse** — 37 failing combinations became 50, because picking the
first opaque stop is arbitrary when text sits across a gradient's range, and the
new rows sat on invented backgrounds like `rgb(33,17,13)` and `rgb(35,20,14)`.
Reverted. Two documented false positives beat thirteen unexamined ones, and the
reason is now a comment in the probe so the next session does not retry it.

### What remains, and why it is not swept

All 37 survivors sit between **3.09:1 and 4.23:1** except those two artifacts:
they clear the 3:1 floor for UI and large text, and miss 4.5:1 at 9–14px. The
overwhelming majority are the crimson family — `rgb(196,69,60)` (the canonical
`--crim`, 4.01:1) plus page-local reds `rgb(192,57,43)`, `rgba(200,50,50,.7)`,
`rgba(200,60,60,.7)` — with a few purples and one LinkedIn brand blue
(`rgb(10,102,194)`, 3.47:1).

bg.js's own comment says `--crim` was re-stepped to "the deepest crimson that
still clears 3:1". Pushing the danger colour brighter again to clear 4.5:1 at
12px is a brand decision, not a bug fix, and a third-party brand blue is not
this platform's to restyle. Recorded, not swept.

### Method note

A concurrent 189-page sweep reported `loadFail=1` once and `loadFail=0` on
re-run with an identical tree. A single load failure under concurrency is a
timeout, not a finding — re-run before acting on one.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `check-inline-js.py` clean,
`node scripts/verify-runtime.js --all` PASS on all 189 pages, exit 0.

## The contrast audit becomes a gate (2026-09-04)

Three entries in this log fixed contrast bugs that **every static gate passed**:
six buttons at 1.01:1 and 1:1 on the public sign-up and password-recovery path,
15 nav-dock labels at 2.60:1 across 179 pages, and 137 sub-floor greys. Nothing
in CI would have caught the seventh.

That is not hypothetical. PR #235 reintroduced 18 colour emoji on
`dashboard.html` the same day the platform-wide sweep removed 116 — and
`brand-glyph-check.py` caught it before deploy, because that class *has* a gate.
Contrast had none.

`scripts/verify-runtime.js` now measures it: **blocking under 3:1**, advisory
between 3:1 and 4.5:1. Baseline across 189 pages: **0 blocking, 259 advisory,
61,522 passing, 61,781 text elements measured.**

### Getting the surface right took four wrong rules

Contrast is only as good as the background you compare against, and on this
platform almost nothing paints an opaque colour on the element itself.

1. **Opaque-colour-or-page-ground** (the original probe). Missed that `.card`'s
   glass is `rgba(10,10,15,.68)`.
2. **Read the gradient's first opaque stop.** Tried in the previous entry and
   reverted: 37 findings became 50 on invented backgrounds like `rgb(33,17,13)`.
3. **Skip any element on a gradient as unmeasurable.** Called **7,520** elements
   unmeasurable — 12% of all text — because the GVP shimmer is a
   `background-image` laid over the real colour.
4. **Composite translucent layers, then treat a gradient as unmeasurable.**
   Better (4,223 unmeasurable) but still missed the nav dock entirely: the
   sidebar is `linear-gradient(rgba(201,168,76,.09) 0%, transparent 42%,
   rgba(0,229,255,.06) 100%), linear-gradient(rgb(8,8,15), rgb(5,5,12))` — a
   low-alpha tint over an **opaque, near-uniform** gradient. Unmeasurable is the
   wrong answer for a surface that is flat dark in practice.

The rule that works: collect translucent layers walking up, alpha-blend them
over the first opaque surface, and where that surface is a gradient treat
**every opaque stop as a candidate and judge the text against the worst one**.
That is the only honest standard for a gradient — if text fails against any part
of what it sits on, it fails — and it removed the unmeasurable bucket entirely.
`html` carries the real ground (`rgb(12,8,6)`) behind `body`'s backdrop tint.

### Proven against the bugs it exists for

A gate that reports 0 on a clean tree but would not have caught the original
bugs is worthless, so each fix was pinned back with `gitShow` and re-measured:

```
CAUGHT  invisible auth buttons (a0073e2d~1)   3 findings   1:1, 1:1, 1.01:1
CAUGHT  nav dock #55534e     (a0073e2d~1)    15 findings   2.6:1 x15
CAUGHT  sub-floor greys      (b65a329b~1)    20 findings   2.36-2.65:1
```

Then end-to-end: dropping the pre-fix `nav.js` into the working tree makes
`verify-runtime.js` **FAIL** 13 of 13 entrypoints with the exact ratios and
element names; restoring it returns PASS, `git diff --quiet nav.js` clean.

**The first proof run reported all three MISSED**, and that was the probe, not
the gate: extracting the rule from a JS template literal into a plain file left
`[\\d.]+`, which matches backslashes rather than digits, so every colour parse
failed and the run reported a serene zero. §8.4's "verify a 0 findings result is
real" now names this shape.

### Why 3:1 blocks and 4.5:1 does not

bg.js's own comment says `--crim` was re-stepped to "the deepest crimson that
still clears 3:1". Blocking at 4.5:1 would fail the platform's own deliberate
brand decision on 180 pages. 3:1 is the floor below which text is not
legible at any size; between the two is a report, not a verdict.

One collision found on wiring: `CHECK_JS` already declared `seen` for the
duplicate-id scan, so the contrast locals are namespaced `cLow`/`cMid`/`cOk`/
`cSeen`. It failed loudly at evaluate time rather than silently, which is the
good case.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js` PASS on the
13 entrypoints and `--all` PASS on 189 pages, `context-budget.py` PASS at
~15,996 of 16,000 (six §8.4 notes compressed to make room for the baseline row).

## gaming.html: completed cards looked unstarted, and eleven headers said the same thing (2026-09-04)

`gaming.html` is the most text-dense page in the repo (11,403 characters, ratio
204 on the density scan — twice the next page). Two things were wrong with it,
and both had the data to be right already sitting on the page.

**Completed cards showed no completion.** The click handler was the only thing
that ever marked one:

```js
var r = await window.omegaCompleteTask(n, ty);
if (r.ok) { card.style.borderTopColor = 'var(--green)'; ... }
```

So a member who finished Chess Master yesterday saw it as untouched today. The
page already queries `task_completions` twice — a count, and the last 20 rows
for the activity log — so the data was fetched and then not used for the 132
cards it describes. Now one more query builds a set of completed `task_name`s
(**the same column the activity log already reads**, so no new name is
introduced — §8.1 class 2) and marks each matching card.

The mark goes through `--card-accent`, the mechanism established earlier today:
`.card::before` reads it, so the top bar turns green without a second pseudo
fighting the first. The click handler was changed to the same mechanism instead
of setting `borderTopColor` directly, so both paths agree.

Per §9: `doneQ.error` is checked explicitly. Supabase resolves to
`{data:null,error}` rather than throwing, and on an error **no card is marked**
— a card claiming completion it cannot support is exactly §8.1 class 9.

**Eleven headers repeated one string.** Every section carried
`· 12 GAMES · AXIS B MASTERY · 12×12×9×9×9 = 104,976` — 605 characters of
repetition on the page that least needed more text. The formula is now stated
once, in the topbar where it belongs, and each header carries that section's
real progress instead:

```
STRATEGY & BOARD · AXIS B MASTERY · 2 / 12 COMPLETE
```

The first attempt did this rewrite at runtime. That was wrong twice over: the
source stayed repetitive, and the cleanup was coupled to a successful query —
a failed fetch would have left the formula in place. The headers are now clean
in the markup and JS only appends the live count.

### The sheen trap, caught by measuring paint rather than text

Cleaning the markup made those headers **childless and under 48 characters** at
the moment `bg.js:1290` applies `.ofx-sheen` — which fills heading text with
`background-clip:text` + `-webkit-text-fill-color:transparent`, and that
**inherits into children**. The sheened count went from 3 to 14, and the
appended span measured:

```
webkitTextFillColor: rgba(0, 0, 0, 0)   color: rgb(155, 107, 240)   width: 174px
```

174 pixels wide, painting nothing. The probe had reported PASS the whole time
because it read `textContent`, which is present whether or not the text paints —
the same shape as measuring a colour without measuring whether it renders.
Fixed with `-webkit-text-fill-color: currentColor` on the span, which restores
both the section colour and the green completed state; verified `fill` now
equals `color`.

### Verified in a render, both states

The harness stub returns `[]` for every non-single query, which only exercises
the empty case — so a second stub variant returns three real completion rows:

```
no completions      11 headers · 0 formula repeats · 0 cards marked
three completions   11 headers · 0 formula repeats · 3 cards marked
                    Chess Master, Go / Weiqi, Sudoku Grand Master
                    ::before background rgb(63, 178, 127)  = --green
                    .c-pts "✓ RECORDED"
                    STRATEGY & BOARD header reads 2 / 12
```

The header reading **2 / 12** rather than 3 is the useful detail: Sudoku is in
the Puzzle panel, so the per-section count is genuinely per-section and not a
global total wearing a section's name.

### The gate caught this change, and then a flaw in itself

`verify-runtime.js`'s new contrast gate — added two commits earlier — failed
`gaming.html` on the first run after this change:

```
FAIL gaming.html
  x 6 text element(s) under the 3:1 contrast floor:
    1:1 SPAN.sec-prog "· 0 / 12 COMPLETE"  (x6)
```

A gate catching a bug in a change made minutes later is the whole point of
having it. But the finding was the **gate's own flaw**, not the span's:

```css
.ofx-sheen{background-image:linear-gradient(100deg,currentColor 38%,…);
  -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent}
```

`background-clip:text` means that gradient paints **inside the glyphs**, not as
a surface behind them. The surface walk was treating it as the background and
comparing the span's text colour against its own text fill — hence exactly 1:1.

Fixed in the walk: an element whose `background-clip` is `text` contributes
neither its colour nor its image as a surface. The gate proof still holds
afterwards (3, 15 and 20 findings on the pinned pre-fix trees) and the baseline
is unchanged at **0 blocking, 259 advisory, 61,475 passing across 189 pages**.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `check-inline-js.py` clean,
`verify-runtime.js` PASS on the 13 entrypoints and `--all` PASS on 189 pages.
One `--all` run failed `architecture.html` with `page.goto: Timeout 30000ms` and
passed on re-run against an identical tree — the concurrency timeout this log
already records, not a finding.

## The same gap on academy.html, found by asking where else it could be (2026-09-04)

The gaming.html fix was a bug *class*, not a one-off, so the obvious question is
where else it lives. Two pages call `omegaCompleteTask`; both also read
`task_completions` back:

```
academy.html   reads=2
gaming.html    reads=3
```

`academy.html` had the identical shape — the click handler was the only thing
that marked a card:

```js
if(r.ok){ card.style.borderTopColor='var(--green)';
          lbl.innerHTML += '<span …>&#10003; RECORDED</span>'; }
```

…while the page already fetched 30 rows for its exam log. 96 exam cards, none
of them reflecting a completion the page had in hand.

**Fixed through the page's own mechanism, not gaming's.** `.exam-card` does not
carry `.card`, so `--card-accent` means nothing to it. It has its own:

```css
.exam-card::before{…background:var(--ec)}
```

so the mark sets `--ec` to green. Same shape, page's own property — which is the
point of the `--card-accent` finding generalised: a page-local accent bar driven
by a custom property is the pattern, and the property name is per-page.

The click handler now calls the same `markDone(card)` the load path uses, so
both agree and neither double-appends. `doneQ.error` is checked; nothing is
marked on failure.

Eight headers repeated `· 12 EXAMS · AXIS A`. `AXIS A` is the actual meaning and
stays; `12 EXAMS` is redundant once the header carries `n / 12 COMPLETE`. These
headers were *already* childless and under 48 characters, so they were already
sheened — the appended span got `-webkit-text-fill-color: currentColor` from the
start rather than after being caught.

Verified in a render, both states, with a stub variant returning two real rows:

```
no completions     8 headers · 0 cards marked
two completions    8 headers · 2 cards marked (Mathematics Olympiad, Physics
                   Grand Exam) · ::before rgb(63,178,127) · STEM & SCIENCE
                   header reads 2 / 12 · span fill == color (paints)
```

One `104,976` remains on the page and should: it is the canonical LATTICE
POSITION header, which is where the formula belongs.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `check-inline-js.py` clean,
`node scripts/verify-runtime.js --all` PASS on all 189 pages — including the
contrast gate, which the previous entry's change had failed.

## The contrast gate proves itself now, not just once (2026-09-04)

The gate's correctness was demonstrated exactly once, by pinning pre-fix files
out of git history with `gitShow` and confirming it caught 3, 15 and 20
findings. That proof lived in a scratchpad. **The next person to change the
surface-resolution rule had no way to repeat it** — and that rule went through
four wrong versions in one afternoon, so it will be changed again.

`node scripts/verify-runtime.js --self-test` renders a fixture whose ratios are
computed from the WCAG formula rather than from the classifier, and asserts the
binning:

```
  ok   block  expected [t-block-1, t-block-2]  got [t-block-1, t-block-2]
  ok   mid    expected [t-mid-1]               got [t-mid-1]
  ok   ok     expected [t-pass-1 … t-pass-4]   got [t-pass-1 … t-pass-4]
CONTRAST SELF-TEST: PASS (7 known ratios binned correctly)
```

The fixture deliberately includes **the three surface shapes that each broke an
earlier version of the rule**:

| case | shape | earlier failure it reproduces |
|---|---|---|
| `t-pass-2` | `rgba(10,10,15,.68)` glass | "opaque colour or give up" measured nothing |
| `t-pass-3` | low-alpha tint over an opaque near-uniform gradient | the nav dock was called unmeasurable |
| `t-pass-4` | gold text inside a `background-clip:text` parent | the gradient was read as a surface, giving 1:1 |

`t-pass-4` is the sharpest of the three: gold clears 8.74:1 against the page
ground but would fail at ~1.9:1 against the sheen's near-white gradient, so it
lands in a different bin depending on whether the rule is right.

**Proven to be able to fail.** Setting `clipsToText = false` — breaking exactly
the rule that case exists for — moves `t-pass-4` into the blocking list and the
self-test reports FAILED with the ids named. Restoring returns PASS. A test that
cannot fail proves nothing, which is the same discipline the positive controls
in this log's earlier entries exist for.

**It runs as a precondition of every sweep**, not as a separate step someone has
to remember: if the classifier is wrong, a verdict about 189 pages is
meaningless. One extra page load per run, and both CI invocation sites
(`ci-local.sh` and `capability-evidence.yml`) get it for free.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all` PASS
on 189 pages with the self-test running first.

---

## architecture.html: the one block reporting CONNECTED was the one block nothing probed (2026-09-04)

`architecture.html` renders sixteen runtime blocks from
`__omegaArchitecture.status()`, and its own legend defines the two states it
draws:

> **BUILT** means the adapter exists. **CONNECTED** means it was additionally
> probed against something real in this browser session.

Rendered through the harness, the page reported:

```
16 blocks · 1 probed as connected in this session · v1.0.0
cdn=CONNECTED     database=BUILT           object-blob-storage=BUILT
                  observability=BUILT      security-identity=BUILT
window.__omegaSb: true     window.__omegaOS: true
```

Both halves of that are wrong, in opposite directions.

**The single CONNECTED block had never been probed.**
`omega-architecture-runtime.js:…` set it unconditionally:

```js
set('cdn', 'CONNECTED', ['same-origin static deployment probe']);
```

`cdnProbe()` — the function that would make that evidence true — is called from
nowhere:

```
$ grep -rn "cdnProbe" --include=*.js --include=*.html .
./omega-architecture-runtime.js:    cdnProbe: function () { … }
```

One definition, zero call sites. This is §8.1 class 9 (fabricated data rendered
as fact) applied to the platform's own status page: a green badge asserting a
probe result where no probe ran.

**The four blocks that could honestly have been CONNECTED never re-checked.**
The sixteen `set()` calls run synchronously at parse time, and the module is a
plain `<script>` in the body while `bg.js` is `defer` — so every one of them
evaluates `window.__omegaSb` and `window.__omegaOS` strictly *before* bg.js has
had the chance to publish either. The render above shows both globals live at
+4s with all four blocks still reading BUILT. The page had `subscribe(render)`
wired and correct; nothing ever emitted, so it never fired.

### The fix

`cdn` starts at `BUILT` with evidence that claims only what is true
(`same-origin static deployment`), and a probe pass runs at `DOMContentLoaded`,
after the deferred modules. Each probe performs a **real operation in this
browser** and records what it returned, or leaves its block at BUILT with the
reason:

| block | operation | recorded evidence |
|---|---|---|
| `cdn` | `cdnProbe()` | `GET /robots.txt 200` |
| `caching` | `caches.open('omega-runtime-v1')` | `omega-runtime-v1 opened` |
| `message-queues` | `indexedDB.open('omega-runtime',1)` | `outbox store present (1)` |
| `database` | client resolved, `.from` is callable | `PostgREST client live` |
| `object-blob-storage` | `storage.from` is callable | `storage client live` |
| `security-identity` | `auth.getSession()` **called** | `session present` / `no session -- gate closed` |
| `observability` | `window.__omegaOS` published | `window.__omegaOS published` |

The client is read through `window.OmegaSB.get()` with a bounded poll, not from
an assumed global — §8.1 class 4(b), the shape that left `window.OmegaSupabase`
readable by eleven files and assigned by one.

Measured after, same harness:

```
16 blocks · 7 probed as connected in this session · v1.0.0
cdn=CONNECTED [same-origin static asset fetched in this session | GET /robots.txt 200]
security-identity=CONNECTED [auth.getSession() answered in this session | session present]
message-queues=CONNECTED [IndexedDB outbox opened in this session | outbox store present (1)]
```

**Negative control — the probe can fail.** Routing `**/robots.txt` to a 503 in
the same harness:

```
16 blocks · 6 probed as connected in this session
cdn = BUILT [same-origin static deployment | not probed: GET /robots.txt 503]
badge text "BUILT", ::before background rgb(201,168,76)   // gold, not green
```

The count drops, the badge reverts, the accent bar goes back to gold, and the
evidence names the status code it actually got. Without this control the AFTER
run proves only that seven `set()` calls exist.

### The visual half

The blocks now carry the shared `.card` surface. `.arc-b` had a private 2px
**left** accent bar:

```css
.arc-b::before{content:'';position:absolute;left:0;top:0;bottom:0;width:2px;
               background:rgba(201,168,76,.3)}
.arc-b.conn::before{background:var(--green,#3fb27f)}
```

which is the documented collision — a page-local `::before` that sets
`background`, against `.card::before`'s 2px **top** bar, cascading per property
with bg.js (sheet 1) beating the page block (sheet 0). Per §4.1 the collision is
solvable rather than disqualifying: `.card::before` reads `--card-accent`, so
the private pseudo is deleted and the meaning it carried moves to the custom
property:

```css
.arc-b{--card-accent:var(--gold)}
.arc-b.conn{--card-accent:var(--green)}
```

Measured on the rendered page: 16 of 16 blocks resolve `.arc-b.card`, the bar is
`2px` tall at `top:0` spanning the block width, `rgb(63,178,127)` on connected
and `rgb(201,168,76)` on built, on the shared glass ground
(`rgba(10,10,15,.68)`, `--omega-glass` from `omega-visual-evolution.css`) with
the platform's rim shadow — none of which the private surface had. Padding,
radius, border and background declarations were **removed** rather than kept:
bg.js beats sheet 0 on every one of them, so leaving them in would have been
dead code that looks correct in the diff.

The grid is also built once and patched in place now. Seven probes resolve over
several seconds and each emits, so the previous full `innerHTML` rebuild would
have torn down and re-created sixteen elements per event — after the reveal pass
had already run over them.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all` PASS,
0 page errors and no horizontal overflow on `architecture.html`.

---

## control-plane.html: 171 status badges that were never styled, because three attributes were delimited with curly quotes (2026-09-04)

The inventory tab builds a row per registered page and tags each with a
COMPLETE/INCOMPLETE badge, green or crimson. Rendered through the harness, the
badge class never existed:

```
rows: 171
document.querySelectorAll('#page-list .page-badge').length  ->  0
badge span className: "”page-badge"
badge span attributes: [ 'class=”page-badge', 'ok”=' ]
badge computed color: rgb(240, 237, 230)      // plain --ink, not green
```

Three attributes in the row template were delimited with **U+201D RIGHT DOUBLE
QUOTATION MARK** rather than ASCII `"`:

```js
'<div class=page-row data-key='+key+' data-purpose=”'+page.purpose+'” data-character=”'+page.character+'”>'
… '<span class=”page-badge '+status+'”>'+statusText+'</span>'
```

To the HTML parser those are unquoted attribute values, so each one terminates
at the first space. `class` became the single token `”page-badge`, `ok”` became
a stray boolean attribute, and every `.page-badge`, `.page-badge.ok` and
`.page-badge.warning` rule in the page's own stylesheet matched nothing. The
same cut hit the data attributes:

```
first row dataset  ->  { key: '404', purpose: '”Not', character: '”system”' }
first row attributes -> class, data-key, data-purpose, found”, data-character
```

`data-purpose` held `”Not` and the rest of the value (`found”`) became an
attribute *name* — on all 171 rows. `filterPages()` reads
`row.dataset.purpose`, so the search box was matching one mangled word.

A second, independent bug in the same function: the query is lowercased,
the dataset values were not, so a search only ever matched purposes and
characters that happened to be lowercase already.

### Measured before and after

`git show HEAD:control-plane.html` pinned as the BEFORE and served with the
right content type (never `git stash` — the change is in the working tree):

| | before | after |
|---|---|---|
| rows carrying `.page-badge` | **0** of 171 | **171** of 171 |
| stray attributes parsed off the rows | 171 | 0 |
| `dataset.purpose` on row 1 | `”Not` | `Not found` |
| search `"sovereign"` | 4 rows | **11** rows |
| search `"not found"` | 0 rows | **1** row |
| search `"SECURITY"` | 1 | 1 |

The four `"sovereign"` hits before were key matches only; the seven additional
rows live in purpose/character text the truncated dataset could not reach. The
badges now resolve `rgb(63,178,127)` on `.ok`, and all 171 read COMPLETE —
independently corroborated by the page's own audit tab, which computes
`MISSING EMBLEMS (0) / MISSING RELATED (0)` from the same registry.

**This is not a repo-wide class.** A scan for a curly quote used as an attribute
delimiter (`=` immediately followed by U+201C/U+201D) returns this file and
nothing else; the other seven hits in `.html`/`.js` are `=−1` and `=√(A³…` in
formula text, not markup.

### The dead token block, measured rather than assumed

The page opened with a `:root` redeclaring the canonical palette and type
tokens. CLAUDE.md §4 says 62 pages do this and every one is dead code; measured
on *this* page's render, the values that actually resolve are the platform's:

```
--crim = #C4453C    (page wrote #8b0000 -- the pre-fix crimson, 1.99:1)
--muted = #8A8880   (page wrote rgba(138,134,118,.5))
--M = "Courier Prime",monospace   (page wrote monospace)
```

Removed, keeping only `--dim` and `--pad`, which this page genuinely owns.
Re-measured after: identical values. One hardcoded leftover of the same old
crimson (`.page-badge.warning{border-color:rgba(139,0,0,.4)}`) was re-stepped to
match the token it sits beside.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js` PASS,
0 page errors and no horizontal overflow on `control-plane.html`.

---

## Three pages rendered completely blank on arrival: unquoted attribute values (2026-09-04)

An unquoted HTML attribute value ends at the first space. Every word after that
space becomes a valueless attribute of its own — so the intended value is
truncated and the remainder is silently discarded. That is the same root cause
as the curly-quote entry above, and a render-based scan found it on eight pages.

### The scanner, and why the first result was worthless

The runtime signature is an element carrying an attribute with an **empty
value** that is not a legitimate valueless attribute (`disabled`, `defer`,
`selected`, `data-*`, `aria-*`, …). The first sweep reported a serene
**0 findings across 189 pages** — because the static server had died and every
page returned `ERR_CONNECTION_REFUSED`. §8.4's rule, hit exactly as written.
With the server up:

```
pages scanned: 189   load errors: 0
pages affected: 8
truncated attribute sites: 294   fragments lost: 685
by attribute: {"style":271,"placeholder":10,"class":6,"content":5,"onclick":1}
```

### The severe one: the default tab pane loses `active`

```html
<div class=tab-pane active id=tab-inventory>
```

`class` ends at the space, so it is `"tab-pane"` and `active` becomes a stray
attribute. `.tab-pane{display:none}` then hides everything, and only
`.tab-pane.active` would have lifted it. Measured on three pages:

```
control-plane.html {"panes":5,"panesWithActiveClass":0,"panesWithStrayActiveAttr":1,
                    "visiblePanes":0,"firstPaneDisplay":"none","firstPaneHeight":0}
creator.html       {"panes":3, … "visiblePanes":0,"firstPaneDisplay":"none"}
project-studio.html{"panes":3, … "visiblePanes":0,"firstPaneDisplay":"none"}
```

**All three pages rendered nothing below the tab bar until a tab was clicked.**
The matching `<button class=tab-btn active>` lost its highlight the same way, so
nothing even indicated which tab was supposed to be open.

After:

```
control-plane.html  visiblePanes 1/5   visible height 9855px   btnActive 1
creator.html        visiblePanes 1/3   visible height  401px   btnActive 1
project-studio.html visiblePanes 1/3   visible height  470px   btnActive 1
```

Nine thousand pixels of content on `control-plane.html` that no visitor could
see. Note that an earlier session measured that page's inventory rows with
`querySelectorAll` and reported 171 rows present — which was true and
irrelevant: the rows were in the DOM inside a `display:none` panel. **Presence
in the DOM is not visibility**; check `getComputedStyle`/`offsetParent`.

### The rest

| site | what was lost |
|---|---|
| `<meta name=description content=Operational brain of…>` | everything after the first word, on 5 pages |
| `<h1 style=…margin:0 0 16px;letter-spacing:2px>` | `margin-bottom` and `letter-spacing`, on 5 pages |
| `<input placeholder=Search pages by name, purpose…>` | placeholder became `"Search"` |
| `omega-control-plane.js:109,110` `style=…padding:4px 0;border-bottom:…` | every realm/motion row's separator |
| `omega-ad-network.js`, `omega-creator.js`, `omega-project-studio.js`, `omega-layered-ui.js`, `omega-uniqueness.js` | 29 inline styles cut mid-declaration |
| `sovereign-ai.html:158` | see below |
| `architect.html:269` | prose reading `scans <script src> basenames` was parsed as a real `<script src>` element and vanished from the cell |

**`sovereign-ai.html:158` — an escape that covered the wrong character.**

```js
onclick="activateAgent('+JSON.stringify(ag).replace(/</g,'&lt;')+',…
```

`JSON.stringify` emits double quotes, and the attribute is delimited with double
quotes, so the handler was cut at `activateAgent({` — inert. `<` was escaped;
`"` was not. Adding `.replace(/"/g,'&quot;')` gives a 329-character handler that
ends `…'#E25800','♈︎');setTab('chat')` and passes `new Function()`.

**`services.html:151` — two bugs on one line.**

```js
+'<div class="svc-badge" style="color:'+COL[s.s]+';border-color:'
 +COL[s.s].replace('var(--','rgba(').replace(')',',0.3)')+'>'+s.s.toUpperCase()+'</div>'
```

The style attribute never closed, so it swallowed `>LIVE</div>` and ran on to the
**next** card's `style="--sc:` — the badge text never rendered and the following
card lost its `class="svc-card card"`. And `'var(--green)'` through those two
`replace` calls yields `rgba(green,0.3)`, which is not a colour: a custom
property cannot be turned into an `rgba()` by string surgery. Replaced with
`color-mix(in srgb, <col> 40%, transparent)`, which does it for real — verified
in the render, not assumed:

```
services.html {"cardsWithBothClasses":21,"badges":21,"badgeText":["LIVE","LIVE","LIVE"],
               "badgeColor":"rgb(63, 178, 127)",
               "badgeBorder":"color(srgb 0.247059 0.698039 0.498039 / 0.4)"}
```

### One transform mistake, caught by reading the diff

The bulk quoting pass was mechanical, and on two sites the value spanned a JS
concatenation:

```js
placeholder=Enter '+f+'…      →   placeholder="Enter "'+f+'…     // wrong
                              →   placeholder="Enter '+f+'…"     // right
```

The closing quote has to land where the *value* ends, not where the string
literal does. Re-reading the generated diff is what caught it.

### Result, with a positive control

```
pages scanned: 189   load errors: 0
pages affected: 0    truncated attribute sites: 0   fragments lost: 0
```

A zero here already lied once, so it is paired with a control — the committed
pre-fix `control-plane.html` pinned via `git show HEAD:`:

```
BEFORE (HEAD, pre-fix): {"strayAttrs":296,"panes":5,"visiblePanes":0}
AFTER  (working tree):  {"strayAttrs":0,  "panes":5,"visiblePanes":1}
```

A source-side sweep for any remaining unquoted `style`/`placeholder`/`class`
value containing a space also returns 0 across every `.html` and `.js`.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, every touched page `ok`.

---

## The member-state mirror's coverage, verified rather than assumed (2026-09-04)

`CLAUDE.md` §8.2 records `omega-member-state.js` as the fix for 43 pages that
store member data in `localStorage` with no way to get it out. What it did not
establish is whether the mirror actually *reaches* those pages: the module
mirrors any key beginning with `omega` (`mirrored()` at
`omega-member-state.js:150`), so a page using any other key name is silently
outside it, and that would be invisible.

**Source side.** A literal-key scan finds 0 pages using a non-`omega`
`localStorage` key. That is not enough on its own — 89 call sites across 56
files pass the key as a *variable* (`SK`, `HABITS_KEY`, `DIST_KEY`, …).
Resolving each identifier against its assignment in the same file:

```
KEYS THAT ESCAPE THE `omega` MIRROR PREFIX
  0 keys across 0 pages

STILL UNRESOLVED (computed/templated keys): 8 sites across 8 files
    body.html  command.html  omega-appearance.js  omega-local-backup.js
    omega-member-state.js  search.html  sleep.html  stoic.html
```

All eight are loop variables (`k`, iterating `localStorage.key(i)`) or the
persistence modules themselves, except `search.html:199`, which is
`function recentKey(){return 'omega_recent_searches';}` — inside the prefix.

**Runtime side**, on `kings.html` (a LOCAL_ONLY page holding
`omega_study_notes` and `omega_model_king`):

```
{"isMemberKey_study": true, "isMemberKey_model": true,
 "isMemberKey_lang": false,          // in SKIP, correctly excluded
 "mirroredBefore": 2, "mirroredAfter": 6}
```

**A measurement that measured nothing, first.** The initial probe called
`M.collect()` and reported `collectsStudyNotes: false`. `collect` is not in the
module's public API — the exports are `prefix, skip, isMemberKey, status,
syncNow, restore, list` — so `M.collect ? M.collect() : []` returned `[]`
unconditionally and the "finding" was an artefact of the probe. Reading the
exported surface, rather than guessing a method name, is what produced the
numbers above. **Check that a probe's accessor exists before believing what it
reports** — the same shape as §8.1 class 4(b), applied to a test rather than to
shipped code.

No code change: the mirror already covers the estate. Recorded so the next
session does not re-derive it, and so §8.2's entry is not read as an untested
claim.

### Also this session: a scan abandoned rather than reported

A third scan was attempted — page-local CSS classes defined in a page's own
`<style>` that match zero elements in the render, the generalisation of the
`.page-badge` and `.svc-card` finds. It reported 0 across 189 pages. Its
positive control did not fire, and a synthetic fixture (a `<style>` defining
`.never-lands` against markup carrying `never-lands-typo`) did not fire either:
the "was it meant to be applied?" filter required the class to appear inside a
`class=` literal, which is precisely what a class that never lands does not do.
The filter suppressed exactly the cases it was written to find. Removed and
abandoned rather than published as a zero — dead CSS is mostly noise, so the
signal-to-noise did not justify rebuilding it. Noted so it is not re-attempted
in the same shape.

---

## kings.html adopts the shared card surface (2026-09-04)

The nine ruler cards were hand-rolled inline, with no shared class at all:

```js
'<div style="border:1px solid var(--line);border-top:2px solid '+k.color+
 ';background:rgba(10,10,15,.5);padding:14px;border-radius:2px">'
```

Measured before: 9 cards, **0** carrying `.card`, `box-shadow: none`.

The per-king `border-top:2px solid <colour>` on the element is precisely the
collision CLAUDE.md §4.1 names as a reason a class was *not* swept — and the
same section gives its lossless translation: `.card::before` is already a 2px
top bar reading `--card-accent`. So the colour moves to the custom property and
the element takes `.card`. The realm badge becomes a `.chip`, whose
`border:1px solid` resolves to `currentColor`, so one `color` declaration
carries both text and border; the bio button becomes a shared ghost `.btn`; the
ruler's name takes `.card-title`, whose inline per-king `color` still wins
(inline beats a class) while gaining the platform's item diamond.

Measured after:

```
cards: 9
accentBar: {h:"2px", top:"0px", bg:"rgb(201, 168, 76)"}   // Alexander, gold
secondCardAccent: "rgb(226, 200, 109)"                    // Marcus Aurelius, solar
surface: {bg:"rgba(10, 10, 15, 0.68)", pad:"20px", radius:"2px", shadow:"present"}
chip:    {radius:"20px", border:"rgb(201, 168, 76)", color:"rgb(201, 168, 76)"}
btnBg:   "rgba(0, 0, 0, 0)"        // ghost, not the browser's grey face
titleMark: "7px matrix(0.707107, 0.707…"   // the .card-title diamond, at 45deg
overflowX: false   errors: []
```

The accent bar reproduces each king's colour exactly, so nothing the page meant
was lost; what it gains is the glass ground, the rim shadow it did not have,
hover elevation, the hover glow edge and the cursor-reactive light — all from
one class, no new CSS.

**One thing checked and found not to be a bug.** `KINGS_DATA` stores virtues
containing `&amp;` (`'Vision &amp; Conquest'`), and the template calls
`.toUpperCase()` on them before `innerHTML`, which yields `&AMP;`. That looks
like it would render literally. It does not — `&AMP;` is in HTML5's named
character reference table — and the render confirms `VIRTUE: VISION &
CONQUEST`. Measured rather than "fixed" on the strength of reading the code.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, `ok kings.html`.

---

## 27 hand-rolled card surfaces swept to the shared class — and 66 deliberately not (2026-09-04)

`kings.html` was not unique. A scan for bg.js's own `.card` declarations written
out inline instead of using the class — a `1px solid var(--line)` border plus
the `rgba(10,10,15,…)` glass in one style attribute — finds **87 sites across 22
files**.

A blanket sweep is exactly what §4.1 warns against, so the sites were classified
by what the style actually says, not by the pattern that found them:

| type | shape | decision |
|---|---|---|
| A | `border` + `background:.5` + `padding:14px` + `radius:2px`, nothing else | **sweep** — literally `.card` |
| B | type A plus `border-top:2px solid <colour>` | **sweep**, colour → `--card-accent` |
| C | `border-left:3px solid …` | **left alone** — `.card::before` is a *top* bar; translating it changes the design (§4.1's `cosmos.html` precedent) |
| D | `padding:10px 14px` / `12px`, alpha `.4`/`.45`, extra font or `display:none` declarations | **left alone** — denser list rows and collapsed forms, not cards; `.card`'s `clamp(14px,2.5vw,20px)` padding would change their density |

That leaves **27 sites in 5 files** that are exactly `.card`, 23 of them with a
top accent that translates losslessly. Both documented failure modes were
checked per site first: none of the 27 elements carries **any** class attribute,
so there is no page-local `::before` to collide with and no same-element
modifier setting a border.

Measured, BEFORE pinned with `git show HEAD:`:

| page | `.card` count | distinct accent colours |
|---|---|---|
| `bloodline.html` | 6 → **15** | 1 → **6** |
| `pantheons.html` | 6 → **12** | 1 → **6** |
| `heritage.html` | 6 → **10** | 1 → **4** |
| `governance.html` | 6 → **10** | 1 → **4** |
| `vault.html` | 35 → **38** | 1 → 1 (its 3 sites carried no accent — correct) |

The accent colours are preserved exactly — cyan `rgb(0,229,255)`, purple
`rgb(155,107,240)`, green `rgb(63,178,127)`, orange `rgb(255,152,0)`, red
`rgb(255,68,68)`, ember `rgb(232,106,58)` — now drawn as the card's own 2px top
bar rather than a border on the element. Every card resolves a box-shadow, no
page gained horizontal overflow, and all five report 0 page errors before and
after.

The 66 sites left alone are recorded here rather than swept quietly: they are a
real backlog, and each needs a per-site decision about density or a left-bar
motif, not a regex.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, all five files `ok`.

---

## `.card-edge`: the accent motif `.card` could not express (2026-09-04)

The `.card` sweep has always had a hard exclusion: `.card::before` is a 2px bar
across the **top**, so any element drawing a coloured bar down its **left** edge
could not adopt the class without losing the motif. That is not a niche case —
scanning for `border-left:Npx solid <colour>` finds **124 sites across 68
files** (80 of them 3px, 33 at 2px), every one hand-rolled.

`bg.js` gains the variant, immediately after `.card::before` in the same block:

```css
.card.card-edge::before{top:0;bottom:0;left:0;right:auto;
  width:var(--card-edge-w,3px);height:auto}
```

It reuses `--card-accent` for the colour, takes `--card-edge-w` for the width
(3px matches 80 of the 124 sites), and is both higher-specificity and later in
the same sheet than the rule it overrides, so it wins either way. Verified on a
fixture through the real `bg.js`, not reasoned about:

```
topAccent      {w:"566.703px", h:"2px",  top:"0px", left:"0px", bg:"rgb(0, 229, 255)"}   // control
leftAccent     {w:"3px",       h:"58px", top:"0px", left:"0px", bg:"rgb(63, 178, 127)"}
leftAccent4px  {w:"4px",       h:"58px", top:"0px", left:"0px", bg:"rgb(255, 107, 53)"}  // --card-edge-w
```

The card is 60px tall and the bar 58px — the 1px borders top and bottom, as
intended.

### The adopter, and the one that was correctly refused

`intelligence.html`'s four `.swot-box` panels. `.swot-box` has no `::before` or
`::after` rule at all (`intelligence.html:50` is a plain declaration block), so
neither documented failure mode applies. Measured:

```
BEFORE {"boxes":4,"withCard":0,"bars":["autoxauto rgba(0, 0, 0, 0)", …],
        "surface":"rgb(13, 13, 13)",       "leftBorder":"3px rgb(76, 175, 80)"}
AFTER  {"boxes":4,"withCard":4,
        "bars":["3pxxauto rgb(76, 175, 80)","3pxxauto rgb(255, 68, 68)",
                "3pxxauto rgb(255, 215, 0)","3pxxauto rgb(255, 152, 0)"],
        "surface":"rgba(10, 10, 15, 0.68)","leftBorder":"1px rgba(201, 168, 76, 0.22)",
        "errors":0}
```

All four SWOT colours preserved exactly, and the page drops its off-palette
`#0d0d0d` ground and `#1a1a1a` border for the platform's.

**`chronicle.html` (17 sites, the largest single holding) was refused.**
`.event-card::before` already exists at `chronicle.html:54` and sets
`background:var(--line)` — it draws the 14px connector line to the timeline
spine. Two rules on one pseudo-element cascade per *property*, and only one
`background` can win, so adopting `.card` would delete the timeline connectors.
This is §4.1's check doing its job.

**A candidate scanner that was written and then not trusted.** To find the other
clean sites, a scan classified each left-bar element by whether any of its
classes has a `::before`/`::after` rule setting `background`. It reported
`chronicle.html`'s 16 `.event-card` sites as **clean** — contradicting the
manual reading above, which is correct. The scanner has a false negative in its
pseudo-element regex. Its "clean" list was therefore discarded rather than
swept, and only the sites checked by hand were changed. A scanner whose output
is known to disagree with a verified fact is not a list to act on; the number of
remaining candidates (6) did not justify repairing it.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, `ok intelligence.html`.

---

## Correction: `.card-edge`'s realistic reach is not 124 sites (2026-09-04)

The entry above justified `.card-edge` with "124 sites across 68 files". That
count is real but it measures the **motif**, not the adoption candidates, and
the commit message and PR body let the two run together. Corrected here.

### The classifier, third attempt, with controls that gate its output

Two earlier attempts produced numbers that were simply wrong:

1. **Source regex over `<style>` text** — reported 22 clean, including
   `chronicle.html`'s 16 `.event-card` sites, which are provably blocked. It
   read `.event` out of `.event:nth-child(odd) .event-card::before`, matched
   `.25` inside an `rgba()` as a class name, and let `[^{,]*` swallow across
   lines so the one rule that mattered was absorbed into a neighbour.
2. **Computed style, over-strict** — reported 2 clean of 103. The
   `otherBorder` test was `/border(?!-left)[a-z-]*\s*:/`, which matches
   `border-radius` (not a border colour) and a generic
   `border:1px solid var(--line)` (exactly what `.card` sets anyway).

The third asks the rendered element both questions — `getComputedStyle(el,
'::before').content !== 'none'`, and a per-instance *coloured* border on a
non-left side — and **refuses to print any count until two controls pass**:

```
CONTROL swot-box (must be CLEAN):     4 sites, blocked=0   -> PASS
CONTROL event-card (must be BLOCKED): 17 sites, blocked=17 -> PASS

load errors: 0
CLEAN: 86   BLOCKED: 17
```

Both controls are cases established by hand earlier in this session, and the
pre-`.card` `intelligence.html` is pinned with `git show 1482129c:` so the
first control is not measuring the fix.

### What the 86 actually are — and why almost none should become a card

The classifier answers *"would adopting `.card` collide"*. It does not answer
*"should this element be a card"*, and that second question disqualifies nearly
all of them:

| population | sites | why not |
|---|---|---|
| `omega-notify.js:48` notification rows, injected per page | 36 | a compact toast row, not a card |
| `services.html` status board | 21 | `padding:8px 12px` |
| `levels.html`, `phases.html` | 24 | `padding:6px 10px` — `.card`'s `clamp(14px,2.5vw,20px)` would roughly triple their vertical rhythm |
| `notifications.html`, `sovereign-ai.html`, `media.html` | 5 | one-offs, individually judgeable |

And the one genuinely card-shaped population — `chronicle.html`'s 17
`.event-card` timeline entries — is the blocked one.

So `.card-edge` is still correct and still worth having: it removes a real
structural gap in the design system, and the four `.swot-box` panels are a
genuine adopter. But its reach today is those four plus whatever card-shaped
left-bar elements are written next — not 124. Claiming otherwise would have
been a number in prose drifting away from what it counts, which §8.4 warns
about; it is corrected before anyone relies on it.

No code change. The remaining 86 need a per-element density judgement, which is
a design decision, not a sweep.

---

## habits.html had reinvented three platform primitives (2026-09-04)

A density pass over the estate — visible characters per platform visual element
— put `habits.html` at the top. That metric needs stating honestly: it counts
`.card`/`.kpi`/`.chip`/`<canvas>`/`<svg>`/emblems, so a score of 2 on a 32 KB
page does **not** mean "no visuals". It means the page is visually rich in a
vocabulary of its own, outside the design system. Which it was:

| page-local | count | platform equivalent |
|---|---|---|
| `.hero-stat` + `.sv` + `.sk` | 12 | `.kpi` |
| `.insight-item` | 9 | `.card` |
| `.section-hd` | 5 | `.sechead` |

None of the three has a `::before` or `::after`, so neither documented collision
applies. Measured, BEFORE pinned with `git show HEAD:`:

```
BEFORE {"heroStatKpi":0,"insightCard":0,"sectionSechead":0,
        "hsBorderTop":"1px rgba(201, 168, 76, 0.12)","hsBg":"rgba(0, 0, 0, 0)",
        "iiBg":"rgba(0, 0, 0, 0)","iiShadow":"none",
        "skColour":"rgba(138, 134, 118, 0.5)","shColour":"rgba(201, 168, 76, 0.5)"}
AFTER  {"heroStatKpi":12,"insightCard":9,"sectionSechead":5,
        "hsBorderTop":"2px rgba(201, 168, 76, 0.22)","hsBg":"rgba(10, 10, 15, 0.68)",
        "iiBg":"rgba(10, 10, 15, 0.68)","iiShadow":"present",
        "skColour":"rgb(138, 136, 128)","shColour":"rgb(0, 229, 255)","errors":0}
```

The stat boxes and insight panels had **no background at all** before — they
were outlines on the page ground. They now sit on the platform glass with the
KPI accent bar and the card's rim shadow. Fourteen hand-mixed
`rgba(138,134,118,.N)` greys became `var(--muted)`, the same sweep the rest of
the estate had; this file was not among the 16 it covered.

**The section-heading colour change was checked against the norm, not assumed.**
Adopting `.sechead` moves it from `rgba(201,168,76,.5)` to `rgb(0,229,255)`,
which is a visible change. Rendering three other pages confirms that *is* the
platform value, so the page now matches rather than becoming an outlier:

```
habits.html    {"colour":"rgb(0, 229, 255)"}
dashboard.html {"colour":"rgb(0, 229, 255)"}
vault.html     {"colour":"rgb(0, 229, 255)"}
kings.html     {"colour":"rgb(0, 229, 255)"}
```

**A contrast claim that was NOT made.** An ad-hoc probe computed those greys at
2.12–2.85:1 and it was tempting to call this an accessibility fix. That probe
read the body ground as `rgba(0,0,0,0)` — transparent, since `omega-backdrop.js`
paints elsewhere — so it composited against an *assumed* black. The repo's own
contrast gate is validated against seven known ratios and blocks under 3:1, and
it passes this page; its advisory band is unchanged at 259, matching §8.3's
baseline. A throwaway calculation does not get to overrule the validated tool,
so this is recorded as a consistency change only.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, `ok habits.html`.

---

## The same three primitives, reinvented on three more pages (2026-09-04)

`habits.html` was not one page's habit. `targets.html`, `nutrition.html` and
`rituals.html` are built from the same template and reinvent the same
primitives under different names:

| page | page-local | count | platform equivalent |
|---|---|---|---|
| `targets.html` | `.okr-stat` + `.sv`/`.sk` | 12 | `.kpi` |
| `nutrition.html` | `.ds-box` + `.dv`/`.dl` | 13 | `.kpi` |
| `rituals.html` | `.streak-box` + `.sv`/`.sk` | 12 | `.kpi` |
| all three | `.section-hd` | 12 | `.sechead` |

The three definitions are near-identical and all descend from the same
ancestor:

```css
.okr-stat   {border:1px solid rgba(201,168,76,.1);border-radius:2px;padding:14px;text-align:center}
.ds-box     {border:1px solid rgba(201,168,76,.1);border-radius:2px;padding:12px;text-align:center}
.streak-box {border:1px solid rgba(201,168,76,.1);border-radius:2px;padding:14px;text-align:center}
```

None of them, and no `.section-hd`, has a `::before` or `::after`, so neither
documented collision applies. Measured with BEFORE pinned via `git show HEAD:`:

```
targets.html    BEFORE {"boxes":12,"withKpi":0, "bg":"rgba(0, 0, 0, 0)","borderTop":"1px rgba(201, 168, 76, 0.1)","sechead":0}
                AFTER  {"boxes":12,"withKpi":12,"bg":"rgba(10, 10, 15, 0.68)","borderTop":"2px rgba(201, 168, 76, 0.22)","sechead":3,"errors":0}
nutrition.html  BEFORE {"boxes":13,"withKpi":0, …}   AFTER {"boxes":13,"withKpi":13, … "sechead":6,"errors":0}
rituals.html    BEFORE {"boxes":12,"withKpi":0, …}   AFTER {"boxes":12,"withKpi":12, … "sechead":3,"errors":0}
```

37 stat boxes across the three had **no background at all** — outlines on the
page ground, exactly as on `habits.html` — and now carry the platform glass and
the 2px KPI accent. 62 hand-mixed `rgba(138,134,118,.N)` greys became
`var(--muted)` (23 + 22 + 17).

The section headings move from `rgba(201,168,76,.5)` to `rgb(0,229,255)`, the
platform value confirmed against four other pages in the previous entry.

**One count that does not tie out, stated rather than smoothed over.**
`targets.html` had 4 `class="section-hd"` substitutions in source but renders 3
`.section-hd.sechead`. The fourth is not in the DOM at load — most likely inside
a template string that has not been rendered — so the substitution is correct
and the render count is simply lower. It is recorded because a 4-vs-3 mismatch
that goes unexplained is how a wrong number gets into a document.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, all three `ok`.

---

## The last of the hand-rolled KPI family, found by shape rather than by name (2026-09-04)

Four pages had already been converted by recognising the class *names*
(`.hero-stat`, `.okr-stat`, `.ds-box`, `.streak-box`). Names run out, so the
remainder were found by matching the **shape** — a centred, hairline-bordered
box, which is `bg.js`'s `.kpi` written out longhand:

```python
SIG = r'\.([-\w]+)\s*\{([^}]*border:1px solid rgba\(201,168,76,\.\d+\)[^}]*text-align:center[^}]*)\}'
```

**That matcher over-reported, and its output was filtered by hand rather than
applied.** It returned 70 sites across 18 pages, but a centred box with a gold
hairline is also a button (`.np-btn`, `.mood-btn`, `.btn-logout`), a text input
(`.set-input`), a canvas wrapper (`.canvas-wrap`), a page hero (`.codex-hero`,
`.oracle-hero`, `.affirmation-stage`) and, 26 times on `architect.html`, a
diagram node. None of those is a KPI. Reading the 18 candidates left three:

| page | class | sites | definition |
|---|---|---|---|
| `meditate.html` | `.session-stat` | 12 | `border:1px solid rgba(201,168,76,.1);border-radius:2px;padding:14px;text-align:center` |
| `mentors.html` | `.stat` | 4 | `background:rgba(10,10,15,.55);border:1px solid rgba(201,168,76,.15);padding:14px;text-align:center` |
| `vocabulary.html` | `.stat` | 4 | identical to `mentors.html` |

`meditate.html`'s definition is character-for-character the family ancestor.
`mentors`/`vocabulary` already carried `rgba(10,10,15,.55)` — bg.js's own `.kpi`
background — so they were the closest of all to the class they were avoiding.
`.stat` is a generic name, so it was checked for other selectors in those files
first; there are none. No `::before`/`::after` on any of the three.

Measured, BEFORE pinned with `git show HEAD:`:

```
meditate.html    BEFORE {"boxes":12,"withKpi":0,"bg":"rgba(0, 0, 0, 0)",       "borderTop":"1px rgba(201, 168, 76, 0.1)"}
                 AFTER  {"boxes":12,"withKpi":12,"bg":"rgba(10, 10, 15, 0.68)","borderTop":"2px rgba(201, 168, 76, 0.22)","errors":0}
mentors.html     BEFORE {"boxes":4,"withKpi":0,"bg":"rgba(10, 10, 15, 0.55)",  "borderTop":"1px rgba(201, 168, 76, 0.15)"}
                 AFTER  {"boxes":4,"withKpi":4,"bg":"rgba(10, 10, 15, 0.68)",  "borderTop":"2px rgba(201, 168, 76, 0.22)","errors":0}
vocabulary.html  BEFORE {"boxes":4,"withKpi":0, …}   AFTER {"boxes":4,"withKpi":4, … "errors":0}
```

Plus 3 `.section-hd` → `.sechead` and 20 greys → `var(--muted)` on
`meditate.html`.

**`stoic.html` needed nothing** — its 8 `.virtue-card` elements already carry
`class="virtue-card card"`. Checked before assuming, because the density metric
listed it as a candidate.

Running total for this family across the session: **7 pages, 69 stat boxes**
(12 + 12 + 13 + 12 + 12 + 4 + 4) moved from a private hairline box to the shared
`.kpi`, and 82 hand-mixed greys to `var(--muted)`.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, all three `ok`.

---

## Re-verified: 0 dead inline handlers, after three wrong scanners (2026-09-04)

`CLAUDE.md` §8.1 class 4(a) records inline `onclick=` handlers calling functions
that are not on `window` as "swept to 0". This session edited markup on about
fifteen pages, so the claim was re-checked rather than left on trust.

Getting a trustworthy zero took three attempts, and the first two produced
confident nonsense:

1. **First identifier only** — `/^\s*([A-Za-z_$][\w$]*)\s*\(/` reported **162
   dead handlers across 14 pages**. Every one was the keyword `if`: the regex
   reads `if(event.key==='Enter')…` as a call to a function named `if`.
2. **Keywords excluded, all identifiers** — reported **7**, one on each finance
   page, all named `item`. The handler is
   `alert(ok?('Restored '+n+' item(s). Reloading...'):…)` — `item(` inside a
   *string literal*. `OmegaLocalBackup.importKeys` is real
   (`omega-local-backup.js:111`).
3. **String literals stripped first**, and the scan **refuses to report until a
   control fires** — a button carrying
   `onclick="thisFunctionDoesNotExist_control()"` is injected into a live page
   and must be caught:

```
CONTROL (injected undefined handler must be caught): PASS

pages: 189  load errors: 0
dead inline handlers: 0
```

The zero is real: 189 pages loaded, no load errors, and the scanner demonstrably
catches a planted case. §8.1 class 4(a) holds.

**Why this is written down.** Two of the three scanners were confidently wrong
in a way that would have produced work — 162 "bugs" that are the word `if`, or
7 that are a plural inside an `alert`. The general shape recurs: extracting
identifiers from JavaScript with a regex needs keywords excluded and string
literals stripped, and any scanner reporting a zero needs a planted positive
before that zero means anything. Both are cheap; neither is optional.

No code change.

---

## chronicle.html is not missing anything, and the card-adoption vein is worked out (2026-09-04)

Two entries above record `chronicle.html`'s 17 `.event-card` timeline entries as
**blocked** from `.card`, because `.event-card::before` already draws the 14px
connector line to the timeline spine and two rules on one pseudo cascade per
property. That is true, and it was written in a way that implies the page is
losing something. Measured, it is not.

```
eventCard    {bg:"rgba(10, 10, 15, 0.68)", border:"rgba(201, 168, 76, 0.22)",
              shadow:"present", radius:"2px", pad:"14px"}
platformCard {bg:"rgba(10, 10, 15, 0.68)", border:"rgba(201, 168, 76, 0.25)",
              shadow:"present", radius:"2px", pad:"20px"}
```

Identical ground, identical shadow, identical radius, border within 0.03 alpha.
`omega-visual-evolution.css` styles `[class*="card"]` — a **substring** selector
— so `.event-card` already receives the whole platform surface without carrying
the class. The only real difference is padding, and 14px is the better value for
a dense timeline; `.card`'s `clamp(14px,2.5vw,20px)` would loosen it.

Adding `.card` would therefore buy the 2px accent bar and the hover elevation,
in exchange for moving the connector off `::before` onto the dot column — a
refactor of a bespoke grid timeline, where `.card{overflow:hidden}` would also
clip any child-element replacement drawn at `right:-14px`. **The blocker is
real; the thing it blocks is not worth having.**

### The vein is worked out

Re-deriving the density ranking after this session's conversions:

```
ad-network.html   1221   dormancy statement -- deliberately plain, not to be touched
matrix.html        487   13 visual elements already
approvals.html     417   owner-gated, 1252 chars
stoic.html         417   .virtue-card already carries .card
chronicle.html     388   above
```

The top of the list is now pages where the metric is misleading or the work is
correctly refused, not pages with a real gap — the earlier leaders (1266, 1221,
677, 668, 601) were the KPI family, and it is retired. Further sweeping would be
forcing the metric rather than following it.

Also checked and needing nothing: **emblem coverage is 187 of 189 pages**; the
two exceptions are `verify-deployment.html` and `verify-modules.html`, internal
verification pages that correctly have none.

No code change.

---

## ops.html's event-bus metrics table: the missing 10% of a built feature (2026-09-04)

`CLAUDE.md` §8.2 listed this as open, with the reason "The container would be
new UI, not a fix." Reading the page, that framing was wrong — and the entry is
now closed.

Three of the four parts already existed:

- the **renderer**, `ops.html:485`, reads `window.OmegaBus.metrics()`, skips
  events with no traffic, colours `errors` red and `dlq` amber, formats latency
  to 2dp, and has a proper empty state (`No events emitted yet`);
- the **styling**, `.evt-tbl` / `.evt-tbl th` / `.evt-tbl td` at
  `ops.html:77-80`, complete with a gold first column;
- the **data source**, `omega-event-bus.js`, tracking
  `emitted/consumed/errors/dlq/lastSeen/avgLatencyMs` per event across a
  15-event catalogue.

Only the `<table>` markup was missing, so `getElementById('evt-metrics-body')`
returned `null` and the entire block was skipped. A page-local CSS class styling
a table that does not exist is strong evidence the markup was written and lost,
not that it was never designed.

Measured, BEFORE pinned with `git show HEAD:`:

```
BEFORE {"tbodyExists":false,"tableRendered":false,"headers":null,"rowsRendered":0,
        "bodyText":null,"catalogSize":15}
AFTER  {"tbodyExists":true,"tableRendered":true,
        "headers":["EVENT","EMITTED","CONSUMED","ERRORS","DLQ","AVG LATENCY","LAST SEEN"],
        "rowsRendered":1,"bodyText":"platform.worker.started 6 0 0 0 0.00ms 23:05:26",
        "catalogSize":15,"overflowX":false,"errors":0}
```

The single row is **real live data**, not a placeholder:
`platform.worker.started`, emitted 6, consumed 0, no errors, no DLQ, last seen
23:05:26. One row of a 15-event catalogue is exactly what the renderer's
zero-traffic filter is written to produce — the other 14 have not fired in a
fresh session.

Fourteen lines of markup, no new CSS, no new JavaScript. **§8.2's entry is
removed**, which also returns ~40 tokens to the `CLAUDE.md` budget rather than
spending them.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests, `verify-runtime.js --all`
PASS on 189 pages, `ok ops.html`.

---

## The 43-page export gap was already closed; the doc was stale (2026-09-04)

Next on the list was building an export path for the 43 `LOCAL_ONLY` pages that
`CLAUDE.md` §8.2 described as holding member data "with no way to get it out".
It was not built, because checking first showed it already exists.

`omega-local-backup.js` was originally written for the 7 finance pages, and its
`exportKeys`/`importKeys` require the caller to enumerate its own key list —
which is exactly why it only ever reached those 7. But the module has since
grown three more methods that take **no key list at all**:

```
api: ["exportKeys","memberKeys","exportAll","importAll","importKeys"]
```

`memberKeys()` matches whatever the member actually has under the `omega`
prefix, which also covers runtime-built keys (`omega_wr_draft_<id>`) that no
static list could enumerate. `settings.html:174-182` calls `exportAll` and
`importAll`, and `bg.js:2130` loads the module on every page.

Verified end to end rather than by reading: member data was written on three
different `LOCAL_ONLY` pages, then `memberKeys()` was read from Settings:

```
{"module":"present","memberKeyCount":10,
 "coversHabits":true,"coversNotes":true,"coversProjects":true,
 "sample":["omega_consent_v1","omega_ded_date","omega_dedication_today",
           "omega_demo_watched_at","omega_habit_logs_v2","omega_habits",
           "omega_habits_v2","omega_notes"],
 "exportControl":true,"errors":0}
```

All three pages' keys are covered, from a Settings page that never knew they
existed.

§8.2's sentence — "only 5 carry that export path — 43 store member data with no
way to get it out" — described the state before `exportAll` was written and has
been corrected in place. The surrounding facts (48 `LOCAL_ONLY`, 24 `PARTIAL`,
run the scanner rather than quoting) are unchanged, as is the separate
`member_state` server-mirror note.

**The point worth keeping:** a documented open item is a claim with a date on
it, not a standing truth. This one had been closed by a later change to a
different file, and nobody went back to the entry. Checking cost one render;
building the feature again would have cost a day and produced a duplicate.

No code change.

---

## The 11 Edge Functions parse clean; a CI gate for it would cost more than it saves (2026-09-04)

`CLAUDE.md` §7 point 6 records that **nothing type- or syntax-checks the Edge
Functions** — their only automated coverage is `resilience-audit.py`'s
import-pin rules — and recommends parsing them with `npx typescript@5` in a
scratchpad before deploying. Confirmed still true: `deno`, `edge` and
`functions/` return zero hits across `.github/workflows/*.yml` and
`scripts/ci-local.sh`.

That is payment-critical code (`checkout`, `stripe-webhook`) with no parse gate,
so the recommended check was run over all eleven, with a positive control:

```
  ok                  checkout
  ok                  concierge
  ok                  graphify-ai-ingest
  ok                  graphify-ai-query
  ok                  intel-feed
  ok                  market-price
  ok                  notify-access
  ok                  rankings
  ok                  snapshot-leaderboard
  ok                  stripe-webhook
  ok                  weekly-digest
  PARSE ERRORS (3)    __CONTROL__
       :1:14  Property assignment expected.
       :2:10  Identifier expected.
       :3:1  ')' expected.

functions parsed: 11   with parse errors: 0
```

The control is a deliberately malformed file parsed through the same code path;
without it, eleven `ok`s prove only that the script ran.

`ts.createSourceFile` + `parseDiagnostics` is syntax-only. These are Deno modules
importing from remote URLs, so a full type-check is not possible in this
environment — but a syntax error is a syntax error, and one would currently ship.

### Why this did not become a 23rd gate

The obvious next step is wiring it into `scripts/ci-local.sh`. It was not done,
because the check needs the `typescript` package, and **no build step and no
`node_modules` is a deliberate, load-bearing property of this deploy**
(`vercel.json` disables install; CI is `node --check` only; §9's first rule).
The alternatives are all worse: `deno check` is not installed, vendoring
TypeScript is tens of megabytes into a repo that ships every file as-is, and
stripping type annotations by regex to reach `node --check` would invent
failures of its own.

That is very likely why §7 recommends it as a *manual pre-deploy step* rather
than a gate. The honest position is that this remains a real gap with a real
reason, and the eleven are clean **as of this run** — not that it is now
guarded. `scripts/check-secrets.sh` and this parse are both things a human must
still remember before `supabase functions deploy`.

No code change.

---

## evidence-audit.py called the site's homepage UNREACHABLE (2026-09-04)

`CLAUDE.md` §9 requires `EVIDENCE_MATRIX.md` to be kept current as part of the
same change. Checking it against §8.3's recorded baseline found drift, and the
drift turned out to be a scanner bug rather than an estate change.

```
§8.3 baseline : 95 BUILT / 24 PARTIAL / 48 LOCAL_ONLY /  8 STATIC / 2 BROKEN / 1 UNREACHABLE
measured      : 95 BUILT / 24 PARTIAL / 48 LOCAL_ONLY / 17 STATIC / 2 BROKEN / 3 UNREACHABLE
```

The baseline row sums to **178**; the estate is **189**. It was written before
eleven pages were added, and nobody re-derived it — the drift §8.4 warns about,
in the table that exists to prevent it.

### The bug

`UNREACHABLE` means "deployed, but `nav.js` does not reference it **and it is
not a public page**". The three flagged were `verify-deployment.html`,
`verify-modules.html` — internal tooling, correctly flagged — and
**`omega-visual-home.html`**, which is the site's **root**:

```
vercel.json:20  "rewrites":[{"source":"/","destination":"/omega-visual-home.html"}]
bg.js:442       var PUBLIC = ['/account','/enter','/reset','/terms','/pending',
                              '/index','/','/charter','/omega-visual-home'];
```

It is the first page every visitor sees, and `bg.js` already treats it as
public. The scanner's own comment says its set *"Mirrors bg.js's public-page
list (see CLAUDE.md §3)"* — but it had drifted from the list it claims to
mirror, missing both `charter` and `omega-visual-home`.

Adding the two:

```
UNREACHABLE  3 -> 2   (only the two internal verify pages, correctly)
STATIC      17 -> 18   (omega-visual-home reclassified, not removed)
```

§8.3's row is corrected to the measured values, with the page total noted so the
next reader can see at a glance whether it has gone stale again.

**The shape worth remembering:** a scanner that says it mirrors another file's
list, and does so by copying the values rather than reading them, will drift the
first time that file changes — and will then report a confident false positive
about the most visible page on the site. The same class as §8.4's "a number
stored in prose drifts; derive it instead", but in code.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests.

---

## A guard that silently stopped guarding: the single-runner warning (2026-09-04)

Re-deriving §8.3's baselines after the `evidence-audit.py` fix turned up a
second mismatch, and this one ran the opposite way — **the documentation was
right and the tool had drifted.**

```
§8.3 baseline : resilience-audit.py -> 0 findings; 1 warning (the single CI runner)
measured      : resilience-audit.py -> 0 findings; 0 warnings
```

The tempting move is to "correct" the doc to 0 warnings. That would have buried
a live risk, because the check had stopped firing while the risk it names was
untouched:

```
11  runs-on: [self-hosted, Windows, X64]
 1  runs-on: ubuntu-latest
```

`check_ci_runner_spof()` required `len(labels) == 1` — *every* workflow on one
label set. When `omega-update.yml` moved to `ubuntu-latest`, that made two
distinct label sets and the warning went silent, even though **11 of 12
workflows still depend on one physical machine**. One unrelated cloud job
switched off a warning about the other eleven. §8.2 still lists the single
physical runner as open, so nothing about the exposure had changed.

The fix scopes the test to self-hosted pools — concentration is the risk, not
uniformity, and an unrelated `ubuntu-latest` job is not a fallback machine:

```python
selfhosted = {k: v for k, v in labels.items() if "self-hosted" in k}
if len(selfhosted) == 1:
    ...  "%d of %d workflows target the single label set %s"
```

```
WARNINGS -- owner decisions, not blocking (1):
      11 of 12 workflows target the single label set [self-hosted, Windows, X64]
```

**Both directions controlled.** Adding a fixture workflow on
`[self-hosted, Linux, ARM64]` — a genuine second pool — silences it (0 matches);
removing it restores the warning (1 match). Without the negative control this
would only be demonstrably noisier, not demonstrably correct.

### A threshold I got wrong on the way

The first attempt also required `len(selfhosted[only]) >= 2`, which broke two
existing tests: `test_single_runner_label_set_warns` builds a fixture with a
*single* self-hosted workflow, and `test_strict_promotes_warnings_to_failures`
depends on that warning existing. The tests were right — one machine gating
everything is the risk whether it runs 1 workflow or 11 — so the threshold came
out rather than the tests being adjusted to fit it. **179 tests passing is what
caught it**, not review.

### The shape

Two stale-baseline findings in a row, pointing opposite ways: `evidence-audit`
drifted *from* the truth and the doc was stale; `resilience-audit` drifted from
the doc and the doc was right. Neither could be resolved by trusting one side —
only by asking *why* they disagreed. A baseline table is worth keeping precisely
because a silent guard cannot be noticed any other way.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests.

---

## Three sources, three duplicate-table counts — and my own was the wrong one (2026-09-04)

`CLAUDE.md` §5 quoted "47 tables defined in more than one file"; a run of
`evidence-audit.py` reported 48. Cross-checking produced a third number:

```
CLAUDE.md / REPOSITORY_AUDIT.md   47
evidence-audit.py                 48
an independent derivation         53
```

**The independent derivation was the wrong one, and it was mine.** Two wrong
conclusions were reached on the way there and are recorded because each is the
kind that ships:

1. **"The scanner recurses into `migrations/`, so it double-counts the bag
   against its own mirror."** It does call `Path('supabase').rglob('*.sql')` —
   but four lines later it restricts duplicate accounting to the root bag,
   with a comment naming exactly that hazard:

   ```python
   # Only the flat bag at supabase/ counts toward duplicate-definition
   # reporting; supabase/migrations/ is a deliberate ordered copy of that
   # same content (CLAUDE.md §5), so counting it would report every table
   # as duplicated.
   if path.parent.name == 'supabase':
   ```

   Reading the `rglob` and stopping there produced a confident accusation
   against code that had already handled the case.

2. **The 53.** `evidence-audit.py` strips SQL comments before matching; the
   quick derivation did not, so it counted commented-out DDL. Proven rather
   than assumed:

   ```
   raw                  duplicates: 53
   comments stripped    duplicates: 48
   ```

So 48 is authoritative and 47 had drifted by one.

### The fix is not 47 → 48

Editing the number re-arms the same trap for whoever reads it next. §8.4 already
prescribes the durable form — *"a number stored in prose drifts; derive it
instead… put it in the generator, not the paragraph"* — so §5 now points at
`evidence-audit.py` and tells the reader to derive it, noting that the quoted 47
had already drifted. `REPOSITORY_AUDIT.md`'s three mentions are left alone: they
are narrative about a past audit ("The 47-duplicate-tables 'safe because
idempotent' claim…"), and rewriting history to match today's count would be a
different error.

### Why this is worth a log entry at all

The count does not change any decision — the item stays open either way, and
consolidating still needs a per-table live-schema check. What is worth keeping
is the failure mode: **the number I trusted least should have been my own.**
Three disagreeing sources are not a three-way tie; the one built with care
(comment-stripping, an explicit scope guard) beat the one written in thirty
seconds, and saying "no source is authoritative" would have been a false
symmetry that stalled the question instead of answering it.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests.

---

## decisions.html asserted three things it could not know, and documented a framework it did not have (2026-09-04)

### What was on the page

The SCIENCE tab rendered eight `.stat-card` boxes — `.stat-val` over
`.stat-lbl`, the platform's KPI visual language, the same shape a member reads
as *their own* numbers. Three of the eight were not numbers the page could
produce:

| value | label | what it actually was |
|---|---|---|
| `95%` | PRE-MORTEM ACCURACY | an efficacy claim about the technique. No source, no derivation, nothing on the page computes it |
| `Q2` | EISENHOWER QUADRANT | a classification of the member's decision, asserted before any decision exists |
| `6` | BIAS PATTERNS | contradicted by the page's own data — `const BIASES` has **9** entries |

This is `CLAUDE.md` §8.1 class 9, the class that produced `hercules.html`'s
`Math.random() * 100` and `ad-network.html`'s `REVENUE.total += 0.05`.

### What was NOT a finding, checked before acting

The other five were suspected first and cleared:

- `27.8367 / APEX AUTH` appears on **~70 pages** and is platform canon with a
  published derivation — `account.html:205`: `AUTH = √(A³+B³+C³) × φ / e`, apex
  at node (9,9,9). `sovereigns.html:77` computes it live (`id="stat-apex"`,
  starting at `--`). A constant, honestly labelled. Left alone.
- `1.618` and `2.718` are φ and e. True. Left alone, moved under an explicit
  `CANON CONSTANTS` heading so they cannot be misread as readings.
- A first grep for `1.618\|2.718\|GOLDEN RATIO\|EULER` returned **129 files** —
  over-matching CSS values and line-heights. Narrowing to the rendered labels
  gave the real picture. The scanner needed the false-positive pass before its
  number meant anything (§8.4).

### The Eisenhower gap was real, and larger than the card

The FRAMEWORKS tab has always documented `EISENHOWER MATRIX (URGENCY ×
IMPORTANCE)` with all four quadrants — but the form recorded **urgency only**
(`<select id="d-urgency">`, four levels). There was no importance axis anywhere
in the data model, so the documented matrix was reference copy for a capability
the page did not have, and the `Q2` card was the visible symptom.

Fixed by adding the missing axis rather than deleting the card:

- `<select id="d-importance">` in step ① beside URGENCY, four levels.
- `buildDecision()` persists it; `editDecision()` restores it; `clearForm()`
  resets it.
- `quadrant(d)` returns `Q1`–`Q4` from the two axes, and **`null` when either
  is absent**. A decision saved before this change carries one axis, so it gets
  no quadrant rather than a guessed one — half a matrix is not a quadrant, and
  guessing the missing half would have reintroduced the exact fault being fixed.
- Each journal entry gets a `.dec-quad` chip; the SCIENCE tab shows the
  distribution plus a note naming how many decisions are placed and how many
  predate the field.

`clearForm()` also reset `_options` to `['',' ']` — a space, not an empty
string, so the second option input came back pre-filled with a space. Fixed to
`['','']`.

### Every SCIENCE value is now derived

`renderScience()` is called from `updateTopMeta()`, which already ran on init,
upsert and delete. `FRAMEWORKS.length`, `BIASES.length`, `_decisions.length`,
the committed count and the four quadrant counts all come from live state; the
quadrant cards show `--` until at least one decision carries both axes.

### Measured in a render, not reasoned from the diff

Harness: `.claude/skills/verify-in-browser/harness/session.js`, signed-in stub.

```
EMPTY    {"fw":"5","bias":"9","logged":"0","committed":"0","q":["--","--","--","--"],
          "note":"No decisions logged yet. The distribution fills in as you record
                  urgency and importance."}
ERR(empty) 0

  (two decisions planted in localStorage: one with both axes, one legacy urgency-only)

FILLED   {"logged":"2","committed":"1","q":["1","0","0","0"],
          "note":"1 of 2 decisions placed. 1 predate the IMPORTANCE field and stay
                  unplaced until edited.",
          "importanceSelect":true,"chips":["Q1 · DECIDE & ACT"],
          "topbar":"2 DECISIONS  ·  1 COMMITTED"}
ERR(filled) 0
```

The legacy decision is counted in `logged` and correctly excluded from every
quadrant — the backwards-compatibility case proven, not assumed.

The render check also flagged `95%` and `PRE-MORTEM ACCURACY` as still present:
they matched `document.body.innerHTML`, which includes `<script>` text, and the
only remaining occurrence is `decisions.html:337`, the comment explaining the
fix. A grep confirmed one hit, in a JS comment. **The assertion was written
against the wrong surface** — rendered claims need `innerText`.

Gates: `./scripts/ci-local.sh` 22/22, 179 tests OK, `scripts/audit.py`
0 critical / 7 warnings, `scripts/check-inline-js.py` clean,
`node scripts/verify-runtime.js` PASS on the 13 capability entrypoints.

---

## The evidence matrix now asks whether production has the table, not only whether the repo declares it (2026-09-05)

### The gap, named in this repo's own documentation

`CLAUDE.md` §8.4 has said it outright for some time:

> a `BUILT` row means the *client* is wired and nothing more. The live table,
> its columns, its `GRANT` and its policy are all still unverified, and each
> has been a real shipped bug (§8.1 classes 2 and 6).

`evidence-audit.py`'s `BROKEN` class is decided against the **SQL bag**:
`missing_t = sorted(t for t in info['tables'] if t.lower() not in rels)`, where
`rels` comes from `sql_surface()`. So a page querying a relation the bag
declares but production never received classified as `BUILT`, and every query
against it returns `{data:null,error}` — an empty page, no exception, no
console error.

`supabase/live-schema.json` — a dated snapshot of the real schema — was already
in the repo and already trusted by five other gates (`audit.py`,
`schema-dictionary.py`, `upsert-conflict-check.py`, `resilience-audit.py`,
`release-gate.py`). `evidence-audit.py` was not one of them; it mentioned the
file only in prose, at line 443.

### What the cross-check found

```
SQL bag relations : 119
live relations    : 208   (captured 2026-08-29)
declared in bag, ABSENT live : 8
live but not in bag          : 97
```

The 97 corroborate `CLAUDE.md` §8.2's "~83 tables live that this repo's SQL
never created" (the extra is views — the snapshot's `_relkinds` is
`r,v,m,p`). The 8 are new:

```
codex_bookmarks   creator_proposals   focus_sessions    habit_logs
okr_key_results   okr_objectives      signal_saves      wealth_snapshots
```

**None is read by any client page.** So nothing is silently empty today, and
that is the honest finding rather than a manufactured one. What it does show is
why part of the LOCAL_ONLY population exists: the server-side SQL for habits,
focus sessions and OKRs was written into the bag and then neither applied nor
wired. Wiring `habits.html` to `habit_logs` today would produce a page that
classifies `BUILT` and returns nothing.

### Severity is decided by one thing

| case | meaning | gates? |
|---|---|---|
| absent live **and read by a page** | a silent empty state shipping now | fails `--strict` |
| absent live, read by nothing | dormant backend, which this repo does on purpose (§9) | never |

A missing or malformed snapshot reports **NOT CHECKED**, never 0 — a missing
snapshot and a clean one must not look identical in a count, which is the exact
shape of §8.4's stopped-static-server bug.

### The zero was not trusted until it could fail

Seven tests, and the clean case is asserted only alongside two planted
positives. Then the detector was deliberately sabotaged
(`missing = []  # SABOTAGE`) and the suite re-run:

```
--- detector sabotaged ---
FAIL: test_control_gates_under_strict
AssertionError: 0 != 1
Ran 17 tests   FAILED (failures=3)

--- restored ---
Ran 17 tests   OK
```

Three failures under sabotage, none restored. Written down because this repo
has shipped scanners that reported a serene zero while being structurally
incapable of finding anything — three of them in a single session. A control
that is never checked against a broken detector is decoration.

### Not claimed

The snapshot proves table *presence* on 2026-08-29 and nothing else. Columns,
`GRANT`s and RLS policies remain unverified, and the Supabase MCP connection is
unauthenticated in this session, so no live query was made. The report says so
in place rather than in a footnote.

Gates: `./scripts/ci-local.sh` 22/22, `python3 -m unittest discover -s
scripts/tests` **186** tests OK (was 179), `scripts/audit.py` 0 critical /
7 warnings, `scripts/context-budget.py` PASS (CLAUDE.md 15,987 / 16,000 —
the §8.2 `audit.py` bullet was compressed to pay for the new §8.4 note).

---

## `--help` ran the job on 21 of 47 scripts, and one never returned (2026-09-05)

### The claim that was not true

`CLAUDE.md` §8.4 said, in the context every session loads before doing any work:

> **Ask a script what it does before reading it.** Every `scripts/*.py|sh`
> answers `--help` with its docstring and exits 0; a test keeps it true.

Measured, with controls, before any change:

```
CONTROLS
  audit.py                 honors --help : True
  commerce-contract.py     honors --help : True
  user-journey-contract.py honors --help : False

HONORS --help        : 26
IGNORES / FAILS      : 19     (ran the whole job; 2 of them exited 1)
HANGS (>20s)         : 1      page-overlap-audit.py
NO MODULE DOCSTRING  : 1      user-journey-contract.py
```

21 of 47. The predicate is "output contains the first line of the module's own
docstring, exit 0" — a first pass that only checked the exit code passed
everything, because a script that runs its job successfully also exits 0.

`page-overlap-audit.py` is the sharp end: it runs an O(n²) `SequenceMatcher`
comparison across 189 pages, so `--help` never returned. The first measurement
run was killed at 120 s by that single script.

**No test kept it true.** The invariant was enforced per-script, in whichever
test file someone happened to write one, so a script that shipped without a test
was never checked — `user-journey-contract.py` had no test and no docstring.

The cost is not cosmetic. §8.4's whole point is that `--help` is how a session
learns what a script does *without* spending context reading it. A `--help` that
launches a 189-page scan makes the cheap path the expensive one.

### Fixed

The same guard, ahead of any work, in all 20 (the 21st is the rewrite below):

```python
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)
```

Inserted after the last top-level import by AST position, not by line number, so
it lands ahead of module-level work in the scripts that have no `main()`
(`workflow-contract.py` and friends do their work at import time).

`scripts/tests/test_script_help_contract.py` is a **sweep, not a list** — a new
script is covered the moment it lands, which is the only shape that keeps the
CLAUDE.md sentence true. It carries a planted violator that must be rejected by
the same predicate the sweep uses.

The whole sweep now runs in **1.0 s**, against >120 s before.

### Also fixed: `schema-dictionary.py` had `\{` in a docstring

`ast.parse` warned `invalid escape sequence '\{'` at line 247 — inside a
docstring explaining a regex. Harmless today, a `SyntaxWarning` on newer Python,
and it sits in text `--help` now prints. Made the docstring raw. Repo-wide
escape/syntax warnings: **0**.

### The second finding: a journey contract that never resolved a destination

`scripts/user-journey-contract.py` validated the *shape* of
`config/user-journey-contract.json` — `version` is a string, `rules` non-empty,
each rule carries `id`/`from`/`to`/`goal`, ids unique — and printed
`USER JOURNEY CONTRACT: PASS (6 journeys)`. It never asked whether any named
path resolves to something the deployment serves.

It did not:

```
USER JOURNEY CONTRACT: FAIL
- journey 'discover':    to   = '/discover'  does not resolve (no discover.html, no rewrite, no redirect)
- journey 'learn':       from = '/discover'  does not resolve
- journey 'create':      from = '/discover'  does not resolve
- journey 'participate': from = '/discover'  does not resolve
- journey 'participate': to   = '/community' does not resolve
- journey 'commerce':    from = '/discover'  does not resolve
```

**Five of the six declared journeys routed through `/discover`**, which is not a
file, not a rewrite and not a redirect. A gate proving a document is well-formed
while the thing it describes does not exist is §8.4's "green check standing in
for a real one".

Resolution is now checked against the real surface: a file in the repo root
(`vercel.json` sets `cleanUrls: true`, so `/gateway` serves `gateway.html`) or a
`rewrites`/`redirects` source. `cleanUrls` is read from `vercel.json` rather than
assumed — it is a deploy setting, and turning it off breaks every extensionless
path in the contract at once.

The two missing destinations were remapped to the surfaces that do the job,
established from source rather than inferred:

| was | now | evidence |
|---|---|---|
| `/discover` | `/gateway` | `gateway.html:91` loads `omega-gateway.js`, which builds the whole destination grid grouped by axis — "find the right destination quickly" is that page |
| `/community` | `/social` | `social.html`, titled `SOCIAL HUB`; `nav.js` labels it `SOCIAL HUB` / `SOCIAL` |

```
USER JOURNEY CONTRACT: PASS (6 journeys, 12 endpoints resolved)
```

Corroboration found on the way: `vercel.json`'s `redirects` include
`/sovereign → /sovereign-ai`, which explains the inert `sovereign:[12,'a','Ω']`
entry in `omega-page-emblem.js` that has no `sovereign.html` — it is a redirect
target, and `omega-gateway.js` already excludes it. Not a bug.

Gates: `./scripts/ci-local.sh` 22/22, `python3 -m unittest discover -s
scripts/tests` **189** tests OK (was 186), `scripts/audit.py` 0 critical /
7 warnings, `scripts/context-budget.py` PASS (CLAUDE.md 15,991 / 16,000 — the
§8.2 self-hosted-runner bullet was compressed to pay for the corrected §8.4
note).

---

## A committed generated artifact stamped the clock, so it was dirty after every run (2026-09-05)

Found by the stop-hook git check, not by a gate: after running the verification
sweep, the working tree carried

```
 M schema_consolidation_mapping.json
```

and the whole diff was:

```diff
-    "generated": "2026-09-05T00:46:14.285716",
+    "generated": "2026-09-05T00:52:24.050662",
```

`scripts/schema-consolidation-phase1.py:127` wrote `datetime.now().isoformat()`
into a file that is committed to the repo. So merely *running* the generator —
which the `--help` audit above did, across every script — dirtied the tree with
a diff carrying no information.

Both ways out of that are bad. Committing it adds a meaningless timestamp bump
to history; `git checkout --` on it is one slip away from discarding real work.
And it trains a session to treat a dirty tree as noise, which is exactly when a
real change gets thrown away.

**Nothing read the field** — only the generator writes it, and the three
markdown files mentioning the artifact reference the filename, not the
timestamp. Provenance is the generator's name, which is the stable half;
`build-content-registry.py` already takes that approach with a plain
`'generated': True`. So `generated` became `generated_by`, and the now-unused
`datetime` import was removed after checking no other reference survived.

Proven reproducible rather than assumed — two consecutive runs, unchanged
inputs, byte-identical output.

`scripts/tests/test_generated_artifact_stability.py` encodes the rule: running a
generator twice with unchanged inputs must produce identical bytes, which is
what makes a generated file reviewable in a diff at all. It carries a planted
volatile generator as a control, and the fix was checked against the bug it
fixes — the old `datetime.now()` line was restored and the test re-run:

```
--- clock restored ---
AssertionError: ...:03.946958" != ...:03.993536" :
  schema_consolidation_mapping.json differs between two consecutive runs with
  unchanged inputs — it is embedding something volatile
FAILED (failures=1)

--- restored ---
OK
```

The test is a small list of (generator, artifact) pairs rather than a sweep,
because there is no registry of which committed files are generated;
`schema-consolidation-phase1.py` is currently the only script in `scripts/`
calling `datetime.now().isoformat()`, verified by grep. Add a pair when a
generator is added.

Gates: `./scripts/ci-local.sh` 22/22, **191** tests OK (was 189).

---

## An outside PR turned `main` red, and the gate that caught it was a generated census (2026-09-05)

PR #250, authored by the Vercel GitHub integration ("Install Vercel Web
Analytics"), merged to `main` a few minutes after #249. It added
`omega-analytics.js` and `omega-analytics-init.js`, plus a
`<script type="module" src="/omega-analytics-init.js"></script>` before `</body>`
on 193 pages.

`main` — the deployed branch — was left failing a blocking check:

```
FAIL  OMEGA_SKILL_REGISTRY.md is out of date.
  -| `omega-*.js` modules | 145 (1157 KB) |
  -| root `.js` files | 154 |
  +| `omega-*.js` modules | 147 (1164 KB) |
  +| root `.js` files | 156 |
  1 BLOCKING CHECK(S) FAILED (21 passed)
```

Regenerated with `python3 scripts/omega-registry.py`. Nothing else was wrong —
which was checked rather than assumed:

| check | result |
|---|---|
| `./scripts/ci-local.sh` | 22/22 after the regeneration |
| `python3 -m unittest discover -s scripts/tests` | 191, OK (unaffected) |
| `python3 scripts/audit.py` | 0 critical / **7** warnings — unchanged, so the new module orphaned nothing |
| `node scripts/verify-runtime.js` | PASS on 13 pages, with the new `<script type="module">` on all of them |
| `python3 scripts/resilience-audit.py` | 0 findings |

Two things were specifically checked because this repo's rules make them
load-bearing, and both are fine:

- **CSP.** `omega-analytics.js:109` names `https://va.vercel-scripts.com`, which
  is **not** in `vercel.json`'s `script-src 'self' …` allowlist. It is reached
  only under `isDevelopment()`; the production path is
  `omega-analytics.js:114`, `/_vercel/insights/script.js` — same origin, so
  `'self'` covers it. No CSP violation on the production domain.
- **No build step.** `package.json` predates this PR (`9bc18081`); #250 only
  added a `@vercel/analytics` dependency to it. `installCommand: echo
  skip-install` and `buildCommand: echo static-no-build` are untouched, and the
  vendored `omega-analytics.js` is what actually ships — the same self-host
  pattern as `vendor/supabase-js.js`. The `^2.0.1` caret is a floating range in
  a repo that pins exactly, but it is inert: nothing installs it. Recorded, not
  changed, because the file is managed by the integration.

**Why this is written down.** The registry gate exists because "a number stored
in prose drifts; derive it instead" (CLAUDE.md §8.4). Here it did something the
prose version never could: it noticed a change *this session did not make*, from
an author that is not a person, and failed on the deployed branch. A committed
census is not bookkeeping — it is the only check in this repo that notices a
third party editing the estate.

Gates after the fix: `./scripts/ci-local.sh` 22/22, 191 tests OK,
`scripts/audit.py` 0 critical / 7 warnings, `verify-runtime.js` PASS.

---

## The same bot broke `main` again, one PR later (2026-09-05)

PR #252 ("Install Vercel Speed Insights"), same author as #250, merged ~40
minutes after it and left `main` red the same way:

```
-| `omega-*.js` modules | 147 (1164 KB) |   +| 149 (1168 KB) |
-| root `.js` files | 156 |                 +| 158 |
1 BLOCKING CHECK(S) FAILED (21 passed)
```

Two more modules (`omega-speed-insights.js`, `omega-speed-insights-init.js`) and
another `<script type="module">` across the estate, with no census regeneration.

### A CSP violation I was about to report, and did not

`omega-speed-insights.js:73` returns
`https://va.vercel-scripts.com/v1/speed-insights/script.js`, and that host is
**not** in `vercel.json`'s `script-src 'self' 'unsafe-inline' https://esm.sh
https://cdn.jsdelivr.net https://unpkg.com`. Unlike the Analytics module, where
the CDN appears only under `isDevelopment()`, here it sits on a second,
non-debug branch — which looked like a shipped feature silently blocked by the
enforced CSP.

Reading the whole function rather than the matching line settled it:

```js
function getScriptSrc(props) {
  if (props.scriptSrc)    return makeAbsolute(props.scriptSrc);
  if (isDevelopment())    return "…/script.debug.js";
  if (props.dsn)          return "https://va.vercel-scripts.com/v1/speed-insights/script.js";
  if (props.basePath)     return makeAbsolute(`${props.basePath}/speed-insights/script.js`);
  return "/_vercel/speed-insights/script.js";
}
```

`omega-speed-insights-init.js` calls `injectSpeedInsights()` with **no
arguments**, so `dsn` and `basePath` are undefined and the fall-through is
same-origin. No violation. This is CLAUDE.md §8.4's "classifying by substring is
not reading it", in a new place: a grep for the CDN host found a real line on a
real code path that this call site cannot reach.

### Everything else, checked not assumed

| check | result |
|---|---|
| `./scripts/ci-local.sh` | 22/22 after regeneration |
| `python3 scripts/audit.py` | 0 critical / 7 warnings — unchanged |
| `python3 -m unittest discover -s scripts/tests` | 191, OK |
| `node scripts/verify-runtime.js` | PASS on 13 pages, both new module scripts present |

### The standing decision

Two occurrences in one hour make this a condition, not an incident, so it is now
in CLAUDE.md §8.2 with its one-line remedy. **The census gate is deliberately
not auto-healed in CI.** It would be easy to have a workflow run
`omega-registry.py` and commit — and that would destroy the only property that
made this visible at all. Twice now the committed census is the sole check in
this repo that noticed a third party adding modules to ~193 pages. A gate that
silently repairs the evidence of an undisclosed estate-wide edit is worse than
no gate: it would have let both PRs land with no signal whatsoever.

The cost of keeping it blocking is a few red minutes on `main` between the bot's
merge and the fix. That is the correct trade.

### A budget note that will matter next session

`CLAUDE.md` is now at **16,000 / 16,000** exactly. Fitting the new §8.2 entry
took compressing seven existing bullets, and it is the second consecutive
session that has had to buy space this way. §8.2 has run out of room: the next
standing fact cannot be added without either a real deletion or moving the
"genuinely open" list into its own on-demand document. That is a decision for
the owner, not a trim to be improvised.

Gates: `./scripts/ci-local.sh` 22/22, 191 tests OK, `scripts/audit.py` 0
critical / 7 warnings, `verify-runtime.js` PASS, `context-budget.py` PASS.

---

## Supabase was reachable the whole time, and seven declared tables were never applied (2026-09-05)

### The mistake first

Several times this session I told the owner the Supabase connector was
unauthenticated and that live-schema work was therefore blocked. A harness banner
said so on every reconnect. **I never tried the call.** The owner said it was
authorized; one `execute_sql` settled it:

```
select current_database(), current_user, now();
-> postgres | postgres | 2026-09-05 01:23:56+00
```

`GAP_ANALYSIS.md`'s header carried the same wrong belief in stronger form — *"no
session in this project's history has held live Supabase credentials"* — so this
was not one session's slip but a documented assumption nobody had retested. Both
are corrected. **The standing rule is now in `CLAUDE.md` §8.2: try the call
before reporting a capability blocked.** A banner is a claim, not a measurement.

### What live access settled immediately

The live-schema cross-check shipped hours earlier reported 8 relations declared
in `supabase/` and absent from the 2026-08-29 snapshot. Against the real
database:

```
relname            kind   rls   policies  authenticated SELECT
creator_proposals  table  true  4         false
(the other seven: not present)
```

So the 8 were **7 genuinely absent + 1 false positive from snapshot staleness**.
`creator_proposals` had existed all along. That is exactly the failure §8.1 class
2 warns about — *"a stale snapshot re-opens the false positives"* — caught within
a day of the gate that produced it. It also turns out to be a §8.1 class 6 case:
4 policies, no `GRANT`, so `authenticated` cannot read it at all. Left locked
(the safe state) since no client queries it, consistent with the standing
decision on the other 39 such tables.

### The seven were a backend written and abandoned

`supabase/chunk_10_productivity.sql` (5 tables) and
`supabase/chunk_09_new_features.sql` (2 of its 4) declare complete, correct
schema — `CREATE TABLE IF NOT EXISTS`, per-user RLS policies, **and** the
matching `GRANT ... TO authenticated`, i.e. both halves of class 6 done right —
and production never received any of it. That explains part of why 48 pages are
`LOCAL_ONLY`: the server side for habits, focus sessions and OKRs exists in the
repo and stops there.

Applied verbatim, as two migrations, after reading both files end to end:

| table | from |
|---|---|
| `focus_sessions`, `habit_logs`, `okr_objectives`, `okr_key_results`, `wealth_snapshots` | `chunk_10_productivity.sql` |
| `codex_bookmarks`, `signal_saves` | `chunk_09_new_features.sql` |

`oaths` and `user_dedication` from chunk 09 were already live and deliberately
not touched — checked first rather than relying on `IF NOT EXISTS` to make a
blind re-apply harmless.

### Verified live, not assumed from `{"success":true}`

Grants and policies read back together, because either alone tells you nothing:

```
relname           rls   pol  auth_sel  auth_ins  anon_sel  qual
focus_sessions    true  1    true      true      false     (auth.uid() = user_id)
habit_logs        true  1    true      true      false     (auth.uid() = user_id)
okr_objectives    true  1    true      true      false     (auth.uid() = user_id)
okr_key_results   true  1    true      true      false     (auth.uid() = user_id)
wealth_snapshots  true  1    true      true      false     (auth.uid() = user_id)
codex_bookmarks   true  1    true      -         false
signal_saves      true  1    true      -         false
```

Then the §8.4 impersonation test, in one rolled-back transaction — a privileged
query proves nothing about what a member sees:

```
member A inserts own row                    -> OK
member A inserts WITH member B's user_id    -> 42501 (WITH CHECK held)
A_sees = 1        B_sees = 0                -> scoped
role anon                                   -> 42501 permission denied
```

The anon case aborted the first attempt mid-transaction, which is why it is run
separately — the error *was* the passing result.

Security advisors before and after the seven tables: **one lint, unchanged** —
`auth_leaked_password_protection`, already documented as expected on the free
plan and mitigated client-side.

`supabase/live-schema.json` regenerated to 2026-09-05 / 216 relations. The
cross-check now reports **0 declared relations absent live**, closed by applying
the schema rather than by weakening the gate.

### A note on how the schema was refreshed

Reading 200+ relations through the transcript to rebuild the snapshot would cost
more context than the whole auto-loaded budget. Several routes were tried —
per-table md5 digests, a server-side `full outer join` against the committed
list — and the honest answer is that the diff-by-checksum query is ~12 KB of
input to save a larger output, which is worth it only when the delta is small.
Here the delta was known and tiny (7 applied + 1 stale), so it was patched
directly. **A generator script cannot do this: `scripts/` has no database
connection, only the MCP session does.** Anyone regenerating it wholesale should
expect to spend real context, or narrow to the relations client code actually
queries.

Gates: `./scripts/ci-local.sh` 22/22, `scripts/schema-dictionary.py` OK against
the refreshed snapshot, `scripts/audit.py` 0 critical / 7 warnings.

---

## `CLAUDE.md` §8.2 moved to `GAP_ANALYSIS.md` §S, and the budget stopped being a wall (2026-09-05)

The previous entry recorded that `CLAUDE.md` sat at exactly **16,000 / 16,000**
and that §8.2 could not take another entry without a real deletion. That came due
immediately: live Supabase access is a standing fact a session needs in its first
minutes, and there was no room for it.

Compressing further was the wrong move — two consecutive sessions had already
bought space that way, and the last round had started removing information rather
than words. §8.2 measured **8,281 chars / ~2,070 tokens across 19 bullets**, and
almost all of it is *reference*: a session consults "39 tables have policies and
no grant" when it touches grants, not before it starts work.

So the list moved to `GAP_ANALYSIS.md` §S — the document whose own header already
defines its scope as confirmed-open gaps and deliberate product decisions — and
§8.2 now holds a pointer plus only the four items that change what a session does
in its first minutes: live Supabase access works, a dated snapshot lies in both
directions, the Vercel bot leaves `main` red, and CI is one Windows runner.

```
CLAUDE.md  ~16,000 / 16,000  OVER (§8.2 could not take another entry)
CLAUDE.md  ~14,576 / 16,000  ok  (1,424 tokens of headroom recovered)
```

Nothing was deleted — every bullet is in `GAP_ANALYSIS.md` §S with its evidence
intact, plus a note explaining why it lives there and the reminder that §9's
evidence-citation rule applies there unchanged.

Gates: `./scripts/ci-local.sh` 22/22, `scripts/context-budget.py` PASS.

---

## habits.html wrote 90 days of invented history into localStorage (2026-09-05)

### The bug

`habits.html:250` seeded a member's first visit under its own comment,
*"Seed with defaults + simulated completion history"*:

```js
DEFAULTS.forEach(h=>{
  for(let i=0;i<90;i++){
    if(Math.random()<0.72){
      const d=new Date();d.setDate(d.getDate()-i);
      ...
      logs[key][h.id]=true;
```

Every streak, completion rate and chart on the page was then computed from coin
flips. This is `CLAUDE.md` §8.1 class 9, third recurrence after `hercules.html`'s
`Math.random() * 100` and `ad-network.html`'s revenue counter — and **worse than
either**, because the fiction was written to `localStorage`. `hercules.html`
re-invented its number on each render; this one persisted, and from the second
visit onward was indistinguishable from data the member had actually earned.

### Only one page does this — five candidates, four false positives

A scan for `Math.random()` within 700 chars of a `localStorage.setItem` or a
`.insert`/`.upsert` returned five pages. Reading them left one:

| page | what it actually was |
|---|---|
| `family.html:649`, `profile.html:1927` | decorative starfield drawn to a canvas |
| `meditate.html:391` | picks a random affirmation from a list |
| `water.html:241` | rotates a hydration tip |
| **`habits.html:257`** | **the real finding** |

The heuristic is a proximity window, so it over-reports by construction; the
false-positive pass is what made the number mean anything (§8.4).

### The fix, and the part that needed a provable rule

Seeding is gone: a new member now starts with the six default habits and an
**empty** history, which is the truth.

Existing installs are the harder half. The seed left no marker, so "which entries
are fabricated" cannot be answered from storage alone. One rule *is* provable:
**a completion dated before the member's account existed cannot be real.** The
seed wrote the 90 days preceding first visit, so for anyone who installed less
than 90 days after signing up it catches the fabrication, and it can never delete
a genuine entry whatever the install date.

`purgeSeededHistory()` reads `created_at` off the session (no table read), runs
once behind `omega_habits_seed_purged_v1`, and is deliberately conservative:

- no session, no `created_at`, or any throw → **does nothing and leaves the
  marker unset**, so a later visit retries. Never delete on a failed read.
- `day < cutoff` is strict, so the account-creation day itself is kept.
- `week-YYYY-MM-DD` keys are parsed and compared like day keys.

### The harness stub was less faithful than production, and hid the branch

The first verification run reported `purged:false` — correct behaviour, but it
meant the delete path had never executed. The cause was the harness:
`sbstub.js:10` built `SESSION.user` as `{id, email}`, while a real Supabase
session user carries `created_at`. Code that reasons about when an account began
therefore no-ops against the stub and looks fine.

Fixed in the stub (matching the `PROFILE.created_at` already there), which makes
this and any future session-date logic testable.

### Measured, both cases

```
FRESH   {"habits":6,"logDays":0,"completions":0}                  errors: 0

planted 12 keys straddling the account created_at (2026-01-01):
  before: 2024-06-06 2025-11-01 2025-12-01 2025-12-25 2025-12-31 week-2025-12-07
  after : 2026-01-01 2026-02-02 2026-03-03 2026-08-08 2026-09-01 week-2026-02-01

AFTER   kept = 2026-01-01 2026-02-02 2026-03-03 2026-08-08 2026-09-01 week-2026-02-01
        purged = true                                             errors: 0
```

Six provably-fabricated entries removed, six possibly-real ones kept, the
boundary day kept, weekly keys handled in both directions.

### A method note

The first run of this verification failed to navigate at all: the harness expects
a static server on :8765 and does **not** start one, and the server from an
earlier test in the same session had died. That is §8.4's stopped-server case
arriving in a new form — not a serene zero, but a crash that could easily have
been read as "the page is broken". Start the server and prove it with a control
request before trusting any harness result.

Gates: `./scripts/ci-local.sh` 22/22, 191 tests OK, `scripts/audit.py` 0 critical
/ 7 warnings, `scripts/check-inline-js.py` clean, `node scripts/verify-runtime.js`
PASS on 13 pages.

---

## habits.html now mirrors to the table that was applied for it (2026-09-05)

The previous entry stopped `habits.html` inventing history. This wires it to the
real thing: `public.habit_logs`, declared in
`supabase/chunk_10_productivity.sql` and applied live earlier the same day.

### A mirror, not a sync

The same decision as `omega-member-state.js`, for the same reason: this page
renders synchronously from `localStorage`, so a hydrating two-way sync would race
the render and let an empty-cache paint overwrite good server rows. Writes go up;
`localStorage` stays what the UI reads. Restore stays explicit.

### Two traps the code exists to avoid, both proven rather than assumed

**Class 7 — the conflict target.** `habit_logs` carries
`UNIQUE (user_id, habit_id, log_date)`, a non-PK unique constraint. Omitting
`onConflict` makes PostgREST default to the PRIMARY KEY; the payload has no
`id`, so the write succeeds once and then raises `23505` forever, freezing the
feature at its first value. Demonstrated against the live database, impersonating
a real member:

```
2x  insert ... on conflict (user_id,habit_id,log_date) do update
    -> rows_after_two_upserts = 1          (idempotent, as intended)

1x  insert ... on conflict (id) do nothing   -- what omitting onConflict gives
    -> rejected by the unique index; row count still 1, nothing written
```

The page names `onConflict: 'user_id,habit_id,log_date'` explicitly.
`scripts/upsert-conflict-check.py` agrees: 0 findings.

**Class 1 — the silent write.** Supabase resolves to `{data:null,error}` and does
not throw, so a `try/catch` around it catches nothing. `.error` is checked on
both the upsert and the delete before anything is treated as written.

Mirror failure is deliberately silent *to the member*: the local write already
succeeded and is what the UI shows, so nothing they can see is lost. It goes to
`console.warn` for diagnosis rather than surfacing an error they cannot act on.
This is not the §9 violation it might resemble — no success state is rendered on
the strength of the server write, because the UI never reads the server.

### Measured in a render, through the real handler

```
log days before toggle : 0
after toggle ON        : {"2026-09-05":{"h0":true}}
after toggle OFF       : {"2026-09-05":{}}
page errors            : 0
console warn/error     : 0
```

Zero console output means the mirror path ran to completion against the harness
stub without throwing or complaining — the failure branches are reachable but
quiet, which is what they are for.

`scripts/schema-dictionary.py` validates the column names against the refreshed
live snapshot rather than the SQL bag, so `habit_name`/`log_date`/`completed`
are confirmed to exist in production — the class 2 gate doing its job on a
first-time write path.

Gates: `./scripts/ci-local.sh` 22/22, 191 tests OK,
`scripts/upsert-conflict-check.py` 0 findings, `scripts/schema-dictionary.py` OK,
`node scripts/verify-runtime.js` PASS on 13 pages.

---

## focus.html mirrors to focus_sessions, and the CHECK constraints were verified against the page (2026-09-05)

The third table applied this morning gets its page. `public.focus_sessions`
(`supabase/chunk_10_productivity.sql`, applied live 2026-09-05) now receives a
row whenever a session completes.

### Append-only, so an insert — not an upsert

`habit_logs` needed an explicit `onConflict` because it carries
`UNIQUE (user_id, habit_id, log_date)`. `focus_sessions` has **no unique
constraint beyond its primary key**, so there is no conflict target to name and
§8.1 class 7 does not apply. Using `upsert` here would have been cargo-culting
the previous page's fix. `scripts/upsert-conflict-check.py`: 0 findings.

Still a mirror, not a sync, for the same reason as `habits.html` and
`omega-member-state.js`: the page renders synchronously from `localStorage`.

### The CHECK constraints are real, and were checked against the page's vocabulary

```sql
mode text NOT NULL CHECK (mode IN ('DEEP WORK','ULTRADIAN','FLOW STATE','BREAK','CUSTOM'))
duration_secs integer NOT NULL CHECK (duration_secs >= 0)
target_secs   integer NOT NULL CHECK (target_secs  >  0)
```

A `23514` writes nothing and, like every Supabase error, does not throw. So the
page's own vocabulary was compared to the constraint rather than assumed:

```
page modes  : BREAK CUSTOM 'DEEP WORK' 'FLOW STATE' ULTRADIAN   (its data-name chips)
CHECK allows: BREAK CUSTOM 'DEEP WORK' 'FLOW STATE' ULTRADIAN
not allowed : (none)
```

They match exactly — the SQL was written for this page. `target_secs` is
nonetheless clamped to `>= 1` in the mirror, because a custom-minutes field left
empty yields `0` or `NaN`, which the constraint would reject.

### Proven live, with controls

Impersonating a real member, rolled back:

```
insert all five page modes                     -> rows_written = 5
CONTROL mode = 'POMODORO'                      -> check_violation (rejected)
CONTROL target_secs = 0                        -> check_violation (rejected)
rows visible belonging to another user         -> 0
```

The controls are the point: without them, "5 rows written" says nothing about
whether the constraint would have caught a wrong value.

### Driving the real path needed a virtual clock

`mirrorFocusSession` is declared inside `<script type="module">`, so
`page.evaluate` cannot see it — the first verification attempt reported
`ReferenceError: mirrorFocusSession is not defined`. That is **not** §8.1 class
4(a): its only call site is `saveSession()` at `focus.html:247` and `:263`,
inside the same module, and nothing references it from inline HTML. Exporting it
to `window` to make a test pass would have been the wrong fix.

The real path ends a 25-minute timer, so it was driven with Playwright's clock:

```
sessions before : 0
sessions after  : 1
  {"task":"Untitled","mode":"DEEP WORK","duration":1500,"target":1500,"distractions":0}
page errors     : 0
warnings from the mirror : 0
```

Those values satisfy every live CHECK.

### A harness note

That run also produced 13 console warnings — all artifacts of the test, not the
page: bypassing the harness's `open()` for a raw `goto` skips the route stubs,
so `dayjs` and `marked` failed with `ERR_TUNNEL_CONNECTION_FAILED`. §8.4's "stub
before you scan" rule applies to a hand-rolled navigation just as much as to a
repo-wide scan. Filtering for `[focus]` is what separated the page's silence from
the harness's noise.

Gates: `./scripts/ci-local.sh` 22/22, 191 tests OK,
`scripts/schema-dictionary.py` OK against the refreshed live snapshot,
`scripts/upsert-conflict-check.py` 0 findings, `node scripts/verify-runtime.js`
PASS on 13 pages.

---

## targets.html mirrors to both OKR tables, and its demo seed is gone (2026-09-05)

Last of the three pages whose tables were applied this morning. Two findings:
the wiring, and a second instance of §8.1 class 9 discovered while verifying it.

### The mirror: two tables, a foreign key, and three constraints

`okr_key_results.objective_id` references `okr_objectives(id)`, so **order
matters**: the objective is inserted with `.select('id').single()`, its
generated id is what the key results carry, and if that insert fails the
function returns rather than sending writes that would fail the FK anyway.

Three live CHECK constraints this page could otherwise have violated, each a
`23514` that writes nothing and does not throw:

| constraint | the trap |
|---|---|
| `quarter ~ '^Q[1-4] \d{4}$'` | `getQuarterKey()` returns **`Q1_2026`, with an underscore** — it is a localStorage map key, not a label. Passing it would have failed *every* write. `getQuarterLabel()` (space) is sent instead |
| `title` 5–200 (objectives) | `saveObjective` only checks the title is non-empty, so a 1–4 character objective saves locally and would be rejected server-side |
| `title` 3–200 (key results) | same shape, per KR |

`category` is deliberately not guarded: the page's six `<option>` values match
the CHECK exactly — verified, not assumed.

Proven live as a real member, rolled back:

```
insert all six categories + their KRs   -> objectives 6, key_results 6
CONTROL quarter 'Q1_2026'               -> check_violation        (rejected)
CONTROL title 'Grow' (4 chars)          -> check_violation        (rejected)
CONTROL key result with no objective    -> foreign_key_violation  (rejected)
rows belonging to another user          -> 0
```

The first control is the important one: it proves the underscore trap was real
rather than theoretical, and the live page confirms it — its storage key
rendered as `Q3_2026`.

### The second finding: `seedDemo()` invented a quarter of progress

While driving the real `saveObjective` path, the page turned out to already hold
three objectives with progress the member had never made. `targets.html:561`
wrote them on first visit into `omega_okr_data` — the same key real objectives
use, with no marker — carrying hardcoded mid-quarter values:

```
$2,100 of a $5,000 revenue target
140 of 200 craft hours
VO2 max 46 ml/kg/min
sleep quality score 79
created: Date.now() - 60 * 86400000      (backdated two months)
```

The KPI row computes OKR SCORE and KEY RESULTS from that store, so a member who
had never set an objective was shown a quarter of progress including
physiological readings. Same class as `habits.html`'s 90 days of
`Math.random()` completions, differing only in being **fixed rather than
random** — which makes it more convincing, not less invented.

The seed was also unnecessary: `renderOKRs()` already has an empty state,
`NO OBJECTIVES FOR <quarter> — CREATE YOUR FIRST OBJECTIVE`, which is what a
member with no objectives should see.

### Purging it is safe *because* the demo was fixed

Unlike `habits.html`, where the fabrication was random and needed the
account-creation date to identify, this seed is byte-identical every time. An
entry is removed only if its title **and every key result** — titles, start,
target, current, unit — match the seed exactly. Any edit the member made stops
it matching and it is kept. The rule can only delete something never touched.

Measured:

```
FRESH   objectives 0 | KR stat 0 | empty state shown: true

planted: [exact seed entry] [seed entry with one KR edited 140 -> 175] [member's own]
AFTER   kept = ['Master a high-leverage technical skill t', 'My own objective']
        purged = true
```

The edited entry survived, which is the whole point of matching on values rather
than titles.

`mirrorObjective` is called only from `saveObjective`, never from the seed, so
no fabricated row was ever eligible to reach the server.

Gates: `./scripts/ci-local.sh` 22/22, 191 tests OK,
`scripts/schema-dictionary.py` OK against the refreshed live snapshot,
`scripts/upsert-conflict-check.py` 0 findings, `node scripts/verify-runtime.js`
PASS on 13 pages, 0 page errors and 0 mirror warnings in both renders.

---

## Every page-count claim a member could read was wrong, and one of them I broke myself (2026-09-05)

### How this was found

The `Math.random()` scan that caught `habits.html` structurally could not find
`targets.html`'s `seedDemo()`, because that fabrication was **hardcoded**. So a
second scan looked for the shape the first one could not see: a backdated
timestamp written into stored data, or a `seed*`/`demo*` function that writes to
`localStorage`.

Its control is a real one — the pre-fix `targets.html`, pinned with
`git show`, not reasoned about:

```
CONTROL against pre-fix targets.html: ['backdated@500', 'backdated@505', 'seedDemo@490']
```

Three hits on the current tree, and the false-positive pass left one:

| hit | verdict |
|---|---|
| `focus.html:415` `Date.now()-7*86400000` | a read-side window for weekly stats. Not fabrication |
| `habits.html:242` backdated `created` on habit *definitions* | never rendered — the only `.created` reads are the purge added earlier today. Inert |
| `notifications.html:143` `seedSystemNotifs` | **real** |

### The finding, and what it opened

`notifications.html` seeded a notification a member reads as system status:

> All SYD OMEGA 91717 systems operational. **169 pages active across 15 sections.**

"15 sections" is correct (`nav.js` has 15 unique section keys — checked, not
assumed). The page count was not, and "all systems operational" is a status
nothing measures. Grepping for the rest found four more, and the gate written
afterwards found **two more again** that the grep missed because it matched
lowercase `pages` and the dashboard says `170 PAGES`:

```
dashboard.html:245     ALL 170 PAGES · 15 SECTIONS        (also a data-i18n string)
dashboard.html:356     170 PAGES · 85 ENGINES
notifications.html:146 169 pages active
ecosystem.html:67      62-PAGE PLATFORM ... comprises 62 pages
roadmap.html:104       170 pages. 85 engines. 110 SQL files.
world-shell.html:1     all 150+ pages
settings.html:111      48 pages keep what you enter in this browser only
```

Ground truth that day: **189** pages, **149** `omega-*.js`, **126** SQL files.

### The one I broke myself

`settings.html`'s figure was *correct when written* — it is the `LOCAL_ONLY`
count from `evidence-audit.py`. It went stale because **wiring `habits`,
`focus` and `targets` to Postgres earlier today moved them out of that class**:
48 → 45, with `PARTIAL` 24 → 27. `EVIDENCE_MATRIX.md` was regenerated in the
same change and now reports all three as `PARTIAL` ("reads/writes 1 table",
"reads/writes 2 tables").

A number can rot because the estate grew *or* because you fixed something. The
second kind is easier to miss, because nothing about the change looks like it
touched documentation.

### A `data-i18n` string is seven places, not one

`dashboard.html:245` carries `data-i18n="dash_platform_index"`. Fixing the HTML
alone would have left `i18n.js`'s `T_EN` and all six packs asserting 170 — five
translations quietly lying, and `i18n-contract.py` failing on the `T_EN`
mismatch. All seven updated together; the contract reports 0 violations.

### The gate

Correcting seven numbers that drifted once will not stop them drifting again, so
`scripts/page-count-claims.py` requires every `<N> pages` in member-visible HTML
to equal either the estate size or an `evidence-audit.py` class count — the
latter because a page may legitimately describe a subset, as `settings.html`
does. Diagnostic harnesses (`verify-*.html`) are skipped.

Registered in `contract-suite.py` (15 gates → 16) and covered by five tests
whose first case is a planted violator, because a gate that cannot fail is worse
than none. It caught the two uppercase claims a careful hand-grep had missed.

Gates: `./scripts/ci-local.sh` 22/22 (16 contract gates, 0 failing), **196**
tests OK (was 191), `scripts/i18n-contract.py` 0 violations,
`scripts/omega-registry.py --check` matches, `scripts/context-budget.py` PASS
(CLAUDE.md 14,771 / 16,000).

---

## "Remote migration versions not found in local migrations directory" — cause, fix, and gate (2026-09-05)

### What the error actually is

`supabase db push` refuses to run when the remote migration history contains a
version `supabase/migrations/` does not. It is not a Supabase bug: applying a
migration through the dashboard or the MCP `apply_migration` tool writes a remote
history row and **no local file**. Two of the nine offending versions were
written by this session's own table work earlier today.

### Measured, both directions

A full outer join between `supabase_migrations.schema_migrations` and the local
directory found drift **both ways**, and no existing gate saw either:

```
remote-only (no local file)  9
  20260901143526 creator_proposals
  20260903015502 harden_rls_and_public_api_warnings_20260903
  20260903015535 harden_future_defaults_and_rls_20260903
  20260904194956 omega_platform_observability_baseline
  20260904200659 omega_performance_rls_fk_hardening_20260904
  20260904200717 omega_remove_redundant_fk_indexes_20260904
  20260904200951 omega_fk_index_cleanup_20260904
  20260905012717 chunk_10_productivity_tables          (this session)
  20260905012909 chunk_09_codex_bookmarks_and_signal_saves (this session)

local-only (never applied)   4
  0104 runtime_schema_alignment
  0105 creator_proposals          -- same table as 20260901143526
  0106 commerce_flags
  20260902 reset_migration_state
```

`20260901143526_creator_proposals` also explains an earlier puzzle: that table
existed live but was absent from `live-schema.json` and the SQL bag, which the
evidence cross-check had flagged as a stale-snapshot false positive.

`20260902_reset_migration_state.sql` is worth reading — it is a previous attempt
to solve this exact problem by declaring a "no-op reconciliation checkpoint".
It cannot work: the CLI compares version **lists**, so adding a local file
removes no remote-only entry. The problem recurred and was papered over.

### The fix, one direction at a time

**Remote-only → materialise the real SQL.** `schema_migrations.statements` is a
`text[]` holding what was actually executed, so all nine local files were
reconstructed verbatim rather than stubbed. A version-only stub would satisfy the
CLI while lying about what the migration does, and would produce a different
schema on a fresh database.

**Local-only → establish what is true, then record it.**

| version | verified | action |
|---|---|---|
| `0104` | `ai_memory.content` and `.expires_at` both present live | recorded as applied |
| `0105` | `creator_proposals` present live via the timestamped version | recorded as applied |
| `0106` | **`ad_network_enabled` and `creator_earnings_enabled` did NOT exist** | applied for real, then recorded |
| `20260902` | executes nothing | recorded as applied |

`0106` was the only one with a missing effect. Before applying it, the failure
mode was checked rather than assumed: `omega-ad-network.js:159` resolves the flag
lookup to `false` on error, and `omega-flags.js:50` hides `[data-omega-flag]`
unless explicitly turned on — so a **missing row fails closed**. The §9 dormancy
held; it just held by accident rather than by record. Both flags now exist and
are explicitly `false`.

### Result

```
remote versions : 166
local files     : 166
full outer join : []        (zero drift in either direction)
```

**A count correction worth recording:** an earlier step in this work reported
"173 remote migrations". That was eyeballed from a long result rather than
counted; the real figure was 162 before the four repairs. The arithmetic did not
reconcile (173 remote − 9 remote-only would leave more common versions than
local files existed), which is what prompted counting it properly. A number read
off a list is not a measurement.

### The gate, because this WILL recur

Nothing stops the next dashboard or MCP apply from re-opening the gap, so
`scripts/migration-drift.py` compares `supabase/migrations/` against
`supabase/remote-migrations.json` — a committed snapshot in the same pattern as
`live-schema.json`, because `scripts/` has no database connection and only an MCP
session does. It fails on **either** direction, since `db push` would try to
*apply* a local-only file, which the CLI's own error message never mentions.

Registered in `contract-suite.py` (16 gates → 17), with five tests whose first
two cases are planted violators, one per direction.

**Regenerate `remote-migrations.json` in the same change that applies a migration
live** — a stale snapshot makes this gate lie in both directions, exactly as a
stale `live-schema.json` did earlier today.

Gates: `./scripts/ci-local.sh` 22/22 (17 contract gates), **201** tests OK (was
196), `scripts/audit.py` 0 critical / 7 warnings,
`scripts/omega-registry.py --check` regenerated (the census caught the 9 new
migration files, 157 → 166).

---

## 86. The platform's front door returned 404 in production, and the Ω Intelligence Fabric that should have noticed was a file-existence check

**Date:** 2026-09-05
**Reported by:** the owner, with a photograph of the live site at its bare root.

### What was actually wrong

`https://sydomega-live-a6zu0aglq-syd-omega-91717s-projects.vercel.app/` — no
path, the front door — rendered `404.html`. Fetched through the Vercel MCP
rather than reasoned about:

```
status: 404  Not Found
content-disposition: inline; filename="404"
<title>Ω SYD OMEGA 91717 — 404 Node Not Found</title>
```

The same response carried this repository's `Content-Security-Policy`,
`Strict-Transport-Security` and `Permissions-Policy` headers verbatim — so
`vercel.json` was being read, and its

```json
"rewrites":[{"source":"/","destination":"/omega-visual-home.html"}]
```

still did not apply. There was **no `index.html` at the repository root**: the
entire front door depended on that one rewrite, and the rewrite did not fire.

The repository was already written as though `index.html` existed:
`bg.js:442`'s public-page list contained `'/index'`, its two `EX` maps
contained `'index':1`, `omega-emblems-catalog.js:537` carried an `'index.html'`
entry, and the browser harness `serve.js:10` maps `/` to `/index.html`. Every
one of those was aimed at a file that had never shipped.

### The fix, and why it is a rename rather than a second page

`git mv omega-visual-home.html index.html`. The filesystem is checked before
any rewrite and cannot silently stop working; a second page with the same
content would have failed `content-uniqueness-contract` and left two front
doors to drift apart. The old path keeps working through the pattern
`vercel.json` already used for `/entreprise`:

```json
{"source":"/omega-visual-home","destination":"/","permanent":true},
{"source":"/omega-visual-home.html","destination":"/","permanent":true}
```

and the `/` rewrite is gone. Followed through `bg.js` (three sites),
`omega-page-emblem.js` (the emblem key and its comment), and the two generated
registries.

**Rendered, not assumed.** Headless Chromium against the harness, which serves
`/` from `index.html` exactly as Vercel now will:

```
status 200 · title "Ω SYD OMEGA 91717" · h1 "ENTER THE OMEGA WORLD."
6 doors: /dashboard /cosmos /intelligence /media /marketplace /creator
emblem mount painted (2 children) · 1376 chars visible · 52 stylesheets
hOverflow false · dupIds [] · pageerrors []
```

### The gate was checking the wrong thing

`scripts/user-journey-contract.py` had two journeys starting at `/` and passed
throughout, because `resolves()` accepted a `vercel.json` rewrite whose
`source` was `/` as proof the root resolved. **It was not proof.** A gate that
asserts a rewrite exists cannot observe whether it applies. It now checks the
filesystem for `index.html` and refuses the rewrite as evidence. Control:
moving `index.html` aside makes it exit 1 naming both journeys; restoring it
returns PASS.

### The fabric: adopted, not duplicated

`core/intelligence_fabric/` had landed on `main` in thirteen commits
(`c72df1fc`…`31f9180d`) — 420 lines of typed, dependency-free primitives: an
execution boundary, a policy firewall, a model router, a proof engine, a skill
registry, an evidence matrix. All six were **empty containers**. Nothing in the
repository ever constructed an `IntelligenceFabric` with real agents or an
`EvidenceMatrix` with real points, so the fabric could not observe anything,
and `scripts/omega_fabric_audit.py` asserted only that nine files existed and
parsed before printing `FABRIC_AUDIT=PASS files=9` — a syntax check wearing an
audit's name, green throughout the 404 above.

It also ran that whole job on `--help`, so **`main` was red**:

```
FAIL: test_every_script_answers_help_from_its_docstring
omega_fabric_audit.py: --help printed something other than its docstring (ran the job?)
```

Rather than build a second fabric, `omega_fabric_audit.py` was rewritten to
*drive* those primitives against the platform's real state, across the three
evidence planes this repository already proves things in and never joined:

| point | plane | what it reads |
|---|---|---|
| SRC-01 | source | `index.html` on disk, and no `/` rewrite shadowing it |
| SRC-02 | source | the nine fabric modules parse (the old gate, at its real weight) |
| SRC-03 | source | 15 capabilities × 6 contract fields, none empty |
| SRC-04 | source | the real 12 agents from `omega-agents.json` bound to the boundary — each authorizes its own domain and is **refused a foreign tool** |
| SRC-05 | source | `PolicyFirewall`'s 5 irreversible tools blocked without approval, released with it, read path open |
| RND-01 | render | capability entrypoint files exist; verdict stays UNVERIFIED |
| LIVE-01/02 | live | age of `live-schema.json` / `remote-migrations.json` |
| LIVE-03 | live | capabilities whose `live_verification` still starts `BLOCKED` |

Two properties are deliberate. **`UNVERIFIED` is a first-class outcome**:
RND-01 cannot be promoted without a browser, and the audit reports that instead
of guessing — asserting a render it did not perform is §8.1 class 9. And
**snapshot age is evidence nothing here measured before**: CLAUDE.md warns
twice that a dated snapshot lies in both directions (on 2026-08-29
`live-schema.json` reported eight relations "absent live" and one had existed
all along), so LIVE-01/02 degrade to PARTIAL past 14 days rather than failing —
staleness is a known-unknown, not a defect.

Current matrix on this commit: `VERIFIED=8 UNVERIFIED=1`, 12 agents, 60
governed skills.

### Every point is proven able to fail

`tests/test_fabric_audit.py`, 14 cases, each planting a violator first: no
`index.html` → SRC-01 FAILED; the `/` rewrite restored → SRC-01 PARTIAL and
blocking; a deleted module and a syntax error → SRC-02 FAILED; an emptied
contract field → SRC-03 FAILED; an empty roster → SRC-04 FAILED; an entrypoint
pointed at a missing page → RND-01 FAILED; `_captured: 2020-01-01` → LIVE-01
PARTIAL **and the gate still exits 0**; a `BLOCKED` live_verification → LIVE-03
PARTIAL. Two defects the tests found in the audit itself were fixed rather than
asserted around: `--json` was appending the human `FABRIC_AUDIT=` line after
the JSON, so `| python3 -m json.tool` choked, and the `--help` assertion had
been written against a string the docstring itself quotes.

### Wiring, and one workflow removed

Registered in `scripts/contract-suite.py` as `intelligence-fabric`, so it runs
blocking in the one list `contracts.yml` and `ci-local.sh` both read.
`tests/` was discovered only by `omega-intelligence-fabric.yml`, behind a
`paths:` filter on `core/**` — so editing `omega-agents.json` or
`docs/capabilities/registry.json` could break the fabric tests with nothing
noticing. `ci.yml` and `ci-local.sh` now both discover `tests/`, which makes
that hosted-lane workflow entirely redundant, and it was removed (13 workflows
→ 12).

Gates: `./scripts/ci-local.sh` **23/23** blocking (was 22), `contract-suite.py`
**17** gates, **201** tests in `scripts/tests` + **22** in `tests/`,
`scripts/audit.py` 0 critical / 7 warnings, `omega-registry.py --check` matches
(189 pages), `node scripts/verify-runtime.js` **PASS on 13 pages**.

---

## 87. Two fixed bottom bars at the same z-index made the cookie consent controls unclickable

**Date:** 2026-09-05
**Reported by:** the owner, in the same photograph as entry 86 — the consent
text cut off mid-sentence, its buttons behind the install prompt.

### Measured, not inferred

`omega-legal.js:68` and `omega-pwa.js:41` both inject

```
position:fixed; bottom:0; left:0; right:0; z-index:9990
```

— identical anchoring, identical stacking context, neither module aware of the
other. At equal `z-index` the later paint wins outright. Rendered at 1280×800
on the front door, with `beforeinstallprompt` dispatched (headless Chromium
never fires it; the event is exactly what `omega-pwa.js:197` listens for) and
its 12 s `SHOW_DELAY` elapsed:

```
consent  top 720  h 80   z 9990  fixed
install  top 739  h 61   z 9990  fixed
overlap  61px
omega-consent-accept     -> BLOCKED by #pwa-dismiss-btn
omega-consent-essential  -> BLOCKED by #pwa-install-btn
pwa-install-btn          -> reachable
```

Both consent controls were unreachable: a click landed on the install banner.
Since `omega-legal.js` removes `#omega-consent` only from those two click
handlers, the consent banner could also never be dismissed.

### The fix

Consent outranks the install invitation, and that is not a preference — it is a
legal gate whose controls must work. `omega-pwa.js`'s `showBannerIfEligible()`
now defers while `#omega-consent` is on screen and resumes when it goes, via a
`MutationObserver` on `document.body` (one edge to observe, no interval to
leak; guarded on `document.body` existing, per §8.1 class 5a). Raising a
`z-index` was rejected: it would only have hidden the other bar's text instead.

Verified in a render, fresh context per phase because the consent choice
persists in `localStorage` (§8.4):

```
while consent pending : install absent, ACCEPT ALL reachable, ESSENTIAL ONLY reachable
after ESSENTIAL ONLY  : consent gone, install banner shown (h 61, top 739)
```

The invitation is sequenced, not lost.

### A detector, because this is a class and not an incident

No static check can see this — both CSS rules are correct in isolation and only
collide once painted. `scripts/verify-runtime.js` now hit-tests every visible
interactive control and reports any occluded by an element under a **different**
`position:fixed` ancestor. That last qualifier is the whole design: without it a
full-viewport `pointer-events:none` backdrop reports against every control on
the page, which is the mistake an earlier collision scan made on 177 of 178
pages (§8.4). Advisory, not blocking — a deliberately-open modal is a
legitimate occluder.

**Control, run against the gate's own detector text rather than a paraphrase**:
with the fix in place the consent buttons are absent from its output; planting a
second `position:fixed; bottom:0; z-index:9990` bar reproduces the report
exactly —

```
omega-consent-essential <- #planted-bottom-bar
omega-consent-accept    <- #planted-bottom-bar
```

### What it found immediately — 20 more, none of them regressions

On the 13 capability entrypoints, first run:

```
TERMS, PRIVACY, COMPLIANCE, ARENA, ✶GOVERN,
CONNECT SNAPCHAT, CONNECT REDDIT   <- #omega-ticker-strip
EN AR FR ES NL ZH HI, omega-sound-btn  <- #gate
INTEL, ●ARENA                      <- #omega-voice-btn
TERMS, PRIVACY                     <- #omega-controls-dock
⌂                                  <- #om-open
```

and on the front door, `#omega-consent` itself covers the language switcher and
the sound/search buttons.

**Root cause of the class, and why it is recorded rather than fixed here.** The
bottom chrome is already stacked — by hand-tuned pixel offsets:
`omega-controls.js:59` sets `#omega-controls-dock{bottom:102px!important}` and
`omega-realtime.js:119` sets `#omega-ticker-strip{bottom:66px!important}`, both
inside `@media(max-width:760px)`. Offsets tuned for one viewport are wrong at
every other one, and none of them tracks a bar's actual height. The correct fix
is a single shared bottom inset that each dock reads, which is a change across
four modules needing its own verification across viewports and pages — see
`GAP_ANALYSIS.md` §S. Shipping half of it would trade a measured problem for an
unmeasured one.

Gates: `./scripts/ci-local.sh` 23/23 blocking, `node scripts/verify-runtime.js`
PASS on 13 pages (occlusions reported as advisory), `node --check` clean on
`omega-pwa.js` and `scripts/verify-runtime.js`.

---

## 88. The bottom chrome had five hand-tuned constants and no measurement; one shared inset replaced them

**Date:** 2026-09-05
**Found by:** entry 87's own occlusion advisory, on its first run.

### The measurement that started it

Entry 87 fixed one collision (consent × install) and its new detector reported
twenty more. Rendering `dashboard.html` at three viewports and listing every
full-width fixed bar anchored near the bottom:

```
1280x800  #omega-consent        720-800  h 80   bottom:0    z 9990
 900x700  #omega-consent        598-700  h 102  bottom:0    z 9990
          #omega-controls-dock  612-664  h 52   bottom:36   z 2000   -> 52px covered
 420x760  #omega-consent        626-760  h 134  bottom:0    z 9990
          #omega-mob            687-760  h 73   bottom:0    z 9990   -> covered entirely
          #omega-controls-dock  614-658  h 44   bottom:102  z 2000   -> 32px covered
```

`#omega-mob` is the mobile navigation. It and the consent bar were both at
`bottom:0` with the same `z-index:9990`, so on a phone the member's way out of
the page and the banner they had to dismiss were fighting for the same pixels.

Five separate hardcoded constants coordinate this: `omega-controls.js:59`
(`bottom:102px!important`), `omega-realtime.js:119` (`bottom:66px!important`),
`omega-share.js:30` (`bottom:224px`), and the four-rung desktop ladder in
`bg.js:953` (`36 / 98 / 146 / 228`, documented as `98 = 36 + 52 + 10` and so
on). Each was right at the viewport it was measured at. **None had ever been
measured against `#omega-consent`,** whose height is 80, 102 or 134 depending
on how its copy wraps — which is exactly the thing a constant cannot express.

### The fix

`omega-bottom-stack.js` measures and publishes two values on `<html>`:

- `--omega-chrome-bottom` — how far the *persistent* furniture (`#omega-mob`,
  `#omega-controls-dock`, `#omega-ticker-strip`) reaches up from the viewport
  floor. The consent and install banners set `bottom` from it, so they stack
  above the furniture instead of on it.
- `--omega-transient-bottom` — that, plus whatever banner is currently up. The
  `bg.js` ladder and `#osh-btn`'s mobile rung add it, so the whole floating
  right column steps over the banner and returns to its measured resting
  positions the moment the banner is dismissed.

The furniture never moves. Moving it instead would have stacked a 134px banner,
a 73px nav and a 44px dock into 760px of viewport and changed the resting
layout of every page for a bar that clears on one tap. No cycle is possible:
not one member of the ladder is in the measured chrome set, so shifting it
cannot change either value.

`ResizeObserver` on every measured bar, not just `resize` — the controls dock
wraps to a second row at widths no media query announces. `MutationObserver` on
`body` because the docks are injected by other modules at unpredictable times
and the approval guard reveals the shell with no resize event of its own (§8.1
class 3). Body-existence guarded (§8.1 class 5a), own guard attribute (§8.1
class 5b).

### One bug in the measurement, caught by the render

The first `extentOf()` required a bar to *touch* the viewport floor. That is
wrong: `#omega-controls-dock` already sits at `bottom:102px` to clear the mobile
nav, so it never touches the floor, scored zero, and the consent bar still
overlapped it by 44px at 420x760 and 52px at 900x700. The test that actually
means "bottom-anchored" is a resolved `bottom` length rather than `auto`.

### Verified across four viewports, not one

**Correction to the page this was measured on.** The run below was first
attributed to `dashboard.html`. It was not: those probes used a raw
`page.goto()` instead of the harness, so no signed-in Supabase stub was
installed and `bg.js`'s guard redirected the page before it rendered — §8.4's
own warning, walked into. Re-measured through
`.claude/skills/verify-in-browser/harness/session.js` with
`launch({signedIn:false})` on `index.html`, which is where a first-time visitor
actually meets the consent bar, **every figure below reproduced exactly**:

```
            inset  consent rect  on-screen  ACCEPT ALL  ESSENTIAL ONLY
1280x800     74     646-726 h80    yes       reachable   reachable
1024x600     74     446-526 h80    yes       reachable   reachable
 900x700     88     510-612 h102   yes       reachable   reachable
 420x760    146     480-614 h134   yes       reachable   reachable
```

The same run on a correctly stubbed **signed-in `dashboard.html`** shows the
consent bar absent (that member has already chosen) and the inset still
tracking real furniture — `omega-ticker-strip` at 1280/1024, plus
`omega-controls-dock` at 900, plus `omega-mob` at 420 — with **zero overlap at
all four** and `#osh-btn` reachable at every one.

Two further notes for whoever measures this next. `H.open()` calls
`dismissOverlays()`, which removes `#omega-consent` outright, so a probe that
needs to see the banner must open the page on the harness context directly.
And `#omega-genesis`, the intro veil, is `z-index:100000` over the consent
buttons — `elementFromPoint` names it, but a real `page.click()` reaches the
button and stores `omega_consent_v1`, so it is a transient overlay and not a
defect. The occlusion detector's full-viewport exclusion already ignores it.

Zero overlap between any two bars at any of them. `#osh-btn`, which had been
sitting at 664-702 inside a consent bar at 646-726, now clears it at both
1280x800 (510-548) and 420x760 (218-256).

### The detector's own false-positive pass

Entry 87's rule reported 20 controls; most were **ordinary page content** that
merely happened to lie under a bar at the current scroll offset. That is normal
and unavoidable, and it was tested rather than assumed: reserving
`padding-bottom` equal to the whole stack on `body`, `main.main` and `.main` at
once changed the count by **nothing**, because the document scrolls and a fixed
bar covers whatever is at that viewport position regardless.

So the rule was narrowed twice. The occluded control must itself be inside
fixed chrome — one piece of chrome eating another's controls is the defect;
content under a banner is not. And a full-viewport occluder is excluded, because
`approvals.html`'s `#gate` (`position:fixed; inset:0`) covers the page for any
non-owner, which is precisely what it is for, and it was the only thing left in
the report once page content was excluded.

20 → 8 → **0** across the 13 capability entrypoints.

### Proven by control, because a zero proves nothing on its own

Both controls run the gate's **own** detector text, extracted from
`scripts/verify-runtime.js` rather than paraphrased:

```
A_clean            []                                          <- dashboard, as shipped
A_planted          omega-consent-accept    <- #planted-bottom-bar
                   omega-consent-essential <- #planted-bottom-bar
B_pinned_to_zero   EN AR FR ES NL ZH HI, omega-sound-btn,
                   omega-search-btn        <- #omega-consent
```

A is entry 87's bug reproduced; B is this entry's, reproduced by setting
`--omega-chrome-bottom` back to 0. The narrowed rule still catches both.

Gates: `./scripts/ci-local.sh` 23/23 blocking, `node scripts/verify-runtime.js`
PASS on 13 pages with 0 occlusions, `scripts/audit.py` 0 critical / 7 warnings,
`omega-registry.py --check` regenerated for the new module.

---

## 89. Three indicators on the platform's main page asserted health and progress that nothing measured

**Date:** 2026-09-05
**Found by:** looking for the third fabrication shape — a hardcoded number
rendered as a member metric, with no `Math.random()` and no backdated
timestamp, which neither `commerce-contract.py` nor the seed-function scan can
see.

### The candidate pass, and its false positives

A scan for literal percentages painted into `.kpi-n`, `.bar-fill` widths and
`style.width` produced 36 candidates. Most were not findings, and saying so is
the point (§8.4 — a scanner needs its own false-positive pass):

- `width:0%` on 27 bars is an **empty initial state** later filled by JS.
- `style.width='100%'` on 5 sites is **canvas sizing**, not a metric.
- `compliance.html:45` and `vault.html:119` both show `51%` labelled
  **"MASTER STAKE (PLANNED, DORMANT)"** — honestly marked as not yet real.
- `dashboard.html:154`'s `99.9%` carries a tooltip saying the 30-day uptime
  **target** is 99.9%. A published objective, not a claimed measurement.

Three survived.

### 1. `#omega-health-bar` — a hardcoded 87 painted green

`omega-realtime.js` drew a green bar titled `Platform health: 87/100` on
`dashboard.html`, above this comment:

```js
/* Simple heuristic: green if no open incidents, yellow if score < 90, red if < 70 */
var score=87; /* default */
```

**The heuristic was never written.** Nothing counted incidents and nothing
computed a score; the comment described an intention and the code shipped a
constant.

### 2. `#health-dot` + `#health-label` — the same claim, worse

`dashboard.html:115` ships a green dot and the literal word `OPERATIONAL`.
Grepping every `.js` **and** every `.html` for a writer of either id returns
nothing. It asserted the platform was healthy whether or not it was, including
while every request the member made was failing.

### 3. `#mb-pmi` — two divergent copies of one canonical table

`dashboard.html:116` shows `PMI 87` and line 153 a `.kpi-n` of `87` labelled
`PLATFORM PMI`. Neither has a writer. Meanwhile `omega-pml.js` **owns** the
Platform Meaning Index and scores this page at **91**, with
`PLATFORM_PMI = 87` as the average. So the page's own PMI was displayed as 87
when its owner says 91 — §8.1 class 8, and the page's copy was the wrong one.

The table itself is a hand-authored self-assessment, not a computation, and it
is internally consistent: the eleven scored pages average
`960 / 11 = 87.27 → 87`, exactly the `PLATFORM_PMI` it declares. A documented
editorial rubric is legitimate; two disagreeing copies of it are not.

### The fix: derive, or say nothing

There is a real signal already recorded. `bg.js` wraps `fetch` during parse and
keeps `window.__omegaData = {inflight, ok, failed}`, counting only this
platform's own backend (`supabase.co`, `/rest/v1/`, `/auth/v1/`,
`/functions/v1/`) and treating a 4xx as an answer rather than a failure. Both
health indicators now report what the session actually observed, and
**assert nothing below one settled request** — the rule `omega-sparkline.js`
already follows in drawing no badge below two real readings. PMI now comes from
`window.OmegaPMI`, via `#mb-pmi` and a new `data-omega-pmi="page|platform"`
attribute, so the table has exactly one source.

### Verified by driving the real counters, not by reading the diff

Rendered through the harness on `dashboard.html`, then the recorder driven to
each state:

```
as rendered      mb-pmi 91 ("...91/100 for this page")
                 PLATFORM PMI 87 ("...average across 11 scored pages")
                 health AWAITING SIGNAL, dot --muted, bar "no backend request has settled yet"
12 ok / 0 failed OPERATIONAL  green   100%  "12 of 12 platform requests succeeded this session"
 7 ok / 3 failed DEGRADED     solar    70%  "7 of 10 ... (3 failed)"
 2 ok / 8 failed FAILING      crimson  20%  "2 of 10 ... (8 failed)"
 nothing settled AWAITING SIGNAL, muted, and no number claimed
```

`#health-label` carried `data-i18n="operational"`, so the binding is removed
when a measurement replaces the static string — otherwise `i18n.apply()` would
overwrite a live reading with the English literal on the next language change.

Gates: `./scripts/ci-local.sh` 23/23 blocking, `node scripts/verify-runtime.js`
PASS on 13 pages, 0 page errors on the rendered dashboard.

---

## 90. `codex.html`'s bookmarks lived only in the browser cache while their table sat live and empty

**Date:** 2026-09-05

### The gap

`public.codex_bookmarks` was applied live earlier today (migration
`20260905012909`) with RLS scoped to `auth.uid() = user_id` and a `GRANT` to
`authenticated` — both halves, so §8.1 class 6 is satisfied. Nothing ever wrote
to it. `codex.html` kept every bookmark in
`localStorage['omega_codex_bookmarks']` across three write sites, so a member's
saved knowledge died with their browser cache and was invisible on any other
device.

### The two traps checked before writing a line

**A non-primary-key unique index.** The table carries
`UNIQUE (user_id, url)`. PostgREST defaults an upsert's conflict target to the
*primary key*, and with no `id` in the payload the write would succeed exactly
once and raise `23505` on every later save of the same URL — the feature frozen
at its first bookmark, silently (§8.1 class 7). The upsert names
`onConflict:'user_id,url'` explicitly.

**A narrow CHECK on `source`.** The column allows only
`wikipedia | arxiv | openlibrary`. The page's three result builders emit exactly
those three literals — verified before wiring, because one unknown value makes
PostgREST reject the whole statement (§8.1 class 2).

### What it does, and deliberately does not do

Write-up only, matching `omega-member-state.js`: a hydrating two-way read would
race this page's synchronous render, and a render from an empty cache could
overwrite good server rows. `localStorage` remains what the page reads.

`.error` is checked on both the upsert and the delete. Supabase resolves to
`{data:null,error}` and does not throw, so a `try/catch` around either would
catch nothing (§8.1 class 1). Signed-out visitors keep working: no session
means no mirror attempt and no error.

**The success toast was left telling the truth.** `★ SAVED TO CODEX` reports the
*local* write, which really did happen. The mirror is a separate claim, so when
it fails the page says so — `SAVED ON THIS DEVICE ONLY — NOT SYNCED` — rather
than letting one toast stand for two different outcomes (§9).

### Verified through the page's own click handler, not a hand-called internal

The sandbox blocks `wikipedia.org`/`arxiv.org`/`openlibrary.org`, so no result
cards render and the save path never runs. Stubbing those three hosts through
the harness context made real cards appear with their real handlers attached;
`window.__omegaSb` is the same object the module closed over, so patching it
captures exactly what the page sends:

```
add      upsert codex_bookmarks {"onConflict":"user_id,url"}
         payload: user_id, source:"wikipedia", title, url, excerpt:null,
                  authors:null, published:null          -- local count 1
remove   delete codex_bookmarks                          -- local count 0
failure  upsert forced to {error:'permission denied'}
         -> "NOT SYNCED" shown, bookmark still stored locally
```

Zero page errors on the add and remove phases.

### A related finding, recorded rather than built

`public.signal_saves` is live, with the same RLS-and-grant shape and its own
`UNIQUE (user_id, url)`. **`signal.html` has no save feature at all** — no
`localStorage`, no bookmark control, nothing to mirror. It is a backend for a
feature that was never built. Wiring it would mean *inventing* the feature, so
it stays unwired and is recorded in `GAP_ANALYSIS.md` §S instead.

`EVIDENCE_MATRIX.md` moves `codex.html` from "1 table, 1 auth call" to
"2 tables, 2 auth calls". It was already `PARTIAL` — `profiles` was the first
table — so the class does not change; what changes is that bookmarks now
survive the cache.

Gates: `./scripts/ci-local.sh` 23/23 blocking, `check-inline-js.py` clean,
`upsert-conflict-check.py` 0 findings.

---

## 91. Seven RLS policies re-evaluated `auth.uid()` per row, and 29 indexes could never be chosen

**Date:** 2026-09-05
**Reported by:** the owner, pasting the full Supabase advisor output.

### What was actionable, and what was not

Four advisory classes were reported. Two are real defects and are fixed; two
are not defects at this scale and are recorded with the measurement rather than
"fixed" by making the database worse.

### 1. `auth_rls_initplan` — 7 policies, FIXED

`codex_bookmarks`, `focus_sessions`, `habit_logs`, `okr_key_results`,
`okr_objectives`, `signal_saves`, `wealth_snapshots` each carried one `ALL`
policy reading

```sql
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
```

Postgres re-evaluates `auth.uid()` **once per row** in that position. Wrapping
it in a scalar subquery lets the planner hoist it into an InitPlan, evaluated
once per statement.

**`ALTER POLICY`, not `DROP` + `CREATE`.** The drop/create pair leaves a window
where the table has RLS enabled and *no* policy — which denies every row to
every member until the create lands. `ALTER` is atomic and never opens that gap.

**Verified by a test that could fail.** All seven tables are empty, so
comparing member row counts proves nothing — both members see 0 whether the
policy works or not. Instead, inside a transaction that was **rolled back**,
one row was inserted per member under real impersonation
(`set local role authenticated` + `request.jwt.claims`), then read back as
member B:

```
B_sees_only_own | visible_rows 1 | which: rls-probe-b
```

Two rows existed; B saw one, their own. The other member's row was present and
filtered, so the test had something to fail on. Production data untouched.

Live advisor count for `auth_rls_initplan` after applying: **0**.

### 2. `unused_index` — 191 reported, 29 genuinely REDUNDANT, dropped

"Unused" at this scale mostly reflects near-zero traffic (9 profiles); an index
on a table nobody has queried yet is not thereby wrong, and dropping on that
basis would be guessing.

**Redundant is a different and stronger claim, and it is structural rather than
statistical**: an index whose column list is a leading prefix of another index
on the same table can never be chosen over the wider one, at any traffic level.
It costs every write and buys nothing. 29 such indexes existed — e.g.
`codex_bookmarks_user_idx` on `(user_id)` sitting under
`codex_bookmarks_user_url` on `(user_id, url)`.

Never dropped: unique indexes, primary keys, anything backing a constraint,
partial indexes, expression indexes. The migration **re-derives** the set at
execution time instead of hardcoding names, so it cannot drop something that is
not redundant when it runs, and re-running it is a no-op.

**The first version of this query reported zero.** `indkey::smallint[]` is
**zero-based**, so slicing it with 1-based bounds compared the wrong elements —
CLAUDE.md §8.4's "verify a 0 findings result is real". It was caught by hand-
checking `codex_bookmarks`, where the prefix relationship was plainly visible.
After the fix the same rule reports **0 remaining**, and that zero is real
because the identical rule found 29 minutes earlier.

### 3. `unindexed_foreign_keys` — 61, NOT fixed, and that is the correct call

Measured rather than assumed: of the 45 `public` tables carrying an unindexed
foreign key, **43 hold zero rows**. Only two have any data at all —
`ai_agents` (12 rows) and `architecture_tasks` (16).

Adding 61 indexes would convert one INFO advisory into 61 new entries under the
other one (`unused_index`), cost every write on those tables, and buy nothing
measurable on 12 rows. The advisory is right in general and wrong for this
database's size. Revisit when a table crosses a few thousand rows.

### 4. `auth_leaked_password_protection` — cannot be cleared on this plan

Confirmed live: `get_organization` reports `plan: free`. The feature is
Pro-and-above and is an Auth **dashboard** toggle — no SQL reaches it. The
threat is already mitigated client-side by `omega-password-guard.js`
(HaveIBeenPwned k-anonymity) on `account.html` and `reset.html`, with the
standing caveat that a direct Auth API call bypasses it.

### The declarations were fixed too, not just the live database

`supabase/chunk_09_new_features.sql` and `chunk_10_productivity.sql` still
*declared* `auth.uid() = user_id`, so a fresh scratch database would have been
born reproducing the advisory. All nine declarations across those two files and
their two `migrations/` copies now use the wrapped form; zero un-wrapped
`auth.uid()` remain in either.

### "Remote migration versions not found in local migrations directory"

Not reproducible: `migration-drift.py` reports **168 local = 168 remote** after
this change, with the committed snapshot regenerated. That CLI message predates
PR #260, which fixed a real 9-version gap and added the gate.

`supabase/live-schema.json` was deliberately **not** regenerated: it records
table → column lists only, and neither a policy predicate nor a dropped index
changes that. Churning 4,500 lines to encode nothing would bury the real diff.

Gates: `./scripts/ci-local.sh` 23/23 blocking, `migration-drift.py` PASS
(168/168), `audit.py` 0 critical / 7 warnings, `rls-auditor.py` 1 pre-existing
informational finding unrelated to these tables.

## 92. Main went red on a third-party merge, and one of the three failures was a scanner reading a keyword out of a string literal

**Found by** running `./scripts/ci-local.sh` on a freshly fetched `origin/main`
before starting any new work. Between `fe6f0743` and `a887870f` the Vercel
integration merged 23 commits (workflows moved to hosted runners, an agent
registry, `vercel.json` gaining `"outputDirectory": "."`, two new gate scripts,
one new migration). The result was `3 BLOCKING CHECK(S) FAILED (20 passed)` —
the §8.2 pattern exactly: *"The Vercel integration merges estate-wide PRs that
leave `main` red."* Nobody had run the local suite against the merged result.

### 92a. Two new gate scripts ran their whole job on `--help`

`scripts/omega_fabric_platform_gate.py` and `scripts/vercel_static_contract.py`
both shipped with a one-line docstring and no `--help` guard, so
`test_script_help_contract` failed with both named:

```
AssertionError: Lists differ: ['omega_fabric_platform_gate.py: --help printed
something other than its docstring (ran the job?)', ...] != []
```

This is the third recurrence of the same defect (`omega_fabric_audit.py` was
the second, earlier the same day). Both now carry the standard guard —
`if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv)`
placed *above* every other import so no work can precede it — and a real
docstring. Both docstrings now also state what the gate cannot prove, because
each was one sentence away from over-claiming: `omega_fabric_platform_gate.py`
prints `supabase_advisor_fk_remediation=IMPLEMENTED` purely from the migration
*file* being present and still containing four marker strings, which is a claim
about the repository and not about the database; `vercel_static_contract.py`
reads `vercel.json` and `index.html` on disk, which says nothing about what the
live alias serves. That distinction is the whole lesson of §8.4's front-door
entry, and both scripts now say so in the text a reader gets from `--help`.

Verified: `python3 scripts/omega_fabric_platform_gate.py --help` prints the
docstring and exits 0; the run still prints `FABRIC_PLATFORM_GATE=PASS`.
Same for `VERCEL_STATIC_CONTRACT=PASS`.

### 92b. `migration-drift` failed against a snapshot, not against the database

```
- 20260905080109 (…_omega_advisor_foreign_key_indexes_20260905.sql) has never
  been applied — `db push` would run it
```

The migration's own header claims *"Applied live 2026-09-05 via Supabase
migration version 20260905080109."* Rather than trust or dismiss that, it was
checked: `mcp__Supabase__list_migrations` returns `20260905080109` as the last
entry of the live history. **The header was accurate and the gate was reading a
stale committed snapshot** — `supabase/remote-migrations.json` still held 168
versions. Regenerated to 169; `migration-drift.py` now prints
`PASS (169 versions, local and remote agree; snapshot 2026-09-05)`.

Worth stating plainly because the instinct ran the other way: a file that
asserts it was applied is *usually* the unverified claim §9 warns about. Here
the claim was true and the checker was wrong. Verify the direction of a
disagreement before attributing it.

### 92c. `OMEGA_SKILL_REGISTRY.md` was one migration behind

`omega-registry.py --check` reported `168 → 169 (…62 → 63 timestamped)` and the
derived prose *"The 74 files added since"* → 75. Regenerated. This gate is the
only check in the repo that notices a third party editing the estate, which is
why §8.2 says never to auto-commit it in CI.

### 92d. The evidence audit had been reporting a relation named `as`

Not one of the three failures — found while regenerating
`supabase/live-schema.json`, and the more interesting bug of the four.
`evidence-audit.py`'s live-schema cross-check reported **2** relations
"declared in `supabase/`, absent from the live snapshot":
`omega_platform_events` and **`as`**.

`as` is not a table. `sql_surface()`'s table pattern is
`create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)`, and
`migrations/20260903015535_harden_future_defaults_and_rls_20260903.sql:21`
guards an event trigger with

```sql
where command_tag in ('CREATE TABLE','CREATE TABLE AS','SELECT INTO')
```

The pattern matched *inside that string literal* and captured `AS`. The file
already had `_strip_sql_comments()` — added after an earlier run reported
`above`, `alone`, `bodies`, `for` and `is` as duplicate-defined tables — so the
comment half of this class was known; the string-literal half was not. Both
halves are now closed, plus a `RESERVED` keyword set applied to all three
capture sites, so a keyword can never become a relation name even if a future
pattern reaches one. Belt and braces on purpose: without the set, the guarantee
is "no regex here ever matches a keyword", which is a promise about every
pattern this file will ever hold.

**Control, because a scanner that finds less is not automatically more
correct** (§8.4): declared relations went 121 → 120 — exactly the phantom —
and `codex_bookmarks`, `profiles`, `omega_platform_events`, `signal_saves` and
the `top_pages` *view* all still resolve. Absent-live went 2 → 0.

### 92e. The live-schema snapshot was one relation stale, dated today

`supabase/live-schema.json` carried `_captured: 2026-09-05` and 216 relations;
live has 217. The set difference was exactly one table, `omega_platform_events`
(created by `20260904194956`, after the snapshot was taken at 01:36). A date
alone is not freshness — this snapshot was stale *on the day it was dated*.
Folded in from `pg_attribute` (6 columns: `id`, `event_type`, `route`,
`actor_user_id`, `metadata`, `created_at`); `schema-dictionary.py` still
reports `OK — all client calls reference existing columns`.

**Result:** `./scripts/ci-local.sh` → `ALL 23 BLOCKING CHECKS PASSED`,
`audit.py` 0 critical / 7 warnings, `scripts/tests` 201 passing, `tests` 23
passing, `context-budget.py` PASS.

## 93. The RLS auditor blocked every PR with 39 CRITICAL findings, and the live database had none of them

**Found by** PR #267's `CI / verify` job failing at the RLS audit step, on a diff
of nine files that touched no `supabase/*.sql`. `scripts/rls-auditor.py` exits 1
with `CRITICAL — 39 RLS policy issue(s)` on a **pristine `origin/main`
worktree** at `a887870f`, so the failure was never that PR's.

### Why it appeared on 2026-09-05 and not five days earlier

`71a464db` (2026-08-31, *"ci: make security and database audits blocking
gates"*) removed `continue-on-error: true` from five audit steps in `ci.yml`.
Nothing reported it because the `CI` workflow almost never concluded on the
self-hosted Windows runner — `main`'s five most recent runs are four
`cancelled` and one still `pending`. `2017fbf5` moved primary CI to a hosted
runner; the job then ran to completion for the first time and immediately hit
the step. **The estate merge did not break this. It revealed it.**

### The live database disagreed with all 39

Before touching the scanner, the findings were checked against production
(`mcp__Supabase__execute_sql`, project `ydqhzvvoyufiiqvzcjns`):

```
policies_total              304
with_check_present          197
with_check_literally_true     0     <-- the reported shape, live count
using_literally_true         19
```

**No live policy has `WITH CHECK(true)`.** The zero is real by its own control:
the same row proves 197 policies *do* carry a WITH CHECK clause, so the
expression is being read, and the sibling predicate found 19 `USING(true)`
(CLAUDE.md §8.4 — verify a "0 findings" result is real).

All 19 `USING(true)` policies are SELECT. Only a reachable policy on a table
with `user_id` can leak between members; four qualify
(`leaderboard_snapshots`, `member_presence`, `oaths`, `member_events`), **all
empty**, and the first three are shared by design. Seven more are reachable but
have no `user_id` (catalog data: `feature_flags`, `token_catalog`,
`platform_settings`, …). The remaining eight are unreachable anyway — no SELECT
grant for `authenticated`, §8.1 class 6(c) — including `platform_owners`, which
has `USING(true)` and 2 rows and is locked out by the missing grant.

### Defect 1 — the clause search ran to the end of the file

`parse_rls_policies()` searched for `USING (` and `WITH CHECK (` in
`content[start_pos:]`, the whole remainder of the file. A policy with no
`WITH CHECK` therefore inherited the **next** policy's. Proven, not inferred —
`supabase/refinements.sql:8` is

```sql
create policy "owner reads publications" on public.publications
  for select to authenticated using (public.is_platform_owner());
```

with no `WITH CHECK` and no possibility of one (Postgres rejects `WITH CHECK`
on `FOR SELECT`). The parser reported `with_check='true'`, scavenged from
line 10. A `statement_end()` helper now bounds the search at the terminating
`;`, skipping semicolons inside parentheses and string literals, and a
`WITH CHECK` matched on a SELECT or DELETE policy is discarded as a parse error
rather than reported as SQL.

### Defect 2 — "unconditional" was judged without reading `USING`

`chunk_05_migrations.sql:39` is
`for update ... using (public.is_platform_owner()) with check (true)` and was
reported as *"grants unconditional UPDATE to authenticated"*. `USING` restricts
the rows the statement may touch, so this lets the **owner** write any value
into rows only the owner can reach. The finding now requires that the policy is
an INSERT (which has no `USING` clause at all, so `WITH CHECK` is the only
gate — the genuine §8.1 class 6(b) shape) or that its `USING` is absent or
`true`. The duplicate second finding for the same condition on a `user_id`
table is folded into one message.

This is CLAUDE.md §8.4's *"Classifying a policy by substring is not reading
it"*, in the opposite direction: there a classifier called an owner-gated
policy owner-only and missed a second branch; here it ignored the gate entirely.

### What survived, and what it turned out to be

39 → **6**, every one an INSERT policy whose only gate is `WITH CHECK(true)`.
Each was then checked against live, and **all six are already correctly scoped
in production**:

| table | flat bag declared | live enforces |
|---|---|---|
| `capability_kpi_log` | `WITH CHECK(true)` | `is_platform_owner()`; `authenticated` has no INSERT |
| `policy_eval_log` | `WITH CHECK(true)` | `is_platform_owner()`; no INSERT grant |
| `platform_metrics` | `WITH CHECK(true)` | a validating predicate; no INSERT grant |
| `telemetry_events` | `WITH CHECK(true)` | `(select auth.uid()) = user_id` |
| `platform_events` | `WITH CHECK(true)` | `(select auth.uid()) = user_id` |
| `threat_events` | `WITH CHECK(true)` | `is_platform_owner() OR user_id = (select auth.uid())` |

So production was never exposed — but a database built from the repository
would have been **born** with unconditional INSERT on three tables carrying
`user_id`. The six declarations were aligned with the predicates live already
enforces, in the flat bag **and** their `migrations/` copies (`0061`, `0065`,
`0066`, `0067`) — the same both-copies rule entry 91 followed, and the
`migrations/` copies matter because `rls-auditor.py` globs `supabase/*.sql`
only and never sees them. **No live policy was changed by this entry.**

### The gate still fails on a real violator

Five tests added to `scripts/tests/test_rls_auditor.py` (6 → 11), each planting
its case: the `refinements.sql` clause-bleed shape, the owner-gated UPDATE, an
unscoped INSERT on a `user_id` table (**must** exit 1), an `USING(true)` UPDATE
(must exit 1), and one asserting exactly one finding per policy rather than two.
Without the two violators the first three tests would be satisfied by an
auditor that reports nothing at all.

### A second divergence, found while measuring the first

All **five** audits blocking in `ci.yml:121-146` sit in `ci-local.sh` under a
header reading *"advisory (never blocks a merge)"*, with `|| true` swallowing
their exit codes — so the local script printed `ALL 23 BLOCKING CHECKS PASSED`
on a tree GitHub rejects. Measured now: `schema-dictionary` 0, `rls-auditor` 0
(this entry), `silent-failure-detector` **1**, `migration-consistency` **1**,
`upsert-conflict-check` 0. The header is corrected to say these block on GitHub
and to name the two still failing; they are deliberately not fixed here, being
separate changes (`silent-failure-detector`: 8 sites, one of which,
`vendor/supabase-js.js:43`, is the vendored client's own `.rpc()` and a false
positive; `migration-consistency`: 7 bag/`migrations` divergences that CLAUDE.md
§5 says need a per-table live check, never a bulk sweep).

**Result:** `rls-auditor.py` exit 0 (was 1), `./scripts/ci-local.sh`
`ALL 23 BLOCKING CHECKS PASSED`, `scripts/tests` **206** passing (was 201),
`tests` 23 passing, `audit.py` 0 critical / 7 warnings.

### 93a. The merge race recurred in a new shape: a force-push to an already-open PR

The RLS fix above was first delivered by **amending** the single commit of the
open PR #267 (`df6fa6c2` → `0ae2f7a2`) and force-pushing, precisely to preserve
the one-commit-per-PR rule that had protected #264, #265 and #266.

It did not protect this. GitHub merged #267 while the amend was in flight:

```
$ git log --oneline -2 origin/main
62cf790f Merge pull request #267 from …/claude/future-proof-infrastructure-athee6
df6fa6c2 fix: restore main to green after the estate merge, …

$ git merge-base --is-ancestor 0ae2f7a2 origin/main; echo $?
1                     # the RLS fix did NOT land
$ git merge-base --is-ancestor df6fa6c2 origin/main; echo $?
0                     # the pre-amend commit did
```

**The standing rule was wrong, or rather incomplete.** "One commit per PR"
addresses a multi-commit PR whose trailing commit is dropped. It says nothing
about *rewriting* the commit a merge has already been computed against. Both are
the same underlying race — GitHub merges the head it knew about — and a
force-push loses just as much as an extra commit does.

The corrected rule: **once a PR is open, its head is frozen.** Do not amend it,
do not force-push to it. Follow-up work is a new commit on a branch restarted
from the merged `main`, in a new PR. Amending is only safe before the PR exists.

Recovered by extracting the unmerged delta rather than redoing the work —
`git diff df6fa6c2 0ae2f7a2` is exactly the RLS change, since the amend's other
half had already merged. Branch restarted from the new `main`
(`git checkout -B <branch> origin/main`), the delta reapplied with
`git apply --3way` (13 files, all clean), re-verified: `rls-auditor.py` exit 0,
`scripts/tests` 206 passing, `ci-local.sh` 23/23.

## 94. The silent-failure gate reported 51 unchecked writes; 42 were noise and 9 were real

**Found by** `scripts/silent-failure-detector.py` exiting 1 in `ci.yml` — one of
the five audits that block on GitHub while `ci-local.sh` listed them as
"advisory" (entry 93's second half). With the RLS gate fixed, CI reached this
step for the first time.

`FOUND 51 UNCHECKED WRITE(S)` on `origin/main`. After a false-positive pass:
**51 → 9 real, all 9 fixed, gate now exits 0.**

A note on measuring: an early pass of this analysis grepped the output for
`^\s+\S+\.js:` and reported "24 findings". The scanner also scans `*.html`, so
that number was wrong by more than half. It was corrected by reading the
scanner's own `FOUND n` line instead of a filtered view of its output.

### The scanner defects — 42 findings that were not bugs

| defect | example | why it was wrong |
|---|---|---|
| No JS comment stripping | `omega-ring.js:20` | The match was `OmegaRing.update(canvas, newValue)` inside a `/* */` block documenting OmegaRing's own API. Same class as the `as` read from a SQL string literal in entry 92d. |
| Any receiver matched | `omega-confetti.js:115` | `_particles.forEach(function (p) { p.update(); … })` — a particle in a `requestAnimationFrame` loop, reported as a database write. A write now needs a Supabase receiver in the same statement. |
| `vendor/` scanned | `vendor/supabase-js.js:43` | `.rpc(e,t,n)` is the vendored client *defining* `.rpc` (CLAUDE.md §4). Third-party code is never edited here, so a finding in it can never be acted on. |
| Only looked forward | `omega-council.js:219` | The commonest correct form puts the check to the **left**: `const { error } = await sb.from(…).update(…)`. |
| `.catch()` window too small | `omega-onboard.js:106` | A fixed 200 characters, so a `.catch(function(){})` after a multi-line argument object was missed — in the file CLAUDE.md §9 names as getting this right. |
| Reads treated as writes | `get_all_members`, `get_platform_flag`, `check_trial_status` | The gate's own stated risk is a **write** silently failing. A failed read yields empty data — a different defect (§8.1 class 9) with its own gate. |
| No notion of a bound result | `omega-feedback.js:81` | `var r = await sb.rpc('submit_feedback',…)` then `if (r.data && r.data.ok) {…} else {…'Could not send.'…}` is a genuine outcome check with a failure branch; it was flagged only because the literal token `.error` does not appear. |

**A false negative was introduced and caught during this work.** Widening the
`.catch()` search to a flat 500-character window made `bg.js:1520` disappear —
an unrelated outer chain's `.catch`, six lines below, vouched for a call that
checked nothing. Hiding a real finding is worse than reporting a false one, so
the search is now bounded by the statement, tracking parenthesis depth so a `;`
inside a callback body does not end it early. `test_an_unrelated_later_catch_
does_not_vouch_for_this_call` pins it.

### The 9 real ones, all fixed

The shape that matters is a `.then()` whose callback takes **no argument**: it
runs identically on success and on `{data:null,error}`, so it cannot have
checked anything.

- **`bg.js:1640`** — the most privileged write in the file, its result
  discarded: `await sb.from('profiles').update({access_approved:true, …,
  membership_tier:9}).eq('id',uid)`. A policy, grant or constraint rejecting it
  left the owner un-elevated while execution continued to the pending-member
  count as though it had worked.
- **`bg.js:1520` and `bg.js:1563`** — `sb.rpc('expire_trial',…).then(function(){
  location.replace('/pending.html?t=expired'); })`. The member was told their
  trial had ended and redirected **whether or not the server expired it**; the
  second writes "SESSION ENDED · RESETTING PROGRESS…" before the call. The
  redirect is still correct (their time is up by the clock) so it is kept, but
  the failure is now logged instead of invisible.
- **`bg.js:1529`** — `try{ sb.rpc('ping_session'); }catch(e){}`, the literal
  §8.1 class 1 trap: the guard cannot fire because nothing throws.
- **`omega-workflow.js:103` and `:167`** — `try{ await …rpc('record_sovereign_event',
  …) }catch(e){} return {ok:true,recorded:true}`. The second asserts
  `recorded:true` unconditionally, from inside a catch that cannot see the
  failure. Both now report what actually happened.
- **`omega-notify.js:103`** — `.update({read_at:…}).then(function(){updateBadge(0);
  _count=0;})` cleared the unread badge on failure too, so it reappeared on the
  next page load.
- **`omega-graphify-integration.js:312`** — an `insert` into `notifications`
  inside a `try/catch` that logs `err`; since Supabase does not throw, the
  notification could silently not exist.
- **`omega-export.js:120`** — the GDPR export's own audit record, swallowed the
  same way.
- **`settings.html:269`** — `async function setVis(v){try{ await
  sb.rpc('set_profile_visibility',{p_public:v}); refreshPrivacy(); }catch(e){}}`.
  Now surfaces the failure in `#pv-status`, the element the neighbouring
  `refreshPrivacy()` already writes to.

### Verification

Ten tests added (7 → 17), each pairing a "must not fire" case with a violator,
because the negatives alone are satisfied by a scanner that reports nothing.
`bg.js` is the platform's single point of failure, so it was checked with
`node --check` **and** `node scripts/verify-runtime.js`: **PASS on 13 pages**,
including `settings.html`, which this entry edits.

`silent-failure-detector.py` exit 0 (was 1, 51 findings); `./scripts/ci-local.sh`
ALL 23 BLOCKING CHECKS PASSED; `scripts/tests` **216** passing (was 206).
Four of the five audits that block in `ci.yml` are now green
(`schema-dictionary`, `rls-auditor`, `silent-failure-detector`,
`upsert-conflict-check`); **`migration-consistency` remains at 1** and is the
last one, deliberately untouched here — CLAUDE.md §5 says its 7 divergences need
a per-table live-schema check rather than a bulk sweep.

## 95. `main`'s CI is red because production is 404ing, not because of a code defect

**Not a fix — a diagnosis**, recorded because the next session will otherwise
chase this failure through the code.

`Production Surface Smoke / Live production smoke test` fails on every push to
`main`:

```
Run set -euo pipefail
curl: (22) The requested URL returned error: 404
404
Error: Process completed with exit code 22.
```

`.github/workflows/production-surface-smoke.yml` runs
`curl --fail --location https://www.sydomega.com/`. Fetched 2026-09-05 11:54Z,
that URL returns **HTTP 404** serving this repo's own `404.html`
(`content-disposition: inline; filename="404"`, `last-modified` 06:50:36Z —
the pinned deployment's cached copy). `curl --fail` exits 22 on a 4xx, so the
step fails. The workflow is behaving correctly.

**Root cause is the Vercel alias pin, not the repository.** `sydomega.com` and
`www.sydomega.com` resolve to `dpl_5oRaj9jRWjd52kYqtgbuaci1w1gx`, built from
`31f9180d` — the commit *before* `index.html` existed — with
`meta.action: "redeploy"` and `isRollbackCandidate: true`. Four newer
production deployments are READY and unaliased. The dashboard shows an active
**Instant Rollback**.

**The code is correct and that is proven.** PR #267's preview deployment of the
same branch returned **HTTP 200** at `/` with `<title>Ω SYD OMEGA 91717</title>`
and all six door links, `x-vercel-cache: MISS`, `age: 0` — a fresh origin
render, not a cached artefact. Only the alias is wrong.

**No code change can clear this check.** It goes green when the rollback is
cancelled or the newest deployment is promoted — an owner action in the Vercel
dashboard, with no tool available from this session.

### The method note this earns

CLAUDE.md §8.4 already records the inverse: *"A gate that asserts a rewrite
exists cannot observe whether it fires"* — `user-journey-contract.py` passed
throughout while production served 404, because it checked a config line.
`production-surface-smoke.yml` is that lesson applied: it **fetches production**
and has been telling the truth ever since. The pairing is the point — a red
check that actually observes the live system may be reporting a real outage,
and reading it as a code defect wastes a session. Check what a gate observes
before deciding whose problem its failure is.

## 96. `graphify-ai-ingest` took the member's identity *and* the table name from the request body

**Found** while working the open-findings list, not from a failing gate — no
gate covers this. The function is **not deployed** (`list_edge_functions`
returns `{"functions":[]}`), so this is preventive: it is closed before anyone
deploys it, and before `service_role` is granted the DML that would arm it.

### The hole

```ts
const body: RequestBody = await req.json();
const { user_id, data_sources = ["task_completions"] } = body;
…
let query = supabase.from(source).select("*").eq("user_id", user_id);
```

`supabase` is built with `SUPABASE_SERVICE_ROLE_KEY`. There was **no
authentication of any kind** — no JWT check, no bearer token read. Both the
table name *and* the member being read were chosen by the caller, and every
entity/relationship written was attributed to that same body-supplied
`user_id`. Two distinct primitives: read any table filtered to any member, and
write graph rows as any member.

Unreachable today only because the function is undeployed **and**
`service_role` currently holds no DML on any public table (`FIXES_LOG.md`'s
service-role finding). Neither is a security control anyone chose.

### The fix, both halves

- **Identity from the verified JWT.** `requireCallerId()` builds an anon-key
  client carrying the caller's own `Authorization` header and calls
  `auth.getUser()` — the same idiom `rankings/` and `snapshot-leaderboard/`
  already use. No token, no user, or an error → **401**. `user_id` is removed
  from `RequestBody` entirely, so it cannot be reintroduced by accident.
- **Table name from a whitelist.** `INGESTABLE_SOURCES`, checked at the
  entrypoint (400 with the rejected names) *and* again inside
  `fetchDataSource`, which interpolates `source` into a service-key query and
  must not depend on its only caller staying correct.

### The whitelist was verified live, after a first draft that was not

The first draft was written from memory and held two wrong entries. Checked
against `pg_attribute` (2026-09-05):

| candidate | verdict |
|---|---|
| `task_completions`, `habit_logs`, `focus_sessions`, `health_logs`, `member_posts` | `user_id` + `created_at` — **included** |
| `journal_entries` | **does not exist at all** |
| `media_items` | exists, but **no `user_id`** |
| `user_journeys` | has `user_id`, **no `created_at`** — excluded |

`fetchDataSource` filters `.eq("user_id", …)` and, unless `force_full_rescan`,
`.gte("created_at", …)`. PostgREST rejects the entire query when one column is
unknown (§8.1 class 2), so each of the three rejects would have emptied the
ingest silently. `user_journeys` matters because `graphify.html`'s "journal"
checkbox sends it — it is now a visible 400 rather than a silent empty result.

### Both callers were broken, in different ways

- **`intelligence.html:488`** sent **no `Authorization` header at all** and
  passed `{user_id:u}`. Now sends the session's access token and an empty body.
- **`graphify.html:249`** sent `Authorization: Bearer ${SUPABASE_KEY}` — the
  **anon key**. `auth.getUser()` resolves no user for it, so the call
  identified nobody. Now sends `session.access_token`.
- **`graphify.html`'s response handling** fell straight through a non-2xx into
  `alert("Ingestion complete: " + result.entities_processed)`, printing
  "complete: undefined entities" — the fetch form of §8.1 class 1, and
  reachable today via the `user_journeys` 400. It now reports the failure and
  names the rejected sources.

### Verified

`npx -p typescript@5 tsc --noEmit` on the function: the first attempt found
**real syntax errors** — an edited comment block had left a stray `*/` — which
is exactly why §7.6 says to parse Edge Functions by hand, since CI does not.
After the fix, 7 errors remain, all `Cannot find module 'https://…'` /
`Cannot find name 'Deno'`; the unmodified file on `origin/main` produces **6 of
the same kinds**, the difference being one added `Deno.env.get` call. No new
error kind is introduced.

`check-inline-js.py` clean; `node scripts/verify-runtime.js` **PASS on 13
pages**; `./scripts/ci-local.sh` ALL 23 BLOCKING CHECKS PASSED.

### Left open, deliberately

`graphify.html:166` hardcodes `SUPABASE_KEY` as a **placeholder** anon key
(`…PLACEHOLDER`, and its embedded project ref `ydqhzvvoyfuiiqvzcns` is a typo
of the real `ydqhzvvoyufiiqvzcjns`), then publishes `window.OmegaSupabase =
{ sb }` — the shared accessor §8.1 class 4b records as being read by 11 files.
So that page cannot authenticate at all, and if its script runs after `bg.js`
it overwrites the good client with one built on a fake key. Not fixed here:
changing which client that page publishes is a larger change than this one.

## 97. The new `public/` build emitted a deployment missing the Supabase client on 127 pages, and its own gate had gone red

Twelve commits landed on `main` between `a8b60169` (the #271 merge) and
`4e216de3`, replacing the repo's build-free static deploy with a real build:
`vercel.json` now sets `framework: null`, `installCommand: ""`,
`buildCommand: "bash scripts/vercel-build.sh"`, `outputDirectory: "public"`,
and `scripts/vercel-build.sh` copies the web surface into `public/`. That is
what the owner's Vercel dashboard reports as a **Framework Settings Override**
— an informational notice that config-as-code beats the dashboard, not an
error. All four keys are load-bearing (`framework: null` stops preset
auto-detection, `installCommand: ""` skips npm install against the repo's
`package.json`), so the notice is expected and none of them was removed.

Three real defects were found underneath it.

### a. The build dropped `vendor/`, so 127 pages lost the Supabase client

`vercel-build.sh` copies root-level files plus a fixed directory allow-list:

```
for dir in assets static images img icons media fonts audio video css js '.well-known'; do
```

`vendor/` is not on it. Running the script on `origin/main` and sweeping the
emitted tree for local references that do not resolve inside `public/`:

```
scanned 373 emitted files
distinct broken local references in public/: 1
   127 pages -> /vendor/supabase-js.js   e.g. academy.html
```

`ls public/vendor/supabase-js.js` → `No such file or directory`, while the
script printed `VERCEL_BUILD=PASS`. §4 records why this is total rather than
partial: that file is imported at the top of a module script on every gated
page, and a top-level import that never resolves runs *none* of that module's
code. `i18n/` was dropped by the same allow-list; `i18n.js:1263` builds its
path by concatenation (`fetch('/i18n/'+lang+'.json')`), so all six language
packs would have 404'd and every member silently fallen back to English.

A build that reports success on an artifact the site cannot run is the same
defect class as §8.4's routing note — a gate asserting a config key instead of
observing a real fetch. So the fix is not only the two directory names: the
emitted tree now checks itself. Every absolute local asset path appearing in a
shipped file must resolve inside `public/`, `/vendor/supabase-js.js` and each
`i18n/*.json` are asserted by name (concatenated paths the scan cannot see),
and `/_vercel/*` is exempt because the platform injects it at the edge. The
check is grep/sed rather than Python on purpose: `.vercelignore` excludes
`*.py`, so a Python helper is not part of the deployment input.

The false-positive pass mattered. The first run reported 5, of which 2 were
`/_vercel/` (exempted), 2 were documentation comments (`sw.js:22` naming a path
v3 wrongly precached; `omega-constellation.js:13`'s usage example) — both
rewritten so a doc comment does not read as a live reference, the same shape as
§8.4's `evidence-audit.py` relation read out of a string literal — and **1 was
a genuine bug**: `time.html:386` set the desktop-notification icon to
`/icons/icon-192.png`, and there is no `icons/` directory; `manifest.json`
ships `/icon-192.png` at the root. The existing CI asset check missed it
because the path sits in a JS object literal, not a `src=`/`href=` attribute.

### b. `vercel_static_contract.py` was failing on `main`

The gate required a redirect whose `has` host is `www.sydomega.com`:

```
VERCEL_STATIC_CONTRACT=FAIL missing_www_canonicalization
exit=1
```

`4e216de3` ("serve canonical www host directly without forced apex redirect")
had removed exactly that rule six commits earlier. The gate was asserting one
particular answer rather than the property that matters — both hosts alias the
same deployment, so serving each directly is valid and so is canonicalizing
onto either one. It now classifies the configuration (`host_policy=` one of
`serve_both_hosts_directly` / `redirect_www_to_apex` / `redirect_apex_to_www`)
and fails only on `host_redirect_loop`, the one host configuration that is
always broken and that nothing downstream would catch. Control: planting both
directions into `vercel.json` produces `VERCEL_STATIC_CONTRACT=FAIL
host_redirect_loop`, exit 1. The gate had also lost its `--help` guard and ran
its whole job on `--help` (§8.4); restored.

### c. `public/` broke `content-uniqueness` for anyone who ran the build

`public/` was untracked and ungitignored, and it is a copy of all 189 pages.
`audit.py` and `omega-registry.py --check` were unaffected — checked first, and
the assumption that "the gates are corrupted" was wrong for both — but
`content-uniqueness-contract.py` was not:

```
WITH public/ present:    - duplicate page description: contracts.html, public/contracts.html   (+81 more)
WITHOUT public/:         CONTENT UNIQUENESS CONTRACT: PASS (189 HTML pages checked)
```

`.gitignore` does not help a scanner that walks the filesystem. The three gates
that walk pages already shared an exclusion set anticipating build output —
`{"node_modules", ".git", ".next", "dist", "build"}` — it simply did not know
this repo's name for it. `public` added to
`content-uniqueness-contract.py`, `page-estate-quality.py` and
`page-overlap-audit.py`, and to `.gitignore` so the artifact is never committed.

### Verification

`scripts/tests/test_vercel_static_contract.py` is new — 14 tests, every passing
case paired with a violator. It caught a weakness in the new gate immediately:
the build-marker `"unreachable_asset"` is a substring of the summary line
`unreachable_assets=`, so gutting the check still satisfied the marker; the
marker is now `"unreachable_asset=${ref}"`. Two tests pin the regression
directly — dropping `vendor` from the copy list must fail both the contract and
the build.

`scripts/tests` **216 → 230 tests**, all passing; `tests` 23 passing;
`./scripts/ci-local.sh` **ALL 23 BLOCKING CHECKS PASSED** with `public/`
present (it was 1 failing before); `node scripts/verify-runtime.js` **PASS (13
pages)**; `bash scripts/vercel-build.sh` → `VERCEL_BUILD=PASS`, html=189,
js=160, css=13, with `public/vendor/supabase-js.js` at 214,858 bytes and all
six language packs present.

### Left open

Production still 404s, and no commit in this change alters that: the Vercel
alias remains pinned to `31f9180d` by an Instant Rollback (§8.2, entry 95).
Cancelling that rollback is an owner action in the Vercel dashboard. Until it
is cancelled `Production Surface Smoke` stays red, and the corrected build
above cannot reach the domain regardless of how green CI is.
