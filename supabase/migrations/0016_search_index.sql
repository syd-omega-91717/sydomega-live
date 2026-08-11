-- SYD OMEGA 91717 -- Search index (idempotent; RLS added)
-- Not currently wired into search.html -- that page's search is client-side over
-- a hardcoded page list, not this table. Fixed for correctness (schema prefix,
-- IF NOT EXISTS, RLS) so it's safe to run and ready if server-side/content search
-- is built later.
CREATE TABLE IF NOT EXISTS public.search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  title TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entity_type, entity_id)
);

ALTER TABLE public.search_index ENABLE ROW LEVEL SECURITY;
-- Read-only for all authenticated members; only the owner (via service role
-- or an owner-checked function) should ever write to a shared index.
DROP POLICY IF EXISTS search_index_read ON public.search_index;
CREATE POLICY search_index_read ON public.search_index FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.search_index TO authenticated;
