-- SYD OMEGA 91717
-- Correct the assignment primitive after production validation.
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
