-- SYD OMEGA 91717
-- Make achievement verification idempotency keys immutable in meaning:
-- replays with the same key and decision return the existing verification;
-- a conflicting decision is rejected and cannot mutate user state.

create or replace function omega_private.verify_achievement(
  p_user_achievement_id uuid,
  p_decision text,
  p_verifier text,
  p_verification_type text,
  p_evidence jsonb,
  p_idempotency_key text
) returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  v_id uuid;
  v_existing_decision text;
  v_user uuid;
begin
  if p_decision not in ('approved','rejected','needs_review') then
    raise exception 'invalid_decision';
  end if;
  if p_idempotency_key is null or btrim(p_idempotency_key)='' then
    raise exception 'verification_idempotency_key_required';
  end if;
  if p_verifier is null or btrim(p_verifier)='' then
    raise exception 'verifier_required';
  end if;
  if p_verification_type is null or btrim(p_verification_type)='' then
    raise exception 'verification_type_required';
  end if;
  if p_decision='approved' and (p_evidence is null or p_evidence='{}'::jsonb or p_evidence='null'::jsonb) then
    raise exception 'approved_verification_requires_evidence';
  end if;

  select verification_id,decision
    into v_id,v_existing_decision
  from public.omega_achievement_verifications
  where idempotency_key=p_idempotency_key;

  if v_id is not null then
    if v_existing_decision <> p_decision then
      raise exception 'verification_idempotency_conflict';
    end if;
    return v_id;
  end if;

  insert into public.omega_achievement_verifications(
    user_achievement_id,verification_type,verifier,evidence,decision,idempotency_key
  )
  values(
    p_user_achievement_id,p_verification_type,p_verifier,
    coalesce(p_evidence,'{}'::jsonb),p_decision,p_idempotency_key
  )
  returning verification_id into v_id;

  select user_id into v_user
  from public.omega_user_achievements
  where user_achievement_id=p_user_achievement_id;

  if v_user is null then
    raise exception 'achievement_assignment_not_found';
  end if;

  update public.omega_user_achievements
  set status=case
      when p_decision='approved' then 'verified'
      when p_decision='rejected' then 'revoked'
      else 'pending'
    end,
    evidence_ref=coalesce(evidence_ref,p_idempotency_key),
    verified_at=case when p_decision='approved' then coalesce(verified_at,now()) else verified_at end
  where user_achievement_id=p_user_achievement_id;

  if p_decision='approved' then
    perform omega_private.issue_certificate(p_user_achievement_id);
  end if;

  return v_id;
end;
$$;
