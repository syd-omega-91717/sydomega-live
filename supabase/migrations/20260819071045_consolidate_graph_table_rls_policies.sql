-- Recovered from supabase_migrations.schema_migrations on the live project
-- (ydqhzvvoyufiiqvzcjns) 2026-08-30: this migration was applied to production
-- but had no file in this directory, which is what "Remote migration versions
-- not found in local migrations directory" was reporting. Content is the exact
-- statement recorded on the remote, not a reconstruction.

-- RLS Consolidation: Graph tables (4 tables, 8 policies → 4 policies)
-- Merge redundant member-read + owner-read policies into single per-table policies

-- graph_entities
ALTER POLICY members_see_own_entities ON public.graph_entities 
USING (is_platform_owner() OR user_id = auth.uid());
DROP POLICY owner_reads_all_entities ON public.graph_entities;

-- graph_events
ALTER POLICY members_see_own_events ON public.graph_events 
USING (is_platform_owner() OR user_id = auth.uid());
DROP POLICY owner_reads_all_events ON public.graph_events;

-- graph_evidence
ALTER POLICY members_see_own_evidence ON public.graph_evidence 
USING (is_platform_owner() OR user_id = auth.uid());
DROP POLICY owner_reads_all_evidence ON public.graph_evidence;

-- graph_relationships
ALTER POLICY members_see_own_relationships ON public.graph_relationships 
USING (is_platform_owner() OR user_id = auth.uid());
DROP POLICY owner_reads_all_relationships ON public.graph_relationships;
