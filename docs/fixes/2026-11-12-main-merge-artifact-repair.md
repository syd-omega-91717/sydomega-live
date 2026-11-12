# Main-branch merge artifact repair — 2026-11-12

## Summary

A review of the first main-branch CI run after PRs #1251–#1253 found multiple independent merge artifacts. These were not caused by the seven-destination IA or visual-survey PRs. The affected files had been edited by overlapping PRs and the resulting merged versions contained duplicated fragments rather than a cleanly reconciled final state.

## Defects corrected in this branch

1. `scripts/cloudflare-production-smoke.py`
   - Removed a duplicate, unsafe `urllib.request.urlopen` implementation that shadowed the existing validated `requests` implementation and triggered Semgrep's dynamic-URL finding.
   - Removed a duplicated incomplete parser loop and duplicate incomplete reference-check pass.
   - Kept the HTTPS host allowlist, URL validation, proxy-environment isolation, and same-origin redirect restriction.
2. `scripts/omega-runtime-adapter-coverage-contract.py`
   - Reconstructed the SQL dispatcher parser block so regular expressions operate on one combined source string.
   - Removed the malformed early comparison that had been interrupted by a parallel patch.
   - Removed duplicate imports and duplicate `all_sql` assignments; the final coverage input now includes every referenced compatibility migration.
3. `config/omega-live-module-runtime-observations.json`
   - Repaired invalid JSON caused by duplicate keys without separators.
   - Kept the latest 2026-11-12 observation values.
   - Reconciled the superseded 23/54 dispatcher observation with the later read-only provider evidence: 54/54 branches are present. The separate behavioral probe remains `RERUN_REQUIRED_NOT_PRODUCTION_PROOF`; branch presence is not represented as successful behavior.
4. `supabase/pending-migrations.json`
   - Rebuilt the registry as valid JSON.
   - Removed the stale 2026-11-11 migration from the pending list because `20261111190000` is present in the authenticated provider migration ledger and in `supabase/remote-migrations.json`.
   - Retained `20261112130000_omega_consultancy_request_id_text_compat.sql` as `PENDING_REVIEW / NOT_APPLIED`, with `blocksProduction: true`. It is not marked applied.
5. `docs/runtime/supabase-edge-functions-live.json`
   - Repaired invalid JSON caused by duplicate capture/provider timestamp properties and missing separators, retaining the latest recorded capture values.
6. Added `scripts/tests/test_main_merge_integrity.py` and a blocking contract-suite gate. It validates all three snapshots, pending-vs-applied migration separation, the validated smoke-request path, runtime dispatcher source composition, Python syntax, and the distinction between static branch coverage and behavioral verification.

## CI failures identified on main

At commit `5ad3b1a73c3d6cb57b3647649afe4965c568d566`, the following failures were observed:

- Python compilation failed in the two scripts repaired above.
- JSON parsing failed for the runtime observations, pending-migration registry, and Edge runtime snapshot.
- Static migration contracts failed before reaching a database replay because the pending registry was invalid JSON.
- Edge Function reconciliation failed while parsing its runtime snapshot.
- Semgrep reported one dynamic-URL finding in the shadowing urllib implementation.
- Exact-SHA production verification failed: the public release manifest reported `87083b6d8b05249afd86da52f27c0b6792d6f762` while main expected `5ad3b1a73c3d6cb57b3647649afe4965c568d566`.

The fresh migration replay job stopped at **Validate migration inventory**. It did not reach the actual clean SQL replay. After the registry is repaired, the next run must establish whether the SQL chain itself replays successfully.

## Explicitly unresolved / do not bypass

- `20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql` appears to contain a duplicated standalone `VALUES` fragment in the consultancy helper. The version is recorded as provider-applied. The repository contract forbids rewriting an applied migration. Do not edit, renumber, delete, or silently skip it. The clean replay must expose the exact result; any repair requires an explicit migration-history decision from the schema owner.
- The 54-action live dispatcher has 54/54 branch presence in the read-only observation, but the separate behavioral SQL probe remains unverified.
- Production remains behind main at the last exact-SHA check. This PR does not deploy or promote anything. Cloudflare production must serve the exact merged main SHA and pass the production manifest/route verification before release can be claimed.
- The `20261112130000` migration remains pending. No Supabase migration was applied by this work.

## Safety

No live database, Edge Function, provider setting, production deployment, secret, auth policy, or member data was changed. No applied migration file was edited. This PR is a source/CI integrity repair only.


## Fresh replay follow-up (PR #1254)

After repairing the pending registry, the isolated replay passed migration-inventory validation and applied the migrations through the earlier August/October chain. It then stopped in:

`20261111190000_omega_runtime_dispatch_adapter_reconciliation.sql`

The failing statement is the `omega_private.create_consult_intake(...)` function (statement 38), with PostgreSQL reporting `syntax error at or near "on" (SQLSTATE 42601)`. Source inspection shows a second standalone `VALUES ... ON CONFLICT ... RETURNING` fragment immediately after `return v_id;`, with no preceding `INSERT INTO`. This is the malformed source fragment that causes the replay failure.

Version `20261111190000` is present in the authenticated provider migration ledger and `supabase/remote-migrations.json`; it is therefore treated as provider-applied. **Do not edit, renumber, delete, or silently skip this migration.** The clean replay cannot proceed past it, so later November migrations and the pending `20261112130000` have not been replay-verified.

The schema owner must explicitly decide how to reconcile the provider-applied migration history with the malformed repository source. Any decision must preserve the live database state and provider migration ledger, document the source-history correction, and keep clean replay as a blocking check. The pending `20261112130000` migration remains `PENDING_REVIEW / NOT_APPLIED`.

## PR #1254 verification snapshot

The latest completed GitHub checks on the PR head report:

- Static contract suite: PASS, including the new merge-integrity gate (**6 regression tests passed**).
- Runtime syntax and configuration contract: PASS.
- Readiness: PASS.
- Runtime adapter coverage contract: PASS as part of the static contract suite.
- Repository integrity: PASS.
- Intelligence Fabric: PASS.
- Source-vs-live Edge Function reconciliation: PASS.
- Supabase runtime health: PASS.
- Workflow contract, CodeQL, JavaScript/TypeScript analysis, and Gitleaks: PASS.

At the time of this update, the fresh isolated database replay, blocking supply-chain scan, evidence job, and Cloudflare Pages preview were still running. No merge or production release is claimed.
