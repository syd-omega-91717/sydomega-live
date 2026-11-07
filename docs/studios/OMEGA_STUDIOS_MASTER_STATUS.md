# Ω STUDIOS — master status register (2026-11-07)

Stages: DESIGNED, WRITTEN, IMPLEMENTED, TESTED, PREVIEWED, DEPLOYED, PUBLISHED. A stage is claimed only with evidence;
generated files alone are never completion. `-` means not started.

| Deliverable | Designed | Written | Implemented | Tested | Previewed | Deployed | Published | Evidence / blocker |
|---|---|---|---|---|---|---|---|---|
| Baseline audit | yes | yes | n/a | n/a | n/a | n/a | n/a | `OMEGA_STUDIOS_BASELINE_AUDIT.md`; DB and Storage unread |
| Canon registry and validator | yes | yes | yes | yes | - | - | n/a | `scripts/studio-canon-check.py`, `test_studio_canon.py` |
| Universe bible and 7 franchise bibles | yes | yes | n/a | yes (staleness test) | - | - | n/a | proposed, unapproved |
| Zodiac Wars: The Rise of Aries screenplay | yes | draft 1, ~65-80 pages | n/a | yes (`test_studio_productions.py`) | - | merged to `main` as text | no | content unapproved; short of 100 pages |
| Myth of the Stones: The Seven Stones screenplay | yes | draft 1, ~80-95 pages | n/a | yes (`test_studio_productions.py`) | - | merged to `main` as text | no | `docs/studios/franchises/myth-of-the-stones/films/the-seven-stones/`; **content founder-approved 2026-11-07**; short of the 125-140 minute target |
| Other 24 feature screenplays (26 films in all) | - | - | n/a | - | - | - | no | not started |
| Myth of the Stones series, Season 1 bible | yes | bible + 8 beat sheets (about 2,300 words) | n/a | yes (file and status checks) | - | - | no | `docs/studios/franchises/myth-of-the-stones/series/the-chronicles-of-the-guardians/season-1/BIBLE.md`; no episode script exists |
| Series episode scripts (about 150) | - | - | n/a | - | - | - | no | not started; the only story text is one-line plots in `twelve-houses-s1.json` plus the Season 1 beat sheets |
| Game design document: Myth of the Stones: Origins | yes | GDD draft 1 (about 1,900 words) | n/a | yes (status checks) | - | - | no | `docs/studios/franchises/myth-of-the-stones/games/origins/GDD.md`; defines a 3-D Vertical Slice 0, multiplayer UNAVAILABLE |
| Game design documents (3 other flagships) | - | - | - | - | - | - | no | not started |
| Playable prototype: Origins Vertical Slice 0 (3-D) | yes (page loads, 0 page errors) | 5 modules, about 1,650 lines | n/a | yes (`test_origins_logic.py`; scripted bot run to the end of the quest in headless Chromium) | - | on a branch until merged | no | `game-origins.html`; status PROTOTYPE, not PLAYABLE_SLICE: no human has played it, performance is unmeasured on real hardware (software-rendered headless run: about 14 fps), primitive-geometry art |
| Worlds layer: thrones (kings), places (city), pantheons, sky, planets | yes | `config/omega-studio-worlds.json`: 13 worlds, 15 places, 6 thrones, 5 pantheons, 4 sky events, 6 open questions | yes (`worlds.html`, in `nav.js` under MEDIA) | yes (`studio-worlds-check.py`, `test_studio_worlds.py` with planted violations; headless render at 1280 and 375 wide, 5 tabs, no page errors) | - | on a branch until merged | no | Every entry cites a source file and a status. Only Mars, Ceres and Neptune are repository canon; the other nine worlds, the Shadows and the thirteenth seat are proposals awaiting the founder. 8 places are inside the approved Seven Stones. 3 slots are OPEN on purpose |
| Studios pages (other 8 routes) | yes (audit) | - | - | - | - | - | no | `worlds.html` now covers the `/worlds.html` route; reconcile the rest with `nav.js` first |
| `studio_*` schema and RLS | - | - | - | - | - | - | no | needs live DB access and review before any migration |
| Media delivery (video, subtitles, access control) | - | - | - | - | - | - | no | Storage unread; no subtitle or streaming assets exist |
| Rights and licence records | - | - | - | - | - | - | no | none exist; third-party references are not licensed |

Open founder decisions: none of the 18 recorded conflicts is OPEN (the four that were were resolved as proposals under delegation on 2026-11-07 and remain reversible). Still needed from the founder: approval of The Rise of Aries content (The Seven Stones is approved), answers to the Season 1 and GDD open questions, and which franchise comes next.
