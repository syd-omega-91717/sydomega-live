### enter and offline backdrops at a 2x cap (2026-11-25)

Follow-up to the 404/account change. `enter` (hairline grid at 0.03, dots at 0.2-0.35) draws through `OmegaCanvas.fit` with a 2x cap. `offline` (dots at 0.35) is self-contained (`setTransform`, ratio capped at 2): it is served offline, where the shared helper may not be cached, and it drew in store pixels (`cv.width`), now CSS pixels. Rule recorded in `GAP_ANALYSIS.md`: a backdrop whose dots are below alpha 0.2 (`pending`, `media`, `honors`) stays at 1x; 4x the pixels buys nothing there.

**Verified (headless, dpr 3, 390x844):** enter store 970x2100 vs 485x1050 on `main`; offline 782x1694 vs 391x847, painted with motion enabled on both. Both ratios are against `innerWidth`, which was already wider than the CSS box on mobile emulation on `main` (enter 485 vs 390); not changed here. Not seen on a real phone.
