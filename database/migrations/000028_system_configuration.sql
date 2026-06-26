BEGIN;

CREATE TABLE IF NOT EXISTS public.system_configuration (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    config_key TEXT UNIQUE NOT NULL,

    config_value JSONB DEFAULT '{}'::jsonb,

    description TEXT,

    updated_by UUID REFERENCES public.profiles(id),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.feature_flags (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    flag_key TEXT UNIQUE NOT NULL,

    enabled BOOLEAN DEFAULT FALSE,

    rollout_percentage INTEGER DEFAULT 100,

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
