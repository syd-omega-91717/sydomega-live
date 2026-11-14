### Movies and Cinema listed the same twelve films on two pages (2026-11-14)

**Why.** `movies.html` (the playable wall, `data-film="01".."12"`) and `cinema.html` (`.film-card`, FILM I–XII)
list the same twelve films: a script paired them one to one and every god and title matched. The only thing
Cinema had that Movies lacked was a one-sentence description and three tags per film. The Watch tab bar added
in #1285 therefore offered FILMS and FILM GUIDE as two tabs for one catalogue. Cinema also opened with four
score tiles (`stat-auth`, `stat-a`, `stat-b`, `stat-c`: Authority and Axis A/B/C) that say nothing about films.

**Fix.**
- `movies.html`: each of the twelve tiles gains `<p class="omv-desc">` (Cinema's sentence, verbatim) and
  `<p class="omv-tags">` (genre and element). The `GATE n+` tag was **not** carried over: the Movies player
  plays every film for every member, so the tag would claim a lock that does not exist.
- Watch tab bar on `movies.html`, `cinema.html`, `series.html`: now FILMS / SERIES. `cinema.html` keeps the bar
  with neither tab current, so a member who lands there has a way back.
- `cinema.html`: the four score tiles are removed. `sid()` (line 190) already ignores a missing element, so the
  script that filled them is untouched. The file, its `data-omega-spatial-realm="cinema"` and its `nav.js`
  entry (already `'folded'`) stay; nothing was deleted.
- `scripts/tests/test_watch_tabs.py`: `TABS` is now two; three tests added (Cinema keeps the bar but is not a
  tab; every tile has a description and two tags and no GATE tag; the score-tile ids are gone).

**Verified.**
- Headless Chromium, 1280x900 and a 390x844 touch profile, three pages each: `movies.html` tabs `FILMS* SERIES`,
  12 descriptions all visible, 24 tags, 0 clipped, 0 horizontal overflow, 0 duplicate ids, 0 page errors;
  `cinema.html` tabs `FILMS SERIES` (none current), 0 `.kpi-row`, 12 film cards still present, 0 errors;
  `series.html` tabs `FILMS SERIES*`, 0 errors.
- `python3 -m unittest scripts.tests.test_watch_tabs`: 8 tests OK (includes the spatial-integration script
  running clean, the check that failed on #1285).
- `./scripts/ci-local.sh`: ALL 35 BLOCKING CHECKS PASSED.

**Not done / not verified.**
- `cinema.html` still exists and still shows the same twelve films under its own inner tabs (BY OLYMPIAN,
  BY ELEMENT, REAL MYTHOLOGY, SCIENCE). Those four views have no home on Movies yet; removing the file needs the
  owner's confirmation.
- The phone bottom bar still reads HOME / ASCEND / VAULT / COSMOS / MENU, the old names (seen in the phone
  render). Not changed here.
- The descriptions were moved, not rewritten or fact-checked against the films themselves.
- Not checked on a real phone or with a screen reader.
