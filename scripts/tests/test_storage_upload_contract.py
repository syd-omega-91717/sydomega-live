#!/usr/bin/env python3
"""
Regression tests for the OmegaStorage.upload contract (#175, import-export).

WHY THIS EXISTS

`upload.js` declares `upload(bucket, file)`. Two of the four call sites shipped
with the arguments the other way round:

    profile.html:2147   OmegaStorage.upload(fileEl.files[0], 'uploads')
    marketplace.html    OmegaStorage.upload(fileEl.files[0], 'uploads')

With the string in the `file` slot, `file.name` is undefined and `.replace()`
raised a TypeError *inside* upload(). Both callers wrapped the call in a
try/catch — marketplace.html's was a bare `catch(e){}` — so the exception was
swallowed, `file_path` stayed null, the row was inserted anyway, and the page
printed "LISTED — Your work is now visible in the marketplace." A member's file
had never been uploaded. publishing.html had the arguments right and still
showed "Committed to your archive." after a failed upload, for the same reason:
it never looked at the returned `{error}`.

That is CLAUDE.md 8.1 bug class 1 (a write that silently does nothing while the
UI reports success), reached through class 4's shape (a shared accessor used on
trust). Both halves are asserted here:

  1. every call passes the bucket name first, and
  2. every call inspects the result's `.error` before continuing.

Supabase's storage client resolves to `{data, error}` and upload.js converts
that to `{error: message}` — it does not throw — so a try/catch around the call
proves nothing on its own and is not accepted as the check.

The node half asserts upload() *returns* {error} for bad arguments rather than
throwing, which is what makes assertion 2 sufficient.

Run: python3 -m unittest scripts/tests/test_storage_upload_contract.py -v
"""

import os
import re
import shutil
import subprocess
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_JS = os.path.join(ROOT, "upload.js")

# A call with at least one argument, capturing the variable its result is
# assigned to. `OmegaStorage.upload()` appears in marketplace.html's prose
# describing the feature; that has no arguments and is deliberately not
# matched. Requiring the assignment is itself part of the contract — a
# fire-and-forget upload cannot check anything.
CALL = re.compile(r"(?:var\s+)?(\w+)\s*=\s*await\s+window\.OmegaStorage\.upload\(\s*(?=[^)\s])")
# How far after the call the `.error` check may sit. The four real call sites
# check on the same line or the next two.
ERROR_WINDOW = 6


def call_sites():
    """(path, line_number, result_variable, window) per real upload( call."""
    out = []
    for name in sorted(os.listdir(ROOT)):
        if not name.endswith((".html", ".js")):
            continue
        path = os.path.join(ROOT, name)
        if not os.path.isfile(path):
            continue
        with open(path, encoding="utf-8") as fh:
            lines = fh.read().splitlines()
        for i, line in enumerate(lines):
            m = CALL.search(line)
            if m:
                out.append((name, i + 1, m.group(1), lines[i:i + ERROR_WINDOW]))
    return out


class UploadCallContract(unittest.TestCase):
    def test_there_are_call_sites_to_check(self):
        """A scanner that matches nothing passes vacuously (CLAUDE.md 8.4)."""
        self.assertGreaterEqual(len(call_sites()), 4)

    def test_bucket_name_is_the_first_argument(self):
        """The swapped-argument bug, asserted at every call site."""
        for name, line_no, _var, block in call_sites():
            with self.subTest(site=f"{name}:{line_no}"):
                first_arg = block[0].split("OmegaStorage.upload(", 1)[1].lstrip()
                self.assertRegex(
                    first_arg, r"""^['"]""",
                    f"{name}:{line_no} passes {first_arg[:40]!r} where the bucket name belongs",
                )

    def test_every_call_checks_the_returned_error(self):
        """upload() resolves to {error}; it does not throw. A caller that goes
        straight to its success path ships bug class 1."""
        for name, line_no, var, block in call_sites():
            with self.subTest(site=f"{name}:{line_no}"):
                # `{var}.error` specifically, not any `.error` in the vicinity:
                # the first draft of this test matched marketplace.html's
                # unrelated `ins.error` two lines further down and passed a
                # mutation that deleted the real check.
                self.assertIn(
                    f"{var}.error", "\n".join(block),
                    f"{name}:{line_no} never inspects {var}.error, "
                    "so a failed upload reaches the success path",
                )


@unittest.skipIf(shutil.which("node") is None, "node not available")
class UploadReturnsRatherThanThrows(unittest.TestCase):
    """The guarantee that makes the .error check above sufficient."""

    def _run(self, body):
        d = tempfile.mkdtemp(prefix="omega-upload-")
        self.addCleanup(shutil.rmtree, d, True)
        harness = os.path.join(d, "harness.mjs")
        with open(harness, "w", encoding="utf-8") as fh:
            fh.write(
                "import {readFileSync} from 'node:fs';\n"
                # A never-settling client keeps the module from reaching the
                # network; every assertion below returns before awaiting it.
                "globalThis.window = {OmegaSB:{get:()=>new Promise(()=>{})}};\n"
                f"eval(readFileSync({UPLOAD_JS!r}, 'utf8'));\n"
                "const upload = window.OmegaStorage.upload;\n"
                f"{body}\n"
            )
        proc = subprocess.run(["node", harness], capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 0, f"{proc.stdout}{proc.stderr}")
        return proc.stdout.strip()

    def test_missing_file_returns_an_error_object(self):
        self.assertEqual(
            self._run("console.log(JSON.stringify(await upload('uploads', null)));"),
            '{"error":"No file chosen."}',
        )

    def test_string_in_the_file_slot_returns_instead_of_throwing_a_typeerror(self):
        """The exact shape the two broken call sites produced."""
        self.assertEqual(
            self._run("console.log(JSON.stringify(await upload('uploads', 'uploads')));"),
            '{"error":"No file chosen."}',
        )

    def test_missing_bucket_is_named_as_such(self):
        self.assertEqual(
            self._run("console.log(JSON.stringify(await upload(null, null)));"),
            '{"error":"No storage bucket named."}',
        )

    def test_remove_requires_a_bucket_and_path(self):
        """The shared delete helper must fail closed before any network call."""
        self.assertEqual(
            self._run("console.log(JSON.stringify(await window.OmegaStorage.remove(null, 'x')));"),
            '{"error":"No storage bucket named."}',
        )
        self.assertEqual(
            self._run("console.log(JSON.stringify(await window.OmegaStorage.remove('uploads', null)));"),
            '{"error":"No storage path."}',
        )

    def test_over_limit_file_is_rejected_before_any_network_call(self):
        self.assertEqual(
            self._run(
                "const big = {name:'x.bin', size: 6*1024*1024*1024};\n"
                "console.log(JSON.stringify(await upload('uploads', big)));"
            ),
            '{"error":"File exceeds the 5 GB limit."}',
        )


if __name__ == "__main__":
    unittest.main()
