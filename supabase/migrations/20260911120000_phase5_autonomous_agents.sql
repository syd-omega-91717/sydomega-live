-- Phase 5: Autonomous Agents Infrastructure
-- Weeks 25-32: AI-driven autonomous systems, decision audit trails, continuous learning

-- Core autonomous decision tracking
CREATE TABLE IF NOT EXISTS public.autonomous_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  member_id UUID NOT NULL,
  decision_type TEXT NOT NULL,
  context_snapshot JSONB,
  reasoning TEXT,
  decision_payload JSONB,
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  model_used TEXT,
  temperature FLOAT,
  execution_timestamp TIMESTAMPTZ DEFAULT NOW(),
  outcome_recorded BOOLEAN DEFAULT FALSE,
  outcome_value FLOAT,
  revenue_impact_usd FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_agent_id CHECK (agent_id IN ('concierge', 'growth', 'product', 'insights', 'archive', 'guardian'))
);

CREATE INDEX idx_autonomous_decisions_agent_member ON public.autonomous_decisions(agent_id, member_id);
CREATE INDEX idx_autonomous_decisions_timestamp ON public.autonomous_decisions(execution_timestamp);
CREATE INDEX idx_autonomous_decisions_outcome ON public.autonomous_decisions(outcome_recorded);

-- Autonomous A/B testing and experimentation
CREATE TABLE IF NOT EXISTS public.agent_experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  experiment_type TEXT NOT NULL,
  experiment_name TEXT,
  variant_a JSONB NOT NULL,
  variant_b JSONB NOT NULL,
  cohort_filter JSONB,
  population_size INT,
  sample_size_a INT DEFAULT 0,
  sample_size_b INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  winner TEXT,
  winner_confidence_level FLOAT,
  statistical_result JSONB,
  revenue_impact_usd FLOAT,
  auto_rolled_out BOOLEAN DEFAULT FALSE,
  rollout_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_agent_id CHECK (agent_id IN ('concierge', 'growth', 'product', 'insights', 'archive', 'guardian')),
  CONSTRAINT valid_winner CHECK (winner IS NULL OR winner IN ('variant_a', 'variant_b', 'tie'))
);

CREATE INDEX idx_agent_experiments_agent_status ON public.agent_experiments(agent_id, winner);
CREATE INDEX idx_agent_experiments_timeline ON public.agent_experiments(started_at, ended_at);

-- Member-agent interaction history
CREATE TABLE IF NOT EXISTS public.member_agent_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL,
  agent_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  prompt_used TEXT,
  member_input TEXT,
  agent_response TEXT,
  interaction_timestamp TIMESTAMPTZ DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  satisfaction_score INT CHECK (satisfaction_score IS NULL OR (satisfaction_score >= 1 AND satisfaction_score <= 5)),
  escalated BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  follow_up_action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT valid_agent_id CHECK (agent_id IN ('concierge', 'growth', 'product', 'insights', 'archive', 'guardian'))
);

CREATE INDEX idx_member_agent_interactions_member ON public.member_agent_interactions(member_id, agent_id);
CREATE INDEX idx_member_agent_interactions_resolved ON public.member_agent_interactions(resolved);
CREATE INDEX idx_member_agent_interactions_escalated ON public.member_agent_interactions(escalated);
CREATE INDEX idx_member_agent_interactions_timestamp ON public.member_agent_interactions(interaction_timestamp);

-- Autonomous insights and recommendations
CREATE TABLE IF NOT EXISTS public.autonomous_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  cohort_affected TEXT,
  finding TEXT NOT NULL,
  recommendation TEXT,
  estimated_impact_usd FLOAT,
  evidence JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  actioned BOOLEAN DEFAULT FALSE,
  action_details JSONB,
  action_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_autonomous_insights_type_severity ON public.autonomous_insights(insight_type, severity);
CREATE INDEX idx_autonomous_insights_actioned ON public.autonomous_insights(actioned);
CREATE INDEX idx_autonomous_insights_generated_at ON public.autonomous_insights(generated_at);

-- Agent performance metrics and learning
CREATE TABLE IF NOT EXISTS public.agent_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id TEXT NOT NULL,
  metric_date DATE DEFAULT CURRENT_DATE,
  decisions_count INT DEFAULT 0,
  successful_decisions INT DEFAULT 0,
  escalated_decisions INT DEFAULT 0,
  average_confidence FLOAT,
  average_revenue_impact FLOAT,
  member_satisfaction_avg FLOAT,
  cost_usd FLOAT,
  performance_score FLOAT CHECK (performance_score >= 0 AND performance_score <= 1),
  improvement_vs_baseline FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_agent_id CHECK (agent_id IN ('concierge', 'growth', 'product', 'insights', 'archive', 'guardian')),
  UNIQUE(agent_id, metric_date)
);

CREATE INDEX idx_agent_performance_metrics_agent_date ON public.agent_performance_metrics(agent_id, metric_date);
CREATE INDEX idx_agent_performance_metrics_score ON public.agent_performance_metrics(performance_score);

-- Feature flags for Product Agent
CREATE TABLE IF NOT EXISTS public.member_feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID NOT NULL,
  feature_id TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  variant TEXT,
  rollout_percentage INT,
  set_by_agent BOOLEAN DEFAULT FALSE,
  set_reason TEXT,
  set_timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(member_id, feature_id)
);

CREATE INDEX idx_member_feature_flags_member ON public.member_feature_flags(member_id);
CREATE INDEX idx_member_feature_flags_feature ON public.member_feature_flags(feature_id);
CREATE INDEX idx_member_feature_flags_enabled ON public.member_feature_flags(enabled);

-- RLS Policies for all new tables

-- autonomous_decisions: members can read their own, only agents write
ALTER TABLE public.autonomous_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autonomous_decisions_member_read" ON public.autonomous_decisions
  FOR SELECT USING (member_id = auth.uid() OR public.is_platform_owner());

CREATE POLICY "autonomous_decisions_agent_write" ON public.autonomous_decisions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "autonomous_decisions_owner_admin" ON public.autonomous_decisions
  FOR ALL USING (public.is_platform_owner());

-- agent_experiments: readable by owner and members affected, write by agents
ALTER TABLE public.agent_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_experiments_read" ON public.agent_experiments
  FOR SELECT USING (public.is_platform_owner());

CREATE POLICY "agent_experiments_write" ON public.agent_experiments
  FOR INSERT WITH CHECK (true);

-- member_agent_interactions: members read their own, agents write, owner reads all
ALTER TABLE public.member_agent_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_agent_interactions_member_read" ON public.member_agent_interactions
  FOR SELECT USING (member_id = auth.uid() OR public.is_platform_owner());

CREATE POLICY "member_agent_interactions_agent_write" ON public.member_agent_interactions
  FOR INSERT WITH CHECK (true);

-- autonomous_insights: owner read/write, insights agent write
ALTER TABLE public.autonomous_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "autonomous_insights_owner" ON public.autonomous_insights
  FOR ALL USING (public.is_platform_owner());

CREATE POLICY "autonomous_insights_agent_write" ON public.autonomous_insights
  FOR INSERT WITH CHECK (true);

-- agent_performance_metrics: owner read, metrics service write
ALTER TABLE public.agent_performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agent_performance_metrics_owner" ON public.agent_performance_metrics
  FOR ALL USING (public.is_platform_owner());

CREATE POLICY "agent_performance_metrics_write" ON public.agent_performance_metrics
  FOR INSERT WITH CHECK (true);

-- member_feature_flags: members read their own, product agent writes
ALTER TABLE public.member_feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_feature_flags_read" ON public.member_feature_flags
  FOR SELECT USING (member_id = auth.uid() OR public.is_platform_owner());

CREATE POLICY "member_feature_flags_write" ON public.member_feature_flags
  FOR INSERT WITH CHECK (true);

CREATE POLICY "member_feature_flags_update" ON public.member_feature_flags
  FOR UPDATE USING (public.is_platform_owner());

-- Grant permissions
GRANT SELECT ON public.autonomous_decisions TO authenticated;
GRANT INSERT ON public.autonomous_decisions TO authenticated;
GRANT SELECT ON public.member_agent_interactions TO authenticated;
GRANT INSERT ON public.member_agent_interactions TO authenticated;
GRANT SELECT ON public.autonomous_insights TO authenticated;
GRANT SELECT ON public.agent_performance_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.member_feature_flags TO authenticated;
