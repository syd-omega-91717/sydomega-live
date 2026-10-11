-- Final hardening for Creation Layer policies and provider job FK coverage.

drop policy if exists omega_experience_definitions_owner_all on public.omega_experience_definitions;
drop policy if exists omega_experience_definitions_owner_select on public.omega_experience_definitions;
drop policy if exists "omega_experience_definitions_published_read" on public.omega_experience_definitions;

create policy omega_experience_definitions_owner_select
on public.omega_experience_definitions
for select to authenticated
using((select auth.uid())=owner_id);

create policy omega_experience_definitions_published_read
on public.omega_experience_definitions
for select to authenticated
using(status='PUBLISHED');

create index if not exists omega_provider_jobs_asset_idx
on public.omega_provider_jobs(asset_id);
