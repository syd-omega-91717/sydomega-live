# Ω SYD OMEGA 91717 — Edge Function Live Parity Audit
## 2026-09-29

This document separates **source presence**, **Supabase deployment**, and
**runtime verification**. A function is not a production capability merely
because `supabase/functions/<name>/index.ts` exists.

## Live reconciliation

Live Supabase project: `ydqhzvvoyufiiqvzcjns`

| State | Count | Functions |
|---|---:|---|
| Repository source | 16 | checkout, concierge, concierge-orchestrator, event-ingest, graphify-ai-ingest, graphify-ai-query, growth-orchestrator, intel-feed, market-price, notify-access, product-orchestrator, rankings, secrets-health, snapshot-leaderboard, stripe-webhook, weekly-digest |
| Supabase ACTIVE | 6 | concierge, concierge-orchestrator, growth-orchestrator, product-orchestrator, secrets-health, stripe-webhook |
| Source-only / not live | 10 | checkout, event-ingest, graphify-ai-ingest, graphify-ai-query, intel-feed, market-price, notify-access, rankings, snapshot-leaderboard, weekly-digest |

**Important correction:** an earlier audit note said 15 source functions and
9 source-only functions. The repository currently contains **16**, making the
correct source-only count **10**.

## Security disposition

### Active functions
The six active functions were confirmed by the live Supabase Edge Function
inventory. Their deployment state is therefore real; successful behavior still
requires endpoint-level testing.

### Source-only functions
The ten source-only functions are intentionally not counted as live features.
They require separate deployment readiness checks.

Notable current protections found in source:

- `event-ingest`: authenticated caller identity; event type, route, metadata,
  schema-version, size, and idempotency validation.
- `graphify-ai-ingest`: authenticated caller identity plus an allowlist of
  ingestable tables; request-body identity cannot select another member.
- `graphify-ai-query`: authenticated caller identity and explicit
  `user_id === caller.userId` ownership check.
- `snapshot-leaderboard`: service-role scheduled invocation or authenticated
  owner invocation.
- `weekly-digest`: service-role scheduled invocation or authenticated owner
  invocation; real email delivery remains deliberately unimplemented rather
  than falsely marking queue rows as sent.
- `checkout`: member authentication plus payments feature/secret gates.
- `intel-feed`: public external-data proxy; no secret required.
- `market-price`: public quote proxy, secret-gated by
  `TWELVE_DATA_API_KEY`.
- `rankings`: service-role read path with optional caller highlighting; its
  privacy/public-display contract should be reviewed before deployment.
- `notify-access`: database webhook. It has now been hardened in source to
  require `NOTIFY_ACCESS_WEBHOOK_SECRET` through the
  `x-omega-webhook-secret` header before processing any payload.

## Deployment rule

Do **not** deploy all ten merely to make the live count match the source count.
Each function must first have:

1. required secrets available;
2. a documented trigger;
3. an authenticated/verified trust boundary;
4. schema/RPC compatibility;
5. a clear client or scheduler dependency;
6. endpoint-level verification after deployment.

## Current blocker

The connected Supabase tooling can inspect and deploy Edge Functions but does
not expose a secret-management mutation in this session. Therefore the newly
required `NOTIFY_ACCESS_WEBHOOK_SECRET` cannot be provisioned here without
another authorized secret-management path. The source hardening is complete;
the function remains dormant and is not falsely reported as production-ready.

## Audit principle

`source` ≠ `deployed` ≠ `verified`.

All future capability audits should preserve these three states separately.
