### Doors, breadcrumbs and hub headings share one name; HOME drops its chip strip (2026-11-14)

**Why.** The six plain-word doors went live in #1283 with a known gap: the dock said GROW, the breadcrumb row under it said `Ω ASCEND`, and the page said `ASCEND`. Measured on `main` (headless Chromium, 1280): `ow-home` read `Ω COMMAND`, `Ω IDENTITY`, `Ω ASCEND`, `Ω COSMOS`, `Ω VAULT`, `Ω ORDER` on the six hubs. `dashboard.html` also carried a 17-link chip strip (`.omega-module-picker`: Beacon, Search, Notifications ... Vision) above its own content, a third row of navigation on the first page a member sees.

**Fix.**
- `nav.js` `doorOf()`: the breadcrumb row (`#omega-workspace`) starts at the door (`Ω HOME`, `Ω ME`, `Ω GROW`, `Ω UNIVERSE`, `Ω MONEY`, `Ω PEOPLE`). A section merged into a door keeps its own step (`Ω ME › LIFE › JOURNAL`); a hub no longer repeats itself as the current page. The context rail's section link uses the same name.
- `nav.js` `SECTIONS`: the five hub links read `HOME`, `GROW HOME`, `UNIVERSE HOME`, `MONEY HOME`, `PEOPLE HOME` (were `COMMAND BRIDGE`, `ASCEND WORKSPACE`, `COSMOS HUB`, `SOVEREIGN VAULT`, `ORDER WORKSPACE`).
- Hub headings lead with the plain word and keep the brand name beside it: `Ω HOME · COMMAND BRIDGE` (dashboard), `GROW` over the existing `Ω ASCEND · …` kicker (ascend), `UNIVERSE · COSMOS HUB` (cosmos), `MONEY · SOVEREIGN VAULT` (vault), `PEOPLE` over the existing `Ω ORDER / …` kicker (order). `cmd_bridge` and `vault_topbar_title` updated in `T_EN` and all six packs as `<door> · <existing translation>`.
- `omega-single-page-workspaces.js`: no chip strip on `/dashboard.html`. The other 14 hubs keep theirs; old `#module=` links on HOME still redirect.

**Verified.** Working tree, headless Chromium at 1280 and 390, signed-in stub, 14 pages:
- Breadcrumb first step: `Ω HOME`, `Ω ME`, `Ω GROW`, `Ω UNIVERSE`, `Ω MONEY`, `Ω PEOPLE` on the six hubs; `Ω ME › LIFE › JOURNAL`, `Ω GROW › ACHIEVE › ACHIEVEMENTS`, `Ω MONEY › INVEST › WALLET` on merged pages; `Ω INTEL` unchanged behind MORE.
- `dashboard.html`: `.omega-module-picker a` count 17 -> 0; the other hubs unchanged (profile 5, ascend 19, cosmos 16, vault 8, order 9, life 18, intel 15).
- Every page at both widths: 0 horizontal overflow, 0 duplicate ids, 0 page errors.
- `python3 -m unittest discover -s scripts/tests`: 1436 OK; `-s tests`: 56 OK. `python3 scripts/i18n-contract.py`: no violations.

**Not done / not verified.**
- Browser tab titles (`<title>`) still say Command Bridge, ASCEND Workspace, ORDER WORKSPACE: they feed generated page contracts and were left alone.
- `omega-search.js` still lists `ASCEND WORKSPACE` and `ORDER WORKSPACE` as search results.
- The other 14 hubs still show their chip strips (5 to 19 links each).
- `movies.html` has no breadcrumb row at all (pre-existing; not investigated).
- The translated headings are composed from existing translations and were not reviewed by a native speaker.
