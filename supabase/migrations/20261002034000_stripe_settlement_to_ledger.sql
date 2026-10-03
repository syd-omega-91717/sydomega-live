begin;

create or replace function omega_private.record_stripe_payment(
  p_event_id text,
  p_event_type text,
  p_user_id uuid,
  p_amount_minor bigint,
  p_currency text,
  p_provider_reference text,
  p_payload_hash text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, omega_private, pg_temp
as $$
declare
  v_existing uuid;
  v_tx uuid;
  v_currency text := upper(trim(p_currency));
  v_amount numeric;
  v_treasury uuid;
  v_revenue uuid;
  v_recon uuid;
begin
  if p_event_id is null or length(trim(p_event_id)) < 8 then
    raise exception 'stripe_event_id_required';
  end if;
  if p_amount_minor is null or p_amount_minor <= 0 then
    raise exception 'stripe_amount_required';
  end if;
  if v_currency !~ '^[A-Z]{3}$' then
    raise exception 'stripe_currency_invalid';
  end if;
  if p_user_id is null or not exists(select 1 from auth.users where id=p_user_id) then
    raise exception 'stripe_user_not_found';
  end if;

  select transaction_id into v_existing
  from public.omega_payment_events
  where provider='stripe' and provider_event_id=p_event_id
  for update;

  if v_existing is not null then
    return v_existing;
  end if;

  v_amount := p_amount_minor::numeric / 100;

  select account_id into v_treasury
  from public.omega_ledger_accounts
  where owner_user_id is null and account_type='TREASURY'
    and currency_code=v_currency and status='ACTIVE'
  order by created_at
  limit 1;

  if v_treasury is null then
    insert into public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
    values(null,'TREASURY',v_currency,'Stripe settlement treasury',jsonb_build_object('provider','stripe'))
    returning account_id into v_treasury;
  end if;

  select account_id into v_revenue
  from public.omega_ledger_accounts
  where owner_user_id is null and account_type='REVENUE'
    and currency_code=v_currency and status='ACTIVE'
  order by created_at
  limit 1;

  if v_revenue is null then
    insert into public.omega_ledger_accounts(owner_user_id,account_type,currency_code,label,metadata)
    values(null,'REVENUE',v_currency,'Stripe platform revenue',jsonb_build_object('provider','stripe'))
    returning account_id into v_revenue;
  end if;

  v_tx := omega_private.post_ledger_transaction(
    'stripe:'||p_event_id,
    'STRIPE_SETTLEMENT',
    v_currency,
    'Stripe settlement '||p_event_type,
    jsonb_build_array(
      jsonb_build_object('account_id',v_treasury,'direction','DEBIT','amount',v_amount,'currency_code',v_currency),
      jsonb_build_object('account_id',v_revenue,'direction','CREDIT','amount',v_amount,'currency_code',v_currency)
    ),
    p_provider_reference,
    coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('stripe_event_id',p_event_id,'user_id',p_user_id)
  );

  insert into public.omega_payment_events(
    provider,provider_event_id,event_type,payload_hash,status,transaction_id,metadata,processed_at
  ) values (
    'stripe',p_event_id,p_event_type,coalesce(p_payload_hash,''),'PROCESSED',v_tx,
    coalesce(p_metadata,'{}'::jsonb)||jsonb_build_object('user_id',p_user_id,'amount_minor',p_amount_minor,'currency',v_currency),
    now()
  );

  insert into public.omega_payment_reconciliation(
    provider,provider_reference,internal_transaction_id,expected_amount,settled_amount,currency,status,idempotency_key,evidence,reconciled_at
  ) values (
    'stripe',p_provider_reference,v_tx,v_amount,v_amount,v_currency,'matched',
    'stripe-reconciliation:'||p_event_id,
    jsonb_build_object('event_id',p_event_id,'event_type',p_event_type,'payload_hash',p_payload_hash,'user_id',p_user_id),
    now()
  ) on conflict(idempotency_key) do nothing returning reconciliation_id into v_recon;

  return v_tx;
end;
$$;

revoke all on function omega_private.record_stripe_payment(text,text,uuid,bigint,text,text,text,jsonb)
  from public,anon,authenticated;
grant execute on function omega_private.record_stripe_payment(text,text,uuid,bigint,text,text,text,jsonb)
  to service_role;

commit;