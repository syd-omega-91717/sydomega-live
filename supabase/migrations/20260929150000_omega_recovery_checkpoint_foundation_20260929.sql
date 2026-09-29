create table if not exists public.omega_recovery_checkpoints (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  checkpoint_key text not null,
  schema_version text not null default '1',
  source_event_count integer not null default 0 check (source_event_count >= 0),
  latest_event_at timestamptz,
  mission_state_count integer not null default 0 check (mission_state_count >= 0),
  simulation_run_count integer not null default 0 check (simulation_run_count >= 0),
  agent_audit_count integer not null default 0 check (agent_audit_count >= 0),
  snapshot jsonb not null,
  snapshot_sha256 text not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  unique (member_id, checkpoint_key)
);

alter table public.omega_recovery_checkpoints enable row level security;

drop policy if exists omega_recovery_checkpoints_select_own on public.omega_recovery_checkpoints;
create policy omega_recovery_checkpoints_select_own on public.omega_recovery_checkpoints
for select to authenticated using (member_id = (select auth.uid()));

drop policy if exists omega_recovery_checkpoints_insert_own on public.omega_recovery_checkpoints;
create policy omega_recovery_checkpoints_insert_own on public.omega_recovery_checkpoints
for insert to authenticated with check (member_id = (select auth.uid()));

drop policy if exists omega_recovery_checkpoints_update_own on public.omega_recovery_checkpoints;
create policy omega_recovery_checkpoints_update_own on public.omega_recovery_checkpoints
for update to authenticated using (member_id = (select auth.uid()))
with check (member_id = (select auth.uid()));

drop policy if exists omega_recovery_checkpoints_delete_own on public.omega_recovery_checkpoints;
create policy omega_recovery_checkpoints_delete_own on public.omega_recovery_checkpoints
for delete to authenticated using (member_id = (select auth.uid()));

create index if not exists omega_recovery_checkpoints_member_created_idx
on public.omega_recovery_checkpoints (member_id, created_at desc);

revoke insert, update, delete on public.omega_recovery_checkpoints from authenticated;

create or replace function private.omega_create_recovery_checkpoint(p_checkpoint_key text)
returns public.omega_recovery_checkpoints
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member uuid := (select auth.uid());
  v_snapshot jsonb;
  v_row public.omega_recovery_checkpoints;
begin
  if v_member is null then raise exception 'not_authenticated'; end if;
  if p_checkpoint_key is null or length(p_checkpoint_key) < 8 or length(p_checkpoint_key) > 160
     or p_checkpoint_key !~ '^[A-Za-z0-9._:-]+$' then raise exception 'invalid_checkpoint_key'; end if;

  select jsonb_build_object(
    'schema_version','1','member_id',v_member,'generated_at',now(),
    'events',jsonb_build_object(
      'count',coalesce((select count(*) from public.omega_platform_events e where e.actor_user_id=v_member),0),
      'latest_at',(select max(e.created_at) from public.omega_platform_events e where e.actor_user_id=v_member)),
    'mission_state',jsonb_build_object(
      'count',coalesce((select count(*) from public.omega_member_mission_state s where s.member_id=v_member),0),
      'active',coalesce((select count(*) from public.omega_member_mission_state s where s.member_id=v_member and s.status='active'),0),
      'completed',coalesce((select count(*) from public.omega_member_mission_state s where s.member_id=v_member and s.status='completed'),0)),
    'simulation',jsonb_build_object(
      'count',coalesce((select count(*) from public.omega_simulation_runs r where r.member_id=v_member),0)),
    'agent_operations',jsonb_build_object(
      'audit_count',coalesce((select count(*) from public.omega_agent_execution_audit a where a.member_id=v_member),0))
  ) into v_snapshot;

  insert into public.omega_recovery_checkpoints (
    member_id,checkpoint_key,schema_version,source_event_count,latest_event_at,
    mission_state_count,simulation_run_count,agent_audit_count,snapshot,snapshot_sha256)
  values (
    v_member,p_checkpoint_key,'1',
    coalesce((v_snapshot->'events'->>'count')::integer,0),
    (v_snapshot->'events'->>'latest_at')::timestamptz,
    coalesce((v_snapshot->'mission_state'->>'count')::integer,0),
    coalesce((v_snapshot->'simulation'->>'count')::integer,0),
    coalesce((v_snapshot->'agent_operations'->>'audit_count')::integer,0),
    v_snapshot,
    encode(extensions.digest(convert_to(v_snapshot::text,'utf8'),'sha256'),'hex'))
  on conflict (member_id,checkpoint_key) do update set
    schema_version=excluded.schema_version,source_event_count=excluded.source_event_count,
    latest_event_at=excluded.latest_event_at,mission_state_count=excluded.mission_state_count,
    simulation_run_count=excluded.simulation_run_count,agent_audit_count=excluded.agent_audit_count,
    snapshot=excluded.snapshot,snapshot_sha256=excluded.snapshot_sha256,created_at=now()
  returning * into v_row;

  return v_row;
end;
$$;
