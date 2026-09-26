#!/usr/bin/env python3
"""
Unit tests for scripts/security-headers-contract.py's CSP host rule.

Every third-party library is self-hosted in /vendor/, so a code CDN left in
script-src/style-src/font-src/default-src is pure attack surface: it lets an
injected <script src> pull code from any package on that CDN. The rule must
catch the host in the vercel.json header AND in a page <meta> CSP (enforced
alongside the header), and must not trip on the allowed Google Fonts hosts or
on connect-src/img-src, which legitimately stay broad.

Run: python3 -m unittest scripts/tests/test_security_headers_contract.py -v
"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "security_headers_contract", os.path.join(ROOT, "scripts", "security-headers-contract.py"))
contract = importlib.util.module_from_spec(spec)
spec.loader.exec_module(contract)


class CspHostRule(unittest.TestCase):
    def test_flags_each_cdn_in_code_directives(self):
        csp = ("default-src 'self' https://esm.sh; script-src 'self' https://unpkg.com; "
               "style-src 'self' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net")
        errors = contract.csp_host_errors(csp, "x")
        self.assertEqual(len(errors), 4, errors)

    def test_allows_self_fonts_and_broad_connect(self):
        csp = ("default-src 'self'; script-src 'self' 'unsafe-inline'; "
               "style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; "
               "connect-src 'self' https: wss:; img-src 'self' https:")
        self.assertEqual(contract.csp_host_errors(csp, "x"), [])

    def test_meta_regex_reads_past_single_quoted_keywords(self):
        html = ('<meta http-equiv="Content-Security-Policy" '
                'content="default-src \'self\'; script-src \'self\' https://esm.sh;">')
        found = [c for _q, c in contract.META_CSP_RE.findall(html)]
        self.assertEqual(len(found), 1)
        self.assertIn("https://esm.sh", found[0])
        self.assertTrue(contract.csp_host_errors(found[0], "page.html"))

    def test_repository_passes(self):
        self.assertEqual(contract.main(), 0)


if __name__ == "__main__":
    unittest.main()
