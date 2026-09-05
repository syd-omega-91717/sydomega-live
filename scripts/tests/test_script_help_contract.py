#!/usr/bin/env python3
"""One repo-wide test for the invariant CLAUDE.md 8.4 already claims.

CLAUDE.md 8.4 says: "Ask a script what it does before reading it. Every
scripts/*.py|sh answers --help with its docstring and exits 0; a test keeps it
true."

The second half was not true. The invariant was enforced per-script, in
whichever test file someone happened to write one, so a script shipped without
a test was never checked. Measured on 2026-09-05, before this file existed:

    HONORS --help : 26
    IGNORES/FAILS : 19        (ran the whole job instead, one exiting 1)
    HANGS  (>20s) : 1         (page-overlap-audit.py -- an O(n^2) comparison
                               over 189 pages, so asking what it did never
                               returned)
    NO DOCSTRING  : 1         (user-journey-contract.py)

That is 21 of 47. The cost is not cosmetic: --help is how an agent learns what
a script does without spending context reading it, and a --help that runs a
189-page scan, or never returns, makes the cheap path the expensive one.

This test is deliberately a SWEEP, not a list. A new script is covered the
moment it lands, which is the only way the claim in CLAUDE.md stays true.

Run: python3 -m unittest scripts/tests/test_script_help_contract.py -v
"""

import ast
import os
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
SCRIPTS = ROOT / 'scripts'

# --help must be answered from the docstring, not by doing the work, so it has
# no excuse to be slow. A generous ceiling that still fails a script that runs
# its whole job.
TIMEOUT = 20


def agent_facing():
    """Every top-level script in scripts/ -- tests/ and __pycache__ excluded."""
    return sorted(p for p in SCRIPTS.glob('*.py') if p.parent == SCRIPTS)


class TestHelpContract(unittest.TestCase):

    def test_every_script_has_a_module_docstring(self):
        """--help prints __doc__, so an absent docstring makes it print None."""
        missing = [p.name for p in agent_facing()
                   if not (ast.get_docstring(ast.parse(p.read_text(
                       encoding='utf-8', errors='replace'))) or '').strip()]
        self.assertEqual(missing, [], 'scripts with no module docstring: %s' % missing)

    def test_every_script_answers_help_from_its_docstring(self):
        """Exit 0, promptly, echoing the docstring rather than doing the work."""
        failures = []
        for path in agent_facing():
            doc = (ast.get_docstring(ast.parse(path.read_text(
                encoding='utf-8', errors='replace'))) or '').strip()
            if not doc:
                continue  # covered by the test above
            probe = doc.splitlines()[0].strip()[:40]
            try:
                proc = subprocess.run(
                    [sys.executable, str(path), '--help'],
                    capture_output=True, text=True, timeout=TIMEOUT,
                    stdin=subprocess.DEVNULL, cwd=str(ROOT))
            except subprocess.TimeoutExpired:
                failures.append('%s: --help did not return within %ds (it is '
                                'doing the work)' % (path.name, TIMEOUT))
                continue
            out = (proc.stdout or '') + (proc.stderr or '')
            if proc.returncode != 0:
                failures.append('%s: --help exited %d' % (path.name, proc.returncode))
            elif probe not in out and 'usage:' not in out.lower():
                failures.append('%s: --help printed something other than its '
                                'docstring (ran the job?)' % path.name)
        self.assertEqual(failures, [],
                         'scripts violating the --help contract:\n  ' +
                         '\n  '.join(failures))

    def test_the_sweep_can_actually_fail(self):
        """CONTROL. A sweep that cannot fail proves nothing (CLAUDE.md 8.4).

        Plants a script that ignores --help and asserts the same predicate the
        sweep uses rejects it. Without this, a scan broken in transit reports a
        serene zero and looks like a clean repo -- which has happened here three
        times in one session.
        """
        import tempfile
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / 'planted.py'
            bad.write_text('"""Planted control docstring."""\nprint("DID THE WORK")\n',
                           encoding='utf-8')
            proc = subprocess.run([sys.executable, str(bad), '--help'],
                                  capture_output=True, text=True, timeout=TIMEOUT,
                                  stdin=subprocess.DEVNULL)
            out = (proc.stdout or '') + (proc.stderr or '')
            self.assertNotIn('Planted control docstring.', out,
                             'the planted violator must NOT print its docstring')
            self.assertIn('DID THE WORK', out,
                          'the planted violator must demonstrably run its job')


if __name__ == '__main__':
    unittest.main()
