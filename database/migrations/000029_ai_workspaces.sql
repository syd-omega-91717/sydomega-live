BEGIN;

-- =========================================================
-- AI WORKSPACES
-- =========================================================

CREATE TABLE IF NOT EXISTS public.ai_workspaces (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id),

    owner_id UUID REFERENCES public.profiles(id),

    name TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- =========================================================
-- AI WORKSPACE MEMBERS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.ai_workspace_members (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    role TEXT DEFAULT 'member',

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(workspace_id,profile_id)

);

-- =========================================================
-- AI WORKSPACE DOCUMENTS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.ai_workspace_documents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,

    document_id UUID REFERENCES public.ai_documents(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(workspace_id,document_id)

);

CREATE INDEX IF NOT EXISTS idx_ai_workspace_documents_workspace
ON public.ai_workspace_documents(workspace_id);

CREATE INDEX IF NOT EXISTS idx_ai_workspace_documents_document
ON public.ai_workspace_documents(document_id);

COMMIT;
