BEGIN;

CREATE TABLE IF NOT EXISTS public.workflows (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id),

    owner_id UUID REFERENCES public.profiles(id),

    name TEXT NOT NULL,

    description TEXT,

    trigger_type TEXT,

    status TEXT DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.workflow_steps (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID REFERENCES public.workflows(id) ON DELETE CASCADE,

    step_order INTEGER,

    step_type TEXT,

    configuration JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.workflow_runs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    workflow_id UUID REFERENCES public.workflows(id),

    started_by UUID REFERENCES public.profiles(id),

    status TEXT DEFAULT 'running',

    started_at TIMESTAMPTZ DEFAULT now(),

    completed_at TIMESTAMPTZ

);

COMMIT;
