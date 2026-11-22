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

- Actuals RPC: SECURITY DEFINER, empty search path, owner check, AAL2 check, authenticated-only execute.
- Scenario records: RLS enabled; select/insert/update/delete scoped to `auth.uid()`.
- Simulation runs: RLS enabled; authenticated users can read only their own rows. Direct client writes are revoked; the owner-checked RPC creates each run.
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
