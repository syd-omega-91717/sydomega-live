# Ω SYD OMEGA — Production 10/10 Gate

This is an evidence gate, not a feature checklist. A domain is PASS only when deterministic evidence exists and, where applicable, the live provider independently confirms it.

**Audit snapshot:** 2026-10-24, main commit `af91aaff864fde2cb304f2b37568d3efb83d29c2`. This is a dated snapshot, not a claim that later commits are deployed.

## Current gate

| Domain | Required evidence | Current state |
|---|---|---|
| Supabase security | Security Advisor findings reviewed and provider-level controls enabled | **BLOCKED** — leaked-password protection is disabled (WARN). The additional INFO finding for `omega_private.marketplace_listing_assets` is consistent with the documented server-only, deny-by-default design: RLS is enabled and grants are revoked from client roles. Preserve this boundary; do not add a client policy merely to silence the linter. |
| RLS performance | Advisor has zero RLS init-plan findings | **PASS for the previously audited RLS init-plan category**; repeat after schema changes. The separate Performance Advisor reports 327 unused-index INFO findings. See [the workload-aware index review](SUPABASE_UNUSED_INDEX_REVIEW_20261024.md); no indexes were dropped. |
| RPC privilege | High-risk client RPCs are invoker/search-path hardened | **PASS based on existing audit evidence**; re-run regression checks before release. |
| Migration reproducibility | All local migrations replay successfully from zero | **PASS** — GitHub Actions run `40075211371` replayed the full migration set on a fresh isolated database on 2026-10-24 and passed migration inventory, security, hardening, family-access/privacy, and authenticated-content checks. Repeat after future migration changes. |
| Payment lifecycle | Signed Stripe event → idempotency → ledger → reconciliation → entitlement → refund/reversal | **BLOCKED** — live `payments_enabled=false`; zero rows were observed in `stripe_webhook_events`, `omega_payment_events`, `omega_ledger_transactions`, and `omega_payment_reconciliation`. No real signed event/retry/reconciliation evidence exists. The inspected webhook has no refund/reversal event handler or matching refund RPC. Keep payments disabled until test-mode signed events prove duplicate handling, retry safety, subscription changes/cancellation, refunds/reversals, and reconciliation. |
| Disaster recovery | Provider restore drill with measured RPO/RTO | **BLOCKED** — no provider-level restore drill or measured RPO/RTO evidence. Member continuity checkpoints are not a database backup/restore test. |
| Privacy lifecycle | Export/delete/retention exercised against controlled data | **PARTIAL** — export/provenance and retention components exist; a complete controlled export, deletion, retention-expiry, and recovery-verification evidence bundle is still missing. |
| Provider credentials | Every external production provider verified and failure-tested | **PARTIAL** — provider-specific credential presence, rotation, revocation, and failure-path evidence remains incomplete. Never print or copy secret values into evidence. |
| Scale | Concurrency, DB saturation, queues, Edge Functions, latency/cost limits measured | **PENDING** — no representative, bounded load-test report with capacity thresholds and recovery behavior. Do not run a destructive stress test against production. |
| AI quality | Groundedness, retrieval quality, hallucination, latency, cost, adversarial recovery measured | **PENDING** — require a versioned evaluation set, scoring rubric, regression thresholds, and measured latency/cost before claiming quality. |
| Supply-chain security | Blocking SAST, filesystem/IaC scans, and validated SBOM all complete successfully | **BLOCKED** — run `40075211465` failed Semgrep with one blocking finding; Trivy filesystem/IaC scans and SBOM generation were skipped. The SARIF diagnostic output did not expose the blocking result; the workflow now performs a failure-only JSON diagnostic scan to expose rule, severity, path, line, and metadata on the next run. No rule was suppressed and no gate was bypassed. |
| Vercel production | Current main commit has a READY production deployment and release parity is verified | **BLOCKED** — GitHub reports a failing Vercel status linked to [Vercel's deployment-blocked guidance](https://vercel.com/docs/errors/deployment_blocked). The latest production deployment returned by the connected Vercel integration is still on commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` from 2026-10-06, not the audit head. Public HTTP smoke checks pass, but they do not establish that the current main commit is deployed. The separate Vercel integration API call also returned a team-scope 403; authorization is needed for deeper project/deployment inspection. |
| Owner security | All owner accounts have verified MFA before owner enforcement is enabled | **PENDING OWNER ACTION** — live aggregate check found 0 of 2 owner accounts with a verified MFA factor. `mfa_enrolment_enabled=true`; `owner_mfa_required=false`. Keep enforcement off until both owners independently enroll and verify factors; the server-side switch is intentionally lockout-safe. |

## Rules

1. Never convert BLOCKED, PARTIAL, or PENDING into PASS through documentation.
2. Never fabricate payment, recovery, user, achievement, balance, or provider evidence.
3. A successful preview deployment is not production proof.
4. A compensating password-breach control is not equivalent to the provider server-side Auth control.
5. An unused-index warning is not sufficient evidence to drop an index; remove only indexes proven redundant or harmful under observed workload.
6. Production migrations are immutable. New schema changes require a new migration.
7. The target is 10/10 evidence, not 10/10 prose.

## Automated full replay

`.github/workflows/supabase-full-migration-replay.yml` starts an isolated Supabase stack and runs `supabase db reset`, recreating the database and applying every migration in order. The inventory contract checks the local migration set against the committed live manifest before and after replay.

The live Supabase migration journal was queried on 2026-10-24: **407 applied versions**, first version `0001`, latest version `20261023120000`. The committed `supabase/remote-migrations.json` matched the count and latest version. The latest migration is `20261023120000_omega_personal_context_link_fk_indexes.sql`. Run `40075211371` subsequently passed the isolated replay and its post-replay security/hardening checks. This is reproducibility evidence for the audited repository commit; it is not a substitute for live provider evidence.

## Public HTTP evidence versus deployment parity

GitHub Actions run `40075211354` (`Production Smoke`) observed HTTP 200 for the apex and www homepages and their `/healthz.html` endpoints. It observed HTTP 401 from Supabase Auth and REST endpoints without credentials, which is consistent with those endpoints requiring authentication. Run `40075211363` (`Production Surface Verification`) verified the expected Omega title/canonical CSS and reported HTTP 200 for the root and CSS asset.

These checks establish public transport/surface reachability at the time of the run. They do **not** prove the deployed static files correspond to audit head `af91aaff864fde2cb304f2b37568d3efb83d29c2`, nor do they prove signed-in authorization, payment processing, provider restoration, or every browser dependency. Production SHA parity remains BLOCKED until a READY production deployment for the intended main commit and independent release-manifest verification are recorded.

## Provider actions

- **Vercel:** authorize the connected integration for the `syd-omega-91717s-projects` team scope; inspect the account/deployment block, account standing, usage/plan limits, and Vercel notification email. Vercel documents that a blocked account or deployment may require provider action; do not attempt to bypass the restriction by changing deployment configuration.
- **Supabase leaked-password protection:** enable the provider-level `password_hibp_enabled` setting through the supported Auth settings/Management API, then re-query the Security Advisor. The repository contains `scripts/enable-supabase-hibp.py`; it requires an authorized `SUPABASE_ACCESS_TOKEN` and fails closed if the provider does not confirm the setting.
- **Owner MFA:** each owner must enroll a verified TOTP factor in Settings → Two-factor. Then use the Owner Deck SECURITY control to enable enforcement only after both factors are verified. Do not set the enforcement flag directly to skip the lockout-safe guard.
- **Payments:** keep `payments_enabled=false` until a Stripe test-mode lifecycle can be exercised end to end, including signed webhook delivery, repeated event delivery, idempotency, ledger/reconciliation, entitlement transitions, and refunds/reversals.
- **Disaster recovery:** run a controlled restore drill into a non-production target, measure restore duration and recoverable-point age, and record RTO/RPO plus storage/configuration recovery evidence.
- **Index review:** use [the index review](SUPABASE_UNUSED_INDEX_REVIEW_20261024.md). Do not drop indexes based solely on advisor labels or a single `idx_scan=0` observation.

## Completion standard

The platform may be called 10/10 only after every row above is PASS, provider-side blockers are cleared, and the evidence is timestamped. A higher score cannot be claimed merely because more features were added.
