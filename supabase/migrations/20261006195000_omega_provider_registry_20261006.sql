-- Ω Provider / Connector Registry
-- Catalogs available adapters without claiming provider authentication or production readiness.

create table if not exists public.omega_provider_registry(
  id uuid primary key default gen_random_uuid(),
  provider_key text unique not null,
  display_name text not null,
  adapter_kind text not null,
  capabilities jsonb not null default '[]'::jsonb,
  status text not null default 'UNCONFIGURED',
  secret_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(status in ('UNCONFIGURED','READY','DEGRADED','DISABLED'))
);

alter table public.omega_provider_registry enable row level security;
drop policy if exists omega_provider_registry_authenticated_read on public.omega_provider_registry;
create policy omega_provider_registry_authenticated_read on public.omega_provider_registry
for select to authenticated using(true);
grant select on public.omega_provider_registry to authenticated;

create table if not exists public.omega_provider_jobs(
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.omega_provider_registry(id),
  asset_id uuid references public.omega_creative_assets(id) on delete set null,
  capability text not null,
  request jsonb not null default '{}'::jsonb,
  status text not null default 'QUEUED',
  external_job_id text,
  provider_response jsonb not null default '{}'::jsonb,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  check(status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED'))
);

alter table public.omega_provider_jobs enable row level security;
drop policy if exists omega_provider_jobs_owner_select on public.omega_provider_jobs;
create policy omega_provider_jobs_owner_select on public.omega_provider_jobs
for select to authenticated using((select auth.uid())=owner_id);
grant select on public.omega_provider_jobs to authenticated;

create index if not exists omega_provider_jobs_owner_created_idx
on public.omega_provider_jobs(owner_id,created_at desc);
create index if not exists omega_provider_jobs_provider_status_idx
on public.omega_provider_jobs(provider_id,status);

insert into public.omega_provider_registry(provider_key,display_name,adapter_kind,capabilities,metadata) values
('adobe','Adobe','CONNECTOR','["IMAGE_EDITING","DESIGN","DOCUMENT","MOCKUP","BATCH_PHOTO"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('higgsfield','Higgsfield','CONNECTOR','["IMAGE","VIDEO","AUDIO","WEBSITE"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('runway','Runway','CONNECTOR','["IMAGE","VIDEO","AUDIO","ANIMATION"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('heygen','HeyGen','CONNECTOR','["VIDEO","AVATAR","VOICE","TRANSLATION"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('invideo','Invideo','CONNECTOR','["VIDEO","SCRIPT_TO_VIDEO"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('canva','Canva','CONNECTOR','["DESIGN","PRESENTATION","DOCUMENT","SOCIAL"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('magnific','Magnific','CONNECTOR','["IMAGE","UPSCALE","AUDIO","VIDEO","3D"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('explain_video_generator','Explain Video Generator','CONNECTOR','["EXPLAINER_VIDEO"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('figma','Figma','CONNECTOR','["DESIGN","DESIGN_SYSTEM","PROTOTYPE"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('base44','Base44','CONNECTOR','["APP_BUILD","WEBSITE_BUILD"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('lovable','Lovable','CONNECTOR','["APP_BUILD","WEBSITE_BUILD"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb),
('replit','Replit','CONNECTOR','["APP_BUILD","WEBSITE_BUILD","DEPLOYMENT"]'::jsonb,'{"source":"installed_connector","auth_verified":false}'::jsonb)
on conflict(provider_key) do update set display_name=excluded.display_name,adapter_kind=excluded.adapter_kind,capabilities=excluded.capabilities,metadata=excluded.metadata,updated_at=now();
