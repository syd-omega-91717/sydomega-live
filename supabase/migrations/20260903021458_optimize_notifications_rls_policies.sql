BEGIN;
DROP POLICY IF EXISTS "members read own notifications" ON public.notifications;
DROP POLICY IF EXISTS "notif_select" ON public.notifications;
DROP POLICY IF EXISTS "members update own read status" ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own" ON public.notifications;
CREATE POLICY "notifications_authenticated_select_own_or_owner" ON public.notifications FOR SELECT TO authenticated
USING (((select auth.uid()) = user_id) OR (select private.is_platform_owner()));
CREATE POLICY "notifications_authenticated_update_own" ON public.notifications FOR UPDATE TO authenticated
USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "members manage own digest preferences" ON public.digest_preferences;
CREATE POLICY "digest_preferences_authenticated_own" ON public.digest_preferences FOR ALL TO authenticated
USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "oaths_insert" ON public.oaths;
CREATE POLICY "oaths_authenticated_insert_own" ON public.oaths FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "creator_proposals_delete_own_draft" ON public.creator_proposals;
DROP POLICY IF EXISTS "creator_proposals_insert_own" ON public.creator_proposals;
DROP POLICY IF EXISTS "creator_proposals_select_own" ON public.creator_proposals;
DROP POLICY IF EXISTS "creator_proposals_update_own_draft" ON public.creator_proposals;
CREATE POLICY "creator_proposals_authenticated_select_own" ON public.creator_proposals FOR SELECT TO authenticated
USING ((select auth.uid()) = owner_id);
CREATE POLICY "creator_proposals_authenticated_insert_own" ON public.creator_proposals FOR INSERT TO authenticated
WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "creator_proposals_authenticated_update_own_draft" ON public.creator_proposals FOR UPDATE TO authenticated
USING ((select auth.uid()) = owner_id AND status IN ('draft','rejected')) WITH CHECK ((select auth.uid()) = owner_id);
CREATE POLICY "creator_proposals_authenticated_delete_own_draft" ON public.creator_proposals FOR DELETE TO authenticated
USING ((select auth.uid()) = owner_id AND status = 'draft');
COMMIT;
