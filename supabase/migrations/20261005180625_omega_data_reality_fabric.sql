-- Ω DATA REALITY FABRIC
create table if not exists public.omega_data_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  domain text not null,
  display_name text not null,
  source_uri text,
  access_mode text not null check (access_mode in ('DATABASE','PUBLIC_API','WEBHOOK','CONNECTOR','USER_CREATED','INTERNAL')),
  truth_state text not null default 'UNVERIFIED' check (truth_state in ('LIVE','CALCULATED','SIMULATED','USER_CREATED','LORE','UNAVAILABLE','UNVERIFIED','BLOCKED')),
  freshness_seconds integer check (freshness_seconds is null or freshness_seconds > 0),
  last_verified_at timestamptz,
  verification_method text,
  status_reason text,
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.omega_data_sources enable row level security;
revoke all on public.omega_data_sources from public, anon;
grant select on public.omega_data_sources to authenticated;
drop policy if exists omega_data_sources_authenticated_read on public.omega_data_sources;
create policy omega_data_sources_authenticated_read on public.omega_data_sources for select to authenticated using (true);
create index if not exists omega_data_sources_domain_idx on public.omega_data_sources(domain);
create index if not exists omega_data_sources_truth_state_idx on public.omega_data_sources(truth_state);
create index if not exists omega_data_sources_active_idx on public.omega_data_sources(active);
create or replace function public.omega_touch_data_source_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
revoke all on function public.omega_touch_data_source_updated_at() from public, anon, authenticated;
drop trigger if exists omega_data_sources_touch_updated_at on public.omega_data_sources;
create trigger omega_data_sources_touch_updated_at before update on public.omega_data_sources for each row execute function public.omega_touch_data_source_updated_at();
insert into public.omega_data_sources
  (source_key,domain,display_name,source_uri,access_mode,truth_state,freshness_seconds,last_verified_at,verification_method,status_reason,metadata)
values
  ('supabase-production','platform','Supabase production database',null,'DATABASE','LIVE',60,now(),'live project schema/runtime verification','Authoritative production database for canonical application state.','{"project_ref":"ydqhzvvoyufiiqvzcjns","scope":"canonical production state"}'::jsonb),
  ('hacker-news-public-api','news','Hacker News public API','https://hacker-news.firebaseio.com/v0/','PUBLIC_API','UNVERIFIED',300,null,'production Edge Function contract exists; live upstream probe pending','External upstream is implemented but current runtime fetch evidence is not asserted by this registry until a live probe succeeds.','{"adapter":"intel-feed","provider":"Hacker News"}'::jsonb)
on conflict (source_key) do update set
  domain=excluded.domain, display_name=excluded.display_name, source_uri=excluded.source_uri,
  access_mode=excluded.access_mode,
  truth_state=case when public.omega_data_sources.source_key='hacker-news-public-api' then public.omega_data_sources.truth_state else excluded.truth_state end,
  freshness_seconds=excluded.freshness_seconds,
  last_verified_at=case when public.omega_data_sources.source_key='hacker-news-public-api' then public.omega_data_sources.last_verified_at else excluded.last_verified_at end,
  verification_method=excluded.verification_method, status_reason=excluded.status_reason,
  metadata=excluded.metadata, active=true;
comment on table public.omega_data_sources is 'Canonical registry of real, calculated, simulated and unavailable data sources. Provider truth is explicit; absence of probe evidence never becomes LIVE by assumption.';
comment on column public.omega_data_sources.truth_state is 'Truth contract for the source itself; this is not permission or authorization.';