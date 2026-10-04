-- Omega hardening: remove unnecessary SECURITY DEFINER boundaries,
-- optimize auth.uid() RLS evaluation, and consolidate seasonal-event SELECT.

begin;

drop policy if exists covenant_member_access on public.covenant_progress;
create policy covenant_member_access on public.covenant_progress for select to public
  using (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists covenant_member_update on public.covenant_progress;
create policy covenant_member_update on public.covenant_progress for update to public
  using (((select auth.uid()) = user_id) or is_platform_owner())
  with check (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists quest_completions_member_access on public.quest_completions;
create policy quest_completions_member_access on public.quest_completions for select to public
  using (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists quest_completions_member_insert on public.quest_completions;
create policy quest_completions_member_insert on public.quest_completions for insert to public
  with check (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists quest_completions_member_update on public.quest_completions;
create policy quest_completions_member_update on public.quest_completions for update to public
  using (((select auth.uid()) = user_id) or is_platform_owner())
  with check (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists domain_mastery_member_access on public.domain_mastery;
create policy domain_mastery_member_access on public.domain_mastery for select to public
  using (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists domain_mastery_member_update on public.domain_mastery;
create policy domain_mastery_member_update on public.domain_mastery for update to public
  using (((select auth.uid()) = user_id) or is_platform_owner())
  with check (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists leaderboard_member_update on public.leaderboard_entries;
create policy leaderboard_member_update on public.leaderboard_entries for update to public
  using (((select auth.uid()) = user_id) or is_platform_owner())
  with check (((select auth.uid()) = user_id) or is_platform_owner());

drop policy if exists seasonal_events_owner_all on public.seasonal_events;
drop policy if exists seasonal_events_owner_insert on public.seasonal_events;
drop policy if exists seasonal_events_owner_update on public.seasonal_events;
drop policy if exists seasonal_events_owner_delete on public.seasonal_events;

create policy seasonal_events_owner_insert on public.seasonal_events for insert to public
  with check (is_platform_owner());
create policy seasonal_events_owner_update on public.seasonal_events for update to public
  using (is_platform_owner()) with check (is_platform_owner());
create policy seasonal_events_owner_delete on public.seasonal_events for delete to public
  using (is_platform_owner());

alter function public.get_points_leaderboard(integer)
  security invoker set search_path = pg_catalog, public;
alter function public.set_perk_equipped(text, boolean)
  security invoker set search_path = pg_catalog, public;
alter function public.track_quest_progress(uuid, text, text, integer)
  security invoker set search_path = pg_catalog, public;

commit;
