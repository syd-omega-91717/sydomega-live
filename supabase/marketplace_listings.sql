-- SYD OMEGA 91717 — Marketplace listings (idempotent, safe to re-run)
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'work',
  price_omega numeric not null default 0,
  description text,
  file_path text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.marketplace_listings enable row level security;
do $$ begin
  create policy ml_read on public.marketplace_listings for select to authenticated
    using (status = 'active' or seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_insert on public.marketplace_listings for insert to authenticated
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_update on public.marketplace_listings for update to authenticated
    using (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
