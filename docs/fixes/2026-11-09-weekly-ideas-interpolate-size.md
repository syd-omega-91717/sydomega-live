### Weekly ideas: expanding panels animate to their real height (I16); new proposal I17 (2026-11-09)

**Why.** Five first-party panels opened by animating `max-height` to a guessed ceiling (I16, `docs/IDEA_INTAKE.md`). A ceiling below the content clips it, and a ceiling far above it makes the animation run against the wrong height. Measured before the change, in headless Chromium on HEAD:
- `media.html` (400px cap): at 320px wide, one film description was 506px tall and showed 400px (`clientHeight/scrollHeight` 400/506). At 390px and 1280px nothing was clipped (tallest 323px and 78px).
- `publishing.html` (2000px cap): a planted 3,000-line work (66,579px) showed 2,000px.

**Fix.** `media.html:214` and `publishing.html:22` each gain an `@supports (interpolate-size: allow-keywords)` block that opts that one panel in and animates `height` from 0 to `auto`, plus a `prefers-reduced-motion` rule that drops the transition. The old max-height rules stay as the fallback for browsers without `interpolate-size`. The opt-in is per panel, not on `:root`, so no other auto-size transition on the site starts animating.

Left alone on purpose:
- `omega-more-info.js` already sets `maxHeight` from the measured `scrollHeight` (lines 84 and 98).
- `.section-expandable` in `omega-component-library.css` is used by no page.
- `journal.html`'s `.j-entry-body` is a 72px preview with a 3000px cap, not a guessed ceiling worth replacing.

**Verified.** Headless Chromium (verify-in-browser harness), HEAD pinned with `gitShow`, a fresh context per run, and the hidden `#mtab-saga` panel shown before measuring (a hidden panel measures 0).

| check | HEAD | this change |
|---|---|---|
| media, 320px, clipped descriptions | 1 (400/506) | 0 (506/506) |
| media, 390px and 1280px, clipped | 0 | 0 |
| publishing, 3,000-line work, open | 2000/66579 | 66579/66579 |
| publishing, 3-line work, open | 83/83 | 83/83 |
| closed state, both pages | 0 | 0 |
| page errors | 0 | 0 |

The first 390px run of the new code read 41/184 for every card. That was a measurement taken mid-animation after a late relayout; with a 2.5s wait, a repeat run read 0 clipped. The publishing test content had to be marked `data-no-clamp`, because `omega-readmore.js` folds any long text to two lines on its own.

**Found, not changed.** A work opened in the publishing archive is folded by `omega-readmore.js` to two lines with a MORE button, so the member opens it twice. It is by design (progressive disclosure), but inside a panel that already expands it is a double fold. It is recorded here for the owner, not changed.

**New proposal (I17).** Text areas that grow with what is typed (`field-sizing: content`): 116 textareas on 59 pages, none of which auto-grows today. MDN marks it Baseline since June 2026. LOW-RISK CSS.

**Not done / not verified.**
- A real browser without `interpolate-size` (Firefox, Safari) was not run. The fallback is the unchanged old CSS, inside `@supports`.
- The routine asks for `config/omega-page-contract-bootstrap.json` to be removed. It is tracked on `main`, so it was left in place, as in the last two weeks.
