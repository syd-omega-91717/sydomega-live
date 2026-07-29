-- ============================================================================
-- Ω SYD OMEGA 91717 — CAPABILITY REGISTRY
-- Every platform capability registered with KPIs, SLOs, owners, dependencies
-- "The platform is built from capabilities. Pages are views of capabilities."
-- ============================================================================

-- ── CAPABILITY REGISTRY TABLE ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.capability_registry(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id   text        NOT NULL UNIQUE,
  capability_name text        NOT NULL,
  domain          text        NOT NULL,
  owner_agent     text        NOT NULL,
  description     text,
  lifecycle_status text       NOT NULL DEFAULT 'live',
  health_status   text        NOT NULL DEFAULT 'healthy',
  version         text        NOT NULL DEFAULT '1.0',
  slo_p95_ms      int         DEFAULT 1000,
  slo_availability numeric(5,3) DEFAULT 99.9,
  kpi_names       text[]      DEFAULT '{}',
  page_views      text[]      DEFAULT '{}',
  dependencies    text[]      DEFAULT '{}',
  events_published text[]     DEFAULT '{}',
  events_subscribed text[]    DEFAULT '{}',
  threat_model    text,
  retirement_policy text,
  last_deployed   timestamptz DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT lifecycle_ck CHECK(lifecycle_status IN('proposal','design','beta','live','deprecated','archived')),
  CONSTRAINT health_ck CHECK(health_status IN('healthy','degraded','down','unknown'))
);

-- Seed all 18 sovereign capabilities
INSERT INTO public.capability_registry(capability_id,capability_name,domain,owner_agent,description,slo_p95_ms,kpi_names,page_views,dependencies,events_published) VALUES
('COMMAND_INTELLIGENCE','Command & Intelligence Centre','Operations','Sovereign',
 'Central platform command: authority monitoring, member status, real-time KPIs, AI-driven operational intelligence',
 500,ARRAY['active_members','tasks_today','platform_health','authority_apex'],
 ARRAY['dashboard.html','analytics.html'],
 ARRAY['MEMBER_IDENTITY','MASTERY_ENGINE','SRE_OBSERVATORY'],
 ARRAY['platform.heartbeat','member.status_changed']),

('TREASURY_RESERVE','Treasury & Reserve Management','Finance','Merchant',
 'Sovereign reserve, wallet, NFT asset tracking, ΩSYD token ledger, transaction history, earning mechanics',
 800,ARRAY['balance','transactions','nft_count','yield'],
 ARRAY['vault.html','wallet.html','blockchain.html'],
 ARRAY['ENTERPRISE_CONTROL','INVESTMENT_ENGINE'],
 ARRAY['treasury.balance_changed','nft.minted']),

('MASTERY_ENGINE','Sovereign Mastery Engine','Education','Tutor',
 '144 games, 108 exams, Axis B mastery progression, 9-stage ascension, trophy/medal/certificate awards',
 600,ARRAY['games_completed','axis_b_delta','pass_rate','stage'],
 ARRAY['gaming.html','academy.html','trophies.html','honors.html'],
 ARRAY['ACHIEVEMENT_SYSTEM','PROGRESSION_ENGINE'],
 ARRAY['task.completed','gate.unlocked','trophy.awarded']),

('AI_CONCIERGE','AI Concierge & Intelligence','Intelligence','Oracle',
 '12 sovereign agents, ReAct reasoning, tool use, GraphRAG, persistent memory, voice interface, multi-agent orchestration',
 2000,ARRAY['queries_per_day','fallback_rate','quality_score','agent_utilisation'],
 ARRAY['chatbot.html','sovereign-ai.html','intelligence.html'],
 ARRAY['AI_MEMORY','KNOWLEDGE_GRAPH'],
 ARRAY['ai.query_completed','ai.tool_called','ai.memory_stored']),

('ENTERPRISE_CONTROL','Enterprise Control Panel','Business','Sovereign',
 'Fortune 500 licensing, government accounts, API key management, SLA tracking, revenue intelligence, MRR reporting',
 800,ARRAY['active_accounts','mrr','seats_utilised','gov_accounts'],
 ARRAY['enterprise.html'],
 ARRAY['GOVERNANCE_BOARD','TREASURY_RESERVE'],
 ARRAY['enterprise.account_created','sla.breach_detected']),

('GOVERNANCE_BOARD','Governance & Ethics Board','Compliance','Auditor',
 'Policy registry (10 canonical policies), ISO 27001 risk register, ethics declarations, compliance controls',
 600,ARRAY['open_risks','policy_compliance','ethics_score','critical_risks'],
 ARRAY['governance.html','compliance.html'],
 ARRAY['PRIVACY_CENTRE','SRE_OBSERVATORY'],
 ARRAY['risk.created','policy.updated','ethics.violation_detected']),

('PRIVACY_CENTRE','Privacy & Compliance Centre','Compliance','Auditor',
 'GDPR Art.5/6/7/15/17/20/25, CCPA, consent management, right to erasure, data portability, DPIA',
 500,ARRAY['consent_rate','pending_erasures','gdpr_score'],
 ARRAY['privacy.html'],
 ARRAY['GOVERNANCE_BOARD'],
 ARRAY['consent.granted','consent.revoked','erasure.requested']),

('SRE_OBSERVATORY','SRE Observatory & Platform Health','Operations','Auditor',
 'Google SRE error budgets, SLO monitoring, Core Web Vitals, incident postmortem log, chaos readiness',
 400,ARRAY['error_budget','slo_compliance','incidents_open','cwv_lcp'],
 ARRAY['observatory.html'],
 ARRAY['COMMAND_INTELLIGENCE'],
 ARRAY['slo.breached','incident.opened','incident.resolved']),

('AI_MEMORY','AI Memory & Context Engine','Intelligence','Historian',
 'Persistent cross-session AI memory, episodic/semantic/procedural storage, GDPR-compliant erasure, context building',
 300,ARRAY['memories_stored','recall_latency','memory_hits'],
 ARRAY['chatbot.html'],
 ARRAY['AI_CONCIERGE'],
 ARRAY['memory.stored','memory.recalled','memory.erased']),

('KNOWLEDGE_GRAPH','Sovereign Knowledge Graph','Intelligence','Historian',
 'Wikidata-inspired entity-relationship graph, 25+ nodes, track/element/gate relationships, traversable',
 500,ARRAY['nodes_explored','edges_traversed','queries'],
 ARRAY['knowledge.html'],
 ARRAY['AI_CONCIERGE','AI_MEMORY'],
 ARRAY['knowledge.node_explored']),

('ACHIEVEMENT_SYSTEM','Achievement & Progression System','Progression','Tutor',
 '12 authority gates (2.3197→27.8367), trophies, medals, certificates, SDT-based gamification, gate celebrations',
 500,ARRAY['gates_reached','trophies_earned','medals_count','certificates'],
 ARRAY['achievements.html','trophies.html','gates.html','grades.html','levels.html'],
 ARRAY['MASTERY_ENGINE','PROGRESSION_ENGINE'],
 ARRAY['gate.unlocked','trophy.awarded','certificate.issued']),

('PROGRESSION_ENGINE','Lattice Progression Engine','Progression','Analyst',
 '104,976-node canonical lattice, 9×9×9 inner cube, 12 tracks × 12 phases, matrix coordinates, axis tracking',
 400,ARRAY['axis_a','axis_b','axis_c','auth','lattice_position'],
 ARRAY['points.html','evolution.html','matrix.html','ascension.html','grid.html'],
 ARRAY['ACHIEVEMENT_SYSTEM'],
 ARRAY['axis.incremented','auth.updated','lattice.node_reached']),

('MEMBER_IDENTITY','Member Identity & KYC','Identity','Sentinel',
 'Sovereign profile, zodiac assignment, element/agent/token mapping, KYC verification, digital passport, credentials',
 600,ARRAY['profile_completeness','kyc_status','sign_assigned'],
 ARRAY['profile.html','passport.html','kyc.html','identity.html','credentials.html'],
 ARRAY[],
 ARRAY['member.onboarded','kyc.verified','identity.updated']),

('INVESTMENT_ENGINE','Investment & Portfolio Engine','Finance','Analyst',
 'Portfolio tracking, crypto holdings, income streams, allocation scoring, revenue intelligence, FinOps',
 800,ARRAY['portfolio_value','allocation_score','yield','mrr'],
 ARRAY['investment.html','portfolio.html','revenue.html','income.html'],
 ARRAY['TREASURY_RESERVE'],
 ARRAY['portfolio.updated','allocation.rebalanced']),

('MEDIA_UNIVERSE','Sovereign Media Universe','Entertainment','Scout',
 '12 movies × 12 series = 144 total, games synchronised, NFT-linked, authority-gated access, streaming',
 1000,ARRAY['content_views','series_completed','authority_required'],
 ARRAY['cinema.html','media.html','series.html','trailers.html'],
 ARRAY['MASTERY_ENGINE'],
 ARRAY['content.viewed','series.completed']),

('ACTIVITY_STREAM','Activity & Social Stream','Social','Beacon',
 'Public activity feed, member posts, task completion broadcasts, gate unlock announcements, engagement metrics',
 600,ARRAY['posts_today','engagement_rate','active_members'],
 ARRAY['feed.html','social.html'],
 ARRAY['MASTERY_ENGINE','PROGRESSION_ENGINE'],
 ARRAY['activity.posted','post.liked']),

('EVOLUTION_STRATEGY','Platform Evolution Strategy','Strategy','Sovereign',
 'Roadmap, priority matrix, health score (87/100), horizon planning, DORA metrics, FinOps recommendations',
 400,ARRAY['health_score','milestones_on_track','priority_critical'],
 ARRAY['roadmap.html','ecosystem.html','lab.html'],
 ARRAY['SRE_OBSERVATORY','GOVERNANCE_BOARD'],
 ARRAY['milestone.reached','strategy.updated']),

('HERITAGE_ARCHIVE','Heritage & Legacy Archive','Legacy','Historian',
 'Bloodline mapping, genealogy nodes, historical records, cultural memory, family inheritance, lineage depth',
 600,ARRAY['records_count','lineage_depth','family_nodes'],
 ARRAY['heritage.html','family.html','bloodline.html'],
 ARRAY['MEMBER_IDENTITY'],
 ARRAY['heritage.record_added','lineage.extended'])
ON CONFLICT(capability_id) DO NOTHING;

-- ── CAPABILITY KPI LOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.capability_kpi_log(
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_id   text        NOT NULL REFERENCES public.capability_registry(capability_id),
  kpi_name        text        NOT NULL,
  kpi_value       numeric(14,4),
  measured_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cap_kpi ON public.capability_kpi_log(capability_id, kpi_name, measured_at DESC);
ALTER TABLE public.capability_kpi_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner reads kpi log" ON public.capability_kpi_log;
CREATE POLICY "owner reads kpi log" ON public.capability_kpi_log FOR SELECT USING(public.is_platform_owner());
DROP POLICY IF EXISTS "member inserts kpi" ON public.capability_kpi_log;
CREATE POLICY "member inserts kpi" ON public.capability_kpi_log FOR INSERT TO authenticated WITH CHECK(true);

-- ── CAPABILITY HEALTH RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_capability_health()
RETURNS TABLE(capability_id text, capability_name text, domain text, health_status text, lifecycle_status text, slo_p95_ms int)
LANGUAGE sql SECURITY DEFINER STABLE SET search_path=public AS $$
  SELECT capability_id, capability_name, domain, health_status, lifecycle_status, slo_p95_ms
  FROM public.capability_registry
  ORDER BY domain, capability_name;
$$;
GRANT EXECUTE ON FUNCTION public.get_capability_health() TO authenticated;

-- ── FEATURE FLAGS TABLE (for omega-experiment.js) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_flags(
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_id     text  NOT NULL UNIQUE,
  description text,
  is_enabled  boolean NOT NULL DEFAULT false,
  rollout_pct int     NOT NULL DEFAULT 0 CHECK(rollout_pct BETWEEN 0 AND 100),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read flags" ON public.feature_flags;
CREATE POLICY "members read flags" ON public.feature_flags FOR SELECT TO authenticated USING(true);
DROP POLICY IF EXISTS "owner manages flags" ON public.feature_flags;
CREATE POLICY "owner manages flags" ON public.feature_flags FOR ALL USING(public.is_platform_owner());

INSERT INTO public.feature_flags(flag_id,description,is_enabled,rollout_pct) VALUES
  ('voice_interface','omega-voice.js voice commands and TTS',true,100),
  ('ai_memory','omega-memory.js cross-session AI memory',true,100),
  ('workflow_engine','omega-workflow.js automated workflows',true,100),
  ('chart_visualisations','Chart.js axis radar and auth charts',true,100),
  ('token_economy','ΩSYD token transactions — dormant',false,0),
  ('payments','Stripe payment processing — dormant',false,0),
  ('enterprise_api','Enterprise API key access — limited beta',false,10)
ON CONFLICT(flag_id) DO NOTHING;
