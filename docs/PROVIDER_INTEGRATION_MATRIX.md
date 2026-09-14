# Ω SYD OMEGA 91717 — PROVIDER / INTEGRATION CONTROL MATRIX

This is a non-secret integration inventory. Never store API keys, passwords, service-role tokens, private keys or credentials here.

| Provider/system | Purpose | Canonical owner | Environment | Required verification |
|---|---|---|---|---|
| Vercel | Web build/deployment/domain delivery | Vercel project `sydomega-live` | Production/Preview | deployment success + domain HTTP checks |
| Supabase Auth | Identity/session/authentication | Production Supabase project | Production | signup/login/confirm/MFA/session E2E |
| Supabase PostgreSQL | Application data | Production Supabase project | Production | migration/schema/RLS/function audits |
| Supabase Storage | User/platform assets | Production Supabase project | Production | upload/download/authorization tests |
| Supabase Edge Functions | Server-side integration/business logic | Production Supabase project | Production | function health + authenticated E2E |
| Stripe | Payments/subscriptions | Payment subsystem | Production/Preview | signed webhook + idempotency + ledger reconciliation |
| AI providers | Intelligence/model execution | OMEGA AI gateway | Production/Preview | routing/fallback/policy/cost/error tests |
| GitHub | Source/control/CI | `syd-omega-91717/sydomega-live` | Main/PR | CI execution + protected release process |
| Cloud/CDN layer | Edge/cache/security where used | Deployment layer | Production | cache/security/header verification |

## Provider contract

For every integration record: exact endpoint/SDK, owner module, credential class (public/private), timeout, retry policy, idempotency policy, rate limit, failure mode, fallback, audit event, health check, and last verification timestamp.

## No-conflict rule

If an integration already has an implementation, extend it. Do not introduce a second provider or SDK for the same responsibility without a recorded migration decision.
