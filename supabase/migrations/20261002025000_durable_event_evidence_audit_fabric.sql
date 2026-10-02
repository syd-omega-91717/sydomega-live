-- SYD OMEGA 91717
-- Durable event, evidence and audit fabric.
begin;

create table if not exists public.omega_platform_events (
  event_id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('route_view','action_started','action_completed','mission_progress','capability_used','simulation_run','evidence_recorded','replay_checkpoint')),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'user' check (actor_type in ('user','agent','system','service')),
  correlation_id uuid,
  idempotency_key text not null unique,
  schema_version text not null default '1',
  source text not null,
  entity_type text,
  entity_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists omega_platform_events_actor_idx on public.omega_platform_events(actor_user_id,created_at desc);
create index if not exists omega_platform_events_entity_idx on public.omega_platform_events(entity_type,entity_id,created_at desc);

create table if not exists public.omega_platform_evidence (
  evidence_id uuid primary key default gen_random_uuid(),
  event_id uuid references public.omega_platform_events(event_id) on delete set null,
  owner_user_id uuid references auth.users(id) on delete set null,
  evidence_type text not null,
  source text not null,
  subject_type text,
  subject_id text,
  status text not null default 'recorded' check (status in ('recorded','verified','rejected','expired')),
  content_hash text,
  uri text,
  metadata jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  verified_at timestamptz
);
create index if not exists omega_platform_evidence_subject_idx on public.omega_platform_evidence(subject_type,subject_id,recorded_at desc);
create index if not exists omega_platform_evidence_owner_idx on public.omega_platform_evidence(owner_user_id,recorded_at desc);

create table if not exists public.omega_audit_log (
  audit_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'system' check (actor_type in ('user','agent','system','service')),
  action text not null,
  resource_type text,
  resource_id text,
  outcome text not null check (outcome in ('success','failure','denied','review')),
  correlation_id uuid,
  idempotency_key text unique,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists omega_audit_log_actor_idx on public.omega_audit_log(actor_user_id,created_at desc);
create index if not exists omega_audit_log_resource_idx on public.omega_audit_log(resource_type,resource_id,created_at desc);

alter table public.omega_platform_events enable row level security;
alter table public.omega_platform_evidence enable row level security;
alter table public.omega_audit_log enable row level security;

drop policy if exists omega_platform_events_owner_read on public.omega_platform_events;
create policy omega_platform_events_owner_read on public.omega_platform_events for select to authenticated using ((select auth.uid())=actor_user_id);
drop policy if exists omega_platform_evidence_owner_read on public.omega_platform_evidence;
create policy omega_platform_evidence_owner_read on public.omega_platform_evidence for select to authenticated using ((select auth.uid())=owner_user_id);
drop policy if exists omega_audit_log_owner_read on public.omega_audit_log;
create policy omega_audit_log_owner_read on public.omega_audit_log for select to authenticated using ((select auth.uid())=actor_user_id);

revoke insert,update,delete on public.omega_platform_events from anon,authenticated;
revoke insert,update,delete on public.omega_platform_evidence from anon,authenticated;
revoke insert,update,delete on public.omega_audit_log from anon,authenticated;
revoke all on public.omega_platform_events,public.omega_platform_evidence,public.omega_audit_log from anon;

commit;
