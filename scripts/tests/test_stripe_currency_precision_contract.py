"""Regression contract for Stripe currency-minor-unit conversion.

The migration is source-tested here and runtime-validated by the repository's
isolated full-migration replay. No synthetic transaction is run against live
payment data.
"""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261024091500_fix_stripe_zero_decimal_settlement_precision.sql"
SOURCE = MIGRATION.read_text(encoding="utf-8")

ZERO_DECIMAL = {
    "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
    "PYG", "RWF", "VND", "VUV", "XAF", "XOF", "XPF",
}


class StripeCurrencyPrecisionContract(unittest.TestCase):
    def test_migration_replaces_the_canonical_private_settlement_rpc(self):
        self.assertRegex(
            SOURCE,
            r"CREATE OR REPLACE FUNCTION omega_private\.record_stripe_payment\(",
        )
        self.assertIn("SET search_path TO ''", SOURCE)
        self.assertIn(
            "revoke all on function omega_private.record_stripe_payment",
            SOURCE.lower(),
        )
        self.assertIn(
            "grant execute on function omega_private.record_stripe_payment",
            SOURCE.lower(),
        )

    def test_stripe_zero_decimal_currency_set_is_explicit_and_complete(self):
        match = re.search(
            r"when v_currency in \((.*?)\) then p_amount_minor::numeric",
            SOURCE,
            re.IGNORECASE | re.DOTALL,
        )
        self.assertIsNotNone(match, "zero-decimal currency conversion must be explicit")
        actual = set(re.findall(r"'([A-Z]{3})'", match.group(1)))
        self.assertEqual(actual, ZERO_DECIMAL)

    def test_zero_decimal_amounts_are_not_divided_by_one_hundred(self):
        self.assertRegex(
            SOURCE,
            r"v_amount := case[\s\S]*?then p_amount_minor::numeric[\s\S]*?else p_amount_minor::numeric / 100",
        )
        match = re.search(
            r"when v_currency in \((.*?)\) then p_amount_minor::numeric",
            SOURCE,
            re.IGNORECASE | re.DOTALL,
        )
        zero_decimal = set(re.findall(r"'([A-Z]{3})'", match.group(1)))

        def convert(amount_minor: int, currency: str) -> float:
            return float(amount_minor if currency in zero_decimal else amount_minor / 100)

        self.assertEqual(convert(500, "JPY"), 500.0)
        self.assertEqual(convert(500, "USD"), 5.0)
        # Stripe's currency docs retain a two-decimal API representation for
        # ISK and UGX despite their whole-unit charging restrictions.
        self.assertEqual(convert(500, "ISK"), 5.0)
        self.assertEqual(convert(500, "UGX"), 5.0)

    def test_migration_does_not_rewrite_existing_history_or_enable_payments(self):
        # INSERT statements inside the stored RPC are expected at runtime.
        # The migration itself performs no UPDATE/DELETE of historical rows.
        self.assertNotRegex(SOURCE, r"\bUPDATE\s+public\.(?:omega_ledger_|omega_payment_)")
        self.assertNotRegex(SOURCE, r"\bDELETE\s+FROM\s+public\.(?:omega_ledger_|omega_payment_)")
        self.assertNotRegex(SOURCE, r"payments_enabled\s*=\s*true")
        self.assertIn("No data is rewritten by this migration", SOURCE)


if __name__ == "__main__":
    unittest.main()
