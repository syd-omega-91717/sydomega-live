### Studios: first feature screenplay draft, The Rise of Aries (2026-11-07)

**Why.** The Studios program had no written story for any film. `docs/studios/DISCOVERY.md` (PR #1188) found only one-line plots in `assets/series/twelve-houses-s1.json`. The founder approved the franchise mapping and asked for The Rise of Aries on 2026-11-07.

**Fix.** Added `docs/studios/rise-of-aries/` with a three-act screenplay in Fountain format (`ACT_1`, `ACT_2`, `ACT_3`, 12,870 words) and `PACKAGE.md` (logline, structure, characters, direction, remaining work). Added `config/omega-studio-productions.json` (status SCREENPLAY_DRAFT, no media files, no release) and `scripts/tests/test_studio_productions.py`. A continuity error was caught while writing: Act I has Ossara take the Aries tongue, so Act II was rebuilt around a Trial of Cost instead of Kael carrying it.

**Verified.** `python3 -m unittest scripts.tests.test_studio_productions` passes: files exist, status needs what it claims, 25+ scene headings, no release claims, and the sign/god pairs match `omega-agents.json`.

**Not done / not verified.** The founder has not approved the content. At about 65-80 pages it is a short-feature first draft, not 100 pages. No treatment, shot list, storyboard, subtitles, rights records, or any picture or sound exists. Ossara's backstory, Solenne Varr, Ima, Orla Tevane, Tamsin and Brannock are proposed inventions. Nobody but the author has read the screenplay for quality.
