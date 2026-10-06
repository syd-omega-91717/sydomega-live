-- Consolidate Creation Layer SELECT authorization into one permissive policy.

drop policy if exists omega_experience_definitions_owner_select on public.omega_experience_definitions;
drop policy if exists omega_experience_definitions_published_read on public.omega_experience_definitions;
drop policy if exists "omega_experience_definitions_published_read" on public.omega_experience_definitions;

create policy omega_experience_definitions_owner_or_published_select
on public.omega_experience_definitions
for select to authenticated
using((select auth.uid())=owner_id or status='PUBLISHED');
