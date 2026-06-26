BEGIN;

CREATE TABLE IF NOT EXISTS public.publication_categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_tags (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT UNIQUE NOT NULL

);

CREATE TABLE IF NOT EXISTS public.publication_comments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    publication_id UUID REFERENCES public.publications(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.publication_versions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    publication_id UUID REFERENCES public.publications(id) ON DELETE CASCADE,

    version INTEGER NOT NULL,

    changelog TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
