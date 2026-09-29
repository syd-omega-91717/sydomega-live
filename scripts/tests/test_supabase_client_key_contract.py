#!/usr/bin/env python3
"""Regression tests for scripts/supabase-client-key-contract.py.

The gate exists because omega-evidence-graph.js shipped a publishable key the
project does not have, so a signed-in member was told to sign in. Each test
hands the scanner a tree that MUST be caught and one that must NOT be, so a
"0 findings" result is known to be real (CLAUDE.md 8.4).

Run: python3 -m unittest scripts.tests.test_supabase_client_key_contract -v
"""

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location(
    'keycontract', ROOT / 'scripts' / 'supabase-client-key-contract.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

REF = 'abcdefghijklmnopqrst'
KEY = 'sb_publishable_GOODkey_123'
BG = 'var URL = "https://%s.supabase.co";\nvar KEY = "%s";\n' % (REF, KEY)


def tree(files):
    d = tempfile.mkdtemp()
    Path(d, 'bg.js').write_text(BG)
    for name, body in files.items():
        p = Path(d, name)
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(body)
    return Path(d)


class KeyContract(unittest.TestCase):
    def test_canonical_key_passes(self):
        self.assertEqual(gate.findings(tree({'a.js': 'k="%s"' % KEY})), [])

    def test_foreign_key_is_caught(self):
        out = gate.findings(tree({'a.js': 'k="sb_publishable_4L5Qy5vQ9pQm8hM0QmQ"'}))
        self.assertEqual(len(out), 1)
        self.assertIn('a.js', out[0])

    def test_foreign_project_host_is_caught(self):
        out = gate.findings(tree({'p.html': '"https://zzzzzzzzzzzzzzzzzzzz.supabase.co"'}))
        self.assertEqual(len(out), 1)

    def test_unshipped_directories_are_ignored(self):
        bad = 'k="sb_publishable_other"'
        self.assertEqual(gate.findings(tree({'scripts/x.js': bad, 'public/y.js': bad,
                                             'docs/z.json': bad})), [])

    def test_missing_canonical_declaration_fails(self):
        d = tree({})
        Path(d, 'bg.js').write_text('// no declaration')
        self.assertTrue(gate.findings(d))


if __name__ == '__main__':
    unittest.main()
