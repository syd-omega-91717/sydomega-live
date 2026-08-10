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

No other unescaped-user-input-into-`.innerHTML` instances were found in the files touched
this session (`feed.html`, `news.html`, `leaderboard.html`, `nexus.html`, `tribe.html`
confirmed already using `textContent`/escaping for other-user data in an earlier session's
sweep, per `CLAUDE.md` §8). A full re-sweep of all 170 pages was not performed in this pass —
see §5.1.

## 2. P0/P1 — Data integrity: fixed in code, not applied to a live database

| Gap | Evidence | Fix location | Live DB status |
|---|---|---|---|
| `public.notifications` table missing | `omega-notify.js` (platform-wide via `bg.js`) queries it; no `CREATE TABLE` existed anywhere | `supabase/omega_notifications_fix.sql`, `migrations/0091` | **Not applied** |
| `public.user_assets` table missing | `portfolio.html`/`vault.html` query it; no `CREATE TABLE` existed anywhere | `supabase/omega_user_assets_fix.sql`, `migrations/0089` | **Not applied** |
| `extend_trial` RPC missing | `approvals.html`'s extend button calls it; function never existed | `supabase/omega_extend_trial_fix.sql`, `migrations/0090` | **Not applied** |
| `notifications` table never populated | Table existed (once applied) but nothing inserted a row | `supabase/omega_notify_triggers.sql`, `migrations/0092` (5 RPCs now insert on event) | **Not applied** |
| Authority History chart queried wrong table | `omega-chart.js` queried nonexistent `authority_snapshots`; real table is `leaderboard_snapshots` | Table name corrected in `omega-chart.js` directly | N/A — no schema change needed, fix is live in code |

**Owner action required:** apply `supabase/migrations/0089`–`0092` (or the equivalent loose
files) via `supabase db push` or the Supabase SQL editor. This is the single highest-leverage
remaining action — it activates four already-written, already-validated fixes at once.

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

### 4.1 Silent-failure writes (2 instances, fixed this session)

`social.html`'s connect/disconnect buttons and `family.html`'s heir-toggle/remove buttons
updated UI state before/regardless of the actual database write result. Fixed to check
`.error` and alert the user on failure, matching the convention already established in
`events.html`/`automation.html`/`advertising.html` from an earlier session.

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

New finding this session (`REPOSITORY_AUDIT.md` §5) — the `PS` object literal assigns 19
page-slug keys twice; the second assignment silently wins in JS, so the first is dead code.
Confirmed by parsing the object body directly, not a guess. **Not fixed in this pass** — low
severity (sidebar highlighting only, not a data or security issue), but worth a deliberate
cleanup pass to either remove the dead first assignments or confirm each duplicate's final
value is the intended one (some may reflect an accidental second definition rather than a
considered override).

## 5. Explicitly out of scope / not verified in this pass

- **5.1** A full manual re-audit of all 170 pages for the XSS/silent-failure/missing-table bug
  classes was not performed this session — only the specific files investigated by the prior
  triage pass (`REPOSITORY_AUDIT.md` §6) and the ones touched while building these docs.
  `CAPABILITY_INVENTORY.md`'s unmarked pages are "not individually audited," not "confirmed
  clean."
- **5.2** Live-database verification of anything in §2 — no session has held credentials.
- **5.3** Supabase MCP server (`.mcp.json`, added this session) is configured but not
  authenticated — that requires an interactive `claude` session, which was confirmed
  un-completable headlessly. Once authenticated, §2's "not applied" items become directly
  actionable from a Claude Code session instead of requiring a manual SQL-editor paste.

## 6. Priority-ordered action list

1. **Apply `supabase/migrations/0089`–`0092` to the live database.** (Owner action — highest
   leverage, activates 4 already-built fixes at once.)
2. Authenticate the Supabase MCP server (`claude` → `/mcp` → approve → OAuth) so future
   sessions can verify §2 directly instead of inferring from client-code reads.
3. Decide the finance-pages persistence question (§4.2) — product decision, not code.
4. Decide whether/how to build real payment wiring for `enterprise.html` (§3.2) — business +
   legal decision, not code.
5. Clean up `nav.js`'s 19 duplicate keys (§4.4) — low severity, safe to defer.
6. Consolidate the 47 duplicate table definitions toward `supabase/migrations/` as sole
   source of truth (§3) — housekeeping, no functional urgency.
