BEGIN;

CREATE TABLE IF NOT EXISTS public.teams (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    created_by UUID REFERENCES public.profiles(id),

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.team_members (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    role TEXT DEFAULT 'member',

    joined_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(team_id,profile_id)

);

CREATE TABLE IF NOT EXISTS public.team_messages (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,

    sender_id UUID REFERENCES public.profiles(id),

    message TEXT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE INDEX IF NOT EXISTS idx_team_members_profile

ON public.team_members(profile_id);

CREATE INDEX IF NOT EXISTS idx_team_messages_team

ON public.team_messages(team_id);

COMMIT;
