-- Ω MISSION TASK REALITY
begin;
create table if not exists public.omega_mission_tasks (
  id uuid primary key default gen_random_uuid(), mission_id uuid not null references public.omega_missions(id) on delete cascade,
  task_key text not null, title text not null, description text,
  authorization_policy jsonb not null default '{}'::jsonb, risk_level text not null default 'LOW',
  action_route text, required_event_types jsonb not null default '[]'::jsonb,
  required_event_metadata jsonb not null default '{}'::jsonb, outcome_rule jsonb not null default '{}'::jsonb,
  status text not null default 'active', version integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(mission_id,task_key,version),
  check(jsonb_typeof(required_event_types)='array'),check(jsonb_typeof(required_event_metadata)='object'),
  check(jsonb_typeof(authorization_policy)='object'),check(jsonb_typeof(outcome_rule)='object'),
  check(risk_level in ('LOW','MEDIUM','HIGH','CRITICAL')),check(status in ('draft','active','retired'))
);
create table if not exists public.omega_member_mission_tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  mission_task_id uuid not null references public.omega_mission_tasks(id) on delete cascade,
  mission_state_id uuid not null references public.omega_member_mission_state(id) on delete cascade,
  status text not null default 'available', accepted_at timestamptz, started_at timestamptz, blocked_at timestamptz,
  submitted_at timestamptz, verified_at timestamptz, completed_at timestamptz, failed_at timestamptz,
  cancelled_at timestamptz, expired_at timestamptz, evidence_event_ids bigint[] not null default '{}',
  graph_evidence_ids uuid[] not null default '{}', authorization_snapshot jsonb not null default '{}'::jsonb,
  outcome jsonb not null default '{}'::jsonb, idempotency_key text, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique(user_id,mission_task_id,mission_state_id),
  check(status in ('available','accepted','started','blocked','submitted','verified','completed','failed','cancelled','expired')),
  check(jsonb_typeof(authorization_snapshot)='object'),check(jsonb_typeof(outcome)='object')
);
create index if not exists omega_mission_tasks_mission_idx on public.omega_mission_tasks(mission_id,status);
create index if not exists omega_member_mission_tasks_user_idx on public.omega_member_mission_tasks(user_id,status,updated_at desc);
create index if not exists omega_member_mission_tasks_state_idx on public.omega_member_mission_tasks(mission_state_id,status);
alter table public.omega_mission_tasks enable row level security;
alter table public.omega_member_mission_tasks enable row level security;
drop policy if exists omega_mission_tasks_authenticated_read on public.omega_mission_tasks;
create policy omega_mission_tasks_authenticated_read on public.omega_mission_tasks for select to authenticated using(status='active');
drop policy if exists omega_member_mission_tasks_owner_read on public.omega_member_mission_tasks;
create policy omega_member_mission_tasks_owner_read on public.omega_member_mission_tasks for select to authenticated using(user_id=(select auth.uid()));
create or replace function private.omega_seed_member_mission_tasks() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.status='active' then
  insert into public.omega_member_mission_tasks(user_id,mission_task_id,mission_state_id,authorization_snapshot,status)
  select new.user_id,t.id,new.id,t.authorization_policy,'available'
  from public.omega_mission_tasks t where t.mission_id=new.mission_id and t.status='active'
  on conflict(user_id,mission_task_id,mission_state_id) do nothing;
 end if; return new;
end; $$;
drop trigger if exists omega_seed_member_mission_tasks on public.omega_member_mission_state;
create trigger omega_seed_member_mission_tasks after insert or update of status on public.omega_member_mission_state
for each row execute function private.omega_seed_member_mission_tasks();
insert into public.omega_mission_tasks(mission_id,task_key,title,description,authorization_policy,risk_level,action_route,required_event_types,required_event_metadata,outcome_rule,status,version)
select m.id,m.mission_key||'.execute',m.title||' — EXECUTE',coalesce(m.description,'Complete the mission action and provide the required evidence.'),
 jsonb_build_object('actor','authenticated_member','mission_id',m.id,'mission_key',m.mission_key),'LOW','/missions.html',
 coalesce(m.completion_rule->'required_event_types','[]'::jsonb),coalesce(m.completion_rule->'required_event_metadata','{}'::jsonb),
 jsonb_build_object('completion','evidence_verified','mission_id',m.id),'active',m.version
from public.omega_missions m where m.status='active'
on conflict(mission_id,task_key,version) do update set title=excluded.title,description=excluded.description,
 authorization_policy=excluded.authorization_policy,required_event_types=excluded.required_event_types,
 required_event_metadata=excluded.required_event_metadata,outcome_rule=excluded.outcome_rule,updated_at=now();
insert into public.omega_member_mission_tasks(user_id,mission_task_id,mission_state_id,authorization_snapshot,status)
select ms.user_id,t.id,ms.id,t.authorization_policy,'available'
from public.omega_member_mission_state ms join public.omega_mission_tasks t on t.mission_id=ms.mission_id and t.status='active'
where ms.status='active' on conflict(user_id,mission_task_id,mission_state_id) do nothing;
create or replace function public.omega_member_mission_task_surface() returns setof public.omega_member_mission_tasks
language sql security invoker as $$ select t.* from public.omega_member_mission_tasks t where t.user_id=(select auth.uid()) order by t.updated_at desc; $$;
revoke execute on function public.omega_member_mission_task_surface() from public,anon;
grant execute on function public.omega_member_mission_task_surface() to authenticated;
commit;
