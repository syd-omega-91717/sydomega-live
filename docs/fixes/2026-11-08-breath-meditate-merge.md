# Breathwork and meditation were one subject on two pages; now one page

**Date:** 2026-11-08. **Owner instruction:** "Merge every pages could be merged without elimination. You choose which pages could be merged."

## What was wrong
`breath.html` and `meditate.html` were two breathing trainers. Both defined a technique table (box, 4-7-8, resonance, sighing), each with its own ratios (`RESONANT` was 5-5 on one page, which made it identical to `COHERENCE`, and 5.5-5.5 on the other), each with its own log, history and science text. A member had to know which of two near-identical pages held which technique and which log held which session.

## What was done
`breath.html` is now the one page (it was the better one: hardened log loading, a fixed colour bug). From `meditate.html` it took, with nothing dropped:
- the techniques it lacked: TRIANGLE (4-4-8) and ENERGIZE (2-0-2-0); RESONANT corrected to 5.5-5.5 so it is no longer a duplicate of COHERENCE; the Wim Hof and Ujjayi descriptions, marked **guide only** because the timer cannot run them;
- timed sessions (2/5/10/15/20 min), converted to whole cycles of the chosen technique;
- pause and resume (resuming restarts the phase it was in; paused time is not logged);
- the affirmations, the day streak, the favourite technique and the extra science text.

The two logs are **not** merged on purpose: `omega-today.js` and `omega-life-log.js` read `omega_meditate_log` as STILLNESS minutes. A session chosen by time still writes there; a session chosen by cycles writes to `omega_breath_log`; the history tab reads both. No stored session is moved or deleted.

`meditate.html` is deleted with permanent redirects (`/meditate`, `/meditate.html` to `/breath`). Every link, search entry, previous/next chain, registry and baseline that named it was updated; the page count claim is 241.

## Evidence
- Browser run (`check-breath.js`, desktop and 375px, fake clock): 48 checks pass, including a full 2-minute TRIANGLE session of 8 cycles with a pause in the middle (the paused minute is not logged), a 3-cycle session, the history counting both logs, a hostile technique name in storage staying inert, and no page errors.
- `scripts/tests/test_breath_merge.py` (5 tests): the page is gone and redirects, nothing still links to it, the techniques are present, both log keys survive, no new inline handler, the shared escaper is used.
- `./scripts/ci-local.sh`: all 35 blocking checks pass. It first failed on the page-contract audit, the CSP inline ratchet (I had added an inline handler; replaced with `addEventListener`), the escape-copy ratchet (I had written a local escaper; replaced with `OmegaEsc`), the owner-deck registry and the page-world contract.

## Not verified
Nobody has used the merged page on a phone; the audio-free breathing circle was checked by logic and layout, not by feel.
