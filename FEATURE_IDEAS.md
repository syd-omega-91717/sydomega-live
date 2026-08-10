# Feature Ideas — sydomega-live

**Status: proposal only.** Nothing in this file is built, scheduled, or approved. Per
`CLAUDE.md` §9, no monetizable or legally-sensitive feature ships "live" without an explicit
gating decision first — every idea below that touches money, tokens, or new data collection is
flagged accordingly. This file exists so ideas aren't re-derived from scratch each session; pick
one, discuss scope, then it becomes a real task with its own plan.

Each idea below is grounded in something already true about the codebase (a real gap, a
half-built mechanic, or an existing pattern to extend) rather than invented from nothing — see
the "Grounded in" line on each.

## 1. `member_events` read view (COMMAND / ORDER)

**Grounded in:** `GAP_ANALYSIS.md` §1's incidental finding — `events.html:199` has inserted into
`public.member_events` for at least one prior session, but no page anywhere selects from it. The
table, RLS policy, and at least one writer already exist; only the display side is missing.

**Idea:** a simple activity feed panel — "recent platform events" — reading
`member_events` ordered by `created_at`, rendered on `dashboard.html` or as its own tab on
`events.html`. Read-only, no new schema, no new RLS (the public-SELECT policy already exists).
Smallest possible scope: one `.from('member_events').select(...).order(...).limit(20)` call plus
a card list, following the existing `esc()`-escaping convention since event content would be
member-writable text.

**Why now:** it is the one item in the whole gap-analysis history that requires zero new backend
work — the data pipeline already exists and has been silently discarding writes.

## 2. Notification-triggering coverage audit → "what should notify" decision

**Grounded in:** `GAP_ANALYSIS.md` §2 — `omega_notify_triggers.sql` (not yet applied live) wires
exactly 5 RPCs (`grant_permanent_access`, `reject_member`, `revoke_member`, `extend_trial`,
`grant_trial_access`) to insert a `notifications` row. Once applied, members get notified on
access-lifecycle events but on nothing else — no notification exists yet for e.g. a new
`dispatches` broadcast, a `family.html` heir action, or a `contracts.html` commission status
change, even though `omega-notify.js` (the badge/panel UI) is already loaded platform-wide and
ready to display them.

**Idea (needs a product decision before any code):** once the pending SQL is applied and
verified live, decide which additional server-side events should insert a `notifications` row,
following the same trigger-function pattern already established. Not proposing specific events
here deliberately — that list is a product call (what's noise vs. signal for a single-owner
platform with a small membership), matching this repo's own convention against guessing at that
kind of decision.

## 3. `omega-guardian.js` gate() — either wire it or retire the badge

**Grounded in:** `CLAUDE.md` §8 — `OmegaGuardian.gate()` is fully implemented (risk-threshold
gating of privileged actions) but never called anywhere, and the topbar risk-score badge always
effectively reads "100" since nothing lowers it. This is presented to the owner as active
protection that isn't happening.

**Idea (needs an explicit decision, not a code fix):** pick a short list of genuinely
higher-stakes actions already in the codebase — e.g. `approvals.html`'s
`grant_permanent_access`/`revoke_member` calls, `enterprise.html`-style bulk actions if built —
and wrap them in `OmegaGuardian.gate()` at an agreed threshold. This is explicitly an
architecture decision (which actions, what threshold, what the denial UX looks like) per
`CLAUDE.md`'s own framing — not something to guess at and ship. The alternative (remove the
badge if it's staying unwired) is equally valid and is the owner's call, not an engineering one.

## 4. Finance-page persistence: pick a lane

**Grounded in:** `GAP_ANALYSIS.md` §4.2 / `CLAUDE.md` §8 — 7 finance pages are `localStorage`-only
while `income.html`/`ledger.html`/`portfolio.html` already persist server-side against
`public.user_assets`-adjacent tables, confirming the schema shape was intended.

**Idea (still a product decision first, per the doc's existing rule — not proposing to build
this unprompted):** if the decision comes down "sync across devices," the concrete next step
is small: extend the existing `user_assets`/`ledger`-style tables (owner-scoped RLS, same
`is_platform_owner()` pattern) rather than inventing new schema, since `portfolio.html` already
demonstrates the pattern these 7 pages would need. Listed here only so the "how" is pre-answered
once the "whether" is decided — the decision itself remains open.

## 5. `enterprise.html` pricing → actual Stripe wiring (money — needs legal/business sign-off)

**Grounded in:** `GAP_ANALYSIS.md` §3.2 — three real-looking price tiers with zero checkout
code behind them, while `supabase/functions/checkout`/`stripe-webhook` already handle the
existing subscription flow (`subscriptions.html`/`payments.html`).

**Idea:** if/when this becomes real, it's an extension of the existing Stripe integration (new
`price_id`s, reuse `checkout`/`stripe-webhook`, gate via `platform_settings`) rather than new
payment infrastructure — the hard part (webhook handling, subscription state sync) is already
built and battle-tested by the existing flow. **Explicitly not proposing to build this** —
`CLAUDE.md` is direct that a new monetizable feature needs gating + sign-off before code, and
this is squarely that case.

## 6. Consolidate the 3 divergent `SECURITY DEFINER` function forks (schema hygiene, not a feature)

**Grounded in:** `GAP_ANALYSIS.md` §3.1 — `is_platform_owner()`, `my_matrix()`, and
`apply_subscription()` each have genuinely different implementations live in different SQL
files, with no way to tell from source alone which side actually won on the live database.
`apply_subscription`'s divergence in particular risks a `42725` Stripe-webhook failure if both
overloads coexist.

**Idea:** not a new feature, but the highest-leverage "improve current" item available once
Supabase MCP access exists (`GAP_ANALYSIS.md` §5.3) — run the `pg_proc` verification query
already written in §3.1, delete the losing/stale copies, and add a lightweight CI check (extend
`scripts/audit.py`) that flags divergent — not just duplicate — function definitions going
forward, so this class of bug can't silently reoccur. This is the one idea in this file that's
close to "just do it" once the blocking dependency (DB access) is available.

## Explicitly not proposed here

Anything involving the Ω token economy, `wallet_balances`, or `transactions` — both are already
correctly identified in `CLAUDE.md`/`GAP_ANALYSIS.md` as dormant-by-design pending a legal/business
decision, and adding "ideas" for token features here would work against that decision being made
deliberately rather than by engineering momentum.
