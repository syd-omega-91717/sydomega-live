-- SYD OMEGA 91717 — Marketing / placement reservations (idempotent; safe to re-run)
create table if not exists public.media_reservations (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  zone text not null,
  duration text not null,
  title text not null,
  message text not null,
  price_omega bigint not null default 0,
  status text not null default 'reserved',
  created_at timestamptz default now()
);
alter table public.media_reservations enable row level security;
drop policy if exists "own media read" on public.media_reservations;
create policy "own media read" on public.media_reservations for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own media insert" on public.media_reservations;
create policy "own media insert" on public.media_reservations for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.media_reservations to authenticated;
