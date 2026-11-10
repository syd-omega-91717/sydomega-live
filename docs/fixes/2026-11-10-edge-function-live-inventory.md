# Supabase Edge Runtime — live inventory and source-parity audit

**Observed:** 2026-11-10  
**Scope:** read-only provider inventory, deployed function source retrieval, repository comparison, auth/config reconciliation, cron and queue-state checks.

## Provider inventory

- Supabase provider reports **22 ACTIVE Edge Functions**.
- All 22 names match `supabase/config.toml` and `config/omega-edge-function-auth.json`.
- All 22 provider `verify_jwt` values match the repository auth registry.
- All 22 deployed `index.ts` entrypoints returned by `get_edge_function` matched the corresponding main-branch file byte-for-byte.
- The additional shared/data files returned for `studio-canon` and `studio-library` also matched their repository files byte-for-byte.
- The snapshot records provider version, provider `ezbr_sha256`, repository blob SHA, `verify_jwt`, and source-parity state in `docs/runtime/supabase-edge-functions-live.json`.
- No function was deployed or modified during this audit.

## Auth-mode distribution

| Auth mode | Functions |
|---|---:|
| SUPABASE_JWT | 13 |
| SHARED_SECRET | 5 |
| PUBLIC_READONLY | 2 |
| USER_SESSION | 1 |
| STRIPE_SIGNATURE | 1 |
| **Total** | **22** |

`verify_jwt=false` does not mean a function is unauthenticated. Functions in USER_SESSION, SHARED_SECRET, and STRIPE_SIGNATURE modes enforce handler-level checks; PUBLIC_READONLY functions are restricted to read-only public behavior. Those checks still require runtime invocation tests.

## Local-only functions

Five repository functions are intentionally absent from the provider inventory:

- `checkout`
- `event-ingest`
- `graphify-ai-ingest`
- `graphify-ai-query`
- `weekly-digest`

Their absence is intentional and must not be treated as a failed deployment. In particular, the checkout and weekly-digest functions remain gated.

## Operational boundaries observed

- `payments_enabled`, `tokens_enabled`, `weekly_digest_enabled`, `kyc_intake_enabled`, and `stripe_integration_enabled` are all false in `public.platform_settings`.
- `stripe-webhook` is deployed, but the payment lifecycle remains gated: checkout is local-only, payment flags are false, and Stripe webhook secret presence/delivery was not verified.
- `market-price` is deployed with `verify_jwt=false`; its source is public GET-only. Twelve Data key presence and redistribution licensing were not verified in this audit.
- `notify-access` v2 is deployed with a shared-secret boundary. The Vault secret, `RESEND_API_KEY`, sender-domain verification and successful email delivery were not verified.
- The Supabase unified Edge log query returned a provider FetchException in this session. No runtime success or failure is inferred from source parity.

## Scheduled work

Read-only production SQL confirmed:

- `pg_cron` is installed.
- Exactly one active cron job was returned: `omega-in-app-notification-delivery`, running `omega_private.deliver_in_app_notifications(100)` every minute.
- No leaderboard snapshot, weekly digest, media, provider, embedding or trial-sweep cron job was found.
- The eight async queues checked in the production query currently contain zero rows.
- Two approved trials are expired and unswept. The trial sweep remains unscheduled because the current function deletes `task_completions`; that destructive behavior must be redesigned before scheduling.

## What this audit proves — and does not prove

**Proves:** provider inventory, deployed version metadata, `verify_jwt` parity, entrypoint byte parity, selected Studio shared-file parity, and current schedule/queue observations at capture time.

**Does not prove:** handler invocation success, secret presence, external email delivery, Stripe webhook delivery, market-data entitlement, queue processing, customer-visible behavior, provider quotas, or disaster recovery. Source parity is not runtime health.

