# Dim the ambient orrery on narrow screens so it stops crossing page text

Date: 2026-11-20

On screens under 760px the shared orrery (`#omega-fx`, drawn in `bg.js`) is centred at `CY = H*0.34`, about 270px
down an 800px screen, which is where the first lines of nearly every page sit. Planets and the gold Ω crossed words.
`sovereign-core` had a page-local glass backing for this (#1467); that does not generalise.

## Measurement

Survey of 35 pages (every 7th in sorted order) at 375px: for each text block, screenshot with the orrery visible vs
hidden and count pixels whose brightness changes by a large step; a block is "affected" above 6% of its pixels.
- Control first: an earlier heuristic reported 0 affected pages everywhere and was wrong (it treated `<body>`'s
  background as a backing). Replaced by pixel diff only; control = `sovereign-core` before its header fix (669d640^1)
  must flag (it flagged the date text at 18.8%) and after must not.
- Before: 7 of 35 pages affected (architecture, autonomous-insights, cosmic-ledger, credentials, my-quests,
  visual-atlas, world-atlas), up to 7 text blocks on one page, worst block 33% of pixels changed.

## Change

`bg.js` `resize()` of the fx module: `cv.style.opacity = small ? '0.25' : '1'` (`small` = width < 760, already computed there).
No other module sets that canvas's opacity. Desktop is unchanged (computed opacity 1). Value chosen empirically:
0.32 cleared 6 of 7 pages (autonomous-insights fell from 27.5% to 7.8%, still over the line); 0.25 cleared all 7.

## Evidence

- Re-survey of the 7 affected pages plus `sovereign-core`, `dashboard`, `profile`: 0 affected at 0.25 (0.32: 1 affected).
- Orrery still drawn: canvas holds 592,504 non-transparent pixels (49% of the buffer) at 375px, opacity 0.25; desktop 352,029, opacity 1.
  Visual check on `architecture.html`: body text readable, orrery visible but dim.
- `node --check bg.js`, `verify-runtime.js` 13/13 entrypoints, `check-inline-js.py`, `omega-registry.py --check`,
  `ci-local.sh` 34/35 blocking (the 35th, the responsive contract, needs a built `public/` and PASSes, 250 pages).

## Not verified / limits

- Only 35 of 242 pages surveyed; the other ~207 are not measured. The same orrery position applies to all, so the
  cause is shared, but the per-page benefit outside the sample is inferred.
- Pixel diff measures change under text, not WCAG contrast; verify-runtime's contrast scan reads static colours and cannot see a canvas.
- Real-device appearance of the dimmed layer not seen; 0.25 is a judgement call a human may want to tune.
- The 760px threshold is the module's existing `small`, so tablets between 760 and ~900px keep full-strength orrery.
