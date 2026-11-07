### Studios: The Two-Hand Bridge, a playable puzzle chapter (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What:** the first playable level built for the approved film: `game-origins-bridge.html`, `omega-bridge-logic.js` (pure rules), `omega-bridge-game.js` (Canvas 2D screen, keyboard, tap, swipe, sound). The film's two-hands idea is the rule: two cradles share a letter, and a span opens only when one character stands on each; it then stays open. Auren is heavy and cannot cross a thread; Torin is light and can. Five levels, par 14, 21, 28, 28 and 48. Status PROTOTYPE; not a release; nothing connected to payments, tokens or members' rewards.

**Why this and not a second 3-D slice:** the existing Origins slice is WebGL with a 34 KB game loop. A second level inside it was the riskiest way to add playable content. A small deterministic puzzle lets a solver prove correctness, which no amount of play-testing in this session can.

**How correctness is shown, not asserted** (`scripts/tests/test_bridge_logic.py`, 17 tests, plus a headless-browser run):
1. A built-in 0-1 breadth-first solver finds each level's minimum steps; the stored par must equal it. The first version of the solver was wrong in one case (a free swap could be discovered a layer late, giving a non-minimal par); it was fixed before any par was recorded.
2. Every cradle pair must be necessary. **My first draft of the level set failed this**: the second pair in level II was decoration. Caught by the solver, redesigned, and now a test.
3. No level can be beaten with every pair disabled; the recorded solution replays to a win in exactly par moves.
4. Each rule is its own test: heavy cannot cross a thread, one hand opens nothing, an opened span stays open, a closed span blocks, blocked moves and swaps cost nothing, no stepping onto the other character, undo, restart, and a won board is frozen.
5. Headless Chromium at 1280 and 375 wide: all five levels solved through real keystrokes in exactly par; progress saved, a tampered stored value rejected on read; tap-to-swap, tap-to-step, swipe and the buttons work; 0 page errors; no overflow.

**Defects found by looking at the real render and fixed:** the platform's text clamp truncated the intro paragraph (removed; the explanation moved to the Help page as asked); on a phone the 24-column finale was squeezed by flexbox to a different aspect ratio than its drawing buffer (tiles now scale so the whole level fits and the canvas does not shrink); an undeclared variable in the frame loop (would have thrown on the first frame under strict mode); and the idle loop redrew at 60 fps for a decorative bob (now slow, and stopped under reduced motion or in a hidden tab).

**Public by URL, so by design:** like every static page here, the page and its JavaScript can be fetched by anyone who has the URL (`bg.js` only hides the page). So it carries no unreleased story text (a test fails if a character name from the unreleased script appears on the page) and nothing flashes: no element changes faster than a slow fade.

**Registered:** `nav.js` (MEDIA section), `config/page-cores.json`, `config/page-world-overrides.json`, page contracts (regenerated and promoted), `index.html` surface count 239 to 240, a Help entry in `omega-guide.js`.

**Not verified:** no human has played it, so difficulty, feel and clarity are unmeasured; the on-screen text is minimal and a first-time player may not read the single hint. Audio was not heard (headless).
