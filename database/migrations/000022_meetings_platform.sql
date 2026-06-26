BEGIN;

CREATE TABLE IF NOT EXISTS public.meetings (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,

    organizer_id UUID REFERENCES public.profiles(id),

    meeting_type TEXT DEFAULT 'online',

    meeting_url TEXT,

    meeting_password TEXT,

    recording_url TEXT,

    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.meeting_participants (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    meeting_id UUID REFERENCES public.meetings(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    invitation_status TEXT DEFAULT 'pending',

    joined_at TIMESTAMPTZ,

    left_at TIMESTAMPTZ,

    UNIQUE(meeting_id,profile_id)

);

CREATE INDEX IF NOT EXISTS idx_meeting_participants_profile
ON public.meeting_participants(profile_id);

COMMIT;
