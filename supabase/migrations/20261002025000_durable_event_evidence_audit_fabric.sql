-- SYD OMEGA 91717
-- Durable event, evidence and audit fabric.
begin;

-- (2026-10-04) omega_platform_events/_evidence already exist from
-- 20260904194956 in their legacy shape, so the CREATEs below are no-ops and
-- the indexes on the new columns failed on a fresh `supabase db reset`.
-- Upgrade them first -- the same idempotent block as
-- 20261002073936_omega_event_fabric_compatibility_reconciliation.sql, which
-- live applied after this file. A no-op live.
do $$
begin
  if to_regclass('public.omega_platform_events') is not null then
    alter table if exists public.omega_platform_events
      add column if not exists event_id uuid;
    update public.omega_platform_events set event_id=gen_random_uuid() where event_id is null;
    alter table if exists public.omega_platform_events alter column event_id set not null;
    create unique index if not exists omega_platform_events_event_uidx on public.omega_platform_events(event_id);
    alter table if exists public.omega_platform_events add column if not exists actor_user_id uuid;
    alter table if exists public.omega_platform_events add column if not exists actor_type text default 'user';
    alter table if exists public.omega_platform_events add column if not exists correlation_id uuid;
    alter table if exists public.omega_platform_events add column if not exists idempotency_key text;
    alter table if exists public.omega_platform_events add column if not exists schema_version text default '1';
    alter table if exists public.omega_platform_events add column if not exists source text default 'legacy';
    alter table if exists public.omega_platform_events add column if not exists entity_type text;
    alter table if exists public.omega_platform_events add column if not exists entity_id text;
    alter table if exists public.omega_platform_events add column if not exists payload jsonb default '{}'::jsonb;
    update public.omega_platform_events
    set actor_type=coalesce(actor_type,'user'),schema_version=coalesce(schema_version,'1'),
        source=coalesce(source,'legacy'),payload=coalesce(payload,metadata,'{}'::jsonb),
        idempotency_key=coalesce(idempotency_key,'legacy-event:'||id::text);
    create unique index if not exists omega_platform_events_idempotency_uidx on public.omega_platform_events(idempotency_key);
  end if;
end $$;
do $$
begin
  if to_regclass('public.omega_platform_evidence') is not null then
    alter table if exists public.omega_platform_evidence add column if not exists evidence_id uuid;
    update public.omega_platform_evidence set evidence_id=id where evidence_id is null;
    alter table if exists public.omega_platform_evidence alter column evidence_id set not null;
    create unique index if not exists omega_platform_evidence_evidence_uidx on public.omega_platform_evidence(evidence_id);
    alter table if exists public.omega_platform_evidence add column if not exists event_id uuid;
    alter table if exists public.omega_platform_evidence add column if not exists owner_user_id uuid;
    alter table if exists public.omega_platform_evidence add column if not exists evidence_type text default 'legacy';
    alter table if exists public.omega_platform_evidence add column if not exists source text default 'legacy';
    alter table if exists public.omega_platform_evidence add column if not exists subject_type text;
    alter table if exists public.omega_platform_evidence add column if not exists subject_id text;
    alter table if exists public.omega_platform_evidence add column if not exists status text default 'recorded';
    alter table if exists public.omega_platform_evidence add column if not exists content_hash text;
    alter table if exists public.omega_platform_evidence add column if not exists uri text;
    alter table if exists public.omega_platform_evidence add column if not exists metadata jsonb default '{}'::jsonb;
    alter table if exists public.omega_platform_evidence add column if not exists verified_at timestamptz;
    update public.omega_platform_evidence
    set evidence_type=coalesce(evidence_type,coalesce(evidence_level,'legacy')),
        source=coalesce(source,'legacy'),status=coalesce(status,'recorded'),
        metadata=coalesce(metadata,evidence,'{}'::jsonb);
  end if;
end $$;

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
