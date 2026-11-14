### LIFE opened on abstract copy, repeated its own links and ran 7,400px (2026-11-14)

**Why.** `life.html` (the LIFE hub, reached from the ME door) opened with a four-line slogan ("YOUR LIFE. YOUR
LEARNING. YOUR CAPACITY. YOUR WORLD.") and a paragraph about "a governed member surface". Above that sat the
hub chip strip listing 18 pages, nine of which are the nine trackers the daily log directly below it already
shows as tiles with an arrow link each (`omega-life-log.js` KINDS: mood, sleep, water, workout, meditate/breath,
gratitude, body, fasting, habits). After the log came six sections explaining how the page sources its data.
Measured in headless Chromium at 1280x900: page height 7,421px, the daily log starting at y=629 and the
member's own "add personal context" section (deep-linked from 16 places as `life.html#personal-context`) at
y=4,668.

**Fix.**
- `life.html`: heading is now "Ω ME · LIFE" / "LIFE" with one plain sentence about what the page does.
- `omega-single-page-workspaces.js`: on `/life.html` only, the nine chips the log already links to are not drawn.
  They remain in `WORKSPACES`, so the `#module=` redirect, search and the launcher still reach them.
- `life.html` + `omega-life.css`: the six explanatory sections are wrapped in one closed `<details class="life-more">`
  ("HOW THIS PAGE WORKS"). Nothing is deleted; their scripts still fill them.
- New `scripts/tests/test_life_opens_on_the_log.py` (4 tests).

**Verified.**
- Headless Chromium, 1280x900 and a 390x844 touch profile: chips 18 -> 9, h1 "LIFE", hero 428 -> 241px
  (desktop), `#personal-context` 4,668 -> 1,685px, page 7,421 -> 4,438px (desktop) / 8,307px (phone),
  disclosure closed by default with a 44px-high summary, 6 sections inside, 0 horizontal overflow, 0 duplicate
  ids, 0 page errors. After a click the disclosure opens (`open:true`) and its sections fill (8 path nodes, 8
  system cards). `life.html#personal-context` still scrolls the section to the top of the viewport.
- First attempt put the hidden-chip list in a shape `test_hub_picker_links.py` parses as a second `/life.html`
  list; that test failed and the shape was changed. Hub-picker and new tests pass.
- Existing LIFE tests (`test_omega_life_native_consolidation.js`, `test_omega_life_surface.js`) pass.

**Not done / not verified.**
- `scripts/tests/test_omega_product_reality.js` fails here, and fails on unmodified `main`: it reads
  `supabase/migrations/20261005190000_omega_product_reality_read_models.sql`, which is not in the tree. Not
  caused or fixed by this change.
- The daily log's "LOGGING OPENS WHEN LIFE IS SWITCHED ON" banner showed in the signed-out/stub render; the live
  flag was reported on in `GAP_ANALYSIS.md` but not re-checked against the live database in this session (the
  Supabase connector refused the query).
- The nine trackers are still nine separate pages with their own local data; this change removes the repeated
  links, not the pages. Folding them further needs the owner's call.
- Not checked on a real phone or with a screen reader. Hero copy is English only (no i18n keys were present).
