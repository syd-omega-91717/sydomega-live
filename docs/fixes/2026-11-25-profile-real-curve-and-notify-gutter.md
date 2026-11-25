### Profile portfolio curve draws real history; notification badge no longer covers the top row (2026-11-25)

**Why.** Two defects, both reported or found while finishing the canvas work.
1. `profile.html`'s "Portfolio Performance · LIVE CURVE" drew a hard-coded array (`pts=[2.1,...,9.0]`) beside a static "ALL-TIME HIGH 9.9.9 APEX" and "PHASE 0": fabricated data shown as live (CLAUDE.md 8.1 class 9). It also measured `offsetWidth` while its pane was hidden (class 3), so on `main` its store is 0x0 and it never paints.
2. On the owner's phone (iPhone, dpr 3) the red unread badge (`omega-notify.js`, `position:fixed;top:16px;right:16px;z-index:500`, about 44x40) sat on top of the sticky `.omega-workspace` row and hid its right-most tab (the "PROJE…" crumb).

**Fix.**
- The chart now reads `leaderboard_snapshots (snapshot_date, authority)` for the signed-in member, checks `.error` before showing anything, and draws the real authority history through `OmegaCanvas.fit` (store = box x ratio). With fewer than two readings, or a failed read, it paints nothing and shows an honest "Not enough history yet" line (new i18n key `prof_portfolio_perf_empty`, English plus all six packs). "All-Time High" is the member's highest recorded authority, "Current Phase" is `profiles.matrix_phase`; both read "—" when unknown. A `ResizeObserver` on the canvas redraws when its pane is first shown.
- `omega-notify.js` sets `data-omega-notif` on `<html>` while the badge shows and injects `html[data-omega-notif] .omega-workspace{margin-right:68px}`, so the row ends left of the badge at every width.

**Verified (headless Chromium, dpr 3).** Chart: four readings paint 26% of a 1713x420 store (571x140 box x 3), ATH 4.40, PHASE 1; one reading, none, and a `42501` error paint nothing and show the empty line; control on `origin/main`: store 0x0, text "9.9.9 APEX" present. Badge: `scripts/verify-notify-badge.js` passes at 360/390/820 px and fails on `origin/main`.

**Still open.** The Supabase stub proves the client is wired, never production RLS; `leaderboard_snapshots` is member-readable per `live-grants.json` but the real series length depends on the snapshot cron.
