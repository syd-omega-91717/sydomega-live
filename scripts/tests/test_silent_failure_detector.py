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


class FalsePositivePassTests(unittest.TestCase):
    """Each case below was a real finding on origin/main that was not a bug.

    The scanner reported 51 unchecked writes; 42 of them were noise of these
    kinds. Every "must not fire" test here is paired with a violator, because a
    scanner that reports nothing would satisfy the negatives on its own
    (CLAUDE.md §8.4).
    """

    def setUp(self):
        self.fx = SilentFailureFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_a_call_inside_a_comment_is_not_a_call(self):
        # omega-ring.js:20 — a /* */ block documenting OmegaRing's own API.
        self.fx.write_html("omega-ring.js", """
            /* Programmatic API:
                 OmegaRing.update(canvas, newValue)   // animate current → newValue
                 sb.from('x').insert(row)             // not real either
            */
            (function(){ 'use strict'; })();
            """)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_update_on_a_plain_object_is_not_a_supabase_write(self):
        # omega-confetti.js:115 — p.update() on a particle in a rAF loop.
        self.fx.write_html("omega-confetti.js", """
            _particles.forEach(function (p) { p.update(); p.draw(_ctx); });
            """)
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_vendored_client_is_not_scanned(self):
        # vendor/supabase-js.js:43 is the client library DEFINING .rpc.
        self.fx.write_html("vendor/supabase-js.js", "var x={rpc:function(e,t,n){return this.rpc(e,t,n);}};\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_destructured_error_counts_as_checked(self):
        # omega-council.js:219 — the check sits to the LEFT of the call.
        self.fx.write_html("a.js",
                           "const { error } = await sb.from('t').update({a:1});\n"
                           "if (error) { console.error(error); }\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_a_read_rpc_is_not_a_write(self):
        self.fx.write_html("b.js", "const {data} = await sb.rpc('get_platform_flag',{p_key:'x'});\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_a_write_rpc_is_still_reported(self):
        # VIOLATOR — pairs with the read test above.
        self.fx.write_html("c.js", "await sb.rpc('set_profile_visibility',{p_public:true});\nrepaint();\n")
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("set_profile_visibility", out)

    def test_a_then_with_no_argument_cannot_have_checked_anything(self):
        # VIOLATOR — bg.js:1520's shape. The callback takes no result, so it
        # runs identically on {data:null,error} and asserts the write landed.
        self.fx.write_html("d.js",
                           "sb.rpc('expire_trial',{p_uid:u}).then(function(){ location.replace('/gone'); });\n")
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("expire_trial", out)

    def test_a_then_that_takes_the_result_is_inspecting_it(self):
        self.fx.write_html("e.js",
                           "sb.rpc('set_thing',{p:1}).then(function(r){ if(r.error) fail(); else ok(); });\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)

    def test_an_unrelated_later_catch_does_not_vouch_for_this_call(self):
        # THE FALSE NEGATIVE. Widening the .catch() search to a flat character
        # window made bg.js:1520 vanish: an outer chain's .catch, a few lines
        # below, was read as handling it. Hiding a real finding is worse than
        # reporting a false one, so the search is statement-bounded.
        self.fx.write_html("f.js",
                           "if (x) { sb.rpc('expire_trial',{p_uid:u}).then(function(){ go(); }); return; }\n"
                           "somethingElse().then(function(){ done(); }).catch(function(){});\n")
        code, out = self.fx.run()
        self.assertEqual(code, 1, out)
        self.assertIn("expire_trial", out)

    def test_a_catch_in_the_same_chain_does_vouch_for_it(self):
        self.fx.write_html("g.js",
                           "await sb.rpc('record_thing',{p:1}).catch(function(){});\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0, out)


if __name__ == "__main__":
    unittest.main()
