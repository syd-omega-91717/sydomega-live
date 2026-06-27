create extension if not exists pgcrypto;

create table if not exists approval_requests (

    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null references profiles(id) on delete cascade,

    request_type text not null default 'platform_access',

    requested_role text default 'user',

    requested_plan text default 'free',

    current_status text not null default 'pending',

    notes text,

    reviewed_by uuid references profiles(id),

    reviewed_at timestamptz,

    rejection_reason text,

    created_at timestamptz not null default now()

);

create index if not exists idx_approval_profile
on approval_requests(profile_id);

create index if not exists idx_approval_status
on approval_requests(current_status);

create index if not exists idx_approval_created
on approval_requests(created_at desc);
