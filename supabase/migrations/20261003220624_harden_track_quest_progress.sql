-- Harden the Phase 1 quest-progress path (GAP_ANALYSIS.md section S, opened 2026-10-03).
--
-- Before: track_quest_progress was SECURITY DEFINER with no search_path and the
-- default ACL (anon could execute it), took p_user_id and p_points from the
-- caller, and never checked auth.uid() -- anyone holding the publishable key
-- could write any member's quest_completions/domain_mastery. It also never
-- worked: level = floor(points/200) is 0 below 200 points, which violates
-- domain_mastery's CHECK (level >= 1), so every call raised and both tables
-- stayed empty. Separately, members held INSERT/UPDATE on quest_completions,
-- domain_mastery, leaderboard_entries and covenant_progress, so they could
-- write their own standings directly; no page does (all four are read-only in
-- the client), so those grants only served forgery.
--
-- After: the caller is auth.uid() (a mismatched p_user_id is refused, the
-- argument is kept so habits.html keeps working unchanged), points are clamped
-- server-side to 0..10, one award per quest per UTC day (re-toggling a habit
-- earns nothing), level is 1 + points/200 capped at 9, and the progression
-- tables are written only through this function.

create or replace function public.track_quest_progress(
  p_user_id uuid, p_domain text, p_quest_id text, p_points integer default 10)
returns table(new_level integer, level_up boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_points int := least(greatest(coalesce(p_points, 0), 0), 10);
  v_last timestamp;
  v_inserted int;
  v_old_level int;
  v_new_level int;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if p_user_id is distinct from v_uid then
    raise exception 'progress can only be recorded for the signed-in member' using errcode = '42501';
  end if;
  if p_domain is null or p_domain !~ '^[a-z][a-z_]{0,31}$' then
    raise exception 'invalid domain' using errcode = '22023';
  end if;
  if p_quest_id is null or char_length(p_quest_id) not between 1 and 120 then
    raise exception 'invalid quest id' using errcode = '22023';
  end if;

  select coalesce(dm.level, 1) into v_old_level
    from public.domain_mastery dm where dm.user_id = v_uid and dm.domain = p_domain;
  v_old_level := coalesce(v_old_level, 1);

  select qc.updated_at into v_last
    from public.quest_completions qc
    where qc.user_id = v_uid and qc.quest_id = p_quest_id
    for update;

  if found then
    -- One award per quest per day.
    if v_last >= date_trunc('day', now() at time zone 'utc') then
      return query select v_old_level, false;
      return;
    end if;
    update public.quest_completions
      set progress = target, completed_at = now(), updated_at = now(),
          reward_points = reward_points + v_points
      where user_id = v_uid and quest_id = p_quest_id;
  else
    insert into public.quest_completions(user_id, quest_id, domain, progress, target, completed_at, reward_points, updated_at)
      values (v_uid, p_quest_id, p_domain, 1, 1, now(), v_points, now())
      on conflict (user_id, quest_id) do nothing;
    get diagnostics v_inserted = row_count;
    if v_inserted = 0 then
      -- A concurrent call won the race and already awarded today.
      return query select v_old_level, false;
      return;
    end if;
  end if;

  insert into public.domain_mastery(user_id, domain, level, total_points, quests_completed, last_active)
    values (v_uid, p_domain, least(1 + v_points / 200, 9), v_points, 1, now())
    on conflict (user_id, domain) do update
      set total_points = public.domain_mastery.total_points + excluded.total_points,
          quests_completed = public.domain_mastery.quests_completed + 1,
          level = least(1 + (public.domain_mastery.total_points + excluded.total_points) / 200, 9),
          last_active = now()
    returning level into v_new_level;

  return query select v_new_level, (v_new_level > v_old_level);
end;
$$;
revoke execute on function public.track_quest_progress(uuid, text, text, integer) from public, anon;
grant execute on function public.track_quest_progress(uuid, text, text, integer) to authenticated;
