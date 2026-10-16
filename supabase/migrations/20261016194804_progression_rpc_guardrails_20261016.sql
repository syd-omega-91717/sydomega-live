-- Migration: 20261016194804_progression_rpc_guardrails_20261016.sql
-- The public complete_task RPC is callable by authenticated clients. Bound
-- client-supplied inputs and serialize per-user awards until source-specific
-- verified-task award paths replace self-reported completion claims.
create index if not exists task_completions_user_completed_at_points_idx
  on public.task_completions (user_id, completed_at desc)
  where points_earned > 0;

-- Ω SYD OMEGA 91717
-- Client-facing progression RPC guardrails.
-- Interim abuse controls: source-specific proof remains a separate follow-up.
-- Do not grant client-supplied point amounts without server-side validation.

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
set search_path = ''
as $function$
declare
  uid uuid := auth.uid();
  pr public.profiles%rowtype;
  MAX_POINTS_PER_CALL constant numeric := 0.12;
  MAX_POINTS_PER_24H constant numeric := 0.30;
  recent_points numeric := 0;
  applied_points numeric := 0;
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
  if uid is null then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'unauthenticated');
  end if;

  if p_task_name is null
     or p_task_name <> btrim(p_task_name)
     or length(p_task_name) not between 1 and 160 then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'invalid_task_name');
  end if;

  if p_task_type is null
     or p_task_type <> btrim(p_task_type)
     or length(p_task_type) not between 1 and 48 then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'invalid_task_type');
  end if;

  if p_axis_type is null or p_axis_type not in ('a', 'b', 'c') then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'invalid_axis');
  end if;

  if p_description is not null and length(p_description) > 500 then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'description_too_long');
  end if;

  if p_points is null or p_points < 0 or p_points > MAX_POINTS_PER_CALL then
    return jsonb_build_object('ok', false, 'applied', false, 'error', 'invalid_points',
      'max_points_per_call', MAX_POINTS_PER_CALL);
  end if;

  -- Serialize per-member awards so concurrent calls cannot race the rolling cap
  -- or the existing idempotency lookup.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(uid::text, 0));

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
  old_v := case p_axis_type
    when 'a' then coalesce(pr.axis_a, 0.001)
    when 'b' then coalesce(pr.axis_b, 0.001)
    else coalesce(pr.axis_c, 0.001)
  end;
  new_v := case p_axis_type when 'a' then new_a when 'b' then new_b else new_c end;
  applied_points := greatest(0, new_v - old_v);

  select coalesce(sum(points_earned), 0)
    into recent_points
    from public.task_completions
   where user_id = uid
     and completed_at >= now() - interval '24 hours'
     and points_earned > 0;

  if applied_points > 0 and recent_points + applied_points > MAX_POINTS_PER_24H then
    return jsonb_build_object('ok', false, 'applied', false,
      'error', 'progression_daily_cap_exceeded');
  end if;

  update public.profiles set axis_a = new_a, axis_b = new_b, axis_c = new_c,
    authority = auth_score, nodes_earned = coalesce(nodes_earned, 0) + case when applied_points > 0 then 1 else 0 end
  where id = uid;

  insert into public.task_completions(
    user_id, kind, task, task_name, task_type, axis_type, description, points_earned,
    axis_a_before, axis_b_before, axis_c_before,
    axis_a_after, axis_b_after, axis_c_after, auth_after, completed_at
  ) values (
    uid, p_task_type, p_task_name, p_task_name, p_task_type, p_axis_type, p_description, applied_points,
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
    'authority', auth_score, 'points', applied_points, 'unlocked', unlocked,
    'new_profile', row_to_json(pr)::jsonb || jsonb_build_object(
      'axis_a', new_a, 'axis_b', new_b, 'axis_c', new_c, 'authority', auth_score
    )
  );
end;
$function$;

comment on function private.complete_task(text, text, text, text, numeric) is
  'Authenticated task-completion bridge with strict input bounds, per-member serialization, and a rolling 24-hour point cap. This is defense-in-depth, not proof of task completion; source-specific verifiers remain required for competitive awards.';
