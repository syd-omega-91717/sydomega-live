"""The TDM Reservation file: a machine-readable "no text-and-data-mining without a licence" signal (W3C TDMRep, EU DSM Directive Art. 4(3)).

It is the honest replacement for the rejected "poison other AIs' training data" idea: it asks, it does not attack. These tests prove the file is
valid, reserves the whole site, and ships through scripts/vercel-build.sh into public/.well-known/ (a file the build drops would be a signal nobody sees).
"""
import json
import os
import shutil
import subprocess
import tempfile
import unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SRC = os.path.join(ROOT, '.well-known', 'tdmrep.json')


def check(rules):
    """Return a list of problems with a parsed tdmrep document; [] means it reserves the whole site."""
    if not isinstance(rules, list) or not rules:
        return ['not a non-empty array']
    bad = []
    for r in rules:
        if not isinstance(r, dict) or not isinstance(r.get('location'), str):
            bad.append('rule without a string location')
        elif r.get('tdm-reservation') not in (0, 1):
            bad.append('tdm-reservation must be 0 or 1')
    if not any(isinstance(r, dict) and r.get('location') in ('/*', '/') and r.get('tdm-reservation') == 1 for r in rules):
        bad.append('no rule reserves the whole site')
    return bad


class TdmReservation(unittest.TestCase):
    def test_file_is_valid_and_reserves_everything(self):
        with open(SRC, encoding='utf-8') as fh:
            self.assertEqual(check(json.load(fh)), [])

    def test_checker_finds_each_defect(self):          # positive controls: a checker that cannot fail proves nothing
        self.assertTrue(check([]))
        self.assertTrue(check({'location': '/*'}))
        self.assertTrue(check([{'location': '/*', 'tdm-reservation': 2}]))
        self.assertTrue(check([{'location': '/blog/*', 'tdm-reservation': 1}]))     # partial reservation is not the whole site
        self.assertTrue(check([{'location': '/*', 'tdm-reservation': 0}]))          # an explicit "allowed" is the opposite
        self.assertEqual(check([{'location': '/*', 'tdm-reservation': 1}, {'location': '/open/*', 'tdm-reservation': 0}]), [])

    def test_build_ships_it(self):
        if not shutil.which('bash') or not shutil.which('node'):
            self.skipTest('bash/node unavailable')
        with tempfile.TemporaryDirectory() as tmp:
            dst = os.path.join(tmp, 'repo')
            subprocess.run(['git', 'worktree', 'add', '--detach', dst, 'HEAD'], cwd=ROOT, check=True, capture_output=True)
            try:
                shutil.copy(SRC, os.path.join(dst, '.well-known', 'tdmrep.json')) if os.path.isdir(os.path.join(dst, '.well-known')) else (os.makedirs(os.path.join(dst, '.well-known')), shutil.copy(SRC, os.path.join(dst, '.well-known', 'tdmrep.json')))
                r = subprocess.run(['bash', 'scripts/vercel-build.sh'], cwd=dst, capture_output=True, text=True, timeout=600)
                out = os.path.join(dst, 'public', '.well-known', 'tdmrep.json')
                self.assertTrue(os.path.isfile(out), 'build dropped tdmrep.json\n' + r.stdout[-600:])
                with open(out, encoding='utf-8') as fh:
                    self.assertEqual(check(json.load(fh)), [])
            finally:
                subprocess.run(['git', 'worktree', 'remove', '--force', dst], cwd=ROOT, capture_output=True)


if __name__ == '__main__':
    unittest.main()
