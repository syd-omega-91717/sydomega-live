-- FILE: supabase/migrations/20261023120000_omega_personal_context_link_fk_indexes.sql
-- Cover the referencing side of the two composite owner-scoped foreign keys.
-- Existing indexes lead with user_id, which does not efficiently cover FK
-- checks ordered as (from_item_id, user_id) and (to_item_id, user_id).
-- The table is currently empty; these small indexes avoid future delete/update
-- scans as personal-context graph data grows. Do not remove existing indexes
-- based only on advisor "unused" observations.

CREATE INDEX IF NOT EXISTS omega_personal_context_links_from_item_user_fk_idx
  ON public.omega_personal_context_links (from_item_id, user_id);

CREATE INDEX IF NOT EXISTS omega_personal_context_links_to_item_user_fk_idx
  ON public.omega_personal_context_links (to_item_id, user_id);
