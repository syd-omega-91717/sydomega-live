-- Fix: Add missing find_contradictions RPC for graphify-ai-query Edge Function
-- The graphify-ai-query function calls this to detect conflicting relationships
-- (e.g., "blocks" vs "enables" between the same entity pair)

CREATE OR REPLACE FUNCTION public.find_contradictions(p_user_id uuid)
RETURNS TABLE(
  source_entity_id uuid,
  target_entity_id uuid,
  source_name text,
  target_name text,
  relationship_types text,
  conflict_type text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gr1.source_entity_id,
    gr1.target_entity_id,
    ge1.label AS source_name,
    ge2.label AS target_name,
    (gr1.relationship_type || ' <-> ' || gr2.relationship_type) AS relationship_types,
    'conflicting_relationship_types' AS conflict_type
  FROM
    public.graph_relationships gr1
    JOIN public.graph_relationships gr2 ON
      gr1.user_id = gr2.user_id
      AND gr1.source_entity_id = gr2.source_entity_id
      AND gr1.target_entity_id = gr2.target_entity_id
      AND gr1.id < gr2.id -- avoid duplicates
      AND (
        -- Detect conflicting types like "blocks" vs "enables"
        (gr1.relationship_type ILIKE '%block%' AND gr2.relationship_type ILIKE '%enable%')
        OR (gr1.relationship_type ILIKE '%enable%' AND gr2.relationship_type ILIKE '%block%')
        OR (gr1.relationship_type ILIKE '%contradict%' AND gr2.relationship_type NOT ILIKE '%contradict%')
      )
    JOIN public.graph_entities ge1 ON gr1.source_entity_id = ge1.id
    JOIN public.graph_entities ge2 ON gr1.target_entity_id = ge2.id
  WHERE
    gr1.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated members
GRANT EXECUTE ON FUNCTION public.find_contradictions(uuid) TO authenticated;
