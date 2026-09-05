-- Record in the migration sequence two columns production already has.
--
-- supabase/omega_graphify_schema.sql (the flat bag) declares
-- graph_entities.verified and graph_relationships.verified, and
-- supabase/migrations/ carried no ALTER for either. The flat bag is reference
-- material, not the deployment sequence, so anything declared only there never
-- reaches production through `supabase db push`.
--
-- These two happen to be live already (applied by hand): pg_attribute reports
-- both as boolean NOT NULL DEFAULT false on 2026-09-05. So this migration is an
-- exact no-op against production and exists to put the sequence back in step
-- with the database -- migrations/README.md line 60 permits new migrations,
-- and forbids rewriting existing ones.

ALTER TABLE public.graph_entities
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

ALTER TABLE public.graph_relationships
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
