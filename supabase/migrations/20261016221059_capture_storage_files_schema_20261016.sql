-- Ω SYD OMEGA 91717 — capture public.storage_files in the migration chain
-- The table exists live but no migration ever created it, so a fresh replay
-- had no storage_files and the content pipeline (content-ingest /
-- content-delivery) could not run there. This captures the live definition
-- exactly as read on 2026-10-16 (columns, defaults, keys, RLS, the single
-- deny-by-default policy) and re-applies the service_role grants from
-- 20261016213149. Every statement is idempotent: live it is a no-op.

begin;

create table if not exists public.storage_files (
  id uuid not null default gen_random_uuid(),
  owner_id uuid,
  organization_id uuid,
  folder text,
  filename text not null,
  storage_path text not null,
  mime_type text,
  extension text,
  size_bytes bigint,
  checksum text,
  visibility text default 'private'::text,
  created_at timestamp with time zone default now(),
  constraint storage_files_pkey primary key (id),
  constraint storage_files_owner_id_fkey foreign key (owner_id) references public.profiles(id),
  constraint storage_files_organization_id_fkey foreign key (organization_id) references public.organizations(id)
);

create index if not exists idx_storage_owner on public.storage_files using btree (owner_id);
create index if not exists idx_storage_org on public.storage_files using btree (organization_id);

alter table public.storage_files enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'storage_files' and policyname = 'omega_deny_by_default'
  ) then
    create policy omega_deny_by_default on public.storage_files
      as permissive for all to anon, authenticated using (false) with check (false);
  end if;
end
$$;

-- Clients reach this table only through the content Edge Functions.
revoke all on table public.storage_files from anon, authenticated;
grant select, insert, delete on table public.storage_files to service_role;

commit;
