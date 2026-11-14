### Phone bottom bar still used the old door names (2026-11-14)

**Why.** #1283 renamed the desktop dock and phone drawer to HOME / ME / GROW / MONEY / PEOPLE / UNIVERSE, and
#1284 matched breadcrumbs and hub headings to them. The phone's fixed bottom bar (`MOB5` in `nav.js`) was
missed: a phone render in the previous session still read HOME / ASCEND / VAULT / COSMOS / MENU, so the same
destination had two names on the same screen (bar says VAULT, breadcrumb says MONEY).

**Fix.** `MOB5` takes its labels from `DOOR_LABEL` and sets `data-i18n` from `DOOR_I18N`, the two tables the dock
already uses, so there is one owner for the words and the six translations already exist. Destinations, order
and the active-item logic are unchanged. The bar has five slots, so ME and PEOPLE stay in the drawer.

**Verified.**
- Headless Chromium, 390x844 touch profile: bar reads `HOME GROW MONEY UNIVERSE MENU` on dashboard, life and
  vault; active item correct (HOME on dashboard, MONEY on vault); 0 horizontal overflow; 0 page errors.
- XSS-sink ratchet: the first version built the label with an HTML string and raised `nav.js` one piece over its baseline (`xss-sink-ratchet` failed); rebuilt with `createElement`/`textContent`, ratchet passes.
- Label clipping: at 390px and 320px, no label's `scrollWidth` exceeds its `clientWidth` (UNIVERSE is the
  widest at 70px in a 76-78px cell); screenshot at 320px read by eye.
- `scripts/tests/test_nav_eight_doors.py`: 12 tests OK, including a new one pinning the bar to `DOOR_LABEL`.
- Searched `scripts/`, `.github/workflows/` and `tests/` for the literals `'ASCEND'`, `'VAULT'`, `'COSMOS'` as
  bar labels before renaming: none depend on them (the lesson from the `materialize` failure on #1285).

**Not done / not verified.**
- ME and PEOPLE are not in the bar (five slots). Reaching them on a phone is still the MENU drawer.
- Translations of the door words were machine-written in #1283 and not reviewed by a native speaker.
- Browser tab `<title>`s and `omega-search.js` still use the old names (COMMAND BRIDGE, ASCEND WORKSPACE).
- Not checked on a real phone or with a screen reader.
