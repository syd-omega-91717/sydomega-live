-- ============================================================================
-- Ω SYD OMEGA 91717 — MASTER DATA MANAGEMENT
-- Domain registry, entity catalog, data lineage, quality scores
-- Inspired by: Palantir Foundry ontology, DataHub, Apache Atlas
-- ============================================================================

-- ── DOMAIN REGISTRY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_domains(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id    text        NOT NULL UNIQUE,
  name         text        NOT NULL,
  description  text,
  owner_role   text        DEFAULT 'sovereign_founder',
  data_steward text,
  classification text     DEFAULT 'internal',
  retention_days int      DEFAULT 1825,  -- 5 years default
  encryption   boolean    DEFAULT true,
  pii_contains boolean    DEFAULT false,
  gdpr_relevant boolean   DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT class_ck CHECK(classification IN('public','internal','confidential','sovereign'))
);

INSERT INTO public.data_domains(domain_id,name,description,pii_contains,gdpr_relevant,classification) VALUES
  ('member_progression','Member Progression','Axis values, authority scores, gate positions',false,false,'internal'),
  ('member_identity','Member Identity','Names, emails, KYC status, zodiac assignments',true,true,'confidential'),
  ('platform_telemetry','Platform Telemetry','Page views, clicks, session data',false,true,'internal'),
  ('ai_intelligence','AI Intelligence','Agent conversations, memories, tool calls',true,true,'confidential'),
  ('financial_data','Financial Data','Subscriptions, payments, token economy',true,true,'sovereign'),
  ('content_catalog','Content Catalog','Movies, series, games metadata',false,false,'internal'),
  ('governance_data','Governance Data','Policies, risks, ethics declarations',false,false,'confidential')
ON CONFLICT(domain_id) DO NOTHING;

-- ── ENTITY CATALOG ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_entities(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id    text        NOT NULL UNIQUE,
  domain_id    text        REFERENCES public.data_domains(domain_id),
  table_name   text        NOT NULL,
  display_name text        NOT NULL,
  description  text,
  row_count_est bigint,
  quality_score numeric(5,2) DEFAULT 100.0,
  completeness  numeric(5,2) DEFAULT 100.0,
  freshness_hrs int,
  last_audited  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.data_entities(entity_id,domain_id,table_name,display_name,description) VALUES
  ('ent_profiles','member_identity','profiles','Member Profiles','Core member identity and progression state'),
  ('ent_tasks','member_progression','task_completions','Task Completions','Axis increment events from task completion'),
  ('ent_activity','platform_telemetry','activity_feed','Activity Feed','Public sovereign activity stream'),
  ('ent_telemetry','platform_telemetry','telemetry_events','Telemetry Events','User journey and interaction analytics'),
  ('ent_ai_memory','ai_intelligence','ai_memory','AI Memory','Persistent AI agent memories per member'),
  ('ent_threats','platform_telemetry','threat_events','Threat Events','Zero Trust security signal log'),
  ('ent_governance','governance_data','governance_policies','Governance Policies','Canonical platform governance policies')
ON CONFLICT(entity_id) DO NOTHING;

-- ── DATA LINEAGE ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.data_lineage(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_entity text       NOT NULL REFERENCES public.data_entities(entity_id),
  target_entity text       NOT NULL REFERENCES public.data_entities(entity_id),
  relationship text        NOT NULL,  -- 'derives_from','feeds_into','aggregates','validates'
  transformation text,
  is_active    boolean     DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.data_lineage(source_entity,target_entity,relationship,transformation) VALUES
  ('ent_tasks','ent_profiles','feeds_into','Axis increment updates profile axis values'),
  ('ent_profiles','ent_activity','derives_from','Gate unlock events logged to activity feed'),
  ('ent_telemetry','ent_profiles','validates','Session start validates profile completeness'),
  ('ent_threats','ent_governance','feeds_into','Threat events inform risk register updates')
ON CONFLICT DO NOTHING;

-- ── DATA QUALITY SCORES ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.compute_data_quality()
RETURNS TABLE(entity_id text, table_name text, row_count bigint, quality_score numeric)
LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN; END IF;
  RETURN QUERY
  SELECT
    de.entity_id,
    de.table_name,
    (CASE de.table_name
      WHEN 'profiles'         THEN (SELECT COUNT(*) FROM public.profiles)
      WHEN 'task_completions' THEN (SELECT COUNT(*) FROM public.task_completions)
      WHEN 'activity_feed'    THEN (SELECT COUNT(*) FROM public.activity_feed)
      WHEN 'telemetry_events' THEN (SELECT COUNT(*) FROM public.telemetry_events)
      WHEN 'threat_events'    THEN (SELECT COUNT(*) FROM public.threat_events)
      ELSE 0
    END),
    de.quality_score
  FROM public.data_entities de;
END;
$$;
GRANT EXECUTE ON FUNCTION public.compute_data_quality() TO authenticated;
