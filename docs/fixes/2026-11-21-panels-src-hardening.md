### OmegaPanels.open refuses any source that is not a same-origin path (2026-11-21)

**Why.** PR #1473 extracted the page loader into `view().open` and exposed it as `OmegaPanels.open(url, host)`. Before, the URL
came from a developer-authored tab list; after, it is a caller's parameter, and `omega-panels.js` assigns it to `full.href` and,
in the error branch, `a.href`. CodeQL (alerts 276 and 277, "DOM text reinterpreted as HTML", high) flagged both. #1473 merged
while that check was red. The finding is real in principle: a `javascript:` URL passed to `open` fails to fetch, lands in the
error branch and is rendered as a clickable `javascript:` link. Not reachable today (the one caller, `omega-one-shell.js`, builds
the URL from a `^[a-z0-9-]+$` key; tab mounts read developer-authored `data-omega-panels`), but a public API must not rely on its
callers being careful.

**Fix.** `localPath(src)` in `omega-panels.js` resolves the URL against the page and returns `pathname+search` only for
http(s) on the page's own origin, else null. `view().open` calls it first and, on null, shows "This tool could not load here."
with no link and loads nothing. Every later use (`fetchDoc`, both `href`s, `runScripts`) uses the validated value.

**Verified.** Real Chromium, working-tree `omega-panels.js`, `OmegaPanels.open(u, host)`: `javascript:alert(1)`, `data:text/html,...`,
`https://evil.example/x.html` and `//evil.example/x.html` each render the message with 0 links and no fetch; `/honors.html` and
`honors.html` still load the real page (387 and 347 elements, links `/honors.html`, `/evolution.html`).
`scripts/tests/test_panel_open_api.py` (8 tests, one new) and the full `scripts/tests` suite (1901) pass;
`omega-registry.py --check` matches after regeneration.

**Not done / not verified.** The "before" was read from the code, not rendered. Whether CodeQL clears the two alerts is not
known until it runs on this branch; it may still flag the `href` assignments because it does not model the validator.
If so, that is a decision for the owner (dismiss with this evidence, or restructure), not something to wave through.
