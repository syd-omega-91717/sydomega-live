---
name: edge-functions
description: Work on sydomega-live's Supabase Edge Functions — the 14 Deno/TypeScript functions under supabase/functions/ (checkout, stripe-webhook, concierge, concierge-orchestrator, growth-orchestrator, product-orchestrator, notify-access, rankings, snapshot-leaderboard, weekly-digest, intel-feed, market-price, graphify-ai-ingest, graphify-ai-query). Use before adding, changing, deploying, or debugging any of them, or any code that calls one.
---

# EDGE FUNCTIONS

## What ships and how

14 functions in `supabase/functions/*/index.ts`, Deno + TypeScript. They are
**not** deployed by Vercel or CI — `supabase functions deploy <name>` by hand
against project `ydqhzvvoyufiiqvzcjns`. `.vercelignore` excludes `supabase/`
entirely. `deno check` on every function runs **non-blocking** in `ci.yml`
(syntax only). The client uses the publishable key; functions that need
elevation create their own `service_role` client from a Supabase secret —
**never** ship `service_role` to the browser (`ci.yml` step 5, blocking).

| function | purpose | trigger |
|---|---|---|
| `checkout` | creates a Stripe Checkout session | client POST from `enterprise.html`/pricing |
| `stripe-webhook` | payment webhook; verifies Stripe signatures and applies subscription state through the canonical server-side RPC boundary | Stripe → HTTP |
| `concierge` | optional AI upgrade for `chatbot.html` (Anthropic) | client POST; caller falls back to a local keyword guide on non-200 |
| `concierge-orchestrator` | orchestrates the concierge/AI workflow | HTTP / platform workflow |
| `growth-orchestrator` | executes growth-oriented platform workflows | HTTP / platform workflow |
| `product-orchestrator` | executes product-oriented platform workflows | HTTP / platform workflow |
| `notify-access` | emails the owner on access requests | RPC / trigger |
| `rankings`, `snapshot-leaderboard` | leaderboard computation / daily snapshot | `pg_cron` |
| `weekly-digest` | per-member weekly recap | `pg_cron` weekly |
| `intel-feed`, `market-price` | external intelligence/market data | client / cron |
| `graphify-ai-ingest`, `graphify-ai-query` | knowledge-graph AI ingest/query | client |

## The "gated so deploying does nothing" convention

`checkout` and `concierge` **refuse cleanly (not a 500)** unless their secret
(`STRIPE_SECRET_KEY` / `ANTHROPIC_API_KEY`) is configured. So a function file
can be committed and even deployed and remain dormant until the secret is set
and — for monetizable features — its `platform_settings` flag is flipped
by a human (`CLAUDE.md` §9). Keep this shape for any new function that touches
money, email, or an external paid API: probe the secret, return a clean
non-200 when absent, never a 500.

## Secrets (Supabase, never committed)

`ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `TWELVE_DATA_API_KEY`, `SITE_URL`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MAP`.
`supabase secrets set NAME=...`. **Run `./scripts/check-secrets.sh` before any
deploy** — it reports which expected secrets are missing and never prints a
value. (`supabase login && supabase link --project-ref ydqhzvvoyufiiqvzcjns`
first.)

## Rules for changing one

1. **`stripe-webhook`**: it validates the `Stripe-Signature` header against
   `STRIPE_WEBHOOK_SECRET` — without that check any HTTP call fakes a payment.
   Never weaken it. It returns 200 for unhandled event types so Stripe does
   not retry. All DB writes go through the canonical server-side subscription
   RPC boundary with service-role enforcement. Payment code gets the same
   care as production payment code anywhere — this is not a toy.
2. **A function writing to the DB**: prefer a `SECURITY DEFINER` RPC that
   `REVOKE`s `EXECUTE` from `PUBLIC` and re-grants narrowly. Check `.error` on
   every write — a Supabase call resolves to `{data:null,error}`, it does not
   throw.
3. **CORS**: preserve each function's existing CORS contract; do not broaden
   an endpoint's trust boundary as a drive-by change.
4. **A cron function**: mirror the existing scheduled-function pattern and
   record the schedule in a comment; the `pg_cron` entry itself is a
   `supabase/*.sql` change.
5. **Anthropic calls**: server-side only, key from the secret. Model id and
   API shape — load the applicable AI API skill before changing it.
6. **The `@supabase/server` migration**: every function still uses its current
   repository-owned runtime contract. Treat migration to another server SDK
   as a scoped task, not a drive-by rewrite.

## Verify

- `deno check supabase/functions/<name>/index.ts` (or the repo's `deno.json`
  task if present).
- `./scripts/check-secrets.sh` — confirm the secrets the function needs exist
  before deploying.
- After deploy: exercise the real endpoint. For `stripe-webhook`, use a
  Stripe CLI test event with a valid signature; a wrong signature must 400.
- Update `CAPABILITY_INVENTORY.md` / `REPOSITORY_AUDIT.md` and the relevant
  `docs/capabilities/registry.json` contract for the changed function, in the
  same commit.

## Guardrails

- No `service_role` in client-shipped code, ever (blocking CI check).
- A monetizable function ships dormant — secret-gated **and** flag-gated —
  regardless of how finished the code is.
- Never commit a secret; never print one in a log line.
- Edge Function changes are applied by a human via the Supabase CLI, not by
  CI and not by this session unless explicitly asked — the code lands on a
  branch, the deploy is a separate step.
