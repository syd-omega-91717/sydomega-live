#!/usr/bin/env python3
"""Regression tests for scripts/migration-drift.py.

The gate exists because drift ran BOTH ways on 2026-09-05 and nothing saw it:
nine remote versions with no local file (what `supabase db push` reports) and
four local files never applied. So both directions get a planted violator, and
the clean case is asserted only alongside them.

Run: python3 -m unittest scripts/tests/test_migration_drift.py -v
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SCRIPT = ROOT / 'scripts' / 'migration-drift.py'


class Fixture(unittest.TestCase):
    def setUp(self):
        self.dir = Path(tempfile.mkdtemp(prefix='omega-migdrift-'))
        (self.dir / 'scripts').mkdir()
        (self.dir / 'supabase' / 'migrations').mkdir(parents=True)
        shutil.copy(str(SCRIPT), str(self.dir / 'scripts' / 'migration-drift.py'))

    def tearDown(self):
        shutil.rmtree(str(self.dir), ignore_errors=True)

    def files(self, *names):
        for n in names:
            (self.dir / 'supabase' / 'migrations' / n).write_text('-- x\n', encoding='utf-8')

    def snapshot(self, versions, captured='2026-09-05'):
        (self.dir / 'supabase' / 'remote-migrations.json').write_text(
            json.dumps({'_captured': captured, '_count': len(versions),
                        'versions': list(versions)}), encoding='utf-8')

    def run_gate(self, *args):
        return subprocess.run([sys.executable, str(self.dir / 'scripts' / 'migration-drift.py')]
                              + list(args), capture_output=True, text=True,
                              cwd=str(self.dir), stdin=subprocess.DEVNULL)


class TestDrift(Fixture):

    def test_control_remote_only_fails(self):
        """PLANTED POSITIVE — the exact case `supabase db push` reports."""
        self.files('0001_a.sql')
        self.snapshot(['0001', '20260905012717'])
        r = self.run_gate()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('20260905012717', r.stdout)
        self.assertIn('no file in supabase/migrations/', r.stdout)

    def test_control_local_only_fails(self):
        """PLANTED POSITIVE — the direction the CLI error does NOT mention."""
        self.files('0001_a.sql', '0106_commerce_flags.sql')
        self.snapshot(['0001'])
        r = self.run_gate()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn('0106', r.stdout)
        self.assertIn('never been applied', r.stdout)

    def test_agreement_passes(self):
        """The clean case — asserted only because both controls above fail."""
        self.files('0001_a.sql', '20260905012717_b.sql')
        self.snapshot(['0001', '20260905012717'])
        r = self.run_gate()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn('local and remote agree', r.stdout)

    def test_missing_snapshot_fails_rather_than_passing_silently(self):
        """No snapshot must not look like agreement."""
        self.files('0001_a.sql')
        self.assertEqual(self.run_gate().returncode, 1)

    def test_help_prints_docstring(self):
        self.files('0001_a.sql')
        self.snapshot(['0001'])
        r = self.run_gate('--help')
        self.assertEqual(r.returncode, 0)
        self.assertIn('Refuse migration drift', r.stdout)


if __name__ == '__main__':
    unittest.main()
