alter table profiles
add column if not exists approval_status text default 'pending';

alter table profiles
add column if not exists approval_level integer default 0;

alter table profiles
add column if not exists approved_at timestamptz;

alter table profiles
add column if not exists approved_by uuid;

alter table profiles
add column if not exists rejection_reason text;

alter table profiles
add column if not exists account_enabled boolean default false;

alter table profiles
add column if not exists subscription_status text default 'free';

alter table profiles
add column if not exists verification_status text default 'pending';

create table if not exists approval_requests (

    id uuid primary key default gen_random_uuid(),

    profile_id uuid not null references profiles(id) on delete cascade,

    request_type text not null,

    current_status text default 'pending',

    requested_role text,

    requested_plan text,

    notes text,

    reviewed_by uuid,

    reviewed_at timestamptz,

    rejection_reason text,

    created_at timestamptz default now()

);

create index if not exists idx_approval_requests_profile
on approval_requests(profile_id);

create index if not exists idx_approval_requests_status
on approval_requests(current_status);
