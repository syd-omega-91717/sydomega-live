### Dock on order, archive and govern; intel and order highlight their own door; nav contract runs (2026-11-05)

**Why.** Found while measuring the menu (`docs/PLATFORM_COMPLEXITY_ANALYSIS.md`), all present on the original `nav.js` and `main`:
(1) `order.html`, `archive.html` and `govern.html`, three workspace hubs a member reaches from the menu, had no
`<aside id="omega-side">`, and `nav.js` returns on its first line without it, so those pages had no dock at all;
(2) `PS` had no entry for the section home pages `order` and `intel`, so `intel.html` highlighted COMMAND;
(3) `scripts/tests/test_omega_navigation_axis_contract.js` failed on `main` and ran in no workflow, so (2) went unseen.

**Fix.** The three hubs get the same bare `<aside id="omega-side" ...>` element the other hubs use (`intel.html` pattern).
`PS` gains `order:'order'` and `intel:'intel'`. Adding the dock first made `govern.html` scroll sideways (1,512 px of content in a
1,024 px window): `body` is a flex row once the dock exists, and `main` would not shrink below the module-picker row, so all three
hubs get `min-width:0` on `main`. The Node contract test: its search text did not match hyphenated keys the source quotes
(`'simulation-arena':'arena'`), and it still required `horoscope-page -> intel`, which commit fc3accd3 removed on purpose (the page
`horoscope` maps to COSMOS), so both were corrected and `order` and `intel` added. `scripts/tests/test_nav_axis_contract_runs.py`
runs it with the unit tests so it cannot rot again.

A second regression showed only in `scripts/verify-runtime.js` (not in any gate): with the dock present, `order`, `archive` and `govern` reported
duplicate id `omega-context-rail`. `bg.js` injects `nav.js` unless it already sees a `/nav.js` tag, but on these pages the page's own tag sits
after the non-deferred `bg.js`, so `bg.js` runs first, sees none, and injects a second copy; before the dock existed the second run returned
early. The pages' own `nav.js` tags are removed (the standard path: most pages rely on `bg.js`). `govern.html` also loaded `bg.js` three times and
`omega-product-reality.js` twice, which already failed `verify-runtime.js` on `main` with duplicate ids `omega-approval-guard`, `ocl-css` and
`omega-desktop-pointer-recovery`; the repeats are removed.

**Verified.** Headless render of `order`, `archive`, `govern`, `intel` at 1280, 1024 and 390 px: 8 doors each, no horizontal
overflow in any of the 12 cases, the right door lit (ORDER, IDENTITY, GOVERN, INTEL). `node scripts/tests/test_omega_navigation_axis_contract.js`
passes. `node scripts/verify-runtime.js --pages order.html,archive.html,govern.html,intel.html`: PASS (it caught the duplicate ids above; `govern` failed it before this change too). The sideways overflow was caught by the render, not by the gates, and is the reason `min-width:0` is there.

**Not done / not verified.** Five pages the menu links still have no dock: `ad-network`, `control-plane`, `creator`, `project-studio`,
`world-shell`. `control-plane` (the Owner Deck) may be standalone on purpose, so they were left alone. Not checked on a real phone.
