-- ============================================================================
-- SYD OMEGA 91717 -- PERSONAL LOGS (real backend for 6 pages that only saved
-- to localStorage, or in events.html's case, didn't save anywhere at all)
-- Pages: bloodline.html, heritage.html, events.html, research.html,
-- social.html, travel.html. Each member's own data, RLS-scoped to themselves.
-- Idempotent -- safe to re-run.
-- ============================================================================
BEGIN;

-- bloodline.html -- family tree nodes ------------------------------------
CREATE TABLE IF NOT EXISTS public.bloodline_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL, rel text, birth text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bloodline_nodes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS bloodline_own ON public.bloodline_nodes;
CREATE POLICY bloodline_own ON public.bloodline_nodes FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.bloodline_nodes TO authenticated;

-- heritage.html -- archive records ----------------------------------------
CREATE TABLE IF NOT EXISTS public.heritage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, body text, era text, category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.heritage_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS heritage_own ON public.heritage_records;
CREATE POLICY heritage_own ON public.heritage_records FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.heritage_records TO authenticated;

-- events.html -- member-created events (was fully non-functional) + RSVPs --
CREATE TABLE IF NOT EXISTS public.member_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL, event_date text, format text, event_type text, description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.member_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS events_read ON public.member_events;
CREATE POLICY events_read ON public.member_events FOR SELECT TO authenticated USING (true); -- events are visible to all members
DROP POLICY IF EXISTS events_write ON public.member_events;
CREATE POLICY events_write ON public.member_events FOR INSERT TO authenticated WITH CHECK (auth.uid()=user_id);
DROP POLICY IF EXISTS events_delete ON public.member_events;
CREATE POLICY events_delete ON public.member_events FOR DELETE TO authenticated
  USING (auth.uid()=user_id OR public.is_platform_owner());
GRANT SELECT, INSERT, DELETE ON public.member_events TO authenticated;

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  event_ref text NOT NULL,  -- either a member_events.id (as text) or a static catalog event key
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_ref)
);
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS rsvp_own ON public.event_rsvps;
CREATE POLICY rsvp_own ON public.event_rsvps FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.event_rsvps TO authenticated;

-- research.html -- hypothesis submissions ---------------------------------
CREATE TABLE IF NOT EXISTS public.research_hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text, title text NOT NULL, body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.research_hypotheses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS research_own ON public.research_hypotheses;
CREATE POLICY research_own ON public.research_hypotheses FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.research_hypotheses TO authenticated;

-- social.html -- platform connections + broadcasts ------------------------
CREATE TABLE IF NOT EXISTS public.social_connections (
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL,
  handle text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, platform)
);
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS social_conn_own ON public.social_connections;
CREATE POLICY social_conn_own ON public.social_connections FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_connections TO authenticated;

CREATE TABLE IF NOT EXISTS public.social_broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  networks text[], body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.social_broadcasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS broadcast_own ON public.social_broadcasts;
CREATE POLICY broadcast_own ON public.social_broadcasts FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT ON public.social_broadcasts TO authenticated;

-- travel.html -- journey log -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.travel_journeys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  destination text NOT NULL, purpose text, notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.travel_journeys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS travel_own ON public.travel_journeys;
CREATE POLICY travel_own ON public.travel_journeys FOR ALL TO authenticated
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
GRANT SELECT, INSERT, DELETE ON public.travel_journeys TO authenticated;

COMMIT;
