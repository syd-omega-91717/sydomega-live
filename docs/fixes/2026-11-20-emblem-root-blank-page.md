# Every page blanked after load: data-omega-emblem collision on `<html>`

Date: 2026-11-20

## Root cause (measured in a headless render, signed-in stub)

`omega-page-world.js` (introduced in 0c9dd4d) published the archetype's emblem token as
`<html data-omega-emblem="...">`. `omega-emblems.js` treats **any** `[data-omega-emblem]` element as a
"fill me with an SVG" target (`fill()` -> `el.innerHTML = svg(sign)`), so ~1.4 s after load it wrote to
`document.documentElement.innerHTML`. Instrumented trace: `DCL shell=1` -> `load shell=1` ->
`SET innerHTML on HTML (omega-emblems.js:107 fill)` -> `tick shell=0`. Same shape as CLAUDE.md §8.1 class 5(b):
one attribute, two owners. Reproduced on `sovereign-core`, `dashboard`, `forge`, `agents`.
`omega-visual-evolution.css` `[data-omega-emblem]{filter:drop-shadow(...)}` also matched `<html>`.

## Fix

- `omega-page-world.js`: root attribute renamed `data-omega-world-emblem` (no CSS/JS reader of the old root value existed).
- `omega-emblems.js`: `fill()` refuses `document.documentElement` / `document.body` (defence in depth).
- `scripts/tests/test_omega_experience_v6.py` pinned the old name; updated.
- New `scripts/tests/test_emblem_root_collision.py`.
- ChatGPT's `sovereign-core` page loaded two clock scripts (`omega-sovereign-core-clock.js` declared `tick`
  twice and started two intervals; `sovereign-core.js` was a third copy). Kept the contract-listed
  `omega-sovereign-core-clock.js` as one visibility-aware timer; removed `sovereign-core.js` and its tag.

## Evidence

After: `.shell` count 1 on sovereign-core/dashboard/profile at 4.5 s, `data-omega-emblem` absent on `<html>`,
`data-omega-world-emblem="command"`, 0 page errors. `node --check`, `audit.py` (0 critical / 8 warnings),
`check-inline-js.py`, `module-contract.py`, `test_omega_experience_v6` all pass.

## Not verified

- `omega-registry.py --check` refuses on this shallow clone; run it with `fetch-depth: 0`.
- Production behaviour not fetched; Supabase stubbed, so this proves the DOM wipe, not production RLS.
- Why `verify-runtime.js` passed while the page was blanking is not yet established.
