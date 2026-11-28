### series.html zodiac emblems squeezed 18% by a 28px box (2026-11-28)

**How it was found, and a correction to the sweep that found it.** The hidden-tab canvas sweep (see `docs/fixes/2026-11-28-sigma-hidden-tab-charts.md`) flagged two more pages: `queue.html` `q-topology` and eight small canvases on `series.html`. Both were re-checked with a patient probe (open each tab, measure at +0.45 s and again at +2.5 s) before any change:
- **`queue.html` was a false positive of the sweep, not a defect.** After opening the QUEUES tab, `q-topology` is already stored 2346x600 for a 782x200 box (exactly 3x on both axes) and `q-throughput` is 2346x360 for 782x120. The page's own ResizeObserver (on the canvas's parent) redraws it; the sweep read it 450 ms after the click, under four-way CPU contention, before that redraw landed. Nothing was changed. The sweep's numbers were therefore a snapshot, which is also why `sigma.html` was proven with a control run and a real render, not from the sweep alone.
- **`series.html` is real**, and persistent (the same value at +2.5 s).

**Why.** In the BY TRACK and BY ELEMENT tabs an emblem module (`data-orm="controls"`) replaces each zodiac glyph inside `.by-sign` with a canvas whose inline style is `width:34px;height:34px` (store 68x68 at ratio 2). The page's `.by-sign` box is `width:28px` (sized for the old text glyph), and bg.js's `canvas,img,svg,video,iframe{max-width:100%;height:auto}` caps the canvas to its parent's width, so it was displayed 28x34 (about 18% too narrow), a square emblem squeezed.

**Fix.** `series.html` only, one declaration: `.by-sign{... width:34px ...}` (was 28px), with `flex-shrink:0` kept. Measured: no horizontal page overflow at 390, 360 or 1000 px before or after; the phone name column is the same width (75 px); the desktop name column is 6 px narrower (489 vs 495 px of a 762 px row), no name clipped.

**Verified.** `node scripts/verify-series-emblems.js`: PASSED 12 of 12 at 1000@1, 1000@3 and 390@3 (emblem canvases appear after opening every tab; each is displayed square at the size the module asked for; each store is not below the screen density; no page errors). The same script against the pre-fix `main`: 3 failures, one per configuration (`bw:28, bh:34, asked:34`). `python3 -m unittest scripts.tests.test_series_emblems`: OK; the browser case passes with `OMEGA_SERIES_BROWSER=1`.

**Not done / not verified.**
- `GAP_ANALYSIS.md` still lists `queue.html` and `series.html` as open from the sweep; it is not edited here because an open PR (#1608) edits the same paragraph. It should say: queue is a false positive, series is fixed, and only `gaming.html` (not measurable by the sweep) remains. To do after #1608 merges.
- A wider class: any element that places a canvas with an inline size inside a narrower fixed-width box is capped by bg.js's `max-width:100%`. Only `series.html` was looked at; I did not search for others.
- `gaming.html` still has not been measured (a click navigated away mid-sweep). Dpr 3 and 1000 px for the sweep; not looked at on a real phone.
