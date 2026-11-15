# One hover drew three tooltip boxes; the header jargon now explains itself (2026-11-15)

**Class:** two modules doing one job (CLAUDE.md 8.1 class 5), found while checking what a first-time member sees on `dashboard.html`.

## Measured, before (unmodified `main`, headless render, desktop hover on the first visible `[data-tooltip]` element)
| page | tooltip elements | boxes drawn on one hover |
|---|---|---|
| academy, gaming, profile | 1 each | **4** |
| cosmos, dashboard, series, trailers, vault | 1 / 11 / 7 / 1 / 1 | **3** |
| family | 1 | not testable (no visible candidate) |

Cause: `omega-tooltip.js` and `omega-oss.js` (`OSS.initTooltips`) each mounted tippy on every `[data-tooltip]`, both injected by `bg.js`,
and `omega-oss` re-ran on every populate event and stacked another instance each time. The boxes sat on top of each other so it mostly
read as a heavier, slower tooltip, but any element with `data-tooltip-placement` drew one box per placement (seen as two boxes, one above
and one below the header chip, in a mobile screenshot).

## Fixed
- `omega-tooltip.js` owns `[data-tooltip]`: it destroys an instance another initializer left on the element instead of stacking, and uses `touch: true` (tap).
- `omega-oss.js` mounts only on elements nothing has claimed (`!el._tippy && !data-tippy-content`), so a re-run is idempotent and the module is still a fallback.
- `dashboard.html`: `AUTH`, `MY GATE` and `MY ELEMENT` get a plain-language explanation and `tabindex="0"`. Wording is taken from text already on the
  platform (the authority KPI tooltip, the 12-gate range, the element-from-sign rule); it states that AUTH is "a standing ..., not money".

## Measured, after (same script, same pages)
Every one of the 8 pages with a visible candidate draws **1** box on hover (dashboard 14 tooltip elements, all mounted; series 7/7). On a 390px
touch viewport a single tap on the AUTH chip opens exactly one box, at 300, 900 and 2000 ms; tapping a second element closes the first. 0 console errors on all 9 pages.
`scripts/tests/test_tooltip_single_owner.py` passes on the fix and fails 4 of 5 on the original files (the fifth checks the check).

## Corrections to my own earlier claims
- I said tooltips on a phone needed a long-press. That was read from the code (`touch: ['hold', 400]`), not measured. Rendered, tap already worked
  because `omega-oss`'s duplicate instance used tippy's default. Collapsing to one owner would have silently turned tap into long-press, so the option is now `true`.
- My first mobile "0 boxes" result came from the test script emulating a mouse move on a touch device, not from the page; removing that line gave 1 box.

## Not changed, and why
- `PMI` in the mission bar and the `PLATFORM PMI` tile still show a hand-typed score as if measured; the owner's own 2026-09-27 rule says not to. Whether to remove,
  owner-gate or relabel it is the owner's decision. Logged as OPEN in `GAP_ANALYSIS.md` §S.
- The explanations are English text in `data-tooltip` (as the other 25 on the platform are), not in the six i18n packs.
- Not reviewed by Codex (usage limit).
