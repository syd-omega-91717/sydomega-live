create table if not exists approval_notifications (

    id uuid primary key default gen_random_uuid(),

    approval_request_id uuid references approval_requests(id) on delete cascade,

    recipient uuid references profiles(id) on delete cascade,

    sender uuid references profiles(id),

    title text not null,

    body text,

    notification_type text default 'approval',

    status text default 'unread',

    action_url text,

    created_at timestamptz default now(),

    read_at timestamptz

);

create index if not exists idx_approval_notifications_recipient
on approval_notifications(recipient);

create index if not exists idx_approval_notifications_status
on approval_notifications(status);
