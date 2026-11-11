-- Reconcile the live runtime dispatcher with all 54 canonical module actions.
-- The live provider function had drifted behind the applied migration ledger.
-- Restore the full module adapter set and add the wave-3 handlers.
-- Member-owned reads are scoped to p_actor_user_id. Financial execution and
-- asset mutation remain outside this dispatcher.
begin;

drop index if exists public.consult_requests_runtime_idempotency_uidx;
create unique index consult_requests_runtime_idempotency_uidx
  on public.consult_requests(user_id,runtime_idempotency_key)
  where runtime_idempotency_key is not null;

alter table public.omega_service_orders
  drop constraint if exists omega_service_orders_idempotency_key_key;
alter table public.omega_service_orders
  drop constraint if exists omega_service_orders_user_idempotency_key_key;
drop index if exists public.omega_service_orders_user_idempotency_uidx;
drop index if exists public.omega_service_orders_system_idempotency_uidx;
create unique index omega_service_orders_user_idempotency_uidx
  on public.omega_service_orders(user_id,idempotency_key)
  where user_id is not null and idempotency_key is not null;
create unique index omega_service_orders_system_idempotency_uidx
  on public.omega_service_orders(idempotency_key)
  where user_id is null and idempotency_key is not null;

alter table public.omega_agent_tasks
  drop constraint if exists omega_agent_tasks_idempotency_key_key;
drop index if exists public.omega_agent_tasks_user_idempotency_uidx;
drop index if exists public.omega_agent_tasks_system_idempotency_uidx;
create unique index omega_agent_tasks_user_idempotency_uidx
  on public.omega_agent_tasks(user_id,idempotency_key)
  where user_id is not null and idempotency_key is not null;
create unique index omega_agent_tasks_system_idempotency_uidx
  on public.omega_agent_tasks(idempotency_key)
  where user_id is null and idempotency_key is not null;

alter table public.omega_notifications
  drop constraint if exists omega_notifications_idempotency_key_key;
alter table public.omega_notifications
  drop constraint if exists omega_notifications_user_idempotency_key_key;
alter table public.omega_notifications
  add constraint omega_notifications_user_idempotency_key_key
  unique (user_id,idempotency_key);

alter table public.sovereign_events
  drop constraint if exists sovereign_events_idempotency_key_key;
drop index if exists public.sovereign_events_user_idempotency_uidx;
drop index if exists public.sovereign_events_system_idempotency_uidx;
create unique index sovereign_events_user_idempotency_uidx
  on public.sovereign_events(user_id,idempotency_key)
  where user_id is not null and idempotency_key is not null;
create unique index sovereign_events_system_idempotency_uidx
  on public.sovereign_events(idempotency_key)
  where user_id is null and idempotency_key is not null;

alter table public.omega_achievement_verifications
  drop constraint if exists omega_achievement_verifications_idempotency_key_key;
alter table public.omega_achievement_verifications
  drop constraint if exists omega_achievement_verifications_subject_idempotency_key_key;
alter table public.omega_achievement_verifications
  add constraint omega_achievement_verifications_subject_idempotency_key_key
  unique (user_achievement_id,idempotency_key);

drop index if exists public.omega_platform_events_idempotency_uidx;
drop index if exists public.omega_platform_events_actor_idempotency_uidx;
drop index if exists public.omega_platform_events_system_idempotency_uidx;
create unique index omega_platform_events_actor_idempotency_uidx
  on public.omega_platform_events(actor_user_id,idempotency_key)
  where actor_user_id is not null and idempotency_key is not null;
create unique index omega_platform_events_system_idempotency_uidx
  on public.omega_platform_events(idempotency_key)
  where actor_user_id is null and idempotency_key is not null;

alter table public.omega_audit_log
  drop constraint if exists omega_audit_log_idempotency_key_key;
drop index if exists public.omega_audit_log_actor_idempotency_uidx;
drop index if exists public.omega_audit_log_system_idempotency_uidx;
create unique index omega_audit_log_actor_idempotency_uidx
  on public.omega_audit_log(actor_user_id,idempotency_key)
  where actor_user_id is not null and idempotency_key is not null;
create unique index omega_audit_log_system_idempotency_uidx
  on public.omega_audit_log(idempotency_key)
  where actor_user_id is null and idempotency_key is not null;

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
  returning order_id into v_order_id;
  return v_order_id;
end;
$function$;
revoke all on function omega_private.create_service_order(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function omega_private.create_service_order(uuid,text,text,jsonb) to service_role;

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
 returning id into v_id;
 return v_id;
end;
$$;
revoke all on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) to service_role;

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
    on conflict (idempotency_key) where user_id is null and idempotency_key is not null do update set input=excluded.input
    returning task_id,(xmax=0) into v_id,v_inserted;
  else
    insert into public.omega_agent_tasks(user_id,agent_id,task_type,input,idempotency_key,approval_required,requested_by)
    values(p_user_id,p_agent_id,p_task_type,coalesce(p_input,'{}'::jsonb),pg_catalog.btrim(p_idempotency_key),p_approval_required,'user')
    on conflict (user_id,idempotency_key) where user_id is not null and idempotency_key is not null do update set input=excluded.input
    returning task_id,(xmax=0) into v_id,v_inserted;
  end if;

  if v_id is null then raise exception 'agent_task_idempotency_resolution_failed'; end if;
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
  on conflict (user_id,idempotency_key) do update set metadata=excluded.metadata
  returning notification_id into v_id;
  return v_id;
end;
$function$;

create or replace function omega_private.record_platform_event(
  p_event_type text,p_actor_user_id uuid,p_actor_type text,p_source text,p_idempotency_key text,
  p_correlation_id uuid default null,p_entity_type text default null,p_entity_id text default null,p_payload jsonb default '{}'::jsonb
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_key text:=nullif(pg_catalog.btrim(coalesce(p_idempotency_key,'')),''); v_audit_key text;
begin
  if v_key is not null and pg_catalog.length(v_key)>128 then raise exception 'idempotency_key_too_long'; end if;
  v_audit_key:=case when v_key is null then null else 'audit:'||v_key end;
  if p_event_type not in ('route_view','action_started','action_completed','mission_progress','capability_used','simulation_run','evidence_recorded','replay_checkpoint') then
    raise exception 'event_type_not_allowed';
  end if;
  if p_actor_type not in ('user','agent','system','service') then raise exception 'actor_type_not_allowed'; end if;

  if p_actor_user_id is null then
    insert into public.omega_platform_events(event_type,actor_user_id,actor_type,correlation_id,idempotency_key,source,entity_type,entity_id,payload)
    values(p_event_type,null,p_actor_type,p_correlation_id,v_key,p_source,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb))
    on conflict (idempotency_key) where actor_user_id is null and idempotency_key is not null
    do update set payload=excluded.payload
    returning event_id into v_id;

    insert into public.omega_audit_log(actor_user_id,actor_type,action,resource_type,resource_id,outcome,correlation_id,idempotency_key,details)
    values(null,p_actor_type,p_event_type,p_entity_type,p_entity_id,'success',p_correlation_id,v_audit_key,pg_catalog.jsonb_build_object('source',p_source))
    on conflict (idempotency_key) where actor_user_id is null and idempotency_key is not null
    do update set details=excluded.details;
  else
    insert into public.omega_platform_events(event_type,actor_user_id,actor_type,correlation_id,idempotency_key,source,entity_type,entity_id,payload)
    values(p_event_type,p_actor_user_id,p_actor_type,p_correlation_id,v_key,p_source,p_entity_type,p_entity_id,coalesce(p_payload,'{}'::jsonb))
    on conflict (actor_user_id,idempotency_key) where actor_user_id is not null and idempotency_key is not null
    do update set payload=excluded.payload
    returning event_id into v_id;

    insert into public.omega_audit_log(actor_user_id,actor_type,action,resource_type,resource_id,outcome,correlation_id,idempotency_key,details)
    values(p_actor_user_id,p_actor_type,p_event_type,p_entity_type,p_entity_id,'success',p_correlation_id,v_audit_key,pg_catalog.jsonb_build_object('source',p_source))
    on conflict (actor_user_id,idempotency_key) where actor_user_id is not null and idempotency_key is not null
    do update set details=excluded.details;
  end if;
  return v_id;
end;
$function$;

create or replace function omega_private.verify_achievement(
  p_user_achievement_id uuid,p_decision text,p_verifier text,p_verification_type text,p_evidence jsonb,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path='' as $function$
declare v_id uuid; v_existing_decision text; v_user uuid; v_key text:=pg_catalog.btrim(coalesce(p_idempotency_key,''));
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

  select verification_id,decision into v_id,v_existing_decision
  from public.omega_achievement_verifications
  where user_achievement_id=p_user_achievement_id and idempotency_key=v_key;
  if v_id is not null then
    if v_existing_decision<>p_decision then raise exception 'verification_idempotency_conflict'; end if;
    return v_id;
  end if;

  insert into public.omega_achievement_verifications(user_achievement_id,verification_type,verifier,evidence,decision,idempotency_key)
  values(p_user_achievement_id,p_verification_type,p_verifier,coalesce(p_evidence,'{}'::jsonb),p_decision,v_key)
  on conflict (user_achievement_id,idempotency_key) do nothing
  returning verification_id into v_id;

  if v_id is null then
    select verification_id,decision into v_id,v_existing_decision
    from public.omega_achievement_verifications
    where user_achievement_id=p_user_achievement_id and idempotency_key=v_key;
    if v_id is null or v_existing_decision<>p_decision then raise exception 'verification_idempotency_conflict'; end if;
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
  _rows integer;
begin
  if _uid is null then return pg_catalog.jsonb_build_object('ok',false,'error','unauthenticated'); end if;
  if _key is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(_uid::text||':'||_key,0));
    if exists(select 1 from public.sovereign_events where user_id=_uid and idempotency_key=_key) then
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

create or replace function private.record_task_sovereign_event()
returns trigger language plpgsql security definer set search_path='' as $function$
begin
  insert into public.sovereign_events(event_id,user_id,event_type,event_data,axis_delta,auth_before,auth_after,occurred_at,idempotency_key)
  values(
    pg_catalog.gen_random_uuid(),new.user_id,'sovereign.task.completed',
    pg_catalog.jsonb_build_object('taskCompletionId',new.id,'taskName',new.task_name,'taskType',new.task_type,'axisType',new.axis_type,
      'description',new.description,'points',new.points_earned,
      'axisBefore',jsonb_build_object('a',new.axis_a_before,'b',new.axis_b_before,'c',new.axis_c_before),
      'axisAfter',pg_catalog.jsonb_build_object('a',new.axis_a_after,'b',new.axis_b_after,'c',new.axis_c_after)),
    pg_catalog.jsonb_build_object('axis',new.axis_type,'delta',new.points_earned),
    case new.axis_type when 'a' then new.axis_a_before when 'b' then new.axis_b_before else new.axis_c_before end,
    new.auth_after,coalesce(new.completed_at,pg_catalog.now()),'task_completion:'||new.id::text
  )
  on conflict do nothing;
  return new;
end;
$function$;

create or replace function public.omega_runtime_dispatch(p_actor_user_id uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb; v_order_id uuid; v_referral_code text; v_attribution_id uuid; v_task_id uuid; v_request_id bigint; v_certificate_number text; v_query text; v_module text; v_action_name text; v_lifecycle text;
begin
 if p_actor_user_id is null then raise exception 'actor_required'; end if;
 case p_action
  when 'catalog' then v_result:=public.omega_runtime_manifest(null);
  when 'module_manifest' then
    v_module:=nullif(pg_catalog.btrim(p_payload->>'module_id'),''); if v_module is null then raise exception 'module_required'; end if;
    v_result:=public.omega_runtime_manifest(v_module);
  when 'module_state' then
    v_module:=nullif(pg_catalog.btrim(p_payload->>'module_id'),''); if v_module is null then raise exception 'module_required'; end if;
    v_result:=jsonb_build_object('module_id',v_module,'actions',coalesce((select jsonb_agg(to_jsonb(a) order by a.action_name) from public.omega_module_runtime_actions a where a.module_id=v_module),'[]'::jsonb));
  when 'module_read' then
    v_module:=nullif(pg_catalog.btrim(p_payload->>'module_id'),''); v_action_name:=nullif(pg_catalog.btrim(p_payload->>'action_name'),'');
    if v_module is null or v_action_name is null then raise exception 'module_and_action_required'; end if;
    select a.lifecycle into v_lifecycle from public.omega_module_runtime_actions a where a.module_id=v_module and a.action_name=v_action_name;
    if v_lifecycle is null then raise exception 'module_action_not_registered'; end if;
    if v_module='CORE' and v_action_name='profile.read' then
      select jsonb_build_object('id',p.id,'display_name',p.display_name,'sign',p.sign,'element',p.element,'membership_tier',p.membership_tier,'subscription_status',p.subscription_status,'axis_a',p.axis_a,'axis_b',p.axis_b,'axis_c',p.axis_c,'matrix_phase',p.matrix_phase,'matrix_track',p.matrix_track,'node_index',p.node_index,'is_owner',p.is_owner,'access_approved',p.access_approved) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='CORE' and v_action_name='catalog.read' then
      select jsonb_build_object('capabilities',count(*),'services',(select count(*) from public.omega_services),'active_services',(select count(*) from public.omega_services where status in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED')),'runtime_actions',(select count(*) from public.omega_module_runtime_actions)) into v_result from public.omega_capabilities;
    elsif v_module='CORE' and v_action_name='search.read' then
      select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at desc),'[]'::jsonb) into v_result from (select entity_type,entity_id,title,body,keywords,updated_at from public.search_index where owner_id is null or owner_id=p_actor_user_id order by updated_at desc limit 50)s;
    elsif v_module in ('GAMING','PROGRESS') and v_action_name='matrix.read' then
      select jsonb_build_object('nodes',(select count(*) from public.omega_matrix_nodes),'semantic_nodes',(select count(*) from public.omega_matrix_node_semantics),'current_profile',(select jsonb_build_object('axis_a',p.axis_a,'axis_b',p.axis_b,'axis_c',p.axis_c,'node_index',p.node_index,'matrix_phase',p.matrix_phase,'matrix_track',p.matrix_track) from public.profiles p where p.id=p_actor_user_id)) into v_result;
    elsif v_module='GAMING' and v_action_name='leaderboard.read' then
      select coalesce(jsonb_agg(to_jsonb(l) order by l.rank_global nulls last),'[]'::jsonb) into v_result from (select snapshot_date,rank_global,rank_track,rank_element,authority,display_name,sign,tier,track_id,element,is_owner from public.leaderboard_snapshots order by snapshot_date desc,rank_global nulls last limit 100)l;
    elsif v_module='ACHIEVEMENTS' and v_action_name='definitions.read' then
      select coalesce(jsonb_agg(to_jsonb(d) order by d.achievement_id),'[]'::jsonb) into v_result from public.omega_achievement_definitions d where d.lifecycle='active';
    elsif v_module='ACHIEVEMENTS' and v_action_name='mine.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.achievement_id),'[]'::jsonb) into v_result from public.omega_user_achievements a where a.user_id=p_actor_user_id;
    elsif v_module='ACHIEVEMENTS' and v_action_name='certificate.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='CONSULTANCY' and v_action_name='cases.read' then
      select jsonb_build_object('requests',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at desc) from (select id,domain,message,status,created_at,urgency,preferred_time from public.consult_requests where user_id=p_actor_user_id order by created_at desc limit 50)c),'[]'::jsonb),'bookings',coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from (select id,domain,title,status,scheduled_at,duration_min,price_omega,created_at from public.expert_bookings where client_id=p_actor_user_id or expert_id=p_actor_user_id order by created_at desc limit 50)b),'[]'::jsonb)) into v_result;
    elsif v_module='CONSULTANCY' and v_action_name='deliverables.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) into v_result from (select id,kind,title,created_at,file_path,status from public.publications where user_id=p_actor_user_id order by created_at desc limit 50)p;
    elsif v_module='FAMILY' and v_action_name='graph.read' then
      select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at),'[]'::jsonb) into v_result from (select id,name,relation,sign,is_heir,created_at from public.family_nodes where user_id=p_actor_user_id order by created_at)f;
    elsif v_module='FAMILY' and v_action_name='heritage.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,era,category,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='FAMILY' and v_action_name='vault.read' then
      select jsonb_build_object('heritage_record_count',count(*),'family_node_count',(select count(*) from public.family_nodes where user_id=p_actor_user_id),'privacy','caller_scoped') into v_result from public.heritage_records where user_id=p_actor_user_id;
    elsif v_module='MEDIA' and v_action_name='library.read' then
      select coalesce(jsonb_agg(to_jsonb(m) order by m.sort_order nulls last,m.created_at desc),'[]'::jsonb) into v_result from (select id,media_type,title,subtitle,description,olympian,track_id,element,duration_min,thumbnail_url,video_url,phase,sort_order from public.media_items where status='published' order by sort_order nulls last,created_at desc limit 100)m;
    elsif v_module='MEDIA' and v_action_name='publishing.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) into v_result from (select id,kind,title,status,created_at,file_path from public.publications where user_id=p_actor_user_id order by created_at desc limit 100)p;
    elsif v_module='BLOCKCHAIN_NFT' and v_action_name='assets.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_result from (select id,name,quantity,asset_type,track_name,created_at from public.user_assets where user_id=p_actor_user_id order by created_at desc limit 100)a;
    elsif v_module='BLOCKCHAIN_NFT' and v_action_name='marketplace.read' then
      select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc),'[]'::jsonb) into v_result from (select id,title,kind,price_omega,description,status,created_at from public.marketplace_listings where status in ('published','active','available') order by created_at desc limit 100)m;
    elsif v_module='COMMUNICATION' and v_action_name='notifications.read' then
      select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_result from (select * from public.omega_notifications where user_id=p_actor_user_id order by created_at desc limit 100)n;
    elsif v_module='COMMUNICATION' and v_action_name='presence.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.last_seen_at desc),'[]'::jsonb) into v_result from (select * from public.member_presence where user_id=p_actor_user_id order by last_seen_at desc limit 20)p;
    elsif v_module='COMMUNICATION' and v_action_name='events.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from (select * from public.omega_platform_events where user_id=p_actor_user_id order by created_at desc limit 100)e;
    elsif v_module='INTELLIGENCE' and v_action_name='agents.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.agent_id),'[]'::jsonb) into v_result from public.omega_agents a;
    elsif v_module='INTELLIGENCE' and v_action_name='evidence.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.extraction_timestamp desc),'[]'::jsonb) into v_result from (select * from public.graph_evidence where user_id=p_actor_user_id order by extraction_timestamp desc limit 100)e;
    elsif v_module='CREDENTIALS' and v_action_name='certificates.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='HIERARCHY' and v_action_name='roles.read' then
      select jsonb_build_object('membership_tier',p.membership_tier,'subscription_tier',p.subscription_tier,'subscription_status',p.subscription_status,'is_owner',p.is_owner,'access_approved',p.access_approved) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='HIERARCHY' and v_action_name='entitlements.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from public.omega_entitlements e where e.user_id=p_actor_user_id;
    elsif v_module='HOROSCOPE' and v_action_name='profile.read' then
      select jsonb_build_object('sign',p.sign,'element',p.element,'planet',p.planet,'god',p.god,'birth_date',p.birth_date,'country',p.country) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='NEWS' and v_action_name='feed.read' then
      select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,category,created_at from public.news where is_published=true order by created_at desc limit 100)n;
    elsif v_module='NEWS' and v_action_name='topics.read' then
      select coalesce(jsonb_agg(jsonb_build_object('category',category,'count',count) order by category),'[]'::jsonb) into v_result from (select category,count(*) from public.news where is_published=true group by category)n(category,count);
    elsif v_module='NEWS' and v_action_name='provenance.read' then
      select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'category',category,'published',is_published,'created_at',created_at) order by created_at desc),'[]'::jsonb) into v_result from (select id,title,category,is_published,created_at from public.news order by created_at desc limit 100)n;
    elsif v_module='HERITAGE' and v_action_name='timeline.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,era,category,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='HERITAGE' and v_action_name='documents.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,category,era,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='HERITAGE' and v_action_name='access.read' then
      select jsonb_build_object('user_id',p_actor_user_id,'record_count',count(*),'access','caller_scoped') into v_result from public.heritage_records where user_id=p_actor_user_id;
    elsif v_module='LEGAL' and v_action_name='consent.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.granted_at desc),'[]'::jsonb) into v_result from public.consent_records c where c.user_id=p_actor_user_id;
    elsif v_module='INVESTMENT' and v_action_name='research.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,domain,title,body,created_at from public.research_hypotheses where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='INVESTMENT' and v_action_name='simulation.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_result from (select id,name,quantity,asset_type,track_name,created_at from public.user_assets where user_id=p_actor_user_id and lower(coalesce(asset_type,'')) like '%simulation%' order by created_at desc limit 100)a;
    
    elsif v_module='MEDIA' and v_action_name='jobs.read' then
      select coalesce(jsonb_agg(jsonb_build_object('id',j.id,'job_type',j.job_type,'status',j.status,'provider',j.provider,'request',j.request,'result',j.result,'error_code',j.error_code,'created_at',j.created_at,'updated_at',j.updated_at) order by j.created_at desc),'[]'::jsonb)
      into v_result
      from (select * from public.omega_media_jobs where user_id=p_actor_user_id order by created_at desc limit 100) j;
    elsif v_module='INVESTMENT' and v_action_name='watchlist.read' then
      select coalesce(jsonb_agg(jsonb_build_object('id',w.id,'symbol',w.symbol,'asset_class',w.asset_class,'market',w.market,'notes',w.notes,'alert_rules',w.alert_rules,'created_at',w.created_at,'updated_at',w.updated_at) order by w.updated_at desc),'[]'::jsonb)
      into v_result from public.omega_investment_watchlists w where w.user_id=p_actor_user_id;
    elsif v_module='LEGAL' and v_action_name='terms.read' then
      select coalesce((select jsonb_build_object('document_type',d.document_type,'version',d.version,'effective_at',d.effective_at,'title',d.title,'body_markdown',d.body_markdown,'content_hash',d.content_hash,'updated_at',d.updated_at) from public.omega_legal_documents d where d.document_type='terms' and d.status='PUBLISHED' order by d.updated_at desc limit 1),'{}'::jsonb)
      into v_result;
    elsif v_module='LEGAL' and v_action_name='privacy.read' then
      select coalesce((select jsonb_build_object('document_type',d.document_type,'version',d.version,'effective_at',d.effective_at,'title',d.title,'body_markdown',d.body_markdown,'content_hash',d.content_hash,'updated_at',d.updated_at) from public.omega_legal_documents d where d.document_type='privacy' and d.status='PUBLISHED' order by d.updated_at desc limit 1),'{}'::jsonb)
      into v_result;
    elsif v_module='BLOCKCHAIN_NFT' and v_action_name='ownership.verify' then
      select coalesce(jsonb_agg(jsonb_build_object('id',v.id,'chain_id',v.chain_id,'contract_address',v.contract_address,'token_standard',v.token_standard,'token_id',v.token_id,'wallet_address',v.wallet_address,'observed_owner',v.observed_owner,'balance',v.balance,'verification_status',v.verification_status,'provider_block_number',v.provider_block_number,'proof',v.proof,'created_at',v.created_at) order by v.created_at desc),'[]'::jsonb)
      into v_result from (select * from public.omega_blockchain_ownership_verifications where user_id=p_actor_user_id order by created_at desc limit 100) v;
    elsif v_module='GAMING' and v_action_name='missions.read' then
      select coalesce(jsonb_agg(jsonb_build_object('mission_id',m.id,'mission_key',m.mission_key,'title',m.title,'description',m.description,'version',m.version,'mission_status',m.status,'member_status',coalesce(ms.status,'NOT_STARTED'),'attempt_count',coalesce(ms.attempt_count,0),'started_at',ms.started_at,'completed_at',ms.completed_at) order by m.created_at desc),'[]'::jsonb)
      into v_result
      from (select * from public.omega_missions where status='active' order by created_at desc limit 100) m
      left join public.omega_member_mission_state ms on ms.mission_id=m.id and ms.user_id=p_actor_user_id;
    elsif v_module='HOROSCOPE' and v_action_name='reading.generate' then
      select jsonb_build_object(
        'status','SIMULATED',
        'classification','INTERPRETIVE_CONTENT',
        'sign',p.sign,
        'themes',case lower(coalesce(p.sign::text,'')) 
          when 'aries' then jsonb_build_array('initiative','courage','new beginnings')
          when 'taurus' then jsonb_build_array('stability','patience','stewardship')
          when 'gemini' then jsonb_build_array('communication','curiosity','adaptability')
          when 'cancer' then jsonb_build_array('care','belonging','reflection')
          when 'leo' then jsonb_build_array('creativity','generosity','confidence')
          when 'virgo' then jsonb_build_array('craft','discernment','service')
          when 'libra' then jsonb_build_array('balance','dialogue','fairness')
          when 'scorpio' then jsonb_build_array('depth','resilience','renewal')
          when 'sagittarius' then jsonb_build_array('learning','exploration','perspective')
          when 'capricorn' then jsonb_build_array('discipline','responsibility','long-term focus')
          when 'aquarius' then jsonb_build_array('innovation','community','independence')
          when 'pisces' then jsonb_build_array('imagination','empathy','rest')
          else jsonb_build_array('reflection','clarity','personal growth')
        end,
        'disclaimer','Interpretive content for reflection and entertainment only; not scientific, medical, financial, legal, or predictive advice.',
        'provenance',jsonb_build_object('method','fixed sign-to-theme mapping','external_source',false,'predictive_claim',false,'engine_version','omega-horoscope-interpretive-v1')
      ) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='HOROSCOPE' and v_action_name='provenance.read' then
      select jsonb_build_object('status','AVAILABLE','classification','PROVENANCE_METADATA','sign',p.sign,'source_table','public.profiles','source_fields',jsonb_build_array('sign','birth_date'),'method','fixed sign-to-theme mapping','external_provider',false,'predictive_claim',false,'engine_version','omega-horoscope-interpretive-v1')
      into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='PROGRESS' and v_action_name='tasks.read' then
      select coalesce(jsonb_agg(jsonb_build_object('task_id',t.id,'mission_task_id',t.mission_task_id,'mission_id',mt.mission_id,'task_key',mt.task_key,'title',mt.title,'description',mt.description,'status',t.status,'accepted_at',t.accepted_at,'submitted_at',t.submitted_at,'verified_at',t.verified_at,'completed_at',t.completed_at,'outcome',t.outcome) order by t.updated_at desc),'[]'::jsonb)
      into v_result
      from (select * from public.omega_member_mission_tasks where user_id=p_actor_user_id order by updated_at desc limit 100) t
      left join public.omega_mission_tasks mt on mt.id=t.mission_task_id;
    elsif v_module='PROGRESS' and v_action_name='verification.read' then
      select jsonb_build_object(
        'verified_mission_tasks',coalesce((select jsonb_agg(jsonb_build_object('task_id',t.id,'mission_task_id',t.mission_task_id,'verified_at',t.verified_at,'completed_at',t.completed_at,'evidence_event_ids',t.evidence_event_ids,'graph_evidence_ids',t.graph_evidence_ids) order by t.verified_at desc) from (select * from public.omega_member_mission_tasks where user_id=p_actor_user_id and verified_at is not null order by verified_at desc limit 100) t),'[]'::jsonb),
        'evidence',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'source_type',e.source_type,'source_table',e.source_table,'source_row_id',e.source_row_id,'extraction_confidence',e.extraction_confidence,'human_verified',e.human_verified,'extraction_timestamp',e.extraction_timestamp) order by e.extraction_timestamp desc) from (select * from public.graph_evidence where user_id=p_actor_user_id order by extraction_timestamp desc limit 100) e),'[]'::jsonb)
      ) into v_result;
    elsif v_module='CREDENTIALS' and v_action_name='passport.read' then
      select jsonb_build_object('credential_type','PLATFORM_MEMBERSHIP','government_identity',false,'travel_document',false,'display_name',p.display_name,'membership_tier',p.membership_tier,'subscription_status',p.subscription_status,'access_approved',p.access_approved,'issued_at',p.created_at,'active_certificate_count',(select count(*) from public.omega_certificates c where c.user_id=p_actor_user_id and c.status='issued' and c.revoked_at is null))
      into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='CREDENTIALS' and v_action_name='verify.read' then
      v_certificate_number:=nullif(pg_catalog.btrim(p_payload->>'certificate_number'),'');
      if v_certificate_number is null then
        v_result:=jsonb_build_object('verification_status','IDENTIFIER_REQUIRED','scope','PUBLIC_CERTIFICATE_PROOF_ONLY');
      else
        select jsonb_build_object('certificate_number',c.certificate_number,'achievement_id',c.achievement_id,'status',c.status,'verification_status',case when c.revoked_at is not null then 'REVOKED' when c.status='issued' and c.issued_at is not null then 'VALID' else 'NOT_VALID' end,'issued_at',c.issued_at,'revoked_at',c.revoked_at)
        into v_result from public.omega_certificates c where c.certificate_number=v_certificate_number order by c.issued_at desc limit 1;
        if v_result is null then v_result:=jsonb_build_object('verification_status','NOT_FOUND','certificate_number',v_certificate_number); end if;
      end if;
    elsif v_module='INTELLIGENCE' and v_action_name='retrieval.read' then
      v_query:=nullif(pg_catalog.btrim(p_payload->>'query'),'');
      if v_query is null then
        v_result:=jsonb_build_object('status','QUERY_REQUIRED','results','[]'::jsonb);
      else
        select coalesce(jsonb_agg(jsonb_build_object('source_id',x.source_id,'title',x.title,'publisher',x.publisher,'canonical_url',x.canonical_url,'source_type',x.source_type,'quality_score',x.quality_score,'evidence_level',x.evidence_level,'chunk_no',x.chunk_no,'content',x.content,'provenance',x.provenance,'rank',x.rank) order by x.rank desc,x.quality_score desc),'[]'::jsonb)
        into v_result
        from (
          select s.id as source_id,s.title,s.publisher,s.canonical_url,s.source_type,s.quality_score,c.evidence_level,c.chunk_no,pg_catalog.left(c.content,1600) as content,s.provenance,
                 pg_catalog.ts_rank_cd(pg_catalog.to_tsvector('simple',coalesce(c.content,'')),pg_catalog.plainto_tsquery('simple',v_query))::real as rank
          from public.omega_knowledge_chunks c
          join public.omega_knowledge_sources s on s.id=c.source_id
          where s.status='approved'
            and pg_catalog.plainto_tsquery('simple',v_query) @@ pg_catalog.to_tsvector('simple',coalesce(c.content,''))
          order by rank desc,coalesce(s.quality_score,0) desc,c.chunk_no asc
          limit 10
        ) x;
      end if;
    elsif v_module='HIERARCHY' and v_action_name='governance.read' then
      select coalesce(jsonb_agg(jsonb_build_object('policy_id',g.policy_id,'category',g.category,'title',g.title,'description',g.description,'version',g.version,'owner_role',g.owner_role,'review_cycle',g.review_cycle,'last_reviewed',g.last_reviewed,'next_review',g.next_review,'tags',g.tags,'content',pg_catalog.left(g.content,4000)) order by g.category,g.policy_id),'[]'::jsonb)
      into v_result from public.governance_policies g where g.status='active';
    elsif v_module='ELEMENTAL' and v_action_name in ('cosmology.read','simulation.run','interpretation.read') then
      v_result:=public.omega_elemental_runtime(v_action_name,coalesce(p_payload,'{}'::jsonb));

    else
      v_result:=jsonb_build_object('implementation_status',case when v_lifecycle in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED') then 'ADAPTER_REQUIRED' else 'CONTRACT_ONLY' end,'module_id',v_module,'action_name',v_action_name,'lifecycle',v_lifecycle,'message','The runtime contract is registered, but this module action has not been promoted to a server data adapter yet. No synthetic business data is returned.');
    end if;
    v_result:=jsonb_build_object('module_id',v_module,'action_name',v_action_name,'lifecycle',v_lifecycle,'data',coalesce(v_result,'{}'::jsonb));

  when 'create_consult_intake' then
    v_request_id:=omega_private.create_consult_intake(p_actor_user_id,p_payload->>'domain',p_payload->>'message',p_payload->>'idempotency_key',coalesce(p_payload->>'urgency','normal'),p_payload->>'preferred_time',coalesce((p_payload->>'confidentiality_accepted')::boolean,false),p_payload->>'contact');
    v_result:=jsonb_build_object('request_id',v_request_id,'status','pending');
  when 'create_media_job' then
    v_result:=private.omega_media_job_create(p_actor_user_id,p_payload->>'job_type',coalesce(p_payload->'request','{}'::jsonb),p_payload->>'idempotency_key',p_payload->>'provider');
  when 'upsert_investment_watchlist' then
    v_result:=private.omega_watchlist_upsert(p_actor_user_id,p_payload->>'symbol',p_payload->>'asset_class',p_payload->>'market',p_payload->>'notes',coalesce(p_payload->'alert_rules','{}'::jsonb));
  when 'create_service_order' then
    v_order_id:=omega_private.create_service_order(p_actor_user_id,nullif(pg_catalog.btrim(p_payload->>'service_id'),''),p_payload->>'idempotency_key',coalesce(p_payload->'metadata','{}'::jsonb));
    v_result:=jsonb_build_object('order_id',v_order_id,'status','PENDING');
  when 'issue_referral_code' then
    v_referral_code:=omega_private.issue_referral_code(p_actor_user_id,nullif(pg_catalog.btrim(p_payload->>'requested_code'),''));
    v_result:=jsonb_build_object('referral_code',v_referral_code);
  when 'attribute_referral' then
    v_attribution_id:=omega_private.attribute_referral(p_payload->>'referral_code',p_actor_user_id,nullif(p_payload->>'source_click_id','')::uuid);
    v_result:=jsonb_build_object('attribution_id',v_attribution_id);
  when 'enqueue_agent_task' then
    v_task_id:=omega_private.enqueue_agent_task(p_actor_user_id,p_payload->>'agent_id',p_payload->>'task_type',coalesce(p_payload->'input','{}'::jsonb),p_payload->>'idempotency_key',coalesce((p_payload->>'approval_required')::boolean,true));
    v_result:=jsonb_build_object('task_id',v_task_id);
  else raise exception 'runtime_action_not_allowed';
 end case;
 perform omega_private.record_platform_event('action_completed',p_actor_user_id,'user','omega-runtime-gateway','runtime:'||p_action||':'||md5(coalesce(p_payload::text,'{}')),pg_catalog.gen_random_uuid(),'runtime_action',p_action,p_payload);
 return v_result;
end $$;

revoke all on function public.omega_runtime_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.omega_runtime_dispatch(uuid,text,jsonb) to service_role;

do $$
begin
  if (select count(*) from public.omega_module_runtime_actions) <> 54 then
    raise exception 'omega_runtime_action_count_must_equal_54';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_service_orders' and indexname='omega_service_orders_user_idempotency_uidx')
     or not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_service_orders' and indexname='omega_service_orders_system_idempotency_uidx') then
    raise exception 'service_order_user_scoped_idempotency_indexes_missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_agent_tasks' and indexname='omega_agent_tasks_user_idempotency_uidx')
     or not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_agent_tasks' and indexname='omega_agent_tasks_system_idempotency_uidx') then
    raise exception 'agent_task_user_scoped_idempotency_indexes_missing';
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.omega_notifications'::regclass and conname='omega_notifications_user_idempotency_key_key' and contype='u') then
    raise exception 'notification_user_scoped_idempotency_constraint_missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='sovereign_events' and indexname='sovereign_events_user_idempotency_uidx')
     or not exists (select 1 from pg_indexes where schemaname='public' and tablename='sovereign_events' and indexname='sovereign_events_system_idempotency_uidx') then
    raise exception 'sovereign_event_user_scoped_idempotency_indexes_missing';
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.omega_achievement_verifications'::regclass and conname='omega_achievement_verifications_subject_idempotency_key_key' and contype='u') then
    raise exception 'achievement_verification_subject_idempotency_constraint_missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_platform_events' and indexname='omega_platform_events_actor_idempotency_uidx')
     or not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_platform_events' and indexname='omega_platform_events_system_idempotency_uidx') then
    raise exception 'platform_event_actor_idempotency_indexes_missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_audit_log' and indexname='omega_audit_log_actor_idempotency_uidx')
     or not exists (select 1 from pg_indexes where schemaname='public' and tablename='omega_audit_log' and indexname='omega_audit_log_system_idempotency_uidx') then
    raise exception 'audit_log_actor_idempotency_indexes_missing';
  end if;
  if not exists (select 1 from pg_indexes where schemaname='public' and tablename='consult_requests' and indexname='consult_requests_runtime_idempotency_uidx') then
    raise exception 'consultancy_user_scoped_idempotency_index_missing';
  end if;
  if not has_function_privilege('service_role','public.omega_runtime_dispatch(uuid,text,jsonb)','EXECUTE') then
    raise exception 'runtime_dispatch_service_role_execute_missing';
  end if;
  if has_function_privilege('anon','public.omega_runtime_dispatch(uuid,text,jsonb)','EXECUTE')
     or has_function_privilege('authenticated','public.omega_runtime_dispatch(uuid,text,jsonb)','EXECUTE') then
    raise exception 'runtime_dispatch_exposed_to_client_roles';
  end if;
  if position('pg_catalog.trim(' in pg_get_functiondef('public.omega_runtime_dispatch(uuid,text,jsonb)'::regprocedure)) > 0 then
    raise exception 'runtime_dispatch_contains_invalid_pg_catalog_trim';
  end if;
end;
$$;

commit;
