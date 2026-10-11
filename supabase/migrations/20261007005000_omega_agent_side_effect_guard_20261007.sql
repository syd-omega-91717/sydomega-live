-- Ω SYD OMEGA 91717
-- Govern external agent tool execution through explicit grants, task approval, and production-ready agent state.
begin;

alter table public.omega_agent_operations
  add column if not exists task_id uuid references public.omega_agent_tasks(task_id) on delete set null;

create index if not exists omega_agent_operations_task_idx
  on public.omega_agent_operations(task_id);

create or replace function private.omega_authorize_agent_tool(
  p_task_id uuid,
  p_tool_name text,
  p_payload_digest text,
  p_risk text default 'low'
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  v_task public.omega_agent_tasks;
  v_agent public.omega_agents;
  v_grant public.omega_agent_tool_grants;
  v_calls integer;
  v_reason text;
begin
  if current_user <> 'service_role' then raise exception 'service_role_required'; end if;
  if p_task_id is null or p_tool_name is null or btrim(p_tool_name)='' then raise exception 'invalid_agent_tool_request'; end if;
  if p_payload_digest is null or p_payload_digest !~ '^[0-9a-f]{32}$' then raise exception 'invalid_payload_digest'; end if;
  if p_risk not in ('low','medium') then raise exception 'risk_not_authorized'; end if;

  select * into v_task from public.omega_agent_tasks where task_id=p_task_id for update;
  if not found then raise exception 'agent_task_not_found'; end if;
  if v_task.user_id is null then
    return jsonb_build_object('authorized',false,'reason','agent_task_user_required','task_id',p_task_id,'tool_name',p_tool_name);
  end if;

  select * into v_agent from public.omega_agents where agent_id=v_task.agent_id;
  if not found then raise exception 'agent_not_found'; end if;

  select * into v_grant
  from public.omega_agent_tool_grants
  where agent_id=v_task.agent_id and tool_name=p_tool_name and enabled=true;

  if not found then v_reason:='explicit_tool_grant_required';
  elsif v_task.status not in ('approved','running') then v_reason:='task_not_approved_or_running';
  elsif v_agent.status not in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED') then v_reason:='agent_not_production_ready';
  elsif jsonb_typeof(v_agent.denied_tools)='array' and v_agent.denied_tools @> to_jsonb(p_tool_name) then v_reason:='agent_tool_denied';
  elsif jsonb_typeof(v_agent.allowed_tools)='array' and not (v_agent.allowed_tools @> to_jsonb(p_tool_name)) then v_reason:='agent_tool_not_allowlisted';
  elsif v_grant.approval_required=true and (v_task.approved_by is null or v_task.approved_at is null) then v_reason:='human_approval_required';
  else
    select count(*) into v_calls
    from public.omega_agent_operations
    where task_id=p_task_id and tool_id=p_tool_name and status in ('AUTHORIZED','EXECUTED');
    if v_calls >= v_grant.max_calls then v_reason:='tool_call_budget_exhausted'; end if;
  end if;

  if v_reason is not null then
    insert into public.omega_agent_operations(user_id,agent_name,tool_id,intent,risk,status,reason,payload_digest,created_at,task_id)
    values(v_task.user_id,v_agent.name,p_tool_name,'external_tool_authorization',p_risk,'BLOCKED',v_reason,p_payload_digest,now(),p_task_id);
    return jsonb_build_object('authorized',false,'reason',v_reason,'task_id',p_task_id,'tool_name',p_tool_name);
  end if;

  insert into public.omega_agent_operations(user_id,agent_name,tool_id,intent,risk,status,reason,payload_digest,created_at,task_id)
  values(v_task.user_id,v_agent.name,p_tool_name,'external_tool_authorization',p_risk,'AUTHORIZED','governed_grant',p_payload_digest,now(),p_task_id);
  return jsonb_build_object('authorized',true,'task_id',p_task_id,'tool_name',p_tool_name,'max_calls',v_grant.max_calls);
end $$;

create or replace function public.omega_authorize_agent_tool(
  p_task_id uuid,
  p_tool_name text,
  p_payload_digest text,
  p_risk text default 'low'
)
returns jsonb
language sql
security invoker
set search_path=''
as $$ select private.omega_authorize_agent_tool($1,$2,$3,$4); $$;

revoke all on function private.omega_authorize_agent_tool(uuid,text,text,text) from public,anon,authenticated;
revoke execute on function public.omega_authorize_agent_tool(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.omega_authorize_agent_tool(uuid,text,text,text) to service_role;

commit;