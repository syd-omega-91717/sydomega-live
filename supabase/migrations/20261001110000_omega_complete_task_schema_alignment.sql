-- Ω SYD OMEGA 91717
-- Complete-task live-schema alignment
-- Applied live on 2026-10-01 after transactional production-path verification.

create or replace function private.complete_task(
  p_task_name text,
  p_task_type text default 'knowledge',
  p_axis_type text default 'a',
  p_description text default null,
  p_points numeric default 0.001
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  uid uuid := auth.uid();
  pr public.profiles%rowtype;
  PHI constant numeric := 1.6180339887;
  EU constant numeric := 2.7182818285;
  APEX constant numeric := 9.000;
  new_a numeric; new_b numeric; new_c numeric; auth_score numeric;
  new_v numeric; old_v numeric;
  old_m int; new_m int; k int;
  unlocked jsonb := '[]'::jsonb;
  notify_en boolean := false;
  msg text;
begin
  select * into pr from public.profiles where id = uid;
  if not found then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'profile_not_found');
  end if;
  if not pr.access_approved and not pr.is_owner then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'access_denied');
  end if;

  if exists (select 1 from public.task_completions where user_id = uid and task_name = p_task_name) then
    return jsonb_build_object('ok', true, 'applied', false, 'axis_type', p_axis_type,
      'axis_a', pr.axis_a, 'axis_b', pr.axis_b, 'axis_c', pr.axis_c,
      'authority', pr.authority, 'new_profile', row_to_json(pr)::jsonb);
  end if;

  new_a := least(APEX, coalesce(pr.axis_a, 0.001));
  new_b := least(APEX, coalesce(pr.axis_b, 0.001));
  new_c := least(APEX, coalesce(pr.axis_c, 0.001));
  if p_axis_type = 'a' then new_a := least(APEX, new_a + p_points);
  elsif p_axis_type = 'b' then new_b := least(APEX, new_b + p_points);
  elsif p_axis_type = 'c' then new_c := least(APEX, new_c + p_points);
  end if;

  auth_score := sqrt(power(new_a,3) + power(new_b,3) + power(new_c,3)) * PHI / EU;
  old_v := case p_axis_type when 'a' then pr.axis_a when 'b' then pr.axis_b else pr.axis_c end;
  new_v := case p_axis_type when 'a' then new_a when 'b' then new_b else new_c end;

  update public.profiles set axis_a = new_a, axis_b = new_b, axis_c = new_c,
    authority = auth_score, nodes_earned = coalesce(nodes_earned, 0) + 1
  where id = uid;

  insert into public.task_completions(
    user_id, kind, task, task_name, task_type, axis_type, description, points_earned,
    axis_a_before, axis_b_before, axis_c_before,
    axis_a_after, axis_b_after, axis_c_after, auth_after, completed_at
  ) values (
    uid, p_task_type, p_task_name, p_task_name, p_task_type, p_axis_type, p_description, p_points,
    pr.axis_a, pr.axis_b, pr.axis_c, new_a, new_b, new_c, auth_score, now()
  );

  select coalesce(bool_value,
    case when lower(coalesce(text_value,'')) in ('true','1','yes','on') then true else false end,
    false)
  into notify_en
  from public.platform_settings
  where key = 'notifications_enabled'
  limit 1;

  if notify_en then
    msg := 'Completed: ' || p_task_name;
    insert into public.notifications(user_id, notification_type, message)
      values (uid, 'task_complete', msg);
  end if;

  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  if new_m > old_m then
    for k in (old_m+1)..new_m loop
      if p_axis_type = 'a' then
        insert into public.certificates (user_id, title, cert_num)
          select uid, 'Sovereign Certificate ' || k, k
          where not exists (select 1 from public.certificates where user_id=uid and cert_num=k);
        unlocked := unlocked || jsonb_build_object('type','certificate','n',k);
        if notify_en then
          insert into public.notifications(user_id, notification_type, message)
            values (uid, 'achievement', public.notify_achievement('certificate', k));
        end if;
      elsif p_axis_type = 'b' then
        insert into public.trophies (user_id, trophy_num)
          select uid, k where not exists (select 1 from public.trophies where user_id=uid and trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type','trophy','n',k);
        if notify_en then
          insert into public.notifications(user_id, notification_type, message)
            values (uid, 'achievement', public.notify_achievement('trophy', k));
        end if;
      else
        insert into public.medals (user_id, medal_num)
          select uid, k where not exists (select 1 from public.medals where user_id=uid and medal_num=k);
        unlocked := unlocked || jsonb_build_object('type','medal','n',k);
        if notify_en then
          insert into public.notifications(user_id, notification_type, message)
            values (uid, 'achievement', public.notify_achievement('medal', k));
        end if;
      end if;
    end loop;
  end if;

  if floor(new_a) = floor(new_b) and floor(new_b) = floor(new_c)
     and floor(new_v) in (3,6,9) and floor(new_v) > floor(old_v) then
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
    if notify_en then
      msg := 'Gate Unlocked: Level ' || floor(new_v);
      insert into public.notifications(user_id, notification_type, message)
        values (uid, 'achievement', msg);
    end if;
  end if;

  update public.profiles set
    certificates_earned = (select count(*) from public.certificates where user_id=uid),
    trophies_earned = (select count(*) from public.trophies where user_id=uid and trophy_num is not null),
    medals_earned = (select count(*) from public.medals where user_id=uid)
  where id = uid;

  return jsonb_build_object(
    'ok', true, 'applied', true, 'axis_type', p_axis_type,
    'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c,
    'authority', auth_score, 'points', p_points, 'unlocked', unlocked,
    'new_profile', row_to_json(pr)::jsonb || jsonb_build_object(
      'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c, 'authority', auth_score
    )
  );
end;
$function$;
