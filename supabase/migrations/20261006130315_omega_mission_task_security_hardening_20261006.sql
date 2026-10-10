begin;

create or replace function public.omega_member_mission_task_surface()
returns setof public.omega_member_mission_tasks
language sql
security invoker
set search_path=''
as $$
 select t.*
 from public.omega_member_mission_tasks t
 where t.user_id=(select auth.uid())
 order by t.updated_at desc;
$$;

create or replace function private.omega_transition_mission_task(
  p_member_task_id uuid,
  p_to_status text,
  p_evidence_event_ids bigint[] default '{}',
  p_graph_evidence_ids uuid[] default '{}',
  p_idempotency_key text default null,
  p_reason text default null
)
returns public.omega_member_mission_tasks
language plpgsql
security definer
set search_path=''
as $$
declare v_user_id uuid := (select auth.uid()); v_task public.omega_member_mission_tasks; v_from text;
begin
 if v_user_id is null then raise exception 'authentication required' using errcode='42501'; end if;
 if p_to_status not in ('available','accepted','started','blocked','submitted','verified','completed','failed','cancelled','expired') then raise exception 'invalid task status' using errcode='22023'; end if;
 select * into v_task from public.omega_member_mission_tasks where id=p_member_task_id and user_id=v_user_id for update;
 if not found then raise exception 'member mission task not found' using errcode='P0002'; end if;
 if p_idempotency_key is not null and exists(select 1 from public.omega_mission_task_transitions where user_id=v_user_id and idempotency_key=p_idempotency_key) then return v_task; end if;
 v_from:=v_task.status;
 if v_from=p_to_status then return v_task; end if;
 if not ((v_from='available' and p_to_status='accepted') or (v_from='accepted' and p_to_status='started') or (v_from='started' and p_to_status in ('blocked','submitted','failed','cancelled','expired')) or (v_from='blocked' and p_to_status='started') or (v_from='submitted' and p_to_status='verified') or (v_from='verified' and p_to_status='completed')) then raise exception 'invalid mission task transition: % -> %',v_from,p_to_status using errcode='22023'; end if;
 if p_to_status in ('submitted','verified','completed') and cardinality(coalesce(p_evidence_event_ids,'{}'::bigint[]))=0 and cardinality(coalesce(p_graph_evidence_ids,'{}'::uuid[]))=0 then raise exception 'evidence required for submitted/verified/completed task' using errcode='22023'; end if;
 if exists(select 1 from unnest(coalesce(p_evidence_event_ids,'{}'::bigint[])) x(id) where not exists(select 1 from public.omega_platform_events e where e.id=x.id and e.actor_user_id=v_user_id)) then raise exception 'evidence event is not owned by authenticated member' using errcode='42501'; end if;
 if exists(select 1 from unnest(coalesce(p_graph_evidence_ids,'{}'::uuid[])) x(id) where not exists(select 1 from public.graph_evidence ge where ge.id=x.id and ge.user_id=v_user_id)) then raise exception 'graph evidence is not owned by authenticated member' using errcode='42501'; end if;
 update public.omega_member_mission_tasks set status=p_to_status,
 accepted_at=case when p_to_status='accepted' then coalesce(accepted_at,now()) else accepted_at end,
 started_at=case when p_to_status='started' then coalesce(started_at,now()) else started_at end,
 blocked_at=case when p_to_status='blocked' then now() else blocked_at end,
 submitted_at=case when p_to_status='submitted' then now() else submitted_at end,
 verified_at=case when p_to_status='verified' then now() else verified_at end,
 completed_at=case when p_to_status='completed' then now() else completed_at end,
 failed_at=case when p_to_status='failed' then now() else failed_at end,
 cancelled_at=case when p_to_status='cancelled' then now() else cancelled_at end,
 expired_at=case when p_to_status='expired' then now() else expired_at end,
 evidence_event_ids=case when cardinality(coalesce(p_evidence_event_ids,'{}'::bigint[]))>0 then p_evidence_event_ids else evidence_event_ids end,
 graph_evidence_ids=case when cardinality(coalesce(p_graph_evidence_ids,'{}'::uuid[]))>0 then p_graph_evidence_ids else graph_evidence_ids end,
 idempotency_key=coalesce(p_idempotency_key,idempotency_key),
 outcome=case when p_to_status in ('verified','completed') then jsonb_build_object('verified',true,'verified_at',now()) else outcome end,
 updated_at=now() where id=v_task.id returning * into v_task;
 insert into public.omega_mission_task_transitions(user_id,member_task_id,from_status,to_status,evidence_event_ids,graph_evidence_ids,idempotency_key,reason)
 values(v_user_id,v_task.id,v_from,p_to_status,coalesce(p_evidence_event_ids,'{}'),coalesce(p_graph_evidence_ids,'{}'),p_idempotency_key,p_reason);
 return v_task;
end;
$$;

create or replace function public.omega_transition_mission_task(
 p_member_task_id uuid,p_to_status text,p_evidence_event_ids bigint[] default '{}',
 p_graph_evidence_ids uuid[] default '{}',p_idempotency_key text default null,p_reason text default null
)
returns public.omega_member_mission_tasks
language sql
security invoker
set search_path=''
as $$
 select private.omega_transition_mission_task($1,$2,$3,$4,$5,$6);
$$;

revoke execute on function private.omega_transition_mission_task(uuid,text,bigint[],uuid[],text,text) from public,anon,authenticated;
revoke execute on function public.omega_transition_mission_task(uuid,text,bigint[],uuid[],text,text) from public,anon;
grant execute on function public.omega_transition_mission_task(uuid,text,bigint[],uuid[],text,text) to authenticated;

commit;
