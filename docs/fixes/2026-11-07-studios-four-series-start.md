### Studios: four more series started, Season 1 bible and episode 101 each (2026-11-07)

**Why.** Only Myth of the Stones and Zodiac Wars had series material; the registry listed four other series as bare concepts (`config/omega-studio-registry.json`, `series.status` CONCEPT). The founder said to create every franchise and produce them.

**Fix.** Added a Season 1 bible and a short episode 101 for *Omega: The Human Equation*, *The Archives of Humanity*, *Galactic Thrones* and *Survivors of Tomorrow*; registry series now carry `bible`, `scripts` and status SCRIPTS_DRAFT. *The Convergence* was deliberately not started: the registry says crossovers must be earned by the other six first.

**Decisions recorded as conflicts.** C-25: *Survivors of Tomorrow* had no season counts and its franchise had no characters, so 2 x 8 and three new names (Ines Calloway, Tobias Wren, Marguerite Osei) are proposed. C-26: Nadia Ardent and Juno Ardent share a surname across two franchises; no relation is implied.

**Verified.** `studio-canon-check.py` PASS after `--write-bibles`; `studio-library.py --check` OK (13 teleplays, 65 characters); `test_studio_canon` and `test_studio_library` pass (35 tests). Two tests asserted that only Myth and Zodiac had scripts and were updated to the new set, not loosened.

**Not done / not verified.** Nobody has read these; every name, premise and cliffhanger is a proposal. Each script is about 1,000 to 1,300 words (a condensed episode, not a 50-minute teleplay). No footage, voice, music or art exists. The live library and its owner gate are unverified in production (see #1205).
