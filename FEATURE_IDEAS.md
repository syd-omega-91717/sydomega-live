# Feature Ideas — sydomega-live

**Status: proposal only.** Nothing in this file is built, scheduled, or approved. Per
`CLAUDE.md` §9, no monetizable or legally-sensitive feature ships "live" without an explicit
gating decision first — every idea below that touches money, tokens, or new data collection is
flagged accordingly. This file exists so ideas aren't re-derived from scratch each session; pick
one, discuss scope, then it becomes a real task with its own plan.

Each idea below is grounded in something already true about this repo (verified directly in
this session, not assumed from the sibling `-_V18_SYDOMEGA91717` repo) rather than invented from
nothing — see the "Grounded in" line on each.

## 1. `member_events` read view (COMMAND / ORDER)

**Grounded in:** `events.html:199` inserts into `public.member_events` (`sb.from('member_events')
.insert(payload)`, confirmed in this repo), but no page anywhere selects from it — same
write-only gap documented in the sibling repo's gap analysis. The table, RLS policy, and writer
already exist; only the display side is missing.

**Idea:** a simple activity feed panel — "recent platform events" — reading
`member_events` ordered by `created_at`, rendered on `dashboard.html` or as its own tab on
`events.html`. Read-only, no new schema, no new RLS. Smallest possible scope: one
`.from('member_events').select(...).order(...).limit(20)` call plus a card list, following the
existing `esc()`-escaping convention since event content is member-writable text.

## 2. Notification-triggering coverage audit → "what should notify" decision

**Grounded in:** `GAP_ANALYSIS.md` §2 — the notification-trigger SQL wires a handful of
access-lifecycle RPCs to insert a `notifications` row, but nothing else in the codebase inserts
one, even though `omega-notify.js` (the badge/panel UI) is loaded platform-wide and ready.

**Idea (needs a product decision before any code):** once the pending SQL is applied and
verified live, decide which additional server-side events should insert a `notifications` row.
Not proposing specific events here deliberately — that's a product call for a single-owner
platform with a small membership, not an engineering one.

## 3. `omega-guardian.js` gate() — either wire it or retire the badge

**Grounded in:** verified directly in this repo — `omega-guardian.js` exports a `gate` function
(`gate:gate` in its returned API, line 147) but a repo-wide grep for `OmegaGuardian.gate(` across
every `.html`/`.js` file returns zero call sites. The topbar risk-score badge implies active
protection that isn't happening, same finding as the sibling repo.

**Idea (needs an explicit decision, not a code fix):** pick a short list of genuinely
higher-stakes actions already in the codebase — e.g. `approvals.html`'s
`grant_permanent_access`/`revoke_member` calls — and wrap them in `OmegaGuardian.gate()` at an
agreed threshold. Which actions, what threshold, what the denial UX looks like is an
architecture decision, not something to guess at and ship. Removing the badge instead (if it's
staying unwired) is equally valid and is the owner's call.

## 4. Finance-page persistence: pick a lane

**Grounded in:** `CLAUDE.md` §8 — the same `localStorage`-only finance pages
(`wealth.html`/`wallet.html`/`treasury.html`/`revenue.html`/`investment.html`/`expenses.html`/
`budget.html`) exist here, while `income.html`/`ledger.html`/`portfolio.html` already persist
server-side.

**Idea (product decision first — not proposing to build this unprompted):** if the decision is
"sync across devices," extend the existing `user_assets`/`ledger`-style tables (owner-scoped
RLS, same `is_platform_owner()` pattern) rather than inventing new schema. Listed here only so
the "how" is pre-answered once the "whether" is decided.

## 5. `enterprise.html` pricing → actual Stripe wiring (money — needs legal/business sign-off)

**Grounded in:** verified directly in this repo — a grep for `stripe`/`checkout`/`subscribe` in
`enterprise.html` returns zero matches, confirming the same "pricing display, no purchase flow"
gap as the sibling repo, while `supabase/functions/checkout`/`stripe-webhook` already handle the
existing subscription flow.

**Idea:** if/when this becomes real, it's an extension of the existing Stripe integration (new
`price_id`s, reuse `checkout`/`stripe-webhook`, gate via `platform_settings`) rather than new
payment infrastructure. **Explicitly not proposing to build this** — `CLAUDE.md` requires
gating + sign-off before code for exactly this case.

## 6. Consolidate divergent `SECURITY DEFINER` function forks (schema hygiene, not a feature)

**Grounded in:** `GAP_ANALYSIS.md` §3.1 — this repo's own SQL bag has the same class of risk:
`CREATE OR REPLACE FUNCTION` silently overwrites on re-apply, and the flat `supabase/*.sql`
directory has no enforced application order.

**Idea:** the highest-leverage "improve current" item available once Supabase MCP access
exists — run a `pg_proc` verification query against the live database to find which side of any
divergent function definitions actually won, delete the stale copies, and extend
`scripts/audit.py` to flag divergent (not just duplicate) function definitions going forward.

## 7. Cross-device contribution heatmap for `task_completions` (COMMAND / ASCEND)

**Grounded in:** `dashboard.html:751,753` only ever shows two aggregate counts from
`public.task_completions` (`.select('id',{count:'exact',head:true})` for "today" and "this
week") — no historical/trend view exists anywhere. Separately, `habits.html` already has a
90-day GitHub-style heatmap (`renderHeatmap()`, ~line 467, `.heatmap-legend`/`.heatmap-container`
CSS already defined) — but it is 100% `localStorage`-only: `getHabits()`/`getLogs()` read/write
`localStorage.getItem(HABITS_KEY/LOGS_KEY)` and the file contains zero `sb.from`/`sb.rpc` calls
(confirmed by grep). It never reflects the platform's real, server-side, cross-device activity
ledger, and resets on a cleared browser or a new device. That real ledger is
`public.task_completions`, RLS'd to `user_id=auth.uid()` (`supabase/matrix_engine.sql:47-51`,
`chunk_05_migrations.sql:189-196`) — and this session's own fix
(`supabase/omega_complete_task_dedup_fix.sql`, `CLAUDE.md` §8) confirmed it is now actually
persisting correctly, with a working dedup guard, across all 5 real call sites
(`omega-matrix.js`, `omega-workflow.js` ×2, `omega-progress.js`, `publishing.html`). Before that
fix, the table silently never committed anything for anyone; now that it does, there is still no
page anywhere that shows a member their own history of it beyond the two dashboard counters.

**Idea:** a read-only 90-day contribution heatmap — reusing the exact visual pattern
`habits.html` already has (same cell grid, same 4-stop gold intensity legend) — but sourced from
`public.task_completions` instead of `localStorage`. One query:
`sb.from('task_completions').select('completed_at,axis,task_name').eq('user_id',
uid).gte('completed_at', ninetyDaysAgoISO)`, bucketed by day client-side, cell intensity by
completions-per-day. Read-only, no writes, no new RLS surface — it reads the same rows the
existing dashboard counters already read, just with a trend view instead of two numbers.

**User benefit:** every approved member sees their own real activity trend (academy, gaming,
publishing, workflow/dedication tasks — whatever they've actually earned) persist across
devices, instead of two same-page counters that reset conceptually with no history. No
`membership_tier` gating needed — same access level as the existing dashboard counts (a member's
own rows only).

**Nav placement:** `command` (next to `dashboard.html`, where the two counts already live) is
the natural fit — same data, just a trend view. `ascend`/`contributions` (`nav.js`'s `PS` map
already routes `contributions` there) is the secondary candidate if the owner would rather it
live on `contributions.html` instead.

**Data needs:** none. Reads the existing, already-RLS'd `public.task_completions` table only. No
new table, no new RPC, no `platform_settings` flag — this isn't monetizable or legally
sensitive, it's a read-only visualization of data a member already generated.

**Source inspiration:** the GitHub-style contribution-graph pattern and its specific rationale in
habit/streak products — a heatmap shows *trend* ("how have I been doing lately") rather than a
streak counter's all-or-nothing *status* ("how am I doing today"), so one missed day reads as one
pale cell instead of a reset-to-zero shock:
- [GitHub-style habit tracker: why it works — init.Habits](https://inithabits.com/blog/github-style-habit-tracker)
- [Habit Tracker Widget: 7 Best Home Screen Apps (2026) — HabitBox Blog](https://habitbox.app/blog/habit-tracker-widget)
- [habit-tracker · GitHub Topics](https://github.com/topics/habit-tracker)

### Blueprint (feature-architect)

**Re-verified before designing:** `dashboard.html:751,753` still show only the two aggregate
counters; `habits.html`'s heatmap is still `localStorage`-only; `task_completions` RLS confirmed
directly this pass — `supabase/matrix_engine.sql:47-51` (`CREATE POLICY "members see own tasks"
ON public.task_completions FOR SELECT USING (user_id=auth.uid())`) and
`chunk_05_migrations.sql:189-196` both grant members read access to their own rows only, no
`is_platform_owner()` elevation needed for this read.

**Page plan — extend `dashboard.html`, no new page, no `nav.js` change.** It's already reachable
and already has the right tab: the `#l-personal` layer-panel ("PERSONAL OS · SOVEREIGN
SELF-SYSTEM", `dashboard.html:167`) is exactly where a member's own historical activity belongs,
next to the existing `personal-kpis` row and Life Wheel — not `#l-overview`, whose `k-tasks` KPI
is a platform-wide "today" count, not a personal one. Insert a new section between the two-col
Life-Wheel/Quick-Actions block (closes `dashboard.html:201`) and the "PERSONAL TOOL GRID"
`sechead` (`dashboard.html:204`):

```html
<div class="sechead" style="margin-top:16px">SOVEREIGN ACTIVITY &middot; 90-DAY CONTRIBUTION HEATMAP</div>
<div class="heatmap-wrap"><div id="contribution-heatmap"></div></div>
```

**CSS plan — page-local, matching the existing per-page convention, not a bg.js addition.**
`habits.html`, `missions.html`, and `ops.html` each already define their *own* page-local
`.heatmap*` CSS independently (confirmed by grep — no shared heatmap component exists in bg.js's
stylesheet today). Adding a fourth page-local copy to `dashboard.html`'s existing inline
`<style>` block matches that established pattern exactly; promoting it into bg.js's shared block
now would be a bigger, unrelated change (redesigning 3 other pages' already-working heatmaps to
match) that's out of scope for this feature. Copy `habits.html`'s exact cell size (9px), 4-stop
gold intensity scale, and `.heatmap-legend`/`.heatmap-legend-dot` class shapes verbatim for
visual consistency across the platform.

**Script plan — inline in `dashboard.html`, no new `omega-*.js` module.** The logic is
~25 lines, single-page, and CLAUDE.md §3 already notes this repo's default is inline `<script>`
per page (no shared component system) — a module is only warranted for cross-page/deferred-load
logic, which this isn't. Add, inside the existing top-level `async` IIFE, immediately after the
existing "Live counts" `task_completions` try/catch (`dashboard.html:~751-756`, same IIFE that
already has `s.user.id` and `pr` in scope):

```js
try{
  var ninetyAgo=new Date(Date.now()-90*864e5).toISOString();
  var hm=await sb.from('task_completions').select('completed_at').eq('user_id',s.user.id).gte('completed_at',ninetyAgo);
  renderContributionHeatmap(hm.data||[]);
}catch(e){}
```

...and a new top-level function `renderContributionHeatmap(rows)`: bucket `rows` by
`completed_at.slice(0,10)` into a day&rarr;count map, build 90 cells oldest&rarr;newest (reusing
`habits.html`'s exact 4-stop intensity thresholds), append the legend, inject into
`#contribution-heatmap`. `completed_at` is a server-set timestamp, not member-writable text, so
no `esc()`/escaping concern — nothing here renders member-controlled string content.

**Data plan:** none. No new table, RPC, or `platform_settings` flag — read-only, scoped
`eq('user_id', s.user.id)`, against the already-RLS'd table. Not monetizable, not
legally-sensitive; no gating decision needed.

**Verification plan:**
- `python3 scripts/audit.py` — must show 0 new CRITICAL (no new page/module/table, so none
  expected).
- No new standalone `.js` file exists to run `node --check` against — the new code is an inline
  `<script>` addition to an existing page, which is outside the syntax check's file selection
  (root `.js` files only) and CI check 1's scope. As a substitute, extract the new script body to
  a scratch `.js` file and run `node --check` on that copy before/after insertion as a manual
  syntax sanity check.
- No new `src=`/`href=` added — broken-asset check is unaffected.
- Full interactive verification (real login, click PERSONAL tab, confirm the heatmap renders
  against live data) requires an authenticated Supabase session this environment doesn't have —
  state that limitation plainly rather than claim it was clicked through, per `CLAUDE.md` §9's
  evidence-cited-claims rule.

## Explicitly not proposed here

Anything involving the Ω token economy, `wallet_balances`, or `transactions` — both are already
correctly identified as dormant-by-design pending a legal/business decision, and adding "ideas"
for token features here would work against that decision being made deliberately rather than by
engineering momentum.
