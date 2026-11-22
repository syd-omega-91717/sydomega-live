-- SYD OMEGA 91717 — Financial truth boundary and scenario lab.
-- Adds private, user-owned planning scenarios and immutable formula-versioned
-- simulation runs. Adds an owner/AAL2 read-only aggregate of Stripe settlement
-- ledger records. Does not activate payments, tokens, KYC or checkout.
begin;

create table public.omega_financial_scenarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  starting_members integer not null default 0 check (starting_members between 0 and 10000000),
  new_members_per_month integer not null default 0 check (new_members_per_month between 0 and 10000000),
  churn_pct numeric(7,4) not null default 0 check (churn_pct between 0 and 100),
  monthly_price numeric(18,4) not null default 0 check (monthly_price >= 0),
  refund_pct numeric(7,4) not null default 0 check (refund_pct between 0 and 100),
  tax_pct numeric(7,4) not null default 0 check (tax_pct between 0 and 100),
  processing_fee_pct numeric(7,4) not null default 0 check (processing_fee_pct between 0 and 100),
  processing_fixed_fee numeric(18,4) not null default 0 check (processing_fixed_fee >= 0),
  operating_cost_monthly numeric(18,4) not null default 0 check (operating_cost_monthly >= 0),
  horizon_months smallint not null default 12 check (horizon_months between 1 and 60),
  version integer not null default 1 check (version >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index omega_financial_scenarios_user_updated_idx
  on public.omega_financial_scenarios(user_id, updated_at desc);

alter table public.omega_financial_scenarios enable row level security;
revoke all on public.omega_financial_scenarios from public, anon;
grant select, insert, update, delete on public.omega_financial_scenarios to authenticated;

create policy omega_financial_scenarios_select_own
  on public.omega_financial_scenarios for select to authenticated
  using (user_id = (select auth.uid()));

create policy omega_financial_scenarios_insert_own
  on public.omega_financial_scenarios for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy omega_financial_scenarios_update_own
  on public.omega_financial_scenarios for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy omega_financial_scenarios_delete_own
  on public.omega_financial_scenarios for delete to authenticated
  using (user_id = (select auth.uid()));

create table public.omega_financial_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid references public.omega_financial_scenarios(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  scenario_name text not null,
  scenario_version integer not null check (scenario_version >= 1),
  formula_version text not null check (formula_version = '1.0.0'),
  currency_code text not null check (currency_code ~ '^[A-Z]{3}$'),
  assumptions jsonb not null,
  results jsonb not null,
  total_gross_billings numeric(28,8) not null,
  total_refunds numeric(28,8) not null,
  total_tax_estimate numeric(28,8) not null,
  total_processing_fee_estimate numeric(28,8) not null,
  total_operating_costs numeric(28,8) not null,
  total_net_operating_cash_estimate numeric(28,8) not null,
  created_at timestamptz not null default now()
);

create index omega_financial_simulation_runs_user_created_idx
  on public.omega_financial_simulation_runs(user_id, created_at desc);

alter table public.omega_financial_simulation_runs enable row level security;
revoke all on public.omega_financial_simulation_runs from public, anon, authenticated;
grant select on public.omega_financial_simulation_runs to authenticated;

create policy omega_financial_simulation_runs_select_own
  on public.omega_financial_simulation_runs for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.omega_financial_scenarios_touch_updated_at()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  new.updated_at := pg_catalog.now();
  new.version := old.version + 1;
  return new;
end;
$function$;

revoke all on function public.omega_financial_scenarios_touch_updated_at() from public, anon, authenticated;

drop trigger if exists omega_financial_scenarios_touch_updated_at
  on public.omega_financial_scenarios;

create trigger omega_financial_scenarios_touch_updated_at
before update on public.omega_financial_scenarios
for each row execute function public.omega_financial_scenarios_touch_updated_at();

create or replace function public.omega_run_financial_scenario(p_scenario_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_s public.omega_financial_scenarios%rowtype;
  v_members integer;
  v_churned integer;
  v_period integer;
  v_gross numeric(28,8);
  v_refunds numeric(28,8);
  v_tax numeric(28,8);
  v_processing numeric(28,8);
  v_costs numeric(28,8);
  v_net numeric(28,8);
  v_total_gross numeric(28,8) := 0;
  v_total_refunds numeric(28,8) := 0;
  v_total_tax numeric(28,8) := 0;
  v_total_processing numeric(28,8) := 0;
  v_total_costs numeric(28,8) := 0;
  v_total_net numeric(28,8) := 0;
  v_months jsonb := '[]'::jsonb;
  v_assumptions jsonb;
  v_result jsonb;
  v_run_id uuid;
begin
  if v_user_id is null then
    raise exception 'authentication_required' using errcode = '28000';
  end if;

  select *
    into v_s
    from public.omega_financial_scenarios
   where id = p_scenario_id
     and user_id = v_user_id;

  if not found then
    raise exception 'scenario_not_found' using errcode = 'P0002';
  end if;

  v_assumptions := pg_catalog.jsonb_build_object(
    'starting_members', v_s.starting_members,
    'new_members_per_month', v_s.new_members_per_month,
    'churn_pct', v_s.churn_pct,
    'monthly_price', v_s.monthly_price,
    'refund_pct', v_s.refund_pct,
    'tax_pct', v_s.tax_pct,
    'processing_fee_pct', v_s.processing_fee_pct,
    'processing_fixed_fee', v_s.processing_fixed_fee,
    'operating_cost_monthly', v_s.operating_cost_monthly,
    'horizon_months', v_s.horizon_months,
    'currency_code', v_s.currency_code
  );

  v_members := v_s.starting_members;

  for v_period in 1..v_s.horizon_months loop
    v_churned := least(
      v_members,
      pg_catalog.round(v_members::numeric * v_s.churn_pct / 100)::integer
    );
    v_members := greatest(0, v_members - v_churned + v_s.new_members_per_month);

    v_gross := v_members::numeric * v_s.monthly_price;
    v_refunds := v_gross * v_s.refund_pct / 100;
    v_tax := greatest(0, v_gross - v_refunds) * v_s.tax_pct / 100;
    v_processing := v_gross * v_s.processing_fee_pct / 100
      + v_members::numeric * v_s.processing_fixed_fee;
    v_costs := v_s.operating_cost_monthly;
    v_net := v_gross - v_refunds - v_tax - v_processing - v_costs;

    v_total_gross := v_total_gross + v_gross;
    v_total_refunds := v_total_refunds + v_refunds;
    v_total_tax := v_total_tax + v_tax;
    v_total_processing := v_total_processing + v_processing;
    v_total_costs := v_total_costs + v_costs;
    v_total_net := v_total_net + v_net;

    v_months := v_months || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'period', v_period,
        'paying_members', v_members,
        'churned_members', v_churned,
        'new_members', v_s.new_members_per_month,
        'gross_billings', v_gross,
        'refund_estimate', v_refunds,
        'tax_estimate', v_tax,
        'processing_fee_estimate', v_processing,
        'operating_costs', v_costs,
        'net_operating_cash_estimate', v_net
      )
    );
  end loop;

  v_result := pg_catalog.jsonb_build_object(
    'formula_version', '1.0.0',
    'scenario_id', v_s.id,
    'scenario_name', v_s.name,
    'scenario_version', v_s.version,
    'currency_code', v_s.currency_code,
    'as_of', pg_catalog.now(),
    'classification', 'SIMULATED',
    'assumptions', v_assumptions,
    'months', v_months,
    'totals', pg_catalog.jsonb_build_object(
      'gross_billings', v_total_gross,
      'refund_estimate', v_total_refunds,
      'tax_estimate', v_total_tax,
      'processing_fee_estimate', v_total_processing,
      'operating_costs', v_total_costs,
      'net_operating_cash_estimate', v_total_net
    )
  );

  insert into public.omega_financial_simulation_runs (
    scenario_id, user_id, scenario_name, scenario_version, formula_version,
    currency_code, assumptions, results, total_gross_billings, total_refunds,
    total_tax_estimate, total_processing_fee_estimate, total_operating_costs,
    total_net_operating_cash_estimate
  ) values (
    v_s.id, v_user_id, v_s.name, v_s.version, '1.0.0',
    v_s.currency_code, v_assumptions, v_result, v_total_gross, v_total_refunds,
    v_total_tax, v_total_processing, v_total_costs, v_total_net
  )
  returning id into v_run_id;

  return v_result || pg_catalog.jsonb_build_object(
    'run_id', v_run_id,
    'created_at', pg_catalog.now()
  );
end;
$function$;

revoke all on function public.omega_run_financial_scenario(uuid) from public, anon;
grant execute on function public.omega_run_financial_scenario(uuid) to authenticated;

create or replace function public.omega_owner_finance_summary()
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_currencies jsonb;
  v_reconciliation jsonb;
  v_payments_enabled boolean;
  v_stripe_enabled boolean;
  v_tokens_enabled boolean;
  v_kyc_enabled boolean;
  v_settlement_count bigint;
  v_refund_count bigint;
  v_processed_events bigint;
  v_failed_events bigint;
  v_unmatched bigint;
begin
  if not public.is_platform_owner() then
    raise exception 'owner_only' using errcode = '42501';
  end if;
  if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
    raise exception 'aal2_required' using errcode = '42501';
  end if;

  select coalesce(
    pg_catalog.jsonb_agg(
      pg_catalog.jsonb_build_object(
        'currency_code', q.currency_code,
        'gross_settled', q.gross_settled,
        'refunds', q.refunds,
        'net_after_refunds', q.gross_settled - q.refunds,
        'settlement_count', q.settlement_count,
        'refund_count', q.refund_count
      ) order by q.currency_code
    ),
    '[]'::jsonb
  )
  into v_currencies
  from (
    select
      a.currency_code,
      coalesce(sum(e.amount) filter (
        where t.event_type = 'STRIPE_SETTLEMENT' and e.direction = 'CREDIT'
      ), 0) as gross_settled,
      coalesce(sum(e.amount) filter (
        where t.event_type = 'STRIPE_REFUND_REVERSAL' and e.direction = 'DEBIT'
      ), 0) as refunds,
      count(distinct t.transaction_id) filter (
        where t.event_type = 'STRIPE_SETTLEMENT'
      ) as settlement_count,
      count(distinct t.transaction_id) filter (
        where t.event_type = 'STRIPE_REFUND_REVERSAL'
      ) as refund_count
    from public.omega_ledger_accounts a
    join public.omega_ledger_entries e
      on e.account_id = a.account_id
     and e.currency_code = a.currency_code
    join public.omega_ledger_transactions t
      on t.transaction_id = e.transaction_id
    where a.owner_user_id is null
      and a.account_type = 'REVENUE'
      and t.status in ('POSTED', 'REVERSED')
    group by a.currency_code
  ) q;

  select coalesce(
    pg_catalog.jsonb_object_agg(s.status, s.record_count),
    '{}'::jsonb
  )
  into v_reconciliation
  from (
    select status, count(*) as record_count
      from public.omega_payment_reconciliation
     where provider = 'stripe'
     group by status
  ) s;

  select coalesce(bool_value, false) into v_payments_enabled
    from public.platform_settings where key = 'payments_enabled';
  select coalesce(bool_value, false) into v_stripe_enabled
    from public.platform_settings where key = 'stripe_integration_enabled';
  select coalesce(bool_value, false) into v_tokens_enabled
    from public.platform_settings where key = 'tokens_enabled';
  select coalesce(bool_value, false) into v_kyc_enabled
    from public.platform_settings where key = 'kyc_intake_enabled';

  select count(*) into v_settlement_count
    from public.omega_ledger_transactions
   where event_type = 'STRIPE_SETTLEMENT'
     and status in ('POSTED', 'REVERSED');
  select count(*) into v_refund_count
    from public.omega_ledger_transactions
   where event_type = 'STRIPE_REFUND_REVERSAL'
     and status in ('POSTED', 'REVERSED');
  select count(*) into v_processed_events
    from public.omega_payment_events
   where provider = 'stripe' and status = 'PROCESSED';
  select count(*) into v_failed_events
    from public.omega_payment_events
   where provider = 'stripe' and status = 'FAILED';
  select count(*) into v_unmatched
    from public.omega_payment_reconciliation
   where provider = 'stripe' and status in ('pending', 'mismatch', 'failed');

  return pg_catalog.jsonb_build_object(
    'as_of', pg_catalog.now(),
    'classification', 'LIVE_LEDGER',
    'data_scope', 'STRIPE_PROVIDER_SETTLEMENTS',
    'processing', pg_catalog.jsonb_build_object(
      'payments_enabled', coalesce(v_payments_enabled, false),
      'stripe_integration_enabled', coalesce(v_stripe_enabled, false),
      'tokens_enabled', coalesce(v_tokens_enabled, false),
      'kyc_intake_enabled', coalesce(v_kyc_enabled, false)
    ),
    'ledger', pg_catalog.jsonb_build_object(
      'currencies', v_currencies,
      'settlement_transactions', v_settlement_count,
      'refund_transactions', v_refund_count,
      'processed_payment_events', v_processed_events,
      'failed_payment_events', v_failed_events,
      'unmatched_reconciliations', v_unmatched,
      'reconciliation_statuses', v_reconciliation
    ),
    'limitations', pg_catalog.jsonb_build_array(
      'Gross provider-settled receipts are not recognized accounting revenue.',
      'Tax, processor fees, disputes, foreign exchange, reserves, payout timing and accrual adjustments are not netted.'
    )
  );
end;
$function$;

revoke all on function public.omega_owner_finance_summary() from public, anon;
grant execute on function public.omega_owner_finance_summary() to authenticated;

comment on table public.omega_financial_scenarios is
  'User-owned hypothetical finance assumptions. Never represents actual revenue, assets, balances or payments.';
comment on table public.omega_financial_simulation_runs is
  'Immutable, formula-versioned snapshots of user-requested financial scenarios; all outputs are SIMULATED.';
comment on function public.omega_run_financial_scenario(uuid) is
  'Runs and persists a formula-versioned hypothetical cash-flow scenario for the authenticated owner of the scenario.';
comment on function public.omega_owner_finance_summary() is
  'Owner-only AAL2 read-only aggregate of Stripe settlement ledger records. Returns gross settlements and refund reversals by currency; not recognized revenue.';

commit;