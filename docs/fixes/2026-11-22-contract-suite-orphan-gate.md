### contract-suite.py did not parse on main, so 91 contract gates never ran (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Defect (measured).** CI job `readiness` failed on `bbab272` with `python -m compileall -q scripts core tests` ->
`scripts/contract-suite.py line 164: SyntaxError: closing parenthesis ')' does not match opening parenthesis '[' on line 61`.
Commit `517e02c` (#1520, "include matrix privilege closure in contract suite") inserted only the argv line
`['scripts/tests/test_advance_matrix_closed.py']),` after a closed gate tuple, without the `('id', 'description',` head. `main` carried
the same bytes, so the failure was `main`'s, not a branch's; `python3 -m py_compile scripts/contract-suite.py` reproduced it locally.

**Consequence.** Every contract gate, including the 91 the suite runs, could not execute from the suite on `main`. Two latent problems
surfaced the moment it parsed: `test_advance_matrix_closed.py` still described the closure as an unapplied proposal (3 failures against the now-applied
migration `20261122105012`), and its "scanners have teeth" case had gone vacuous against the multi-line migration.

**Fix.** Gave the entry its id (`advance-matrix-closure`) and description. Pointed the test at the applied migration (recorded in
`remote-migrations.json`, absent from `pending-migrations.json`), kept every revoke / no-caller / no-other-writer assertion, normalised whitespace so
the multi-line REVOKEs match, and rebuilt the teeth case so it weakens each revoke and asserts the pattern no longer matches. Deleted the
superseded `docs/proposed-migrations/20261115230000_omega_close_advance_matrix.sql`.

**Evidence after.** `py_compile` clean; `compileall` reports 0 compile errors; `contract-suite.py`: `91 gate(s), 0 failing`;
`test_advance_matrix_closed` 7/7. Note: `platform-experience-v6` fails in a tree holding a built `public/`; it passed once `public/` was removed.

**Second break of the same kind, found from CI (`Validate production artifact`, run on `9338cc2`).** `scripts/omega-rpc-security-policy-contract.py`
failed with `expected 72 registered functions, found 71`; reproduced locally. #1520 (`dae5313`) deliberately removed `advance_matrix` from the
`member_self` category of `config/omega-rpc-security-policy.json` (it is now executable by no API role, so it fits none of the four caller categories;
`service_only` would be false since `service_role` was revoked too) but left `coverage.expectedSecurityDefinerPublicFunctions` at 72. Set it to 71.
Only that script reads the number. `config/supabase-security-definer-exposure.json` is a dated advisory snapshot of another project and was not touched.
Verified: the contract prints PASS with 71 classified.
