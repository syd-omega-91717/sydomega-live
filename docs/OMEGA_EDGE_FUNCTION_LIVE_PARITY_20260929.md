# Ω SYD OMEGA 91717 — Edge Function Live Parity Audit
## 2026-10-06

This document separates **source presence**, **Supabase deployment**, and **runtime verification**. A function is not a production capability merely because `supabase/functions/<name>/index.ts` exists.

## Live reconciliation

Live Supabase project: `ydqhzvvoyufiiqvzcjns`

| State | Count | Functions |
|---|---:|---|
| Repository source | 17 | agent-execute, checkout, concierge, concierge-orchestrator, event-ingest, graphify-ai-ingest, graphify-ai-query, growth-orchestrator, intel-feed, market-price, notify-access, product-orchestrator, rankings, secrets-health, snapshot-leaderboard, stripe-webhook, weekly-digest |
| Supabase ACTIVE | 12 | agent-execute, concierge, concierge-orchestrator, growth-orchestrator, product-orchestrator, secrets-health, stripe-webhook, evidence-graph, omega-notification-worker, omega-runtime-gateway, omega-media-worker, intel-feed |
| Source-only / not live | 9 | checkout, event-ingest, graphify-ai-ingest, graphify-ai-query, market-price, notify-access, rankings, snapshot-leaderboard, weekly-digest |

**Reconciliation note:** the live inventory now contains twelve ACTIVE functions. Five runtime functions were already present outside the older 2026-09-29 source-only snapshot, and `intel-feed` was deployed on 2026-10-06 from the repository source.

## Security disposition

### Active functions

The active functions were confirmed by the live Supabase Edge Function inventory. Their deployment state is therefore real; successful behavior still requires endpoint-level testing.

`intel-feed` is deliberately configured with JWT verification disabled because it is a public Hacker News data proxy and contains no privileged database write path or secret. Its upstream data remains **UNVERIFIED** in `omega_data_sources` until a successful live upstream probe is recorded.

### Source-only functions

The nine source-only functions are intentionally not counted as live features. They require separate deployment readiness checks.

Notable current protections found in source:

- `event-ingest`: authenticated caller identity; event type, route, metadata, schema-version, size, and idempotency validation.
- `graphify-ai-ingest`: authenticated caller identity plus an allowlist of ingestable tables; request-body identity cannot select another member.
- `graphify-ai-query`: authenticated caller identity and explicit `user_id === caller.userId` ownership check.
- `snapshot-leaderboard`: service-role scheduled invocation or authenticated owner invocation.
- `weekly-digest`: service-role scheduled invocation or authenticated owner invocation; real email delivery remains deliberately unimplemented rather than falsely marking queue rows as sent.
- `checkout`: member authentication plus payments feature/secret gates.
- `market-price`: public quote proxy, secret-gated by `TWELVE_DATA_API_KEY`.
- `rankings`: service-role read path with optional caller highlighting; its privacy/public-display contract should be reviewed before deployment.
- `notify-access`: database webhook. It has been hardened in source to require `NOTIFY_ACCESS_WEBHOOK_SECRET` through the `x-omega-webhook-secret` header before processing any payload.

## Deployment rule

Do **not** deploy the remaining nine merely to make the live count match the source count. Each function must first have:

1. required secrets available;
2. a documented trigger;
3. an authenticated/verified trust boundary;
4. schema/RPC compatibility;
5. a clear client or scheduler dependency;
6. endpoint-level verification after deployment.

## Current state

The `intel-feed` deployment closes one real source/runtime parity gap: `news.html` already depends on the adapter, the source exists in the repository, and the live function now exists in Supabase.

The data-source registry remains deliberately conservative:

- Supabase production: **LIVE**, directly verified.
- Hacker News public API: **UNVERIFIED** until an upstream runtime probe succeeds.

This distinction is intentional. Deployment evidence is not upstream-data evidence.

## Audit principle

`source` ≠ `deployed` ≠ `verified`.

All future capability audits should preserve these three states separately.
