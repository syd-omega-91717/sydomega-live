#!/usr/bin/env python3
"""
Regression tests for scripts/commerce-contract.py -- the gate that refuses to
ship a money claim the platform cannot honour.

The defect this gate exists for is recorded in its own docstring: ad-network.html
reached main rendering "TOTAL REVENUE $0.10 / CREATOR SHARE $0.07" above the
sentence "Creators earn 70% revenue share", for money that did not exist. The
dollar figures came from omega-ad-network.js incrementing a literal on every
render of a hard-coded specimen advertisement.

Like the other gates here, commerce-contract.py resolves its own ROOT from
__file__, so it cannot be imported and pointed at a fixture. These tests build
throwaway repos on disk, copy the real script into <fixture>/scripts/, and run
it as a subprocess exactly as CI does -- black box, but exercising the actual
gate rather than a stand-in.

The cases that matter are in three groups:

  MUST CATCH   the two real shapes, reproduced from the actual defect.
  MUST NOT     the false positives that a first pass really did produce and
               that were measured, not imagined: "decommission", "earn points",
               a <label> over a member's own input, and a code comment quoting
               the offending text.
  MUST CLEAR   naming a gate is what clears a file, so each of the three
               accepted gate references is tested separately.

A gate that cannot fail is not a gate, so every detector is tested against a
fixture that should trip it -- not only against a clean repo.

Run: python3 -m unittest scripts/tests/test_commerce_contract.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "commerce-contract.py")


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class Fixture:
    """A throwaway repo that is clean unless a test deliberately breaks it."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="commerce-fixture-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SRC, os.path.join(self.dir, "scripts", "commerce-contract.py"))
        # Baseline: an ordinary page that mentions no money at all.
        write(self.path("plain.html"),
              "<!DOCTYPE html><html><body><h1>HABITS</h1></body></html>")

    def path(self, *parts):
        return os.path.join(self.dir, *parts)

    def run(self, *args):
        return subprocess.run(
            [sys.executable, os.path.join(self.dir, "scripts", "commerce-contract.py")]
            + list(args),
            capture_output=True, text=True)

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class CommerceContractTest(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    # ---------------------------------------------------------------- clean

    def test_clean_repo_passes(self):
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("OK", r.stdout)

    def test_help_prints_docstring_and_exits_zero(self):
        r = self.fx.run("--help")
        self.assertEqual(r.returncode, 0)
        self.assertIn("money claim", r.stdout)
        # --help must not run the job (CLAUDE.md 8.4: five scripts used to).
        self.assertNotIn("scanned", r.stdout)

    # ----------------------------------------------------------- must catch

    def test_catches_the_original_revenue_share_claim(self):
        write(self.fx.path("ads.html"),
              "<html><body>Creators earn 70% revenue share.</body></html>")
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("UNGATED EARNINGS CLAIM", r.stdout)
        self.assertIn("ads.html", r.stdout)

    def test_catches_the_original_synthesised_currency(self):
        # Reproduced from the real omega-ad-network.js recordImpression().
        write(self.fx.path("ads.js"),
              "var REVENUE={total:0,creator_share:0};\n"
              "function rec(){\n"
              "REVENUE.total += 0.05;\n"
              "REVENUE.creator_share += 0.035;\n"
              "}\n"
              "el.innerHTML='<b>$'+REVENUE.total.toFixed(2)+'</b>';\n")
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("SYNTHESISED CURRENCY", r.stdout)
        # Both accumulations reported, at their real line numbers.
        self.assertIn("ads.js:3", r.stdout)
        self.assertIn("ads.js:4", r.stdout)

    def test_catches_payout_language(self):
        write(self.fx.path("p.html"), "<html><body>Weekly payouts to members.</body></html>")
        self.assertEqual(self.fx.run().returncode, 1)

    def test_one_finding_per_file_not_one_per_phrase(self):
        """A minified page matching several phrases is one defect, not four."""
        write(self.fx.path("m.html"),
              "<html><body>Creators earn 70% revenue share. Payouts monthly. "
              "You will earn $5.</body></html>")
        r = self.fx.run()
        self.assertEqual(r.returncode, 1)
        self.assertEqual(r.stdout.count("UNGATED EARNINGS CLAIM"), 1, r.stdout)
        self.assertIn("1 finding(s)", r.stdout)

    # -------------------------------------------------------- must NOT trip
    # Every case below is a false positive a first pass actually produced.

    def test_decommission_is_not_a_commission(self):
        write(self.fx.path("d.js"), "function decommission(node){ return node; }\n")
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_earning_points_is_not_earning_money(self):
        write(self.fx.path("pts.html"),
              "<html><body>Your score updates as you earn points across three axes."
              "</body></html>")
        self.assertEqual(self.fx.run().returncode, 0)

    def test_share_of_effort_is_not_a_revenue_share(self):
        write(self.fx.path("mx.html"),
              "<html><body>A fixed <b>20% share</b> is recommitted to hard training."
              "</body></html>")
        self.assertEqual(self.fx.run().returncode, 0)

    def test_label_over_a_member_input_is_not_a_claim(self):
        """contracts.html: the member types their own rate into a calculator."""
        write(self.fx.path("calc.html"),
              '<html><body><label>COMMISSION RATE (%)</label>'
              '<input type="number" value="9.17"></body></html>')
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_a_comment_describing_the_problem_is_not_the_problem(self):
        """omega-a11y.js quotes "COMMISSION RATE (%)" as an example label."""
        write(self.fx.path("a11y.js"),
              "/* Controls sit next to a real <label> the author wrote\n"
              '   ("CATEGORY", "TIER", "COMMISSION RATE (%)") with no for=. */\n'
              "var x = 1;\n")
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_member_own_currency_alone_is_not_a_claim(self):
        """A budget page showing the member their own total makes no promise."""
        write(self.fx.path("budget.html"),
              "<html><body><div>Total spent: $412.90</div></body></html>")
        self.assertEqual(self.fx.run().returncode, 0)

    def test_non_money_accumulator_is_not_synthesised_currency(self):
        write(self.fx.path("n.js"),
              "var streak=0;\nstreak += 1;\nel.innerHTML='<b>$'+total+'</b>';\n")
        self.assertEqual(self.fx.run().returncode, 0)

    # -------------------------------------------------------- gate clears it

    def test_platform_settings_reference_clears_the_claim(self):
        write(self.fx.path("g1.html"),
              "<html><body>Creators earn 70% revenue share once "
              "platform_settings.creator_earnings_enabled is on.</body></html>")
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_data_omega_flag_attribute_clears_the_claim(self):
        write(self.fx.path("g2.html"),
              '<html><body><div data-omega-flag="ad_network_enabled">'
              'Payouts weekly.</div></body></html>')
        self.assertEqual(self.fx.run().returncode, 0)

    def test_omega_flags_api_clears_the_claim(self):
        write(self.fx.path("g3.js"),
              "OmegaFlags.get('creator_earnings_enabled').then(function(on){"
              "if(on) show('revenue share');});\n")
        self.assertEqual(self.fx.run().returncode, 0)

    # --------------------------------------------------------------- scope

    def test_sql_and_scripts_are_not_scanned(self):
        """The SQL that DEFINES the flags necessarily names the money words."""
        write(self.fx.path("supabase", "flags.sql"),
              "-- creators earn 70% revenue share; payout pending\n"
              "INSERT INTO public.platform_settings(key,bool_value) VALUES ('x',false);\n")
        self.assertEqual(self.fx.run().returncode, 0)

    def test_the_gate_itself_is_exempt(self):
        """It quotes the offending strings as evidence; it must not self-trip."""
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertNotIn("commerce-contract.py", r.stdout.split("Fix by")[0])


if __name__ == "__main__":
    unittest.main(verbosity=2)
