### High-DPI wave 5: shared marks and header widgets stay sharp on 3x screens (2026-11-24)

**Why.** The earlier hi-DPI waves covered the chart and pointer canvases. A fresh inventory of 2-D canvases that never mention `devicePixelRatio` found ~60 more, and most of the member-visible ones were already authored at **2x their CSS box** (attribute = 2 x `style` width): sharp on a 2x screen, soft on the 3x phones most members use. This wave covers the shared marks that load on every page and the small header/widget canvases.

**Fix.**
- `nav.js` (the sidebar brand mark, every page) and `omega-page-emblem.js` (the per-page emblem) carry their own capped ratio maths (bg.js injects them everywhere, so they cannot depend on the page helper): the store is unchanged up to 2x and grows by dpr/2 above it (capped at 3); the context carries the scale, so no drawing coordinate changed.
- 17 header/widget canvases (analytics x2, automation, family, identity, interface-omni, points, profile x4, social, subscriptions, triads, approvals x3, enter, pending) draw through `OmegaCanvas.fitAttr`; the 13 host pages load `omega-canvas-hidpi.js` in `<head>`.
- **A helper bug the browser found:** `fitAttr` read `clientWidth` to learn the displayed size, but these widgets draw while the approval guard still hides the page, so it read 0 and fell back to the full ratio. The store came out at **6x the CSS box at 3x** (600 px for a 100 px canvas) instead of 3x. It now falls back to the inline `style.width` (CLAUDE.md §8.1 class 3).

**Verified (headless Chromium).**
- `scripts/verify-hidpi-modules.js`: **103/103**. The store follows `2 x box x max(1, dpr/2)` at 1x, 2.625x and 3x (never blurry, never oversized), the CSS box never changes, the aspect is kept, and the painted region is the same at every scale.
- Controls on unchanged `origin/main`: the new cases fail exactly where they should (store stuck at 264/88/160... at 3x); they pass on this branch. Before the helper fix the same run showed the 6x oversize on most of the widgets.
- Pages the member stub cannot reach, checked with owner / signed-out / unapproved stub variants: `approvals` (3 canvases), `enter`, `pending`: store 1.5x the 1x store at 3x, same painted region; all fail on `main`. `approvals #tb-cv` is authored at 50 px for a 26 px box, so above 1x its store follows the displayed width (78 = 26 x 3), which is the helper's design; `approvals.html` throws one page error under the stub on `main` too.
- `scripts/tests/test_hidpi_charts.py::Wave5` (4 static tests); the earlier chart and pointer harnesses were re-run after the helper change (see the PR).

**Not done / not verified.**
- **Three canvases were deliberately not converted**: `cosmos` hero-wheel, `honors` auth-gauge, `profile` char-canvas. They draw in a coordinate space twice their attributes and live in module scope, so no harness can reach their draw functions (verified: `typeof window.drawHeroWheel === 'undefined'`); a change I cannot see draw is not shipped. A static test pins them as untouched.
- **Not yet converted** (they read their own size, so each needs individual care): `profile` (1499, 1589, 2248, 2367, 2389), `cosmos` (439, 532, 759, 1015), `media` (794, 987), `family` (461, 604), `city`, `vault` (2), `omega-animated.js`, `omega-graphify.js`, `omega-confetti.js`, `omega-qr.js`/`omega-share-card.js` (those produce downloadable images, a separate question) and the full-window particle backdrops (`404`, `account`, `enter`, `offline`, `pending`, `media`, `honors`), which carry real fill-rate cost and need a measured pixel budget, not a ratio bump.
- Headless Chromium only: no real 3x phone, no frame-rate measurement.
