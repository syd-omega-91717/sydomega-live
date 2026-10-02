-- Ω SYD OMEGA 91717 — agent audit RPC is server-only
-- The audit row is authoritative server telemetry. Authenticated browser
-- clients must not be able to forge EXECUTED/BLOCKED/FAILED audit entries.
drop function if exists public.omega_record_agent_operation(text,text,text,text,text,text,text);

create or replace function public.omega_record_agent_operation(
  p_user_id uuid,
  p_agent_name text,
  p_tool_id text,
  p_intent text,
  p_risk text,
  p_status text,
  p_reason text,
  p_payload_digest text
)
returns public.omega_agent_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.omega_agent_operations;
begin
  if p_user_id is null then
    raise exception 'user_id_required' using errcode='22023';
  end if;
  if p_agent_name is null or length(p_agent_name) not between 1 and 40 then
    raise exception 'invalid_agent' using errcode='22023';
  end if;
  if p_tool_id is null or length(p_tool_id) not between 1 and 80 then
    raise exception 'invalid_tool' using errcode='22023';
  end if;
  if p_intent is null or length(p_intent) not between 1 and 240 then
    raise exception 'invalid_intent' using errcode='22023';
  end if;
  if p_risk not in ('low','medium') then
    raise exception 'invalid_risk' using errcode='22023';
  end if;
  if p_status not in ('AUTHORIZED','EXECUTED','BLOCKED','FAILED') then
    raise exception 'invalid_status' using errcode='22023';
  end if;
  if p_reason is null or length(p_reason) not between 1 and 240 then
    raise exception 'invalid_reason' using errcode='22023';
  end if;
  if p_payload_digest is null or p_payload_digest !~ '^[0-9a-f]{32}$' then
    raise exception 'invalid_payload_digest' using errcode='22023';
  end if;

  insert into public.omega_agent_operations(
    user_id,agent_name,tool_id,intent,risk,status,reason,payload_digest
  )
  values(
    p_user_id,p_agent_name,p_tool_id,p_intent,p_risk,p_status,p_reason,p_payload_digest
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.omega_record_agent_operation(uuid,text,text,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.omega_record_agent_operation(uuid,text,text,text,text,text,text,text)
  to service_role;
