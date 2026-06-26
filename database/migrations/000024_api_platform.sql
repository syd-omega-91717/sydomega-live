BEGIN;

CREATE TABLE IF NOT EXISTS public.api_keys (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id),

    organization_id UUID REFERENCES public.organizations(id),

    name TEXT NOT NULL,

    api_key TEXT UNIQUE NOT NULL,

    api_secret TEXT,

    scopes JSONB DEFAULT '[]'::jsonb,

    last_used_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.webhooks (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id),

    owner_id UUID REFERENCES public.profiles(id),

    endpoint TEXT NOT NULL,

    events JSONB DEFAULT '[]'::jsonb,

    secret TEXT,

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.webhook_logs (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    webhook_id UUID REFERENCES public.webhooks(id) ON DELETE CASCADE,

    response_code INTEGER,

    response_body TEXT,

    delivered_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_api_owner
ON public.api_keys(owner_id);

CREATE INDEX IF NOT EXISTS idx_webhooks_org
ON public.webhooks(organization_id);

COMMIT;
