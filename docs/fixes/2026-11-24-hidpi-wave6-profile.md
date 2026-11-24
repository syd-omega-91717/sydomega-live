### High-DPI wave 6: profile hero banner and achievement badges (2026-11-24)

**Why.** After wave 5, `profile.html` still had canvases at 1x or authored at 2x. This wave converts the two that can be reached and measured, and records why the others were left.

**Fix.**
- `#ph-canvas` (the hero star-field banner, CSS-sized `inset:0`) draws through `OmegaCanvas.fit` in CSS px, so its store is box x ratio. **Found by measuring, not assumed:** on `main` its store was 920 px wide for an 882 px box at every scale, because it read the box before layout settled (CLAUDE.md 8.1 class 3). It now re-measures through a `ResizeObserver` on its own box, comparing width and height.
- The achievement badges (`drawAchBadge`, authored 80 px for a 40 px box) draw through `OmegaCanvas.fitAttr`: the store is unchanged up to 2x and grows above it.

**Verified (headless Chromium).** `verify-hidpi-modules.js` 114/114 including the two new cases and a store-shape-matches-box check. Control on unchanged `origin/main`: the banner's store is 920 wide for an 882 box at 1x, 2.625x and 3x; the badge stays 80 px at 3x; both new cases fail there and pass here. Static: `test_hidpi_charts.py::Wave6Profile` (4 tests). Contract suite 95/95, audit 0 critical, CSP ratchet unchanged.

**Not done, on purpose.**
- **`perf-canvas` ("Portfolio Performance · LIVE CURVE").** It draws a hard-coded series (`pts=[2.1, 2.8, ... 9.0]`) beside a static "ALL-TIME HIGH 9.9.9 APEX" / "PHASE 0": fabricated data presented as live (CLAUDE.md 8.1 class 9). It also measures while its pane is hidden, so it draws at 0x0 and is blank unless visible at load. Sharpening it would polish fabricated data; the owner decides (remove, back it with real history, or flag it). Recorded in `GAP_ANALYSIS.md`, pinned untouched by a test.
- **`tree-cv` (genealogy tree).** It has no CSS size rule and only draws from `bootCharacterFull`, which the harness cannot reach, so I could not see how it displays before or after; changing its store could change its on-screen size. Left alone and pinned.
- `char-canvas` (module scope, unreachable) and the full-window particle backdrop (`bg-canvas`, needs a measured pixel budget) stay as they were.
- Headless Chromium only; no real device, no frame rate.
