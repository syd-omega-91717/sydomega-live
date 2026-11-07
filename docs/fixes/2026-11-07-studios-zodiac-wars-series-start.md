### Studios: Zodiac Wars Bloodlines, Season 1 bible and episode 101 (2026-11-07)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**What:** the second franchise is started. Zodiac Wars was chosen on evidence (it has the only other screenplay draft, a designed game and reconciled canon, and its series was still a bare concept). Added: a Season 1 bible for *Zodiac Wars: Bloodlines* ("The Soul Door", 8 beat sheets, 12 continuity locks against the film) and a short first draft of episode 101, "The Next Count". Registered in the registry (series status SCRIPTS_DRAFT) and visible in the owner-only library. Nothing is approved: the film it follows is itself an unapproved screenplay draft, and the canon draft it builds on says everything beyond the founder's pitch is the assistant's proposal.

**The central decision, and a premise I discarded.** The film's last line is Soul's: "You counted well. Now count the next." My first reading was that the next count was the "uncarried dead" of Ossara's forty thousand. Reading the scenes showed that was wrong: the forty thousand are the *cost of Ossara's plan*, people he counted as in the way, not an earlier massacre. The premise instead comes from the film's own text: Adaeze says clause nine of the Accord exists because "twelve thousand years ago somebody died of thirst on a world that had water they weren't allowed to touch". The season's premise is that every clause exists because someone died, and the Court remembers the reason for exactly one. Soul is the guardian of what is carried across a death, and the canon draft says the Null is what unheld things decay into.

**Three conflicts recorded in the ledger (C-22 to C-24).** C-24 is new: the registry says *Bloodlines* is 4 seasons of 8, while the canon draft and the Rise of Aries package describe a ten-episode limited series and a five-season series. Resolved under delegation: keep 4 x 8; there are four forgotten guardians and twelve Houses, so one guardian and three Houses per season (Season 1: Soul with Aries, Libra and Pisces). C-22 and C-23 record two corrections to the Myth of the Stones season bible made while scripting episode 105 (Torin's timeline and the Lamp), which had been noted in that bible and a fix entry but not in the ledger.

**Errors caught in my own draft before commit:** the Hall of the Seats had thirteen carved seats where the film has twelve House chairs and a plain thirteenth in the middle; the bible said only Kael can hear Soul while the script has Adaeze hear it in the vault (now: far away only Kael, in the vault anyone); and the Accord's "schedule" was first drawn as a list of the dead, which the film does not support.

**Verified:** `studio-canon-check.py` PASS (the regenerated franchise bibles match the registry); 81 Studios and bridge tests pass (four tests that assumed only Myth has scripts were updated, not weakened: the series-with-scripts test now asserts the exact set, the planted-violation test targets a franchise that still has no bible); the library page shows the new series card and opens episode 101 as a formatted, untruncated script at both widths.

**Not verified:** none of this has been read by the founder. New objects the founder may strike: the Schedule of Cost (a blank reason beside every clause but nine), the idea that each clause is a grave, the fourth signature (beat sheet only), and Orla's notebook (beat sheet only).
