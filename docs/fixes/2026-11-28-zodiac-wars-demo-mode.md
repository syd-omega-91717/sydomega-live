### Zodiac Wars: a labelled demo mode (2026-11-28)

**Decision.** The owner asked for "animated real movies and games and images for each feature" and delegated the choice of track to me. The honest version I can build and verify is for the game to show itself: a WATCH A DEMO button on `game-zodiac-wars.html` in which the scripted player the tests already use plays a whole duel on the current seed, in the real game, with real rules. It is **not** a trailer, not footage, and carries no invented content; it is gameplay of a prototype, labelled as such.

**What it does.** A real click restarts on the current seed and House and lets `OmegaZW.bot` play. While it plays, the status line reads "DEMO: SCRIPTED PLAYER, NOT A PERSON", and the message line says to press any control to take over. Any real key, tap or gamepad input hands the game to the person at once, mid-duel, and the message says "You have the controls." The duel is recorded like any other, so the existing replay button works on a demo. Files: `omega-zw-game.js` (about 10 lines), `game-zodiac-wars.html` (one button), a comment in `omega-zw-logic.js`.

**Verified.**
- `node scripts/verify-zw-game.js`: PASSED 29 of 29 (24 before, plus 5): the label appears after a real click; the demo plays the dummy and the Unbled to a win with no input; it stays labelled to the end; a real keypress removes the label while the game goes on; the takeover is stated in words.
- The same script against `main` (no button) fails: `page.click` times out waiting for `#zw-demo`.
- `test_zw_logic`: 16 tests OK (one new: the button and the label text exist).
- 390 px phone: no horizontal overflow. My first label ("... PRESS ANY CONTROL TO TAKE OVER") wrapped to three lines and ran behind the page's floating button; I shortened it to the essential claim (81 characters in total on the line) and moved the instruction to the message line. A first run of the label check also failed because I read the label in the same instant as the click, before the next screen frame drew it; the test now waits up to a second for it.

**Not done / not verified.**
- The scripted player perfect-guards every strike, so a demo shows a flawless duel: it is not a picture of how a person plays, and a viewer could think the game is easier than it is. The label says "scripted player", but it does not say "flawless".
- No sound check of the demo; no human has watched or played it; 60 fps on a device is not measured.
- I did not build trailers or illustrations for the other pages. Doing that credibly needs the owner's story and art direction, which I will not invent.
