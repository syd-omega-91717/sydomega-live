-- SYD OMEGA 91717
-- Server-only notification claim boundary for short-lived workers.
begin;

create or replace function omega_private.claim_notifications(
  p_limit integer default 25,
  p_worker_id text default 'omega-notification-worker',
  p_channels text[] default array['in_app']::text[],
  p_reclaim_after interval default interval '15 minutes'
) returns setof uuid
language plpgsql
security definer
set search_path=''
as $$
begin
  if p_limit < 1 or p_limit > 100 then
    raise exception 'notification_claim_limit_invalid';
  end if;
  if p_worker_id is null or btrim(p_worker_id)='' then
    raise exception 'notification_worker_id_required';
  end if;
  if p_channels is null or cardinality(p_channels)=0 then
    raise exception 'notification_channels_required';
  end if;

  return query
  with picked as (
    select n.notification_id
    from public.omega_notifications n
    where n.channel = any(p_channels)
      and (
        n.status='queued'
        or (n.status='sent' and n.sent_at is not null and n.sent_at < now()-p_reclaim_after)
      )
    order by n.created_at asc
    for update skip locked
    limit p_limit
  )
  update public.omega_notifications n
  set status='sent', sent_at=now(),
      metadata=jsonb_set(coalesce(n.metadata,'{}'::jsonb),'{delivery}',
        jsonb_build_object('worker_id',p_worker_id,'claimed_at',now(),'attempted_at',now()),true)
  from picked
  where n.notification_id=picked.notification_id
  returning n.notification_id;
end;
$$;

revoke all on function omega_private.claim_notifications(integer,text,text[],interval) from public,anon,authenticated;
grant execute on function omega_private.claim_notifications(integer,text,text[],interval) to service_role;

commit;