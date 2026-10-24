# Ω SYD OMEGA — Production 10/10 Gate

This is an evidence gate, not a feature checklist. A domain is PASS only when deterministic evidence exists and, where applicable, the live provider independently confirms it.

## Current gate

| Domain | Required evidence | Current state |
|---|---|---|
| Supabase security | Security Advisor findings reviewed and provider-level controls enabled | BLOCKED — leaked-password protection is disabled (WARN). The additional INFO finding for `omega_private.marketplace_listing_assets` is consistent with the documented server-only, deny-by-default design: RLS is enabled and the migration revokes privileges from `public`, `anon`, `authenticated`, and `service_role`. Preserve this boundary; do not add a client policy merely to silence the linter. |
| RLS performance | Advisor has zero RLS init-plan findings | PASS for the previously audited RLS init-plan category; repeat verification after schema changes. Separate performance Advisor review still reports 327 unused-index INFO findings, which require workload-aware review rather than bulk deletion. |
| RPC privilege | High-risk client RPCs are invoker/search-path hardened | PASS — based on existing audit evidence; re-run regression checks before release |
| Migration reproducibility | All local migrations replay successfully from zero | PENDING FULL 407-MIGRATION RUN |
| Payment lifecycle | Signed Stripe event → idempotency → ledger → reconciliation → entitlement → reversal | BLOCKED — live provider proof required |
| Disaster recovery | Provider restore drill with measured RPO/RTO | BLOCKED — provider restore proof required |
| Privacy lifecycle | Export/delete/retention exercised against controlled data | PARTIAL — implementation exists; full lifecycle evidence remains |
| Provider credentials | Every external production provider verified and failure-tested | PARTIAL |
| Scale | Concurrency, DB saturation, queues, Edge Functions, latency/cost limits measured | PENDING |
| AI quality | Groundedness, retrieval quality, hallucination, latency, cost, adversarial recovery measured | PENDING |
| Vercel production | Current main commit has a READY production deployment | BLOCKED — current main commit `fdb3f3395dd79d5a57646831fa8a2f747a647a86` has a failing Vercel status linked to account/deployment-blocked guidance; the latest deployment returned by the connected Vercel integration is still on commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` from 2026-10-06 |
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

`.github/workflows/supabase-full-migration-replay.yml` starts an isolated Supabase stack and runs `supabase db reset`, which recreates the local database and applies every migration in order. The inventory contract checks that the local migration set exactly matches the committed live manifest before and after replay.

The live Supabase migration journal was queried on 2026-10-24: **407 applied versions**, first version `0001`, latest version `20261023120000`. The committed `supabase/remote-migrations.json` reports the same count and latest version. The latest migration is `20261023120000_omega_personal_context_link_fk_indexes.sql`. This verifies ledger/manifest alignment at the count and latest-version level; it does **not** prove the full isolated replay passed. The workflow must complete the reset and subsequent security/hardening tests before migration reproducibility can be marked PASS.

## Provider blockers

The remaining provider-side blockers are kept explicit. Repository/SQL changes must not be represented as substitutes for provider configuration, credential rotation, owner MFA enrollment, signed payment traffic, or provider restore evidence.

The canonical Vercel project remains `sydomega-live`. GitHub reports a failing Vercel status on current main commit `fdb3f3395dd79d5a57646831fa8a2f747a647a86`, linking to Vercel's account/deployment-blocked guidance. The latest production deployment returned by the connected Vercel integration is commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` (2026-10-06). Production parity for the current main commit is therefore **not verified** until a READY deployment for that commit and independent HTTP evidence are available.

The independent read-only production probe is documented in [PRODUCTION_HTTP_EVIDENCE.md](PRODUCTION_HTTP_EVIDENCE.md). Its checks cover the public HTTP surface and release-manifest parity; they do not prove authenticated routes, Supabase authorization, payment flows, or every browser-side dependency.

## Completion standard

The platform may be called 10/10 only after every row above is PASS, provider-side blockers are cleared, and the evidence is timestamped. A higher score cannot be claimed merely because more features were added.
