BEGIN;

CREATE TABLE IF NOT EXISTS public.storage_files (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id),

    organization_id UUID REFERENCES public.organizations(id),

    folder TEXT,

    filename TEXT NOT NULL,

    storage_path TEXT NOT NULL,

    mime_type TEXT,

    extension TEXT,

    size_bytes BIGINT,

    checksum TEXT,

    visibility TEXT DEFAULT 'private',

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.storage_shares (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    file_id UUID REFERENCES public.storage_files(id) ON DELETE CASCADE,

    shared_by UUID REFERENCES public.profiles(id),

    shared_to UUID REFERENCES public.profiles(id),

    permission TEXT DEFAULT 'read',

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_storage_owner
ON public.storage_files(owner_id);

CREATE INDEX IF NOT EXISTS idx_storage_org
ON public.storage_files(organization_id);

COMMIT;
