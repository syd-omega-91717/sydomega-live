-- Bound financial scenario inputs so all horizon totals fit numeric(28,8).
-- This is a schema-only constraint migration; no existing records are rewritten.
begin;
alter table public.omega_financial_scenarios
  add constraint omega_financial_scenarios_monthly_price_bound
    check (monthly_price <= 1000000000),
  add constraint omega_financial_scenarios_processing_fixed_fee_bound
    check (processing_fixed_fee <= 1000000),
  add constraint omega_financial_scenarios_operating_cost_bound
    check (operating_cost_monthly <= 1000000000000);
comment on constraint omega_financial_scenarios_monthly_price_bound
  on public.omega_financial_scenarios is
  'Bounds scenario input so monthly projection totals remain within numeric(28,8) storage.';
comment on constraint omega_financial_scenarios_processing_fixed_fee_bound
  on public.omega_financial_scenarios is
  'Bounds scenario fee input so monthly projection totals remain within numeric(28,8) storage.';
comment on constraint omega_financial_scenarios_operating_cost_bound
  on public.omega_financial_scenarios is
  'Bounds scenario operating cost input so horizon totals remain within numeric(28,8) storage.';
commit;