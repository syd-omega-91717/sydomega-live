# Ω SYD OMEGA — Production 10/10 Gate

This is an evidence gate, not a feature checklist. A domain is PASS only when deterministic evidence exists and, where applicable, the live provider independently confirms it.

## Current gate

| Domain | Required evidence | Current state |
|---|---|---|
| Supabase security | Security Advisor has zero actionable findings | BLOCKED — leaked-password protection is disabled on the provider side |
| RLS performance | Advisor has zero RLS init-plan findings | PASS |
| RPC privilege | High-risk client RPCs are invoker/search-path hardened | PASS |
| Migration reproducibility | All local migrations replay successfully from zero | PENDING FULL 336-FILE RUN |
| Payment lifecycle | Signed Stripe event → idempotency → ledger → reconciliation → entitlement → reversal | BLOCKED — live provider proof required |
| Disaster recovery | Provider restore drill with measured RPO/RTO | BLOCKED — provider restore proof required |
| Privacy lifecycle | Export/delete/retention exercised against controlled data | PARTIAL — implementation exists; full lifecycle evidence remains |
| Provider credentials | Every external production provider verified and failure-tested | PARTIAL |
| Scale | Concurrency, DB saturation, queues, Edge Functions, latency/cost limits measured | PENDING |
| AI quality | Groundedness, retrieval quality, hallucination, latency, cost, adversarial recovery measured | PENDING |
| Vercel production | Current main commit has a READY production deployment | BLOCKED by provider build-rate-limit status |
| Owner security | Owner MFA factor enrolled and verified | PENDING OWNER ACTION |

## Rules

1. Never convert BLOCKED, PARTIAL, or PENDING into PASS through documentation.
2. Never fabricate payment, recovery, user, achievement, balance, or provider evidence.
3. A successful preview deployment is not production proof.
4. A compensating password-breach control is not equivalent to the provider server-side Auth control.
5. An unused-index warning is not sufficient evidence to drop an index; remove only indexes proven redundant or harmful under observed workload.
6. Production migrations are immutable. New schema changes require a new migration.
7. The target is 10/10 evidence, not 10/10 prose.

## Automated full replay

.github/workflows/supabase-full-migration-replay.yml starts an isolated Supabase stack and runs supabase db reset, which recreates the local database and applies every migration in order. The inventory contract checks that the local migration set exactly matches the committed live manifest before and after replay.

The reconciled repository/live target is 336 migrations, with the latest registered version 20261004084024_harden_privacy_export_invoker_20261004. Live migration journal verification and the post-change Security Advisor check were observed on 2026-10-04; the only remaining Security Advisor finding is the external leaked-password-protection setting. A successful inventory check is not itself proof that the full database replay passed; the workflow must complete the isolated reset and subsequent security/hardening tests.

## Provider blockers

The remaining provider-side blockers are kept explicit. Repository/SQL changes must not be represented as substitutes for provider configuration, credential rotation, owner MFA enrollment, signed payment traffic, or provider restore evidence.

The canonical Vercel project remains sydomega-live. The latest mainline merge currently reports a Vercel build-rate-limit failure, so production verification remains blocked until a READY deployment for the merged main commit is independently evidenced.

## Completion standard

The platform may be called 10/10 only after every row above is PASS, provider-side blockers are cleared, and the evidence is timestamped. A higher score cannot be claimed merely because more features were added.