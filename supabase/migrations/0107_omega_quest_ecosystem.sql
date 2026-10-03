-- Ω QUEST ECOSYSTEM v1 — Real progression tied to member behavior
-- Idempotent migration: CREATE TABLE IF NOT EXISTS, ON CONFLICT DO NOTHING

-- Quest completions: tracks real member progress
CREATE TABLE IF NOT EXISTS quest_completions (
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
  CONSTRAINT valid_progress CHECK (progress >= 0 AND progress <= target)
);

CREATE INDEX IF NOT EXISTS idx_quest_completions_user ON quest_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_quest_completions_domain ON quest_completions(domain);
CREATE INDEX IF NOT EXISTS idx_quest_completions_quest ON quest_completions(quest_id);

-- Enable RLS on quest_completions
ALTER TABLE quest_completions ENABLE ROW LEVEL SECURITY;

-- RLS policy: members see own, owners see all
CREATE POLICY IF NOT EXISTS quest_completions_member_access ON quest_completions
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS quest_completions_member_insert ON quest_completions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS quest_completions_member_update ON quest_completions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR is_platform_owner()
  ) WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

-- Domain mastery: tracks member's level (1-9) in each of 12 domains
CREATE TABLE IF NOT EXISTS domain_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  quests_completed INTEGER DEFAULT 0,
  last_active TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, domain),
  CONSTRAINT valid_level CHECK (level >= 1 AND level <= 9)
);

CREATE INDEX IF NOT EXISTS idx_domain_mastery_user ON domain_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_domain_mastery_domain ON domain_mastery(domain);

-- Enable RLS
ALTER TABLE domain_mastery ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS domain_mastery_member_access ON domain_mastery
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS domain_mastery_member_update ON domain_mastery
  FOR UPDATE USING (
    auth.uid() = user_id
    OR is_platform_owner()
  ) WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

-- Seasonal events: time-gated quests (4 seasons/year)
CREATE TABLE IF NOT EXISTS seasonal_events (
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
  UNIQUE(season_number, quest_id)
);

CREATE INDEX IF NOT EXISTS idx_seasonal_events_season ON seasonal_events(season_number);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_dates ON seasonal_events(start_date, end_date);

-- Enable RLS (public read for active events, owner edit)
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS seasonal_events_public_read ON seasonal_events
  FOR SELECT USING (
    now() >= start_date AND now() <= end_date
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS seasonal_events_owner_all ON seasonal_events
  FOR ALL USING (is_platform_owner())
  WITH CHECK (is_platform_owner());

-- Leaderboard entries: ranked domain progression
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  total_points INTEGER DEFAULT 0,
  rank INTEGER,
  level INTEGER DEFAULT 1,
  quests_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_domain_rank ON leaderboard_entries(domain, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user_domain ON leaderboard_entries(user_id, domain);

-- Enable RLS
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS leaderboard_public_read ON leaderboard_entries
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS leaderboard_member_update ON leaderboard_entries
  FOR UPDATE USING (
    auth.uid() = user_id
    OR is_platform_owner()
  ) WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

-- Covenant progress: monthly battle pass tracking
CREATE TABLE IF NOT EXISTS covenant_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  premium_unlocked BOOLEAN DEFAULT false,
  tasks_available JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_covenant_user_month ON covenant_progress(user_id, month, year);

-- Enable RLS
ALTER TABLE covenant_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS covenant_member_access ON covenant_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS covenant_member_update ON covenant_progress
  FOR UPDATE USING (
    auth.uid() = user_id
    OR is_platform_owner()
  ) WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

-- Grant table access
GRANT SELECT, INSERT, UPDATE ON quest_completions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON domain_mastery TO authenticated;
GRANT SELECT ON seasonal_events TO authenticated;
GRANT SELECT, UPDATE ON leaderboard_entries TO authenticated;
GRANT SELECT, UPDATE ON covenant_progress TO authenticated;

-- Owner-level access
GRANT ALL PRIVILEGES ON quest_completions TO authenticated;
GRANT ALL PRIVILEGES ON domain_mastery TO authenticated;
GRANT ALL PRIVILEGES ON seasonal_events TO authenticated;
GRANT ALL PRIVILEGES ON leaderboard_entries TO authenticated;
GRANT ALL PRIVILEGES ON covenant_progress TO authenticated;

-- Track quest progress: atomic server-side update of quest_completions + domain_mastery
CREATE OR REPLACE FUNCTION track_quest_progress(
  p_user_id UUID,
  p_domain TEXT,
  p_quest_id TEXT,
  p_points INTEGER DEFAULT 10
)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_quests_completed INTEGER;
BEGIN
  -- Upsert quest completion
  INSERT INTO quest_completions (user_id, quest_id, domain, progress, target, completed_at, reward_points)
  VALUES (p_user_id, p_quest_id, p_domain, 1, 1, NOW(), p_points)
  ON CONFLICT (quest_id, user_id) DO UPDATE
  SET progress = LEAST(progress + 1, target),
      updated_at = NOW(),
      completed_at = CASE WHEN excluded.target = LEAST(progress + 1, target) THEN NOW() ELSE completed_at END;

  -- Get current domain mastery
  SELECT total_points, level, quests_completed INTO v_current_points, v_old_level, v_quests_completed
  FROM domain_mastery
  WHERE user_id = p_user_id AND domain = p_domain;

  IF NOT FOUND THEN
    v_current_points := 0;
    v_old_level := 1;
    v_quests_completed := 0;
  END IF;

  -- Calculate new points and level
  v_new_points := v_current_points + p_points;
  v_new_level := LEAST(FLOOR(v_new_points::NUMERIC / 200), 9)::INTEGER;
  v_quests_completed := v_quests_completed + 1;

  -- Upsert domain mastery
  INSERT INTO domain_mastery (user_id, domain, level, total_points, quests_completed, last_active)
  VALUES (p_user_id, p_domain, v_new_level, v_new_points, v_quests_completed, NOW())
  ON CONFLICT (user_id, domain) DO UPDATE
  SET level = v_new_level,
      total_points = v_new_points,
      quests_completed = v_quests_completed,
      last_active = NOW();

  -- Return new level and whether it increased
  RETURN QUERY SELECT v_new_level, (v_new_level > v_old_level);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
