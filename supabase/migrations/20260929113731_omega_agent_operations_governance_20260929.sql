-- Ω SYD OMEGA 91717 — governed Agent Operations proposal boundary
-- Proposal/approval governance only. No tool executor is introduced here.

create table if not exists public.omega_agent_tool_registry (
  tool_id text primary key, display_name text not null,
  risk text not null check (risk in ('READ','ANALYZE','WRITE','PRIVILEGED','EXTERNAL','DESTRUCTIVE')),
  permission text not null, network_access boolean not null default false,
  filesystem_access boolean not null default false, database_access boolean not null default false,
  mutation boolean not null default false, requires_approval boolean not null default true,
  execution_status text not null default 'PROPOSAL_ONLY' check (execution_status in ('PROPOSAL_ONLY','EXECUTOR_CONNECTED','RETIRED')),
  audit_event_type text not null, rollback_policy text not null, created_at timestamptz not null default now()
);

insert into public.omega_agent_tool_registry
(tool_id,display_name,risk,permission,network_access,filesystem_access,database_access,mutation,requires_approval,execution_status,audit_event_type,rollback_policy)
values
('world.read_state','Read World state','READ','member-read',false,false,true,false,true,'PROPOSAL_ONLY','agent_tool_proposal','read-only'),
('mission.read_state','Read mission state','READ','member-read',false,false,true,false,true,'PROPOSAL_ONLY','agent_tool_proposal','read-only'),
('evidence.read','Read evidence/provenance','READ','member-read',false,false,true,false,true,'PROPOSAL_ONLY','agent_tool_proposal','read-only'),
('simulation.run','Run deterministic simulation','ANALYZE','member-analyze',false,false,true,false,true,'PROPOSAL_ONLY','agent_tool_proposal','no-production-mutation'),
('data.export.request','Request governed data export','PRIVILEGED','member-export',false,false,true,true,true,'PROPOSAL_ONLY','agent_tool_proposal','owner-review-required'),
('deployment.verify.request','Request deployment verification','EXTERNAL','owner-ops',true,false,false,false,true,'PROPOSAL_ONLY','agent_tool_proposal','no-rollback-claim')
on conflict (tool_id) do update set display_name=excluded.display_name,risk=excluded.risk,permission=excluded.permission,network_access=excluded.network_access,filesystem_access=excluded.filesystem_access,database_access=excluded.database_access,mutation=excluded.mutation,requires_approval=excluded.requires_approval,execution_status=excluded.execution_status,audit_event_type=excluded.audit_event_type,rollback_policy=excluded.rollback_policy;

insert into public.policy_rules(policy_id,policy_type,effect,description,is_critical,standard) values
('agent:risk_read','approval','require_confirm','Agent READ operations require an explicit governed proposal boundary.',false,'OMEGA_AGENT_GOVERNANCE'),
('agent:risk_analyze','approval','require_confirm','Agent ANALYZE operations require an explicit governed proposal boundary.',false,'OMEGA_AGENT_GOVERNANCE'),
('agent:risk_write','approval','require_owner','Agent WRITE operations require owner approval.',true,'OMEGA_AGENT_GOVERNANCE'),
('agent:risk_privileged','approval','require_owner','Agent PRIVILEGED operations require owner approval.',true,'OMEGA_AGENT_GOVERNANCE'),
('agent:risk_external','approval','require_owner','Agent EXTERNAL operations require owner approval.',true,'OMEGA_AGENT_GOVERNANCE'),
('agent:risk_destructive','guardrail','block','Agent DESTRUCTIVE operations are blocked until a separately reviewed executor exists.',true,'OMEGA_AGENT_GOVERNANCE')
on conflict(policy_id) do nothing;

create table if not exists public.omega_agent_action_proposals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  agent_id text not null check (length(agent_id) between 1 and 80),
  tool_id text not null references public.omega_agent_tool_registry(tool_id),
  risk text not null check (risk in ('READ','ANALYZE','WRITE','PRIVILEGED','EXTERNAL','DESTRUCTIVE')),
  input_snapshot jsonb not null default '{}',
  policy_id text not null references public.policy_rules(policy_id),
  policy_effect text not null,
  status text not null default 'PENDING_REVIEW' check (status in ('PENDING_REVIEW','APPROVED_FOR_FUTURE_EXECUTOR','REJECTED','CANCELLED')),
  decision_reason text, decided_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(), decided_at timestamptz,
  audit_event_id bigint references public.omega_platform_events(id) on delete set null
);

alter table public.omega_agent_tool_registry enable row level security;
alter table public.omega_agent_action_proposals enable row level security;

drop policy if exists omega_agent_tool_registry_read on public.omega_agent_tool_registry;
create policy omega_agent_tool_registry_read on public.omega_agent_tool_registry for select to authenticated using (true);
drop policy if exists omega_agent_action_proposals_select on public.omega_agent_action_proposals;
create policy omega_agent_action_proposals_select on public.omega_agent_action_proposals for select to authenticated using ((select auth.uid()) = user_id or public.is_platform_owner());

revoke all on table public.omega_agent_tool_registry from anon, authenticated;
grant select on table public.omega_agent_tool_registry to authenticated;
revoke all on table public.omega_agent_action_proposals from anon, authenticated;

create index if not exists omega_agent_action_proposals_user_created_idx on public.omega_agent_action_proposals(user_id, created_at desc);
create index if not exists omega_agent_action_proposals_status_created_idx on public.omega_agent_action_proposals(status, created_at desc);

create or replace function private.omega_submit_agent_action_proposal(p_agent_id text,p_tool_id text,p_input_snapshot jsonb default '{}')
returns public.omega_agent_action_proposals language plpgsql security definer set search_path='' as $$
declare v_user_id uuid := (select auth.uid()); v_tool record; v_policy_id text; v_eval jsonb; v_row public.omega_agent_action_proposals; v_event_id bigint;
begin
if v_user_id is null then raise exception 'not_authenticated' using errcode='28000'; end if;
if p_agent_id is null or length(p_agent_id) not between 1 and 80 then raise exception 'invalid_agent_id' using errcode='22023'; end if;
if p_input_snapshot is null or jsonb_typeof(p_input_snapshot)<>'object' then raise exception 'invalid_input_snapshot' using errcode='22023'; end if;
if octet_length(p_input_snapshot::text)>12000 then raise exception 'input_snapshot_too_large' using errcode='22023'; end if;
select * into v_tool from public.omega_agent_tool_registry where tool_id=p_tool_id and execution_status<>'RETIRED';
if not found then raise exception 'tool_not_registered' using errcode='22023'; end if;
v_policy_id := case v_tool.risk when 'READ' then 'agent:risk_read' when 'ANALYZE' then 'agent:risk_analyze' when 'WRITE' then 'agent:risk_write' when 'PRIVILEGED' then 'agent:risk_privileged' when 'EXTERNAL' then 'agent:risk_external' when 'DESTRUCTIVE' then 'agent:risk_destructive' end;
v_eval := public.evaluate_policy(v_policy_id,jsonb_build_object('agent_id',p_agent_id,'tool_id',p_tool_id,'risk',v_tool.risk,'execution_status',v_tool.execution_status));
if coalesce(v_eval->>'effect','block')='block' then raise exception 'agent_tool_blocked' using errcode='42501'; end if;
insert into public.omega_platform_events(event_type,route,actor_user_id,metadata) values ('action_started','/agent-operations.html',v_user_id,jsonb_build_object('schema_version','1','kind','agent_action_proposal','proposal_state','PENDING_REVIEW','agent_id',p_agent_id,'tool_id',p_tool_id,'risk',v_tool.risk,'policy_id',v_policy_id,'policy_effect',v_eval->>'effect')) returning id into v_event_id;
insert into public.omega_agent_action_proposals(user_id,agent_id,tool_id,risk,input_snapshot,policy_id,policy_effect,audit_event_id) values(v_user_id,p_agent_id,p_tool_id,v_tool.risk,p_input_snapshot,v_policy_id,coalesce(v_eval->>'effect','block'),v_event_id) returning * into v_row;
return v_row;
end; $$;

create or replace function private.omega_decide_agent_action_proposal(p_proposal_id uuid,p_approve boolean,p_reason text default null)
returns public.omega_agent_action_proposals language plpgsql security definer set search_path='' as $$
declare v_user_id uuid := (select auth.uid()); v_row public.omega_agent_action_proposals; v_status text;
begin
if v_user_id is null then raise exception 'not_authenticated' using errcode='28000'; end if;
if not public.is_platform_owner() then raise exception 'owner_approval_required' using errcode='42501'; end if;
if p_reason is not null and length(p_reason)>1000 then raise exception 'decision_reason_too_long' using errcode='22023'; end if;
v_status := case when p_approve then 'APPROVED_FOR_FUTURE_EXECUTOR' else 'REJECTED' end;
update public.omega_agent_action_proposals set status=v_status,decision_reason=p_reason,decided_by=v_user_id,decided_at=now() where id=p_proposal_id and status='PENDING_REVIEW' returning * into v_row;
if not found then raise exception 'proposal_not_pending' using errcode='22023'; end if;
insert into public.omega_platform_events(event_type,route,actor_user_id,metadata) values ('action_completed','/agent-operations.html',v_user_id,jsonb_build_object('schema_version','1','kind','agent_action_proposal_decision','proposal_id',p_proposal_id,'decision',v_status,'reason',coalesce(p_reason,'')));
return v_row;
end; $$;

revoke execute on function private.omega_submit_agent_action_proposal(text,text,jsonb) from public,anon,authenticated;
revoke execute on function private.omega_decide_agent_action_proposal(uuid,boolean,text) from public,anon,authenticated;
grant usage on schema private to authenticated;

create or replace function public.omega_submit_agent_action_proposal(p_agent_id text,p_tool_id text,p_input_snapshot jsonb default '{}')
returns public.omega_agent_action_proposals language sql security invoker set search_path='' as $$ select private.omega_submit_agent_action_proposal($1,$2,$3); $$;
create or replace function public.omega_decide_agent_action_proposal(p_proposal_id uuid,p_approve boolean,p_reason text default null)
returns public.omega_agent_action_proposals language sql security invoker set search_path='' as $$ select private.omega_decide_agent_action_proposal($1,$2,$3); $$;
revoke execute on function public.omega_submit_agent_action_proposal(text,text,jsonb) from public,anon;
revoke execute on function public.omega_decide_agent_action_proposal(uuid,boolean,text) from public,anon;
grant execute on function public.omega_submit_agent_action_proposal(text,text,jsonb) to authenticated;
grant execute on function public.omega_decide_agent_action_proposal(uuid,boolean,text) to authenticated;
