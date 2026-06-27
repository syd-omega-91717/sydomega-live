alter table profiles
add column if not exists access_state text default 'pending';

alter table profiles
add column if not exists approval_expires_at timestamptz;

alter table profiles
add column if not exists last_access_at timestamptz;

alter table profiles
add column if not exists last_login_at timestamptz;

alter table profiles
add column if not exists failed_login_count integer default 0;

alter table profiles
add column if not exists locked_until timestamptz;

create index if not exists idx_profiles_access_state
on profiles(access_state);

create index if not exists idx_profiles_approval_expiry
on profiles(approval_expires_at);
