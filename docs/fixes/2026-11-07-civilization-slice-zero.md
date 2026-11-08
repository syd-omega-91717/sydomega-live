### Omega: Civilization 91717, Slice 0 (2026-11-07)

**Why.** The user asked for real products, not more drafts. The Omega Chronicles game was DESIGNED with concrete acceptance criteria (`docs/studios/franchises/the-omega-chronicles/games/civilization-91717/GDD.md` section 4) and nothing built.

**Fix.** `omega-civ-logic.js` (pure rules: seeded xoshiro128**, integer per-mille probabilities, a year step, ORION's forecast as a 200-copy ensemble of the same step, Brier score and reliability table, a bot) and `omega-civ-game.js` plus `game-omega-civilization.html` (hex map, plan, policies, forecast and audit, log, end screen), registered like every page.

**What measuring changed.** My first constants made the game trivial (a random player won 95%) and ORION's forecasts carried almost no information (Brier 0.162 against 0.166 for a constant guess). After retuning: the scripted bot wins about 88%, a random player about 22%, and ORION's forecasts beat the constant guess by about 27% (Brier 0.098 vs 0.134) while staying calibrated in every probability bin (said 0.28 happened 0.30; said 0.69 happened 0.71).

**Bugs found by driving the real page.** Shift+1 to 4 never removed a point: with Shift held `e.key` is `!@#$`, so the handler now keys off `e.code`. The platform read-more clamp truncated the result text; result paragraphs are now marked no-clamp.

**Verified.** `test_civ_logic.py` 16 tests; `./scripts/ci-local.sh` all 35 blocking checks. In headless Chromium at 1280 and 375 wide the scripted bot played all 12 years through the page's own controls and the final resources, event log and all 12 ORION forecasts equal the offline run; reload restores a save; a tampered save fails its checksum; no overflow, no duplicate ids, no page errors. A forecast takes about 1 ms here (budget 50 ms; measured on this machine, not a device claim).

**Not done / not verified.** No human has played it, so balance for people (not bots) is unmeasured. The GDD asked for a Web Worker and IndexedDB; Slice 0 runs on the main thread (a forecast is about 1 ms) and saves to localStorage with a checksum. No audio, no multiplayer (UNAVAILABLE), no WebGPU path. Win threshold is 50 (the GDD said only "above threshold").
