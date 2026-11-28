### Zodiac Wars: fighters drawn too small against the arena (2026-11-28)

**What.** In the Slice 0 prototype merged in #1611 the fighters were about 128 px tall in a 420 px arena (the knight painted 32.6% of the frame height), easy to lose against the forge floor. I had listed this as an open gap in that PR.

**Fix.** `omega-zw-game.js` only: the body and head are drawn `K = 1.45` times larger (about 47% of the frame). The arm is deliberately NOT scaled: it now ends exactly `reach` units from the body's centre at full extension, so the picture still shows the rule's reach (before, it was 10 units past it). The guard arc, the open-frame marker and the hit spark are scaled with the body. No rule changed; `omega-zw-logic.js` is untouched.

**Verified.** `node scripts/verify-zw-game.js`: PASSED 24 of 24, including a new check that the knight (found by its body colour) paints 40-60% of the frame height. The same script on pre-change `main`: only that new check fails (`share: 0.326`); the other 23 pass. I looked at a screenshot of the duel.

**Not done.** Still no human playtest and no 60 fps measurement on a device. The Libra and the Unbled were checked by the screenshot only; the new check measures the Aries body.
