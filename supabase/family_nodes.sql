-- SYD OMEGA 91717 — Family / Heritage tree (idempotent; safe to re-run)
create table if not exists public.family_nodes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text not null,
  sign text,
  is_heir boolean not null default false,
  created_at timestamptz default now()
);
alter table public.family_nodes enable row level security;
drop policy if exists "own family read" on public.family_nodes;
create policy "own family read" on public.family_nodes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own family insert" on public.family_nodes;
create policy "own family insert" on public.family_nodes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own family update" on public.family_nodes;
create policy "own family update" on public.family_nodes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own family delete" on public.family_nodes;
create policy "own family delete" on public.family_nodes for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.family_nodes to authenticated;
