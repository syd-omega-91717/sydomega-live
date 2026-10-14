# Ω SYD OMEGA 91717 — External Blocker Execution Runbook

**Status:** Operational procedure; provider actions remain unverified until evidence is attached.  
**Last reviewed:** 2026-10-15  
**Authority:** `config/omega-production-10-10-evidence-gate.json`, `docs/OMEGA_EXECUTION_PROGRAM.md`, and `docs/OMEGA_REQUIREMENT_CONTROL_PLANE.md`.

This runbook converts existing external blockers into safe, repeatable operator actions. It does not replace the canonical evidence gate or mark a control complete. Do not place secrets, access tokens, customer data, signed webhook payloads containing personal data, or private provider URLs in Git.

## Rules of engagement

1. Perform provider-side actions with an authorized account and least privilege.
2. Record UTC timestamp, operator role (not personal credentials), provider/project, source commit or migration version, test result, and a redacted evidence reference.
3. Never paste secret values into issues, logs, screenshots, CI output, or this repository.
4. Keep production and test/sandbox environments distinct.
5. A dashboard screenshot alone is insufficient when a deterministic test or runtime artifact is available.
6. Change a canonical status only after the required evidence exists and has been reviewed.
7. If a provider restriction cannot be resolved by an authorized operator, leave the gate `BLOCKED` and record the provider's stated reason without exposing private account details.

## Execution order

### 1. Vercel production deployment — P0 / RC-001

**Objective:** serve the intended `main` commit on the canonical production domain.

1. Open the Vercel project associated with this repository and inspect the failed deployment/check details.
2. Identify the exact provider-side cause (account restriction, project authorization, billing/policy restriction, Git integration authorization, or build/runtime failure). Do not assume it is a code defect.
3. If Vercel requires account, billing, policy, or integration authorization, have the account owner resolve it in Vercel. Do not weaken branch protections or production deployment rules as a workaround.
4. Redeploy the intended `main` SHA only after the root cause is addressed.
5. Verify all of the following independently:
   - deployment state is Ready;
   - deployment source SHA equals the intended `main` SHA;
   - canonical production aliases resolve to that deployment;
   - HTTPS and critical local assets return successfully;
   - browser smoke tests cover homepage, navigation/deep links, authentication entry points, and one representative persisted workflow;
   - rollback target and operator procedure are known.
6. Attach a redacted deployment URL/ID, SHA, alias verification, smoke-test report, and timestamp to the release evidence record.

**Pass condition:** every required item above is evidenced. A green repository check alone does not prove the production alias serves the intended release.

### 2. Supabase Auth leaked-password protection — P0 / RC-002

1. In the authorized Supabase project, inspect the Auth security settings for leaked-password protection and any provider prerequisites or plan restrictions.
2. Enable the protection using the provider-supported control; do not attempt to emulate it in frontend code.
3. In a non-production test account, verify expected signup/password-change behavior for an accepted password and a password rejected by the provider's leaked-password control. Do not use a real person's password.
4. Re-run the relevant provider security/advisor check and record its timestamp and outcome.
5. Confirm that application errors remain safe and do not reveal password or provider internals.

**Pass condition:** the setting is enabled in the actual project and provider evidence plus a controlled behavioral test is recorded.

### 3. Owner MFA — P0 / RC-013

1. Inventory platform-owner identities through the authorized identity provider; do not publish the inventory.
2. Verify MFA enrollment for every owner identity and enforce the provider-supported policy where available.
3. Test challenge, recovery, session invalidation, and access-denied behavior with a controlled test identity.
4. Store recovery material only in the approved secrets/password-management system. Never store recovery codes in Git or issue comments.
5. Record aggregate completion and redacted test evidence, not the recovery secrets or sensitive identity attributes.

**Pass condition:** every owner account is verified under the approved policy and recovery is tested without weakening access controls.

### 4. Payment lifecycle — BLOCKED until the business decision and provider proof exist / RC-008

Do not activate real-money or token/asset flows merely because a page, schema, or integration stub exists.

1. Obtain an explicit business/legal approval for the product, jurisdictions, customer type, refund/dispute policy, and any applicable KYC/AML or payment obligations.
2. Use the payment provider's test/sandbox environment first.
3. Verify webhook signature validation, replay resistance, idempotency, immutable transaction records, entitlement grant/revocation, refunds/reversals, and reconciliation.
4. Test invalid signatures, duplicate events, out-of-order events, provider timeouts, and partial failure.
5. Confirm the authoritative transaction state is server-side; browser redirects and client state must not authorize a payment or entitlement.
6. Reconcile test events against provider records and internal ledger entries.
7. Only enable production after the provider's production configuration, required legal review, and end-to-end evidence are approved.

**Pass condition:** the entire lifecycle, including reversal and reconciliation, is proven. A successful checkout screen is not enough.

### 5. Backup restoration and recovery objectives — P0 / RC-009

1. Identify the approved backup source, retention policy, data owner, and authorized recovery operator.
2. Restore into an isolated, non-production target. Never overwrite production during the exercise.
3. Validate schema/migration version, representative records, access policies, storage references, and application compatibility.
4. Measure recovery point objective (RPO) from the age of the newest recoverable data and recovery time objective (RTO) from the start of restoration until the agreed service checks pass.
5. Record failures, manual steps, missing artifacts, elapsed times, and corrective actions.
6. Repeat after remediation if the measured RPO/RTO misses the approved target.

**Pass condition:** a reproducible restore succeeds and measured RPO/RTO are recorded. A configured backup or green dashboard is not restoration evidence.

### 6. Migration reproducibility — RC-010

1. Create a disposable database matching the supported PostgreSQL/Supabase migration environment.
2. Apply the repository's migrations from a clean baseline in canonical order.
3. Fail on migration errors, missing dependencies, non-deterministic assumptions, or untracked schema drift.
4. Run schema/RLS/RPC contract tests and representative application integration tests against the resulting database.
5. Preserve logs and the final schema/migration revision; remove sensitive data from artifacts.

**Pass condition:** a clean migration replay and its follow-up contract suite both pass.

### 7. AI provider and quality gate — RC-012

1. Inventory model/provider dependencies and required environment-variable *names*; never print values.
2. Verify provider credentials in the provider console and test a controlled health/request path without exposing secrets.
3. Build a versioned evaluation set covering groundedness, retrieval quality, unsupported claims, prompt injection, authorization boundaries, privacy leakage, timeout/fallback, latency, and cost.
4. Require citations/provenance for factual retrieval where applicable and label generated inference distinctly from verified records.
5. Confirm AI agents cannot bypass existing authorization for database writes, payments, account changes, or privileged actions.
6. Record model/version, evaluation dataset version, aggregate metrics, cost/latency, and known limitations.

**Pass condition:** the approved quality thresholds and permission tests pass for the configured provider/model. A configured API key alone is not proof of safe AI behavior.

### 8. Accessibility, navigation, privacy, and observability

- **Accessibility/navigation (RC-014/015):** run keyboard-only journeys, accessible-name checks, contrast/readability review, reduced-motion checks, responsive viewport tests, and deep-link/refresh tests on representative high-traffic and high-risk pages. Track actual failures with page paths and reproducible steps.
- **Privacy (RC-017):** test controlled export, deletion/erasure, retention expiry, and dependent-object cleanup with synthetic test accounts. Verify both database records and storage objects; document legally required retention exceptions.
- **Observability (RC-016):** define service owners, measured indicators, alert thresholds, escalation, and retention. Do not display uptime/SLO claims unless a real monitor computes them from a defined measurement window and source data.

## Evidence record template

Use this template in the approved internal evidence system (not with secrets in a public issue):

| Field | Required value |
|---|---|
| Control ID | e.g. RC-001 |
| Environment | sandbox / staging / production |
| Source revision | full commit SHA or migration revision |
| Provider verification time | UTC timestamp |
| Operator role | role/team, not credential |
| Test procedure | command, test case, or provider action |
| Result | PASS / PARTIAL / BLOCKED / UNVERIFIED |
| Artifact reference | redacted report, run ID, or approved private evidence location |
| Limitations | failed cases, scope, expiry, assumptions |
| Reviewer | authorized reviewer/role |
| Next action | owner and concrete action |

## Release decision

The release owner must review the canonical production evidence gate after provider actions complete. Keep every incomplete domain at `BLOCKED`, `PENDING`, `PARTIAL`, or `UNVERIFIED` as appropriate. Never promote status from this runbook's existence or from a planned action.

**Current known release constraint:** repository code cannot independently resolve Vercel account/provider restrictions, enable Supabase account settings, enroll owner MFA, approve a financial business model, or conduct a provider-side restore drill. Those require authorized external actions and fresh evidence.

## Verified provider observation — 2026-10-15

A live Vercel deployment-creation request for the current repository `main` revision was rejected by the provider with HTTP `402`, code `resource_creation_blocked`, and the explicit reason: **the Vercel team exceeded its fair-use limits and has been blocked**. The response classifies this as a user action required. This is provider-side evidence, not a source-code build failure.

The latest production deployment returned by the Vercel deployment API was `READY` but referenced source SHA `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28`, while the audited repository `main` revision was `dd1c6cab41410f1397c6db43c5e60d9196e486a6`. Therefore, deployment readiness must not be confused with source freshness.

**Required owner action:** resolve the Vercel team restriction in the authorized Vercel account, then deploy the intended `main` SHA and verify the canonical aliases, HTTPS/assets, and browser smoke tests. Do not try to evade the restriction by creating another project/team, changing billing or security settings automatically, bypassing protections, or claiming production is current without a successful source-SHA check.

**Evidence boundary:** the deployment API's `READY` state and alias metadata were observed. This does not by itself prove every production page, API, or user journey works correctly.
