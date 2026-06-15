-- Ω SYD OMEGA 91717 — full schema (safe to run any number of times)

alter table public.profiles
  add column if not exists axis_a numeric not null default 1,
  add column if not exists axis_b numeric not null default 1,
  add column if not exists axis_c numeric not null default 1,
  add column if not exists display_name text,
  add column if not exists creed text,
  add column if not exists pledge text;

create table if not exists public.evolution_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  axis text not null, note text, delta numeric not null default 0.25,
  created_at timestamptz default now());
alter table public.evolution_events enable row level security;
drop policy if exists "own events read" on public.evolution_events;
create policy "own events read" on public.evolution_events for select to authenticated using (auth.uid()=user_id);
grant select on public.evolution_events to authenticated;

create table if not exists public.certificates (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  milestone int not null, title text not null, issued_at timestamptz default now(),
  unique (user_id, milestone));
alter table public.certificates enable row level security;
drop policy if exists "own certs read" on public.certificates;
create policy "own certs read" on public.certificates for select to authenticated using (auth.uid()=user_id);
grant select on public.certificates to authenticated;

create table if not exists public.lesson_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson text not null, completed_at timestamptz default now(),
  unique (user_id, lesson));
alter table public.lesson_completions enable row level security;
drop policy if exists "own lessons read" on public.lesson_completions;
create policy "own lessons read" on public.lesson_completions for select to authenticated using (auth.uid()=user_id);
grant select on public.lesson_completions to authenticated;

create table if not exists public.task_completions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null, task text not null, completed_at timestamptz default now(),
  unique (user_id, kind, task));
alter table public.task_completions enable row level security;
drop policy if exists "own tasks read" on public.task_completions;
create policy "own tasks read" on public.task_completions for select to authenticated using (auth.uid()=user_id);
grant select on public.task_completions to authenticated;

create or replace function public.log_evolution(p_axis text, p_note text)
returns public.profiles language plpgsql security definer set search_path=public as $$
declare v_delta numeric:=0.25; v_uid uuid:=auth.uid(); v_row public.profiles; v_min numeric;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_axis not in ('a','b','c') then raise exception 'invalid axis'; end if;
  insert into public.evolution_events(user_id,axis,note,delta) values (v_uid,p_axis,left(coalesce(p_note,''),280),v_delta);
  update public.profiles set
    axis_a=case when p_axis='a' then least(9,coalesce(axis_a,1)+v_delta) else axis_a end,
    axis_b=case when p_axis='b' then least(9,coalesce(axis_b,1)+v_delta) else axis_b end,
    axis_c=case when p_axis='c' then least(9,coalesce(axis_c,1)+v_delta) else axis_c end
  where id=v_uid returning * into v_row;
  v_min:=least(v_row.axis_a,v_row.axis_b,v_row.axis_c);
  if v_min>=3 then insert into public.certificates(user_id,milestone,title) values (v_uid,3,'First Ascension — Node (3,3,3), Iron') on conflict (user_id,milestone) do nothing; end if;
  if v_min>=6 then insert into public.certificates(user_id,milestone,title) values (v_uid,6,'Ascendant — Node (6,6,6), Carbon') on conflict (user_id,milestone) do nothing; end if;
  if v_min>=9 then insert into public.certificates(user_id,milestone,title) values (v_uid,9,'Omega Master — Apex (9,9,9)') on conflict (user_id,milestone) do nothing; end if;
  return v_row;
end; $$;
grant execute on function public.log_evolution(text,text) to authenticated;

create or replace function public.complete_lesson(p_lesson text, p_title text)
returns json language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_delta numeric:=0.25; v_row public.profiles; v_min numeric; v_new boolean:=false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  insert into public.lesson_completions(user_id,lesson) values (v_uid,p_lesson) on conflict (user_id,lesson) do nothing;
  if found then v_new:=true; end if;
  if v_new then
    insert into public.evolution_events(user_id,axis,note,delta) values (v_uid,'a',left('Academy: '||coalesce(p_title,''),280),v_delta);
    update public.profiles set axis_a=least(9,coalesce(axis_a,1)+v_delta) where id=v_uid returning * into v_row;
    v_min:=least(v_row.axis_a,v_row.axis_b,v_row.axis_c);
    if v_min>=3 then insert into public.certificates(user_id,milestone,title) values (v_uid,3,'First Ascension — Node (3,3,3), Iron') on conflict (user_id,milestone) do nothing; end if;
    if v_min>=6 then insert into public.certificates(user_id,milestone,title) values (v_uid,6,'Ascendant — Node (6,6,6), Carbon') on conflict (user_id,milestone) do nothing; end if;
    if v_min>=9 then insert into public.certificates(user_id,milestone,title) values (v_uid,9,'Omega Master — Apex (9,9,9)') on conflict (user_id,milestone) do nothing; end if;
  else select * into v_row from public.profiles where id=v_uid; end if;
  return json_build_object('new',v_new);
end; $$;
grant execute on function public.complete_lesson(text,text) to authenticated;

create or replace function public.complete_task(p_kind text, p_task text, p_axis text, p_title text)
returns json language plpgsql security definer set search_path=public as $$
declare v_uid uuid:=auth.uid(); v_delta numeric:=0.25; v_row public.profiles; v_min numeric; v_new boolean:=false;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_axis not in ('a','b','c') then raise exception 'invalid axis'; end if;
  insert into public.task_completions(user_id,kind,task) values (v_uid,p_kind,p_task) on conflict (user_id,kind,task) do nothing;
  if found then v_new:=true; end if;
  if v_new then
    insert into public.evolution_events(user_id,axis,note,delta) values (v_uid,p_axis,left(coalesce(p_title,''),280),v_delta);
    update public.profiles set
      axis_a=case when p_axis='a' then least(9,coalesce(axis_a,1)+v_delta) else axis_a end,
      axis_b=case when p_axis='b' then least(9,coalesce(axis_b,1)+v_delta) else axis_b end,
      axis_c=case when p_axis='c' then least(9,coalesce(axis_c,1)+v_delta) else axis_c end
    where id=v_uid returning * into v_row;
    v_min:=least(v_row.axis_a,v_row.axis_b,v_row.axis_c);
    if v_min>=3 then insert into public.certificates(user_id,milestone,title) values (v_uid,3,'First Ascension — Node (3,3,3), Iron') on conflict (user_id,milestone) do nothing; end if;
    if v_min>=6 then insert into public.certificates(user_id,milestone,title) values (v_uid,6,'Ascendant — Node (6,6,6), Carbon') on conflict (user_id,milestone) do nothing; end if;
    if v_min>=9 then insert into public.certificates(user_id,milestone,title) values (v_uid,9,'Omega Master — Apex (9,9,9)') on conflict (user_id,milestone) do nothing; end if;
  else select * into v_row from public.profiles where id=v_uid; end if;
  return json_build_object('new',v_new);
end; $$;
grant execute on function public.complete_task(text,text,text,text) to authenticated;

create or replace function public.order_stats()
returns json language sql security definer set search_path=public stable as $$
  select json_build_object(
    'members',(select count(*) from public.profiles where sign is not null),
    'certificates',(select count(*) from public.certificates),
    'events',(select count(*) from public.evolution_events),
    'elements',(select coalesce(json_object_agg(element,c),'{}'::json) from (select element,count(*) c from public.profiles where element is not null group by element) e));
$$;
grant execute on function public.order_stats() to anon, authenticated;
