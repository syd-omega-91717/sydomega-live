### The Two-Hand Bridge: chapter III, plates and gates (2026-11-07)

**Why.** Chapters I and II (10 levels) only varied the spans. The user asked for the next playable chapter and for building bigger. An earlier attempt at new mechanics (parity and crumbling ash) was removed because the solver measured it as cosmetic (par change 0 to 3).

**Fix.** A second rule that is a different kind of cooperation: spans are permanent, gates are HELD. A gate (`+`, `x`) can be entered only while the other character stands on a plate of its family (`^`, `~`); the holder cannot step off while the other is in the gate; a gate keeps no memory. Five levels (XI to XV, par 18, 25, 27, 41, 80); the finale folds into two bands (19 x 9) so it stays readable at phone width.

**Verified.** The solver found two flaws in my own first designs and I fixed them before keeping any level: one plate family opened every gate (so plates and gates now come in matched families), and a plate in the corridor locked the other out of its gate. `test_bridge_logic.py` (23 tests) proves each level solvable with par as the true minimum, every plate family individually needed, no chapter III level beatable with plates disabled, and the hold and no-memory rules. In headless Chromium at 1280 and 375 wide all 15 levels were solved through real keyboard input in par, with no page errors or overflow; the board was inspected in screenshots (plate lit under a character, gate bars).

**Not done / not verified.** No human has played it: par proves solvability, not fun or difficulty. Audio is untested (no audio device). The Help text was updated in English; translation packs were not touched unless `i18n-contract.py` says they must be.
