BEGIN;

CREATE TABLE IF NOT EXISTS public.notification_templates (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT UNIQUE NOT NULL,

    title TEXT,

    subject TEXT,

    body TEXT,

    channel TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.notification_queue (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    template_id UUID REFERENCES public.notification_templates(id),

    payload JSONB DEFAULT '{}'::jsonb,

    status TEXT DEFAULT 'pending',

    attempts INTEGER DEFAULT 0,

    scheduled_at TIMESTAMPTZ DEFAULT now(),

    processed_at TIMESTAMPTZ

);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status

ON public.notification_queue(status);

COMMIT;
