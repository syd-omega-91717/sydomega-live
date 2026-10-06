-- Ω Provider Adapter Queue / Worker
-- Durable provider jobs with leasing, retries and server-owned terminal transitions.

alter table public.omega_provider_jobs
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists lease_until timestamptz,
  add column if not exists worker_id text;

create index if not exists omega_provider_jobs_claim_idx
  on public.omega_provider_jobs(status,next_attempt_at,created_at)
  where status in ('QUEUED','RUNNING');

create or replace function private.omega_submit_provider_job(
  p_provider_key text,p_capability text,p_asset_id uuid,p_request jsonb
) returns public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
declare r public.omega_provider_jobs; p public.omega_provider_registry;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required'; end if;
  select * into p from public.omega_provider_registry where provider_key=p_provider_key;
  if not found then raise exception 'provider_not_registered'; end if;
  if p.status='DISABLED' then raise exception 'provider_disabled'; end if;
  if p_asset_id is not null and not exists(
    select 1 from public.omega_creative_assets where id=p_asset_id and owner_id=(select auth.uid())
  ) then raise exception 'asset_not_owned'; end if;
  insert into public.omega_provider_jobs(owner_id,provider_id,asset_id,capability,request,status,next_attempt_at)
  values((select auth.uid()),p.id,p_asset_id,p_capability,coalesce(p_request,'{}'::jsonb),'QUEUED',now())
  returning * into r;
  return r;
end $$;

create or replace function public.omega_submit_provider_job(
  p_provider_key text,p_capability text,p_asset_id uuid,p_request jsonb
) returns public.omega_provider_jobs
language sql security invoker set search_path=''
as $$ select private.omega_submit_provider_job(p_provider_key,p_capability,p_asset_id,p_request) $$;

revoke execute on function public.omega_submit_provider_job(text,text,uuid,jsonb) from public,anon;
grant execute on function public.omega_submit_provider_job(text,text,uuid,jsonb) to authenticated;
revoke all on function private.omega_submit_provider_job(text,text,uuid,jsonb) from public,anon,authenticated;

create or replace function public.omega_claim_provider_jobs(
  p_limit integer,p_worker_id text
) returns setof public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
begin
  if p_worker_id is null or left(p_worker_id,21)<>'omega-provider-worker'
    then raise exception 'invalid_worker_identity'; end if;
  return query
  with candidates as (
    select id from public.omega_provider_jobs
    where status='QUEUED' and next_attempt_at<=now() and attempt_count<max_attempts
    order by created_at for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  )
  update public.omega_provider_jobs j
  set status='RUNNING',attempt_count=j.attempt_count+1,
      started_at=coalesce(j.started_at,now()),
      lease_until=now()+interval '5 minutes',
      worker_id=p_worker_id,updated_at=now()
  from candidates c where j.id=c.id
  returning j.*;
end $$;

revoke execute on function public.omega_claim_provider_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.omega_claim_provider_jobs(integer,text) to service_role;

create or replace function private.omega_complete_provider_job(
  p_job_id uuid,p_status text,p_external_job_id text,p_result jsonb,
  p_error_code text,p_error_message text,p_asset_patch jsonb default null
) returns public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
declare r public.omega_provider_jobs;
begin
  if p_status not in ('SUCCEEDED','FAILED','CANCELLED','BLOCKED_PROVIDER')
    then raise exception 'invalid_terminal_status'; end if;

  update public.omega_provider_jobs
  set status=case when p_status='BLOCKED_PROVIDER' then 'QUEUED' else p_status end,
      external_job_id=coalesce(p_external_job_id,external_job_id),
      provider_response=coalesce(p_result,'{}'::jsonb),
      error_code=p_error_code,error_message=p_error_message,
      completed_at=case when p_status in ('SUCCEEDED','FAILED','CANCELLED') then now() else null end,
      next_attempt_at=case
        when p_status='BLOCKED_PROVIDER' then now()+interval '15 minutes'
        when p_status='FAILED' and attempt_count<max_attempts then now()+interval '5 minutes'
        else next_attempt_at end,
      lease_until=null,worker_id=null,updated_at=now()
  where id=p_job_id returning * into r;

  if not found then raise exception 'provider_job_not_found'; end if;

  if p_status='SUCCEEDED' and r.asset_id is not null and p_asset_patch is not null
     and (p_asset_patch->>'provider_asset_id') is not null
     and (p_asset_patch->>'source_uri') is not null
     and (p_asset_patch->>'content_sha256') is not null then
    update public.omega_creative_assets
    set provider=coalesce(p_asset_patch->>'provider',provider),
        provider_asset_id=p_asset_patch->>'provider_asset_id',
        source_uri=p_asset_patch->>'source_uri',
        storage_path=coalesce(p_asset_patch->>'storage_path',storage_path),
        content_sha256=p_asset_patch->>'content_sha256',
        license=coalesce(p_asset_patch->>'license',license),
        provenance=coalesce(provenance,'{}'::jsonb)
          || jsonb_build_object('provider_job_id',r.id,'verified',true,'verified_at',now())
          || coalesce(p_asset_patch->'provenance','{}'::jsonb),
        metadata=coalesce(metadata,'{}'::jsonb)||coalesce(p_asset_patch->'metadata','{}'::jsonb),
        status='READY',truth_state='LIVE',updated_at=now()
    where id=r.asset_id and owner_id=r.owner_id;
  end if;

  insert into public.omega_platform_events(
    event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,
    idempotency_key,schema_version,source,entity_type,entity_id,payload
  ) values(
    case when p_status='SUCCEEDED' then 'provider_job_completed' else 'provider_job_failed' end,
    '/creation',r.owner_id,
    jsonb_build_object('provider_job_id',r.id,'status',p_status,'attempt_count',r.attempt_count),
    gen_random_uuid(),'system',r.id,'creation:provider_job:'||r.id||':'||r.attempt_count,
    '1','creation','provider_job',r.id::text,
    jsonb_build_object('provider_job_id',r.id,'status',p_status,'provider_id',r.provider_id,'asset_id',r.asset_id)
  );
  return r;
end $$;

create or replace function public.omega_complete_provider_job(
  p_job_id uuid,p_status text,p_external_job_id text,p_result jsonb,
  p_error_code text,p_error_message text,p_asset_patch jsonb default null
) returns public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
begin
  return private.omega_complete_provider_job(
    p_job_id,p_status,p_external_job_id,p_result,p_error_code,p_error_message,p_asset_patch
  );
end $$;

revoke execute on function public.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb) to service_role;
revoke all on function private.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb) from public,anon,authenticated;
