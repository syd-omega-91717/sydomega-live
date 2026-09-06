# SYD OMEGA 91717 — Controlled Strix Staging Execution

## Objective

Establish a reproducible security-evidence loop without placing an autonomous pentesting tool in the production runtime:

`controlled staging → Strix scan → validated finding → remediation → deterministic checks → Strix re-test → release evidence`

Strix is an external verification instrument. A clean scan is not treated as proof of complete security coverage.

## Scope rule

Only scan an environment that is owned or explicitly authorized for testing. The repository helper `scripts/strix-staging-run.sh` deliberately rejects obvious production OMEGA hosts and requires a staging/test/non-production host marker.

## Prerequisites

- Docker daemon running.
- Strix CLI installed outside the repository.
- `STRIX_LLM` set to an approved LiteLLM model identifier.
- `LLM_API_KEY` supplied through the local environment or an approved secret store. Never commit, echo, or place credentials in this repository.

Strix's official headless interface uses `-n`, repeatable `-t/--target`, `--scan-mode`, and `--max-budget`. Its documented headless exit codes are `0` for no validated vulnerabilities in the analyzed scope, `2` for validated vulnerabilities, and `1` for execution/configuration failure.

## First run

Use:

```bash
export STRIX_LLM="openai/gpt-5.4"
export LLM_API_KEY="<securely supplied provider key>"
scripts/strix-staging-run.sh https://<controlled-staging-host> standard 20
```

Do not put credentials in the command line or an instruction file committed to git.

## Evidence handling

Strix writes a run directory containing the penetration-test report, validated vulnerability records, structured vulnerability data, SARIF, and `run.json`. Preserve the run metadata with the release evidence package, but do not commit secrets or authenticated session material.

For a result to be called clean, inspect `run.json` and the report in addition to the exit code. A budget-limited run can finish without representing complete coverage.

## Remediation loop

For every validated finding:

1. Record severity, affected surface, proof of exploitability, and remediation recommendation.
2. Map the finding to the OMEGA surface and relevant ASVS control where applicable.
3. Fix the root cause in the correct ownership lane.
4. Run the deterministic repository contracts.
5. Re-run Strix against the same controlled staging target and comparable scope.
6. Require the finding to be absent or demonstrably mitigated before release.
7. Preserve before/after evidence.

Do not suppress a finding merely to obtain a green gate.

## Coverage priorities

For OMEGA's gated static application and Supabase-backed surfaces, prioritize:

- authentication/session behavior;
- approval and authorization boundaries;
- IDOR/BOLA and object-level access control;
- function-level authorization;
- input injection and XSS;
- SSRF/integration boundaries;
- sensitive-data exposure;
- resource consumption/rate limiting;
- browser-visible secrets and configuration leakage;
- business-logic paths that can mutate state.

## Production gate

A Strix clean result does **not** authorize production scanning or deployment by itself. Production verification remains a separate bounded release step after repository gates, browser verification, security evidence, and deployment evidence are all available.
