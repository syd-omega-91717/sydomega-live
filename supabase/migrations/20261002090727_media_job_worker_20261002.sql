begin;

create or replace function public.claim_media_jobs(p_limit integer default 10,p_worker_id text default 'omega-media-worker')
returns setof public.omega_media_jobs language sql security definer set search_path='' as $$
with claimed as (
  select id from public.omega_media_jobs where status='QUEUED' order by created_at for update skip locked
  limit greatest(1,least(coalesce(p_limit,10),100))
)
update public.omega_media_jobs j set status='RUNNING',updated_at=now(),error_code=null,error_detail=null
from claimed where j.id=claimed.id returning j.*;
$$;
revoke all on function public.claim_media_jobs(integer,text) from public,anon,authenticated;
grant execute on function public.claim_media_jobs(integer,text) to service_role;

create or replace function public.complete_media_job(p_job_id uuid,p_status text,p_provider_job_id text default null,p_result jsonb default null,p_error_code text default null,p_error_detail text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.omega_media_jobs;
begin
 if p_status not in ('SUCCEEDED','FAILED','BLOCKED_PROVIDER','CANCELLED') then raise exception 'invalid_media_status'; end if;
 update public.omega_media_jobs set status=p_status,provider_job_id=coalesce(p_provider_job_id,provider_job_id),result=p_result,error_code=p_error_code,error_detail=p_error_detail,updated_at=now() where id=p_job_id returning * into v;
 if not found then raise exception 'media_job_not_found'; end if;
 return to_jsonb(v);
end $$;
revoke all on function public.complete_media_job(uuid,text,text,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.complete_media_job(uuid,text,text,jsonb,text,text) to service_role;

commit;