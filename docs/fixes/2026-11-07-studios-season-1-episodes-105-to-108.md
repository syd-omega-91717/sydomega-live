### Studios: Season 1 episodes 105 to 108 (short first drafts) (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What:** the four remaining Season 1 episodes of *The Chronicles of the Guardians* as short first drafts (a cold open and three condensed acts, 14-16 of about 50 pages each): 105 *The Traitor's Memory*, 106 *The Fifth Stone*, 107 *The Sundering*, 108 *The Last Guardian*. Season 1 is now eight short drafts. They are registered (`series.scripts` 4 to 8) and appear in the owner-only Studio Library (14 documents, about 51,600 words). Nothing is filmed, approved or released.

**Canon errors found in the bible by scripting, and how each was handled** (the film is the approved source, so the script follows it and the bible is corrected, listed under "Scripting changes" in `BIBLE.md`):
1. Lock 8 said Torin joined the Wardens at 22 and "fell out twenty years ago"; the film makes him 42, so he would have joined and left in the same year. Now: placed with the Wardens at 18, expelled at 22.
2. The bible had the Lamp whisper to Torin in 105, which breaks its own Lock 7 (the Lamp speaks to no one but Seraphine). Now: the Warden key carries Torin's word to the Citadel and the Lamp tells Seraphine.
3. Self-review of my own drafts caught: a flashback whose dates did not add up (105); Lyra "seeing" Kharesh on a notebook page she could not have seen (106, now the Anvar slab); Malachar's paper bird used for a different character (107); an order from Malachar ("take nothing") that the film's dart raid contradicts (108).
4. 107 adds one invention that the film's closing exchange depends on: the six Guardians decide the night before to shear the stones if Verran sits, knowing the city pays, and do not tell Malachar because his daughter is in it. It is a proposal, flagged in the file's Notes.

**Library change:** `scripts/studio-library.py` now reads an episode's title from its own `Episode:` header (a filename cannot hold the apostrophe in "Traitor's"), with the filename as fallback; `test_studio_library.py` pins it.

**Verified:** `studio-canon-check.py` PASS; 64 Studios tests pass; headless Chromium at 1280 and 375 wide: eight episode buttons 101..108, 105/107/108 open, are formatted as scripts and contain their key lines, no truncation, 0 page errors; `studio-library.py --check` current.

**Not verified:** the live owner path (see the separate #1199). Nothing here is approved: the Season 1 and film open questions remain the founder's.
