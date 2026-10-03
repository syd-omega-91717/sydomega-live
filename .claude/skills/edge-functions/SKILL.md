---
name: edge-functions
description: Work on sydomega-live's Supabase Edge Functions — the 17 Deno/TypeScript source functions under supabase/functions/ (checkout, stripe-webhook, concierge, secrets-health, concierge-orchestrator, growth-orchestrator, product-orchestrator, event-ingest, notify-access, rankings, snapshot-leaderboard, weekly-digest, intel-feed, market-price, graphify-ai-ingest, graphify-ai-query). Use before adding, changing, deploying, or debugging any of them, or any code that calls one.
---

# EDGE FUNCTIONS

## What ships and how

There are **17 source functions** in `supabase/functions/*/index.ts`. As of the
2026-09-29 live audit, only **7 are deployed ACTIVE** in Supabase:
`agent-execute`, `concierge`, `concierge-orchestrator`, `growth-orchestrator`,
`product-orchestrator`, `stripe-webhook`, and `secrets-health`.

The remaining **10 are source-only/dormant** and must not be described as live
capabilities until independently deployed and exercised:
`checkout`, `event-ingest`, `graphify-ai-ingest`, `graphify-ai-query`,
`intel-feed`, `market-price`, `notify-access`, `rankings`,
`snapshot-leaderboard`, `weekly-digest`.

They are not deployed by Vercel. `.vercelignore` excludes `supabase/`.
Edge-function type checking is repository CI work; live deployment is a
separate Supabase operation. Treat source presence, deployment, and successful
runtime verification as three different states.

## Function inventory

| function | purpose | trigger / state |
| `agent-execute` | governed read-only agent operations | authenticated POST / ACTIVE — endpoint verification pending |
|---|---|---|
| `checkout` | Stripe Checkout session creation | client POST / dormant |
| `stripe-webhook` | verified Stripe payment webhook | Stripe → HTTP / ACTIVE |
| `concierge` | governed Anthropic concierge | client POST / ACTIVE |
| `concierge-orchestrator` | concierge workflow orchestration | HTTP / ACTIVE |
| `growth-orchestrator` | growth workflow orchestration | HTTP / ACTIVE |
| `product-orchestrator` | product workflow orchestration | HTTP / ACTIVE |
| `secrets-health` | owner-only provider-secret health/rotation evidence | client / ACTIVE |
| `event-ingest` | authenticated member event ingestion | client POST / dormant |
| `notify-access` | access-request email notification | DB webhook / dormant |
| `rankings` | server-side leaderboard computation | client / dormant |
| `snapshot-leaderboard` | daily leaderboard snapshot | cron/owner / dormant |
| `weekly-digest` | weekly member digest processing | cron/owner / dormant |
| `intel-feed` | Hacker News intelligence feed | client / dormant |
| `market-price` | keyed stock/ETF quote proxy | client / dormant |
| `graphify-ai-ingest` | authenticated AI graph ingestion | client POST / dormant |
| `graphify-ai-query` | authenticated member graph query | client POST / dormant |

## Security rules

- Never infer that a source-only function is deployed.
- Any DB-writing function must authenticate the actor and enforce ownership
  server-side; request-body `user_id` is never an authority boundary.
- Webhooks with `verify_jwt=false` require their own cryptographic/shared-secret
  verification. `notify-access` therefore requires
  `NOTIFY_ACCESS_WEBHOOK_SECRET` and the `x-omega-webhook-secret` header.
- Monetizable or externally metered functions remain secret-gated and,
  where appropriate, feature-flagged.
- Never expose `service_role` or provider keys to browser code.
- After deployment, verify the actual endpoint; source review alone is not
  runtime verification.

## Secrets

Expected function secrets are checked by `scripts/check-secrets.sh`.
The script reports names only and never prints values. `notify-access` now
requires both `RESEND_API_KEY` and `NOTIFY_ACCESS_WEBHOOK_SECRET`.

## Rules for changing one

1. `stripe-webhook`: never weaken Stripe signature verification.
2. DB writes: prefer canonical SECURITY DEFINER RPC boundaries and check every
   Supabase write error.
3. Preserve existing CORS trust boundaries.
4. Cron functions must document their schedule and deployment state.
5. AI provider calls remain server-side and secret-backed.
6. Update capability/audit documentation when a function's contract changes.
7. Deploy dormant functions only after their secrets, trigger, and runtime
   contract are ready; do not deploy merely to make the inventory look green.

## Verification

- Run repository syntax/type checks for the changed function.
- Run `scripts/check-secrets.sh` before deployment.
- Exercise the real deployed endpoint after deployment.
- Reconcile the live Supabase function list after deployment.

## Guardrails

No service-role key in client-shipped code. Never commit or log secrets.
Source code, deployed state, and verified runtime state must remain explicitly
separate in audits.
