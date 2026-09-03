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
