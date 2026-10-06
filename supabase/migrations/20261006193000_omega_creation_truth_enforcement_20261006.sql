-- Ω Creation Layer truth enforcement
-- Prevents authenticated clients from writing provider-owned truth/status fields directly.
-- Public RPCs are invoker wrappers; privileged writes live in private schema.

create schema if not exists private;

create or replace function private.omega_create_creative_project(p_name text,p_description text default null,p_project_type text default 'MIXED',p_metadata jsonb default '{}'::jsonb)
returns public.omega_creative_projects
language plpgsql security definer set search_path=''
as $$
declare r public.omega_creative_projects;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if p_name is null or btrim(p_name)='' then raise exception 'project_name_required'; end if;
  if p_project_type not in ('IMAGE','VIDEO','MOVIE','GAME','WORLD','MIXED') then raise exception 'invalid_project_type'; end if;
  insert into public.omega_creative_projects(owner_id,name,description,project_type,status,truth_state,metadata)
  values((select auth.uid()),btrim(p_name),p_description,p_project_type,'DRAFT','USER-CREATED',coalesce(p_metadata,'{}'::jsonb))
  returning * into r;
  return r;
end $$;

create or replace function public.omega_create_creative_project(p_name text,p_description text default null,p_project_type text default 'MIXED',p_metadata jsonb default '{}'::jsonb)
returns public.omega_creative_projects language sql security invoker set search_path=''
as $$ select private.omega_create_creative_project(p_name,p_description,p_project_type,p_metadata) $$;

create or replace function private.omega_update_creative_project(p_project_id uuid,p_name text,p_description text,p_project_type text,p_metadata jsonb)
returns public.omega_creative_projects
language plpgsql security definer set search_path=''
as $$
declare r public.omega_creative_projects;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.omega_creative_projects where id=p_project_id and owner_id=(select auth.uid())) then raise exception 'project_not_found'; end if;
  if p_name is null or btrim(p_name)='' then raise exception 'project_name_required'; end if;
  if p_project_type not in ('IMAGE','VIDEO','MOVIE','GAME','WORLD','MIXED') then raise exception 'invalid_project_type'; end if;
  update public.omega_creative_projects set name=btrim(p_name),description=p_description,project_type=p_project_type,metadata=coalesce(p_metadata,'{}'::jsonb),updated_at=now()
  where id=p_project_id and owner_id=(select auth.uid()) returning * into r;
  return r;
end $$;

create or replace function public.omega_update_creative_project(p_project_id uuid,p_name text,p_description text,p_project_type text,p_metadata jsonb)
returns public.omega_creative_projects language sql security invoker set search_path=''
as $$ select private.omega_update_creative_project(p_project_id,p_name,p_description,p_project_type,p_metadata) $$;

create or replace function private.omega_create_creative_asset(p_project_id uuid,p_parent_asset_id uuid default null,p_asset_type text default 'OTHER',p_title text default 'Untitled asset',p_prompt text default null,p_license text default null,p_metadata jsonb default '{}'::jsonb)
returns public.omega_creative_assets
language plpgsql security definer set search_path=''
as $$
declare r public.omega_creative_assets;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.omega_creative_projects where id=p_project_id and owner_id=(select auth.uid())) then raise exception 'project_not_found'; end if;
  if p_asset_type not in ('IMAGE','VIDEO','MOVIE','AUDIO','GAME_BUILD','MODEL','TEXT','DATA','OTHER') then raise exception 'invalid_asset_type'; end if;
  insert into public.omega_creative_assets(project_id,owner_id,parent_asset_id,asset_type,title,prompt,status,truth_state,license,provenance,metadata)
  values(p_project_id,(select auth.uid()),p_parent_asset_id,p_asset_type,coalesce(nullif(btrim(p_title),''),'Untitled asset'),p_prompt,'DESIGNED','USER-CREATED',p_license,jsonb_build_object('origin','USER-CREATED','verified',false,'recorded_at',now()),coalesce(p_metadata,'{}'::jsonb))
  returning * into r;
  return r;
end $$;

create or replace function public.omega_create_creative_asset(p_project_id uuid,p_parent_asset_id uuid default null,p_asset_type text default 'OTHER',p_title text default 'Untitled asset',p_prompt text default null,p_license text default null,p_metadata jsonb default '{}'::jsonb)
returns public.omega_creative_assets language sql security invoker set search_path=''
as $$ select private.omega_create_creative_asset(p_project_id,p_parent_asset_id,p_asset_type,p_title,p_prompt,p_license,p_metadata) $$;

create or replace function private.omega_update_creative_asset(p_asset_id uuid,p_title text,p_prompt text,p_license text,p_metadata jsonb)
returns public.omega_creative_assets
language plpgsql security definer set search_path=''
as $$
declare r public.omega_creative_assets;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  update public.omega_creative_assets set title=coalesce(nullif(btrim(p_title),''),title),prompt=p_prompt,license=p_license,metadata=coalesce(p_metadata,'{}'::jsonb),updated_at=now()
  where id=p_asset_id and owner_id=(select auth.uid()) and status not in ('READY','ARCHIVED') returning * into r;
  if not found then raise exception 'asset_not_found_or_immutable'; end if;
  return r;
end $$;

create or replace function public.omega_update_creative_asset(p_asset_id uuid,p_title text,p_prompt text,p_license text,p_metadata jsonb)
returns public.omega_creative_assets language sql security invoker set search_path=''
as $$ select private.omega_update_creative_asset(p_asset_id,p_title,p_prompt,p_license,p_metadata) $$;

create or replace function private.omega_create_experience(p_project_id uuid,p_slug text,p_name text,p_experience_type text,p_rules jsonb default '{}'::jsonb,p_content jsonb default '{}'::jsonb)
returns public.omega_experience_definitions
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_definitions;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.omega_creative_projects where id=p_project_id and owner_id=(select auth.uid())) then raise exception 'project_not_found'; end if;
  if p_experience_type not in ('GAME','SIMULATION','STORY','INTERACTIVE_MOVIE','TRAINING','PUZZLE','WORLD') then raise exception 'invalid_experience_type'; end if;
  if p_slug is null or btrim(p_slug)='' or p_name is null or btrim(p_name)='' then raise exception 'experience_identity_required'; end if;
  insert into public.omega_experience_definitions(owner_id,project_id,slug,name,experience_type,version,status,rules,content,truth_state)
  values((select auth.uid()),p_project_id,btrim(p_slug),btrim(p_name),p_experience_type,1,'DRAFT',coalesce(p_rules,'{}'::jsonb),coalesce(p_content,'{}'::jsonb),'SIMULATED')
  returning * into r;
  return r;
end $$;

create or replace function public.omega_create_experience(p_project_id uuid,p_slug text,p_name text,p_experience_type text,p_rules jsonb default '{}'::jsonb,p_content jsonb default '{}'::jsonb)
returns public.omega_experience_definitions language sql security invoker set search_path=''
as $$ select private.omega_create_experience(p_project_id,p_slug,p_name,p_experience_type,p_rules,p_content) $$;

create or replace function private.omega_update_experience(p_experience_id uuid,p_name text,p_rules jsonb,p_content jsonb)
returns public.omega_experience_definitions
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_definitions;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  update public.omega_experience_definitions set name=coalesce(nullif(btrim(p_name),''),name),rules=coalesce(p_rules,'{}'::jsonb),content=coalesce(p_content,'{}'::jsonb),updated_at=now()
  where id=p_experience_id and owner_id=(select auth.uid()) and status <> 'RETIRED' returning * into r;
  if not found then raise exception 'experience_not_found_or_retired'; end if;
  return r;
end $$;

create or replace function public.omega_update_experience(p_experience_id uuid,p_name text,p_rules jsonb,p_content jsonb)
returns public.omega_experience_definitions language sql security invoker set search_path=''
as $$ select private.omega_update_experience(p_experience_id,p_name,p_rules,p_content) $$;

create or replace function private.omega_publish_experience(p_experience_id uuid)
returns public.omega_experience_definitions
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_definitions;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  update public.omega_experience_definitions set status='PUBLISHED',truth_state='SIMULATED',updated_at=now()
  where id=p_experience_id and owner_id=(select auth.uid()) and status='DRAFT';
  if not found then raise exception 'experience_not_found_or_not_publishable'; end if;
  select * into r from public.omega_experience_definitions where id=p_experience_id;
  return r;
end $$;

create or replace function public.omega_publish_experience(p_experience_id uuid)
returns public.omega_experience_definitions language sql security invoker set search_path=''
as $$ select private.omega_publish_experience(p_experience_id) $$;

create or replace function private.omega_start_experience_run(p_experience_id uuid)
returns public.omega_experience_runs
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_runs;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if not exists(select 1 from public.omega_experience_definitions where id=p_experience_id and status='PUBLISHED') then raise exception 'experience_not_published'; end if;
  insert into public.omega_experience_runs(experience_id,user_id,status,state) values(p_experience_id,(select auth.uid()),'ACTIVE','{}'::jsonb) returning * into r;
  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,idempotency_key,schema_version,source,entity_type,entity_id,payload)
  values('experience_started','/creation',(select auth.uid()),jsonb_build_object('experience_id',p_experience_id),gen_random_uuid(),'user',r.id,'creation:experience_started:'||r.id,'1','creation','experience_run',r.id::text,jsonb_build_object('experience_id',p_experience_id,'run_id',r.id));
  return r;
end $$;

create or replace function public.omega_start_experience_run(p_experience_id uuid)
returns public.omega_experience_runs language sql security invoker set search_path=''
as $$ select private.omega_start_experience_run(p_experience_id) $$;

create or replace function private.omega_step_experience_run(p_run_id uuid,p_state_patch jsonb)
returns public.omega_experience_runs
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_runs;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  if p_state_patch is null then raise exception 'state_patch_required'; end if;
  update public.omega_experience_runs set state=coalesce(state,'{}'::jsonb)||p_state_patch,last_event_at=now()
  where id=p_run_id and user_id=(select auth.uid()) and status='ACTIVE' returning * into r;
  if not found then raise exception 'run_not_found_or_inactive'; end if;
  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,idempotency_key,schema_version,source,entity_type,entity_id,payload)
  values('experience_step','/creation',(select auth.uid()),jsonb_build_object('run_id',r.id),gen_random_uuid(),'user',r.id,'creation:experience_step:'||r.id||':'||extract(epoch from r.last_event_at)::bigint,'1','creation','experience_run',r.id::text,jsonb_build_object('run_id',r.id,'state_keys',(select coalesce(jsonb_agg(k),'[]'::jsonb) from jsonb_object_keys(p_state_patch) as k)));
  return r;
end $$;

create or replace function public.omega_step_experience_run(p_run_id uuid,p_state_patch jsonb)
returns public.omega_experience_runs language sql security invoker set search_path=''
as $$ select private.omega_step_experience_run(p_run_id,p_state_patch) $$;

create or replace function private.omega_abandon_experience_run(p_run_id uuid)
returns public.omega_experience_runs
language plpgsql security definer set search_path=''
as $$
declare r public.omega_experience_runs;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  update public.omega_experience_runs set status='ABANDONED',last_event_at=now()
  where id=p_run_id and user_id=(select auth.uid()) and status in ('ACTIVE','PAUSED') returning * into r;
  if not found then raise exception 'run_not_found_or_not_abandonable'; end if;
  insert into public.omega_platform_events(event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,idempotency_key,schema_version,source,entity_type,entity_id,payload)
  values('experience_abandoned','/creation',(select auth.uid()),jsonb_build_object('run_id',r.id),gen_random_uuid(),'user',r.id,'creation:experience_abandoned:'||r.id,'1','creation','experience_run',r.id::text,jsonb_build_object('run_id',r.id));
  return r;
end $$;

create or replace function public.omega_abandon_experience_run(p_run_id uuid)
returns public.omega_experience_runs language sql security invoker set search_path=''
as $$ select private.omega_abandon_experience_run(p_run_id) $$;

drop policy if exists "omega_experience_definitions_published_read" on public.omega_experience_definitions;
create policy "omega_experience_definitions_published_read" on public.omega_experience_definitions for select to authenticated
using (status='PUBLISHED' or (select auth.uid())=owner_id);

revoke insert,update,delete on public.omega_creative_projects from authenticated;
revoke insert,update,delete on public.omega_creative_assets from authenticated;
revoke insert,update,delete on public.omega_experience_definitions from authenticated;
revoke insert,update,delete on public.omega_experience_runs from authenticated;

revoke execute on function public.omega_create_creative_project(text,text,text,jsonb),public.omega_update_creative_project(uuid,text,text,text,jsonb),public.omega_create_creative_asset(uuid,uuid,text,text,text,text,jsonb),public.omega_update_creative_asset(uuid,text,text,text,jsonb),public.omega_create_experience(uuid,text,text,text,jsonb,jsonb),public.omega_update_experience(uuid,text,jsonb,jsonb),public.omega_publish_experience(uuid),public.omega_start_experience_run(uuid),public.omega_step_experience_run(uuid,jsonb),public.omega_abandon_experience_run(uuid) from public,anon;
grant execute on function public.omega_create_creative_project(text,text,text,jsonb),public.omega_update_creative_project(uuid,text,text,text,jsonb),public.omega_create_creative_asset(uuid,uuid,text,text,text,text,jsonb),public.omega_update_creative_asset(uuid,text,text,text,jsonb),public.omega_create_experience(uuid,text,text,text,jsonb,jsonb),public.omega_update_experience(uuid,text,jsonb,jsonb),public.omega_publish_experience(uuid),public.omega_start_experience_run(uuid),public.omega_step_experience_run(uuid,jsonb),public.omega_abandon_experience_run(uuid) to authenticated;

revoke all on function private.omega_create_creative_project(text,text,text,jsonb),private.omega_update_creative_project(uuid,text,text,text,jsonb),private.omega_create_creative_asset(uuid,uuid,text,text,text,text,jsonb),private.omega_update_creative_asset(uuid,text,text,text,jsonb),private.omega_create_experience(uuid,text,text,text,jsonb,jsonb),private.omega_update_experience(uuid,text,jsonb,jsonb),private.omega_publish_experience(uuid),private.omega_start_experience_run(uuid),private.omega_step_experience_run(uuid,jsonb),private.omega_abandon_experience_run(uuid) from public,anon,authenticated;
