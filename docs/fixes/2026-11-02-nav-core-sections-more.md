### Navigation leads with 7 core sections; the other 8 sit behind MORE (dock and phone drawer) (2026-11-02)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Problem, measured.** Every page offered 15 top-level sections and 107 sidebar links (224 distinct pages, 236 HTML files). `nav.js` already folded 142 further entries out of the sidebar, but 15 doors on every page is more than a member can hold in their head, and the platform's brief is "less, clearer, easier".

**What changed.** The dock and the phone drawer lead with seven **core** sections: COMMAND (home), ASCEND (growth), LIFE (body and habits), VAULT (money), ORDER (people), COSMOS (the identity layer), IDENTITY (the profile). The other eight (SERVICES, INTEL, ARENA, GOVERN, INVEST, ACHIEVE, ARCHIVE, MEDIA) sit behind a MORE control. Nothing is removed: they stay in `SECTIONS`, search, the full menu, the owner deck and the reachability gate, and **the section you are in is always shown**, so you never lose your place. The choice is remembered (`localStorage['omega_nav_all']`), shared by the dock and the drawer, and a blocked store only costs the memory. The welcome tour's "navigation spine" caption now says where the rest went. Four strings (`nav_more`, `nav_less`, `nav_more_sections`, `nav_fewer_sections`) are in `T_EN` and all six packs.

**Two defects found by looking, not by the DOM check, and fixed before shipping.** (1) MORE first sat inside the scrolling section list; on a 700px window it was below the fold behind a hidden scrollbar. It is now pinned outside the list beside LOG OUT. (2) At 700px the header, seven sections, MORE and LOG OUT overflowed the dock by 57px, so the seventh section (LIFE) was clipped by the dock's own scroll area, while a window-relative check still reported it "in view". On windows up to 760px tall the small brand emblem (which duplicates the Home button above it) is hidden and item padding is tightened.

**Verified (headless Chromium, member session).** Default dock: 7 sections + MORE. MORE: 15 sections, reads LESS, `omega_nav_all=1`, survives a reload; tapping again returns to 7, `omega_nav_all=0`. Active-section rule on `invest`, `media`, `achieve`, `services`, `arena`: 8 default items plus the section you are in. All 7 core sections fit **inside the dock's own scroll area**, with MORE visible, at window heights 600, 660, 700, 760, 800 and 900. Phone drawer: 7 sections + MORE SECTIONS, 15 + FEWER SECTIONS when expanded, 0 page errors. Before this change a 700px window showed about 5 of 15 sections.

**Not done, and why.** `govern.html` and `archive.html` have no `#omega-side` container in their markup on `main` either (pre-existing), so they show no desktop dock at all; they rely on the hamburger, search and the phone drawer. Not changed here. The layout assertions (fit at 600-900px) were measured in a browser, not added to CI; `test_nav_progressive_disclosure.py` locks the source decisions. Which sections are "core" is a product judgement made from the platform's stated pillars (habits, learning, finance, community, identity); it is one array (`CORE_SECTIONS`) to change.
