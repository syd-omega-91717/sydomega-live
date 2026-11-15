### The canon gate could not see whole tables; it now does, and it found Virgo themed as Metal instead of Sand (2026-11-15)

**Why.** Sizing the next piece of work, I found 28 files that carry a run of the twelve sign names and 20 where those sit beside element or god names. `CLAUDE.md` §8.1 class 8 (two divergent copies of one canonical table) says `scripts/canon-consistency.py` holds that line. Reading each candidate showed the pages agree with the canon **today** (0 disagreements in 341 sign-and-value pairs; my first crude proximity read flagged 7, all of them false positives: an exact copy of the canon's table, parallel arrays in the canon's order, a faction called "Aether Senate", an agent map). But the gate's own docstring says "a record naming several signs (a list, a table header) is not a pairing and is skipped", and a hand-typed table is exactly that. I planted three errors in real files and the gate passed all three:
- `oracle.html` `SIGN_GOD`: Gemini given Ares instead of Hermes;
- `oracle.html` `SIGN_ELEM`: Pisces given Fire instead of Water;
- `character.html` `GODS`: Hermes and Artemis swapped in a parallel array.

**Fix.**
- `scripts/canon-consistency.py` gains `check_tables()`, called from `check_file()` so its existing wiring (`contract-suite.py`, `ci-local.sh`, CI) is unchanged. It reads two shapes: a map literal with at least six sign (or agent) keys, where each god, element, agent or token value must be the canon's pairing for its key; and twelve-item string arrays within 12 lines of a twelve-sign array, where item *i* must be the canon pairing of sign *i*. A value that is not a god, element, agent or token (a glyph, a faction, a colour) claims nothing and is ignored.
- **It found one real drift.** `omega-theme-elemental.js` (loaded on every page, `bg.js:209`) put **Virgo under Metal**; the canon gives Virgo **Sand** (`omega-canon.json` tracks, `omega-elements.json` sign_element). The module had only four palettes (Fire, Water, Wind, Metal) and silently falls back to `Fire.summer` for any element it lacks, so the fix needed a Sand palette. Added one, anchored on the three Sand colours the canon's own realm module defines (`omega-realm.js` PALETTE.Sand: `#FFD54F`, `#C9A84C`, `#A1887F`); the in-between season tints are mine.

**Verified.**
- Real Chromium, same page, the old module against the new (harness `pin`), dispatching the module's own `omega-theme-update` event for each of the 12 signs and reading the element it applied: **before, 1 of 12 wrong** (Virgo themed Metal, `--page-accent: #795548`); **after, 0 of 12 wrong** (Virgo Sand, `--page-accent: #C9A84C`, autumn). Page errors 0 in both.
- The three real-file plants above, run against the new gate: all three are caught, each with file, line and the canon's value.
- `scripts/tests/test_canon_consistency.py`: 22 tests (12 new): correct maps and arrays pass; a wrong god, element or agent in a map, an agent-keyed map with the wrong sign, two swapped gods, and a wrong element in a parallel array are each caught; glyph maps, a faction map, a three-entry map and a bare list of signs are left alone. With `check_tables` switched off, 7 tests fail. The real estate passes (565 files).

**Not done / not verified.**
- **The Sand palette has not been reviewed as a design.** It is derived from the canon's colours; whether it reads well beside the other three is a judgement I cannot make from a screenshot-less run. Only the token values were checked, not the look of a themed page.
- The gate reads string literals in the shapes above. A table built in some other way (a switch statement, a `.map()` over two arrays, a JSON file read at run time) is still invisible to it. `omega-music.js`'s sign-to-element copy is pinned separately by `test_one_entity_sense.py`.
- The theme module's Metal palette (steel-blue and brown) and the realm's Metal (gold) are two different looks for one element. Not touched; it is a design decision.
- The deployed site could not be viewed from this session.
