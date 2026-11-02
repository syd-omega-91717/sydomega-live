### Dead tab buttons on 4 pages fixed; the dashboard opens on TODAY, not on platform metrics (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Found while making the dashboard member-first.** I changed the dashboard to open on TODAY and could not switch tabs afterwards. The same probe on an unmodified `main` showed **no tab button on the dashboard has ever worked in a test session** (click TODAY, PERSONAL, PLATFORM or SCIENCE: nothing).

**Cause 1: a listener that never installs.** `omega-tab-handler.js` wrapped its click listener in `document.addEventListener('DOMContentLoaded', ...)`. `bg.js` injects it as a dynamic script, which runs after that event has fired, so the wrapper never ran. Measured: `readyState` was `complete`, the click did nothing; re-firing `DOMContentLoaded` by hand made the same click work. The listener is attached to `document`, so it never needed to wait: it now installs immediately, behind a guard that stops a second load from replacing `registerTabHandler`. Affects `dashboard`, `achievements`, `automation`, `leaderboard`.

**Cause 2: a private function.** `achievements.html` wraps its whole script in an IIFE, so `switchTab` was private and the handler (which calls `window.switchTab`) could not reach it even with the listener working. One line exports it.

**What changed for a member.** The dashboard opens on **TODAY** (the daily loop) with OVERVIEW second, instead of nine platform KPIs and a galaxy. A `#personal`-style deep link still wins. The placeholder health bar starts neutral and no longer flashes a hard-coded green 87% before `omega-realtime.js` replaces it with the real success ratio. The headings "PLATFORM COMMAND INDEX . 14 SECTIONS" (already wrong: there are 15) and "PERSONAL SOVEREIGN TOOLS . ALL 8 MODULES" lose their counts (AGENTS.md 4.7), in the page, `T_EN` and all six packs. The TODAY tab now has a translation (`tab_today`).

**Verified (headless Chromium).** Every tab on all four pages switches (dashboard: today, overview, personal, platform, science; automation 4 of 4; leaderboard 4 of 4; achievements board, log, science with matching panels). The galaxy canvas paints when Overview is opened later (about 19,000 pixels, 4.7% of its area, by tab click and by `#overview` link): its `ResizeObserver` already handled a panel revealed after load. Phone viewport: tabs fit, no horizontal scroll. 0 page errors. `test_dashboard_tabs.py` (12 tests) was shown to fail on the old handler, the old achievements page and the old dashboard.

**How widespread is "listener registered after the event already fired"?** A trap on `document.addEventListener` that waits for the real `DOMContentLoaded` found, across 37 pages, five modules that register one late (`omega-archetype-surfaces/-motion/-system`, `omega-page-features`, `omega-data-binding`). All five also initialise immediately, so those are dead listeners, not dead features. `omega-tab-handler.js` was the only real casualty in that sample. A first version of the trap counted `defer` scripts (they run while `readyState` is `interactive`, still before the event) and over-reported; corrected before drawing conclusions.

**Not verified, not done.** (1) That tabs were dead for real members in production: the mechanism (a dynamic script finishing after parse) is how the page loads everywhere, so I think so, but I only observed it in a local test session. (2) The other 22 files that wait on `DOMContentLoaded` with no `readyState` check were not found late on the 37 pages swept, but those pages are not all 236. (3) The dashboard still carries 25+ section headers across OVERVIEW, PERSONAL, PLATFORM and SCIENCE; I changed which opens first, not what is on them. (4) The AWAITING SIGNAL / PMI figures in the top strip are unchanged.
