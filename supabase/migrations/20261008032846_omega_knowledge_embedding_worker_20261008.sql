create table if not exists public.omega_knowledge_embedding_jobs (
  id uuid primary key default gen_random_uuid(),
  chunk_id uuid not null references public.omega_knowledge_chunks(id) on delete cascade,
  document_id uuid not null references public.omega_knowledge_documents(id) on delete cascade,
  source_id uuid not null,
  owner_id uuid not null,
  provider_key text not null,
  model text,
  dimensions integer,
  input_sha256 text not null check (input_sha256 ~ '^[0-9a-f]{64}$'),
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','BLOCKED_PROVIDER','CANCELLED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  max_attempts integer not null default 5 check (max_attempts between 1 and 20),
  next_attempt_at timestamptz not null default now(),
  lease_until timestamptz,
  worker_id text,
  provider_request jsonb,
  provider_response jsonb,
  embedding_sha256 text,
  error_code text,
  error_message text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (chunk_id, provider_key, model, dimensions)
);

create index if not exists omega_knowledge_embedding_jobs_claim_idx
  on public.omega_knowledge_embedding_jobs (status, next_attempt_at, lease_until);
create index if not exists omega_knowledge_embedding_jobs_owner_idx
  on public.omega_knowledge_embedding_jobs (owner_id, created_at desc);
create index if not exists omega_knowledge_embedding_jobs_document_idx
  on public.omega_knowledge_embedding_jobs (document_id, status);

alter table public.omega_knowledge_embedding_jobs enable row level security;
drop policy if exists "omega_knowledge_embedding_jobs_owner_select" on public.omega_knowledge_embedding_jobs;
create policy "omega_knowledge_embedding_jobs_owner_select"
on public.omega_knowledge_embedding_jobs for select to authenticated
using ((select auth.uid()) = owner_id);
revoke all on public.omega_knowledge_embedding_jobs from anon;
revoke all on public.omega_knowledge_embedding_jobs from authenticated;
grant select on public.omega_knowledge_embedding_jobs to authenticated;

insert into public.omega_provider_registry(provider_key,display_name,adapter_kind,capabilities,status,secret_ref,metadata)
values ('embedding_http','Ω Knowledge Embedding Gateway','HTTP','["EMBEDDING"]'::jsonb,'UNCONFIGURED',
        'OMEGA_EMBEDDING_GATEWAY',
        '{"source":"omega_platform_gateway","auth_verified":false,"model":null,"dimensions":null}'::jsonb)
on conflict (provider_key) do update set
  display_name=excluded.display_name, adapter_kind=excluded.adapter_kind,
  capabilities=excluded.capabilities, updated_at=now();

create or replace function private.omega_enqueue_knowledge_embedding_job(p_chunk_id uuid)
returns uuid language plpgsql security definer
set search_path=public,private,extensions as $$
declare c record; p record; job_id uuid; input_hash text;
        selected_model text; selected_dimensions integer; selected_status text;
begin
  select k.id,k.source_id,k.document_id,k.content,d.id as doc_id,d.created_by,d.ingestion_status
    into c from public.omega_knowledge_chunks k
    join public.omega_knowledge_documents d on d.id=k.document_id where k.id=p_chunk_id;
  if not found then raise exception 'knowledge_chunk_not_found'; end if;
  if c.ingestion_status not in ('INGESTED','READY','PARTIAL') then return null; end if;
  select * into p from public.omega_provider_registry
    where provider_key='embedding_http' and 'EMBEDDING'=any(capabilities) limit 1;
  if not found then raise exception 'embedding_provider_not_registered'; end if;

  selected_model:=nullif(p.metadata->>'model','');
  selected_dimensions:=case when nullif(p.metadata->>'dimensions','') is null then null
                            else (p.metadata->>'dimensions')::integer end;
  selected_status:=p.status;
  input_hash:=encode(digest(convert_to(c.content,'utf8'),'sha256'),'hex');

  insert into public.omega_knowledge_embedding_jobs
    (chunk_id,document_id,source_id,owner_id,provider_key,model,dimensions,input_sha256,status,provider_request)
  values
    (c.id,c.doc_id,c.source_id,c.created_by,p.provider_key,selected_model,selected_dimensions,input_hash,
     case when selected_status='READY' and selected_model is not null and selected_dimensions is not null
          then 'QUEUED' else 'BLOCKED_PROVIDER' end,
     jsonb_build_object('content_sha256',input_hash,'model',selected_model,'dimensions',selected_dimensions,
                        'provider_status',selected_status,'source','omega_knowledge_chunks'))
  on conflict (chunk_id,provider_key,model,dimensions) do update set
    status=case
      when public.omega_knowledge_embedding_jobs.status in ('SUCCEEDED','RUNNING')
        then public.omega_knowledge_embedding_jobs.status
      when selected_status='READY' and selected_model is not null and selected_dimensions is not null
        then 'QUEUED' else 'BLOCKED_PROVIDER' end,
    next_attempt_at=now(),
    error_code=case when selected_status='READY' then null else 'provider_not_configured' end,
    error_message=case when selected_status='READY' then null
      else 'Embedding provider is not configured and no vector was fabricated.' end,
    updated_at=now()
  returning id into job_id;
  return job_id;
end; $$;

create or replace function private.omega_enqueue_knowledge_embeddings_for_document(p_document_id uuid)
returns integer language plpgsql security definer
set search_path=public,private,extensions as $$
declare r record; n integer:=0;
begin
  for r in select id from public.omega_knowledge_chunks where document_id=p_document_id order by chunk_no loop
    perform private.omega_enqueue_knowledge_embedding_job(r.id); n:=n+1;
  end loop;
  return n;
end; $$;

create or replace function private.omega_claim_knowledge_embedding_jobs(p_limit integer,p_worker_id text)
returns setof public.omega_knowledge_embedding_jobs language plpgsql security definer
set search_path=public,private,extensions as $$
begin
  return query
  with candidates as (
    select j.id from public.omega_knowledge_embedding_jobs j
    join public.omega_provider_registry p on p.provider_key=j.provider_key
    where j.status='QUEUED' and j.next_attempt_at<=now()
      and (j.lease_until is null or j.lease_until<now())
      and j.attempt_count<j.max_attempts and p.status='READY'
      and j.model is not null and j.dimensions is not null
    order by j.created_at for update skip locked
    limit greatest(1,least(coalesce(p_limit,10),25))
  )
  update public.omega_knowledge_embedding_jobs j
  set status='RUNNING',attempt_count=j.attempt_count+1,started_at=coalesce(j.started_at,now()),
      lease_until=now()+interval '2 minutes',worker_id=p_worker_id,updated_at=now()
  from candidates c where j.id=c.id returning j.*;
end; $$;

create or replace function private.omega_complete_knowledge_embedding_job(
  p_job_id uuid,p_status text,p_embedding jsonb,p_model text,p_dimensions integer,
  p_embedding_sha256 text,p_provider_response jsonb,p_error_code text,p_error_message text,p_worker_id text)
returns jsonb language plpgsql security definer
set search_path=public,private,extensions as $$
declare j public.omega_knowledge_embedding_jobs; actual_hash text; vector_text text;
begin
  select * into j from public.omega_knowledge_embedding_jobs
   where id=p_job_id and status='RUNNING' and worker_id=p_worker_id for update;
  if not found then raise exception 'knowledge_embedding_job_stale_or_not_running'; end if;

  if p_status='SUCCEEDED' then
    if p_model is null or p_model<>j.model then raise exception 'embedding_model_mismatch'; end if;
    if p_dimensions is null or p_dimensions<>j.dimensions then raise exception 'embedding_dimension_mismatch'; end if;
    if jsonb_typeof(p_embedding)<>'array' or jsonb_array_length(p_embedding)<>j.dimensions
      then raise exception 'embedding_vector_invalid'; end if;
    if exists(select 1 from jsonb_array_elements(p_embedding) x where jsonb_typeof(x)<>'number')
      then raise exception 'embedding_vector_non_numeric'; end if;
    actual_hash:=encode(digest(convert_to(p_embedding::text,'utf8'),'sha256'),'hex');
    if lower(coalesce(p_embedding_sha256,''))<>actual_hash then raise exception 'embedding_hash_mismatch'; end if;
    vector_text:='['||(select string_agg(trim(value::text),',') from jsonb_array_elements(p_embedding) value)||']';

    update public.omega_knowledge_chunks
    set embedding=vector_text::extensions.vector,
        metadata=coalesce(metadata,'{}'::jsonb)||jsonb_build_object(
          'embedding_model',p_model,'embedding_dimensions',p_dimensions,
          'embedding_sha256',actual_hash,
          'embedding_provenance',coalesce(p_provider_response->'provenance','{}'::jsonb))
    where id=j.chunk_id;

    update public.omega_knowledge_embedding_jobs
    set status='SUCCEEDED',embedding_sha256=actual_hash,provider_response=p_provider_response,
        error_code=null,error_message=null,lease_until=null,completed_at=now(),updated_at=now()
    where id=j.id;
    return jsonb_build_object('status','SUCCEEDED','job_id',j.id,'embedding_sha256',actual_hash);
  end if;

  update public.omega_knowledge_embedding_jobs
  set status=case when p_status='BLOCKED_PROVIDER' then 'BLOCKED_PROVIDER'
                  when attempt_count>=max_attempts then 'FAILED' else 'QUEUED' end,
      provider_response=p_provider_response,error_code=p_error_code,error_message=p_error_message,
      next_attempt_at=case when p_status='BLOCKED_PROVIDER' then now()+interval '1 hour'
        else now()+make_interval(secs=>least(3600,greatest(15,15*(2^least(attempt_count-1,8))))) end,
      lease_until=null,updated_at=now(),
      completed_at=case when p_status='BLOCKED_PROVIDER' or attempt_count>=max_attempts then now() else null end
  where id=j.id;
  return jsonb_build_object('status',p_status,'job_id',j.id);
end; $$;

create or replace function public.omega_claim_knowledge_embedding_jobs(p_limit integer,p_worker_id text)
returns setof public.omega_knowledge_embedding_jobs language plpgsql security invoker set search_path=public as $$
begin
  if current_user<>'service_role' then raise exception 'service_role_required'; end if;
  return query select * from private.omega_claim_knowledge_embedding_jobs(p_limit,p_worker_id);
end; $$;

create or replace function public.omega_complete_knowledge_embedding_job(
  p_job_id uuid,p_status text,p_embedding jsonb,p_model text,p_dimensions integer,
  p_embedding_sha256 text,p_provider_response jsonb,p_error_code text,p_error_message text,p_worker_id text)
returns jsonb language plpgsql security invoker set search_path=public as $$
begin
  if current_user<>'service_role' then raise exception 'service_role_required'; end if;
  return private.omega_complete_knowledge_embedding_job(
    p_job_id,p_status,p_embedding,p_model,p_dimensions,p_embedding_sha256,
    p_provider_response,p_error_code,p_error_message,p_worker_id);
end; $$;

revoke all on function private.omega_enqueue_knowledge_embedding_job(uuid) from public,anon,authenticated;
revoke all on function private.omega_enqueue_knowledge_embeddings_for_document(uuid) from public,anon,authenticated;
revoke all on function private.omega_claim_knowledge_embedding_jobs(integer,text) from public,anon,authenticated;
revoke all on function private.omega_complete_knowledge_embedding_job(uuid,text,jsonb,text,integer,text,jsonb,text,text,text) from public,anon,authenticated;
revoke all on function public.omega_claim_knowledge_embedding_jobs(integer,text) from public,anon,authenticated;
revoke all on function public.omega_complete_knowledge_embedding_job(uuid,text,jsonb,text,integer,text,jsonb,text,text,text) from public,anon,authenticated;
grant execute on function public.omega_claim_knowledge_embedding_jobs(integer,text) to service_role;
grant execute on function public.omega_complete_knowledge_embedding_job(uuid,text,jsonb,text,integer,text,jsonb,text,text,text) to service_role;

create or replace function private.omega_knowledge_chunk_embedding_enqueue_trigger()
returns trigger language plpgsql security definer set search_path=public,private,extensions
as $$ begin perform private.omega_enqueue_knowledge_embedding_job(new.id); return new; end; $$;
drop trigger if exists omega_knowledge_chunk_embedding_enqueue on public.omega_knowledge_chunks;
create trigger omega_knowledge_chunk_embedding_enqueue after insert on public.omega_knowledge_chunks
for each row execute function private.omega_knowledge_chunk_embedding_enqueue_trigger();
revoke all on function private.omega_knowledge_chunk_embedding_enqueue_trigger() from public,anon,authenticated;
