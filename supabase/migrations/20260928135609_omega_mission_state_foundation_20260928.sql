create schema if not exists private;

create table if not exists public.omega_missions (
  id uuid primary key default gen_random_uuid(),
  mission_key text not null,
  version integer not null default 1 check (version > 0),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  completion_rule jsonb not null default '{}'::jsonb,
  max_attempts integer not null default 0 check (max_attempts >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mission_key, version)
);

create table if not exists public.omega_quests (
  id uuid primary key default gen_random_uuid(),
  quest_key text not null,
  version integer not null default 1 check (version > 0),
  title text not null,
  description text,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quest_key, version)
);

create table if not exists public.omega_quest_missions (
  quest_id uuid not null references public.omega_quests(id) on delete cascade,
  mission_id uuid not null references public.omega_missions(id) on delete restrict,
  sequence_no integer not null check (sequence_no > 0),
  created_at timestamptz not null default now(),
  primary key (quest_id, mission_id),
  unique (quest_id, sequence_no)
);

create table if not exists public.omega_member_mission_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_id uuid not null references public.omega_missions(id) on delete restrict,
  status text not null default 'active' check (status in ('active','completed','failed','cancelled')),
  attempt_count integer not null default 1 check (attempt_count > 0),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  last_transition_at timestamptz not null default now(),
  unique (user_id, mission_id)
);

create table if not exists public.omega_member_quest_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quest_id uuid not null references public.omega_quests(id) on delete restrict,
  status text not null default 'active' check (status in ('active','completed','failed','cancelled')),
  current_mission_id uuid references public.omega_missions(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  failed_at timestamptz,
  last_transition_at timestamptz not null default now(),
  unique (user_id, quest_id)
);

create table if not exists public.omega_mission_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_mission_id uuid not null references public.omega_member_mission_state(id) on delete cascade,
  from_status text,
  to_status text not null check (to_status in ('active','completed','failed','cancelled')),
  event_id bigint references public.omega_platform_events(id) on delete set null,
  evidence_event_ids bigint[] not null default '{}'::bigint[],
  graph_evidence_ids uuid[] not null default '{}'::uuid[],
  idempotency_key text,
  reason text,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index if not exists omega_member_mission_state_user_idx
  on public.omega_member_mission_state(user_id, status);
create index if not exists omega_member_quest_state_user_idx
  on public.omega_member_quest_state(user_id, status);
create index if not exists omega_mission_transitions_user_idx
  on public.omega_mission_transitions(user_id, created_at desc);

alter table public.omega_missions enable row level security;
alter table public.omega_quests enable row level security;
alter table public.omega_quest_missions enable row level security;
alter table public.omega_member_mission_state enable row level security;
alter table public.omega_member_quest_state enable row level security;
alter table public.omega_mission_transitions enable row level security;

revoke all on table public.omega_missions, public.omega_quests, public.omega_quest_missions,
  public.omega_member_mission_state, public.omega_member_quest_state,
  public.omega_mission_transitions from anon, authenticated;

grant select on public.omega_missions, public.omega_quests, public.omega_quest_missions to authenticated;
grant select on public.omega_member_mission_state, public.omega_member_quest_state,
  public.omega_mission_transitions to authenticated;

create policy omega_missions_active_read on public.omega_missions
  for select to authenticated using (status = 'active');
create policy omega_quests_active_read on public.omega_quests
  for select to authenticated using (status = 'active');
create policy omega_quest_missions_active_read on public.omega_quest_missions
  for select to authenticated using (
    exists (select 1 from public.omega_quests q where q.id = quest_id and q.status = 'active')
  );
create policy omega_member_mission_state_own_read on public.omega_member_mission_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy omega_member_quest_state_own_read on public.omega_member_quest_state
  for select to authenticated using ((select auth.uid()) = user_id);
create policy omega_mission_transitions_own_read on public.omega_mission_transitions
  for select to authenticated using ((select auth.uid()) = user_id);

create or replace function private.omega_start_mission(
  p_mission_id uuid,
  p_idempotency_key text default null
)
returns public.omega_member_mission_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_mission public.omega_missions;
  v_state public.omega_member_mission_state;
  v_event_id bigint;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;
  select * into v_mission from public.omega_missions
    where id = p_mission_id and status = 'active';
  if not found then raise exception 'active mission not found' using errcode = 'P0002'; end if;

  if p_idempotency_key is not null and exists (
    select 1 from public.omega_mission_transitions
    where user_id = v_user_id and idempotency_key = p_idempotency_key
  ) then
    select * into v_state from public.omega_member_mission_state
      where user_id = v_user_id and mission_id = p_mission_id;
    return v_state;
  end if;

  select * into v_state from public.omega_member_mission_state
    where user_id = v_user_id and mission_id = p_mission_id for update;

  if found and v_state.status = 'completed' then return v_state; end if;
  if found and v_state.status = 'active' then return v_state; end if;

  if found then
    update public.omega_member_mission_state
      set status = 'active', attempt_count = v_state.attempt_count + 1,
          last_transition_at = now(), failed_at = null
      where id = v_state.id returning * into v_state;
  else
    insert into public.omega_member_mission_state(user_id, mission_id)
      values (v_user_id, p_mission_id) returning * into v_state;
  end if;

  insert into public.omega_platform_events(event_type, route, actor_user_id, metadata)
    values ('mission_progress','/missions.html',v_user_id,jsonb_build_object(
      'schema_version','1','mission_id',p_mission_id,'mission_key',v_mission.mission_key,
      'mission_version',v_mission.version,'state','active','idempotency_key',p_idempotency_key))
    returning id into v_event_id;

  insert into public.omega_mission_transitions(
    user_id, member_mission_id, from_status, to_status, event_id, idempotency_key, reason)
    values (v_user_id,v_state.id,null,'active',v_event_id,p_idempotency_key,'mission started');

  return v_state;
end;
$$;

create or replace function private.omega_complete_mission(
  p_member_mission_id uuid,
  p_evidence_event_ids bigint[] default '{}',
  p_graph_evidence_ids uuid[] default '{}',
  p_idempotency_key text default null
)
returns public.omega_member_mission_state
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_state public.omega_member_mission_state;
  v_mission public.omega_missions;
  v_event_id bigint;
  v_required jsonb;
  v_required_type text;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode = '42501'; end if;

  select * into v_state from public.omega_member_mission_state
    where id = p_member_mission_id and user_id = v_user_id for update;
  if not found then raise exception 'member mission state not found' using errcode = 'P0002'; end if;
  if v_state.status = 'completed' then return v_state; end if;
  if v_state.status <> 'active' then raise exception 'mission is not active' using errcode = '22023'; end if;

  select * into v_mission from public.omega_missions
    where id = v_state.mission_id and status = 'active';
  if not found then raise exception 'active mission definition not found' using errcode = 'P0002'; end if;

  if cardinality(coalesce(p_evidence_event_ids,'{}'::bigint[])) = 0
     and cardinality(coalesce(p_graph_evidence_ids,'{}'::uuid[])) = 0 then
    raise exception 'completion requires persisted evidence' using errcode = '22023';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_evidence_event_ids,'{}'::bigint[])) x(id)
    where not exists (
      select 1 from public.omega_platform_events e
      where e.id = x.id and e.actor_user_id = v_user_id
    )
  ) then
    raise exception 'evidence event is not owned by authenticated member' using errcode = '42501';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_graph_evidence_ids,'{}'::uuid[])) x(id)
    where not exists (
      select 1 from public.graph_evidence ge
      where ge.id = x.id and ge.user_id = v_user_id
    )
  ) then
    raise exception 'graph evidence is not owned by authenticated member' using errcode = '42501';
  end if;

  v_required := coalesce(v_mission.completion_rule -> 'required_event_types','[]'::jsonb);
  if jsonb_typeof(v_required) <> 'array' then
    raise exception 'mission completion_rule.required_event_types must be an array' using errcode = '22023';
  end if;

  for v_required_type in select jsonb_array_elements_text(v_required) loop
    if not exists (
      select 1 from public.omega_platform_events e
      where e.id = any(coalesce(p_evidence_event_ids,'{}'::bigint[]))
        and e.actor_user_id = v_user_id and e.event_type = v_required_type
    ) then
      raise exception 'required evidence event type is missing: %', v_required_type using errcode = '22023';
    end if;
  end loop;

  if p_idempotency_key is not null and exists (
    select 1 from public.omega_mission_transitions
    where user_id = v_user_id and idempotency_key = p_idempotency_key
  ) then
    return v_state;
  end if;

  insert into public.omega_platform_events(event_type, route, actor_user_id, metadata)
    values ('mission_progress','/missions.html',v_user_id,jsonb_build_object(
      'schema_version','1','mission_id',v_state.mission_id,'member_mission_id',v_state.id,
      'mission_key',v_mission.mission_key,'mission_version',v_mission.version,'state','completed',
      'evidence_event_ids',coalesce(to_jsonb(p_evidence_event_ids),'[]'::jsonb),
      'graph_evidence_ids',coalesce(to_jsonb(p_graph_evidence_ids),'[]'::jsonb),
      'idempotency_key',p_idempotency_key))
    returning id into v_event_id;

  update public.omega_member_mission_state
    set status='completed', completed_at=now(), last_transition_at=now()
    where id=v_state.id returning * into v_state;

  insert into public.omega_mission_transitions(
    user_id,member_mission_id,from_status,to_status,event_id,evidence_event_ids,
    graph_evidence_ids,idempotency_key,reason)
    values (v_user_id,v_state.id,'active','completed',v_event_id,
      coalesce(p_evidence_event_ids,'{}'::bigint[]),
      coalesce(p_graph_evidence_ids,'{}'::uuid[]),
      p_idempotency_key,'server-authoritative evidence-backed completion');

  return v_state;
end;
$$;

revoke execute on function private.omega_start_mission(uuid,text) from public, anon, authenticated;
revoke execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.omega_start_mission(uuid,text) to authenticated;
grant execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) to authenticated;