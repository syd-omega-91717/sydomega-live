/* Applied live 2026-09-05 via apply_migration as version 20260905070904.
   Supabase performance advisor 0003_auth_rls_initplan, seven policies.

   Each policy read `auth.uid() = user_id`, which Postgres re-evaluates once
   PER ROW because auth.uid() is a function call in the row filter. Wrapping it
   in a scalar subquery makes the planner hoist it into an InitPlan, evaluated
   once per statement.

   ALTER POLICY, not DROP + CREATE: the drop/create pair leaves a window in
   which the table has RLS enabled and NO policy, which denies every row to
   every member until the create lands. ALTER is atomic and never opens that
   gap.

   Semantically identical -- auth.uid() is STABLE, so one evaluation per
   statement returns exactly what the per-row evaluation did. Verified after
   applying by inserting one row per member under impersonation inside a
   rolled-back transaction: member B saw 1 of the 2 rows, their own. */

ALTER POLICY codex_bm_own     ON public.codex_bookmarks
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY focus_own        ON public.focus_sessions
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY habit_logs_own   ON public.habit_logs
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY okr_kr_own       ON public.okr_key_results
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY okr_obj_own      ON public.okr_objectives
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY signal_saves_own ON public.signal_saves
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY wealth_own       ON public.wealth_snapshots
  USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
