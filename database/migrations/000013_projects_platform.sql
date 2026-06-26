BEGIN;

-- =====================================================
-- PROJECTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    icon TEXT,

    color TEXT,

    visibility TEXT DEFAULT 'private',

    status TEXT DEFAULT 'active',

    start_date DATE,

    due_date DATE,

    completed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- PROJECT MEMBERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_members (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    role TEXT DEFAULT 'member',

    joined_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(project_id,profile_id)

);

-- =====================================================
-- PROJECT FILES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_files (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    uploader_id UUID REFERENCES public.profiles(id),

    filename TEXT,

    file_path TEXT,

    mime_type TEXT,

    file_size BIGINT,

    uploaded_at TIMESTAMPTZ DEFAULT now()

);

-- =====================================================
-- PROJECT ACTIVITY
-- =====================================================

CREATE TABLE IF NOT EXISTS public.project_activity (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    action TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
