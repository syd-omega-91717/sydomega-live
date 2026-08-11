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

## Explicitly not proposed here

Anything involving the Ω token economy, `wallet_balances`, or `transactions` — both are already
correctly identified as dormant-by-design pending a legal/business decision, and adding "ideas"
for token features here would work against that decision being made deliberately rather than by
engineering momentum.
