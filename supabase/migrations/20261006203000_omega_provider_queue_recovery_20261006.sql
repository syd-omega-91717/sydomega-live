-- Ω Provider Queue Recovery / Stale Worker Protection
-- Repairs retry semantics, reclaims expired leases, and prevents stale workers
-- from completing jobs after another worker has reclaimed them.

drop function if exists public.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb);
drop function if exists private.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb);

create or replace function private.omega_claim_provider_jobs(
  p_limit integer, p_worker_id text
) returns setof public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
declare exhausted public.omega_provider_jobs;
begin
  if p_worker_id is null or left(p_worker_id,21) <> 'omega-provider-worker'
    then raise exception 'invalid_worker_identity'; end if;

  update public.omega_provider_jobs
  set status='QUEUED', next_attempt_at=now(), lease_until=null, worker_id=null,
      error_code='worker_lease_expired',
      error_message='Worker lease expired before terminal completion; job returned to the durable queue.',
      updated_at=now()
  where status='RUNNING' and lease_until is not null and lease_until < now()
    and attempt_count < max_attempts;

  for exhausted in
    update public.omega_provider_jobs
    set status='FAILED', completed_at=now(), lease_until=null, worker_id=null,
        error_code='worker_lease_exhausted',
        error_message='Worker lease expired and the maximum provider-job attempts was reached.',
        updated_at=now()
    where status='RUNNING' and lease_until is not null and lease_until < now()
      and attempt_count >= max_attempts
    returning *
  loop
    insert into public.omega_platform_events(
      event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,
      idempotency_key,schema_version,source,entity_type,entity_id,payload
    ) values(
      'provider_job_failed','/creation',exhausted.owner_id,
      jsonb_build_object('provider_job_id',exhausted.id,'status','FAILED',
        'attempt_count',exhausted.attempt_count,'error_code','worker_lease_exhausted'),
      gen_random_uuid(),'system',exhausted.id,
      'creation:provider_job:'||exhausted.id||':lease-exhausted:'||exhausted.attempt_count,
      '1','creation','provider_job',exhausted.id::text,
      jsonb_build_object('provider_job_id',exhausted.id,'status','FAILED',
        'provider_id',exhausted.provider_id,'asset_id',exhausted.asset_id,
        'error_code','worker_lease_exhausted')
    );
  end loop;

  return query
  with candidates as (
    select id from public.omega_provider_jobs
    where status='QUEUED' and next_attempt_at<=now() and attempt_count<max_attempts
    order by created_at for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  )
  update public.omega_provider_jobs j
  set status='RUNNING', attempt_count=j.attempt_count+1,
      started_at=coalesce(j.started_at,now()),
      lease_until=now()+interval '5 minutes',
      worker_id=p_worker_id, updated_at=now()
  from candidates c where j.id=c.id
  returning j.*;
end $$;

create or replace function public.omega_claim_provider_jobs(
  p_limit integer, p_worker_id text
) returns setof public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
begin
  if p_worker_id is null or left(p_worker_id,21) <> 'omega-provider-worker'
    then raise exception 'invalid_worker_identity'; end if;
  return query select * from private.omega_claim_provider_jobs(p_limit,p_worker_id);
end $$;

revoke execute on function public.omega_claim_provider_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.omega_claim_provider_jobs(integer,text) to service_role;
revoke all on function private.omega_claim_provider_jobs(integer,text) from public,anon,authenticated;

create or replace function private.omega_complete_provider_job(
  p_job_id uuid,p_status text,p_external_job_id text,p_result jsonb,
  p_error_code text,p_error_message text,p_asset_patch jsonb default null,
  p_worker_id text default null
) returns public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
declare
  r public.omega_provider_jobs;
  effective_status text := p_status;
  effective_error_code text := p_error_code;
  effective_error_message text := p_error_message;
  event_uuid uuid := gen_random_uuid();
  patch_valid boolean := p_asset_patch is not null
    and coalesce(trim(p_asset_patch->>'provider_asset_id'),'') <> ''
    and coalesce(trim(p_asset_patch->>'source_uri'),'') <> ''
    and (p_asset_patch->>'content_sha256') ~ '^[a-fA-F0-9]{64}$';
begin
  if p_status not in ('SUCCEEDED','FAILED','CANCELLED','BLOCKED_PROVIDER')
    then raise exception 'invalid_terminal_status'; end if;
  if coalesce(trim(p_worker_id),'') = ''
    then raise exception 'worker_identity_required'; end if;

  if p_status='SUCCEEDED' and not patch_valid then
    effective_status := 'FAILED';
    effective_error_code := 'provider_artifact_unverified';
    effective_error_message := 'Provider returned success without a valid provider_asset_id, source_uri and 64-character SHA-256 content hash.';
  end if;

  update public.omega_provider_jobs
  set status=case
      when effective_status='BLOCKED_PROVIDER' then 'QUEUED'
      when effective_status='FAILED' and attempt_count < max_attempts then 'QUEUED'
      else effective_status end,
    external_job_id=coalesce(p_external_job_id,external_job_id),
    provider_response=coalesce(p_result,'{}'::jsonb),
    error_code=effective_error_code,error_message=effective_error_message,
    completed_at=case
      when effective_status in ('SUCCEEDED','FAILED','CANCELLED')
       and not (effective_status='FAILED' and attempt_count < max_attempts)
      then now() else null end,
    next_attempt_at=case
      when effective_status='BLOCKED_PROVIDER' then now()+interval '15 minutes'
      when effective_status='FAILED' and attempt_count < max_attempts then now()+interval '5 minutes'
      else next_attempt_at end,
    lease_until=null,worker_id=null,updated_at=now()
  where id=p_job_id and status='RUNNING' and worker_id=p_worker_id
  returning * into r;

  if not found then raise exception 'provider_job_stale_or_not_running'; end if;

  if effective_status='SUCCEEDED' and r.asset_id is not null and patch_valid then
    update public.omega_creative_assets
    set provider=coalesce(p_asset_patch->>'provider',provider),
        provider_asset_id=p_asset_patch->>'provider_asset_id',
        source_uri=p_asset_patch->>'source_uri',
        storage_path=coalesce(p_asset_patch->>'storage_path',storage_path),
        content_sha256=lower(p_asset_patch->>'content_sha256'),
        license=coalesce(p_asset_patch->>'license',license),
        provenance=coalesce(provenance,'{}'::jsonb)
          || jsonb_build_object('provider_job_id',r.id,'verified',true,'verified_at',now())
          || coalesce(p_asset_patch->'provenance','{}'::jsonb),
        metadata=coalesce(metadata,'{}'::jsonb)||coalesce(p_asset_patch->'metadata','{}'::jsonb),
        status='READY',truth_state='LIVE',updated_at=now()
    where id=r.asset_id and owner_id=r.owner_id;

    insert into public.omega_platform_evidence(
      capability_id,evidence_level,check_name,result,evidence,recorded_at,
      evidence_id,event_id,owner_user_id,evidence_type,source,subject_type,
      subject_id,status,content_hash,uri,metadata,verified_at
    ) values(
      'creation_provider_runtime','E2','provider-artifact-verification','pass',
      jsonb_build_object('provider_job_id',r.id,'provider_id',r.provider_id,
        'asset_id',r.asset_id,'provider_asset_id',p_asset_patch->>'provider_asset_id',
        'sha256',lower(p_asset_patch->>'content_sha256')),
      now(),event_uuid,event_uuid,r.owner_id,'runtime','omega-provider-worker',
      'provider_job',r.id::text,'verified',lower(p_asset_patch->>'content_sha256'),
      p_asset_patch->>'source_uri',
      jsonb_build_object('truth_state','LIVE','artifact_verified',true),now()
    );
  end if;

  insert into public.omega_platform_events(
    event_type,route,actor_user_id,metadata,event_id,actor_type,correlation_id,
    idempotency_key,schema_version,source,entity_type,entity_id,payload
  ) values(
    case when effective_status='SUCCEEDED' then 'provider_job_completed' else 'provider_job_failed' end,
    '/creation',r.owner_id,
    jsonb_build_object('provider_job_id',r.id,'status',effective_status,
      'attempt_count',r.attempt_count,'retry_scheduled',r.status='QUEUED',
      'artifact_verified',case when effective_status='SUCCEEDED' then patch_valid else false end),
    event_uuid,'system',r.id,
    'creation:provider_job:'||r.id||':'||r.attempt_count||':'||event_uuid,
    '1','creation','provider_job',r.id::text,
    jsonb_build_object('provider_job_id',r.id,'status',effective_status,
      'provider_id',r.provider_id,'asset_id',r.asset_id,'retry_scheduled',r.status='QUEUED')
  );
  return r;
end $$;

create or replace function public.omega_complete_provider_job(
  p_job_id uuid,p_status text,p_external_job_id text,p_result jsonb,
  p_error_code text,p_error_message text,p_asset_patch jsonb default null,
  p_worker_id text default null
) returns public.omega_provider_jobs
language plpgsql security definer set search_path=''
as $$
begin
  return private.omega_complete_provider_job(
    p_job_id,p_status,p_external_job_id,p_result,p_error_code,p_error_message,p_asset_patch,p_worker_id
  );
end $$;

revoke execute on function public.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb,text) from public,anon,authenticated;
grant execute on function public.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb,text) to service_role;
revoke all on function private.omega_complete_provider_job(uuid,text,text,jsonb,text,text,jsonb,text) from public,anon,authenticated;
