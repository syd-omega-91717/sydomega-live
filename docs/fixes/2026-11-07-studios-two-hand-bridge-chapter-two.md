### Studios: The Two-Hand Bridge, chapter II (levels VI to X) (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What:** five more levels for the playable puzzle game (now ten in two chapters): VI *Far and Near* (par 39), VII *Crossed Hands* (40), VIII *Three Spans* (48), IX *The Crowded Island* (49) and X *The Great Hold* (58). Same rule as chapter I, with pairs whose cradles are split across several islands, so each span depends on where the other characters have been left. A `chapter` field was added to each level; the level buttons separate the chapters; the digit keys now cover levels 1 to 9 and 0 for level 10. A held key no longer fires a step on every key repeat.

**A mechanic I built and then removed, and why.** My first idea for chapter II was a second rule drawn from the film's Karth Vael, "a city that built itself": ash tiles that are built only on alternating steps. The solver showed it was cosmetic: across about 1,700 random placements it changed par by 0 to 3 steps, because the other character can always spend one spare step to turn the city. I replaced it with ash that crumbles once you step off. That measured worse: gain 0 in nearly every placement, because random ash sits on open floor and can be walked around. Rather than ship a rule that does not bite, I reverted `omega-bridge-logic.js` to the proven version and built chapter II on the existing rule. Nothing from either experiment is in the code.

**How the levels were made:** a generator (scratch only, not committed) builds chains of 3x3 islands separated by chasms, with a thread across some chasms, and places each pair's two cradles on random islands. The solver then keeps only candidates where every pair is needed, no level is beatable with all pairs disabled, and the solution uses at least 3 swaps. Pars come from the solver, not from the generator. Each level was then looked at in a real render.

**Verified:** `test_bridge_logic.py` 20 tests (new: per-chapter ramps, chapter II needs at least two spans and 3 swaps in every level, every level is at most 24 columns by 6 rows so it fits a phone, level ids unique, a held key cannot fire steps); headless Chromium at 1280 and 375 wide: all ten levels solved through real keystrokes in exactly par, scores saved, tampered storage rejected, 0 page errors.

**Not verified:** no human has played it. Chapter II is harder than chapter I by the solver's measure (more spans, more swaps), but whether it is fun or frustrating, and whether the 12 px tiles of the 24-column levels are readable on a real phone, is unmeasured. The levels are generated, so some may read as arbitrary.
