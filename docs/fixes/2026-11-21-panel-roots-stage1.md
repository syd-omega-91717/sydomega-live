# Four pages that could not be hosted in place: honors, matrix, media, sovereign-ai

Date: 2026-11-21. Stage 1 of `docs/OMEGA_ONE_SHELL_PLAN.md`.

The panel census (`scripts/panel-census.js`, 241 pages) found 222 that load in place cleanly and 4 real failures.

## Causes (each reproduced with the engine's own error)

- **honors, matrix, media: "no content".** `omega-panels.js` takes content from `#app`, `.page-shell` or `<main>`; these pages have none
  (they are `div.shell > aside + div > div.page`). Their real content is not only `.page`: `honors` has three hidden tab panels, `media`
  has 28,789 characters of tab panels as siblings of `.page`. First attempt (mark `.page`) loaded `media` but threw two errors
  (`buildFranchises`, `renderFilms` write to elements outside `.page`); the right root is the wrapper `div style="flex:1;min-width:0"`.
- **sovereign-ai: `_profile is not defined`.** A classic script set `var _profile=null`, and a later `<script type="module">` read it as a
  bare global. That works standalone; the engine wraps classic scripts in a function (to stop top-level `let/const` collisions), so
  inside a panel the module could not see it. Same family as CLAUDE.md §8.1 class 4 (a global only one script assigns).

## Fix

- `omega-panels.js`: new first choice in the content lookup, `[data-omega-panel-root]` (explicit opt-in, no style or id side effects).
- `honors.html`, `matrix.html`, `media.html`: the marker on the content wrapper (1 attribute each).
- `sovereign-ai.html`: `window._activeAgent=null;window._profile=null;` (explicit, and identical standalone).
- `scripts/tests/test_panel_roots.py` (3 tests): fail on the pre-fix files (1 error + 2 failures), pass on the fixed ones.

## Evidence (headless Chromium, Supabase stubbed)

- Probe of the four pages in a host panel: all load, 0 page errors (before: 3 "no content", 1 `_profile` error).
- Standalone vs panel: `honors` 429/385 nodes, `matrix` 540/489, `media` 3443/3305, `sovereign-ai` 321/242; `media`'s two grids fill
  identically (franchise 7/7, films 12/12). The already-enabled control `water` is 200/126, so the gap is the shell-injected sections,
  not lost content. Node count is a proxy, not a behaviour test.
- `check-inline-js`, `audit.py` 0 critical / 8 warnings, `csp-inline-ratchet`, `omega-registry.py --check`, `verify-runtime.js` on the four pages
  plus `life`, `ascend`, `dashboard`: pass. `test_hub_picker_links` passes.

## Not done / not verified

- The four are not yet enabled as tabs in any hub (`PANELS`): that needs the repo's stricter comparison (same controls, same storage written)
  and is the eligibility-registry step. Interaction (tab clicks, form writes) in the panel was not exercised.
- Regression run of the census after the engine change covers a subset, not all 241 pages.
