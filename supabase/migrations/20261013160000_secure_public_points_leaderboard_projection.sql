-- A public leaderboard is a deliberately narrow cross-member projection.
-- The points ledger itself remains member/owner scoped by RLS; an invoker RPC
-- cannot calculate a public ranking from other members' rows. SECURITY DEFINER
-- is therefore confined to this allowlisted projection, with a locked search
-- path and explicit public/approved/active/family visibility predicates.
create or replace function public.get_points_leaderboard(p_limit integer default 10)
 returns table(
   rank integer,
   display_name text,
   element text,
   sign text,
   level integer,
   lifetime_points integer,
   is_self boolean
 )
 language plpgsql
 stable
 security definer
 set search_path = ''
as $function$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;

  return query
  with totals as (
    select l.user_id,
           coalesce(sum(l.delta) filter (where l.delta > 0), 0)::integer as pts
      from public.sovereign_points_ledger as l
     group by l.user_id
  )
  select
    row_number() over (order by t.pts desc, p.id)::integer,
    coalesce(nullif(btrim(p.display_name), ''), 'MEMBER'),
    p.element,
    p.sign,
    (floor(sqrt(t.pts / 25.0))::integer + 1),
    t.pts,
    (p.id = v_uid)
  from totals as t
  join public.profiles as p on p.id = t.user_id
  where t.pts > 0
    and (p.is_public is true or p.id = v_uid)
    and (p.access_approved is true or p.is_owner is true)
    and p.deactivated_at is null
    and (p.family_of is null or p.id = v_uid)
  order by t.pts desc, p.id
  limit greatest(1, least(coalesce(p_limit, 10), 50));
end;
$function$;

revoke all on function public.get_points_leaderboard(integer) from public, anon;
grant execute on function public.get_points_leaderboard(integer) to authenticated;

comment on function public.get_points_leaderboard(integer) is
  'Narrow member-visible points projection. SECURITY DEFINER is required to aggregate other users'' ledger rows because ledger RLS is member/owner scoped; only public, approved, active profiles are ranked, and linked family profiles are excluded except from their own row.';
