#!/usr/bin/env python3
"""Tests for scripts/silent-failure-detector.py"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT_SRC = os.path.join(ROOT, "scripts", "silent-failure-detector.py")


def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class SilentFailureFixture:
    """Fixture for testing silent-failure-detector.py"""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="silent-failure-test-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SCRIPT_SRC, os.path.join(self.dir, "scripts", "silent-failure-detector.py"))

    def write_html(self, filename, content):
        write_file(os.path.join(self.dir, filename), content)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "silent-failure-detector.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class SilentFailureDetectorTests(unittest.TestCase):
    def setUp(self):
        self.fx = SilentFailureFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_checked_write_passes(self):
        self.fx.write_html(
            "page.html",
            """
            <script type="module">
            async function save() {
              const {data, error} = await sb.from('profiles').update({name: 'test'});
              if (error) {
                alert('Error: ' + error.message);
                return;
              }
              console.log('Saved');
            }
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)

    def test_unchecked_update_detected(self):
        self.fx.write_html(
            "page.html",
            """
            <script type="module">
            async function save() {
              const {data} = await sb.from('profiles').update({name: 'test'});
              alert('Saved!');
            }
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("does not check .error", out)

    def test_unchecked_insert_detected(self):
        self.fx.write_html(
            "page.html",
            """
            <script type="module">
            async function add() {
              await sb.from('events').insert({title: 'Event'});
              alert('Added!');
            }
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("does not check .error", out)

    def test_unchecked_rpc_detected(self):
        self.fx.write_html(
            "page.html",
            """
            <script type="module">
            async function process() {
              await sb.rpc('complete_task', {p_id: 123});
              alert('Done!');
            }
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("does not check .error", out)

    def test_try_catch_wrapped_write_passes(self):
        self.fx.write_html(
            "page.html",
            """
            <script type="module">
            async function save() {
              try {
                await sb.from('profiles').update({name: 'test'});
              } catch (e) {
                console.error(e);
              }
            }
            </script>
            """,
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK", out)


if __name__ == "__main__":
    unittest.main()
