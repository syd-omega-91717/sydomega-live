create table if not exists founder_dashboard_events (

    id uuid primary key default gen_random_uuid(),

    profile_id uuid references profiles(id) on delete cascade,

    actor_id uuid references profiles(id),

    module text not null,

    event text not null,

    severity text default 'info',

    payload jsonb default '{}'::jsonb,

    created_at timestamptz default now()

);

create index if not exists idx_founder_events_created
on founder_dashboard_events(created_at desc);

create index if not exists idx_founder_events_profile
on founder_dashboard_events(profile_id);
