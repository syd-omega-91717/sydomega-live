-- SYD OMEGA 91717
-- Server-only orchestration primitives for referral qualification,
-- achievement verification, governed agent tasks and notifications.

begin;

create or replace function omega_private.qualify_referral_conversion(
  p_conversion_id uuid,
  p_status text,
  p_provider_reference text default null,
  p_settled_amount numeric default null,
  p_currency text default null
) returns uuid
language plpgsql security definer
set search_path=public,omega_private
as $$
declare v_id uuid;
begin
  if p_status not in ('confirmed','reversed','rejected') then
    raise exception 'invalid conversion status';
  end if;

  update public.omega_referral_conversions
  set status=p_status,
      provider_reference=coalesce(p_provider_reference,provider_reference),
      amount=coalesce(p_settled_amount,amount),
      currency=coalesce(p_currency,currency)
  where conversion_id=p_conversion_id
  returning conversion_id into v_id;

  if v_id is null then raise exception 'conversion not found'; end if;

  update public.omega_referral_attributions a
  set status=case when p_status='confirmed' then 'qualified'
                  when p_status='reversed' then 'reversed'
                  else 'rejected' end
  where a.attribution_id=(
    select c.attribution_id
    from public.omega_referral_conversions c
    where c.conversion_id=v_id
  );

  return v_id;
end $$;

create or replace function omega_private.verify_achievement(
  p_user_achievement_id uuid,
  p_decision text,
  p_verifier text,
  p_verification_type text,
  p_evidence jsonb,
  p_idempotency_key text
) returns uuid
language plpgsql security definer
set search_path=public,omega_private
as $$
declare v_id uuid; v_user uuid;
begin
  if p_decision not in ('approved','rejected','needs_review') then
    raise exception 'invalid decision';
  end if;

  insert into public.omega_achievement_verifications(
    user_achievement_id,verification_type,verifier,evidence,decision,idempotency_key
  )
  values(
    p_user_achievement_id,p_verification_type,p_verifier,
    coalesce(p_evidence,'{}'::jsonb),p_decision,p_idempotency_key
  )
  on conflict(idempotency_key) do update set decision=excluded.decision
  returning verification_id into v_id;

  select user_id into v_user
  from public.omega_user_achievements
  where user_achievement_id=p_user_achievement_id;

  if v_user is null then raise exception 'achievement assignment not found'; end if;

  update public.omega_user_achievements
  set status=case when p_decision='approved' then 'verified'
                  when p_decision='rejected' then 'revoked'
                  else 'pending' end,
      evidence_ref=coalesce(evidence_ref,p_idempotency_key),
      verified_at=case when p_decision='approved' then now() else verified_at end
  where user_achievement_id=p_user_achievement_id;

  return v_id;
end $$;

create or replace function omega_private.enqueue_agent_task(
  p_user_id uuid,
  p_agent_id text,
  p_task_type text,
  p_input jsonb,
  p_idempotency_key text,
  p_approval_required boolean default true
) returns uuid
language plpgsql security definer
set search_path=public,omega_private
as $$
declare v_id uuid;
begin
  if not exists(select 1 from public.omega_agents where agent_id=p_agent_id) then
    raise exception 'unknown agent';
  end if;

  insert into public.omega_agent_tasks(
    user_id,agent_id,task_type,input,idempotency_key,approval_required
  )
  values(
    p_user_id,p_agent_id,p_task_type,coalesce(p_input,'{}'::jsonb),
    p_idempotency_key,p_approval_required
  )
  on conflict(idempotency_key) do update set input=excluded.input
  returning task_id into v_id;

  insert into public.omega_agent_task_events(task_id,event_type,actor,payload)
  values(
    v_id,'task_queued','system',
    jsonb_build_object('agent_id',p_agent_id,'approval_required',p_approval_required)
  );

  return v_id;
end $$;

create or replace function omega_private.enqueue_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_channel text,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql security definer
set search_path=public,omega_private
as $$
declare v_id uuid;
begin
  if p_channel not in ('in_app','email','sms','push') then
    raise exception 'invalid channel';
  end if;

  insert into public.omega_notifications(
    user_id,notification_type,title,body,channel,idempotency_key,metadata
  )
  values(
    p_user_id,p_type,p_title,p_body,p_channel,p_idempotency_key,coalesce(p_metadata,'{}'::jsonb)
  )
  on conflict(idempotency_key) do update set metadata=excluded.metadata
  returning notification_id into v_id;

  return v_id;
end $$;

revoke all on function omega_private.qualify_referral_conversion(uuid,text,text,numeric,text)
  from public,anon,authenticated;
revoke all on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text)
  from public,anon,authenticated;
revoke all on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean)
  from public,anon,authenticated;
revoke all on function omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb)
  from public,anon,authenticated;

grant execute on function omega_private.qualify_referral_conversion(uuid,text,text,numeric,text) to service_role;
grant execute on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text) to service_role;
grant execute on function omega_private.enqueue_agent_task(uuid,text,text,jsonb,text,boolean) to service_role;
grant execute on function omega_private.enqueue_notification(uuid,text,text,text,text,text,jsonb) to service_role;

commit;
