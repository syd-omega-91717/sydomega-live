-- SYD OMEGA 91717 — The Wire (shared member dispatch feed; idempotent)
create table if not exists public.dispatches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sign text,
  body text not null,
  created_at timestamptz default now()
);
alter table public.dispatches enable row level security;
drop policy if exists "wire read" on public.dispatches;
create policy "wire read" on public.dispatches for select to authenticated using (true);
drop policy if exists "wire insert" on public.dispatches;
create policy "wire insert" on public.dispatches for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.dispatches to authenticated;
