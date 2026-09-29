-- Ω SYD OMEGA 91717 — Living City mission/action bridge
-- One governed action event source; no second event store.
begin;

create or replace function public.omega_record_world_action(
  p_district text,
  p_action text,
  p_route text,
  p_idempotency_key text default null
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_id bigint;
  v_district text := lower(trim(coalesce(p_district,'')));
  v_action text := lower(trim(coalesce(p_action,'')));
  v_route text := trim(coalesce(p_route,''));
begin
  if v_user is null then
    raise exception 'authentication required' using errcode='42501';
  end if;

  if v_district not in (
    'genesis','intelligence','academy','citadel','exchange',
    'heritage','wellness','arena','void'
  ) then
    raise exception 'invalid district' using errcode='22023';
  end if;

  if v_action = '' or length(v_action) > 80 then
    raise exception 'invalid action' using errcode='22023';
  end if;

  if v_route !~ '^/[A-Za-z0-9_./?=&%-]{1,240}$' then
    raise exception 'invalid route' using errcode='22023';
  end if;

  if p_idempotency_key is not null and
     (length(p_idempotency_key) < 8 or length(p_idempotency_key) > 160) then
    raise exception 'invalid idempotency key' using errcode='22023';
  end if;

  if p_idempotency_key is not null then
    select e.id into v_id
    from public.omega_platform_events e
    where e.actor_user_id=v_user
      and e.event_type='action_started'
      and e.metadata->>'idempotency_key'=p_idempotency_key
    limit 1;
    if v_id is not null then return v_id; end if;
  end if;

  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata)
  values(
    'action_started',
    v_route,
    v_user,
    jsonb_build_object(
      'schema_version','1',
      'district',v_district,
      'action',v_action,
      'idempotency_key',p_idempotency_key
    )
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.omega_record_world_action(text,text,text,text) from public, anon;
grant execute on function public.omega_record_world_action(text,text,text,text) to authenticated;

-- Mission completion can now require event metadata as well as event type.
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
  v_required_meta jsonb;
  v_required_type text;
  v_meta jsonb;
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
      where e.id=x.id and e.actor_user_id=v_user_id
    )
  ) then
    raise exception 'evidence event is not owned by authenticated member' using errcode='42501';
  end if;

  if exists (
    select 1 from unnest(coalesce(p_graph_evidence_ids,'{}'::uuid[])) x(id)
    where not exists (
      select 1 from public.graph_evidence ge
      where ge.id=x.id and ge.user_id=v_user_id
    )
  ) then
    raise exception 'graph evidence is not owned by authenticated member' using errcode='42501';
  end if;

  v_required := coalesce(v_mission.completion_rule->'required_event_types','[]'::jsonb);
  if jsonb_typeof(v_required) <> 'array' then
    raise exception 'mission completion_rule.required_event_types must be an array' using errcode='22023';
  end if;

  v_required_meta := coalesce(v_mission.completion_rule->'required_event_metadata','{}'::jsonb);
  if jsonb_typeof(v_required_meta) <> 'object' then
    raise exception 'mission completion_rule.required_event_metadata must be an object' using errcode='22023';
  end if;

  for v_required_type in select jsonb_array_elements_text(v_required) loop
    if not exists (
      select 1
      from public.omega_platform_events e
      where e.id=any(coalesce(p_evidence_event_ids,'{}'::bigint[]))
        and e.actor_user_id=v_user_id
        and e.event_type=v_required_type
        and e.metadata @> v_required_meta
    ) then
      raise exception 'required evidence event is missing: %',v_required_type using errcode='22023';
    end if;
  end loop;

  if p_idempotency_key is not null and exists (
    select 1 from public.omega_mission_transitions
    where user_id=v_user_id and idempotency_key=p_idempotency_key
  ) then
    return v_state;
  end if;

  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata)
  values('mission_progress','/missions.html',v_user_id,jsonb_build_object(
    'schema_version','1','mission_id',v_state.mission_id,'member_mission_id',v_state.id,
    'mission_key',v_mission.mission_key,'mission_version',v_mission.version,'state','completed',
    'evidence_event_ids',coalesce(to_jsonb(p_evidence_event_ids),'[]'::jsonb),
    'graph_evidence_ids',coalesce(to_jsonb(p_graph_evidence_ids),'[]'::jsonb),
    'idempotency_key',p_idempotency_key
  )) returning id into v_event_id;

  update public.omega_member_mission_state
    set status='completed',completed_at=now(),last_transition_at=now()
    where id=v_state.id returning * into v_state;

  insert into public.omega_mission_transitions(
    user_id,member_mission_id,from_status,to_status,event_id,evidence_event_ids,
    graph_evidence_ids,idempotency_key,reason)
  values(v_user_id,v_state.id,'active','completed',v_event_id,
    coalesce(p_evidence_event_ids,'{}'::bigint[]),
    coalesce(p_graph_evidence_ids,'{}'::uuid[]),
    p_idempotency_key,'server-authoritative district action evidence');

  return v_state;
end;
$$;

revoke execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) from public,anon,authenticated;
grant execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) to authenticated;

insert into public.omega_missions(mission_key,version,title,description,status,completion_rule,max_attempts)
values
('city.genesis.enter',1,'ENTER THE GENESIS QUARTER','Enter the command district and perform a governed navigation action.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"genesis"}}',3),
('city.intelligence.investigate',1,'OPEN THE INTELLIGENCE HUB','Perform an investigation action inside the Intelligence Hub.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"intelligence"}}',3),
('city.academy.master',1,'BEGIN ACADEMY MASTERY','Perform a learning action inside the Academy Campus.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"academy"}}',3),
('city.citadel.create',1,'ENTER THE MEDIA CITADEL','Perform a cultural or creator action inside the Media Citadel.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"citadel"}}',3),
('city.exchange.trade',1,'VISIT THE SOVEREIGN EXCHANGE','Perform a commerce action inside the Sovereign Exchange.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"exchange"}}',3),
('city.heritage.connect',1,'WALK THE HERITAGE ARCHIVE','Perform a community or lineage action inside the Heritage Archive.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"heritage"}}',3),
('city.wellness.practice',1,'ENTER THE WELLNESS DISTRICT','Perform a sustainable routine action inside the Wellness District.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"wellness"}}',3),
('city.arena.compete',1,'ENTER THE GAME ARENA','Perform a competitive action inside the Game Arena.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"arena"}}',3),
('city.void.explore',1,'OPEN THE VOID OBSERVATORY','Perform an exploration action inside the Void Observatory.','active','{"required_event_types":["action_started"],"required_event_metadata":{"district":"void"}}',3)
on conflict(mission_key,version) do update
set title=excluded.title,description=excluded.description,status=excluded.status,
completion_rule=excluded.completion_rule,max_attempts=excluded.max_attempts,updated_at=now();

commit;
