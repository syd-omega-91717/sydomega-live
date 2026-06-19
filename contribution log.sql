-- SYD OMEGA 91717 — Contribution evidence log (idempotent, auditable)
create table if not exists public.contribution_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task text not null,
  domain text,
  act text,
  evidence text,
  created_at timestamptz not null default now(),
  unique(user_id, task)
);
alter table public.contribution_log enable row level security;
do $$ begin
  create policy cl_read on public.contribution_log for select to authenticated
    using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy cl_insert on public.contribution_log for insert to authenticated
    with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;
-- owner audit (uses existing is_app_owner() if present)
do $$ begin
  create policy cl_owner_read on public.contribution_log for select to authenticated
    using (public.is_app_owner());
exception when duplicate_object then null; when undefined_function then null; end $$;
