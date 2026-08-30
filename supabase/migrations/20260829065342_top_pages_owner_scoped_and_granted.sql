-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: applied to production with no file in this
-- directory. Exact recorded statement, not a reconstruction.

-- public.top_pages existed live with NO grant to `authenticated`, so
-- dashboard.html:953's read failed 42501 for everyone including the owner --
-- the widget it feeds has simply never rendered. (The read sits in a bare
-- try/catch, so it failed silently.)
--
-- The naive fix -- GRANT SELECT ... TO authenticated -- would have been wrong.
-- The view has no security_invoker option set (reloptions IS NULL) and is owned
-- by postgres, so it runs with the OWNER's privileges and bypasses RLS on
-- telemetry_events entirely. Granting it to `authenticated` would have exposed
-- platform-wide traffic analytics -- page names, total views, unique member
-- counts -- to every approved member.
--
-- dashboard.html already gates the widget with `if(pr.is_owner){...}` and
-- renders "N VIEWS - N MEMBERS", so this is owner-only operational data by
-- intent. But a client-side `if` is not an authorization boundary: CLAUDE.md 5
-- is explicit that RLS is the boundary, not application code. Anyone with the
-- anon key could have read the view directly once it was granted.
--
-- So the filter is moved into the view itself and then the grant is safe:
-- a non-owner gets zero rows from the database, not merely a hidden widget.
-- omega_is_owner() is used rather than is_platform_owner() because it checks
-- platform_owners AND falls back to profiles.is_owner, which is the same
-- signal the client's `pr.is_owner` reads -- verified live: 2 rows in
-- platform_owners, 2 profiles with is_owner = true.
--
-- Column list preserved exactly as dashboard.html selects it
-- (page, total_views, unique_users) plus the two it does not currently use.

CREATE OR REPLACE VIEW public.top_pages AS
  SELECT page,
         count(*)                     AS total_views,
         count(DISTINCT session_id)   AS unique_sessions,
         count(DISTINCT user_id)      AS unique_users,
         max(created_at)              AS last_viewed
  FROM public.telemetry_events
  WHERE event_type = 'page_view'
    AND page IS NOT NULL
    AND public.omega_is_owner()
  GROUP BY page
  ORDER BY count(*) DESC;

GRANT SELECT ON public.top_pages TO authenticated;
