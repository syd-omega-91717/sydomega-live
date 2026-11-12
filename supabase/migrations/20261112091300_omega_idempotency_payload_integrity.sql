-- Follow-up hardening for the already-applied 20261111190000 runtime reconciliation.
-- Do not edit the historical migration; this version enforces immutable idempotency payloads.
begin;

create or replace function omega_private.create_service_order(
  p_user_id uuid,p_service_id text,p_idempotency_key text,p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_order_id uuid;
begin
  if p_user_id is null then raise exception 'user_required'; end if;
  if p_service_id is null or pg_catalog.length(pg_catalog.btrim(p_service_id)) < 2 then raise exception 'service_required'; end if;
  if p_idempotency_key is null or pg_catalog.length(pg_catalog.btrim(p_idempotency_key)) < 8 or pg_catalog.length(p_idempotency_key)>128 then raise exception 'idempotency_key_invalid'; end if;
  if not exists (select 1 from auth.users where id=p_user_id) then raise exception 'user_not_found'; end if;
  if not exists (
    select 1 from public.omega_services
    where service_id=pg_catalog.btrim(p_service_id)
      and status in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED')
  ) then
    raise exception 'service_not_orderable';
  end if;
  insert into public.omega_service_orders(service_id,user_id,status,idempotency_key,metadata)
  values(pg_catalog.btrim(p_service_id),p_user_id,'PENDING',pg_catalog.btrim(p_idempotency_key),coalesce(p_metadata,'{}'::jsonb))
  on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null
  do update set idempotency_key=excluded.idempotency_key
    where omega_service_orders.service_id=excluded.service_id
      and omega_service_orders.metadata=excluded.metadata
  returning order_id into v_order_id;
  if v_order_id is null then raise exception 'service_order_idempotency_conflict'; end if;
  return v_order_id;
end;
$function$;

create or replace function omega_private.create_consult_intake(
  p_user_id uuid,p_domain text,p_message text,p_idempotency_key text,
  p_urgency text default 'normal',p_preferred_time text default null,
  p_confidentiality_accepted boolean default false,p_contact text default null
) returns bigint language plpgsql security definer set search_path='' as $$
declare v_id bigint;
begin
 if p_user_id is null then raise exception 'user_required'; end if;
 if not exists (select 1 from auth.users where id=p_user_id) then raise exception 'user_not_found'; end if;
 if p_domain is null or pg_catalog.length(pg_catalog.btrim(p_domain)) < 2 then raise exception 'domain_required'; end if;
 if p_message is null or pg_catalog.length(pg_catalog.btrim(p_message)) < 10 or pg_catalog.length(p_message)>10000 then raise exception 'message_length_invalid'; end if;
 if p_idempotency_key is null or pg_catalog.length(pg_catalog.btrim(p_idempotency_key)) < 8 or pg_catalog.length(p_idempotency_key)>128 then raise exception 'idempotency_key_invalid'; end if;
 if not p_confidentiality_accepted then raise exception 'confidentiality_acceptance_required'; end if;
 insert into public.consult_requests(user_id,domain,message,status,created_at,urgency,contact,preferred_time,confidentiality_accepted,runtime_idempotency_key)
 values(p_user_id,pg_catalog.left(pg_catalog.btrim(p_domain),120),pg_catalog.left(pg_catalog.btrim(p_message),10000),'pending',pg_catalog.now(),pg_catalog.left(coalesce(nullif(pg_catalog.btrim(p_urgency),''),'normal'),40),pg_catalog.left(nullif(pg_catalog.btrim(p_contact),''),240),pg_catalog.left(nullif(pg_catalog.btrim(p_preferred_time),''),240),true,pg_catalog.btrim(p_idempotency_key))
 on conflict (user_id,runtime_idempotency_key) where runtime_idempotency_key is not null
 do update set runtime_idempotency_key=excluded.runtime_idempotency_key
   where consult_requests.domain=excluded.domain
     and consult_requests.message=excluded.message
     and consult_requests.urgency is not distinct from excluded.urgency
     and consult_requests.contact is not distinct from excluded.contact
     and consult_requests.preferred_time is not distinct from excluded.preferred_time
     and consult_requests.confidentiality_accepted=excluded.confidentiality_accepted
 returning id into v_id;
 if v_id is null then raise exception 'consult_intake_idempotency_conflict'; end if;
end;
$$;

create or replace function omega_private.enqueue_agent_task(
  p_user_id uuid,p_agent_id text,p_task_type text,p_input jsonb,p_idempotency_key text,p_approval_required boolean default true
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_inserted boolean;
begin
  if p_agent_id is null or pg_catalog.btrim(p_agent_id)='' then raise exception 'agent_required'; end if;
  if p_task_type is null or pg_catalog.btrim(p_task_type)='' then raise exception 'task_type_required'; end if;
  if p_idempotency_key is null or pg_catalog.length(pg_catalog.btrim(p_idempotency_key))<8 or pg_catalog.length(p_idempotency_key)>128 then raise exception 'idempotency_key_invalid'; end if;
  if p_user_id is not null and not exists(select 1 from auth.users where id=p_user_id) then raise exception 'user_not_found'; end if;
  if not exists(select 1 from public.omega_agents where agent_id=p_agent_id) then raise exception 'unknown_agent'; end if;

  if p_user_id is null then
    insert into public.omega_agent_tasks(user_id,agent_id,task_type,input,idempotency_key,approval_required,requested_by)
    values(null,p_agent_id,p_task_type,coalesce(p_input,'{}'::jsonb),pg_catalog.btrim(p_idempotency_key),p_approval_required,'system')
    on conflict (idempotency_key) where user_id is null and idempotency_key is not null
    do update set input=omega_agent_tasks.input
      where omega_agent_tasks.agent_id=excluded.agent_id
        and omega_agent_tasks.task_type=excluded.task_type
        and omega_agent_tasks.input=excluded.input
        and omega_agent_tasks.approval_required=excluded.approval_required
        and omega_agent_tasks.requested_by=excluded.requested_by
    returning task_id,(xmax=0) into v_id,v_inserted;
  else
    insert into public.omega_agent_tasks(user_id,agent_id,task_type,input,idempotency_key,approval_required,requested_by)
    values(p_user_id,p_agent_id,p_task_type,coalesce(p_input,'{}'::jsonb),pg_catalog.btrim(p_idempotency_key),p_approval_required,'user')
    on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null
    do update set input=omega_agent_tasks.input
      where omega_agent_tasks.agent_id=excluded.agent_id
        and omega_agent_tasks.task_type=excluded.task_type
        and omega_agent_tasks.input=excluded.input
        and omega_agent_tasks.approval_required=excluded.approval_required
        and omega_agent_tasks.requested_by=excluded.requested_by
    returning task_id,(xmax=0) into v_id,v_inserted;
  end if;

  if v_id is null then raise exception 'agent_task_idempotency_conflict'; end if;
  if v_inserted then
    insert into public.omega_agent_task_events(task_id,event_type,actor,payload)
    values(v_id,'task_queued','system',pg_catalog.jsonb_build_object('agent_id',p_agent_id,'approval_required',p_approval_required));
  end if;
  return v_id;
end;
$function$;

create or replace function omega_private.enqueue_notification(
  p_user_id uuid,p_type text,p_title text,p_body text,p_channel text,p_idempotency_key text,p_metadata jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid;
begin
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then raise exception 'notification_user_required'; end if;
  if p_channel not in ('in_app','email','sms','push') then raise exception 'invalid_channel'; end if;
  if p_idempotency_key is null or pg_catalog.length(pg_catalog.btrim(p_idempotency_key))<8 or pg_catalog.length(p_idempotency_key)>128 then raise exception 'idempotency_key_invalid'; end if;
  insert into public.omega_notifications(user_id,notification_type,title,body,channel,idempotency_key,metadata)
  values(p_user_id,p_type,p_title,p_body,p_channel,pg_catalog.btrim(p_idempotency_key),coalesce(p_metadata,'{}'::jsonb))
  on conflict (user_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key
    where omega_notifications.notification_type=excluded.notification_type
      and omega_notifications.title=excluded.title
      and omega_notifications.body=excluded.body
      and omega_notifications.channel=excluded.channel
      and omega_notifications.metadata=excluded.metadata
  returning notification_id into v_id;
  if v_id is null then raise exception 'notification_idempotency_conflict'; end if;
  return v_id;
end;
$function$;

create or replace function omega_private.record_platform_event(
  p_event_type text,p_actor_user_id uuid,p_actor_type text,p_source text,p_idempotency_key text,
  p_correlation_id uuid default null,p_entity_type text default null,p_entity_id text default null,p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_audit_rows integer; v_key text:=nullif(pg_catalog.btrim(coalesce(p_idempotency_key,'')),''); v_audit_key text;
begin
  if v_key is not null and pg_catalog.length(v_key)>122 then raise exception 'idempotency_key_too_long_for_audit_pair'; end if;
  v_audit_key:=case when v_key is null then null else 'audit:'||v_key end;
  if p_event_type not in ('route_view','action_started','action_completed','mission_progress','capability_used','simulation_run','evidence_recorded','replay_checkpoint') then
    raise exception 'event_type_not_allowed';
  end if;
  if p_actor_type not in ('user','agent','system','service') then raise exception 'actor_type_not_allowed'; end if;

  if p_actor_user_id is null then
    insert into public.omega_platform_events(event_type,actor_user_id,actor_type,correlation_id,idempotency_key,source,entity_type,entity_id,payload)
    values(p_event_type,null,p_actor_type,p_correlation_id,v_key,p_source,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb))
    on conflict (idempotency_key) where actor_user_id is null and idempotency_key is not null
    do update set idempotency_key=excluded.idempotency_key
      where omega_platform_events.event_type=excluded.event_type
        and omega_platform_events.actor_type is not distinct from excluded.actor_type
        and omega_platform_events.correlation_id is not distinct from excluded.correlation_id
        and omega_platform_events.source is not distinct from excluded.source
        and omega_platform_events.entity_type is not distinct from excluded.entity_type
        and omega_platform_events.entity_id is not distinct from excluded.entity_id
        and omega_platform_events.payload is not distinct from excluded.payload
    returning event_id into v_id;
    if v_id is null then raise exception 'platform_event_idempotency_conflict'; end if;

    insert into public.omega_audit_log(actor_user_id,actor_type,action,resource_type,resource_id,outcome,correlation_id,idempotency_key,details)
    values(null,p_actor_type,p_event_type,p_entity_type,p_entity_id,'success',p_correlation_id,v_audit_key,pg_catalog.jsonb_build_object('source',p_source))
    on conflict (idempotency_key) where actor_user_id is null and idempotency_key is not null
    do update set idempotency_key=excluded.idempotency_key
      where omega_audit_log.actor_type=excluded.actor_type
        and omega_audit_log.action=excluded.action
        and omega_audit_log.resource_type is not distinct from excluded.resource_type
        and omega_audit_log.resource_id is not distinct from excluded.resource_id
        and omega_audit_log.outcome=excluded.outcome
        and omega_audit_log.correlation_id is not distinct from excluded.correlation_id
        and omega_audit_log.details=excluded.details;
    get diagnostics v_audit_rows=row_count;
    if v_audit_rows=0 then raise exception 'platform_event_audit_idempotency_conflict'; end if;
  else
    insert into public.omega_platform_events(event_type,actor_user_id,actor_type,correlation_id,idempotency_key,source,entity_type,entity_id,payload)
    values(p_event_type,p_actor_user_id,p_actor_type,p_correlation_id,v_key,p_source,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb))
    on conflict (actor_user_id,idempotency_key) where actor_user_id is not null and idempotency_key is not null
    do update set idempotency_key=excluded.idempotency_key
      where omega_platform_events.event_type=excluded.event_type
        and omega_platform_events.actor_type is not distinct from excluded.actor_type
        and omega_platform_events.correlation_id is not distinct from excluded.correlation_id
        and omega_platform_events.source is not distinct from excluded.source
        and omega_platform_events.entity_type is not distinct from excluded.entity_type
        and omega_platform_events.entity_id is not distinct from excluded.entity_id
        and omega_platform_events.payload is not distinct from excluded.payload
    returning event_id into v_id;
    if v_id is null then raise exception 'platform_event_idempotency_conflict'; end if;

    insert into public.omega_audit_log(actor_user_id,actor_type,action,resource_type,resource_id,outcome,correlation_id,idempotency_key,details)
    values(p_actor_user_id,p_actor_type,p_event_type,p_entity_type,p_entity_id,'success',p_correlation_id,v_audit_key,pg_catalog.jsonb_build_object('source',p_source))
    on conflict (actor_user_id,idempotency_key) where actor_user_id is not null and idempotency_key is not null
    do update set idempotency_key=excluded.idempotency_key
      where omega_audit_log.actor_type=excluded.actor_type
        and omega_audit_log.action=excluded.action
        and omega_audit_log.resource_type is not distinct from excluded.resource_type
        and omega_audit_log.resource_id is not distinct from excluded.resource_id
        and omega_audit_log.outcome=excluded.outcome
        and omega_audit_log.correlation_id is not distinct from excluded.correlation_id
        and omega_audit_log.details=excluded.details;
    get diagnostics v_audit_rows=row_count;
    if v_audit_rows=0 then raise exception 'platform_event_audit_idempotency_conflict'; end if;
  end if;
  return v_id;
end;
$function$;

create or replace function omega_private.verify_achievement(
  p_user_achievement_id uuid,p_decision text,p_verifier text,p_verification_type text,p_evidence jsonb,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_existing_decision text; v_existing_type text; v_existing_verifier text; v_existing_evidence jsonb; v_user uuid; v_key text:=pg_catalog.btrim(coalesce(p_idempotency_key,''));
begin
  if p_user_achievement_id is null then raise exception 'achievement_assignment_required'; end if;
  if p_decision not in ('approved','rejected','needs_review') then raise exception 'invalid_decision'; end if;
  if v_key='' or pg_catalog.length(v_key)>128 then raise exception 'verification_idempotency_key_required'; end if;
  if p_verifier is null or pg_catalog.btrim(p_verifier)='' then raise exception 'verifier_required'; end if;
  if p_verification_type is null or pg_catalog.btrim(p_verification_type)='' then raise exception 'verification_type_required'; end if;
  if p_decision='approved' and (p_evidence is null or p_evidence='{}'::jsonb or p_evidence='null'::jsonb) then raise exception 'approved_verification_requires_evidence'; end if;

  select user_id into v_user from public.omega_user_achievements where user_achievement_id=p_user_achievement_id for update;
  if v_user is null then raise exception 'achievement_assignment_not_found'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_achievement_id::text||':'||v_key,0));

  select verification_id,decision,verification_type,verifier,evidence
    into v_id,v_existing_decision,v_existing_type,v_existing_verifier,v_existing_evidence
  from public.omega_achievement_verifications
  where user_achievement_id=p_user_achievement_id and idempotency_key=v_key;
  if v_id is not null then
    if v_existing_decision is distinct from p_decision
       or v_existing_type is distinct from p_verification_type
       or v_existing_verifier is distinct from p_verifier
       or v_existing_evidence is distinct from coalesce(p_evidence,'{}'::jsonb) then
      raise exception 'verification_idempotency_conflict';
    end if;
    return v_id;
  end if;

  insert into public.omega_achievement_verifications(user_achievement_id,verification_type,verifier,evidence,decision,idempotency_key)
  values(p_user_achievement_id,p_verification_type,p_verifier,coalesce(p_evidence,'{}'::jsonb),p_decision,v_key)
  on conflict (user_achievement_id,idempotency_key) do nothing
  returning verification_id into v_id;

  if v_id is null then
    select verification_id,decision,verification_type,verifier,evidence
      into v_id,v_existing_decision,v_existing_type,v_existing_verifier,v_existing_evidence
    from public.omega_achievement_verifications
    where user_achievement_id=p_user_achievement_id and idempotency_key=v_key;
    if v_id is null
       or v_existing_decision is distinct from p_decision
       or v_existing_type is distinct from p_verification_type
       or v_existing_verifier is distinct from p_verifier
       or v_existing_evidence is distinct from coalesce(p_evidence,'{}'::jsonb) then
      raise exception 'verification_idempotency_conflict';
    end if;
    return v_id;
  end if;

  update public.omega_user_achievements
  set status=case when p_decision='approved' then 'verified' when p_decision='rejected' then 'revoked' else 'pending' end,
      evidence_ref=coalesce(evidence_ref,v_key),
      verified_at=case when p_decision='approved' then coalesce(verified_at,pg_catalog.now()) else verified_at end
  where user_achievement_id=p_user_achievement_id;

  if p_decision='approved' then perform omega_private.issue_certificate(p_user_achievement_id); end if;
  return v_id;
end;
$function$;

create or replace function private.record_sovereign_event(
  p_event_type text,p_event_data jsonb default '{}'::jsonb,
  p_axis_delta jsonb default '{"a":0,"b":0,"c":0}'::jsonb,p_idempotency text default null
) returns jsonb language plpgsql security definer set search_path='' as $function$
declare
  _uid uuid:=auth.uid();
  _pr record;
  _auth_before numeric(10,4);
  _auth_after numeric(10,4);
  _phi constant numeric:=1.6180339887;
  _eu constant numeric:=2.7182818285;
  _key text:=nullif(pg_catalog.btrim(coalesce(p_idempotency,'')),'');
  _existing_type text;
  _existing_data jsonb;
  _existing_delta jsonb;
  _rows integer;
begin
  if _uid is null then return pg_catalog.jsonb_build_object('ok',false,'error','unauthenticated'); end if;
  if _key is not null then
    if pg_catalog.length(_key)>128 then raise exception 'sovereign_event_idempotency_key_too_long'; end if;
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(_uid::text||':'||_key,0));
    select event_type,event_data,axis_delta into _existing_type,_existing_data,_existing_delta
      from public.sovereign_events where user_id=_uid and idempotency_key=_key;
    if found then
      if _existing_type is distinct from p_event_type
         or _existing_data is distinct from coalesce(p_event_data,'{}'::jsonb)
         or _existing_delta is distinct from coalesce(p_axis_delta,'{"a":0,"b":0,"c":0}'::jsonb) then
        raise exception 'sovereign_event_idempotency_conflict';
      end if;
      return pg_catalog.jsonb_build_object('ok',true,'status','duplicate','idempotent',true);
    end if;
  end if;

  select axis_a,axis_b,axis_c into _pr from public.profiles where id=_uid for update;
  if not found then return pg_catalog.jsonb_build_object('ok',false,'error','profile_not_found'); end if;
  _auth_before:=pg_catalog.sqrt(pg_catalog.power(_pr.axis_a,3)+pg_catalog.power(_pr.axis_b,3)+pg_catalog.power(_pr.axis_c,3))*_phi/_eu;

  update public.profiles set
    axis_a=least(9.000,greatest(0.001,axis_a+coalesce((p_axis_delta->>'a')::numeric,0))),
    axis_b=least(9.000,greatest(0.001,axis_b+coalesce((p_axis_delta->>'b')::numeric,0))),
    axis_c=least(9.000,greatest(0.001,axis_c+coalesce((p_axis_delta->>'c')::numeric,0)))
  where id=_uid;

  select axis_a,axis_b,axis_c into _pr from public.profiles where id=_uid;
  _auth_after:=pg_catalog.sqrt(pg_catalog.power(_pr.axis_a,3)+pg_catalog.power(_pr.axis_b,3)+pg_catalog.power(_pr.axis_c,3))*_phi/_eu;

  insert into public.sovereign_events(user_id,event_type,event_data,axis_delta,auth_before,auth_after,idempotency_key)
  values(_uid,p_event_type,coalesce(p_event_data,'{}'::jsonb),coalesce(p_axis_delta,'{"a":0,"b":0,"c":0}'::jsonb),_auth_before,_auth_after,_key)
  on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null do nothing;
  get diagnostics _rows=row_count;
  if _rows=0 then raise exception 'sovereign_event_idempotency_race'; end if;

  return pg_catalog.jsonb_build_object('ok',true,'auth_before',_auth_before,'auth_after',_auth_after,'delta',_auth_after-_auth_before);
end;
$function$;


revoke all on function omega_private.create_service_order(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function omega_private.create_service_order(uuid,text,text,jsonb) to service_role;
revoke all on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) to service_role;
revoke all on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean) from public,anon,authenticated;
grant execute on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean) to service_role;
revoke all on function omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb) to service_role;
revoke all on function omega_private.record_platform_event(text,uuid,text,text,text,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function omega_private.record_platform_event(text,uuid,text,text,text,uuid,text,text,jsonb) to service_role;
revoke all on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text) to service_role;
revoke all on function private.record_sovereign_event(text,jsonb,jsonb,text) from public,anon;
grant execute on function private.record_sovereign_event(text,jsonb,jsonb,text) to authenticated;

do $$
begin
  if has_function_privilege('anon','omega_private.create_service_order(uuid,text,text,jsonb)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.create_service_order(uuid,text,text,jsonb)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.create_service_order(uuid,text,text,jsonb)','EXECUTE') then
    raise exception 'service_order_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text)','EXECUTE') then
    raise exception 'consultancy_intake_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean)','EXECUTE') then
    raise exception 'agent_task_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb)','EXECUTE') then
    raise exception 'notification_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','omega_private.record_platform_event(text,uuid,text,text,text,uuid,text,text,jsonb)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.record_platform_event(text,uuid,text,text,text,uuid,text,text,jsonb)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.record_platform_event(text,uuid,text,text,text,uuid,text,text,jsonb)','EXECUTE') then
    raise exception 'platform_event_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','omega_private.verify_achievement(uuid,text,text,text,jsonb,text)','EXECUTE')
     or has_function_privilege('authenticated','omega_private.verify_achievement(uuid,text,text,text,jsonb,text)','EXECUTE')
     or not has_function_privilege('service_role','omega_private.verify_achievement(uuid,text,text,text,jsonb,text)','EXECUTE') then
    raise exception 'achievement_verification_helper_acl_invalid';
  end if;
  if has_function_privilege('anon','private.record_sovereign_event(text,jsonb,jsonb,text)','EXECUTE')
     or not has_function_privilege('authenticated','private.record_sovereign_event(text,jsonb,jsonb,text)','EXECUTE') then
    raise exception 'sovereign_event_authenticated_acl_invalid';
  end if;
end;
$$;


commit;
