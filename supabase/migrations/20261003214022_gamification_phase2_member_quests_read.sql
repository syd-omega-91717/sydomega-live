-- Gamification Phase 2 (4/6): member_quests grant + read/delete policies.
-- Deleting your own quest stays possible while the feature is off.

grant select, insert, update, delete on table public.member_quests to authenticated;
create policy member_quests_own_read on public.member_quests for select to authenticated
  using ((select auth.uid()) = user_id or (select public.is_platform_owner()));
create policy member_quests_own_delete on public.member_quests for delete to authenticated
  using ((select auth.uid()) = user_id);
