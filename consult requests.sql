-- SYD OMEGA 91717 — Consultancy intake table (idempotent; safe to re-run)
create table if not exists public.consult_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  domain text not null,
  message text not null,
  status text not null default 'received',
  created_at timestamptz default now()
);
alter table public.consult_requests enable row level security;

drop policy if exists "own consults read" on public.consult_requests;
create policy "own consults read" on public.consult_requests
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "own consults insert" on public.consult_requests;
create policy "own consults insert" on public.consult_requests
  for insert to authenticated with check (auth.uid() = user_id);

grant select, insert on public.consult_requests to authenticated;
