BEGIN;

CREATE TABLE IF NOT EXISTS public.publication_categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_tags (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_comments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    publication_id BIGINT NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_versions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    publication_id BIGINT NOT NULL REFERENCES public.publications(id) ON DELETE CASCADE,

    version INTEGER NOT NULL,

    title TEXT,

    body TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_tag_map (

    publication_id BIGINT REFERENCES public.publications(id) ON DELETE CASCADE,

    tag_id UUID REFERENCES public.publication_tags(id) ON DELETE CASCADE,

    PRIMARY KEY(publication_id,tag_id)

);

CREATE INDEX IF NOT EXISTS idx_publication_comments_publication

ON public.publication_comments(publication_id);

CREATE INDEX IF NOT EXISTS idx_publication_versions_publication

ON public.publication_versions(publication_id);

COMMIT;
