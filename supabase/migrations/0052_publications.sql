-- SYD OMEGA 91717 — Publishing archive (idempotent; safe to re-run)
create table if not exists public.publications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);
alter table public.publications enable row level security;
drop policy if exists "own pubs read" on public.publications;
create policy "own pubs read" on public.publications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own pubs insert" on public.publications;
create policy "own pubs insert" on public.publications for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.publications to authenticated;
