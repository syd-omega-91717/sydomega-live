-- SYD OMEGA 91717
-- Server-side state transitions for referral attribution, governed agent execution,
-- and notification delivery. No client-side rewards, agent execution, or fabricated achievements.

begin;

create or replace function omega_private.issue_referral_code(
  p_user_id uuid,
  p_requested_code text default null
) returns text
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare
  v_code text;
  v_existing public.omega_referral_codes%rowtype;
begin
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'user_not_found';
  end if;

  select * into v_existing
  from public.omega_referral_codes
  where owner_user_id=p_user_id
  for update;

  if v_existing.referral_code is not null then
    if v_existing.status='revoked' then
      update public.omega_referral_codes set status='active',updated_at=now()
      where referral_code=v_existing.referral_code;
    end if;
    return v_existing.referral_code;
  end if;

  if p_requested_code is not null then
    v_code=upper(trim(p_requested_code));
    if v_code !~ '^[A-Z0-9][A-Z0-9_-]{5,31}$' then
      raise exception 'invalid_referral_code';
    end if;
  else
    v_code='OMEGA-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  end if;

  if exists(select 1 from public.omega_referral_codes where referral_code=v_code) then
    raise exception 'referral_code_taken';
  end if;

  insert into public.omega_referral_codes(referral_code,owner_user_id,status)
  values(v_code,p_user_id,'active');

  return v_code;
end $$;

create or replace function omega_private.attribute_referral(
  p_referral_code text,
  p_referred_user_id uuid,
  p_source_click_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare
  v_owner uuid;
  v_existing public.omega_referral_attributions%rowtype;
  v_id uuid;
begin
  select owner_user_id into v_owner
  from public.omega_referral_codes
  where referral_code=upper(trim(p_referral_code))
    and status='active';

  if v_owner is null then raise exception 'referral_code_invalid'; end if;
  if v_owner=p_referred_user_id then raise exception 'self_referral_rejected'; end if;

  select * into v_existing
  from public.omega_referral_attributions
  where referred_user_id=p_referred_user_id
  for update;

  if v_existing.attribution_id is not null then
    return v_existing.attribution_id;
  end if;

  insert into public.omega_referral_attributions(
    referral_code,referred_user_id,source_click_id,status
  )
  values(upper(trim(p_referral_code)),p_referred_user_id,p_source_click_id,'pending')
  returning attribution_id into v_id;

  return v_id;
end $$;

create or replace function omega_private.claim_agent_task(
  p_worker_id text
) returns public.omega_agent_tasks
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare
  v_task public.omega_agent_tasks%rowtype;
begin
  if nullif(trim(p_worker_id),'') is null then raise exception 'worker_id_required'; end if;

  select * into v_task
  from public.omega_agent_tasks
  where status in ('queued','approved')
    and (approval_required=false or approved_at is not null)
  order by created_at
  for update skip locked
  limit 1;

  if v_task.task_id is null then return null; end if;

  update public.omega_agent_tasks
  set status='running',started_at=coalesce(started_at,now())
  where task_id=v_task.task_id
  returning * into v_task;

  insert into public.omega_agent_task_events(task_id,event_type,actor,payload)
  values(v_task.task_id,'claimed',p_worker_id,jsonb_build_object('worker_id',p_worker_id));

  return v_task;
end $$;

create or replace function omega_private.complete_agent_task(
  p_task_id uuid,
  p_worker_id text,
  p_output jsonb,
  p_evidence jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare v_status text;
begin
  select status into v_status from public.omega_agent_tasks where task_id=p_task_id for update;
  if v_status is null then raise exception 'task_not_found'; end if;
  if v_status not in ('running','approved') then raise exception 'task_not_running'; end if;

  update public.omega_agent_tasks
  set status='succeeded',output=coalesce(p_output,'{}'::jsonb),completed_at=now()
  where task_id=p_task_id;

  insert into public.omega_agent_task_events(task_id,event_type,actor,payload)
  values(p_task_id,'completed',p_worker_id,jsonb_build_object('output',coalesce(p_output,'{}'::jsonb),'evidence',coalesce(p_evidence,'{}'::jsonb)));

  return true;
end $$;

create or replace function omega_private.fail_agent_task(
  p_task_id uuid,
  p_worker_id text,
  p_error_code text,
  p_error_message text,
  p_evidence jsonb default '{}'::jsonb
) returns boolean
language plpgsql
security definer
set search_path=public,omega_private
as $$
begin
  if not exists(select 1 from public.omega_agent_tasks where task_id=p_task_id for update) then
    raise exception 'task_not_found';
  end if;

  update public.omega_agent_tasks
  set status='failed',error_code=p_error_code,error_message=left(p_error_message,2000),completed_at=now()
  where task_id=p_task_id;

  insert into public.omega_agent_task_events(task_id,event_type,actor,payload)
  values(p_task_id,'failed',p_worker_id,jsonb_build_object('error_code',p_error_code,'evidence',coalesce(p_evidence,'{}'::jsonb)));

  return true;
end $$;

create or replace function omega_private.mark_notification_delivered(
  p_notification_id uuid,
  p_channel text default null
) returns boolean
language plpgsql
security definer
set search_path=public,omega_private
as $$
begin
  update public.omega_notifications
  set status='delivered',sent_at=coalesce(sent_at,now()),
      channel=coalesce(p_channel,channel)
  where notification_id=p_notification_id
    and status in ('queued','sent');
  return found;
end $$;

create or replace function omega_private.mark_notification_failed(
  p_notification_id uuid,
  p_reason text
) returns boolean
language plpgsql
security definer
set search_path=public,omega_private
as $$
begin
  update public.omega_notifications
  set status='failed',
      metadata=metadata||jsonb_build_object('delivery_error',left(coalesce(p_reason,'unknown'),1000))
  where notification_id=p_notification_id
    and status in ('queued','sent');
  return found;
end $$;

revoke all on function omega_private.issue_referral_code(uuid,text) from public,anon,authenticated;
revoke all on function omega_private.attribute_referral(text,uuid,uuid) from public,anon,authenticated;
revoke all on function omega_private.claim_agent_task(text) from public,anon,authenticated;
revoke all on function omega_private.complete_agent_task(uuid,text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function omega_private.fail_agent_task(uuid,text,text,text,jsonb) from public,anon,authenticated;
revoke all on function omega_private.mark_notification_delivered(uuid,text) from public,anon,authenticated;
revoke all on function omega_private.mark_notification_failed(uuid,text) from public,anon,authenticated;

grant execute on function omega_private.issue_referral_code(uuid,text) to service_role;
grant execute on function omega_private.attribute_referral(text,uuid,uuid) to service_role;
grant execute on function omega_private.claim_agent_task(text) to service_role;
grant execute on function omega_private.complete_agent_task(uuid,text,jsonb,jsonb) to service_role;
grant execute on function omega_private.fail_agent_task(uuid,text,text,text,jsonb) to service_role;
grant execute on function omega_private.mark_notification_delivered(uuid,text) to service_role;
grant execute on function omega_private.mark_notification_failed(uuid,text) to service_role;

commit;
