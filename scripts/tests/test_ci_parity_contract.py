#!/usr/bin/env python3
"""ci-parity-contract must fail on a planted gap and pass once it is closed."""
import importlib.util
import json
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(os.path.dirname(HERE), 'ci-parity-contract.py')


def load(root):
    spec = importlib.util.spec_from_file_location('cpc', SRC)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    m.ROOT = root
    m.WF = os.path.join(root, '.github', 'workflows')
    m.EXEMPT = os.path.join(root, 'config', 'ci-parity-exempt.json')
    return m


def tree(workflow, local='', suite='', exempt=None, scripts=('a.py',)):
    d = tempfile.mkdtemp()
    os.makedirs(os.path.join(d, '.github', 'workflows'))
    os.makedirs(os.path.join(d, 'scripts'))
    os.makedirs(os.path.join(d, 'config'))
    for s in scripts:
        open(os.path.join(d, 'scripts', s), 'w').write('')
    open(os.path.join(d, '.github', 'workflows', 'w.yml'), 'w').write(workflow)
    open(os.path.join(d, 'scripts', 'ci-local.sh'), 'w').write(local)
    open(os.path.join(d, 'scripts', 'contract-suite.py'), 'w').write(suite)
    if exempt is not None:
        json.dump(exempt, open(os.path.join(d, 'config', 'ci-parity-exempt.json'), 'w'))
    return d


PR = 'on:\n  pull_request:\n    branches: [main]\njobs:\n  j:\n    steps:\n      - run: python scripts/a.py\n'
PUSH_ONLY = PR.replace('pull_request:\n    branches: [main]', 'push:\n    branches: [main]')


class T(unittest.TestCase):
    def run_main(self, d):
        m = load(d)
        return m.main([])

    def test_unmirrored_script_fails(self):
        self.assertEqual(self.run_main(tree(PR)), 1)

    def test_mirrored_by_name_passes(self):
        self.assertEqual(self.run_main(tree(PR, local='python3 scripts/a.py')), 0)

    def test_mirrored_by_bare_stem_passes(self):
        self.assertEqual(self.run_main(tree(PR, local='for s in a b; do :; done')), 0)

    def test_substring_of_another_name_is_not_a_mirror(self):
        self.assertEqual(self.run_main(tree(PR, local='python3 scripts/data-a-thing.py')), 1)

    def test_push_only_workflow_ignored(self):
        self.assertEqual(self.run_main(tree(PUSH_ONLY)), 0)

    def test_exempt_with_reason_passes(self):
        self.assertEqual(self.run_main(tree(PR, exempt={'a.py': 'needs a database'})), 0)

    def test_exempt_without_reason_fails(self):
        self.assertEqual(self.run_main(tree(PR, exempt={'a.py': ' '})), 1)

    def test_stale_exemption_fails(self):
        self.assertEqual(self.run_main(tree(PR, local='scripts/a.py', exempt={'a.py': 'x'})), 1)
        self.assertEqual(self.run_main(tree(PR, local='scripts/a.py', exempt={'gone.py': 'x'})), 1)

    def test_help_exits_zero(self):
        self.assertEqual(load(tree(PR)).main(['--help']), 0)


if __name__ == '__main__':
    unittest.main()
