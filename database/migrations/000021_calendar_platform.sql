BEGIN;

CREATE TABLE IF NOT EXISTS public.calendars (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,

    name TEXT NOT NULL,

    color TEXT DEFAULT '#3B82F6',

    is_default BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.calendar_events (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    calendar_id UUID REFERENCES public.calendars(id) ON DELETE CASCADE,

    creator_id UUID REFERENCES public.profiles(id),

    title TEXT NOT NULL,

    description TEXT,

    location TEXT,

    start_at TIMESTAMPTZ NOT NULL,

    end_at TIMESTAMPTZ NOT NULL,

    all_day BOOLEAN DEFAULT FALSE,

    recurrence_rule TEXT,

    status TEXT DEFAULT 'scheduled',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_calendar_events_calendar
ON public.calendar_events(calendar_id);

CREATE INDEX IF NOT EXISTS idx_calendar_events_start
ON public.calendar_events(start_at);

COMMIT;
