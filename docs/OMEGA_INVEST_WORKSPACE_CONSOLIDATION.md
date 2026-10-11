# Ω INVEST Workspace Consolidation

## Purpose
`/invest.html` is the canonical user-facing entry point for the financial workspace.

It does not delete or silently replace specialist routes. Existing routes remain deep-linkable while the persistent navigation exposes one coherent INVEST destination.

## Consolidated family
- `investment.html` — personal investment holdings/allocation
- `portfolio.html` — platform authority/Matrix portfolio
- `treasury.html` — assets/reserves/cash-flow planning
- `wallet.html` — wallet/account tracking
- `revenue.html` — revenue architecture and projections
- `income.html` — income/allocation planning
- `budget.html` — budgeting
- `expenses.html` — expense tracking
- `wealth.html` — wealth/net-worth planning
- `ledger.html` — asset ledger
- `payments.html` — platform payments
- `subscriptions.html` — platform subscriptions

## Truth boundaries
The workspace deliberately distinguishes:
- user-local financial tracking
- authenticated platform financial state
- illustrative/planned economic concepts

No fabricated balances, market prices, reserves, revenue or sovereign-currency value are introduced.

## Navigation rule
`INVEST` now resolves to `/invest.html`. Specialist pages remain reachable from the workspace and through preserved deep links.

## Migration rule
Future consolidation should absorb duplicate capabilities into the canonical workspace before any legacy file is removed. Removal requires capability coverage, deep-link handling, authorization/RLS verification, analytics verification and production verification.
