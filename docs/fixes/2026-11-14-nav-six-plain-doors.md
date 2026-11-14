### Menu draft: six plain-word doors, five links each (2026-11-14)

**Why.** Two independent reviewers told the owner the platform is too complicated to find your way around. Measured on `main` (`dashboard.html`, headless Chromium, signed-in stub): the desktop dock showed 7 doors named COMMAND, IDENTITY, ASCEND, COSMOS, VAULT, ORDER, INTEL whose tooltips held 5, 5, 8, 8, 8, 4 and 4 links (42); the phone drawer showed the same 7 doors with 7, 16, 20, 21, 24, 6 and 8 links (102). The door names are brand names, so a newcomer has to open each one to learn what it holds.

**Fix.** `nav.js` only, plus translations. Nothing is removed and no URL changes.
- `DOOR_LABEL` / `DOOR_I18N`: the six core doors read HOME, ME, GROW, UNIVERSE, MONEY, PEOPLE in the dock, the tooltip heading and the phone drawer. `SECTIONS`, `PS`, `OmegaAxis` and every page's own hero keep the section names.
- `CORE_SECTIONS` 7 -> 6: INTEL joins GOVERN behind MORE.
- `GROUP_COMPACT` and `COMPACT.command`: at most five links per door.
- Phone drawer: a door lists the same short set; its other links carry `ds-extra` and appear with MORE SECTIONS (`#omega-drawer:not(.ds-all) .ds-link.ds-extra{display:none}`).
- `i18n.js` `T_EN` and all six packs gain `nav_door_command|identity|ascend|vault|order`; UNIVERSE reuses `nav_sec_universe`.
- To undo: delete `DOOR_LABEL`, restore `CORE_SECTIONS` and the two compact lists.

**Verified.** Same render, HEAD pinned with `git show` vs the working tree:
- 1280: doors `HOME, ME, GROW, UNIVERSE, MONEY, PEOPLE`, tooltip links 4, 5, 5, 5, 5, 4 (28, was 42); 0 nested anchors; 0 horizontal overflow; 0 page errors.
- 390: drawer shows the same six doors with 4, 5, 5, 5, 5, 4 links (28, was 102); after MORE SECTIONS 113 links are visible, so nothing is lost; 0 overflow; 0 page errors.
- `python3 -m unittest scripts.tests.test_nav_eight_doors scripts.tests.test_nav_progressive_disclosure`: 18 tests OK. `python3 scripts/i18n-contract.py`: no violations.

**Not done / not verified.**
- The door says HOME but the page's own breadcrumb still says COMMAND, and each hub page still carries its section name (ASCEND WORKSPACE, SOVEREIGN VAULT). The labels and the pages disagree until the owner decides on the names.
- `dashboard.html` still stacks two more navigation rows above the content (a chip strip of 12+ links and a breadcrumb row). They are not owned by `nav.js` and were not touched.
- The translations of the five new labels were written by the model and not reviewed by a native speaker.
- No page was merged, retired or redesigned. 241 pages remain.
