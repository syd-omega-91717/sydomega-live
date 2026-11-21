# Panel eligibility registry: which pages may be hosted in place

Date: 2026-11-21. Stage 1 (second half) of `docs/OMEGA_ONE_SHELL_PLAN.md`.

The shell must never try to host a page that cannot be hosted, and must never host one that policy keeps standalone.
Hostability is measured in a browser (`scripts/panel-census.js`, about 10 minutes), which CI cannot run on every PR, so the
measurement is committed as data and a static gate keeps the data honest.

## What was added

- `config/omega-panel-eligibility.json` (33 KB): one entry per root `*.html` page, with status, reason, measurement and a short content hash.
- `scripts/panel-eligibility.py`: `--check` (default, static, no browser), `--summary`, `--build DIR` (census output -> registry).
- `scripts/tests/test_panel_eligibility.py` (24 tests, including planted violations for every rule).
- Wired into `ci.yml` ("Panel eligibility registry") and `scripts/ci-local.sh` (step 2o2). `ci-parity-contract` and `workflow-contract` pass.

## Measurement (full census of `main` at 7fc6522, all 241 pages except the host `life.html`)

| status | pages |
|---|---|
| hostable | 218 |
| needs-fix | 0 |
| navigates-away (redirect stubs / auth redirects) | 10: enterprise, graph-anomalies, graph-centrality, graph-evidence, graph-explorer, graph-timeline, graphify, observatory, settings, sovereign-covenant |
| standalone-by-policy (public / signed-out) | 7: 404, account, enter, index, pending, reset, terms |
| excluded-pending-review (money, KYC, privacy) | 6: kyc, marketplace, payments, privacy, subscriptions, wallet |
| unmeasured (the census host) | 1: life |

Before stage 1, 222 of 241 loaded and 4 genuinely failed. Now none fail: `honors`, `matrix`, `media`, `sovereign-ai` measure hostable.
The 6 excluded pages were not "failures": the census says they would load, and policy keeps them out anyway
(`docs/OMEGA_ONE_SHELL_PLAN.md` section 10). `--check` makes it impossible to mark one `hostable` without a reviewed change to the script.

## What `--check` enforces

Every root page present exactly once; valid status; a reason for every non-hostable page; policy pages carry the status policy requires;
a hostable page records 0 errors and >= 40 chars; every page `omega-single-page-workspaces.js` enables as a panel (80 pages) is `hostable`;
the counts block equals the entries. Pages edited after measurement are reported as a warning (never a failure).

## Evidence

- `python3 scripts/panel-eligibility.py` -> PASS, 242 pages. 24 unit tests pass.
- End-to-end control on the real file: marking `kyc` hostable and deleting `habits` made the CLI exit 1 with three errors; restored, exit 0.
- `audit.py` 0 critical / 8 warnings, `omega-registry.py --check`, `context-budget.py`, `ci-parity-contract.py`, `workflow-contract.py`, `test_script_help_contract`: pass.

## Not done / limits

- The registry says a page LOADS with content and no error. It does not say it behaves like the standalone page. Enabling a page as a hub tab
  (`PANELS`) still needs the stricter comparison (same controls, same storage written). Nothing here changes any hub.
- The measurement is a point in time. CI cannot re-measure; it only reports how many pages changed since. Refreshing means re-running
  the census and `--build`.
- The census stubs Supabase, so it proves the client is wired, not production behaviour.
- "navigates-away" lumps redirect stubs with auth redirects; the reason text says so rather than guessing which is which.
- The registry is internal data for now. `scripts/vercel-build.sh` copies a `config/*.json` into the site only when a page or script references
  `/config/<name>.json` (or `config/public-config.txt` names it); nothing references this file yet, so it is not shipped
  (checked: `public/config/omega-panel-eligibility.json` does not exist after a build). The stage 2 shell will fetch it, and the build then
  includes it automatically and fails if it is missing.
- `OmegaPanels.open(url, host)` is still not extracted; stage 2 needs it.
