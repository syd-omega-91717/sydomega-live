# sovereign-core: legible header over the ambient orrery on narrow screens

Date: 2026-11-20

At 375px the header (brand, tagline, clock, date) sat on a transparent bar directly over the platform's ambient
orrery, which is drawn on the fixed `#omega-fx` canvas (z-index -1, shared by every page). In a render the date
"NOVEMBER 20" was crossed by a gold Ω and a white planet. Isolated by hiding layers one at a time: hiding
`#omega-particles-canvas` left the overlap; hiding `#omega-fx` removed it.

The layer is deliberate platform furniture, so it is not touched. `.sc-topline` gets a glass backing
(`rgba(7,9,16,.78)`, 10px blur, 12px radius, gold hairline) at `max-width:620px` only, per the cinematic spec's
"keep contrast readable against glass backgrounds". Desktop is unchanged (background stays transparent at 900px).

Evidence (headless Chromium, stubbed Supabase): no horizontal overflow at 320 / 375 / 600 / 900; date not clipped
at any width; 0 page errors; `verify-runtime.js` PASS (contrast scan included); `audit.py` 0 critical / 8 warnings;
`check-inline-js.py`, `csp-inline-ratchet.py`, `omega-registry.py --check` pass.
Not verified: real-GPU rendering of `backdrop-filter`; the same transparent-header pattern on other pages was not surveyed.
