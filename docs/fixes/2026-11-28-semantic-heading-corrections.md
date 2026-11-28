# Visual survey semantic-heading corrections

**Date:** 2026-11-28

The latest visual-page survey scans 247 HTML documents and reported 18 missing level-one-heading findings. Three are real user-facing pages, not redirect aliases or template fragments:

- `404.html`: the existing visible “404 — Node Not Found” title is now an `h1`.
- `approvals.html`: the existing localized owner-approvals title is now an `h1`; its text and layout remain unchanged.
- `pending.html`: the existing dynamic access-request status title is now an `h1`; its content remains dynamic.

No heading was added to retired redirect routes or embedded movie templates merely to silence the scanner. Those surfaces need separate classification if the survey is to distinguish full pages, redirects, and fragments.

The survey parser also now recognizes the repository's actual active-tab class, `act`, alongside `active` and `on`. This matters because the 404 and pending pages put their first heading inside an active `.tab-panel.act`; the old parser incorrectly hid that content. The approvals title has a static fallback label so the hidden-app-shell pass can classify it as AUTH-GATED until localization runs. The expected outcome is two visible-heading resolutions and one correctly classified auth-gated heading, not three false green checks.
