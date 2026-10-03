-- Ω SYD OMEGA 91717 — City mission reward bridge
-- Reuses the existing complete_task() authority/achievement engine.
begin;

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
  v_reward jsonb;
  v_reward_task text;
  v_reward_type text;
  v_reward_axis text;
  v_reward_points numeric;
  v_required_type text;
begin
  if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;

  select * into v_state from public.omega_member_mission_state
    where id=p_member_mission_id and user_id=v_user_id for update;
  if not found then raise exception 'member mission state not found' using errcode='P0002'; end if;
  if v_state.status='completed' then return v_state; end if;
  if v_state.status<>'active' then raise exception 'mission is not active' using errcode='22023'; end if;

  select * into v_mission from public.omega_missions
    where id=v_state.mission_id and status='active';
  if not found then raise exception 'active mission definition not found' using errcode='P0002'; end if;

  if cardinality(coalesce(p_evidence_event_ids,'{}'::bigint[]))=0
     and cardinality(coalesce(p_graph_evidence_ids,'{}'::uuid[]))=0 then
    raise exception 'completion requires persisted evidence' using errcode='22023';
  end if;

  if exists(select 1 from unnest(coalesce(p_evidence_event_ids,'{}'::bigint[])) x(id)
    where not exists(select 1 from public.omega_platform_events e
      where e.id=x.id and e.actor_user_id=v_user_id)) then
    raise exception 'evidence event is not owned by authenticated member' using errcode='42501';
  end if;

  if exists(select 1 from unnest(coalesce(p_graph_evidence_ids,'{}'::uuid[])) x(id)
    where not exists(select 1 from public.graph_evidence ge
      where ge.id=x.id and ge.user_id=v_user_id)) then
    raise exception 'graph evidence is not owned by authenticated member' using errcode='42501';
  end if;

  v_required:=coalesce(v_mission.completion_rule->'required_event_types','[]'::jsonb);
  if jsonb_typeof(v_required)<>'array' then
    raise exception 'mission completion_rule.required_event_types must be an array' using errcode='22023';
  end if;

  v_required_meta:=coalesce(v_mission.completion_rule->'required_event_metadata','{}'::jsonb);
  if jsonb_typeof(v_required_meta)<>'object' then
    raise exception 'mission completion_rule.required_event_metadata must be an object' using errcode='22023';
  end if;

  for v_required_type in select jsonb_array_elements_text(v_required) loop
    if not exists(select 1 from public.omega_platform_events e
      where e.id=any(coalesce(p_evidence_event_ids,'{}'::bigint[]))
        and e.actor_user_id=v_user_id
        and e.event_type=v_required_type
        and e.metadata @> v_required_meta) then
      raise exception 'required evidence event is missing: %',v_required_type using errcode='22023';
    end if;
  end loop;

  v_reward:=coalesce(v_mission.completion_rule->'reward','{}'::jsonb);
  v_reward_task:=nullif(v_reward->>'task_name','');
  v_reward_type:=coalesce(nullif(v_reward->>'task_type',''),'world');
  v_reward_axis:=lower(coalesce(nullif(v_reward->>'axis',''),'a'));
  v_reward_points:=coalesce((v_reward->>'points')::numeric,0.1);

  if v_reward_task is null then
    raise exception 'mission reward.task_name is required' using errcode='22023';
  end if;
  if v_reward_axis not in ('a','b','c') then
    raise exception 'mission reward.axis must be a, b, or c' using errcode='22023';
  end if;
  if v_reward_points <= 0 or v_reward_points > 1 then
    raise exception 'mission reward.points must be > 0 and <= 1' using errcode='22023';
  end if;

  if p_idempotency_key is not null and exists(
    select 1 from public.omega_mission_transitions
    where user_id=v_user_id and idempotency_key=p_idempotency_key) then
    return v_state;
  end if;

  -- Existing authoritative progression engine. This writes task_completions,
  -- updates axis/authority, and unlocks the existing achievement tables.
  if not coalesce((private.complete_task(
    v_reward_task,v_reward_type,v_reward_axis,
    'Living City mission: '||v_mission.title,v_reward_points
  )->>'applied')::boolean,false) then
    raise exception 'mission reward was not applied' using errcode='22023';
  end if;

  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata)
  values('mission_progress','/missions.html',v_user_id,jsonb_build_object(
    'schema_version','1',
    'mission_id',v_state.mission_id,
    'member_mission_id',v_state.id,
    'mission_key',v_mission.mission_key,
    'mission_version',v_mission.version,
    'state','completed',
    'reward',v_reward,
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
    p_idempotency_key,'server-authoritative evidence-backed mission reward');

  return v_state;
end;
$$;

revoke execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) from public,anon,authenticated;
grant execute on function private.omega_complete_mission(uuid,bigint[],uuid[],text) to authenticated;

update public.omega_missions
set completion_rule=jsonb_set(
  completion_rule,'{reward}',
  jsonb_build_object(
    'task_name',mission_key,
    'task_type','world',
    'axis',case
      when mission_key in ('city.genesis.enter','city.intelligence.investigate','city.academy.master') then 'a'
      when mission_key in ('city.citadel.create','city.arena.compete','city.void.explore') then 'b'
      else 'c'
    end,
    'points',0.1
  ),true),
updated_at=now()
where mission_key like 'city.%' and version=1;

commit;
