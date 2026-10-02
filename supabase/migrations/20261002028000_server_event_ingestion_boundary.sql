-- SYD OMEGA 91717
-- Server-only runtime event ingestion boundary.
begin;

create or replace function omega_private.record_platform_event(
  p_event_type text,
  p_actor_user_id uuid,
  p_actor_type text,
  p_source text,
  p_idempotency_key text,
  p_correlation_id uuid default null,
  p_entity_type text default null,
  p_entity_id text default null,
  p_payload jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare v_id uuid;
begin
  if p_event_type not in (
    'route_view','action_started','action_completed','mission_progress',
    'capability_used','simulation_run','evidence_recorded','replay_checkpoint'
  ) then raise exception 'event_type_not_allowed'; end if;

  if p_actor_type not in ('user','agent','system','service') then
    raise exception 'actor_type_not_allowed';
  end if;

  insert into public.omega_platform_events(
    event_type,actor_user_id,actor_type,correlation_id,idempotency_key,
    source,entity_type,entity_id,payload
  )
  values(
    p_event_type,p_actor_user_id,p_actor_type,p_correlation_id,p_idempotency_key,
    p_source,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb)
  )
  on conflict(idempotency_key) do update set payload=excluded.payload
  returning event_id into v_id;

  insert into public.omega_audit_log(
    actor_user_id,actor_type,action,resource_type,resource_id,outcome,
    correlation_id,idempotency_key,details
  )
  values(
    p_actor_user_id,p_actor_type,p_event_type,p_entity_type,p_entity_id,'success',
    p_correlation_id,'audit:'||p_idempotency_key,
    jsonb_build_object('source',p_source)
  );

  return v_id;
end $$;

revoke all on function omega_private.record_platform_event(
  text,uuid,text,text,text,uuid,text,text,jsonb
) from public,anon,authenticated;
grant execute on function omega_private.record_platform_event(
  text,uuid,text,text,text,uuid,text,text,jsonb
) to service_role;

commit;
