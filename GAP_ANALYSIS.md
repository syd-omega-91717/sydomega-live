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
| Stored XSS in `omega-live.js`'s ticker (dormant) | `activity_feed.title` rendered raw via `.innerHTML`; RLS lets any member insert their own `is_public=true` row with an arbitrary title. Currently unreachable — no page has a `[data-live-ticker]` element yet — but `bg.js` loads this module on every page and it clearly exists to power one | **Fixed preemptively** — `esc()` added |
| Reflected XSS in `pulse.html` (external source) | `item.title` from a Reuters feed proxied via `api.rss2json.com` rendered raw via `.innerHTML` — a compromised/MITM'd feed response would execute script | **Fixed** — `esc()` added |

No other unescaped-user-input-into-`.innerHTML` instances were found in the files checked
across all sweeps this session (`feed.html`, `news.html`, `leaderboard.html`, `nexus.html`,
`tribe.html`, `graph.html`, `map.html`, `sigma.html`, `oracle.html`, `beacon.html`,
`observatory.html`, `hall.html`, `codex.html`, `chatbot.html` all confirmed clean —
`textContent`/escaping already used, or data is self-scoped, e.g. `family.html`'s
`m.sign`/`m.name` reads a private `user_id`-scoped table, not other members' data). A full
re-sweep of all 170 pages still has not been performed — four passes covering a growing
subset, not the whole set — see §5.1.

## 2. P0/P1 — Data integrity: fixed in code, not applied to a live database

| Gap | Evidence | Fix location | Live DB status |
|---|---|---|---|
| `public.notifications` table missing | `omega-notify.js` (platform-wide via `bg.js`) queries it; no `CREATE TABLE` existed anywhere | `supabase/omega_notifications_fix.sql`, `migrations/0091` | **Not applied** |
| `public.user_assets` table missing | `portfolio.html`/`vault.html` query it; no `CREATE TABLE` existed anywhere | `supabase/omega_user_assets_fix.sql`, `migrations/0089` | **Not applied** |
| `extend_trial` RPC missing | `approvals.html`'s extend button calls it; function never existed | `supabase/omega_extend_trial_fix.sql`, `migrations/0090` | **Not applied** |
| `notifications` table never populated | Table existed (once applied) but nothing inserted a row | `supabase/omega_notify_triggers.sql`, `migrations/0092` (5 RPCs now insert on event) | **Not applied** |
| Authority History chart queried wrong table | `omega-chart.js` queried nonexistent `authority_snapshots`; real table is `leaderboard_snapshots` | Table name corrected in `omega-chart.js` directly | N/A — no schema change needed, fix is live in code |
| `consult_requests` missing 3 columns `consultancy.html` sends | Form sends `{domain,contact,preferred_time,brief}`; table only had `domain`/`message`/`urgency`/`commission_rate`/`confidentiality_accepted` — every submission errored, booking flow fully non-functional | `supabase/omega_consult.sql`, `migrations/0013` (non-destructive `ALTER ADD COLUMN`) | **Not applied** |

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
| 3 files contain `DROP TABLE`/`DROP SCHEMA` | `chunk_07_migrations.sql`, `migration_runner.sql`, `omega_dispatch_reset.sql` — `audit.py` warning | **Confirmed dead, this session.** All three DROPs target only `public.dispatches` (not 3 different tables); `chunk_07_migrations.sql`'s is literally `omega_dispatch_reset.sql` pasted into a bundle file, whose own header says "run this ONLY if OMEGA_DISPATCH.sql still errors." `migration_runner.sql`'s DROP (line 5058) comes *after* two earlier `CREATE TABLE dispatches` in the same file with no recreation afterward — destructive if that file were ever run start-to-finish, but grepped CI (`ci.yml`), `scripts/`, every `.html`/`.js` page, and `supabase/functions/`: zero references to any of the three files anywhere. This matches `migrations/README.md`'s existing "must not be wired into any automated path" analysis; this entry adds the concrete grep-based confirmation that it currently isn't. |
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

### 4.6 `owner_apex_lock.sql`: dead `nodes_earned` assignment (fixed this session)

A `--` line comment on the `authority` line ran to end-of-line and silently swallowed the
following `nodes_earned = 104976` assignment as dead text — the script ran without error every
time it was manually run, it just never actually set `nodes_earned`. Fixed; validated
end-to-end against a throwaway local PostgreSQL 16 instance (`REPOSITORY_AUDIT.md` §6.12).
This file is intentionally excluded from `supabase/migrations/` and requires the owner's own
authenticated session to run correctly (`grant_permanent_access()` checks `auth.uid()`) — not
something any session in this project's history could have applied live either way.

### 4.7 `queue.html`: "RECENT DISPATCHES" panel read columns that don't exist (fixed this session)

Read `d.type`/`d.action`/`d.payload`/`d.status` from `public.dispatches`, none of which exist
(real columns: `title`/`body`/`category`/`is_published`). No error was thrown (`select('*')`
succeeds regardless), so every row silently showed type `-`, payload `{}`, status `PENDING`
— same bug class as the already-fixed `consultancy.html` missing-columns issue, but a display
mismatch rather than a write failure. Remapped to the real columns and added `esc()`.

## 5. Explicitly out of scope / not verified in this pass

- **5.1** A full manual re-audit of all 170 pages for the XSS/silent-failure/missing-table bug
  classes has still not been performed — four passes now (`REPOSITORY_AUDIT.md` §6 items 1-9,
  then items 11, 13, and 15) have each covered a growing subset, not the full set.
  `CAPABILITY_INVENTORY.md`'s unmarked pages remain "not individually audited," not "confirmed
  clean."
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
6. Continue the page-by-page sweep (§5.1) — four passes done, still not exhaustive across all
   170 pages.

`nav.js`'s duplicate keys (previously here) — done, see §4.4.
