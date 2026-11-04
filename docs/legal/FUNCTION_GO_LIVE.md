# Edge Functions: what is live, what is held, and what unlocks each

Recorded 2026-11-01 after reading the live function list against `supabase/functions/` and every
client call site. Evidence for the findings referenced here is in `LEGAL_GAP_AUDIT.md`.

A function absent from `supabase/config.toml` never deploys, and merging a change to that file
deploys to production, so "go live" is always a reviewed PR that also updates
`config/omega-edge-function-auth.json` and `docs/runtime/supabase-edge-functions-live.json`
(`scripts/edge-function-auth-config-contract.py` fails if the three disagree).

## Live now (deployed 2026-11-01, read back with `list_edge_functions`)

| Function | `verify_jwt` | Why it is safe to be live |
|---|---|---|
| `rankings` | true | Member leaderboard. Rank comes only from the verified JWT; family-linked members are excluded. Returns the same fields `leaderboard_snapshots` already shows every member (policy "all members see leaderboard"), so it adds no new exposure. `leaderboard_snapshots` has 0 rows, so before this the leaderboard page was empty. |
| `snapshot-leaderboard` | true | Owner-only (re-checks `profiles.is_owner`). The source's own "REDESIGN BEFORE DEPLOY" note flagged its cron path as not timing-safe; that path was **removed** before deploy. No schedule runs it. |
| `market-price` | false | Public, GET-only (`PUBLIC_READONLY`), no privileged key. Answers `configured:false` until `TWELVE_DATA_API_KEY` is set. |

**Before setting `TWELVE_DATA_API_KEY` — do not set it yet.** Twelve Data's terms were read on 2026-11-04
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
(c) leave it off. (c) is today's state: the pages show "—" and nothing is redistributed. This is a reading
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
`stripe_integration_enabled` are all `false` in `public.platform_settings` (live, 2026-11-01).
Do not flip any of them as part of a code change; flipping is the owner's decision, after the
unlock condition above is met.
