-- Gamification Phase 2 (2/6): equip RPC, derived progression, points leaderboard.
-- my_progression is switched to SECURITY INVOKER by 20261003214237.

-- Equip or unequip an owned cosmetic. One equipped item per slot.
create or replace function public.set_perk_equipped(p_perk_id text, p_equipped boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_slot text;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  if not public.get_platform_flag('gamification_enabled') then
    return jsonb_build_object('ok', false, 'error', 'feature_disabled');
  end if;
  select slot into v_slot from public.point_perks where id = p_perk_id;
  if v_slot is null then
    return jsonb_build_object('ok', false, 'error', 'not_equippable');
  end if;
  perform 1 from public.member_perks
    where user_id = v_uid and perk_id = p_perk_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_owned');
  end if;
  if p_equipped then
    update public.member_perks mp set equipped = false
      from public.point_perks pp
      where mp.user_id = v_uid and mp.perk_id = pp.id and pp.slot = v_slot and mp.equipped;
  end if;
  update public.member_perks set equipped = p_equipped
    where user_id = v_uid and perk_id = p_perk_id;
  return jsonb_build_object('ok', true, 'perk_id', p_perk_id, 'slot', v_slot, 'equipped', p_equipped);
end;
$$;
revoke execute on function public.set_perk_equipped(text, boolean) from public, anon;
grant execute on function public.set_perk_equipped(text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Progression: derived from the points ledger, never stored
-- ---------------------------------------------------------------------------
-- Level L begins at 25*(L-1)^2 lifetime points: 0, 25, 100, 225, 400, ...
create or replace function public.my_progression()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_lifetime int;
  v_balance int;
  v_level int;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'not_authenticated');
  end if;
  select coalesce(sum(delta) filter (where delta > 0), 0)::int,
         coalesce(sum(delta), 0)::int
    into v_lifetime, v_balance
    from public.sovereign_points_ledger where user_id = v_uid;
  v_level := floor(sqrt(v_lifetime / 25.0))::int + 1;
  return jsonb_build_object(
    'ok', true,
    'lifetime_points', v_lifetime,
    'balance', v_balance,
    'level', v_level,
    'level_floor', 25 * (v_level - 1) * (v_level - 1),
    'next_level_at', 25 * v_level * v_level,
    'enabled', public.get_platform_flag('gamification_enabled'),
    'equipped', coalesce((
      select jsonb_agg(jsonb_build_object('perk_id', pp.id, 'slot', pp.slot, 'name', pp.name) order by pp.slot)
        from public.member_perks mp join public.point_perks pp on pp.id = mp.perk_id
        where mp.user_id = v_uid and mp.equipped and pp.slot is not null
    ), '[]'::jsonb)
  );
end;
$$;
revoke execute on function public.my_progression() from public, anon;
grant execute on function public.my_progression() to authenticated;

-- Points leaderboard: members who chose a public profile, plus the caller.
create or replace function public.get_points_leaderboard(p_limit int default 10)
returns table(rank int, display_name text, element text, sign text, level int, lifetime_points int, is_self boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    return;
  end if;
  return query
  with totals as (
    select l.user_id, coalesce(sum(l.delta) filter (where l.delta > 0), 0)::int as pts
      from public.sovereign_points_ledger l
      group by l.user_id
  )
  select (row_number() over (order by t.pts desc, p.id))::int,
         coalesce(nullif(btrim(p.display_name), ''), 'MEMBER'),
         p.element, p.sign,
         (floor(sqrt(t.pts / 25.0))::int + 1),
         t.pts,
         (p.id = v_uid)
    from totals t
    join public.profiles p on p.id = t.user_id
    where t.pts > 0
      and (p.is_public is true or p.id = v_uid)
      and (p.access_approved is true or p.is_owner is true)
      and p.deactivated_at is null
    order by t.pts desc, p.id
    limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$$;
revoke execute on function public.get_points_leaderboard(int) from public, anon;
grant execute on function public.get_points_leaderboard(int) to authenticated;
