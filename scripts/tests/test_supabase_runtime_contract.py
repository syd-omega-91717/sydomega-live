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


class AuthorizationHeaderTests(unittest.TestCase):
    """The 401 this gate reported was its own doing, not production's.

    Supabase's docs: "A common mistake is sending a publishable or secret key as
    a bearer token ... The new API keys are not JWTs ... Instead, put API keys in
    the `apikey` header." The contract did exactly that on every probe.
    """

    def test_a_publishable_key_carries_no_bearer(self):
        self.assertEqual(contract.bearer_for("sb_publishable_abc123"), {})

    def test_a_secret_key_carries_no_bearer_either(self):
        self.assertEqual(contract.bearer_for("sb_secret_abc123"), {})

    def test_a_legacy_jwt_key_still_carries_its_bearer(self):
        """VIOLATOR of the naive fix. Dropping Authorization unconditionally
        would break the legacy anon key, which IS a JWT and is copied into that
        header by the platform. The CI-secret override may still supply one."""
        self.assertEqual(
            contract.bearer_for("eyJhbGciOiJIUzI1NiJ9.payload.sig"),
            {"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.payload.sig"},
        )

    def test_the_key_bg_js_ships_is_routed_as_opaque(self):
        """The end-to-end shape: whatever bg.js ships must resolve to the header
        set the platform accepts for that key type."""
        _, anon = contract.shipped_credentials()
        self.assertEqual(contract.bearer_for(anon), {})


class PostgrestProbeTests(unittest.TestCase):
    """The probe must exercise a real anonymous read, not schema introspection.

    `GET /rest/v1/` returned 401 and the gate called it a rejected key. Supabase's
    API reference: the Management API openapi endpoint "is the replacement for
    querying /rest/v1/ directly with the anon key" -- that root is no longer
    served to public keys at all.
    """

    def test_the_probe_is_not_the_openapi_root(self):
        """VIOLATOR of the original design."""
        self.assertNotEqual(contract.POSTGREST_PROBE.split("?")[0], "/rest/v1/")

    def test_the_probe_targets_a_table_anon_can_read(self):
        """The probe follows the live public catalog boundary, not owner-only settings."""
        self.assertTrue(contract.POSTGREST_PROBE.startswith("/rest/v1/token_catalog"))


class KeyAcceptanceTests(unittest.TestCase):
    """A Postgres 42501 means PostgREST accepted the key and ran the query as
    anon; a bad key is refused by PostgREST before Postgres is reached. main
    went red on 2026-09-25 because this gate read the first as the second."""

    def _run(self, postgrest_error):
        import io
        import urllib.error
        from unittest import mock

        def fake_get(url, headers):
            if "/rest/v1/" in url and postgrest_error:
                code, body = postgrest_error
                raise urllib.error.HTTPError(url, code, "x", {}, io.BytesIO(body.encode()))
            return 200, b"{}"

        env = {"SUPABASE_URL": "https://example.supabase.co", "SUPABASE_ANON_KEY": "sb_publishable_test"}
        with mock.patch.object(contract, "get", fake_get), mock.patch.dict(os.environ, env), \
                mock.patch("sys.stdout", new_callable=io.StringIO):
            return contract.main()

    def test_all_200_passes(self):
        self.assertEqual(self._run(None), 0)

    def test_grant_denial_proves_the_key_was_accepted(self):
        body = ('{"code":"42501","details":null,"hint":"Grant the required privileges",'
                '"message":"permission denied for table token_catalog"}')
        self.assertEqual(self._run((401, body)), 0)

    def test_an_invalid_key_still_fails(self):
        body = '{"message":"Invalid API key","hint":"Double check your Supabase anon or service_role API key."}'
        self.assertEqual(self._run((401, body)), 1)

    def test_a_jwt_error_still_fails(self):
        self.assertEqual(self._run((401, '{"code":"PGRST301","message":"JWSError"}')), 1)

    def test_a_server_error_still_fails(self):
        self.assertEqual(self._run((500, '{"code":"42501"}')), 1)

    def test_the_probe_is_bounded_and_read_only(self):
        """A contract must not pull a table down to prove reachability, and must
        never be able to write."""
        self.assertIn("limit=1", contract.POSTGREST_PROBE)
        self.assertIn("select=", contract.POSTGREST_PROBE)


class HelpContractTests(unittest.TestCase):
    def test_help_exits_zero_without_running(self):
        import subprocess
        r = subprocess.run([sys.executable, SCRIPT, "--help"], cwd=ROOT,
                           capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertNotIn("credential_source=", r.stdout)


if __name__ == "__main__":
    unittest.main()
