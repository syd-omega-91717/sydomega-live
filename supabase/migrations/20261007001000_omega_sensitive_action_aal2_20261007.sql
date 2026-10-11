-- Ω SYD OMEGA 91717
-- Sensitive-action AAL2 enforcement
-- 2026-10-07

create or replace function private.require_aal2()
returns void
language plpgsql
security definer
set search_path=''
as $function$
begin
  if (select auth.uid()) is null then
    raise exception 'authentication_required' using errcode='42501';
  end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    raise exception 'aal2_required' using errcode='42501';
  end if;
end;
$function$;

revoke execute on function private.require_aal2() from public, anon, authenticated;

create or replace function private.omega_submit_provider_job(
  p_provider_key text, p_capability text, p_asset_id uuid, p_request jsonb
)
returns public.omega_provider_jobs
language plpgsql
security definer
set search_path=''
as $function$
declare
  r public.omega_provider_jobs;
  p public.omega_provider_registry;
begin
  perform private.require_aal2();
  select * into p from public.omega_provider_registry where provider_key=p_provider_key;
  if not found then raise exception 'provider_not_registered'; end if;
  if p.status in ('DISABLED') then raise exception 'provider_disabled'; end if;
  if p_asset_id is not null and not exists(
    select 1 from public.omega_creative_assets
    where id=p_asset_id and owner_id=(select auth.uid())
  ) then raise exception 'asset_not_owned'; end if;
  insert into public.omega_provider_jobs(
    owner_id,provider_id,asset_id,capability,request,status,next_attempt_at
  ) values(
    (select auth.uid()),p.id,p_asset_id,p_capability,coalesce(p_request,'{}'::jsonb),'QUEUED',now()
  ) returning * into r;
  return r;
end
$function$;

revoke execute on function private.omega_submit_provider_job(text,text,uuid,jsonb)
from public, anon, authenticated;

create or replace function private.submit_kyc(p_doc_path text, p_consent boolean)
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
declare uid uuid := auth.uid(); prof record;
begin
  if uid is null then return jsonb_build_object('ok',false,'error','signed_out'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;
  if not coalesce(private.get_platform_flag('kyc_intake_enabled'),false) then
    return jsonb_build_object('ok',false,'error','intake_closed');
  end if;
  if p_consent is not true then return jsonb_build_object('ok',false,'error','consent_required'); end if;
  if p_doc_path is null or p_doc_path !~ ('^' || uid::text || '/[^/]{1,255}$') then
    return jsonb_build_object('ok',false,'error','bad_path');
  end if;
  if not exists(select 1 from storage.objects o where o.bucket_id='uploads' and o.name=p_doc_path and o.owner_id=uid::text) then
    return jsonb_build_object('ok',false,'error','no_document');
  end if;
  select id,kyc_status,kyc_doc_path,access_approved,is_owner into prof
  from public.profiles where id=uid for update;
  if not found then return jsonb_build_object('ok',false,'error','no_profile'); end if;
  if not (coalesce(prof.access_approved,false) or coalesce(prof.is_owner,false)) then
    return jsonb_build_object('ok',false,'error','not_approved');
  end if;
  if prof.kyc_status='verified' then return jsonb_build_object('ok',false,'error','already_verified'); end if;
  update public.profiles set
    kyc_status='submitted',kyc_doc_path=p_doc_path,kyc_submitted_at=now(),
    kyc_consent_at=now(),kyc_reviewed_at=null,kyc_doc_purged_at=null
  where id=uid;
  return jsonb_build_object(
    'ok',true,'status','submitted',
    'replaced',case when prof.kyc_doc_path is distinct from p_doc_path then prof.kyc_doc_path end
  );
end
$function$;

revoke execute on function private.submit_kyc(text,boolean)
from public, anon, authenticated;

create or replace function private.delete_account()
returns jsonb
language plpgsql
security definer
set search_path='public','pg_temp'
as $function$
declare uid uuid := auth.uid(); doc text;
begin
  if uid is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;
  if coalesce((select is_owner from public.profiles where id=uid),false) then
    return jsonb_build_object('ok',false,'error','sovereign_protected');
  end if;
  select kyc_doc_path into doc from public.profiles where id=uid;
  if doc is not null and exists(select 1 from storage.objects o where o.bucket_id='uploads' and o.name=doc) then
    return jsonb_build_object('ok',false,'error','identity_document_stored','doc_path',doc);
  end if;
  delete from public.task_completions where user_id=uid;
  delete from public.evolution_events where user_id=uid;
  delete from public.trophies where user_id=uid;
  delete from public.medals where user_id=uid;
  delete from public.certificates where user_id=uid;
  delete from public.platform_owners where user_id=uid;
  delete from public.profiles where id=uid;
  begin
    delete from auth.users where id=uid;
    return jsonb_build_object('ok',true,'deleted',true,'auth_removed',true);
  exception when others then
    return jsonb_build_object('ok',true,'deleted',true,'auth_removed',false,'note','data wiped; auth row purge pending');
  end;
end
$function$;

revoke execute on function private.delete_account() from public, anon, authenticated;

create or replace function private.submit_exam_result(
  p_exam_id text, p_score integer, p_total integer, p_cert_name text
)
returns jsonb
language plpgsql
security definer
set search_path='public'
as $function$
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;
  return jsonb_build_object(
    'ok',false,
    'error','legacy_exam_result_submission_disabled',
    'message','Use public.submit_exam_attempt with the published Academy exam. Exam scoring and credential issuance must be server-derived.'
  );
end;
$function$;

revoke execute on function private.submit_exam_result(text,integer,integer,text)
from public, anon, authenticated;
