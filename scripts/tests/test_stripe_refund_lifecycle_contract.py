"""Static contract for cumulative, idempotent Stripe refund accounting."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261024110000_stripe_refund_ledger_reversal.sql"
SETTLEMENT_MIGRATION = ROOT / "supabase/migrations/20261024091500_fix_stripe_zero_decimal_settlement_precision.sql"
WEBHOOK = ROOT / "supabase/functions/stripe-webhook/index.ts"
PENDING = ROOT / "supabase/pending-migrations.json"
REMOTE = ROOT / "supabase/remote-migrations.json"
SOURCE = MIGRATION.read_text(encoding="utf-8")
LOWER = SOURCE.lower()
WEBHOOK_SOURCE = WEBHOOK.read_text(encoding="utf-8")
ZERO_DECIMAL = {
    "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA",
    "PYG", "RWF", "VND", "VUV", "XAF", "XOF", "XPF",
}


class StripeRefundLifecycleContract(unittest.TestCase):
    def test_refund_state_is_private_and_not_directly_granted_to_clients(self):
        self.assertIn("create table if not exists omega_private.stripe_refund_state", LOWER)
        self.assertIn("primary key", LOWER.split("create table if not exists omega_private.stripe_refund_state", 1)[1].split(");", 1)[0])
        self.assertIn("revoke all on table omega_private.stripe_refund_state from public, anon, authenticated, service_role", LOWER)
        self.assertIn("amount_refunded <= charge_amount", LOWER)

    def test_rpc_is_security_definer_with_empty_search_path_and_service_role_only(self):
        self.assertRegex(
            LOWER,
            r"create or replace function omega_private\.record_stripe_refund\([\s\S]*?security definer\s+set search_path to ''",
        )
        self.assertRegex(
            LOWER,
            r"create or replace function public\.record_stripe_refund\([\s\S]*?security definer\s+set search_path to ''",
        )
        self.assertRegex(
            LOWER,
            r"revoke all on function public\.record_stripe_refund\([\s\S]*?from public, anon, authenticated",
        )
        self.assertRegex(
            LOWER,
            r"grant execute on function public\.record_stripe_refund\([\s\S]*?to service_role",
        )

    def test_cumulative_refund_is_monotonic_and_capped_at_original_settlement(self):
        self.assertIn("for update of t", LOWER)
        self.assertIn("r.status in ('matched', 'reversed')", LOWER)
        self.assertRegex(LOWER, r"from omega_private\.stripe_refund_state[\s\S]*?for update")
        self.assertIn("v_new_refunded < v_state.amount_refunded", LOWER)
        self.assertIn("v_new_refunded = v_state.amount_refunded", LOWER)
        self.assertIn("v_total_after > v_original_amount", LOWER)
        self.assertIn("stripe_refund_exceeds_original_settlement", LOWER)
        self.assertIn("stripe-refund:' || p_charge_id || ':' || p_amount_refunded_minor::text", LOWER)

    def test_refund_posts_balanced_reversal_entries_and_finalizes_full_refund(self):
        self.assertIn("omega_private.post_ledger_transaction(", LOWER)
        self.assertIn("'stripe_refund_reversal'", LOWER)
        self.assertIn("'account_id', v_credit_account, 'direction', 'debit'", LOWER)
        self.assertIn("'account_id', v_debit_account, 'direction', 'credit'", LOWER)
        self.assertIn("if v_total_after = v_original_amount then", LOWER)
        self.assertIn("set status = 'reversed'", LOWER)
        self.assertIn("stripe-refund-reconciliation:", LOWER)

    def test_refund_currency_conversion_matches_settlement_conversion(self):
        def currencies(text: str) -> set[str]:
            match = re.search(
                r"when v_currency in \((.*?)\) then p_amount_minor::numeric",
                text,
                re.IGNORECASE | re.DOTALL,
            )
            self.assertIsNotNone(match, "explicit zero-decimal currency list is required")
            return set(re.findall(r"'([A-Z]{3})'", match.group(1)))

        self.assertEqual(currencies(SOURCE), ZERO_DECIMAL)
        self.assertEqual(currencies(SETTLEMENT_MIGRATION.read_text(encoding="utf-8")), ZERO_DECIMAL)

    def test_webhook_uses_cumulative_charge_refunded_event_only(self):
        self.assertIn('if (eventType === "charge.refunded")', WEBHOOK_SOURCE)
        self.assertIn('admin.rpc("record_stripe_refund"', WEBHOOK_SOURCE)
        self.assertIn("Number.isSafeInteger(amountRefundedMinor)", WEBHOOK_SOURCE)
        self.assertIn("amountRefundedMinor > amountMinor", WEBHOOK_SOURCE)
        self.assertNotIn('if (eventType === "refund.created")', WEBHOOK_SOURCE)
        self.assertIn('return json({ error: "refund_processing_failed" }, 500);', WEBHOOK_SOURCE)

    def test_new_migration_is_pending_and_release_blocking_not_in_remote_history(self):
        pending = json.loads(PENDING.read_text(encoding="utf-8"))["pending"]
        remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        entry = next((item for item in pending if item["version"] == "20261024110000"), None)
        self.assertIsNotNone(entry)
        self.assertEqual(entry["file"], MIGRATION.name)
        self.assertEqual(entry["liveStatus"], "NOT_APPLIED")
        self.assertTrue(entry["blocksProduction"])
        self.assertNotIn("20261024110000", {str(version) for version in remote["versions"]})
        self.assertEqual(remote["remoteMigrationCount"], len(remote["versions"]))
        self.assertEqual({str(v) for v in remote["versions"]}, {str(m["version"]) for m in remote["migrations"]})


if __name__ == "__main__":
    unittest.main()
