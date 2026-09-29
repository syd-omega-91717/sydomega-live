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
  v_previous_status text;
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
    v_previous_status := v_state.status;
    update public.omega_member_mission_state
      set status='active', attempt_count=v_state.attempt_count+1,
          last_transition_at=now(), failed_at=null
      where id=v_state.id returning * into v_state;
  else
    v_previous_status := null;
    insert into public.omega_member_mission_state(user_id,mission_id)
      values (v_user_id,p_mission_id) returning * into v_state;
  end if;

  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata)
    values ('mission_progress','/missions.html',v_user_id,jsonb_build_object(
      'schema_version','1','mission_id',p_mission_id,'mission_key',v_mission.mission_key,
      'mission_version',v_mission.version,'state','active','idempotency_key',p_idempotency_key))
    returning id into v_event_id;

  insert into public.omega_mission_transitions(
    user_id,member_mission_id,from_status,to_status,event_id,idempotency_key,reason)
    values (v_user_id,v_state.id,v_previous_status,'active',v_event_id,p_idempotency_key,'mission started');

  return v_state;
end;
$$;

revoke execute on function private.omega_start_mission(uuid,text) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.omega_start_mission(uuid,text) to authenticated;