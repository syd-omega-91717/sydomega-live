### One universe: the seven franchises anchored to the 12-chapter saga (2026-11-06)

**Why.** The slate left open whether the founder's seven franchises merge with the existing canon (`docs/SPEC_RECONCILIATION.md` §7). `media.html` already carries a 12-chapter saga (the `FILMS` array with `n`, `el`) whose elements run Fire, Water, Wind, Metal, Sand, Soul, Space, Void, The Ninth, All, Space, Omega, and its universe VI ("Zodiac Flux") and III ("Wrath of the Gods") overlap the founder's Zodiac Wars and Wrath of the Gods. The Zodiac Wars bible also put Athena on Pallas and Demeter on Ceres, while `media.html` universe III has Athena pressing Ceres.

**Fix.** Decided under the founder's delegation, reversible: one universe, the saga as chronology, each franchise a window onto chapters (`config/omega-universe-canon.json`, `docs/canon/UNIVERSE.md`). Each SLATE card now shows its saga chapters and elements. The bible's worlds follow `media.html` (Athena to Ceres, Demeter to Pluto) and it names the Solar Accord.

**Verified.** `python3 -m unittest scripts.tests.test_universe_canon scripts.tests.test_franchise_slate scripts.tests.test_zodiac_wars_canon` passes. The new test checks that the anchors cover chapters 1-12 exactly once, that elements match `media.html`, and that the cards show the same line.

**Not done / not verified.** Everything is PROPOSED and unapproved; every title stays CONCEPT. Not changed, only flagged: chapter 1 marked IN PRODUCTION on `media.html` with no evidence, "729 nodes" in chapter 12, two film sets, differing game lists. The other six franchises have no bible.
