-- SYD OMEGA 91717 — Hall of Sovereigns leaderboard (privacy-safe, real members only)
-- Returns only public-safe fields, ordered by authority. No emails, no ids.
create or replace function public.leaderboard(p_limit int default 100)
returns table(display_name text, sign text, element text, axis_a numeric, axis_b numeric, axis_c numeric)
language sql security definer set search_path=public stable as $$
  select coalesce(nullif(trim(display_name),''),'Sovereign'),
         sign, element,
         coalesce(axis_a,1), coalesce(axis_b,1), coalesce(axis_c,1)
  from public.profiles
  where sign is not null
  order by (coalesce(axis_a,1)^2 + coalesce(axis_b,1)^2 + coalesce(axis_c,1)^2) desc,
           coalesce(display_name,'') asc
  limit greatest(1, least(coalesce(p_limit,100), 200));
$$;
grant execute on function public.leaderboard(int) to authenticated;
