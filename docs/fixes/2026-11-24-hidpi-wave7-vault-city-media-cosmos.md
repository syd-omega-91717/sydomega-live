### High-DPI wave 7: vault, city, media glyphs and the cosmos agent wheel (2026-11-24)

**Why.** The canvases that read their own size were the next group after wave 6. Each was probed first (on `origin/main` and on the branch, at 1x and 3x) to see which ones a harness can actually reach and see drawing.

**Fix (verified, reachable).**
- `vault.html` emblem (`#vault-cv`, 240 px for a 120 px box) and distribution ring (`#dist-cv`, 120 px for 80): drawn through `OmegaCanvas.fitAttr`. The authored W/H are read *before* `fitAttr` enlarges the store (the code reads `canvas.width` as its size).
- `city.html` simulation: authored at 2x with an explicit `scale(2,2)`; now `OmegaCanvas.fit` with a 2x floor (1x and 2x unchanged, 3x grows).
- `media.html` franchise glyphs (`.fc-canvas`, 7 of them): `fitAttr`.
- `cosmos.html` agent wheel: drawn in a doubled coordinate space, so it carries the same `max(1, dpr/2)` factor `emblem.js` uses, applied through the context transform.
- The helper script is loaded in `<head>` on `vault`, `city` and `media` (`cosmos` already had it).

**Verified (headless Chromium).** `verify-hidpi-modules.js` **139/139**: for each canvas the store follows its formula at 1x, 2.625x and 3x, the CSS box never changes, aspect is kept and the painted region is the same at every scale. **Controls on unchanged `origin/main`:** all five new cases fail (store stuck at its 1x size at every scale) and pass on the branch. Static: `test_hidpi_charts.py::Wave7` (5 tests).

**Found, not changed.** `city.html`'s canvas is stretched about 1.45x horizontally on `main` too: it measures while hidden, falls back to 600 px and draws a 1200x560 store into an 867x278 box. A naive observer would stack animation loops because `drawCity` also rebuilds its 60 buildings; the fix needs the draw split from the setup. Recorded in `GAP_ANALYSIS.md`.

**Not done, on purpose (unreachable under the stub, so a change could not be seen drawing; each pinned untouched by a test).** `family` constellation and tree (the tree also draws a 300-unit scene into a 600 px store with a non-uniform `scale(2,1)`), `media` poster canvases, `cosmos` sign canvases / mandalas / planet nodes / `cr-icon`. Also still open: the full-window particle backdrops (need a measured pixel budget) and the canvases listed in `GAP_ANALYSIS.md`. Headless Chromium only; no real device, no frame rate.
