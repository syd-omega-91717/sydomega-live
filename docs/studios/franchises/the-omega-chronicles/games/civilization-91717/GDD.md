# OMEGA: CIVILIZATION 91717 — Game Design Document (Draft 1, PROPOSED)

**Status: DESIGNED.** Nothing here is built, playable or released. Written 2026-11-07 under the founder's delegation. A design target (a full
civilization-scale simulation) is kept apart from **Slice 0**, the smallest honest prototype for a static, no-build repository. Multiplayer is **UNAVAILABLE**.

## 1. Pillars
1. **A forecast is a claim, not a fact.** ORION predicts civilization-level events and always states its confidence; the player decides whether to trust it, verify it, or act against it.
2. **Ambiguous intent, honest numbers.** ORION's *ends* are unclear (the franchise's question), but its stated probabilities are **calibrated**: the game scores them at the end so the player can see whether it was honest about its odds.
3. **Institutions outlast leaders.** Policies are laws that keep working after you stop attending to them, for good and ill.
4. **No conquest victory.** The measure is whether a civilization survives its own predictions.
Audience 12+; no monetisation; the 91717 phenomenon is a story motif, not a scientific claim.

## 2. Core loop (one turn is one year)
READ (state, ORION's forecast) → ALLOCATE (four resources) → LEGISLATE (policies) → VERIFY (spend Trust to audit a forecast) → RESOLVE (events fire, the year advances).

| Resource | Meaning |
|---|---|
| Energy | what the civilization can do |
| Knowledge | what it can predict and build |
| Trust | what its people will let ORION and the state do |
| Biosphere | what the world can still carry |
**ORION's forecast** is the sim itself run forward on a copy with seeded noise, many times; the player sees a distribution (median, 80% range), never a single number.

## 3. Technical architecture (what fits this repository)
- **No build step, no framework, no CDN.** Plain scripts as static files, added to `nav.js`; art is procedural.
- **Deterministic simulation in a Web Worker**, over structure-of-arrays typed arrays, with a seeded 32-bit generator (xoshiro128**) and integer arithmetic for the state that matters, so a saved game and a replay agree exactly. The UI thread only draws.
- **Forecasting is real, not scripted:** ORION runs N copies (200 in Slice 0) of the same step function ahead by H years (10), reports quantiles, and logs every forecast and its later outcome. The end screen shows a **calibration score (Brier)** for ORION's stated odds. Time budget 50 ms per forecast on a mid-range laptop; **unmeasured**.
- **Render:** Canvas 2-D hex map in Slice 0; a WebGPU compute path for large ensembles (10,000 runs) is a design target behind feature detection, never required.
- **Pure logic module** (UMD, Node-testable): step function, policy effects, event table, forecast, scoring. **Saves:** IndexedDB with checksum and migration; writes check `.error`.
- **Accessibility:** every chart has a text table; colour-blind-safe palette; reduced motion honoured; full keyboard play.

## 4. Slice 0
Scenario "Genesis 91717": a 16 x 16 hex field, five regions, four resources, six policies, twelve turns, ORION forecasting on request. Win condition: reach year 12 with Biosphere
and Trust above threshold. **Acceptance:** Node tests for determinism (same seed, same 12 years), for forecast quantile correctness against a known toy model, and for the Brier calculation;
a scripted bot finishes the scenario; forecast latency measured on a named device. Label PROTOTYPE until then.

## 5. What does not exist
No code, art, audio, scenario or build. The franchise and its films are CONCEPT.

## 6. Open questions for the founder
1. Should ORION ever be wrong on purpose (a hidden agenda), or only ambiguous in what it wants?
2. Is the Brier score the right way to show honesty, or should it be a story beat only?
3. How close to the first film (Genesis 91717) should Slice 0's events be?
