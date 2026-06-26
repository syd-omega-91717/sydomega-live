BEGIN;

-- =====================================================
-- KNOWLEDGE SPACES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.knowledge_spaces (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    visibility TEXT DEFAULT 'private',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- KNOWLEDGE DOCUMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.knowledge_documents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    space_id UUID REFERENCES public.knowledge_spaces(id) ON DELETE CASCADE,

    author_id UUID REFERENCES public.profiles(id),

    title TEXT NOT NULL,

    slug TEXT,

    summary TEXT,

    body TEXT,

    version INTEGER DEFAULT 1,

    status TEXT DEFAULT 'draft',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- KNOWLEDGE ATTACHMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.knowledge_attachments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    document_id UUID REFERENCES public.knowledge_documents(id) ON DELETE CASCADE,

    uploader_id UUID REFERENCES public.profiles(id),

    filename TEXT,

    file_path TEXT,

    mime_type TEXT,

    file_size BIGINT,

    uploaded_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
