-- SYD OMEGA 91717
-- Server-only service order -> entitlement activation boundary.
begin;

create or replace function omega_private.activate_service_order(
  p_order_id uuid,
  p_provider_reference text default null,
  p_transaction_id uuid default null
) returns uuid
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare
  v_order public.omega_service_orders%rowtype;
  v_service public.omega_services%rowtype;
  v_entitlement uuid;
begin
  select * into v_order
  from public.omega_service_orders
  where order_id=p_order_id
  for update;

  if v_order.order_id is null then raise exception 'service_order_not_found'; end if;

  select * into v_service
  from public.omega_services
  where service_id=v_order.service_id;

  if v_service.service_id is null then raise exception 'service_not_found'; end if;
  if v_service.status not in ('ACTIVE','VERIFIED') then
    raise exception 'service_not_activated';
  end if;

  if v_order.status in ('ACTIVATED','FULFILLED')
     and v_order.entitlement_id is not null then
    return v_order.entitlement_id;
  end if;

  insert into public.omega_entitlements(
    user_id,product_id,status,source_transaction_id,metadata
  )
  values(
    v_order.user_id,v_order.service_id,'ACTIVE',p_transaction_id,
    jsonb_build_object(
      'order_id',v_order.order_id,
      'provider_reference',p_provider_reference
    )
  )
  returning entitlement_id into v_entitlement;

  update public.omega_service_orders
  set status='ACTIVATED',
      provider_reference=coalesce(p_provider_reference,provider_reference),
      entitlement_id=v_entitlement,
      updated_at=now()
  where order_id=p_order_id;

  perform omega_private.enqueue_notification(
    v_order.user_id,
    'service_activated',
    'Service activated',
    'Your SYD OMEGA service is now active.',
    'in_app',
    'service-activated:'||p_order_id::text,
    jsonb_build_object('service_id',v_order.service_id,'order_id',p_order_id)
  );

  return v_entitlement;
end $$;

revoke all on function omega_private.activate_service_order(uuid,text,uuid)
  from public,anon,authenticated;
grant execute on function omega_private.activate_service_order(uuid,text,uuid)
  to service_role;

commit;
