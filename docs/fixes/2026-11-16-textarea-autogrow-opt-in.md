### Text areas can opt in to growing with what the member writes; the global form was measured and rejected (2026-11-16)

**Why.** Idea I17 (`docs/IDEA_INTAKE.md`): a long journal entry or note scrolls inside a fixed box. The proposal was one rule in the shared skin, `field-sizing: content`. Building it exposed two things the proposal did not know.
- `field-sizing: content` ignores `rows=`. In Chromium 153 a `rows=6` area measured 40px (one line) with it; restating the resting size from `attr(rows type(<number>))` gave 152px.
- A global rule is not neutral. With the rule on every unclassed and `.inp` textarea, a before/after render of the 37 pages that have one (old `css/omega-system.css` pinned from `origin/main`) compared 18 visible areas and **4 changed resting size**: `contracts.html` 70 to 66.4 (twice), `life.html` 150 to 116, `sleep.html` 60 to 66.4. Those pages size their own area (`.form-row textarea{min-height:70px}`, `.form-grp textarea{height:60px}`); the shared rule ties or outranks them, and a shared rule cannot both beat the platform's 48px floor (`omega-accessibility-audit.css`) and yield to a page's own `min-height`.
- A `.inp` area was also wrong on the first attempt (47.2px for `rows=3`, expected 93.6): `omega-accessibility-audit.css` gives `input, textarea, select` 10px padding and a 2px border, not the skin's 9px and 1px, and a zero-specificity `:where(.inp)` loses to it. Only the real render showed this.

**Fix.** `css/omega-system.css`, block headed `TEXT AREAS THAT GROW WITH WHAT THE MEMBER WRITES`: `textarea[data-autogrow]` gets `field-sizing: content`, `max-block-size: 60vh`, and a minimum of `max(48px, rows × 1lh + chrome)`, with chrome 24px for a classed area and 20px for an unclassed one (both read from the sheets that set them, pinned by test). Wrapped in `@supports` for both `field-sizing` and typed `attr()`, so any other browser keeps today's fixed box. Applied to `heritage.html #h-notes`, `principles.html #p-body` and `creation-studio.html #project-description`.

**Verified.**
- `i17optin.js` (old files and stylesheet pinned from `origin/main` vs the working tree), 1280x800: resting heights 93.6 / 116.8 / 70.4, identical before and after for all four measured areas (0 changes).
- Growth on those three: 8 lines grow to 209.5px, 80 lines stop at 480px (60% of the 800px viewport), and emptying returns each to its resting size. The hand-sized check (inline `height:200px` stayed 200px) was run against the earlier global form, not re-run on the final opt-in; an explicit height beats auto sizing by the property's definition.
- `python3 -m unittest scripts.tests.test_textarea_grow`: 8 tests. Reintroduced faults caught: `.inp` chrome back to 20px, the `@supports` guard weakened to `field-sizing` only, the cap raised to 90vh.
- `check-inline-js.py` clean; `csp-inline-ratchet.py` PASS, no file above its baseline.

**Not done / not verified.**
- `creation-studio.html #asset-prompt` was measured and left out: `field-sizing: content` also sizes an **empty** area to fit its placeholder, and its long placeholder grew it 70.4 to 93.6. The caveat is in the CSS comment and pinned by test.
- `stoic.html`'s five journal areas (the clearest "long journal entry" case) are not opted in: the page sets an explicit `height:70px`, which beats auto sizing. They need a page-level change that keeps `height:70px` for browsers without support; not done here.
- The other 113 of 116 text areas are not opted in and were not individually measured. Hidden-at-load areas (modals, tabs) were never visible to the survey, so they are unmeasured.
- Chromium only (153). Firefox and Safari were not run; the `@supports` guard is what keeps them on today's behaviour, and that is unverified in those engines.
