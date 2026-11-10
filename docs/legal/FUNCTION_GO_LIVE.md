# Edge Functions: what is live, what is held, and what unlocks each

Recorded 2026-11-10 after reading the provider inventory and deployed function files against the main-branch source, `supabase/config.toml`, and the auth registry. All 22 provider-listed entrypoints matched their repository files byte-for-byte; the additional shared/data files returned for `studio-canon` and `studio-library` also matched. Provider versions, `verify_jwt`, live SHA-256 and repository blob SHA are recorded in `docs/runtime/supabase-edge-functions-live.json`. This verifies source parity at capture time, not runtime invocation, secret presence, or end-to-end behavior. Evidence for the findings referenced here is in `LEGAL_GAP_AUDIT.md`.

A function absent from `supabase/config.toml` never deploys, and merging a change to that file
deploys to production, so "go live" is always a reviewed PR that also updates
`config/omega-edge-function-auth.json` and `docs/runtime/supabase-edge-functions-live.json`
(`scripts/edge-function-auth-config-contract.py` fails if the three disagree).

## Live now (22 ACTIVE, provider inventory read 2026-11-10)

All 22 names below match both `supabase/config.toml` and `config/omega-edge-function-auth.json`. `verify_jwt` matches the provider. The live entrypoint source was compared byte-for-byte with main for every function; the two Studios functions also had their returned shared and generated data files compared. A deployed function is not automatically a proven working business flow: secret presence, invocation results and downstream delivery still require separate tests.

| Function | Provider version | `verify_jwt` | Auth mode | Source parity | Security boundary / purpose |
|---|---:|---:|---|---|---|
| `agent-execute` | 5 | true | `SUPABASE_JWT` | Exact entrypoint match | Requires a valid Supabase JWT; handler performs its own authorization. |
| `concierge` | 13 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated orchestration endpoint. |
| `concierge-orchestrator` | 7 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated orchestration endpoint. |
| `content-delivery` | 9 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated owner-only delivery endpoint. |
| `content-ingest` | 9 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated owner-only ingestion endpoint. |
| `evidence-graph` | 223 | false | `USER_SESSION` | Exact entrypoint match | Supabase server adapter enforces auth=user and handler requires userClaims.sub. |
| `growth-orchestrator` | 9 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated orchestration endpoint. |
| `intel-feed` | 3 | false | `PUBLIC_READONLY` | Exact entrypoint match | Public GET-only Hacker News industry feed; no privileged database writes. |
| `market-price` | 4 | false | `PUBLIC_READONLY` | Exact entrypoint match | Public GET-only stock/ETF quote proxy; dormant (configured:false) until TWELVE_DATA_API_KEY is set; no privileged database access. |
| `notify-access` | 2 | false | `SHARED_SECRET` | Exact entrypoint match | Called by the database through pg_net, never by a member. Requires x-omega-webhook-secret to match the Vault secret notify_access_webhook_secret, read through the server-only RPC public.omega_notify_access_secret(); rejects any other caller with 401 (migration 20261025100000). |
| `omega-knowledge-embedding-worker` | 312 | false | `SHARED_SECRET` | Exact entrypoint match | Worker verifies OMEGA_PROVIDER_WORKER_SECRET in x-omega-worker-secret. |
| `omega-media-worker` | 402 | false | `SHARED_SECRET` | Exact entrypoint match | Supabase server adapter enforces auth=secret. |
| `omega-notification-worker` | 402 | false | `SHARED_SECRET` | Exact entrypoint match | Supabase server adapter enforces auth=secret. |
| `omega-provider-worker` | 223 | false | `SHARED_SECRET` | Exact entrypoint match | Worker verifies OMEGA_PROVIDER_WORKER_SECRET in x-omega-worker-secret. |
| `omega-runtime-gateway` | 406 | true | `SUPABASE_JWT` | Exact entrypoint match | User-authenticated governed runtime gateway. |
| `product-orchestrator` | 10 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated orchestration endpoint. |
| `rankings` | 2 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated member leaderboard; caller rank derives only from the verified JWT, body user_id is never trusted. |
| `secrets-health` | 7 | true | `SUPABASE_JWT` | Exact entrypoint match | Authenticated operational health endpoint. |
| `snapshot-leaderboard` | 2 | true | `SUPABASE_JWT` | Exact entrypoint match | Owner-only on-demand snapshot; the function re-checks profiles.is_owner. The service-key bearer path was removed before deploy (not timing-safe). |
| `stripe-webhook` | 9 | false | `STRIPE_SIGNATURE` | Exact entrypoint match | Webhook authenticates using Stripe's signed raw request body; Supabase JWT verification is not the webhook trust boundary. |
| `studio-canon` | 4 | true | `SUPABASE_JWT` | Exact entrypoint match | Owner-only delivery of unreleased Studios canon; the owner flag is re-checked server-side. |
| `studio-library` | 8 | true | `SUPABASE_JWT` | Exact entrypoint match | Owner-only delivery of the unreleased Studios library (scripts, design documents, catalog); the owner flag is re-checked server-side. |

**Before enabling member-facing stock quotes — licensing gate remains.** Twelve Data's terms were read on 2026-11-04
(`https://twelvedata.com/terms`, "Last updated: January 1, 2026", fetched through a cached copy, so confirm
the live page). What they say, and what it means here:

- **Licence is "Internal Use".** Data may be displayed only to "Authorized Users", defined as the customer's
  *own* employees, contractors and computerized systems (§1, §2.1, §2.2(b)). Members of this platform are
  not that.
- **Showing quotes to members is "external display" / "Redistribution"** (§1, §2.2(e), §2.3(b), §2.4): allowed
  only under a **Redistribution Rights Add-On or a separate written agreement**, "including compliance with
  attribution requirements". The contact is `sales@twelvedata.com`.
- **`market-price` is public and unauthenticated** (`PUBLIC_READONLY`, CORS `*`), so anyone on the internet
  could read the quotes through it, which is broader than "members".
- **Free tier data cannot be used for commercial purposes** (§2.3(l)); this platform has paid memberships.
- **Caching is limited to "timeframes specified in the Documentation"** (§2.3(g)); the function caches a
  quote for 5 minutes, up to 1 hour when stale. Check that against the Documentation for the chosen plan.
- **Exchange data can carry exchange fees, professional-subscriber rates and extra agreements** (§3.1).
- Data is "informational purposes only, not investment advice" (§8.3); show that disclaimer next to prices.

**Decision for the owner.** Either (a) get a written Redistribution licence from Twelve Data that covers
displaying quotes to your members (and ask whether it covers a public endpoint, or add sign-in to the
function first), then set the key; or (b) use a provider whose terms allow display on a members site; or
(c) leave it off. (c) is the safe default until the licence is confirmed. The live secret state and a real quote invocation were not verified in this pass. This is a reading
of a contract by an AI assistant, not legal advice; counsel should confirm (`docs/legal/COUNSEL_BRIEF.md`).
Already done: the cache and limits (`docs/fixes/2026-11-03-market-price-quota-protection.md`) and the
`as_of` time on `pulse.html` and `investment.html` (#1150).

## Held on purpose

| Function | Held because | Unlocks when |
|---|---|---|
| `graphify-ai-query`, `graphify-ai-ingest` | They send member content to Anthropic, which the privacy page does not disclose; cost is uncapped per member. The client pages (`graphify.html`, `intelligence.html`) now point at the right origin, so they will work the moment the functions deploy. | The privacy notice names Anthropic as a processor with its transfer basis, and a per-member daily limit exists. |
| `checkout` | Moves money. Double-gated in its own source (`payments_enabled` and `STRIPE_SECRET_KEY`), no client calls it yet, and the terms have no payment, refund or tax clauses. | Counsel has approved subscription/refund/consumer terms, `terms.html` carries them, and the owner flips `payments_enabled`. |
| `weekly-digest` | Sends email to members via Resend. Gated on `weekly_digest_enabled` and an owner caller, but there is no unsubscribe or marketing-consent path proven end to end. | Consent for "marketing communications" demonstrably controls sending, every email carries an unsubscribe, and the privacy notice names Resend. |
| `event-ingest` | Nothing calls it. | A client or job actually needs it. |

## Not a function, but gates the above

`payments_enabled`, `tokens_enabled`, `weekly_digest_enabled`, `kyc_intake_enabled` and
`stripe_integration_enabled` are all `false` in `public.platform_settings` (read-only live query, 2026-11-10).
Do not flip any of them as part of a code change; flipping is the owner's decision, after the
unlock condition above is met.
