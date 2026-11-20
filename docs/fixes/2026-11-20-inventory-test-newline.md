# Fix 999-point inventory test: literal backslash-n instead of newline

Date: 2026-11-20

`test_omega_999_point_inventory.test_counts_duplicates_and_missing_numbers` was red on `main` since #1461.
The test inserts an "unrelated leading line" with `"Unrelated leading note\\n" + source`. In Python that is a
literal backslash and `n`, not a newline, so the note was glued to the first bullet (`...note\n* 1. First`),
the parser correctly stopped seeing bullet 1, and `BP-001-...` vanished from the ID list. The test, not
`scripts/omega-999-point-inventory.py`, was wrong.

- Test now writes a real newline and also asserts the point count is unchanged, so a dropped bullet reports
  as a count mismatch instead of only a hash-list diff.
- Script untouched: with a real newline all four IDs are identical before and after the insertion.

Evidence: `python3 -m unittest scripts.tests.test_omega_999_point_inventory` 2/2. Mutation control: adding
`"line": line_no` to the identity dict makes the test fail, so it now detects line-number-dependent IDs.
Not verified: the full CI `verify` job on GitHub (this change not yet pushed when written).

## Second gate this test was masking

The `verify` job stops at its first failing step, so the red inventory test hid `omega-registry.py --check`,
which was also failing on `main`: `OMEGA_SKILL_REGISTRY.md` still said 299 root `.js` files / 2847 KB after
#1462 deleted `sovereign-core.js` and rewrote `omega-sovereign-core-clock.js` (now 298 / 2848 KB). That drift came
from this session's own earlier change, which merged while `verify` was already red for the unrelated test
above. Regenerated with `python3 scripts/omega-registry.py` on a full (unshallow) clone; `--check` now passes.

Evidence: `omega-registry.py --check`, `capability-audit.py --check`, `release-gate.py` PASS; `ci-local.sh`
34 of 35 blocking steps pass locally, the 35th (`omega-responsive-surface-contract.py`) needs a built `public/`
and PASSes (250 pages) after `scripts/vercel-build.sh`. The build rewrites two tracked config files
(`config/omega-page-contract-bootstrap.json`, `config/omega-page-hub-ownership.json`); those were restored, not committed.
