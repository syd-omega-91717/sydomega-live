begin;

-- Reconciliation checkpoint for the pre-existing event/evidence tables.
-- The target project contained legacy event/evidence rows. This migration
-- upgrades them to the durable event/evidence shape without deleting data.
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

-- (2026-10-04) Only a legacy-shaped table (it has `id`) needs this; on a fresh
-- `supabase db reset` 20261002025000 already created the durable shape, which
-- has no `id`/`evidence_level`, and the UPDATEs below failed. A no-op live.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public'
             and table_name = 'omega_platform_evidence' and column_name = 'id') then
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

create table if not exists public.omega_audit_log (
  audit_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_type text not null default 'system',
  action text not null,
  resource_type text,
  resource_id text,
  outcome text not null,
  correlation_id uuid,
  idempotency_key text unique,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
commit;
