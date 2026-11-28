### Platform-wide scan for graphics squeezed inside links and buttons (2026-11-28)

**Why.** The sidebar brand emblem was displayed 12x44 from a 44x44 request on every desktop page (`docs/fixes/2026-11-28-nav-brand-emblem-squeezed.md`): `omega-accessibility-audit.css` pads every `a[href]` to a 44px touch target and bg.js caps every canvas, img and svg at `max-width:100%`. Two fix entries then listed "the same padding may squeeze other fixed-size graphics" as unmeasured. This measures it.

**What.** `scripts/scan-link-graphics.js` renders every root page (1280 px wide, signed-in stub, at load) and, for each canvas, img and svg inside `a[href]`, `button` or `[role=button]` that has a declared size (inline style, else `width`/`height` attributes) and a visible box, compares the declared aspect with the displayed one; a difference over 4% is reported and the script exits 1. About 3 s a page.

**Result.** All 238 pages: **0 squeezed graphics, 0 errors.** The scanner found the emblem when pointed at `main` from before the fix (`100c5ec0d`, run with `--root`): `CANVAS#on-bcv in A.on-brand: asked 44x44, shown 12.0x44.0` on every page it was given (gaming, series, dashboard in the first control; gaming and series with the script itself), exit 1. So the 0 is a measurement, not a dead scanner.

**What a 0 does not mean.** The scan is at load, at 1280 px: it opens no tab, hovers nothing, and does not look at phone widths. It cannot see a graphic that has no declared size, a graphic that is not inside a link or button, or one a page script resizes later. A different class of squeeze (a canvas inside a plain box) was swept earlier for canvases on their own (`docs/fixes/2026-11-28-sigma-hidden-tab-charts.md`).

**Not done.** It is not wired into CI: it needs a browser and takes about 12 minutes for the whole estate. Run it by hand after a change to `bg.js`, `nav.js` or the accessibility sheet, and run the control first.
