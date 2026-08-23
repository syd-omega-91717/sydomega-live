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
