-- SYD OMEGA 91717 — Commission contracts (idempotent; safe to re-run)
create table if not exists public.commission_contracts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reference text not null,
  counterparty text not null,
  scope text not null,
  deal_value numeric not null default 0,
  commission_rate numeric not null default 0,
  commission_value numeric not null default 0,
  terms text,
  status text not null default 'drafted',
  created_at timestamptz default now()
);
alter table public.commission_contracts enable row level security;
drop policy if exists "own contracts read" on public.commission_contracts;
create policy "own contracts read" on public.commission_contracts for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own contracts insert" on public.commission_contracts;
create policy "own contracts insert" on public.commission_contracts for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.commission_contracts to authenticated;
