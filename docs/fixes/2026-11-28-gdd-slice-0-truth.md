### Zodiac Wars design document: it now says Slice 0 exists (2026-11-28)

**What.** `docs/studios/franchises/zodiac-wars/games/ascension/GDD.md` said "Nothing here is built, playable or released" and, in section 7, "No code, art, audio, roster, story script or build". Slice 0 has been a playable PROTOTYPE since #1611. I had left this open as the owner's decision (see `2026-11-28-zodiac-wars-ascension-slice-0.md`) because the document's text is embedded in the owner-only Studio Library payload, a deployed function. The owner has since delegated the call to me.

**Change.** The header now reads "Status: DESIGNED (Slice 0 is a PROTOTYPE since 2026-11-28; see section 7). The full game is not built, playable or released", and section 7 opens with an update naming the files, the acceptance items met (rules tests, the 3-duel replay check, the scripted bot) and the ones **not** met (60 fps on a named device, a person's keyboard-and-touch review, a person's reduced-motion review; no human has played it). Nothing else in the document changed.

**Payload.** `supabase/functions/studio-library/library-data.ts` was regenerated with `python3 scripts/studio-library.py --write`; the diff is one line and, compared character by character, is exactly the text above and nothing else. `studio-library` is in `supabase/config.toml`, so merging this redeploys that function (CLAUDE.md section 8.2); the function is owner-only, and the change is words in one document.

**Verified.** `test_studio_library`, `test_studio_canon`, `test_studio_productions` (47 tests) OK; `studio-canon-check.py`, `studios-presence.py` and `studio-library.py --check` pass. Not verified: the redeployed function itself (no live check from this session).
