### Map source labels below the platform's 12px type floor turned main red (2026-11-21)

**Why.** `.ons-src{font-size:9px}` in `omega-one-shell.js` (the "source" caption in each map panel header, added in #1476) is below the 12px floor `scripts/type-scale.py` enforces. CI's "Static contract gates" job ran 86 gates and failed exactly one, `type-scale` (job 136803685750, head `3aa8648`); the other 85 passed. #1476 merged afterwards, so `main` carried the failure. I missed it because I ran `scripts/tests` and `audit.py` locally but not this gate; `ci-local.sh` would have caught it.

**Fix.** `font-size:9px` → `12px` on `.ons-src` (the tool's own `--apply`; it rescaled exactly one site repo-wide).

**Verified.** `python3 scripts/type-scale.py --check` before: "1 rescaled, 9px -> 12px, omega-one-shell.js"; after: "OK -- no page declares type below the 12px floor." Rendered at 1440×900: the panel headers fit and nothing overflows. `omega-registry.py --check` matches. The browser suite (`scripts/shell-check.js`) was 38 passed, 0 failed on the commit before this one; it was not rerun for a font-size change.

**Not done / not verified.** The other 85 contract gates were seen passing in CI on the pre-merge head only; this branch has not been through CI yet. I did not run all of `ci-local.sh`.
