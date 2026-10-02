-- SYD OMEGA 91717
-- Reconcile the live Stripe webhook RPC contract with the checked-in edge function.
begin;

create table if not exists public.stripe_webhook_events (
  event_id text primary key,
  event_type text not null,
  status text not null default 'processing',
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.stripe_webhook_events
  add column if not exists status text not null default 'processing';
alter table public.stripe_webhook_events
  add column if not exists processed_at timestamptz;
alter table public.stripe_webhook_events enable row level security;
revoke all on table public.stripe_webhook_events from anon, authenticated, public;

create or replace function public.apply_subscription_event(
  p_uid uuid,
  p_tier text,
  p_status text,
  p_period_end timestamptz,
  p_customer text,
  p_event_id text,
  p_event_type text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  inserted_count integer;
  event_status text;
  result jsonb;
begin
  if auth.role() <> 'service_role' and not public.is_platform_owner() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;

  if p_event_id is null or btrim(p_event_id) = '' then
    raise exception 'stripe_event_id_required';
  end if;

  insert into public.stripe_webhook_events(event_id,event_type,status)
  values(btrim(p_event_id),coalesce(nullif(btrim(p_event_type),''),'unknown'),'processing')
  on conflict(event_id) do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 0 then
    select status into event_status
    from public.stripe_webhook_events
    where event_id=btrim(p_event_id)
    for update;

    if event_status='processed' then
      return jsonb_build_object('ok',true,'duplicate',true,'event_id',btrim(p_event_id));
    end if;
  end if;

  if not exists(select 1 from public.profiles where id=p_uid) then
    raise exception 'subscription_profile_not_found';
  end if;

  select public.apply_subscription(p_uid,p_tier,p_status,p_period_end,p_customer)
  into result;

  if result is null or result->>'ok' is distinct from 'true' then
    raise exception 'subscription_apply_failed';
  end if;

  update public.stripe_webhook_events
  set status='processed',
      processed_at=now(),
      event_type=coalesce(nullif(btrim(p_event_type),''),event_type)
  where event_id=btrim(p_event_id);

  return result || jsonb_build_object('event_id',btrim(p_event_id),'event_type',p_event_type);
end;
$function$;

revoke all on function public.apply_subscription_event(uuid,text,text,timestamptz,text,text,text)
  from public, anon, authenticated;
grant execute on function public.apply_subscription_event(uuid,text,text,timestamptz,text,text,text)
  to service_role;

commit;
