begin;

create table if not exists public.omega_creative_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  project_type text not null check (project_type in ('IMAGE','VIDEO','MOVIE','GAME','WORLD','MIXED')),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','PAUSED','ARCHIVED')),
  truth_state text not null default 'USER-CREATED' check (truth_state in ('LIVE','CALCULATED','SIMULATED','USER-CREATED','LORE','UNAVAILABLE')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.omega_creative_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.omega_creative_projects(id) on delete set null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  parent_asset_id uuid references public.omega_creative_assets(id) on delete set null,
  asset_type text not null check (asset_type in ('IMAGE','VIDEO','MOVIE','AUDIO','GAME_BUILD','MODEL','TEXT','DATA','OTHER')),
  title text not null,
  prompt text,
  provider text,
  provider_asset_id text,
  source_uri text,
  storage_path text,
  content_sha256 text,
  status text not null default 'DESIGNED' check (status in ('DESIGNED','QUEUED','GENERATING','READY','FAILED','ARCHIVED')),
  truth_state text not null default 'USER-CREATED' check (truth_state in ('LIVE','CALCULATED','SIMULATED','USER-CREATED','LORE','UNAVAILABLE')),
  license text,
  provenance jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_asset_id)
);

create table if not exists public.omega_experience_definitions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.omega_creative_projects(id) on delete set null,
  slug text not null,
  name text not null,
  experience_type text not null check (experience_type in ('GAME','SIMULATION','STORY','INTERACTIVE_MOVIE','TRAINING','PUZZLE','WORLD')),
  version integer not null default 1 check (version > 0),
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','RETIRED')),
  rules jsonb not null default '{}'::jsonb,
  content jsonb not null default '{}'::jsonb,
  truth_state text not null default 'SIMULATED' check (truth_state in ('LIVE','CALCULATED','SIMULATED','USER-CREATED','LORE','UNAVAILABLE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug, version)
);

create table if not exists public.omega_experience_runs (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references public.omega_experience_definitions(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','PAUSED','COMPLETED','FAILED','ABANDONED')),
  state jsonb not null default '{}'::jsonb,
  score numeric,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  last_event_at timestamptz
);

create index if not exists omega_creative_projects_owner_idx on public.omega_creative_projects(owner_id, updated_at desc);
create index if not exists omega_creative_assets_owner_idx on public.omega_creative_assets(owner_id, updated_at desc);
create index if not exists omega_creative_assets_project_idx on public.omega_creative_assets(project_id, created_at desc);
create index if not exists omega_experience_definitions_owner_idx on public.omega_experience_definitions(owner_id, updated_at desc);
create index if not exists omega_experience_runs_user_idx on public.omega_experience_runs(user_id, started_at desc);
create index if not exists omega_experience_runs_experience_idx on public.omega_experience_runs(experience_id, started_at desc);

alter table public.omega_creative_projects enable row level security;
alter table public.omega_creative_assets enable row level security;
alter table public.omega_experience_definitions enable row level security;
alter table public.omega_experience_runs enable row level security;

drop policy if exists omega_creative_projects_owner_all on public.omega_creative_projects;
create policy omega_creative_projects_owner_all on public.omega_creative_projects for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);

drop policy if exists omega_creative_assets_owner_all on public.omega_creative_assets;
create policy omega_creative_assets_owner_all on public.omega_creative_assets for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);

drop policy if exists omega_experience_definitions_owner_all on public.omega_experience_definitions;
create policy omega_experience_definitions_owner_all on public.omega_experience_definitions for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);

drop policy if exists omega_experience_runs_user_all on public.omega_experience_runs;
create policy omega_experience_runs_user_all on public.omega_experience_runs for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);

create or replace function public.omega_creation_surface()
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select jsonb_build_object(
    'creative_projects',coalesce((select jsonb_agg(p order by p.updated_at desc) from public.omega_creative_projects p where p.owner_id=(select auth.uid())),'[]'::jsonb),
    'assets',coalesce((select jsonb_agg(a order by a.updated_at desc) from public.omega_creative_assets a where a.owner_id=(select auth.uid())),'[]'::jsonb),
    'experiences',coalesce((select jsonb_agg(e order by e.updated_at desc) from public.omega_experience_definitions e where e.owner_id=(select auth.uid())),'[]'::jsonb),
    'runs',coalesce((select jsonb_agg(r order by r.started_at desc) from public.omega_experience_runs r where r.user_id=(select auth.uid())),'[]'::jsonb),
    'truth_contract',jsonb_build_object(
      'generated_media_requires_provider_job','true',
      'game_state_is_user_scoped','true',
      'lore_never_promoted_to_live','true'
    )
  );
$$;

revoke execute on function public.omega_creation_surface() from public,anon;
grant execute on function public.omega_creation_surface() to authenticated;

commit;
