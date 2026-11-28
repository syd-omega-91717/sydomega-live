### Sidebar brand emblem squeezed to 12x44 on every desktop page (2026-11-28)

**How it was found.** Probing `gaming.html`, the one page the canvas sweep could not measure. That page's own canvases are fine: its six 137x103 tile canvases are stored exactly 2x, the 64px and 132px ones are square, and the hidden-tab ones are `omega-alive-glow` canvases that are 0x0 and not drawn. The sweep failed on it because the second tab is an `<a href="/academy.html">`, so clicking every `.tab-btn` navigated away. The probe that follows only clicks `button.tab-btn[data-tab]`. The same measurement turned up a different, platform-wide defect: `#on-bcv`, the rotating brand emblem in `nav.js`, was displayed 12x44 from an 88x88 store, on gaming, series and dashboard at 1000 and 1400 px.

**Why.** `omega-accessibility-audit.css` sets `padding: max(8px, (var(--a11y-touch-min) - 1em) / 2)` on every `a[href]` (sheet 10; 15px each side at 14px type). `.on-brand` is a 44px link with a 1px ring (`box-sizing:border-box`), so that padding left 44 - 2 - 30 = 12px of content. bg.js's `canvas{max-width:100%;height:auto}` capped the canvas's inline `width:44px` to that 12px, while the inline `height:44px` held, so a round emblem was drawn as a 12px-wide sliver. `nav.js`'s own `.on-brand` rule (specificity 0,1,0) lost to `a[href]` (0,1,1).

**Fix.** `nav.js` only: `#omega-side .on-brand{padding:0}` (1,1,0, so it wins) and `#omega-side .on-brand canvas{width:42px!important;height:42px!important}`. The link is already 44x44, so it needs no touch padding. The 1px ring leaves a 42px content box, so the emblem is drawn square at 42x42, 4.5% smaller than the 44px nav.js asked for. Without the second rule it would be 42x44 (the inline height still wins over `height:auto`).

**Verified.** `node scripts/verify-nav-brand-emblem.js`: PASSED 30 of 30 (gaming, series, dashboard at 1000@1 and 1400@2: emblem exists, displayed square, fills the link content box, store at least the box x min(ratio, 2), no page errors). The same script against pre-fix `main`: 7 failures (`w:12, h:44, inner:12`). `OMEGA_NAVBRAND_BROWSER=1 python3 -m unittest scripts.tests.test_nav_brand_emblem`: 3 tests OK.

**Not done / not verified.**
- Phones: the sidebar is hidden below the desktop breakpoint and the canvas is 0x0 by design; not looked at on a real device.
- A wider class: the same `a[href]` padding rule may squeeze other fixed-size links in `nav.js` (the `.on-icon` buttons, for example). I did not measure them.
- `gaming.html` is now measured: no defect in its own canvases.
