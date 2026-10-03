-- Ω QUEST ECOSYSTEM v1 — Real progression tied to member behavior
-- Idempotent: CREATE ... IF NOT EXISTS, DROP POLICY IF EXISTS before CREATE.
--
-- RECONCILED 2026-10-03. The original file never ran through migration
-- history: `CREATE POLICY IF NOT EXISTS` is not valid PostgreSQL, so it could
-- not apply, and these five tables were created in production by hand. It also
-- granted ALL on every table to `authenticated` and defined
-- track_quest_progress without auth.uid() or search_path. This version records
-- what production actually holds after hardening, so `supabase db push` on a
-- fresh database reproduces it:
--   * reads only -- members never write these tables directly; progression is
--     written by track_quest_progress (SECURITY DEFINER), whose single
--     canonical definition is 20261003220624_harden_track_quest_progress.sql;
--   * quest_completions carries UNIQUE (user_id, quest_id), the conflict target
--     that function uses (live: quest_completions_user_id_quest_id_key).

CREATE TABLE IF NOT EXISTS public.quest_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quest_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target INTEGER DEFAULT 1,
  completed_at TIMESTAMP NULL,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= target),
  UNIQUE (user_id, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON public.quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_domain ON public.quest_completions(domain);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest ON public.quest_completions(quest_id);

CREATE TABLE IF NOT EXISTS public.domain_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, domain),
  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 9)
);
CREATE INDEX IF NOT EXISTS idx_domain_mastery_user ON public.domain_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_mastery_domain ON public.domain_mastery(domain);

CREATE TABLE IF NOT EXISTS public.seasonal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_name TEXT NOT NULL,
  season_number INTEGER NOT NULL,
  domain TEXT NOT NULL,
  quest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  target_count INTEGER DEFAULT 1,
  points INTEGER DEFAULT 100,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (season_number, quest_id)
);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_season ON public.seasonal_events(season_number);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_dates ON public.seasonal_events(start_date, end_date);

CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  level INTEGER DEFAULT 1,
  quests_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, domain)
);
CREATE INDEX IF NOT EXISTS idx_leaderboard_domain_rank ON public.leaderboard_entries(domain, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_domain ON public.leaderboard_entries(user_id, domain);

CREATE TABLE IF NOT EXISTS public.covenant_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  premium_unlocked BOOLEAN DEFAULT false,
  tasks_available JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_covenant_user_month ON public.covenant_progress(user_id, month, year);

ALTER TABLE public.quest_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seasonal_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.covenant_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quest_completions_member_access ON public.quest_completions;
CREATE POLICY quest_completions_member_access ON public.quest_completions
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_owner());

DROP POLICY IF EXISTS domain_mastery_member_access ON public.domain_mastery;
CREATE POLICY domain_mastery_member_access ON public.domain_mastery
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_owner());

DROP POLICY IF EXISTS seasonal_events_public_read ON public.seasonal_events;
CREATE POLICY seasonal_events_public_read ON public.seasonal_events
  FOR SELECT USING ((now() >= start_date AND now() <= end_date) OR public.is_platform_owner());

DROP POLICY IF EXISTS seasonal_events_owner_all ON public.seasonal_events;
CREATE POLICY seasonal_events_owner_all ON public.seasonal_events
  FOR ALL USING (public.is_platform_owner()) WITH CHECK (public.is_platform_owner());

DROP POLICY IF EXISTS leaderboard_public_read ON public.leaderboard_entries;
CREATE POLICY leaderboard_public_read ON public.leaderboard_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS covenant_member_access ON public.covenant_progress;
CREATE POLICY covenant_member_access ON public.covenant_progress
  FOR SELECT USING (auth.uid() = user_id OR public.is_platform_owner());

-- Reads only. Writes go through track_quest_progress (20261003220624).
GRANT SELECT ON public.quest_completions TO authenticated;
GRANT SELECT ON public.domain_mastery TO authenticated;
GRANT SELECT ON public.seasonal_events TO authenticated;
GRANT SELECT ON public.leaderboard_entries TO authenticated;
GRANT SELECT ON public.covenant_progress TO authenticated;
