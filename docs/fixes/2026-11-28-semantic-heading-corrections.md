# Visual survey semantic-heading corrections

**Date:** 2026-11-28

The latest visual-page survey scans 247 HTML documents and reported 18 missing level-one-heading findings. Three are real user-facing pages, not redirect aliases or template fragments:

- `404.html`: the existing visible “404 — Node Not Found” title is now an `h1`.
- `approvals.html`: the existing localized owner-approvals title is now an `h1`; its text and layout remain unchanged.
- `pending.html`: the existing dynamic access-request status title is now an `h1`; its content remains dynamic.

No heading was added to retired redirect routes or embedded movie templates merely to silence the scanner. Those surfaces need separate classification if the survey is to distinguish full pages, redirects, and fragments.

The survey parser also now recognizes the repository's actual active-tab class, `act`, alongside `active` and `on`. This matters because the 404 and pending pages put their first heading inside an active `.tab-panel.act`; the old parser incorrectly hid that content. The approvals title has a static fallback label so the hidden-app-shell pass can classify it as AUTH-GATED until localization runs. The expected outcome is two visible-heading resolutions and one correctly classified auth-gated heading, not three false green checks.


## Remaining route surfaces

The same correction pass adds accessible headings and working fallback links to the retired command, security, settings, standing, and legacy route aliases. Their existing navigation targets and JavaScript redirects are preserved. The two HTML files under `scripts/movies/` are deterministic frame-rendering sources, not deployable pages; the survey now excludes that build-time directory explicitly and reports its excluded-template count instead of treating renderer templates as user-facing pages.


## Verified survey result (PR head `4d28b46d5712943bd2b723b9f99ffc0e7135a4ac`)

- 245 deployable HTML page surfaces scanned.
- 0 structural `CONTRACT` findings.
- 15 headings correctly classified as auth-gated behind hidden application shells.
- 207 pages still require visual review for non-structural findings such as fixed-width geometry, dense tracking, or content density.
- 2 deterministic movie frame-rendering HTML templates excluded and counted separately.

This does not mean all 245 pages passed visual usability review; it means the survey no longer reports missing structural headings for these deployable page surfaces.
