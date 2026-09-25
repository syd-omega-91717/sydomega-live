-- Scope platform owner metadata to the authenticated owner only.
DROP POLICY IF EXISTS "platform owners read self" ON public.platform_owners;
CREATE POLICY "platform owners read self"
ON public.platform_owners
FOR SELECT
TO authenticated
USING (user_id = (select auth.uid()));
