# Ω SYD OMEGA — Production 10/10 Gate

This is an evidence gate, not a feature checklist. A domain is PASS only when deterministic evidence exists and, where applicable, the live provider independently confirms it.

## Current gate

**Evidence snapshot:** 2026-10-24. Main commit `f70f2c89ee5ea50eedcb5e1db6b1e1736b6b835d` is not yet verified in Vercel production; do not treat passing CI or a ready older deployment as release parity.

| Domain | Required evidence | Current state |
|---|---|---|
| Supabase security | Security Advisor findings reviewed and provider-level controls enabled | BLOCKED — leaked-password protection is disabled (WARN). The additional INFO finding for `omega_private.marketplace_listing_assets` is consistent with the documented server-only, deny-by-default design: RLS is enabled and the migration revokes privileges from `public`, `anon`, `authenticated`, and `service_role`. Preserve this boundary; do not add a client policy merely to silence the linter. |
| RLS performance | Advisor has zero RLS init-plan findings | PASS — latest performance/security review remains subject to repeat verification after schema changes |
| RPC privilege | High-risk client RPCs are invoker/search-path hardened | PASS — based on existing audit evidence; re-run regression checks before release |
| Migration reproducibility | All local migrations replay successfully from zero | **PASS** — GitHub Actions run `40077126403` replayed the full migration set from zero on a fresh isolated database on 2026-10-24; migration inventory, security, hardening, family-access/privacy, and authenticated-content checks passed. Re-run after future migration changes. |
| Supabase Edge Runtime parity | Deployed Edge Function source matches the reviewed repository source | **BLOCKED** — `stripe-webhook` source changed in the recovery commit, but the active production function is still the earlier deployed version. The reconciliation gate correctly fails. Do not deploy until refund/reversal handling and signed test-mode lifecycle tests pass; then deploy deliberately, capture the live source/hash, update the manifest, and re-run reconciliation. |
| Payment lifecycle | Signed Stripe event → idempotency → ledger → reconciliation → entitlement → reversal | BLOCKED — live provider proof required |
| Disaster recovery | Provider restore drill with measured RPO/RTO | BLOCKED — provider restore proof required |
| Privacy lifecycle | Export/delete/retention exercised against controlled data | PARTIAL — implementation exists; full lifecycle evidence remains |
| Provider credentials | Every external production provider verified and failure-tested | PARTIAL |
| Scale | Concurrency, DB saturation, queues, Edge Functions, latency/cost limits measured | PENDING |
| AI quality | Groundedness, retrieval quality, hallucination, latency, cost, adversarial recovery measured | PENDING |
| Supply-chain security | Blocking SAST, filesystem/IaC scans, and validated SBOM all complete successfully | **PASS on recovery revision `8121f4c70e989f4389f373c2b085ae4c90f86568`** — run `40077126333` passed Semgrep, Trivy filesystem, Trivy IaC/misconfiguration, SBOM generation, validation, and upload. The prior HTTPSConnection warning was addressed by a line-scoped documented exception plus TLS/redirect regression coverage; no global rules were disabled. Re-run after subsequent source changes. |
| Vercel production | Current main commit has a READY production deployment and release parity is verified | **BLOCKED** — main commit `f70f2c89ee5ea50eedcb5e1db6b1e1736b6b835d` has a failing Vercel status. Latest listed READY production deployment still serves commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` from 2026-10-06. Team integration authorization is awaiting owner approval; Vercel account/deployment eligibility must then be checked independently. Cloudflare Pages remains the current production path; no SHA parity claim. |
| Owner security | All owner accounts have verified MFA before owner enforcement is enabled | **PENDING OWNER ACTION** — latest live check found 0 of 2 owner accounts with a verified TOTP factor. Enrollment is enabled and enforcement remains off to avoid lockout until both owners enroll. |

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

The live Supabase migration journal was queried on 2026-10-24: **407 applied versions**, first version `0001`, latest version `20261023120000`. The committed `supabase/remote-migrations.json` reports the same count and latest version. The latest migration is `20261023120000_omega_personal_context_link_fk_indexes.sql`. GitHub Actions run `40077126403` subsequently passed the isolated full replay plus migration inventory, security, hardening, family-access/privacy, and authenticated-content checks. This is reproducibility evidence for that repository revision, not proof that all provider-side production controls are enabled.

## Provider blockers

The remaining provider-side blockers are kept explicit. Repository/SQL changes must not be represented as substitutes for provider configuration, credential rotation, owner MFA enrollment, signed payment traffic, or provider restore evidence.

The canonical Vercel project remains `sydomega-live`. GitHub reports a failing Vercel status on current main commit `f70f2c89ee5ea50eedcb5e1db6b1e1736b6b835d`, linking to Vercel's account/deployment-blocked guidance. The latest production deployment returned by the connected Vercel integration is READY but still points to commit `7d70ce14ef3c8c7e5cc3e4a3c39e15ecad579d28` (2026-10-06). Team authorization is pending owner action; after authorization, the account restriction must be investigated independently. Production parity is **not verified** until a READY deployment for the intended main commit and independent HTTP evidence are available.

The independent read-only production probe is documented in [PRODUCTION_HTTP_EVIDENCE.md](PRODUCTION_HTTP_EVIDENCE.md). Its checks cover the public HTTP surface and release-manifest parity; they do not prove authenticated routes, Supabase authorization, payment flows, or every browser-side dependency.

## Completion standard

The platform may be called 10/10 only after every row above is PASS, provider-side blockers are cleared, and the evidence is timestamped. A higher score cannot be claimed merely because more features were added.
