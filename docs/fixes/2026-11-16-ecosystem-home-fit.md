### The ecosystem home is 45% shorter: a 941px panel was a widget built for a different box (2026-11-16)

**Why.** The ecosystem home shipped in #1323 at 1,574px tall at 1440 wide, against a reference (`assets/concept/reel-01.jpg`) that is one screen. I recommended fitting it before adding more, and the owner said to continue on that basis. Measuring the boxes (`surf.js`, each `.oeh-box` rect) found one cause, not a general excess: the three-box row under the posters was **941px tall** while every other box was under 400. Its first box held `omega-constellation.js`, which is built as a minimum 860px square (`.ocn-scroll>.ocn{min-width:860px}`, `aspect-ratio:1`); in a 231px column it scrolled inside an 860px-tall box. The right tool for a full-width page, the wrong one for this box.

**Fix.**
- `renderWheel` in `omega-ecosystem-home.js` replaces it: twelve 44px medallion links around a central Ω in a 224px ring. It reads the agents list the agent panel already loaded (name, sign, href) and the same `signArt()` medallion art, so there is no second sign table (pinned by test: no literal sign name in the function). The 44px size is the platform's own tap-target floor, which the first 36px attempt silently exceeded to 44, shrinking the marks to 15px.
- The first attempt drew the existing `data-omega-emblem` SVG marks instead; they rendered but read faintly at that size, so the medallion art the agent list uses was chosen after looking at both.
- Posters: four across (`max(150px, (100% - 36px) / 4)`) instead of a fixed 210-262px width. Agent rows 46 to 40px, quick tiles 62 to 54px, the ascension tree 230 to 180px, box padding 14/16 to 12, hero copy column wider so the title fits one line.
- The three honour counts are rows instead of a three-column grid: "CERTIFICATES" was clipped to "CERTIFIC..." in a 72px tile.
- `dashboard.html`: the `omega-constellation` mount in the surface is replaced by `data-oeh="wheel"`. The page still loads `omega-constellation.js` for its other use (the agents section), so `config/omega-page-contract-bootstrap.json` did not change.

**Verified.**
- Surface height at 1440x900: **1,574 to 869 px**. Boxes after: hero 326, posters 186, the three-box row 329 (was 941), right rail 853.
- `ecomodes.js`: desktop 869 (1574), phone 390 wide 2,581 (3,354), tablet 900 wide 1,267 (1,923); reduced motion and WebGL-blocked identical to desktop; `docOverflowX` 0 in all five; 0 page errors in all five; WebGL blocked still gives `fallback` on all three sculpture mounts.
- `python3 -m unittest scripts.tests.test_ecosystem_home scripts.tests.test_dashboard_tabs scripts.tests.test_radiant_signet`: 45 tests. Three reintroduced faults caught: a literal sign name in the ring, the tap target shrunk to 36px, the posters back to a fixed width.
- `OMEGA_REQUIRE_BROWSER=1 node scripts/verify-runtime.js` run directly: PASS on 13 pages. `silent-failure-detector.py` clean.

**Not done / not verified.**
- It is shorter, not one screen. The surface starts at y=243 under the page's own header and tab bar, so at 1440x900 about 650px of it is visible without scrolling: the hero, the posters and the top of the ring row. The right rail still runs to 853px.
- Still stub data only: profile counts, wallet, news and activity were never rendered populated.
- The poster labels ("Aries . Ares / GRADE 1") sit over small art at this width; the franchise art is 16:9 where the reference's cards are portrait.
- A first-visit welcome modal from the platform overlays the page on a fresh browser profile and was present in every screenshot; it is not part of this change.
