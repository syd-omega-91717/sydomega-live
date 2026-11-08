# Which pages must be one, and which could be merged

Snapshot of 2026-11-08 over 242 pages. Reproduce the evidence with `python3 scripts/page-consolidation.py`. **Nothing here has been merged**: a page merge touches the menu, `nav.js`'s section map, `config/page-cores.json`, the page-contract registries, six language packs, the service-worker precache, the page-count claims and every link that points at the old address, and it needs a redirect so no bookmark breaks. That is a project to approve one batch at a time, not something to do while also fixing bugs.

## Method, and a mistake worth recording
The first attempt (score every pair on raw text and shared database tables) reported **316 candidate pairs**, and nearly all were false: two pages scored 0.77 because both carry the same page chrome and both read the `profiles` table. Removing the noise (TF-IDF word weights across the whole estate; ignoring tables that more than 12% of pages touch) left **21**, and only about eight of those are real merge candidates. The existing `scripts/page-overlap-audit.py` has the same flaw (it compares 1,200 characters of raw text including inline CSS and JavaScript), so its "advisory PASS" says nothing about duplication.

## Already one (keep it one)
| Subject | Where the single copy lives | Guard |
|---|---|---|
| Weather codes, icons, coordinates | `omega-weather.js` (two pages had different, incomplete copies) | `test_weather.py` fails if a second table appears |
| Studios films, series, games, characters, conflicts | `config/omega-studio-registry.json`, shown only through the owner-only Studio Library | `scripts/studios-presence.py` |
| Animatics of the series | the Studio Library's SCREENING ROOM tab, not a new page; its words come from the episode scripts | `test_animatic.py` |
| What exists and what remains | `docs/studios/COMPLETENESS.md`, one computation, also the library's WHAT REMAINS tab | `test_studios_presence.py` |

## Should merge (strong evidence; each is a separate batch to approve)
| Merge | Evidence | Pages saved |
|---|---|---|
| **Honors**: `honors` + `trophies` (+ `achievements` links) into one page with tabs for the Hall, Trophies, Medals, Certificates | the two read the same four tables (`certificates`, `medals`, `trophies`, `profiles`); `honors` (403 words) has **no menu entry at all** while `trophies` (193 words) is folded away, so a member can reach neither easily | 1 |
| **Knowledge graph**: `graph-anomalies`, `graph-evidence`, `graph-timeline`, `graphify` (and the other thin `graph-*` pages) into tabs of `graph` | each is 29 to 83 words of text over the same `graph_*` tables, every one is folded out of the menu | 4 to 8 |
| **Budget**: `budget` + `expenses` | text similarity 0.61, 74 and 112 words, `expenses` is folded | 1 |
| **Progression views**: `grid` + `levels` + `gates` | three near-identical 12-based views of the same member data, 174 to 243 words each, all folded, titles 0.67 similar | 2 |
| **Films catalogue**: `movies` (43 words) and `series` into `cinema` | all describe the same "12 Films, 12 Series, one per Olympian" list; `movies` is a stub | 2 |
| **Breath + meditation**: `breath` + `meditate` | text similarity 0.46, both folded | 1 |

That is roughly 11 to 15 pages of 242. The saving that matters is not the count: it is that a member currently has to find ten thin pages that the menu hides.

## Could merge, but decide first
- `publishing` + `studio`: same `publications` table; one drafts, the other commits. Merge only if members confuse them.
- `agents` + `sovereign-ai`, `archive` + `order` + `govern`: similar layout, different jobs; the last three are section hubs and should stay hubs.

## Must stay separate despite the overlap
- `academy` vs `gaming` (0.57 text): same tables, different purpose (learn vs play and exams). Remove the repeated sections instead of merging the pages.
- `beacon`, `points`, `gaming`, `evolution`, `ascend`: they share a table, nothing else.

## Decision for the owner, bigger than a merge
**Two parallel film universes are on the platform.** `cinema`, `movies`, `series`, `trailers`, `universe` and `chronicle` describe "12 Films, 12 Series, one per Olympian" (the Sovereign catalogue), while the Studio Library holds the 7 franchises and 26 films of the Studios canon. They are not the same list and nothing reconciles them. Until one of them is retired or mapped onto the other, a member sees two film catalogues that disagree. This PR removed only what was provably false (below); it did not choose between them.

## Repeated tags and subjects
Measured by rendering pages and counting short labels that repeat on one page (`tagscan`, 23 pages before it was stopped as too slow, so this is a sample, not a census): the repeats are per-item status chips such as BUILT x10, CONNECTED x8, LIVE ROUTE x8, 0% COMPLETE x6, START x10. Most are honest status, but ten identical chips in a row carry one fact ten times. The false ones were the trailers page: six identical "OFFICIAL TRAILER" tags and "WATCH TRAILER" buttons over videos that never existed, plus invented running times; they were replaced by one truthful panel. A platform-wide rule is a design decision, with a recommendation: **show a status chip only when it differs from its section's default, and state the default once in the section heading.** Applying it to the 50 or so pages with list-style chips is a separate batch.

## Pages with no menu entry
`honors` and `achieve` are reachable only by link; `account`, `enter`, `pending`, `reset`, `terms` and `offline` are public or auth pages and are expected to be absent; `monitoring-dashboard` is an operator page.
