begin;

create unique index if not exists omega_platform_events_member_idempotency_idx
  on public.omega_platform_events (
    actor_user_id,
    event_type,
    ((metadata ->> 'idempotency_key'))
  )
  where actor_user_id is not null
    and metadata ? 'idempotency_key';

commit;
