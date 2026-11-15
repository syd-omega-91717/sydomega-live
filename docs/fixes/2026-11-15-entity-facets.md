# The character card now shows the sign as one entity, from the canon only (2026-11-15)

**Why:** the owner's principle is that sign, element, god, house, gate and honors are one entity that is power for the member, not separate services.
A read of the repo (`docs/plans/ENTITY_UNITY_PLAN.md`) found the canon already models it (`tracks[]` has 14 fields per sign) while the pages do not use it as one.

## Shipped
- `omega-character-card.js`: `facets(track, canon)` (pure) and a six-row panel (Element, God, House, Gate, Agent, Honors). Each row shows the canon's own text and links to the page that owns it.
- `omega-canon.js`: publishes `OmegaCanon.houses` (it already loaded the table and discarded it).
- 6 new tests in `test_character_card.py`; 4 of them fail on the original files.

## Measured
- Render of `character.html`: 12 of 12 signs give 6 rows; the Aries rows read "The initiating element. Drives the Mastery axis; governs gaming, conquest, leadership." and "Where a sovereign's story begins -- pure concept, personal initialization." (canon text, not mine).
- 390px: document width 390, rows end at x=338, 0 console errors.
- God and Agent rows have no second line because the canon has no text for them; nothing was written to fill the gap.

## A trap worth keeping
First render: the rows came out as one centred line. A global rule `button, [role=button], a[href], .clickable {display:inline-flex; justify-content:center; align-items:center}` (stylesheet 10) is more specific than a bare `.occ-f`.
Fix: selector `.occ .occ-f` plus explicit alignment resets; `test_row_css_beats_the_global_a_href_rule` pins it. Any new link-shaped component on this platform meets the same rule.

## Corrections
`CHARACTER_LAB_PLAN.md` said there was no element-to-axis mapping; `omega-elements.json` ties FIRE to Mastery and WIND loosely to Knowledge. Corrected in that file. A mobile screenshot taken before the fix was entirely black; a card-element screenshot after it was fine, and I did not establish why the first was black.

## Not changed
The two colliding 12-rung ladders (earned gates vs priced tiers), the missing sign-to-labor mapping and the incomplete element-to-axis mapping are the owner's decisions (`GAP_ANALYSIS.md` section S).
