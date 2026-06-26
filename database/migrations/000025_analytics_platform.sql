BEGIN;

CREATE TABLE IF NOT EXISTS public.analytics_events (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    organization_id UUID REFERENCES public.organizations(id),

    event_name TEXT NOT NULL,

    entity_type TEXT,

    entity_id TEXT,

    metadata JSONB DEFAULT '{}'::jsonb,

    ip_address TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.system_metrics (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    metric_name TEXT,

    metric_value NUMERIC,

    metric_unit TEXT,

    source TEXT,

    measured_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_analytics_profile
ON public.analytics_events(profile_id);

CREATE INDEX IF NOT EXISTS idx_analytics_org
ON public.analytics_events(organization_id);

COMMIT;
