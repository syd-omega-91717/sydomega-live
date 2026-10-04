-- Gamification Phase 2 (5/6): member_quests insert/update, both gated on
-- platform_settings.gamification_enabled (ships false).

create policy member_quests_own_insert on public.member_quests for insert to authenticated
  with check ((select auth.uid()) = user_id and (select public.get_platform_flag('gamification_enabled')));
create policy member_quests_own_update on public.member_quests for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and (select public.get_platform_flag('gamification_enabled')));
