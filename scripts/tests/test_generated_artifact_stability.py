#!/usr/bin/env python3
"""A committed generated artifact must be reproducible.

schema_consolidation_mapping.json embedded `datetime.now().isoformat()`, so it
came back dirty after every run of scripts/schema-consolidation-phase1.py. Any
session that ran the verification sweep then faced a diff that carried no
information, and the two ways out are both bad: commit a meaningless timestamp
bump, or `git checkout --` the file, which is one slip away from discarding real
work. The stop-hook git check flags it either way.

Nothing read the field. Provenance is the generator's name, which is stable;
build-content-registry.py already takes that approach with a plain
`'generated': True`.

The rule this encodes: running a generator twice with unchanged inputs must
produce byte-identical output. That is what makes a generated file reviewable in
a diff at all.

Run: python3 -m unittest scripts/tests/test_generated_artifact_stability.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

# (generator, artifact it writes)
GENERATORS = [
    ('scripts/schema-consolidation-phase1.py', 'schema_consolidation_mapping.json'),
]


class TestGeneratedArtifactStability(unittest.TestCase):

    def test_generators_are_reproducible(self):
        """Two runs, unchanged inputs, byte-identical output."""
        for script, artifact in GENERATORS:
            with self.subTest(script=script):
                target = ROOT / artifact
                self.assertTrue(target.is_file(), '%s has never been generated' % artifact)
                backup = target.read_bytes()
                try:
                    subprocess.run([sys.executable, str(ROOT / script)],
                                   capture_output=True, timeout=180,
                                   stdin=subprocess.DEVNULL, cwd=str(ROOT), check=True)
                    first = target.read_bytes()
                    subprocess.run([sys.executable, str(ROOT / script)],
                                   capture_output=True, timeout=180,
                                   stdin=subprocess.DEVNULL, cwd=str(ROOT), check=True)
                    second = target.read_bytes()
                finally:
                    target.write_bytes(backup)
                self.assertEqual(
                    first, second,
                    '%s differs between two consecutive runs with unchanged inputs '
                    '— it is embedding something volatile (a clock, a PID, an '
                    'unordered set)' % artifact)

    def test_the_check_can_actually_fail(self):
        """CONTROL. A stability check that cannot fail proves nothing.

        Plants a generator that stamps a clock, and asserts two runs differ.
        Without this, a check that silently never ran would look identical to a
        repo full of reproducible generators.
        """
        with tempfile.TemporaryDirectory() as tmp:
            gen = Path(tmp) / 'planted_gen.py'
            out = Path(tmp) / 'planted.json'
            gen.write_text(
                'import json, time, sys\n'
                'json.dump({"stamp": time.time_ns()}, open(sys.argv[1], "w"))\n',
                encoding='utf-8')
            runs = []
            for _ in range(2):
                subprocess.run([sys.executable, str(gen), str(out)],
                               capture_output=True, timeout=60, check=True)
                runs.append(out.read_bytes())
            self.assertNotEqual(runs[0], runs[1],
                                'the planted volatile generator must differ between runs')


if __name__ == '__main__':
    unittest.main()
