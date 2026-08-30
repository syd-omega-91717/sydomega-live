-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: applied to production with no file in this
-- directory. Exact recorded statement, not a reconstruction.

-- Follow-up to top_pages_owner_scoped_and_granted, correcting it.
--
-- That migration kept the view's inherited SECURITY DEFINER behaviour and
-- added `AND public.omega_is_owner()` to scope it. It worked -- owner saw
-- rows, non-owner saw none, anon was refused -- but Supabase's security
-- advisor rightly flags it as ERROR security_definer_view, and it was the only
-- ERROR on the project. Inheriting a risk pattern into an object I had just
-- touched is not acceptable when a better mechanism exists.
--
-- public.telemetry_events already carries exactly the right policies:
--     "owner reads all telemetry"     SELECT USING (is_platform_owner())
--     "member inserts own telemetry"  INSERT WITH CHECK (auth.uid() = user_id)
--
-- so setting security_invoker = true makes the view run as the CALLER and lets
-- that RLS decide: the owner sees every page_view, a non-owner matches no
-- SELECT policy and sees nothing. The authorization boundary is the base
-- table's RLS -- the canonical mechanism, and the one CLAUDE.md 5 names as the
-- real boundary.
--
-- The explicit omega_is_owner() filter is REMOVED rather than kept as belt and
-- braces, deliberately: the view would then depend on omega_is_owner() while
-- the table depends on is_platform_owner(). They agree today (2 rows in
-- platform_owners, 2 profiles with is_owner) but they are different functions,
-- and a duplicated authorization rule that can drift from the one that
-- actually binds is a latent bug, not defence in depth. One boundary.

CREATE OR REPLACE VIEW public.top_pages
WITH (security_invoker = true) AS
  SELECT page,
         count(*)                     AS total_views,
         count(DISTINCT session_id)   AS unique_sessions,
         count(DISTINCT user_id)      AS unique_users,
         max(created_at)              AS last_viewed
  FROM public.telemetry_events
  WHERE event_type = 'page_view'
    AND page IS NOT NULL
  GROUP BY page
  ORDER BY count(*) DESC;

GRANT SELECT ON public.top_pages TO authenticated;
