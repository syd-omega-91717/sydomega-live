---
name: verify-in-browser
description: Verify a change to sydomega-live by rendering the real pages in headless Chromium, and run repo-wide scans (page errors, mobile tap targets, horizontal overflow, duplicate ids, fixed-chrome collisions, dead inline handlers). Use whenever a change touches bg.js, nav.js, any omega-*.js module, or page markup/CSS — and before claiming any UI fix works.
---

# VERIFY IN BROWSER

## Why this exists

This platform has no build step and no tests for its client code. `node --check`
and `scripts/check-inline-js.py` prove a file *parses*; they cannot see that a
sidebar never rendered, that a modal covered every control, or that a `<select>`
was 165px wide inside a 375px phone. Nearly every real bug in `CLAUDE.md` §8 was
found by rendering the page, and several were found *only* after a fix looked
correct in source.

The harness in `harness/` is the part worth not re-deriving. Every gotcha below
cost a wrong conclusion at least once before it was understood.

## Prerequisites

Playwright is not a repo dependency (no build step — keep it that way). Install
it into the agent scratchpad, not the repo:

```
cd "$OMEGA_SCRATCHPAD" && npm i playwright      # PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 is preset
export OMEGA_SCRATCHPAD=/path/to/scratchpad     # session.js resolves playwright from here
node .claude/skills/verify-in-browser/harness/serve.js &   # static server on :8765
```

Chromium is already at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.
Never run `playwright install`.

### On a Windows checkout (self-hosted runner, local dev)

The Linux Chromium path and `serve.js`'s hardcoded `ROOT` do not apply.
`session.js`/`scan.js` need porting; the pieces that transfer directly:

```
cd "$SCRATCH" && npm i playwright-core        # -core: no bundled browser
```
```js
const { chromium } = require('playwright-core');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
// channel:'chrome' (or 'msedge') uses the system browser already on Win11 —
// no download, no `playwright install`.
```

Everything else is identical: still `serviceWorkers: 'block'`, still route
`**/vendor/supabase-js.js` and `https://esm.sh/**` to `sbstub.js`'s `STUB`,
still pre-seed `omega_demo_watched_at` / `omega_consent_v1` / `omega_last_gate`,
still remove `#omega-genesis` after load. Serve the repo with a 20-line static
server whose `ROOT` is the checkout path and that sends `cache-control: no-store`
(copy `serve.js`'s body, fix the two constants). Verified working:
`getComputedStyle` reads `animation-name` correctly, `reducedMotion: 'reduce'`
in `newContext` exercises the `prefers-reduced-motion` path.

## Repo-wide scans

```
node .claude/skills/verify-in-browser/harness/scan.js errors     # uncaught throws / rejections
node .claude/skills/verify-in-browser/harness/scan.js taps       # controls under 24x24 px at 375
node .claude/skills/verify-in-browser/harness/scan.js overflow   # pages scrolling horizontally
node .claude/skills/verify-in-browser/harness/scan.js dupids     # duplicate ids in the live DOM
node .claude/skills/verify-in-browser/harness/scan.js chrome     # fixed bottom widgets, clipped/covered
node .claude/skills/verify-in-browser/harness/scan.js handlers   # inline onclick naming a missing fn
node .claude/skills/verify-in-browser/harness/scan.js canvas     # canvases that can never paint
PAGES=dashboard.html,vault.html node .../scan.js taps            # limit the sweep
```

Each mode prints a single headline number. Record that number before and after
a change — a headline that does not move means the fix did not land.

## Writing a one-off check

```js
const S = require('.claude/skills/verify-in-browser/harness/session.js');
const { browser, ctx } = await S.launch({ width: 375, mobile: true });
const page = await S.open(ctx, 'dashboard.html');   // waits, then dismisses overlays
// ... assert ...
await browser.close();
```

For a real before/after, pin the old files rather than editing the tree:

```js
const pin = S.gitShow('HEAD~1', ['bg.js', 'nav.js']);
const before = await S.launch({ pin });
```

## The gotchas — read these before trusting any result

**esm.sh is unreachable from the sandbox, and a failed module import runs
none of that module's code.** Every gated page does
`import{createClient}from'https://esm.sh/@supabase/supabase-js@2'` at the top
of a `<script type="module">`. Without the stub, every `window.foo = foo` in
that module never executes, and a scan reports dozens of "missing functions"
that are fine in production. A previous session's first dead-handler scan
reported 44 pages / 66 missing functions this way; with the stub it was 9 / 13,
of which 6 were real. `session.js` installs the stub automatically — the tell
that you have bypassed it is a result that contradicts `CLAUDE.md`'s record.

**`serviceWorkers: 'block'` is mandatory.** `sw.js` proxies fetches and slips
straight past `ctx.route()`, so a stubbed request silently is not stubbed.

**Four overlays cover the viewport on a fresh visit.** `#omega-genesis`
(bg.js, z-index 100000) is not storage-gated — `S.open()` removes it from the
DOM after load. The other three are, and `session.js` pre-seeds their keys:
`omega_demo_watched_at`, `omega_consent_v1`, `omega_last_gate`. A `page.click()`
that times out "waiting for element to be stable" is almost always one of these.

**Do not serve files from a cache.** `serve.js` sends `cache-control: no-store`
deliberately. An earlier harness cached file contents and served the pre-fix
copy, making a real fix look like it had failed.

**`git stash` does not give you a BEFORE once you have committed** — there is
nothing to stash and the "before" run executes the fixed code. Use
`S.gitShow(rev, files)` with `launch({ pin })`.

**Geometry is not reachability.** Six fixed widgets compete for the
bottom-right corner. Always hit-test with `document.elementFromPoint` at the
element's own centre and check the result is that element or a descendant —
`session.js` exports `REACHABLE` for this.

**`translateX(-50%)` overflow to the left never grows `scrollWidth`.** The
`overflow` scan is correct and will still report 0 pages while a centred fixed
dock hangs off both edges. Use `chrome` mode for fixed, centred widgets.

**Diff subtrees, not whole-page accessibility trees.** A whole-page a11y diff
taken seconds apart shows the live trial timer and the cookie banner as
"changes" and will report text loss that is not real. Snapshot with
`page.accessibility.snapshot({ root })` on the element you touched.

**36 of 43 `.tbl-wrap` instances live in `display:none` tab panels** and never
enter the accessibility tree at load. Force the panels visible before
measuring, or report honestly that you measured 4 of 43.

**Pages redirect, so the filename you asked for is not the page you measured.**
With a signed-in session, `account.html`, `pending.html` and `terms.html` land
on the dashboard. A scan that labels results by requested filename turned one
real dead canvas into six phantom ones. Always record `location.pathname` after
load and dedupe on it — `scan.js canvas` does.

**`pin` must serve each file with the content type its extension implies.**
Serving a pinned `.html` as `text/javascript` makes the browser refuse to parse
it as a document, and the "before" run then reports every element as absent —
which reads as a dramatic improvement and is not one. `session.js` handles this;
if you hand-roll a `ctx.route`, do the same.

**`#omega-particles-canvas` reads blank on every page and is not a bug.**
`omega-particles.js` hands its canvas to tsParticles from a CDN the sandbox
blocks, so it sits at the 300x150 default with `opacity:0`. It works in
production. `scan.js canvas` skips it by name.

**A canvas sized from `offsetWidth` at DOMContentLoaded gets a zero buffer.**
The approval guard still hides `#app` at that point, so the page measures 0,
sets `canvas.width = 0`, and a zero-width buffer can never paint — and
revealing `#app` fires no resize event to recover. This killed the dashboard's
`#galaxy-canvas` and `ecosystem.html`'s `#eco-canvas` outright. A
`ResizeObserver` is the fix; `scan.js canvas` is the detector.

**`graph.html`/`map.html`/`realm.html` no longer throw at all — d3, Leaflet
and three.js are vendored (`494ad666`) and load same-origin from `/vendor/`,
never a CDN.** This note used to say the opposite; corrected after a full
204-page `scan.js errors` run reported 0 pages with uncaught errors. If one
of these three throws again, it is a real regression, not sandbox noise.

## Rules

- A headline number before and after, from the same command, is the evidence.
  "Looks right" is not.
- Drive the real control — `page.click('[data-search-trigger]')`, a real
  `tap()` on a touch context — not the function behind it. Several bugs in
  `CLAUDE.md` §8 were reachable only through the real event path.
- When a scan contradicts `CLAUDE.md`'s record, assume the harness is wrong
  first and find out why. That instinct is what caught the esm.sh problem.
- Report the skipped cases. "36 of 43 measured, 7 skipped because their tab
  panel was hidden" is a result; "43 verified" would not have been true.
