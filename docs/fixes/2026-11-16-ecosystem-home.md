### The member's home is one composed ecosystem surface, built from real data only (2026-11-16)

**Why.** The owner asked twice for the platform to be built "as per the images and videos, not separated pages", and the reference (`assets/concept/reel-01.jpg`) is a single composed surface: agents on the left, a cinematic hero with the glowing mark, the twelve franchises, an overview, the member's standing, and a right rail with profile, wallet, news and ascension. `dashboard.html` opened on a tab bar, the Daily Three and a dock, with nothing resembling that composition, and the owner's earlier brief had the visual layer scattered across pages that did not read as one place. The mock-up the reference came from also carries figures this platform has no data for ("9,171,717 Omega", an uptime curve, a revenue chart), which is §8.1 class 9 (fabricated data rendered as fact).

**Fix.**
- `omega-ecosystem-home.js` (new, loaded by `dashboard.html`): fills a static skeleton at the top of the TODAY view. Every panel reads one real source and says plainly when it has nothing: agents from `omega-agents.json`, the franchise strip from `omega-catalog.json` and its poster assets, profile/axes/honours from the member's own `profiles` row, wallet from `my_sovereign_summary` ("A standing in the platform, not money."), news from `news` where `is_published`, activity from the member's own `activity_feed` rows, the ascension tree from the existing `chronos` scene. Text only via `textContent`; avatars only if `new URL().protocol === 'https:'`; no private column (birth date, phone, email, KYC) is selected.
- `dashboard.html`: the surface is the first child of `#l-today`. The Daily Three and the command dock moved to directly under it inside TODAY, with a "Today's three" button in the hero that targets them. The plain signet backdrop stays on OVERVIEW only.
- The hero's signet opts into the radiant look (`data-sculpt-glow="radiant"`), so `dashboard.html` is now the second and last page that does; `test_radiant_signet.py` names both.
- Self-review catch before shipping: the activity read had no owner filter and leaned on a policy of `is_public OR user_id = auth.uid()`, under a panel that says "Your first task will appear here". It now filters `user_id = auth.uid()`.

**Verified.**
- Render, headless Chromium with webfonts, signed-in stub, 1600x900: the surface starts at y=243 (first screen), 12 agents, 12 posters, `#oeh-style` injected, 0 page errors. Before the move it sat at y=908, below the fold. Defects found in the first renders and fixed: the title overflowing into the signet, the primary button rendering gold-on-gold (the global `a[href]` link colour beat the fill's text), the agent column over-tall.
- `ecomodes.js` across modes: 1440 desktop, 390 phone, 900 tablet, reduced motion, no WebGL. `docOverflowX` 0 in all five; the only elements wider than the viewport are the agent and poster strips, which scroll sideways by design; with WebGL blocked all three sculpture mounts report `fallback`; 0 errors in every run.
- `python3 -m unittest scripts.tests.test_ecosystem_home`: 17 tests. Six reintroduced faults were each caught (activity unfiltered, `innerHTML` added, `phone` added to the column list, a mount renamed, a money glyph added, `Math.random` added).
- `test_dashboard_tabs.py`: the old `DailyThreeIsNotPushedDown` class pinned the opposite design decision (the loop above everything) and was rewritten as `TodayOpensOnTheEcosystemSurface`, which records the history and the trade-off, and pins the order surface -> Daily Three -> dock, the single glowing signet, and the one-click link.

**Not done / not verified.**
- With the stub every data panel is empty (the stub returns `[]`), so the populated states of profile counts, wallet, news and activity were exercised by code reading and the empty/error states by render, not by a populated-data render.
- The member's loop now starts below the surface rather than at the top; that is a chosen trade-off, not a free one. On a 1600x900 screen the Daily Three is below the first screen.
- The page is tall (about 1,600 px of surface at 1440 wide). The reference is a single fixed-height composition; this one scrolls.
- The `board-03.jpg` four-panel command wall and applying this level to the other pages are not started.
- Production RLS was not exercised (the stub proves wiring only).
