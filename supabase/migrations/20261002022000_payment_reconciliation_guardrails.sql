-- SYD OMEGA 91717
-- Payment webhook uniqueness and reconciliation state.
begin;
create unique index if not exists omega_payment_events_provider_event_uidx
  on public.omega_payment_events(provider, provider_event_id);

create table if not exists public.omega_payment_reconciliation (
  reconciliation_id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_reference text not null,
  internal_transaction_id uuid references public.omega_ledger_transactions(transaction_id),
  expected_amount numeric(20,8),
  settled_amount numeric(20,8),
  currency text,
  status text not null default 'pending'
    check (status in ('pending','matched','mismatch','reversed','review')),
  idempotency_key text not null unique,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reconciled_at timestamptz
);

alter table public.omega_payment_reconciliation enable row level security;

drop policy if exists omega_payment_reconciliation_deny_authenticated on public.omega_payment_reconciliation;
create policy omega_payment_reconciliation_deny_authenticated
  on public.omega_payment_reconciliation
  for all to authenticated
  using (false) with check (false);

revoke all on public.omega_payment_reconciliation from anon;
commit;
