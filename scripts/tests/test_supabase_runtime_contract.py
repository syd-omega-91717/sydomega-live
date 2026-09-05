#!/usr/bin/env python3
"""Tests for scripts/supabase-runtime-contract.py's credential resolution.

This gate had NEVER run: it was pinned to a dead self-hosted runner
(FIXES_LOG.md 106). The first time it ever executed, it failed on
`SUPABASE_URL is not configured in the CI secret store` -- both repository
secrets are empty.

They were never secrets. bg.js:1506 ships the project URL and the
`sb_publishable_...` key to every visitor, because RLS is the authorization
boundary here, and the project URL is committed unsecreted in
production-surface-smoke.yml too. So the contract now reads what the platform
actually ships, with the CI secrets as an override -- strictly stronger, since
a stored copy can drift from production and this cannot.

Network is not exercised here: these tests cover only which credentials get
resolved, and from where.
"""

import importlib.util
import os
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "supabase-runtime-contract.py")

_spec = importlib.util.spec_from_file_location("supabase_runtime_contract", SCRIPT)
contract = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(contract)


class ShippedCredentialTests(unittest.TestCase):
    def test_it_finds_the_real_pair_bg_js_ships(self):
        url, anon = contract.shipped_credentials()
        self.assertTrue(url.startswith("https://"), url)
        self.assertTrue(url.endswith(".supabase.co"), url)
        self.assertTrue(anon.startswith("sb_publishable_"), "publishable key not resolved")

    def test_the_pattern_requires_both_halves(self):
        """VIOLATOR. A createClient call without a publishable key must not
        match -- half a credential pair is worse than none, because it would
        send the contract at the right project with the wrong key."""
        self.assertIsNone(
            contract.SHIPPED_CLIENT_RE.search(
                'm.createClient("https://example.supabase.co")'
            )
        )

    def test_a_service_role_key_is_never_matched(self):
        """VIOLATOR, and the one that matters. The pattern is anchored on the
        publishable prefix, so a service-role key could never be picked up even
        if one were wrongly present in client code."""
        self.assertIsNone(
            contract.SHIPPED_CLIENT_RE.search(
                'createClient("https://x.supabase.co","sb_secret_do_not_use")'
            )
        )

    def test_a_missing_bootstrap_file_returns_empty_rather_than_raising(self):
        original = contract.CLIENT_BOOTSTRAP
        try:
            contract.CLIENT_BOOTSTRAP = original.parent / "__absent_bootstrap__.js"
            self.assertEqual(contract.shipped_credentials(), ("", ""))
        finally:
            contract.CLIENT_BOOTSTRAP = original

    def test_the_publishable_key_is_never_printed_by_the_script(self):
        """The docstring promises the key is used without being printed. Nothing
        may echo it, and the module must not embed a literal key of its own."""
        source = open(SCRIPT, encoding="utf-8").read()
        _, anon = contract.shipped_credentials()
        self.assertNotIn(anon, source, "the live publishable key is hardcoded in the script")
        self.assertNotIn("print(anon", source)
        self.assertNotIn('print(f"{anon', source)


class HelpContractTests(unittest.TestCase):
    def test_help_exits_zero_without_running(self):
        import subprocess
        r = subprocess.run([sys.executable, SCRIPT, "--help"], cwd=ROOT,
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertNotIn("credential_source=", r.stdout)


if __name__ == "__main__":
    unittest.main()
