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

CREATE INDEX IF NOT EXISTS idx_seasonal_events_domain ON seasonal_events(domain);
CREATE INDEX IF NOT EXISTS idx_seasonal_events_active ON seasonal_events(start_date, end_date);

-- Enable RLS (public read, owner write)
ALTER TABLE seasonal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS seasonal_events_public_read ON seasonal_events
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS seasonal_events_owner_write ON seasonal_events
  FOR INSERT WITH CHECK (is_platform_owner());

CREATE POLICY IF NOT EXISTS seasonal_events_owner_update ON seasonal_events
  FOR UPDATE USING (is_platform_owner()) WITH CHECK (is_platform_owner());

-- Member covenant: monthly battle pass (25 tasks)
CREATE TABLE IF NOT EXISTS covenant_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  tasks_completed INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  premium_unlocked BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, month, year),
  CONSTRAINT valid_month CHECK (month >= 1 AND month <= 12)
);

CREATE INDEX IF NOT EXISTS idx_covenant_progress_user ON covenant_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_covenant_progress_active ON covenant_progress(year, month);

-- Enable RLS
ALTER TABLE covenant_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS covenant_progress_member_access ON covenant_progress
  FOR SELECT USING (
    auth.uid() = user_id
    OR is_platform_owner()
  );

CREATE POLICY IF NOT EXISTS covenant_progress_member_update ON covenant_progress
  FOR UPDATE USING (
    auth.uid() = user_id
    OR is_platform_owner()
  ) WITH CHECK (
    auth.uid() = user_id
    OR is_platform_owner()
  );

-- Leaderboard entries: domain rankings (public, opt-in)
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  rank INTEGER,
  points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_domain ON leaderboard_entries(domain, rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_user ON leaderboard_entries(user_id);

-- Enable RLS (public read, member/owner write)
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

-- Quest configuration: master list of all quests
CREATE TABLE IF NOT EXISTS quest_config (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  tier INTEGER NOT NULL,
  points INTEGER NOT NULL,
  target_count INTEGER DEFAULT 1,
  unlock_requirements TEXT,
  next_quest_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS (public read, owner write)
ALTER TABLE quest_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS quest_config_public_read ON quest_config
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS quest_config_owner_write ON quest_config
  FOR INSERT WITH CHECK (is_platform_owner());

-- Insert master quest config
INSERT INTO quest_config (id, domain, title, description, tier, points, target_count) VALUES
-- Prophecy Domain (Oracle)
('cosmics_equilibrium', 'prophecy', 'Cosmic''s Equilibrium', 'Balance the forces of the cosmos and master the art of cosmic harmony.', 4, 190, 3),
('oracles_sight', 'prophecy', 'Oracle''s Sight', 'Peer through the veils of time and possibility. Master foresight algorithms.', 2, 150, 5),
-- Finance Domain (Analyst)
('analysts_ledger', 'finance', 'Analyst''s Ledger', 'Master financial analysis and optimize your investment portfolio.', 4, 200, 5),
('merchants_covenant', 'finance', 'Merchant''s Covenant', 'Track wealth flows and master the art of abundance.', 1, 100, 10),
-- Education Domain (Tutor)
('tutors_curriculum', 'education', 'Tutor''s Curriculum', 'Develop mastery through structured learning paths.', 2, 130, 1),
('scholars_ascension', 'education', 'Scholar''s Ascension', 'Complete advanced learning modules and unlock wisdom.', 3, 160, 3),
-- Discovery Domain (Scout)
('scouts_compass', 'discovery', 'Scout''s Compass', 'Chart unmapped territories and navigate uncertainty with precision.', 3, 160, 5),
('explorers_manifest', 'discovery', 'Explorer''s Manifest', 'Explore all features of the platform and unlock hidden paths.', 2, 120, 7),
-- Validation Domain (Auditor)
('auditors_verdict', 'validation', 'Auditor''s Verdict', 'Verify 3 claims and ensure platform integrity.', 2, 110, 3),
('validators_seal', 'validation', 'Validator''s Seal', 'Complete comprehensive data audits.', 3, 145, 5),
-- Execution Domain (Proxy)
('proxys_pathway', 'execution', 'Proxy''s Pathway', 'Execute 5 workflows and master the art of action.', 2, 115, 5),
('executors_engine', 'execution', 'Executor''s Engine', 'Automate complex multi-step processes.', 3, 155, 10),
-- Governance Domain (Sovereign)
('sovereigns_decree', 'governance', 'Sovereign''s Decree', 'Set personal rules and govern your own domain.', 2, 125, 3),
('rulers_covenant', 'governance', 'Ruler''s Covenant', 'Create lasting governance frameworks.', 4, 185, 5),
-- Onboarding Domain (Beacon)
('beacons_light', 'onboarding', 'Beacon''s Light', 'Guide 1 new member and help them begin their journey.', 1, 80, 1),
('guides_legacy', 'onboarding', 'Guide''s Legacy', 'Mentor 3 new members through onboarding.', 3, 150, 3),
-- Archive Domain (Historian)
('historians_chronicle', 'archive', 'Historian''s Chronicle', 'Document 3 moments and preserve platform history.', 1, 90, 3),
('archivists_vault', 'archive', 'Archivist''s Vault', 'Create a comprehensive personal history.', 4, 180, 10),
-- Family Domain (Warden)
('wardens_circle', 'family', 'Warden''s Circle', 'Share with 2 family members and strengthen bonds.', 1, 95, 2),
('guardians_covenant', 'family', 'Guardian''s Covenant', 'Create lasting family traditions and connections.', 3, 165, 5),
-- Security Domain (Sentinel)
('sentinels_vigil', 'security', 'Sentinel''s Vigil', 'Audit 3 accounts and ensure platform security.', 2, 120, 3),
('defenders_bastion', 'security', 'Defender''s Bastion', 'Master advanced security protocols.', 4, 175, 5)
ON CONFLICT DO NOTHING;

-- Grant access to authenticated users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON quest_completions TO authenticated;
GRANT INSERT, UPDATE ON domain_mastery TO authenticated;
GRANT INSERT, UPDATE ON covenant_progress TO authenticated;
GRANT INSERT, UPDATE ON leaderboard_entries TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quest_config_domain ON quest_config(domain);
CREATE INDEX IF NOT EXISTS idx_quest_config_tier ON quest_config(tier);
