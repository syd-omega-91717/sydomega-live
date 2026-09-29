create table if not exists public.omega_agent_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  agent_name text not null check (length(agent_name) between 1 and 40),
  tool_id text not null check (length(tool_id) between 1 and 80),
  intent text not null check (length(intent) between 1 and 240),
  risk text not null check (risk in ('low','medium')),
  status text not null check (status in ('AUTHORIZED','EXECUTED','BLOCKED','FAILED')),
  reason text not null check (length(reason) between 1 and 240),
  payload_digest text not null check (payload_digest ~ '^[0-9a-f]{32}$'),
  created_at timestamptz not null default now()
);
alter table public.omega_agent_operations enable row level security;
drop policy if exists omega_agent_operations_select_own on public.omega_agent_operations;
create policy omega_agent_operations_select_own on public.omega_agent_operations for select to authenticated using ((select auth.uid()) = user_id);
revoke all on table public.omega_agent_operations from anon, authenticated;
grant select on table public.omega_agent_operations to authenticated;
create index if not exists omega_agent_operations_user_created_idx on public.omega_agent_operations (user_id, created_at desc);
create or replace function public.omega_record_agent_operation(p_agent_name text,p_tool_id text,p_intent text,p_risk text,p_status text,p_reason text,p_payload_digest text)
returns public.omega_agent_operations language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid := (select auth.uid()); v_row public.omega_agent_operations;
begin
 if v_user_id is null then raise exception 'not_authenticated' using errcode='28000'; end if;
 if p_agent_name is null or length(p_agent_name) not between 1 and 40 then raise exception 'invalid_agent' using errcode='22023'; end if;
 if p_tool_id is null or length(p_tool_id) not between 1 and 80 then raise exception 'invalid_tool' using errcode='22023'; end if;
 if p_intent is null or length(p_intent) not between 1 and 240 then raise exception 'invalid_intent' using errcode='22023'; end if;
 if p_risk not in ('low','medium') then raise exception 'invalid_risk' using errcode='22023'; end if;
 if p_status not in ('AUTHORIZED','EXECUTED','BLOCKED','FAILED') then raise exception 'invalid_status' using errcode='22023'; end if;
 if p_reason is null or length(p_reason) not between 1 and 240 then raise exception 'invalid_reason' using errcode='22023'; end if;
 if p_payload_digest is null or p_payload_digest !~ '^[0-9a-f]{32}$' then raise exception 'invalid_payload_digest' using errcode='22023'; end if;
 insert into public.omega_agent_operations(user_id,agent_name,tool_id,intent,risk,status,reason,payload_digest)
 values(v_user_id,p_agent_name,p_tool_id,p_intent,p_risk,p_status,p_reason,p_payload_digest) returning * into v_row;
 return v_row;
end; $$;
revoke execute on function public.omega_record_agent_operation(text,text,text,text,text,text,text) from public, anon;
grant execute on function public.omega_record_agent_operation(text,text,text,text,text,text,text) to authenticated;