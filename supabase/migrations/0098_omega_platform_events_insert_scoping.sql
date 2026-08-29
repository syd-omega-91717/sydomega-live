-- ============================================================================
-- Ω PLATFORM_EVENTS INSERT SCOPING
--
-- `platform_events` carries a `user_id`, and its INSERT policy was named
-- "member inserts own events" while its check was literally `true`. The name
-- described an intent the policy did not implement: any member could have
-- inserted rows attributed to any other member. That is CLAUDE.md §8.1
-- class 6(b), the spoofing shape.
--
-- It was never exploitable, because `authenticated` holds only SELECT on this
-- table and no INSERT grant -- a grant is checked before row security, so the
-- policy never ran. This fixes the policy anyway, so that whenever an INSERT
-- grant is added the correct check is already in place rather than being a
-- second thing someone has to remember.
--
-- CORRECTION TO CLAUDE.md §8.2, which recorded this as affecting both
-- platform_events *and* platform_metrics "on tables that carry a user_id":
-- `platform_metrics` has no user_id column (only `id`), so there is no owner
-- to scope an insert to and this shape does not apply to it. Its SELECT,
-- UPDATE and DELETE policies are all `is_platform_owner()`, verified on the
-- live database -- so the DELETE/UPDATE grants `authenticated` holds there are
-- inert for non-owners. Left alone deliberately.
-- ============================================================================

DROP POLICY IF EXISTS "member inserts own events" ON public.platform_events;
CREATE POLICY "member inserts own events" ON public.platform_events
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
