create schema if not exists omega_private;

create table if not exists public.omega_ledger_accounts (
  account_id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references auth.users(id) on delete restrict,
  account_type text not null check (account_type in ('USER','TREASURY','REVENUE','CLEARING','FEE','SUSPENSE','EXTERNAL')),
  currency_code text not null check (currency_code ~ '^[A-Z]{3,12}$'),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','FROZEN','CLOSED')),
  label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.omega_ledger_transactions (
  transaction_id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  event_type text not null,
  currency_code text not null,
  external_reference text,
  description text not null,
  status text not null default 'POSTED' check (status in ('PENDING','POSTED','REVERSED','FAILED')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.omega_ledger_entries (
  entry_id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.omega_ledger_transactions(transaction_id) on delete restrict,
  account_id uuid not null references public.omega_ledger_accounts(account_id) on delete restrict,
  direction text not null check (direction in ('DEBIT','CREDIT')),
  amount numeric(28,8) not null check (amount > 0),
  currency_code text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists omega_ledger_entries_transaction_idx
  on public.omega_ledger_entries(transaction_id);
create index if not exists omega_ledger_entries_account_idx
  on public.omega_ledger_entries(account_id, created_at desc);

create table if not exists public.omega_payment_events (
  payment_event_id uuid primary key default gen_random_uuid(),
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  payload_hash text not null,
  status text not null default 'RECEIVED' check (status in ('RECEIVED','PROCESSED','IGNORED','FAILED')),
  transaction_id uuid references public.omega_ledger_transactions(transaction_id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique(provider, provider_event_id)
);

create table if not exists public.omega_entitlements (
  entitlement_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  product_id text not null,
  status text not null default 'ACTIVE' check (status in ('PENDING','ACTIVE','PAUSED','EXPIRED','REVOKED')),
  source_transaction_id uuid references public.omega_ledger_transactions(transaction_id) on delete restrict,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists omega_entitlements_user_idx
  on public.omega_entitlements(user_id,status);

create or replace function omega_private.post_ledger_transaction(
  p_idempotency_key text,
  p_event_type text,
  p_currency_code text,
  p_description text,
  p_entries jsonb,
  p_external_reference text default null,
  p_metadata jsonb default '{}'::jsonb
) returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_transaction_id uuid;
  v_debits numeric := 0;
  v_credits numeric := 0;
  v_entry jsonb;
  v_account uuid;
begin
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'idempotency_key_required';
  end if;
  if jsonb_typeof(p_entries) <> 'array' or jsonb_array_length(p_entries) < 2 then
    raise exception 'at_least_two_entries_required';
  end if;

  select transaction_id into v_transaction_id
  from public.omega_ledger_transactions
  where idempotency_key = p_idempotency_key;

  if v_transaction_id is not null then
    return v_transaction_id;
  end if;

  for v_entry in select value from jsonb_array_elements(p_entries)
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
      where account_id=v_account and status='ACTIVE' and currency_code=p_currency_code
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

  for v_entry in select value from jsonb_array_elements(p_entries)
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
$$;

revoke all on function omega_private.post_ledger_transaction(text,text,text,text,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function omega_private.post_ledger_transaction(text,text,text,text,jsonb,text,jsonb) to service_role;

alter table public.omega_ledger_accounts enable row level security;
alter table public.omega_ledger_transactions enable row level security;
alter table public.omega_ledger_entries enable row level security;
alter table public.omega_payment_events enable row level security;
alter table public.omega_entitlements enable row level security;

create policy omega_ledger_accounts_owner_read on public.omega_ledger_accounts
for select to authenticated using (owner_user_id = (select auth.uid()));

create policy omega_ledger_transactions_owner_read on public.omega_ledger_transactions
for select to authenticated using (exists (
  select 1 from public.omega_ledger_entries e
  join public.omega_ledger_accounts a on a.account_id=e.account_id
  where e.transaction_id=omega_ledger_transactions.transaction_id
    and a.owner_user_id=(select auth.uid())
));

create policy omega_ledger_entries_owner_read on public.omega_ledger_entries
for select to authenticated using (exists (
  select 1 from public.omega_ledger_accounts a
  where a.account_id=omega_ledger_entries.account_id
    and a.owner_user_id=(select auth.uid())
));

create policy omega_entitlements_owner_read on public.omega_entitlements
for select to authenticated using (user_id=(select auth.uid()));

create policy omega_payment_events_owner_none on public.omega_payment_events
for select to authenticated using (false);

revoke all on public.omega_ledger_accounts, public.omega_ledger_transactions,
  public.omega_ledger_entries, public.omega_payment_events, public.omega_entitlements
  from anon;
grant select on public.omega_ledger_accounts, public.omega_ledger_transactions,
  public.omega_ledger_entries, public.omega_entitlements to authenticated;
grant all on public.omega_ledger_accounts, public.omega_ledger_transactions,
  public.omega_ledger_entries, public.omega_payment_events, public.omega_entitlements
  to service_role;
