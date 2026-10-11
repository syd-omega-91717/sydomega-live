-- Ω SYD OMEGA 91717
-- Owner/admin step-up MFA and Stripe subscription type repair
-- 2026-10-07
--
-- Human owner mutations require AAL2.
-- Stripe service-role webhooks remain trusted server-to-server.
-- membership_tier is an INTEGER rank (1-12), while p_tier is the
-- human-readable subscription name.

create or replace function private.approve_member(p_uid uuid)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
declare exp timestamptz;
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  exp := now() + public.trial_length();
  update public.profiles set access_approved=true,is_trial=true,is_rejected=false,trial_expires_at=exp where id=p_uid;
  insert into public.notifications(user_id,notification_type,message) values(p_uid,'trial_start','Your 9:17 sovereign trial has begun.');
  return jsonb_build_object('ok',true,'uid',p_uid,'is_trial',true,'trial_expires_at',exp,'minutes',9.1717);
end;
$function$;

create or replace function private.revoke_member(p_uid uuid)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  update public.profiles set access_approved=false,is_trial=false,trial_expires_at=null
  where id=p_uid and coalesce(is_owner,false)=false;
  insert into public.notifications(user_id,notification_type,message) values(p_uid,'system','Your access has been revoked.');
  return jsonb_build_object('ok',true,'uid',p_uid,'revoked',true);
end;
$function$;

create or replace function private.revoke_permanent_access(p_uid uuid)
returns void language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.omega_is_owner() then
    raise warning 'OMEGA_DENIED revoke_permanent_access: actor=% target=%',auth.uid(),p_uid;
    raise exception 'Not authorised.' using errcode='42501';
  end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then raise exception 'aal2_required' using errcode='42501'; end if;
  update public.profiles set access_approved=false,is_trial=false,trial_expires_at=null,permanent_granted_at=null,permanent_granted_by=null
  where id=p_uid and coalesce(is_owner,false)=false;
  insert into public.access_grant_audit(action,actor_uid,target_uid,allowed,detail)
  values('revoke_permanent_access',auth.uid(),p_uid,true,'permanent access revoked');
end;
$function$;

create or replace function private.owner_set_kyc_intake(p_on boolean)
returns jsonb language plpgsql security definer set search_path='public','pg_temp'
as $function$
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  if p_on is null then return jsonb_build_object('ok',false,'error','bad_value'); end if;
  insert into public.platform_settings(key,bool_value,updated_at) values('kyc_intake_enabled',p_on,now())
  on conflict(key) do update set bool_value=excluded.bool_value,updated_at=now();
  raise log 'OMEGA_KYC intake=% by %',p_on,auth.uid();
  return jsonb_build_object('ok',true,'intake_enabled',p_on);
end;
$function$;

create or replace function private.set_platform_flag(p_key text,p_val boolean)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  insert into public.platform_settings(key,bool_value,updated_at) values(p_key,p_val,now())
  on conflict(key) do update set bool_value=excluded.bool_value,updated_at=now();
  return jsonb_build_object('ok',true,'key',p_key,'value',p_val);
end;
$function$;

create or replace function private.set_contract_status(p_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','owner_only'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  if p_status not in ('submitted','reviewing','sealed','rejected') then return jsonb_build_object('ok',false,'error','bad_status'); end if;
  update public.commission_contracts set status=p_status where id=p_id;
  return jsonb_build_object('ok',true,'id',p_id,'status',p_status);
end;
$function$;

create or replace function private.set_reservation_status(p_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','owner_only'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  if p_status not in ('submitted','reviewing','approved','rejected','live') then return jsonb_build_object('ok',false,'error','bad_status'); end if;
  update public.media_reservations set status=p_status where id=p_id;
  return jsonb_build_object('ok',true,'id',p_id,'status',p_status);
end;
$function$;

create or replace function private.set_dispatch_published(p_id bigint,p_pub boolean)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
declare n int;
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','owner_only'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  update public.dispatches set is_published=coalesce(p_pub,true) where id=p_id;
  get diagnostics n=row_count;
  if n=0 then return jsonb_build_object('ok',false,'error','not_found'); end if;
  return jsonb_build_object('ok',true,'id',p_id,'published',coalesce(p_pub,true));
end;
$function$;

create or replace function private.set_consult_status(p_id uuid,p_status text)
returns jsonb language plpgsql security definer set search_path='public'
as $function$
begin
  if not public.is_platform_owner() then return jsonb_build_object('ok',false,'error','owner_only'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  if p_status not in ('pending','reviewing','scheduled','closed') then return jsonb_build_object('ok',false,'error','bad_status'); end if;
  update public.consult_requests set status=p_status where id=p_id;
  return jsonb_build_object('ok',true,'id',p_id,'status',p_status);
end;
$function$;

create or replace function private.review_kyc(p_member uuid,p_verdict text)
returns jsonb language plpgsql security definer set search_path='public','pg_temp'
as $function$
declare cur text; doc text;
begin
  if not private.is_platform_owner() then return jsonb_build_object('ok',false,'error','forbidden'); end if;
  if coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then return jsonb_build_object('ok',false,'error','aal2_required'); end if;
  if p_verdict not in ('verified','rejected') then return jsonb_build_object('ok',false,'error','bad_verdict'); end if;
  select kyc_status,kyc_doc_path into cur,doc from public.profiles where id=p_member for update;
  if not found then return jsonb_build_object('ok',false,'error','no_profile'); end if;
  if cur is distinct from 'submitted' then return jsonb_build_object('ok',false,'error','not_submitted'); end if;
  update public.profiles set kyc_status=p_verdict,kyc_reviewed_at=now() where id=p_member;
  raise log 'OMEGA_KYC verdict: actor=% target=% verdict=%',auth.uid(),p_member,p_verdict;
  return jsonb_build_object('ok',true,'status',p_verdict,'purge',doc);
end;
$function$;

create or replace function private.apply_subscription(
  p_uid uuid,p_tier text,p_status text,p_period_end timestamptz,p_customer text
)
returns jsonb language plpgsql security definer set search_path='public','pg_temp'
as $function$
declare updated_count integer; v_tier_num integer;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' and not public.is_platform_owner() then
    return jsonb_build_object('ok',false,'error','forbidden');
  end if;
  if coalesce(auth.jwt()->>'role','') <> 'service_role'
     and coalesce((select auth.jwt()->>'aal'),'aal1') <> 'aal2' then
    return jsonb_build_object('ok',false,'error','aal2_required');
  end if;

  v_tier_num := case upper(trim(coalesce(p_tier,'')))
    when 'INITIATE' then 1
    when 'SEEKER' then 2
    when 'ADEPT' then 3
    when 'WARDEN' then 4
    when 'VANGUARD' then 5
    when 'ARCHITECT' then 6
    when 'SOVEREIGN' then 7
    when 'LUMINARY' then 8
    when 'RADIANT' then 9
    when 'UNYIELDING' then 10
    when 'TRANSCENDENT' then 11
    when 'ASCENDANT' then 12
    else null
  end;

  if v_tier_num is null and trim(coalesce(p_tier,'')) ~ '^[0-9]{1,2}$' then
    v_tier_num := greatest(1,least(12,trim(p_tier)::integer));
  end if;

  update public.profiles set
    subscription_tier=p_tier,
    subscription_status=p_status,
    subscription_period_end=p_period_end,
    stripe_customer_id=coalesce(p_customer,stripe_customer_id),
    membership_tier=case
      when p_status in ('active','trialing') and v_tier_num is not null then v_tier_num
      else membership_tier
    end
  where id=p_uid;

  get diagnostics updated_count=row_count;
  if updated_count<>1 then raise exception 'subscription_profile_not_found'; end if;

  return jsonb_build_object('ok',true,'uid',p_uid,'tier',p_tier,'status',p_status);
end;
$function$;

revoke execute on function private.approve_member(uuid) from public,anon,authenticated;
revoke execute on function private.revoke_member(uuid) from public,anon,authenticated;
revoke execute on function private.revoke_permanent_access(uuid) from public,anon,authenticated;
revoke execute on function private.owner_set_kyc_intake(boolean) from public,anon,authenticated;
revoke execute on function private.set_platform_flag(text,boolean) from public,anon,authenticated;
revoke execute on function private.set_contract_status(uuid,text) from public,anon,authenticated;
revoke execute on function private.set_reservation_status(uuid,text) from public,anon,authenticated;
revoke execute on function private.set_dispatch_published(bigint,boolean) from public,anon,authenticated;
revoke execute on function private.set_consult_status(uuid,text) from public,anon,authenticated;
revoke execute on function private.review_kyc(uuid,text) from public,anon,authenticated;
revoke execute on function private.apply_subscription(uuid,text,text,timestamptz,text) from public,anon,authenticated;
