# SYD OMEGA — live migration ledger reconciliation (2026-11-12)

## Scope

This record reconciles the committed Supabase migration snapshot with the configured production project's provider migration ledger. It does not claim that a ledger row alone proves the intended SQL behavior.

## Provider evidence

A read-only query against project `ydqhzvvoyufiiqvzcjns` confirmed **419 recorded migration versions**, with latest version `20261112091500`.

The three versions missing from the previously committed 416-version snapshot were present in `supabase_migrations.schema_migrations`:

- `20261112091300` — idempotency payload integrity
- `20261112091400` — Stripe refund-state foreign-key index
- `20261112091500` — search-index schema/RLS reconciliation

## Semantic verification performed

- The six `omega_private` write helpers and `private.record_sovereign_event` expose their expected idempotency-conflict guards in the live function definitions.
- All six `omega_private` helpers have an empty `search_path`, are executable by `service_role`, and are not executable by `anon` or `authenticated`.
- `private.record_sovereign_event` has an empty `search_path`, is executable by `authenticated`, and is not executable by `anon`.
- `stripe_refund_state_last_reversal_transaction_idx` exists.
- `search_index` contains the compatibility columns, its authenticated read policy is owner/shared scoped, and `search_index_owner_updated_idx` exists.

The evidence is also represented in `supabase/remote-migrations.json`. The three provider-applied versions were removed from `supabase/pending-migrations.json`.

## Remaining migration replay correction

A fresh full migration replay then exposed one independent clean-install schema gap: the consultancy `cases.read` adapter selects `expert_bookings.domain`, which exists in production but was absent from the clean migration history. The additive migration `20261112103000_omega_expert_bookings_domain_compatibility.sql` adds this nullable column if absent.

That new migration remains explicitly pending until the full migration replay and runtime adapter SQL probe pass. It has **not** been applied to production as part of this reconciliation.

## Release rule

Do not mark migration parity complete until:
1. the full migration replay succeeds from a clean database;
2. the SQL adapter regression probe succeeds;
3. the additive compatibility migration is applied through the controlled provider workflow;
4. the provider ledger and committed snapshot are reconciled again.
