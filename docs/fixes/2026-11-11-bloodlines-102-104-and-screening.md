### Zodiac Wars: Bloodlines 102 to 104; every written episode can be screened; the animatic filled a quarter of 2x screens (2026-11-11)

**Why.** The owner asked to continue producing series and episodes with strong ideas and visual production. Measured first (`docs/studios/COMPLETENESS.md` on `main`): 13 of 166 declared episodes existed, all short drafts; *Zodiac Wars: Bloodlines* had a season bible with eight beat sheets and one episode. The Screening Room played only each series' episode 101 (`omega-studio-library.js` read `episode:<id>:101`), so a new episode had no picture at all. And looking at a 375px render at deviceScaleFactor 2 showed the film drawn in the top-left quarter of the canvas with its label cut off.

**Fix.**
- Three episodes, short first drafts in the existing format (cold open, three acts, tag), about 8,400 words: `E02_THE_HEARING`, `E03_THE_OLD_STORY`, `E04_WHAT_THE_FOUNDRY_KEPT` under `docs/studios/franchises/zodiac-wars/series/bloodlines/season-1/episodes/`. Each follows its beat sheet and ends on the bible's cliffhanger. Each Notes field lists what is the film's and what is new. The bible gains a "Scripting changes" section. No new named character.
- Registered in `config/omega-studio-registry.json`; `library-data.ts` and `COMPLETENESS.md` regenerated (16 of 166 written, 150 remain).
- Screening Room: an episode picker. Any written episode's cold open plays; 101 keeps the franchise's picture, a later episode gets its own seed (`plan(franchise, text, variant)` in `omega-animatic.js`).
- `omega-animatic.js` `draw()` no longer calls `setTransform(1,0,0,1,0,0)`. The page scales the context by devicePixelRatio and `draw()` was undoing it on every frame. The "NOT FOOTAGE" label now shrinks to fit a narrow frame.

**Verified.**
- `test_animatic.py`: 11 tests (3 new). Against `main`'s `omega-animatic.js` the transform test and the seed test fail; with this change all pass.
- `test_studio_library.py` updated to the new inventory (16 teleplays; four Bloodlines titles). `studio-canon-check.py`, `studios-presence.py`, `studio-library.py --check`: PASS.
- Headless Chromium, owner payload stubbed from `scripts/studio-library.py`, at 1280 and at 375 (deviceScaleFactor 2): the episode row appears; each of 101 to 104 shows its own first lines as captions (Hera and the Old Clerk; Ima counting the drawers; Brannock and Tamsin) and then its title card; 0 overflow, 0 page errors. Lit pixels at 375 went from 4-5% (quarter frame) to 14-15% (full frame); the frames were looked at.

**Not done / not verified.**
- These are scripts and a procedural animatic. No footage, voice, music or finished art exists, and none can be made in this repository.
- The picture for 102 to 104 is the franchise's nine-ring scene with a different seed. The Hall, the Archive and the Foundry are not drawn.
- Episodes 105 to 108 are not written. Content is unapproved: a proposal on a bible that is itself a proposal.
- The synthesized score was not listened to (no audio device).
- Merging redeploys the owner-only `studio-library` function with the larger payload; that was not exercised live.
