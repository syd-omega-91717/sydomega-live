-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: applied to production with no file here.
-- Exact recorded statement.

-- dispatches_select carried three OR branches:
--   (is_published = true) OR is_platform_owner() OR (auth.role() = 'authenticated')
-- The third makes the first meaningless: every approved member could read every
-- row, published or not, so an unpublished draft was visible platform-wide.
-- Nothing leaks today (the table holds exactly 1 row and it is published), which
-- is why this is the moment to fix it.
--
-- Replaced with an author branch, which is what the blanket branch was standing
-- in for: published dispatches stay visible to members, the owner still sees
-- everything, and an author still sees their own drafts.
DROP POLICY IF EXISTS dispatches_select ON public.dispatches;
CREATE POLICY dispatches_select ON public.dispatches
  FOR SELECT
  USING (
    is_published = true
    OR public.is_platform_owner()
    OR user_id = (SELECT auth.uid())
  );
