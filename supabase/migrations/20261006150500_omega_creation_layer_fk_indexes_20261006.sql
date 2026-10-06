begin;
create index if not exists omega_creative_assets_parent_asset_idx on public.omega_creative_assets(parent_asset_id);
create index if not exists omega_experience_definitions_project_idx on public.omega_experience_definitions(project_id);
commit;