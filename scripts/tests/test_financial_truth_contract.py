"""Regression contract for the Finance Command truth boundary and scenario lab."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "income.html").read_text(encoding="utf-8")
MIGRATION = (ROOT / "supabase/migrations/20261122100837_financial_truth_and_scenario_lab.sql").read_text(encoding="utf-8")
BOUNDS = (ROOT / "supabase/migrations/20261122100946_financial_scenario_numeric_bounds.sql").read_text(encoding="utf-8")
WRAPPERS = (ROOT / "supabase/migrations/20261122101614_finance_rpc_private_wrappers_and_index.sql").read_text(encoding="utf-8")


class FinancialTruthContract(unittest.TestCase):
    def test_actuals_are_owner_aal2_live_ledger_not_member_estimates(self):
        self.assertIn("omega_owner_finance_summary", PAGE)
        self.assertIn("LIVE LEDGER", PAGE)
        self.assertIn("AAL2", PAGE)
        self.assertIn("STRIPE_PROVIDER_SETTLEMENTS", MIGRATION)
        self.assertIn("public.is_platform_owner()", MIGRATION)
        self.assertIn("auth.jwt()->>'aal'", MIGRATION)
        self.assertIn("'aal2'", MIGRATION)
        self.assertNotIn("members*9.17", PAGE.replace(" ", ""))
        self.assertNotIn("EST. MONTHLY INCOME", PAGE)
        self.assertNotIn("data=[2,4,7,11,16,22,29,37,46,56,67,80]", PAGE.replace(" ", ""))

    def test_actual_and_simulated_data_paths_are_separate(self):
        self.assertIn("LIVE_LEDGER", MIGRATION)
        self.assertIn("SIMULATED", MIGRATION)
        self.assertIn("omega_run_financial_scenario", PAGE)
        self.assertEqual(PAGE.count('data-omega-capability-id="finance-command"'), 9)
        self.assertIn("UNAVAILABLE", PAGE)
        self.assertIn('role="tablist"', PAGE)
        self.assertEqual(PAGE.count('role="tabpanel"'), 4)
        self.assertIn("omega_financial_simulation_runs", PAGE)
        self.assertNotIn("localStorage", PAGE)
        self.assertIn("gross_settled", PAGE)
        self.assertIn("not recognized accounting revenue", PAGE.lower())
        self.assertIn("platform_settings.creator_earnings_enabled=false", PAGE)
        self.assertIn("this page does not initiate any funds transfer", PAGE)

    def test_scenario_rows_are_user_scoped_and_runs_are_immutable_to_clients(self):
        self.assertIn("enable row level security", MIGRATION.lower())
        self.assertIn("omega_financial_scenarios_select_own", MIGRATION)
        self.assertIn("omega_financial_scenarios_insert_own", MIGRATION)
        self.assertIn("omega_financial_scenarios_update_own", MIGRATION)
        self.assertIn("omega_financial_scenarios_delete_own", MIGRATION)
        self.assertIn("omega_financial_simulation_runs_select_own", MIGRATION)
        self.assertRegex(
            MIGRATION.lower(),
            r"revoke all on public\.omega_financial_simulation_runs from public, anon, authenticated",
        )
        self.assertRegex(
            MIGRATION.lower(),
            r"grant select on public\.omega_financial_simulation_runs to authenticated",
        )
        self.assertIn("scenario_version", MIGRATION)
        self.assertIn("formula_version", MIGRATION)
        self.assertIn("v_churned := least(", MIGRATION)
        self.assertIn("v_gross := v_members::numeric * v_s.monthly_price", MIGRATION)
        self.assertIn("v_refunds := v_gross * v_s.refund_pct / 100", MIGRATION)
        self.assertIn("v_tax := greatest(0, v_gross - v_refunds)", MIGRATION)
        self.assertIn("v_processing := v_gross * v_s.processing_fee_pct / 100", MIGRATION)
        self.assertIn("v_net := v_gross - v_refunds - v_tax - v_processing - v_costs", MIGRATION)

    def test_privileged_functions_are_search_path_hardened_and_granted_narrowly(self):
        self.assertGreaterEqual(MIGRATION.lower().count("set search_path to ''"), 2)
        self.assertIn("revoke all on function public.omega_owner_finance_summary() from public, anon", MIGRATION.lower())
        self.assertIn("grant execute on function public.omega_owner_finance_summary() to authenticated", MIGRATION.lower())
        self.assertIn("revoke all on function public.omega_run_financial_scenario(uuid) from public, anon", MIGRATION.lower())
        self.assertIn("grant execute on function public.omega_run_financial_scenario(uuid) to authenticated", MIGRATION.lower())
        self.assertNotRegex(MIGRATION.lower(), r"payments_enabled\s*=\s*true")

    def test_scenario_inputs_are_bounded_to_prevent_numeric_overflow(self):
        self.assertIn("monthly_price_bound", BOUNDS)
        self.assertIn("processing_fixed_fee_bound", BOUNDS)
        self.assertIn("operating_cost_bound", BOUNDS)
        self.assertIn("1000000000", BOUNDS)
        self.assertIn("1000000", BOUNDS)
        self.assertIn("1000000000000", BOUNDS)

    def test_finance_page_does_not_claim_a_live_paid_catalog_or_allocation(self):
        self.assertIn("NO ACTIVE BILLING CATALOG", PAGE)
        self.assertIn("No automatic allocation", PAGE)
        self.assertNotIn("9.17%", PAGE)
        self.assertNotIn("25%", PAGE)
        self.assertNotIn("$9.17", PAGE)

    def test_public_finance_rpcs_are_invoker_wrappers_and_private_impls_are_hardened(self):
        source = WRAPPERS.lower()
        self.assertIn("create or replace function private.omega_owner_finance_summary()", source)
        self.assertIn("create or replace function private.omega_run_financial_scenario(p_scenario_id uuid)", source)
        self.assertIn("security definer", source)
        self.assertGreaterEqual(source.count("set search_path to ''"), 2)
        owner_public = source.split("create or replace function public.omega_owner_finance_summary()", 1)[1].split("create or replace function public.omega_run_financial_scenario", 1)[0]
        run_public = source.split("create or replace function public.omega_run_financial_scenario", 1)[1].split("revoke all on function public.omega_owner_finance_summary", 1)[0]
        self.assertIn("security invoker", owner_public)
        self.assertNotIn("security definer", owner_public)
        self.assertIn("security invoker", run_public)
        self.assertNotIn("security definer", run_public)
        self.assertIn("omega_financial_simulation_runs_scenario_id_idx", source)


if __name__ == "__main__":
    unittest.main()
