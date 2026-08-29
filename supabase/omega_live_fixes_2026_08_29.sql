-- ============================================================================
-- omega_live_fixes_2026_08_29.sql
--
-- Two live-schema fixes, found by running the first real database verification
-- this repo has had. Everything before this was source- and browser-level only
-- (CLAUDE.md 8.4: "a BUILT row means the CLIENT is wired and nothing more").
--
-- Both were APPLIED to the live database (project ydqhzvvoyufiiqvzcjns) and
-- verified by role impersonation before being written here. Recorded in the
-- flat bag because the bag is the source of truth for new schema changes
-- (CLAUDE.md 5).
--
-- HOW THEY WERE FOUND: every table named in a client `.from(...)` call (57 of
-- them) was checked against live for existence, grants to `authenticated`, and
-- policy count. 53 came back fully healthy. Four did not:
--   transactions     MISSING -- known, deliberate (CLAUDE.md 8.2, tokens dormant)
--   wallet_balances  MISSING -- known, deliberate (same)
--   oaths            MISSING -- NOT previously documented anywhere  <- fixed below
--   top_pages        view, no grant to authenticated                <- fixed below
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. `oaths` -- a whole feature that never reached the server.
--
-- oath.html inserts to and selects from public.oaths. The table is declared in
-- supabase/chunk_09_new_features.sql, but that file was never applied: 3 of its
-- 4 tables are absent live (oaths, codex_bookmarks, signal_saves; only
-- user_dedication exists).
--
-- Nothing crashed, because oath.html is written correctly -- it checks
-- res.error and falls back to localStorage with a different toast
-- ("OATH HASHED" rather than "OATH SEALED"). So this is NOT the silent-success
-- class of CLAUDE.md 8.1(1). The consequence is quieter and arguably worse:
-- every oath any member has ever sworn lives only in that member's browser,
-- has never been persisted, and is lost with their cache.
--
-- Applied verbatim from the bag's own declaration. Reviewed before applying:
--   * oaths_insert is WITH CHECK (auth.uid() = user_id) -- correctly scoped,
--     NOT the WITH CHECK(true) spoofing shape of CLAUDE.md 8.1(6b).
--   * oaths_read is USING (true) -- deliberate; the file comments it as a
--     "transparent ledger" and loadOaths() reads all members' oaths, so this
--     matches the feature as built rather than widening it.
--   * No UPDATE/DELETE policies -- oaths are immutable by design.
--   * The GRANT is present and matches the policies, so this does not repeat
--     the policy-without-grant class of 8.1(6c) that broke 22 live features.
--   * The client's six category values were checked against the CHECK
--     constraint first (SOVEREIGNTY, DISCIPLINE, EXCELLENCE, LOYALTY, HONOR,
--     VISION -- oath.html's data-cat attributes). A mismatch would have made
--     every insert fail on a check violation.
--
-- codex_bookmarks and signal_saves are deliberately NOT created: codex.html
-- uses localStorage only and never calls .from('codex_bookmarks'), and
-- signal_saves has zero references anywhere in the repo. Creating them would
-- be building unwired features, not fixing a bug.
--
-- VERIFIED LIVE by impersonating a real non-owner member (set_config('role',
-- 'authenticated') + request.jwt.claims), all eight checks:
--   member SELECT            -> OK
--   member INSERT as self    -> allowed, AND the row was confirmed present
--                               afterwards (not merely "did not error")
--   member INSERT as OTHER   -> refused 42501   (no spoofing)
--   member UPDATE            -> refused 42501   (immutable)
--   member DELETE            -> refused 42501   (immutable)
--   anon SELECT              -> refused 42501
--   probe rows removed; table left at 0 rows.

CREATE TABLE IF NOT EXISTS public.oaths (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category       text NOT NULL DEFAULT 'SOVEREIGNTY'
                   CHECK (category IN ('SOVEREIGNTY','DISCIPLINE','EXCELLENCE','LOYALTY','HONOR','VISION')),
  oath_text      text NOT NULL CHECK (char_length(oath_text) BETWEEN 10 AND 1000),
  hash_sha256    text NOT NULL,
  sworn_at       timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS oaths_hash_unique  ON public.oaths(hash_sha256);
CREATE INDEX        IF NOT EXISTS oaths_user_id_idx  ON public.oaths(user_id);
CREATE INDEX        IF NOT EXISTS oaths_sworn_at_idx ON public.oaths(sworn_at DESC);

ALTER TABLE public.oaths ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='oaths' AND policyname='oaths_read') THEN
    CREATE POLICY oaths_read ON public.oaths FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='oaths' AND policyname='oaths_insert') THEN
    CREATE POLICY oaths_insert ON public.oaths FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

GRANT SELECT, INSERT ON public.oaths TO authenticated;


-- ----------------------------------------------------------------------------
-- 2. `top_pages` -- a view nobody could read, and the wrong way to fix it.
--
-- The view existed live with NO grant to `authenticated`, so dashboard.html:953
-- failed 42501 for everyone, the owner included -- that widget has never
-- rendered. The read sits in a bare try/catch, so it failed silently.
--
-- The obvious fix (GRANT SELECT ... TO authenticated) would have been a
-- privacy regression. The view had no security_invoker option (reloptions was
-- NULL) and is owned by postgres, so it ran with the OWNER's privileges and
-- bypassed RLS on telemetry_events entirely. Granting it would have exposed
-- platform-wide traffic analytics -- page names, view counts, unique member
-- counts -- to every approved member.
--
-- dashboard.html gates the widget with `if(pr.is_owner)` and renders
-- "N VIEWS - N MEMBERS", so this is owner-only operational data by intent. But
-- a client-side `if` is not an authorization boundary: anyone with the anon key
-- could have queried the view directly once granted. CLAUDE.md 5 is explicit
-- that RLS is the boundary, not application code.
--
-- telemetry_events already carries exactly the right policies:
--     "owner reads all telemetry"    SELECT USING (is_platform_owner())
--     "member inserts own telemetry" INSERT WITH CHECK (auth.uid() = user_id)
--
-- so security_invoker = true makes the view run as the CALLER and lets that RLS
-- decide. The owner sees every page_view; a non-owner matches no SELECT policy
-- and sees nothing.
--
-- A FIRST ATTEMPT ADDED `AND public.omega_is_owner()` TO THE VIEW BODY INSTEAD,
-- KEEPING SECURITY DEFINER. It worked, but Supabase's advisor flagged it
-- ERROR security_definer_view -- the only ERROR on the project -- and it
-- duplicated an authorization rule using a DIFFERENT owner helper from the one
-- the table's own policy uses (omega_is_owner vs is_platform_owner). They agree
-- today, but a duplicated rule that can drift from the one that actually binds
-- is a latent bug, not defence in depth. Superseded by this version. One
-- boundary: the base table's RLS.
--
-- VERIFIED LIVE, on a real seeded row (both cases return 0 on an empty table
-- and would have proved nothing):
--   security_invoker=true confirmed set on pg_class.reloptions
--   OWNER      -> 1 row
--   NON-OWNER  -> 0 rows
--   anon       -> refused 42501
--   probe telemetry row removed; telemetry_events back to 0 rows.
-- Advisor after: 174 lints/1 ERROR -> 173 lints/0 ERROR.

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


-- ----------------------------------------------------------------------------
-- REVIEWED AND DELIBERATELY NOT CHANGED
--
-- public.report_client_error(...) is the one anon-callable SECURITY DEFINER
-- function the advisor still warns about, and it is correct as built: it is
-- write-only (INSERTs into client_errors, returns only {ok:...} and never
-- data), rate-limited to 20 calls per 10 minutes per user or per page for anon,
-- truncates every input with left(), and pins search_path. anon must be able to
-- call it because the public pages (account, enter, reset, terms, pending,
-- index) report errors for signed-out visitors. Recorded as reviewed rather
-- than "fixed".
-- ----------------------------------------------------------------------------
