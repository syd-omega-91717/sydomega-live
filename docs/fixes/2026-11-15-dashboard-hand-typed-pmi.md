### The dashboard no longer shows a hand-typed PMI score as if it were measured (2026-11-15)

**Why.** `omega-pml.js` keeps a table of per-page "PMI" scores that somebody typed (`PAGE_SCORES`, and `PLATFORM_PMI = 87` labelled "weighted average"). On 2026-09-27 the owner ruled "if any text has no role, do not show it" (`omega-pml.js:36-40`) and the topbar badge and mission banner were switched off. `dashboard.html` was not covered: it still showed `PMI 91` in the mission bar and a `PLATFORM PMI 87` tile, both filled by `hydratePMI()` from the typed table, the tile under a tooltip claiming it "Measures operational discipline, system integration depth, and sovereign coherence", which nothing computes. This is `CLAUDE.md` §8.1 class 9 (fabricated data rendered as fact). The neighbouring SLO tile already says honestly "Target only... not a measured figure".

**Fix.**
- `dashboard.html`: removed the mission-bar item and the tile (two lines, each a self-contained balanced element). `PAGE_SCORES` and `window.OmegaPMI` stay for the owner's tooling.
- Removing a tile leaves a hole in the grid, so `#kpi-platform .kpi:last-child{grid-column:span 2}`.
- **Found on the way:** `hydratePMI()` selected `[data-omega-pmi]`, but `bg.js` loads `omega-pml.js` itself with a guard attribute `data-omega-pmi="1"`, so the module wrote a score and a tooltip into its own `<script>` tag (confirmed in a render: `<script ... data-omega-pmi="1" title="Platform Meaning Index: 91/100 for this page">91</script>`). Harmless at run time, but one attribute doing two jobs (§8.1 class 5). The selector is now `[data-omega-pmi="page"],[data-omega-pmi="platform"]`; the same render afterwards shows a clean script tag.
- `scripts/tests/test_no_hand_typed_score_shown.py` (5).

**Verified.**
- Real Chromium, `dashboard.html` before (`origin/main`, pinned) and after, desktop and phone: before, "PMI" is visible in the mission bar (`...AUTH 5.3572 PMI 91`); after, it is gone. Page errors 0 on both; no horizontal overflow.
- The platform tile row is inside `l-overview`, hidden by default for the signed-in stub, so I forced it visible to compare the layout. Whether each row runs to the grid's right edge: **1280 px** before 0 short rows; tile removed alone 1 short (ends at 1016 of 1244); with the span fix 0. **390 px** before 0; removed alone 1 (189 of 350); with the fix 0. **900 px** (3 columns) was already ragged before (604); removed alone it was worse (364); with the fix it is back to 604, exactly as before.
- Mutation run: putting the mission-bar item back, putting the tile back, restoring the bare selector, switching the topbar badge on, and removing the grid rule each fail the test.
- `observatory.html`, which the tile linked to, is still in the nav (`nav.js` PS `observatory:'govern'`).

**Not done / not verified.**
- I could not see the tile row as an owner or as a member whose layout shows it: the check forced it visible, so the screenshots of that row are dim (a reveal animation mid-flight) and I judged the layout from measured edges, not from how it looks.
- The translations `platform_pmi` and `meaning_index` (`i18n.js` and six packs) are now unused; left in place rather than editing seven files for no behaviour change.
- The typed table itself is untouched, and so is the module's own comment that calls the object `OmegaPML` (it is `window.OmegaPMI`).
- The deployed site could not be viewed from this session.
