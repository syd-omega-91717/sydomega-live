BEGIN;

CREATE TABLE IF NOT EXISTS public.search_index (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    entity_type TEXT NOT NULL,

    entity_id TEXT NOT NULL,

    title TEXT,

    body TEXT,

    keywords TEXT,

    organization_id UUID,

    owner_id UUID,

    indexed_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_search_entity

ON public.search_index(entity_type,entity_id);

CREATE INDEX IF NOT EXISTS idx_search_owner

ON public.search_index(owner_id);

CREATE INDEX IF NOT EXISTS idx_search_org

ON public.search_index(organization_id);

COMMIT;
