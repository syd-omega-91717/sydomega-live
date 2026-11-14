### Spatial integration script matched a menu label, so renaming MOVIES to WATCH broke its check (2026-11-14)

**Why.** #1285 renamed the `movies` menu entry from MOVIES to WATCH. `scripts/integrate-spatial-realms.js:54` decided whether the entry already existed with `src.includes("['movies','MOVIES','/movies.html'")`, a match on the member-facing label. With the label changed it tried to insert the entry again, did not find its `['cinema','CINEMA & SAGA','/media.html']` anchor, and threw `nav.js has no canonical universe navigation anchor; refusing unsafe edit`. The `materialize` job of `spatial-nav-materialize.yml` failed on #1285's head (run 43537200579, job 132268954362) and the change was merged with that check red, so `main` carried the failure. Reproduced on `origin/main`: `node scripts/integrate-spatial-realms.js` exits 1 with that message. `./scripts/ci-local.sh` passed all 35 checks because it does not run this script.

**Fix.**
- `scripts/integrate-spatial-realms.js`: the existence check matches the entry by key and URL (`/\['movies','[^']+','\/movies\.html'/`), not by label.
- `scripts/tests/test_watch_tabs.py`: `SpatialIntegrationStillAgrees` runs the script and asserts exit 0 and that `nav.js`, `gaming.html`, `cinema.html`, `movies.html` and `characters.html` are byte-identical afterwards, which is what the workflow's `git diff --exit-code` checks. It runs inside `ci-local.sh`'s unit-test step, so the gap is closed locally.

**Verified.**
- The workflow's own steps, run by hand on the working tree: the script prints `Ω spatial realm integration verified ...`, `node --check` passes, the four `grep -q` checks pass, and no file outside `scripts/` differs.
- The new test fails against `origin/main`'s script (`AssertionError: 1 != 0`) and passes with the fix.
- `./scripts/ci-local.sh`: all 35 blocking checks pass.

**Not done / not verified.**
- `.github/workflows/` was not edited (standing rule), so the workflow itself is unchanged; it should pass on this branch's pull request.
- The same script still matches `['characters','CHARACTERS','/characters.html'` by label. That label has not changed, so it was left alone.
