-- Graphify AI: Canonical Entity → Relationship → Evidence → Event Graph Model
-- Foundational schema for knowledge graph intelligence, entity extraction, and graph reasoning

-- ============================================================================
-- 1. GRAPH ENTITIES (Vertices)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.graph_entities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  entity_type text NOT NULL,
  canonical_name text NOT NULL,
  display_name text,
  description text,
  metadata jsonb DEFAULT '{}',

  first_seen_at timestamptz DEFAULT now(),
  last_updated_at timestamptz DEFAULT now(),
  last_seen_at timestamptz DEFAULT now(),
  confidence_score numeric(3,2) DEFAULT 1.0,
  source_system text DEFAULT 'manual',

  x_pos numeric,
  y_pos numeric,
  z_cluster integer,

  UNIQUE(user_id, entity_type, canonical_name)
);

CREATE INDEX idx_graph_entities_user ON public.graph_entities(user_id);
CREATE INDEX idx_graph_entities_user_type ON public.graph_entities(user_id, entity_type);
CREATE INDEX idx_graph_entities_user_seen ON public.graph_entities(user_id, last_seen_at DESC);
CREATE INDEX idx_graph_entities_user_confidence ON public.graph_entities(user_id, confidence_score DESC);

ALTER TABLE public.graph_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_entities" ON public.graph_entities
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "owner_reads_all_entities" ON public.graph_entities
  FOR SELECT USING (is_platform_owner() OR user_id = auth.uid());

-- ============================================================================
-- 2. GRAPH RELATIONSHIPS (Edges)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.graph_relationships (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),
  source_entity_id uuid NOT NULL REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  target_entity_id uuid NOT NULL REFERENCES public.graph_entities(id) ON DELETE CASCADE,

  relationship_type text NOT NULL,
  strength numeric(3,2) DEFAULT 1.0,
  direction text DEFAULT 'directed',
  properties jsonb DEFAULT '{}',

  established_at timestamptz DEFAULT now(),
  last_confirmed_at timestamptz DEFAULT now(),
  confidence_score numeric(3,2) DEFAULT 1.0,
  source_system text DEFAULT 'manual'
);

CREATE INDEX idx_graph_relationships_user ON public.graph_relationships(user_id);
CREATE INDEX idx_graph_relationships_source ON public.graph_relationships(user_id, source_entity_id);
CREATE INDEX idx_graph_relationships_target ON public.graph_relationships(user_id, target_entity_id);
CREATE INDEX idx_graph_relationships_type ON public.graph_relationships(user_id, relationship_type);
CREATE INDEX idx_graph_relationships_strength ON public.graph_relationships(user_id, strength DESC);

ALTER TABLE public.graph_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_relationships" ON public.graph_relationships
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "owner_reads_all_relationships" ON public.graph_relationships
  FOR SELECT USING (is_platform_owner() OR user_id = auth.uid());

-- ============================================================================
-- 3. GRAPH EVIDENCE (Provenance & Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.graph_evidence (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),

  graph_entity_id uuid REFERENCES public.graph_entities(id) ON DELETE CASCADE,
  graph_relationship_id uuid REFERENCES public.graph_relationships(id) ON DELETE CASCADE,

  source_type text NOT NULL,
  source_table text,
  source_row_id text,
  source_url text,

  extracted_text text,
  extraction_confidence numeric(3,2) DEFAULT 1.0,
  extraction_method text DEFAULT 'manual',
  ai_model_used text,
  extraction_timestamp timestamptz DEFAULT now(),

  human_verified boolean DEFAULT false,
  verified_by uuid REFERENCES public.profiles(id),

  reasoning_notes text
);

CREATE INDEX idx_graph_evidence_user ON public.graph_evidence(user_id);
CREATE INDEX idx_graph_evidence_entity ON public.graph_evidence(user_id, graph_entity_id);
CREATE INDEX idx_graph_evidence_relationship ON public.graph_evidence(user_id, graph_relationship_id);
CREATE INDEX idx_graph_evidence_source ON public.graph_evidence(user_id, source_type);
CREATE INDEX idx_graph_evidence_verified ON public.graph_evidence(user_id, human_verified);

ALTER TABLE public.graph_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_evidence" ON public.graph_evidence
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "owner_reads_all_evidence" ON public.graph_evidence
  FOR SELECT USING (is_platform_owner() OR user_id = auth.uid());

-- ============================================================================
-- 4. GRAPH EVENTS (Temporal History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.graph_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id),

  event_type text NOT NULL,
  entity_id uuid REFERENCES public.graph_entities(id) ON DELETE SET NULL,
  relationship_id uuid REFERENCES public.graph_relationships(id) ON DELETE SET NULL,
  evidence_id uuid REFERENCES public.graph_evidence(id) ON DELETE SET NULL,

  occurred_at timestamptz NOT NULL,
  recorded_at timestamptz DEFAULT now(),

  before_state jsonb,
  after_state jsonb,
  change_summary text,

  affected_relationships uuid[] DEFAULT '{}'::uuid[],
  affected_entities uuid[] DEFAULT '{}'::uuid[],

  source_event_id text
);

CREATE INDEX idx_graph_events_user ON public.graph_events(user_id);
CREATE INDEX idx_graph_events_occurred ON public.graph_events(user_id, occurred_at DESC);
CREATE INDEX idx_graph_events_type ON public.graph_events(user_id, event_type);
CREATE INDEX idx_graph_events_entity ON public.graph_events(user_id, entity_id);

ALTER TABLE public.graph_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_see_own_events" ON public.graph_events
  FOR ALL USING (user_id = auth.uid());
CREATE POLICY "owner_reads_all_events" ON public.graph_events
  FOR SELECT USING (is_platform_owner() OR user_id = auth.uid());

-- ============================================================================
-- 5. HELPER FUNCTIONS
-- ============================================================================

-- Upsert entity with deduplication
CREATE OR REPLACE FUNCTION public.upsert_graph_entity(
  p_user_id uuid,
  p_entity_type text,
  p_canonical_name text,
  p_display_name text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_confidence numeric DEFAULT 1.0,
  p_source_system text DEFAULT 'manual'
)
RETURNS uuid AS $$
DECLARE
  v_entity_id uuid;
BEGIN
  INSERT INTO public.graph_entities (
    user_id, entity_type, canonical_name, display_name, description,
    metadata, confidence_score, source_system, last_seen_at
  )
  VALUES (
    p_user_id, p_entity_type, p_canonical_name, p_display_name, p_description,
    p_metadata, p_confidence, p_source_system, now()
  )
  ON CONFLICT (user_id, entity_type, canonical_name)
  DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, public.graph_entities.display_name),
    description = COALESCE(EXCLUDED.description, public.graph_entities.description),
    metadata = public.graph_entities.metadata || EXCLUDED.metadata,
    confidence_score = GREATEST(public.graph_entities.confidence_score, EXCLUDED.confidence_score),
    last_seen_at = now(),
    last_updated_at = now()
  RETURNING id INTO v_entity_id;

  RETURN v_entity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add relationship with deduplication
CREATE OR REPLACE FUNCTION public.add_graph_relationship(
  p_user_id uuid,
  p_source_entity_id uuid,
  p_target_entity_id uuid,
  p_relationship_type text,
  p_strength numeric DEFAULT 1.0,
  p_confidence numeric DEFAULT 1.0,
  p_source_system text DEFAULT 'manual'
)
RETURNS uuid AS $$
DECLARE
  v_rel_id uuid;
BEGIN
  INSERT INTO public.graph_relationships (
    user_id, source_entity_id, target_entity_id,
    relationship_type, strength, confidence_score, source_system
  )
  VALUES (
    p_user_id, p_source_entity_id, p_target_entity_id,
    p_relationship_type, p_strength, p_confidence, p_source_system
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_rel_id;

  -- If no insert (conflict), update the existing relationship
  IF v_rel_id IS NULL THEN
    UPDATE public.graph_relationships
    SET
      strength = GREATEST(strength, p_strength),
      confidence_score = GREATEST(confidence_score, p_confidence),
      last_confirmed_at = now()
    WHERE
      user_id = p_user_id
      AND source_entity_id = p_source_entity_id
      AND target_entity_id = p_target_entity_id
      AND relationship_type = p_relationship_type
    RETURNING id INTO v_rel_id;
  END IF;

  RETURN v_rel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find paths between entities (recursive)
CREATE OR REPLACE FUNCTION public.find_graph_paths(
  p_user_id uuid,
  p_source_entity_id uuid,
  p_target_entity_id uuid,
  p_max_depth integer DEFAULT 5
)
RETURNS TABLE (
  path uuid[],
  path_length integer,
  total_strength numeric,
  relationship_types text[]
) AS $$
WITH RECURSIVE path_search AS (
  SELECT
    ARRAY[r.source_entity_id, r.target_entity_id]::uuid[] as path,
    ARRAY[r.relationship_type]::text[] as types,
    r.strength::numeric as path_strength,
    1 as depth
  FROM public.graph_relationships r
  WHERE r.user_id = p_user_id
    AND r.source_entity_id = p_source_entity_id

  UNION ALL

  SELECT
    p.path || r.target_entity_id,
    p.types || r.relationship_type,
    (p.path_strength * r.strength)::numeric,
    p.depth + 1
  FROM path_search p
  JOIN public.graph_relationships r
    ON p.path[array_length(p.path, 1)] = r.source_entity_id
    AND r.user_id = p_user_id
  WHERE p.depth < p_max_depth
    AND NOT r.target_entity_id = ANY(p.path)
)
SELECT path, array_length(path, 1) - 1, path_strength, types
FROM path_search
WHERE path[array_length(path, 1)] = p_target_entity_id
ORDER BY path_strength DESC, depth ASC;
$$ LANGUAGE SQL STABLE;

-- Get entity centrality (degree)
CREATE OR REPLACE FUNCTION public.graph_entity_centrality(p_user_id uuid)
RETURNS TABLE (
  entity_id uuid,
  entity_name text,
  entity_type text,
  degree integer,
  confidence numeric
) AS $$
SELECT
  e.id,
  e.display_name,
  e.entity_type,
  COALESCE((SELECT COUNT(*) FROM public.graph_relationships
    WHERE user_id = p_user_id
    AND (source_entity_id = e.id OR target_entity_id = e.id)), 0),
  e.confidence_score
FROM public.graph_entities e
WHERE e.user_id = p_user_id
ORDER BY degree DESC;
$$ LANGUAGE SQL STABLE;
