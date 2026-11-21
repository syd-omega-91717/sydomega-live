# OmegaPanels.open(url, host): the page loader no longer depends on tabs

Date: 2026-11-21. Stage 1 of `docs/OMEGA_ONE_SHELL_PLAN.md` (the last item: "extract `OmegaPanels.open(url, host)`").

`omega-panels.js` could only host a page through a tab strip: the loading logic lived inside `mount()` and was tangled with tab buttons,
`centerTab` and a scroll on the host. The one-shell router has no tabs, so it needs to load a page into any element.

## Change (behaviour-preserving for tab mounts)

- New `view(stage, hooks)`: owns the stage, the token, `teardown`, the inline-event "current panel" wiring and the load. It knows nothing about tabs.
  Hooks: `opening(key)`, `loaded(key)`, `closed()`. `open(o)` takes `{key, label, src, scroll, host}` and returns a promise that resolves when the page is in or the
  "could not load here" message is showing. It never rejects.
- `mount()` keeps only the tab UI and is now a client of `view()` (`opening` sets `aria-selected` and centres the tab, `loaded` centres it again, `closed` clears selection).
  Order of operations was kept the same as before.
- Public: `OmegaPanels.open(url, host, {key, label, scroll})`, `OmegaPanels.close(host)`, `OmegaPanels.current(host)`. `open` rejects a non-element host and a host that is
  already a tab mount (both with a clear error); calling it again on the same host tears the previous page down first.
- `scripts/tests/test_panel_open_api.py` (7 static tests): public surface, `view()` is tab-free, `mount()` no longer loads or tears down, refusals, failures shown not thrown,
  teardown before every open and on close. All 7 fail against the pre-extraction file.

## Evidence (headless Chromium, Supabase stubbed)

- **Before/after on the real hubs, with the old file pinned from `git show origin/main`:** ascend, cosmos, order, services, intel, govern, achieve; per hub, real clicks on the first 4 tabs,
  a click on the open tab (toggle closed), `has()`. Result per hub (tab count, `aria-selected`, `aria-busy`, message, URL hash, node counts, `current()`): **identical in 7 of 7.**
  Control: `typeof OmegaPanels.open` is `undefined` for the pinned old file and `function` for the working tree.
- New API in a plain element: open loads (`current()`=water, stage filled, "OPEN FULL PAGE" link present, not busy); open again on the same host leaves one stage and the new
  page (`current()`=habits); close empties it (`current()`=null); a missing page shows "could not load here" instead of throwing; 0 page errors; 0 `data-op-style` tags left.
- Census, new engine, 121 of 241 pages (half): 120 agree with the committed registry (#1472). The one that did not (`enterprise`) navigates away in 4 of 4 runs on BOTH the old and the new engine; the
  census got it wrong once by a timing race (see below).
- `verify-runtime.js` on the 7 hubs + `life` + `dashboard`: pass. `audit.py` 0 critical / 8 warnings, `check-inline-js`, `csp-inline-ratchet`, `context-budget`, `test_hub_picker_links`,
  `test_panel_roots`, `test_script_help_contract`: pass. `omega-registry.py` regenerated: only the module size moved (2848 -> 2851 KB).

## Found, NOT fixed (for stage 2; pre-existing, identical on the old engine)

1. **Two pages leave an interval running after close.** 20 open/close cycles over 10 pages leave 2 intervals above baseline; per page, `water` +1 and `mood` +1 (`targets` -1 clears one),
   identical before and after this change. Neither page calls `setInterval` itself; both load `omega-ui.js` as a classic external script, and `loadExternal()` does not mark the panel
   as current for classic scripts (it does for modules), so anything such a script starts at load is not recorded for teardown. Cause not fully proven. Stage 2's leak test will need this fixed or an allowance.
2. **100 of the 218 `hostable` pages have their own script that can move the window** (`location.replace/assign/href=`): button handlers and auth/role redirects. A user-initiated
   `location.href=` leaves the shell when hosted. `enterprise` shows the role case: it redirects non-owners to `/dashboard.html` and signed-out users to `/account.html`, so "hostable" in the registry means
   "hostable for the signed-in member stub the census uses", not for every role. The shell has to decide how to treat in-page navigation (intercept links; accept a full-page navigation for programmatic ones).
3. **The census can misread a redirecting page as hostable** if the redirect fires after its 2.5 s window (seen once, `enterprise`). The registry's `navigates-away` entries are right; any `hostable` page with a redirect
   in its own code deserves a longer or role-aware measurement.

## Not verified

- Only 7 of 15 hubs' tab paths were compared before/after (the 7 that have `PANELS`); the rest have no tabs.
- No caller of `OmegaPanels.open(url, host)` exists yet; it was exercised from a test page, not a shell.
- The brief swap of the old engine into the working tree (for a control run) overlapped the background census for a few seconds.
