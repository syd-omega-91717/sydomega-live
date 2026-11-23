### Zero-Point Awakening first-visit intro (omega-zero-point.js) (2026-11-23)

**Why.** The owner's ecosystem brief specifies an opening sequence: pitch black, a single point of light, the camera pulling back into the
Omega engine. The platform's only intro was `#omega-genesis` in `bg.js` (an Omega glyph plus two rings, 3.1 s, once per browser,
skipped under reduced motion). Nothing in the repo implemented the sequence (`grep -ril "zero-point"` -> 0 files before this change).

**Fix.** New `omega-zero-point.js`: a procedural canvas-2D sequence (4.6 s): black, a single point (0.6 s), a pull-back through a 144-spoke
by 10-ring point field and three rings (1.3-3.2 s), the Omega resolving and pulsing (2.6 s), a caption fitted to the viewport. No
image, audio or video asset, so no media-rights record is needed. Two small `bg.js` hooks: (1) inject the module only when the intro
will show (`!REDUCE && !localStorage.omega_genesis_seen`), own guard `data-omega-zero-point`; (2) the legacy 3.1 s timer now stands
down only if the module set `g.__omegaHold`, and the module ends the intro through bg.js's own `g._omegaDone`. If the module never
loads, the legacy intro runs exactly as before. Skip with click, Escape, Enter or Space; a 5.5 s hard cap removes the overlay even if a
hidden tab pauses animation frames. Sound is opt-in only: a "SOUND" button starts a quiet 528 Hz sine; nothing ever autoplays.
`OMEGA_TAXONOMY.md` section 9 records the brief's undefined terms instead of inventing behaviour.

**Verified.** `node scripts/verify-zero-point-intro.js` -> 22/22 on the real `index.html` (headless Chromium): pixel samples at fixed
times (0.3 s black; 1.1 s bright centre point, black edge; lit area grows 1.0 < 2.4 < 3.3 s; 4.3 s gold Omega), natural completion
sets `omega_genesis_seen`, second visit requests no module, Escape/Enter/Space skip, tapping SOUND creates one AudioContext at 528 Hz
without skipping and a second tap turns it off, reduced motion shows nothing, module blocked -> legacy intro shows and ends on its own,
0 page errors, mobile 375 px layout. Looking at the rendered frames found two defects the first 20 assertions missed: screenshots were
being overwritten by the live loop (fixed: `render()` freezes it), and the caption clipped on a 375 px screen at 12 px / 6 px spacing
("CODE . THE FREQUENCY . THE LE"); fixed by fitting, and a test now measures the caption box. `scripts/tests/test_zero_point_intro.py`
(static contracts + the browser suite), `brand-glyph-check.py`, `audit.py` (0 critical / 8 warnings, unchanged),
`module-contract.py`, `check-inline-js.py`, `context-budget.py`, `silent-failure-detector.py` pass; `omega-registry.py` regenerated
(+1 module, 288), `--check` OK.

**Not done / not verified.** (1) Rendered with webfonts stubbed empty, so the Omega and caption show in fallback fonts here; the real
Cinzel Decorative / Courier Prime faces were not seen. The module asks for the Cinzel face at start (`document.fonts.load`), but a slow
font fetch can still show a fallback glyph for the first frames. (2) Frame cost on low-end phones was not measured. (3) The Winged Lion,
the Fiery Triangle and the 144,000 grid are NOT built: no asset or definition exists. The 144 spokes are an illustration and claim
nothing. (4) The 528 Hz tone was verified by the oscillator's configured value, not heard or measured as audio output. (5) Not
deployed; no production evidence. The intro changes what every first-time visitor sees, so this is a visible production change once merged.

**Unrelated repair included.** `scripts/omega-script-dependency-graph.py` did not parse on `origin/main` (merge `a008df10f` left two `shared_registry` definitions; the older one was missing its `)`, line 132). It failed 3 tests in `scripts/tests` on main (`test_omega_script_dependency_graph` import, and two in `test_script_help_contract`). I removed the dead older definition; the newer `registry_names` version below it was already the one that took effect. Before: `ast.parse` -> `SyntaxError: '(' was never closed`. After: `scripts/tests` 2092 OK.
