-- Ω SYD OMEGA 91717 — the ledger could never post a transaction
-- omega_private.post_ledger_transaction (canonical 20261002072345) called
-- pg_catalog.trim(...) and pg_catalog.coalesce(...). TRIM and COALESCE are SQL
-- syntax, not catalog functions, so both raise 42883 at runtime; the first sits
-- in the opening idempotency check, so every call failed. Found 2026-10-17 by
-- driving public.record_stripe_payment (20261017093038) as service_role in a
-- rolled-back transaction: "function pg_catalog.trim(text) does not exist".
-- 0 ledger transactions had ever been posted.
--
-- Body is the live definition with exactly two changes: pg_catalog.btrim for
-- pg_catalog.trim (identical semantics on text) and bare coalesce (search_path
-- is '', which still resolves keyword forms). Owner, SECURITY DEFINER,
-- search_path and the service_role-only EXECUTE grant are kept by
-- CREATE OR REPLACE; the grant is restated so a fresh replay ends identical.

begin;

create or replace function omega_private.post_ledger_transaction(
  p_idempotency_key text,
  p_event_type text,
  p_currency_code text,
  p_description text,
  p_entries jsonb,
  p_external_reference text default null::text,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_transaction_id uuid;
  v_debits numeric := 0;
  v_credits numeric := 0;
  v_entry jsonb;
  v_account uuid;
begin
  if p_idempotency_key is null or pg_catalog.length(pg_catalog.btrim(p_idempotency_key)) < 8 then
    raise exception 'idempotency_key_required';
  end if;
  if pg_catalog.jsonb_typeof(p_entries) <> 'array'
     or pg_catalog.jsonb_array_length(p_entries) < 2 then
    raise exception 'at_least_two_entries_required';
  end if;

  select transaction_id into v_transaction_id
    from public.omega_ledger_transactions
   where idempotency_key = p_idempotency_key
   for update;

  if v_transaction_id is not null then
    return v_transaction_id;
  end if;

  for v_entry in select value from pg_catalog.jsonb_array_elements(p_entries)
  loop
    v_account := (v_entry->>'account_id')::uuid;
    if v_entry->>'currency_code' <> p_currency_code then
      raise exception 'currency_mismatch';
    end if;
    if (v_entry->>'amount')::numeric <= 0 then
      raise exception 'amount_must_be_positive';
    end if;
    if v_entry->>'direction' = 'DEBIT' then
      v_debits := v_debits + (v_entry->>'amount')::numeric;
    elsif v_entry->>'direction' = 'CREDIT' then
      v_credits := v_credits + (v_entry->>'amount')::numeric;
    else
      raise exception 'invalid_direction';
    end if;
    if not exists (
      select 1 from public.omega_ledger_accounts
       where account_id=v_account
         and status='ACTIVE'
         and currency_code=p_currency_code
    ) then
      raise exception 'invalid_or_inactive_account';
    end if;
  end loop;

  if v_debits <> v_credits then
    raise exception 'ledger_not_balanced';
  end if;

  insert into public.omega_ledger_transactions
    (idempotency_key,event_type,currency_code,external_reference,description,metadata)
  values
    (p_idempotency_key,p_event_type,p_currency_code,p_external_reference,p_description,p_metadata)
  returning transaction_id into v_transaction_id;

  for v_entry in select value from pg_catalog.jsonb_array_elements(p_entries)
  loop
    insert into public.omega_ledger_entries
      (transaction_id,account_id,direction,amount,currency_code,metadata)
    values (
      v_transaction_id,
      (v_entry->>'account_id')::uuid,
      v_entry->>'direction',
      (v_entry->>'amount')::numeric,
      p_currency_code,
      coalesce(v_entry->'metadata','{}'::jsonb)
    );
  end loop;

  return v_transaction_id;
end;
$function$;

revoke all on function omega_private.post_ledger_transaction(text, text, text, text, jsonb, text, jsonb) from public, anon, authenticated;
grant execute on function omega_private.post_ledger_transaction(text, text, text, text, jsonb, text, jsonb) to service_role;

commit;
