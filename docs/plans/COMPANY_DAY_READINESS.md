# Company-day readiness: how money is plugged in, in the right order

Written 2026-11-15. **A plan; no code, nothing applied, no flag changed.** Not legal or tax advice, and the owner's country and the members' countries are not known to me.
Not reviewed by Codex (usage limit), so every claim below is the author's. "Verified" means read in this repository; the live database and Stripe were not reachable.

## The model the owner described
Free core first (sign from birth date, character, daily three, quizzes, quests). Progress is earned. Then members pay for what goes beyond it: a subscription, services (consultancy, publishing, legal), and advertisers pay to reach members. The company, bank account and payment processor are set up last, and the platform must switch on correctly the day they exist.

## Design rules (my recommendation; each one is the owner's to adopt)
1. **Earned standing is never for sale.** Gates, authority, medals and trophies come only from recorded activity. Paid tiers sell access, convenience and services, not rank. This needs the two colliding 12-rung ladders resolved first (`ENTITY_UNITY_PLAN.md`, `GAP_ANALYSIS.md` section S).
2. **No paid randomness.** A "combination" or character purchase has a fixed, visible outcome and price. Paid random outcomes (loot boxes) are regulated as gambling in some places and restricted in others.
3. **Real price shown before purchase; no virtual-currency layer to hide it.** Ω points stay non-cash and non-transferable (the owner's decision in `docs/COUNSEL_BRIEF.md` 2.3).
4. **Subscriptions:** terms shown at sign-up, cancellation as easy as sign-up and in the same place, renewal and withdrawal rules per country (counsel).
5. **Tax:** digital-services VAT or sales tax from the first sale in many countries; use a tax engine rather than hand-computed rates.
6. **Adults only** (the owner's decision for family accounts); no ads shown to minors.
7. **Advertising:** ads labelled as ads; consent before tracking; **no targeting on origin, religion, health or other sensitive attributes**; and every claim made to an advertiser must be true (see the reach problem below).
8. **Services:** consultancy and legal advice are delivered by licensed professionals under their own licence, with the platform as the marketplace and a clear "not legal advice" notice. The platform's own AI is never presented as a lawyer.
9. **No income that depends on recruiting or on a connection tree.** A member's earnings come only from what that member sells or publishes, and only after counsel agrees.

## What exists (verified in the repository)
| area | state |
|---|---|
| Payments | `supabase/functions/checkout` creates a Stripe **subscription** Checkout Session. Double-gated: `payments_enabled` (default **false**) and `STRIPE_SECRET_KEY`. Tier to price comes from the `STRIPE_PRICE_MAP` secret. `stripe-webhook` is listed in `config.toml`. |
| Ledger | Double-entry `omega_ledger_*` and `omega_entitlements` exist (per `CLAUDE.md`); not read live. |
| Tiers | 12 tiers in `omega-canon.json`, priced 9.17 to 917.17, each unlocking named features. |
| Identity | KYC intake dormant behind `kyc_intake_enabled`; design in `IDENTITY_ONE_PERSON_PLAN.md`. |
| AI cost | `concierge` consumes a per-member quota before calling the model and **fails closed** if the quota is unavailable: 12 requests per minute bucket and 120 per day bucket, weighted by profile (`20261112121000_omega_ai_member_quota_guard.sql`). It is a **request** budget, "not a monetary cost estimate", and does not change with payment. The migration is absent from `live-schema.json`, so I cannot say it is applied live. |
| Advertising | `advertising.html` inserts a `pending` row in `advertisements` and shows prices of $197, $597 and $1,917. It takes no payment. |

## Problems found
- **The advertiser-facing "104,976-node reach" is not an audience.** 104,976 is the canon's lattice size (12 x 12 x 9 x 9 x 9), a count of nodes. Selling placements against it is a claim that the page cannot back. Replace it with measured members or impressions before any advertiser pays. Logged OPEN in `GAP_ANALYSIS.md` section S.
- **AI cost per member is unmeasured.** The quota caps requests, not spend. Measure cost per request from the usage records the concierge already writes, then set a monthly spend limit with the model provider and decide whether free and paid members get different quotas.
- **The checkout code sets no tax, billing-address or terms-consent parameters** (read, not tested). Whether Stripe needs them depends on the owner's registrations. They are to be added and proven in Stripe **test mode** on company day, never edited blind: a payment function cannot be verified without a Stripe account, and nothing in CI parses the Edge Functions.
- I did not check `subscriptions.html` for a cancellation path.

## Company-day sequence
1. Legal entity, bank account, accountant, counsel (owner). Terms, privacy notice and refund policy drafted by counsel.
2. Stripe account under the company; tax registrations and the tax engine configured there.
3. Resolve the two ladders (rule 1) and replace the advertiser reach claim.
4. In Stripe **test mode**, run each tier end to end: purchase, webhook, ledger entry and entitlement, cancellation, refund and ledger reversal, a repeated webhook delivery. Test RLS by real impersonation.
5. Owner flips `payments_enabled`. Nothing else flips with it.

## Suggested order of monetisation
Subscriptions for what is already built, then fixed-price cosmetics, then licensed-partner services, then advertising last, because advertising needs a measured audience and a consent system that do not exist yet.

## Not covered
No live data, no Stripe, no jurisdiction. Nothing here says what any law requires.
