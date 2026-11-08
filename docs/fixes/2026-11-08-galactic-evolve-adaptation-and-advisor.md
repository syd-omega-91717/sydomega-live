### Last Galactic Empire: a fallible enemy and an Advisor (2026-11-08)

**Why.** My own report on #1209 named the weakness: the enemy was deterministic, so a script that found the doctrine counter won every seed and chance appeared only in grievances. A game the best script always wins is solved, and a human has nothing to discover that the log does not already hand over.

**Fix.** Each season the enemy factions adapt to the defenders' current doctrine with a seeded chance (Independent Worlds 85%, Reformers 70%, drawn from their own stream so grievances are unchanged); otherwise they repeat their last doctrine and the log says "it did not adapt". `advise(g)` returns the staff officer's reasoning, one line per fleet naming the counter and the counter of the counter, plus how often the enemy adapts ("a good bet, not a promise"), and the scripted Court's plan. The page gains an ASK THE ADVISOR panel with APPLY THIS ADVICE, which fills the plan in and leaves END SEASON to the player.

**Measured over 200 seeds.** The scripted Court that manages doctrines wins 99% (it can now lose: 2 of 200 lost the capital), one that never touches doctrines wins about 75%, an idle Court still loses the capital every time. Over 150 campaigns the log shows the enemy missing at about the stated rate (the test allows a 12-point band).

**Verified.** `test_galactic_logic.py` 19 tests (3 new); `./scripts/ci-local.sh`. In headless Chromium at 1280 and 375 wide the scripted Court played seasons 1 to 3 through the manual controls and seasons 4 to 13 through the Advisor's apply button; the final state equals the offline run exactly.

**Not done / not verified.** No human has played it. A script that reads the board each season still wins 99%, so the real test is whether a person finds the doctrine counter without the Advisor and decides when to trust it. The adaptation odds (85% and 70%) are my numbers, not canon.
