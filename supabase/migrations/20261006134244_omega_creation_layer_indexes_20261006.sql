begin;
create index if not exists omega_creative_projects_owner_idx on public.omega_creative_projects(owner_id, updated_at desc);
create index if not exists omega_creative_assets_owner_idx on public.omega_creative_assets(owner_id, updated_at desc);
create index if not exists omega_creative_assets_project_idx on public.omega_creative_assets(project_id, created_at desc);
create index if not exists omega_experience_definitions_owner_idx on public.omega_experience_definitions(owner_id, updated_at desc);
create index if not exists omega_experience_runs_user_idx on public.omega_experience_runs(user_id, started_at desc);
create index if not exists omega_experience_runs_experience_idx on public.omega_experience_runs(experience_id, started_at desc);
commit;
