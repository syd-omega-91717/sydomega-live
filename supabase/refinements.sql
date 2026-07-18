-- SYD OMEGA 91717 -- publishing approval + background preference (idempotent)
-- Requires public.is_platform_owner() and public.publications, both created by
-- omega_backend_sync.sql (or the full omega_master_deploy.sql) -- run that first.
alter table public.publications add column if not exists status text not null default 'private';
alter table public.profiles add column if not exists bg_color text;

drop policy if exists "owner reads publications" on public.publications;
create policy "owner reads publications" on public.publications for select to authenticated using (public.is_platform_owner());
drop policy if exists "owner updates publications" on public.publications;
create policy "owner updates publications" on public.publications for update to authenticated using (public.is_platform_owner()) with check (true);
grant update on public.publications to authenticated;
