-- Ω SYD OMEGA 91717
-- Governed credential issue, revoke, and public verification lifecycle.
begin;
alter table public.omega_certificates add column if not exists issuer_id uuid references auth.users(id), add column if not exists revocation_reason text;
create index if not exists omega_certificates_issuer_id_idx on public.omega_certificates(issuer_id);

create or replace function private.omega_issue_certificate(p_user_id uuid,p_achievement_id text,p_certificate_number text default null,p_metadata jsonb default '{}'::jsonb)
returns public.omega_certificates language plpgsql security definer set search_path=''
as $$
declare v_issuer uuid:=auth.uid(); v_number text; v_row public.omega_certificates; v_event_id uuid:=gen_random_uuid();
begin
if v_issuer is null then raise exception 'authentication_required'; end if;
perform private.require_aal2();
if not exists(select 1 from public.profiles where id=v_issuer and is_owner=true) then raise exception 'owner_authorization_required'; end if;
if p_user_id is null or p_achievement_id is null or btrim(p_achievement_id)='' then raise exception 'invalid_certificate_subject'; end if;
if not exists(select 1 from auth.users where id=p_user_id) then raise exception 'certificate_subject_not_found'; end if;
if not exists(select 1 from public.omega_achievement_definitions where achievement_id=p_achievement_id) then raise exception 'achievement_not_found'; end if;
v_number:=nullif(btrim(coalesce(p_certificate_number,'')),'');
if v_number is null then v_number:='OMEGA-CERT-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16)); end if;
if exists(select 1 from public.omega_certificates where certificate_number=v_number) then raise exception 'certificate_number_already_exists'; end if;
insert into public.omega_certificates(certificate_id,user_id,achievement_id,certificate_number,status,issued_at,revoked_at,metadata,issuer_id,revocation_reason)
values(gen_random_uuid(),p_user_id,p_achievement_id,v_number,'issued',now(),null,coalesce(p_metadata,'{}'::jsonb),v_issuer,null) returning * into v_row;
insert into public.omega_platform_events(event_id,event_type,route,actor_user_id,metadata,created_at,actor_type,correlation_id,idempotency_key,schema_version,source,entity_type,entity_id,payload)
values(v_event_id,'credential_issued','/credential',v_issuer,jsonb_build_object('certificate_id',v_row.certificate_id,'certificate_number',v_row.certificate_number,'subject_user_id',v_row.user_id,'achievement_id',v_row.achievement_id),now(),'human',v_event_id,'credential-issued:'||v_row.certificate_id,'1','omega-credential-lifecycle','credential',v_row.certificate_id::text,jsonb_build_object('status','issued'));
insert into public.omega_platform_evidence(id,capability_id,evidence_level,check_name,result,evidence,recorded_at,evidence_id,event_id,owner_user_id,evidence_type,source,subject_type,subject_id,status,metadata,verified_at)
values(gen_random_uuid(),'credential_lifecycle','E2','credential-issuance','pass',jsonb_build_object('certificate_id',v_row.certificate_id,'certificate_number',v_row.certificate_number,'achievement_id',v_row.achievement_id,'issuer_id',v_issuer),now(),gen_random_uuid(),v_event_id,v_issuer,'credential','omega-db','credential',v_row.certificate_id::text,'LIVE',jsonb_build_object('issuer_id',v_issuer),now());
return v_row;
end $$;

create or replace function private.omega_revoke_certificate(p_certificate_id uuid,p_reason text)
returns public.omega_certificates language plpgsql security definer set search_path=''
as $$
declare v_actor uuid:=auth.uid(); v_row public.omega_certificates; v_event_id uuid:=gen_random_uuid();
begin
if v_actor is null then raise exception 'authentication_required'; end if;
perform private.require_aal2();
if not exists(select 1 from public.profiles where id=v_actor and is_owner=true) then raise exception 'owner_authorization_required'; end if;
if p_reason is null or btrim(p_reason)='' then raise exception 'revocation_reason_required'; end if;
update public.omega_certificates set status='revoked',revoked_at=coalesce(revoked_at,now()),revocation_reason=left(btrim(p_reason),1000) where certificate_id=p_certificate_id and status='issued' returning * into v_row;
if not found then raise exception 'issued_certificate_not_found'; end if;
insert into public.omega_platform_events(event_id,event_type,route,actor_user_id,metadata,created_at,actor_type,correlation_id,idempotency_key,schema_version,source,entity_type,entity_id,payload)
values(v_event_id,'credential_revoked','/credential',v_actor,jsonb_build_object('certificate_id',v_row.certificate_id,'certificate_number',v_row.certificate_number,'reason',v_row.revocation_reason),now(),'human',v_event_id,'credential-revoked:'||v_row.certificate_id,'1','omega-credential-lifecycle','credential',v_row.certificate_id::text,jsonb_build_object('status','revoked'));
insert into public.omega_platform_evidence(id,capability_id,evidence_level,check_name,result,evidence,recorded_at,evidence_id,event_id,owner_user_id,evidence_type,source,subject_type,subject_id,status,metadata,verified_at)
values(gen_random_uuid(),'credential_lifecycle','E2','credential-revocation','pass',jsonb_build_object('certificate_id',v_row.certificate_id,'certificate_number',v_row.certificate_number,'reason',v_row.revocation_reason,'actor_id',v_actor),now(),gen_random_uuid(),v_event_id,v_actor,'credential','omega-db','credential',v_row.certificate_id::text,'LIVE',jsonb_build_object('revoked_at',v_row.revoked_at),now());
return v_row;
end $$;

create or replace function public.omega_issue_certificate(p_user_id uuid,p_achievement_id text,p_certificate_number text default null,p_metadata jsonb default '{}'::jsonb)
returns public.omega_certificates language sql security invoker set search_path='' as $$ select * from private.omega_issue_certificate($1,$2,$3,$4); $$;
create or replace function public.omega_revoke_certificate(p_certificate_id uuid,p_reason text)
returns public.omega_certificates language sql security invoker set search_path='' as $$ select * from private.omega_revoke_certificate($1,$2); $$;

create or replace function private.omega_verify_certificate(p_certificate_number text)
returns jsonb language sql security definer set search_path='' as $$
select coalesce((select jsonb_build_object('found',true,'certificate_number',c.certificate_number,'achievement_id',c.achievement_id,'status',c.status,'issued_at',c.issued_at,'revoked_at',c.revoked_at,'subject_ref',left(c.user_id::text,8),'truth_state',case when c.status='issued' then 'LIVE' else 'CALCULATED' end) from public.omega_certificates c where c.certificate_number=nullif(btrim(p_certificate_number),'')),jsonb_build_object('found',false,'truth_state','UNAVAILABLE'));
$$;
create or replace function public.omega_verify_certificate(p_certificate_number text)
returns jsonb language sql security invoker set search_path='' as $$ select private.omega_verify_certificate($1); $$;

revoke all on function private.omega_issue_certificate(uuid,text,text,jsonb) from public,anon,authenticated;
revoke all on function private.omega_revoke_certificate(uuid,text) from public,anon,authenticated;
revoke all on function private.omega_verify_certificate(text) from public,anon,authenticated;
revoke execute on function public.omega_issue_certificate(uuid,text,text,jsonb) from public,anon;
grant execute on function public.omega_issue_certificate(uuid,text,text,jsonb) to authenticated;
revoke execute on function public.omega_revoke_certificate(uuid,text) from public,anon;
grant execute on function public.omega_revoke_certificate(uuid,text) to authenticated;
grant execute on function public.omega_verify_certificate(text) to anon,authenticated;
commit;