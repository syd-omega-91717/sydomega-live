BEGIN;

CREATE TABLE IF NOT EXISTS public.system_health (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    service_name TEXT,

    service_type TEXT,

    status TEXT,

    latency_ms INTEGER,

    uptime_percentage NUMERIC,

    version TEXT,

    checked_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.system_incidents (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT,

    severity TEXT,

    status TEXT,

    started_at TIMESTAMPTZ,

    resolved_at TIMESTAMPTZ,

    description TEXT

);

CREATE INDEX IF NOT EXISTS idx_system_health_service

ON public.system_health(service_name);

COMMIT;
