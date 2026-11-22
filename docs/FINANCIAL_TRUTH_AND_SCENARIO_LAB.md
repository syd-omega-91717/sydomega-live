# SYD OMEGA 91717 — Finance Truth and Scenario Lab

**Status:** first implementation wave, 2026-11-22  
**Surface:** owner-only `income.html` / Finance Command  
**Production rule:** actual provider records and simulations are separate systems.

## Live financial state at implementation

Read-only Supabase verification for project `ydqhzvvoyufiiqvzcjns` found:

- Stripe settlement ledger: 0 settlement transactions and 0 refund transactions.
- Payment events: 0 processed and 0 failed.
- Reconciliation: 0 unmatched records.
- Payments, Stripe integration, tokens and KYC intake flags: disabled.
- Checkout remains held behind legal, provider and runtime gates.

Therefore the live platform currently has no verified Stripe settlement amount to report. The dashboard displays the empty state rather than inventing a zero-dollar balance or deriving income from member counts.

## Actuals contract

`public.omega_owner_finance_summary()` returns an aggregate only when the caller is a platform owner and the JWT assurance level is AAL2. It returns no member identifiers, payment metadata or raw provider references.

Source tables:

- `omega_ledger_transactions`
- `omega_ledger_entries`
- `omega_ledger_accounts`
- `omega_payment_events`
- `omega_payment_reconciliation`
- `platform_settings`

Amounts are grouped by currency. They are never added across currencies.

The displayed amount is **gross provider-settled receipts**, refunds and the arithmetic remainder after refunds. This is not recognized accounting revenue. Tax, processor fees, disputes, FX, reserves, payout timing, accrual adjustments and non-Stripe income channels are not netted or included.

## Scenario Lab contract

Scenario assumptions are stored in `omega_financial_scenarios`, protected by per-user RLS. Every run calls `omega_run_financial_scenario(uuid)`, which verifies ownership, computes the projection in PostgreSQL and inserts an immutable row in `omega_financial_simulation_runs`.

- Formula version: `1.0.0`
- Scenario version increments on each edit.
- A run stores its input snapshot, output snapshot, currency and formula version.
- Runs are read-only to clients; clients cannot insert, update or delete simulation evidence.
- Deleting a scenario does not delete prior runs.

### Formula

For each period:

1. Churned members = rounded opening paying members × churn percentage.
2. Closing paying members = opening members − churned members + new paying members.
3. Gross billings = closing paying members × assumed monthly price.
4. Refund estimate = gross billings × assumed refund percentage.
5. Tax estimate = (gross billings − refund estimate) × assumed tax percentage.
6. Processing estimate = gross billings × assumed percentage fee + closing paying members × assumed fixed fee.
7. Net operating cash estimate = gross billings − refund estimate − tax estimate − processing estimate − assumed operating costs.

This is a deliberately explicit planning model, not a tax engine, statutory accounting ledger, investment recommendation or cash forecast. The user supplies all assumptions. The tax base and fixed-fee frequency are model assumptions, not provider facts. The model excludes chargebacks, discounts, failed collections, FX, reserves, payout delays, capex, payroll, financing and corporate tax.

## Security boundaries

- Public actuals and simulation RPCs: SECURITY INVOKER wrappers. Their privileged implementations live in the non-exposed `private` schema, use an empty search path, and enforce owner/AAL2 or per-user ownership.
- Scenario records: RLS enabled; select/insert/update/delete scoped to `auth.uid()`.
- Simulation runs: RLS enabled; authenticated users can read only their own rows. Direct client writes are revoked; the owner-checked private implementation creates each run. The `scenario_id` foreign key is indexed.
- Payment, Stripe, token and KYC feature flags are not changed by these migrations.
- No live payment or synthetic payment record is created.

## Financial activation gates

Do not enable checkout, payouts, tokens or member-facing investment products until the platform has:

1. Approved legal entity, jurisdiction, tax, consumer, refund, marketplace and financial-promotion terms.
2. A confirmed Stripe account, supported business model, live credentials and verified webhook endpoint.
3. A complete signed test-mode lifecycle: checkout, payment, duplicate delivery, subscription changes, entitlement, partial/full refund, reversal, dispute and reconciliation.
4. A reconciled chart of accounts that separates gross collections, tax liabilities, provider fees, marketplace payable, refunds, reserves and recognized revenue.
5. Connect onboarding and verification flows if the product pays third-party sellers or creators.
6. A documented accounting owner, close process, exception queue and evidence retention policy.

Stripe documents currency-specific minor-unit rules and requires zero-decimal handling; the existing repository migration `20261024091500_fix_stripe_zero_decimal_settlement_precision.sql` is already applied and live. Stripe Connect's hosted/embedded onboarding can manage dynamic identity and business verification requirements, but it does not replace counsel's review of SYD OMEGA's business model or obligations.

## Next implementation priorities

1. Replace browser-only `treasury.html` and `investment.html` storage with dedicated, consented, RLS-protected user records. Do not merge member portfolios with the platform treasury.
2. Implement a real source-of-truth bank/provider reconciliation import with idempotent ingestion, evidence files and exception handling.
3. Complete accounting treatment for taxes, provider fees, chargebacks, payouts and multi-currency settlements before labelling any amount as revenue or profit.
4. Resolve Twelve Data redistribution licensing before activating member-facing market quotes.
5. Add tested Stripe Connect onboarding only after legal/product approval.
6. Redesign remaining finance surfaces using the Finance archetype: dark void, gold/emerald financial hierarchy, readable type, accessible tables, reduced-motion support and explicit LIVE / CALCULATED / SIMULATED / UNAVAILABLE labels.

## Runtime verification

A temporary synthetic scenario was executed through the live private RPC using an owner identity. Fixture inputs: 100 starting members, 10 new paying members per month, 0% churn, assumed monthly price 20 USD, 5% refunds, 10% tax assumption, 3% processing assumption, 0.30 USD fixed fee per payment, 100 USD monthly operating cost, two periods.

Expected and returned totals matched:

| Output | Synthetic result |
|---|---:|
| Gross billings | 4,600 USD |
| Refund estimate | 230 USD |
| Tax estimate | 437 USD |
| Processing estimate | 207 USD |
| Operating costs | 200 USD |
| Net operating cash estimate | 3,526 USD |

This is a formula smoke test only. It is not a platform financial result, not a customer payment and not recognized revenue. The temporary scenario and run were deleted after the test; a follow-up query confirmed zero remaining test rows.

## External provider and regulatory references

These sources inform implementation gates; they do not substitute for advice from counsel or the platform's payment provider.

- Stripe supported currencies: https://docs.stripe.com/currencies — amounts are supplied in currency minor units; zero-decimal currencies and special cases such as ISK and UGX must be handled explicitly.
- Stripe webhook handling: https://docs.stripe.com/webhooks — raw request body and signature verification are required; webhook endpoints should acknowledge quickly.
- Stripe webhook recovery and duplicate handling: https://docs.stripe.com/events/manage-webhook-endpoints — Stripe retries undelivered events; handlers must safely skip events already processed.
- Stripe Connect: https://docs.stripe.com/connect — use a Connect architecture when the product must model multiple accounts, marketplace payments, seller/creator payouts or platform money movement.
- Stripe Europe connected-account verification update (August 2026): https://support.stripe.com/questions/europe-updated-verification-requirements-for-connected-accounts-of-platforms?locale=en-GB — custom platforms must handle updated identity, legal-entity, UBO and director requirements; the stated existing-account collection deadline was 31 October 2026.
- Finanstilsynet CASP guidance (8 July 2026): https://www.finanstilsynet.no/tema/kryptoeiendeler-mica/kryptoeiendelstjenesteytere-casp/ — EEA crypto-asset services generally require MiCA Article 63 authorization or an applicable Article 60 notification for certain already-regulated financial entities.
- ESMA public statement (23 June 2026): https://www.esma.europa.eu/sites/default/files/2026-06/ESMA75-113276571-1710_Public_Statement_MiCA_transitional_period_ends.pdf — the MiCA transitional period ends 1 July 2026; unauthorised CASPs serving EU clients are expected to wind down in an orderly manner.

- Finanstilsynet MiCA overview (updated 26 October 2026): https://www.finanstilsynet.no/tema/kryptoeiendeler-mica — Norway's Crypto-Assets Act implementing MiCA has applied since 1 July 2025 and covers issuance, offers, trading and crypto-asset services in the Norwegian framework.
- Stripe KYC Refresh (updated October 2026): https://support.stripe.com/questions/kyc-refresh-upcoming-periodic-confirmation-requirements?locale=en-GB — the first rollout applies to European connected accounts; the API is in private preview during 2026, with public preview planned for Q1 2027. A Connect integration must be designed for recurring verification changes, not a one-time onboarding form.
- Stripe webhook fulfillment guide: https://docs.stripe.com/payments/checkout/fulfill-orders — fulfill from verified asynchronous webhook events, not only from a browser redirect. The endpoint must verify the Stripe signature against the unmodified request body and deduplicate event processing.


If SYD OMEGA offers crypto-asset services, custody, exchange, transfer, token distribution, or marketplace payouts to EU/EEA users, determine the legal entity, service classification, home jurisdiction, authorization/notification route and applicable national rules before enabling the feature. Do not infer that Stripe Connect onboarding or Stripe's own licenses authorize SYD OMEGA to conduct regulated activity.
