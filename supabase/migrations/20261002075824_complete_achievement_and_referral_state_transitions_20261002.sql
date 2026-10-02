-- SYD OMEGA 91717
-- Evidence-gated achievement assignment/certification and referral reward settlement.
begin;

create or replace function omega_private.assign_achievement(
  p_user_id uuid,p_achievement_id text,p_evidence_ref text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  if p_user_id is null or p_achievement_id is null or btrim(p_achievement_id)='' then
    raise exception 'achievement_assignment_input_required';
  end if;
  if not exists(select 1 from public.omega_achievement_definitions where achievement_id=p_achievement_id and lifecycle='active') then
    raise exception 'achievement_not_active';
  end if;
  if not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'user_not_found';
  end if;
  insert into public.omega_user_achievements(achievement_id,user_id,status,evidence_ref)
  values(p_achievement_id,p_user_id,'pending',p_evidence_ref)
  on conflict(achievement_id,user_id) do nothing
  returning user_achievement_id into v_id;
  if v_id is null then
    select user_achievement_id into v_id from public.omega_user_achievements
    where achievement_id=p_achievement_id and user_id=p_user_id;
  end if;
  return v_id;
end; $$;

create or replace function omega_private.issue_certificate(p_user_achievement_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_user_id uuid; v_achievement_id text; v_status text; v_certificate_id uuid; v_certificate_number text;
begin
  select user_id,achievement_id,status into v_user_id,v_achievement_id,v_status
  from public.omega_user_achievements where user_achievement_id=p_user_achievement_id for update;
  if v_user_id is null then raise exception 'achievement_assignment_not_found'; end if;
  if v_status <> 'verified' then raise exception 'certificate_requires_verified_achievement'; end if;
  if not exists(select 1 from public.omega_achievement_verifications where user_achievement_id=p_user_achievement_id and decision='approved') then
    raise exception 'certificate_requires_approved_verification';
  end if;
  select certificate_id into v_certificate_id from public.omega_certificates
  where user_id=v_user_id and achievement_id=v_achievement_id order by issued_at desc limit 1;
  if v_certificate_id is not null then return v_certificate_id; end if;
  v_certificate_number := 'OMEGA-CERT-'||upper(replace(v_achievement_id,'.','-'))||'-'||upper(substr(replace(p_user_achievement_id::text,'-',''),1,12));
  insert into public.omega_certificates(user_id,achievement_id,certificate_number,status,issued_at,metadata)
  values(v_user_id,v_achievement_id,v_certificate_number,'issued',now(),
    jsonb_build_object('source','verified_achievement','user_achievement_id',p_user_achievement_id,'verification_required',true))
  returning certificate_id into v_certificate_id;
  update public.profiles set certificates_earned=coalesce(certificates_earned,0)+1,updated_at=now() where id=v_user_id;
  perform omega_private.enqueue_notification(v_user_id,'certificate_issued','Ω Certificate issued',
    'A verified achievement certificate is now available in your Omega record.','in_app',
    'certificate:'||v_certificate_id::text,jsonb_build_object('certificate_id',v_certificate_id,'achievement_id',v_achievement_id));
  return v_certificate_id;
end; $$;

create or replace function omega_private.verify_achievement(
  p_user_achievement_id uuid,p_decision text,p_verifier text,p_verification_type text,p_evidence jsonb,p_idempotency_key text
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_user uuid;
begin
  if p_decision not in ('approved','rejected','needs_review') then raise exception 'invalid_decision'; end if;
  if p_idempotency_key is null or btrim(p_idempotency_key)='' then raise exception 'verification_idempotency_key_required'; end if;
  if p_verifier is null or btrim(p_verifier)='' then raise exception 'verifier_required'; end if;
  if p_verification_type is null or btrim(p_verification_type)='' then raise exception 'verification_type_required'; end if;
  if p_decision='approved' and (p_evidence is null or p_evidence='{}'::jsonb or p_evidence='null'::jsonb) then
    raise exception 'approved_verification_requires_evidence';
  end if;
  select verification_id into v_id from public.omega_achievement_verifications where idempotency_key=p_idempotency_key;
  if v_id is null then
    insert into public.omega_achievement_verifications(user_achievement_id,verification_type,verifier,evidence,decision,idempotency_key)
    values(p_user_achievement_id,p_verification_type,p_verifier,coalesce(p_evidence,'{}'::jsonb),p_decision,p_idempotency_key)
    returning verification_id into v_id;
  end if;
  select user_id into v_user from public.omega_user_achievements where user_achievement_id=p_user_achievement_id;
  if v_user is null then raise exception 'achievement_assignment_not_found'; end if;
  update public.omega_user_achievements
  set status=case when p_decision='approved' then 'verified' when p_decision='rejected' then 'revoked' else 'pending' end,
      evidence_ref=coalesce(evidence_ref,p_idempotency_key),
      verified_at=case when p_decision='approved' then coalesce(verified_at,now()) else verified_at end
  where user_achievement_id=p_user_achievement_id;
  if p_decision='approved' then perform omega_private.issue_certificate(p_user_achievement_id); end if;
  return v_id;
end; $$;

create or replace function omega_private.post_referral_reward(p_conversion_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_reward_id uuid; v_referrer uuid; v_amount numeric; v_status text;
begin
  select reward_id,referrer_user_id,reward_value,status into v_reward_id,v_referrer,v_amount,v_status
  from public.omega_referral_rewards where conversion_id=p_conversion_id for update;
  if v_reward_id is null then raise exception 'referral_reward_not_found'; end if;
  if v_status='posted' then return v_reward_id; end if;
  if v_status <> 'approved' then raise exception 'referral_reward_not_approved'; end if;
  if v_amount <= 0 or v_amount <> trunc(v_amount) then raise exception 'referral_reward_amount_invalid'; end if;
  perform public.award_points(v_referrer,v_amount::integer,'referral_qualified',
    'Referral conversion '||p_conversion_id::text||' — server-verified reward');
  update public.omega_referral_rewards set status='posted',updated_at=now() where reward_id=v_reward_id;
  return v_reward_id;
end; $$;

create or replace function omega_private.reverse_referral_reward(p_conversion_id uuid)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_reward_id uuid; v_referrer uuid; v_amount numeric; v_status text;
begin
  select reward_id,referrer_user_id,reward_value,status into v_reward_id,v_referrer,v_amount,v_status
  from public.omega_referral_rewards where conversion_id=p_conversion_id for update;
  if v_reward_id is null then return null; end if;
  if v_status='reversed' then return v_reward_id; end if;
  if v_status='posted' then
    perform public.award_points(v_referrer,-v_amount::integer,'referral_reversed',
      'Referral conversion '||p_conversion_id::text||' — server-verified reversal');
  end if;
  update public.omega_referral_rewards set status='reversed',updated_at=now() where reward_id=v_reward_id;
  return v_reward_id;
end; $$;

create or replace function omega_private.qualify_referral_conversion(
  p_conversion_id uuid,p_status text,p_provider_reference text default null,p_settled_amount numeric default null,p_currency text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_attribution_id uuid; v_referrer uuid; v_referred uuid; v_code text; v_reward_id uuid; v_high_risk boolean;
begin
  if p_status not in ('confirmed','reversed','rejected') then raise exception 'invalid_conversion_status'; end if;
  update public.omega_referral_conversions set status=p_status,
    provider_reference=coalesce(p_provider_reference,provider_reference),
    amount=coalesce(p_settled_amount,amount),currency=coalesce(p_currency,currency)
  where conversion_id=p_conversion_id returning conversion_id,attribution_id into v_id,v_attribution_id;
  if v_id is null then raise exception 'conversion_not_found'; end if;
  select a.referral_code,a.referred_user_id,c.owner_user_id into v_code,v_referred,v_referrer
  from public.omega_referral_attributions a join public.omega_referral_codes c on c.referral_code=a.referral_code
  where a.attribution_id=v_attribution_id;
  if v_referred is null or v_referrer is null then raise exception 'referral_attribution_not_found'; end if;
  if v_referrer=v_referred then raise exception 'self_referral_forbidden'; end if;
  update public.omega_referral_attributions
  set status=case when p_status='confirmed' then 'qualified' when p_status='reversed' then 'reversed' else 'rejected' end,
      rejection_reason=case when p_status='rejected' then 'conversion_rejected' else rejection_reason end
  where attribution_id=v_attribution_id;
  if p_status='confirmed' then
    select exists(select 1 from public.omega_fraud_signals
      where (user_id=v_referred or referral_code=v_code)
        and severity in ('high','critical') and status in ('open','confirmed')) into v_high_risk;
    insert into public.omega_referral_rewards(conversion_id,referrer_user_id,referred_user_id,reward_type,reward_value,currency,status)
    values(v_id,v_referrer,v_referred,'leaderboard_points',200,null,case when v_high_risk then 'pending' else 'approved' end)
    on conflict(conversion_id) do update set status=case
      when public.omega_referral_rewards.status='posted' then public.omega_referral_rewards.status
      when v_high_risk then 'pending' else 'approved' end,updated_at=now()
    returning reward_id into v_reward_id;
    if not v_high_risk then perform omega_private.post_referral_reward(v_id); end if;
  elsif p_status in ('reversed','rejected') then
    perform omega_private.reverse_referral_reward(v_id);
  end if;
  return v_id;
end; $$;

revoke all on function omega_private.assign_achievement(uuid,text,text) from public,anon,authenticated;
revoke all on function omega_private.issue_certificate(uuid) from public,anon,authenticated;
revoke all on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function omega_private.post_referral_reward(uuid) from public,anon,authenticated;
revoke all on function omega_private.reverse_referral_reward(uuid) from public,anon,authenticated;
revoke all on function omega_private.qualify_referral_conversion(uuid,text,text,numeric,text) from public,anon,authenticated;
grant execute on function omega_private.assign_achievement(uuid,text,text) to service_role;
grant execute on function omega_private.issue_certificate(uuid) to service_role;
grant execute on function omega_private.verify_achievement(uuid,text,text,text,jsonb,text) to service_role;
grant execute on function omega_private.post_referral_reward(uuid) to service_role;
grant execute on function omega_private.reverse_referral_reward(uuid) to service_role;
grant execute on function omega_private.qualify_referral_conversion(uuid,text,text,numeric,text) to service_role;
commit;
