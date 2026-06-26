BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_workspaces (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id),

    owner_id UUID REFERENCES public.profiles(id),

    name TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.ai_workspace_members (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    role TEXT DEFAULT 'member',

    UNIQUE(workspace_id,profile_id)

);

CREATE TABLE IF NOT EXISTS public.ai_workspace_documents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workspace_id UUID REFERENCES public.ai_workspaces(id) ON DELETE CASCADE,

    document_id UUID REFERENCES public.ai_documents(id) ON DELETE CASCADE,

    PRIMARY KEY(workspace_id,document_id)

);

COMMIT;
