-- Move privileged finance implementations out of the exposed public API schema.
-- Public RPCs remain SECURITY INVOKER wrappers; the private implementations
-- enforce owner/AAL2 or per-user ownership and retain an empty search_path.
-- Add the foreign-key index identified by the live Performance Advisor.
begin;

CREATE OR REPLACE FUNCTION private.omega_owner_finance_summary()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION private.omega_run_financial_scenario(p_scenario_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
$function$
;

revoke all on function private.omega_owner_finance_summary() from public, anon;
grant execute on function private.omega_owner_finance_summary() to authenticated;
revoke all on function private.omega_run_financial_scenario(uuid) from public, anon;
grant execute on function private.omega_run_financial_scenario(uuid) to authenticated;

create or replace function public.omega_owner_finance_summary()
returns jsonb
language sql
security invoker
set search_path to ''
as $function$
  select private.omega_owner_finance_summary();
$function$;

create or replace function public.omega_run_financial_scenario(p_scenario_id uuid)
returns jsonb
language sql
security invoker
set search_path to ''
as $function$
  select private.omega_run_financial_scenario(p_scenario_id);
$function$;

revoke all on function public.omega_owner_finance_summary() from public, anon;
grant execute on function public.omega_owner_finance_summary() to authenticated;
revoke all on function public.omega_run_financial_scenario(uuid) from public, anon;
grant execute on function public.omega_run_financial_scenario(uuid) to authenticated;

create index if not exists omega_financial_simulation_runs_scenario_id_idx
  on public.omega_financial_simulation_runs(scenario_id);

comment on function private.omega_owner_finance_summary() is
  'Non-exposed owner-only AAL2 aggregate of Stripe settlement ledger records.';
comment on function private.omega_run_financial_scenario(uuid) is
  'Non-exposed privileged implementation; validates auth.uid ownership and records immutable simulated run evidence.';
comment on function public.omega_owner_finance_summary() is
  'SECURITY INVOKER API wrapper for the non-exposed owner/AAL2 settlement aggregate.';
comment on function public.omega_run_financial_scenario(uuid) is
  'SECURITY INVOKER API wrapper for the non-exposed per-user scenario execution function.';

commit;
