### Movies, Cinema and Series share one Watch tab bar (2026-11-14)

**Why.** Simplification pass, first trial of joining sibling pages. Rendered on `main` (headless Chromium, 1280): `movies.html` and `cinema.html` list the same twelve films (War Sovereign ... Ocean Sovereign), one as posters and one as described cards; `series.html` lists the series; `trailers.html` renders one card reading "NO TRAILER HAS BEEN FILMED". The UNIVERSE door listed MOVIES and TRAILERS as separate entries, and none of the four pages linked to the others.

**Fix.**
- `movies.html`, `cinema.html`, `series.html`: one static `<nav class="watch-tabs">` under the page's top bar with FILMS, FILM GUIDE, SERIES; the page's own tab carries `aria-current="page"`. Plain links, no script.
- `css/omega-system.css`: `.watch-tabs` rules. The colour rules repeat that file's own `a[href]:not(.on)...` selector (line 1162, specificity 0,5,1), which otherwise tinted the active tab's text gold on a gold background.
- `nav.js`: the `movies` entry reads WATCH; `trailers` is `folded` (out of the dock and drawer; still a page, still in search, the full launcher and the media hub strip); the UNIVERSE door lists four links.

**Verified.** Working tree, headless Chromium, 1280 desktop and 390 with a touch-phone profile:
- All three pages show the bar with the right tab active: active tab `rgb(10, 10, 15)` on `rgb(201, 168, 76)`, others `rgb(184, 182, 174)`; each tab at least 82x46; bar at top 194/194/259 on desktop and 237/251/435 on the phone profile; 0 horizontal overflow; 0 page errors.
- UNIVERSE door tooltip: `UNIVERSE HOME, HOROSCOPE, CREATIVE UNIVERSE, WATCH`.
- `python3 -m unittest discover -s scripts/tests`: all pass, including the new `test_watch_tabs.py`.

**Not done / not verified.**
- The three pages are still three files; the tabs link them. They were not merged into one document.
- `movies.html` and `cinema.html` still duplicate the twelve films. Choosing one presentation is the owner's call.
- `cinema.html` still shows four platform score tiles (Authority, Axis A/B/C) above its films, and `cinema.html`/`series.html` each keep an inner tab row, so those pages show two rows of tabs.
- In a narrow DESKTOP window (390 wide, mouse pointer) 72 `page-shell` pages stack the 844px dock above the content, so the content starts at 860px. On a touch-phone profile the dock is hidden and content starts at 16px. Pre-existing on `main`; not fixed here.
