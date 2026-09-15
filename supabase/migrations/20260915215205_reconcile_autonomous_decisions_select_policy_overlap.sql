-- Reconcile autonomous_decisions SELECT policy overlap without reducing owner visibility.
-- Member read remains available to members and platform owners; owner write/delete
-- privileges are separated by command so SELECT is governed by one policy.
DROP POLICY IF EXISTS autonomous_decisions_owner_admin ON public.autonomous_decisions;

ALTER POLICY autonomous_decisions_member_read ON public.autonomous_decisions
  USING ((member_id = (SELECT auth.uid())) OR is_platform_owner());

CREATE POLICY autonomous_decisions_owner_admin
  ON public.autonomous_decisions
  FOR INSERT TO public
  WITH CHECK (is_platform_owner());

CREATE POLICY autonomous_decisions_owner_admin_update
  ON public.autonomous_decisions
  FOR UPDATE TO public
  USING (is_platform_owner())
  WITH CHECK (is_platform_owner());

CREATE POLICY autonomous_decisions_owner_admin_delete
  ON public.autonomous_decisions
  FOR DELETE TO public
  USING (is_platform_owner());
