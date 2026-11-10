# Which pages must be one, and which could be merged

Snapshot of 2026-11-08 over 242 root pages. The current registry records 241 canonical page contracts, while the recursive visible-copy audit scans 251 HTML pages including non-contract routes; these counts describe different inventories and must not be substituted for one another. Reproduce the purpose-overlap evidence with `python3 scripts/page-consolidation.py`. **Update, 2026-11-08: the owner said "you choose, merge without elimination"; `breath` + `meditate` is merged (below). Everything else on this page is still a recommendation.** Why nothing here was merged before: a page merge touches the menu, `nav.js`'s section map, `config/page-cores.json`, the page-contract registries, six language packs, the service-worker precache, the page-count claims and every link that points at the old address, and it needs a redirect so no bookmark breaks. That is a project to approve one batch at a time, not something to do while also fixing bugs.

## Method, and a mistake worth recording
The first attempt (score every pair on raw text and shared database tables) reported **316 candidate pairs**, and nearly all were false: two pages scored 0.77 because both carry the same page chrome and both read the `profiles` table. Removing the noise (TF-IDF word weights across the whole estate; ignoring tables that more than 12% of pages touch) left **21**, and only about eight of those are real merge candidates. The existing `scripts/page-overlap-audit.py` still has that purpose-overlap limitation (it compares 1,200 characters of raw text including inline CSS and JavaScript). `scripts/page-copy-audit.py` now separately measures exact visible copy blocks without shared chrome; it is not a semantic paraphrase detector or a substitute for the purpose-overlap analysis.

## Already one (keep it one)
| Subject | Where the single copy lives | Guard |
|---|---|---|
| Weather codes, icons, coordinates | `omega-weather.js` (two pages had different, incomplete copies) | `test_weather.py` fails if a second table appears |
| Studios films, series, games, characters, conflicts | `config/omega-studio-registry.json`, shown only through the owner-only Studio Library | `scripts/studios-presence.py` |
| Animatics of the series | the Studio Library's SCREENING ROOM tab, not a new page; its words come from the episode scripts | `test_animatic.py` |
| What exists and what remains | `docs/studios/COMPLETENESS.md`, one computation, also the library's WHAT REMAINS tab | `test_studios_presence.py` |

## Merged
| Merged | Into | How | Evidence |
|---|---|---|---|
| `meditate` | `breath` | techniques, timed sessions, pause, affirmations, streak and science text ported; `/meditate` redirects; both logs kept because other modules read them | `docs/fixes/2026-11-08-breath-meditate-merge.md`, `test_breath_merge.py` |
| `graph-anomalies`, `graph-centrality`, `graph-evidence`, `graph-explorer`, `graph-timeline`, `graphify` | `insight.html` | graph, event timeline, evidence register, centrality, anomalies, bounded-depth exploration and exports consolidated; legacy routes redirect to their matching lens; AI query/ingestion remain explicitly held | `docs/fixes/2026-11-11-insight-graph-consolidation.md`, `test_insight_legacy_routes.py` |

## The test "without elimination" gives
A merge loses nothing only if the page being removed is a subset of the one that stays. Measured on visible text, no candidate pair passes it: every source page has most of its lines to itself (trophies 23 of 27 lines are its own, expenses 66 of 75, levels 38 of 47, series 136 of 138). So each remaining merge is a port of real features, not a deletion, and carries the same cost `breath` + `meditate` did (about 25 files of links and registries plus a browser run). `movies` is not a stub either: it is a poster wall with hover video previews. `budget` + `expenses` already share their storage keys, which makes them the cheapest next port; `series` and `movies` into `cinema` should wait for the decision on the two film catalogues below.

## De-duplicated without merging

| Change | Canonical owner | Preserved experience |
|---|---|---|
| Exam and certification cards removed from the Gaming page | `academy.html` | Gaming retains playable challenges, mastery progress, and exam totals. Its science/progress surfaces link to the single Academy exam catalogue; duplicate exam cards and the unreachable legacy exam panel are removed. The two pages remain separate because learning and play are different jobs. |
| Authority formula and gate definitions consolidated | `evolution.html` | Evolution is the single visible canonical formula reference. Profile, Dashboard and Honors link to it; Approvals explains policy-based access rather than repeating the progression formula. |
| Authority formula, axis explanation and gate thresholds | `evolution.html` | Profile, Honors, Approvals, Dashboard, Academy, Gaming and Vault now show their own task-specific context and link to the canonical progression model instead of repeating the full explanation. |
| Eleven governance articles | `sovereign-covenant.html` | The member Vault no longer renders a second article catalogue; the Covenant route remains owner-only and the Vault link is revealed only after owner verification. |
| Founder covenant articles removed from the member Vault | `sovereign-covenant.html` | The Vault no longer repeats owner identity or reserved-control articles. The Covenant route and navigation are owner-only and fail closed; the Vault reveals its Covenant link only to a verified owner. |

The Gaming page no longer renders duplicate `knowledge` task cards. Completion totals continue to come from the shared `task_completions` records, not from the presence of catalogue cards in the DOM. A regression test prevents the two pages from acquiring overlapping task-card ownership again.

## Should merge (strong evidence; each is a separate batch to approve)
| Merge | Evidence | Pages saved |
|---|---|---|
| **Honors**: `honors` + `trophies` (+ `achievements` links) into one page with tabs for the Hall, Trophies, Medals, Certificates | the two read the same four tables (`certificates`, `medals`, `trophies`, `profiles`); `honors` (403 words) has **no menu entry at all** while `trophies` (193 words) is folded away, so a member can reach neither easily | 1 |
| **Knowledge graph**: `graph-anomalies`, `graph-centrality`, `graph-evidence`, `graph-explorer`, `graph-timeline`, `graphify` into `insight.html` | five live lenses plus bounded-depth relationship exploration and exports now share one graph dataset; legacy routes redirect to the matching lens; AI query/ingestion remain held by the Anthropic privacy and per-member cost gates | 6 routes consolidated, URLs preserved |
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

## Graph workspace unification — 2026-11-11

The canonical knowledge-graph workspace is **insight.html**, not graph.html. The latter is a separate Cosmos constellation experience and remains separate. Insight now owns the graph, centrality, anomaly, event timeline, and evidence-register lenses; bounded-depth exploration and JSON/evidence exports are included. Six former graph routes remain as compatibility URLs and redirect to their matching Insight lens. Graph Admin remains a separate owner-only curation surface.

Graphify AI query and ingestion are not represented as working capabilities: both Edge Functions are held and absent from the 22-function production inventory because member-content processing by Anthropic lacks the required processor disclosure and enforced per-member daily cost limit. Insight exposes this as an explicit held state rather than issuing calls to undeployed endpoints.
