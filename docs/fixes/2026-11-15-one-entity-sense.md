### The character page now shows your tree, plays your element and reads your house, from one canon source (2026-11-15)

**Why.** The owner asked for the pieces to be built combined, not separately. The 3D Chronos tree (#1315), the per-element music (`omega-music.js`), the voice (`speechSynthesis`) and the canon's houses each existed alone, and the music had no way to be started: `omega-music.js` is loaded on every page (`bg.js:3131`) but no page carries a `data-music-toggle` button (grep over all pages).

**Fix.** On `character.html`'s Identity tab, under the card:
- a `chronos` tree mounted for the member, with `data-sculpt-sign` set from the canon track (`canon.trackBySign`) so their own house is enlarged. The scene now re-reads that attribute every frame, because the profile loads after the scene starts;
- `bootSense` in `omega-character-card.js` (the module that already owns this page's data): two buttons, **PLAY MY ELEMENT** (hands `OmegaMusic.play` the element's name from `canon.elementFor`) and **READ MY HOUSE ALOUD** (the canon's house domain and description, plus god and element, through the browser's own speech engine, asked for an English voice because the text is English);
- one plain note stating what is and is not shown. It carries `data-no-clamp`: the platform's read-more clamp (`omega-readmore.js`) was folding the caveats behind a MORE button in my first render.
- no sign table was added; the module still writes nothing.

**Verified.**
- Headless Chromium, character.html, harness stub signed in as Aries: `data-sculpt-sign="Aries"`; tree `live: true`, `records: 2953`, 21 links; **0 console errors**. `OmegaMusic.isPlaying()` is **false before any press**; after a press it is true and the label reads STOP THE MUSIC; a second press stops it. With the speech call intercepted, the voice is handed exactly "Aries. Identity. Where a sovereign's story begins -- pure concept, personal initialization. Your god is Ares. Your element is Fire." with `lang: en`. Desktop and phone (390 px, mobile): buttons stack, the whole note is readable. I looked at both screenshots; the first showed the MORE fold, fixed above, and the enlarged Aries medallion is visible in the tree crop.
- `scripts/tests/test_one_entity_sense.py` (7). Mutation run: removing the clamp opt-out, the pagehide stop, the canon read, or the tree's per-frame sign read, drifting `omega-music.js` (Taurus -> Fire), or dropping the Sand recipe, each fails. **My first version missed the most important one**: music autoplaying on page load passed, because the test only looked inside the new function. It now counts `.play(` and `.speak(` across the whole module and requires exactly one of each, inside a click handler; autoplay of the music and of the voice are both caught.

**Found on the way, not fixed (in `GAP_ANALYSIS.md`).** `OmegaSculptureDataViz.getTierProgress()` reads `profile.current_tier_progress`, a column that is not in the schema snapshot, so it returns 0 for everyone and the Ascension tower never moves with progress. The tree therefore draws **no** "you are here" marker. I will not invent a stage measure: whether "progress" means gates of twelve, phases of twelve, or something nine-fold is a canon decision.

**Not done / not verified.**
- The real speech engine was not exercised in the browser (the call was intercepted); how the voice sounds is unheard. The music was started for real (Tone loaded, `isPlaying` true) but I cannot hear it.
- English only: the module builds its strings in code, as the card already does, so these labels do not go through `data-i18n` and are not translated. The voice reads English canon text.
- No stage progress is shown (above). The deployed site could not be viewed from this session; a real GPU was not measured.
