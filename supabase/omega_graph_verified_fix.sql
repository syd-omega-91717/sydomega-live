-- ============================================================================
-- omega_graph_verified_fix.sql
--
-- graph-admin.html has "verify" actions for both entities and relationships
-- (verifyEntity / verifyRelationship). Both write a `verified` boolean that
-- exists on neither table:
--
--   supabase/omega_graphify_schema.sql
--     graph_entities      -> id, user_id, entity_type, canonical_name,
--                            display_name, description, metadata,
--                            first_seen_at, last_updated_at, last_seen_at,
--                            confidence_score
--     graph_relationships -> id, user_id, source_entity_id, target_entity_id,
--                            relationship_type, strength, direction,
--                            properties, established_at, last_confirmed_at
--
-- PostgREST rejects the entire update when any column is unknown, and the
-- Supabase client resolves to {data, error} rather than throwing -- so the
-- try/catch around those calls never fired. The result was the silent-failure
-- shape this repo keeps hitting (CLAUDE.md §8, §9): the update was discarded
-- in full, so confidence_score/strength were never written either, and the
-- admin panel reloaded and re-rendered as though the entity had been verified.
--
-- The client-side half of this fix (the missing .error checks, and
-- `confidence` -> the real `strength` column on graph_relationships) is in the
-- same commit. This file adds the column the feature was written against.
--
-- Idempotent, matching the convention of every other *_fix.sql here: safe to
-- re-run, adds nothing if the column already exists, and touches no data.
--
-- STATUS: APPLIED TO THE LIVE DATABASE (project ydqhzvvoyufiiqvzcjns) as
-- migration `add_graph_verified_columns`, and verified afterwards:
-- information_schema.columns shows verified boolean NOT NULL DEFAULT false on
-- both tables, and pg_indexes shows both (user_id, verified) indexes.
--
-- Verified against the live schema BEFORE applying, not assumed: neither table
-- had a `verified` column, graph_relationships.strength is numeric DEFAULT 1.0
-- (so the client's `confidence` was indeed wrong), and graph_events carries
-- entity_id/occurred_at/recorded_at with no entity_name or created_at.
--
-- NOTE: applying this column alone was NOT sufficient to make the feature work.
-- All four graph_* tables had RLS policies but no table-level GRANT to
-- `authenticated`, so every query returned 42501 permission denied regardless
-- of the columns. See omega_grant_policied_tables.sql in this directory.
-- ============================================================================

ALTER TABLE public.graph_entities
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.graph_relationships
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Admin panels filter on this; both tables are already scoped by user_id in
-- their RLS policies, so the index is on (user_id, verified) rather than
-- verified alone.
CREATE INDEX IF NOT EXISTS idx_graph_entities_verified
  ON public.graph_entities (user_id, verified);

CREATE INDEX IF NOT EXISTS idx_graph_relationships_verified
  ON public.graph_relationships (user_id, verified);

COMMENT ON COLUMN public.graph_entities.verified IS
  'Set true by graph-admin.html verifyEntity(); marks an entity as human-confirmed.';
COMMENT ON COLUMN public.graph_relationships.verified IS
  'Set true by graph-admin.html verifyRelationship(); marks a relationship as human-confirmed.';
