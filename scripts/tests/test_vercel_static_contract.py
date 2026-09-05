#!/usr/bin/env python3
"""Tests for scripts/vercel_static_contract.py and scripts/vercel-build.sh.

Both files reached main untested, and both were wrong at once:

  * the contract demanded a www -> apex redirect, so it went red the moment the
    owner removed that rule in 4e216de3 -- it asserted one particular answer
    instead of the property that matters (no redirect loop);
  * the build script's copy allow-list omitted vendor/, so the deployment it
    emitted was missing /vendor/supabase-js.js -- imported by 127 pages before
    they render anything -- while the script printed VERCEL_BUILD=PASS.

Every "must pass" case below is paired with a violator, because a gate that
never fires would satisfy the passing cases on its own (CLAUDE.md 8.4).
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CONTRACT_SRC = os.path.join(ROOT, "scripts", "vercel_static_contract.py")
BUILD_SRC = os.path.join(ROOT, "scripts", "vercel-build.sh")

BASE_CONFIG = {
    "framework": None,
    "buildCommand": "bash scripts/vercel-build.sh",
    "installCommand": "",
    "outputDirectory": "public",
    "redirects": [],
}

WWW_TO_APEX = {
    "source": "/:path*",
    "has": [{"type": "host", "value": "www.sydomega.com"}],
    "destination": "https://sydomega.com/:path*",
    "permanent": True,
}
APEX_TO_WWW = {
    "source": "/:path*",
    "has": [{"type": "host", "value": "sydomega.com"}],
    "destination": "https://www.sydomega.com/:path*",
    "permanent": True,
}


class Fixture:
    """A minimal repo the two scripts can run against."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="vercel-contract-test-")
        os.makedirs(os.path.join(self.dir, "scripts"))
        shutil.copy(CONTRACT_SRC, os.path.join(self.dir, "scripts", "vercel_static_contract.py"))
        shutil.copy(BUILD_SRC, os.path.join(self.dir, "scripts", "vercel-build.sh"))
        self.write("index.html", "<!doctype html><html><head><title>t</title></head><body></body></html>")
        self.set_config(BASE_CONFIG)

    def write(self, rel, content):
        path = os.path.join(self.dir, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(content)

    def set_config(self, config):
        self.write("vercel.json", json.dumps(config, indent=2))

    def config_with(self, **overrides):
        config = dict(BASE_CONFIG)
        config.update(overrides)
        self.set_config(config)

    def patch_build(self, old, new):
        path = os.path.join(self.dir, "scripts", "vercel-build.sh")
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        assert text.count(old) == 1, f"build anchor {old!r} not found exactly once"
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text.replace(old, new))

    def run_contract(self, *args):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "vercel_static_contract.py"), *args],
            cwd=self.dir, capture_output=True, text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def run_build(self):
        r = subprocess.run(
            ["bash", os.path.join(self.dir, "scripts", "vercel-build.sh")],
            cwd=self.dir, capture_output=True, text=True,
        )
        return r.returncode, r.stdout + r.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class HostPolicyTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_serving_both_hosts_directly_is_valid(self):
        # The state main is in after 4e216de3. The old gate failed this.
        self.fx.config_with(redirects=[])
        code, out = self.fx.run_contract()
        self.assertEqual(code, 0, out)
        self.assertIn("host_policy=serve_both_hosts_directly", out)

    def test_www_to_apex_canonicalization_is_valid(self):
        self.fx.config_with(redirects=[WWW_TO_APEX])
        code, out = self.fx.run_contract()
        self.assertEqual(code, 0, out)
        self.assertIn("host_policy=redirect_www_to_apex", out)

    def test_apex_to_www_canonicalization_is_valid(self):
        self.fx.config_with(redirects=[APEX_TO_WWW])
        code, out = self.fx.run_contract()
        self.assertEqual(code, 0, out)
        self.assertIn("host_policy=redirect_apex_to_www", out)

    def test_both_directions_is_a_redirect_loop(self):
        # VIOLATOR. Declaring both is the one host configuration that is always
        # broken, and nothing downstream of this gate would notice it.
        self.fx.config_with(redirects=[WWW_TO_APEX, APEX_TO_WWW])
        code, out = self.fx.run_contract()
        self.assertEqual(code, 1, out)
        self.assertIn("host_redirect_loop", out)


class ConfigShapeTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_help_prints_the_docstring_without_running(self):
        code, out = self.fx.run_contract("--help")
        self.assertEqual(code, 0, out)
        self.assertIn("Vercel static deployment contract", out)
        self.assertNotIn("VERCEL_STATIC_CONTRACT=", out)

    def test_a_framework_preset_is_rejected(self):
        self.fx.config_with(framework="nextjs")
        code, out = self.fx.run_contract()
        self.assertEqual(code, 1, out)
        self.assertIn("framework_must_be_null", out)

    def test_output_directory_must_be_the_built_one(self):
        self.fx.config_with(outputDirectory=".")
        code, out = self.fx.run_contract()
        self.assertEqual(code, 1, out)
        self.assertIn("outputDirectory_must_be_public", out)

    def test_dropping_vendor_from_the_build_fails_the_contract(self):
        # THE REGRESSION. vendor/ absent from the copy list is what took
        # /vendor/supabase-js.js off the deployment on 127 pages.
        self.fx.patch_build("for dir in vendor i18n", "for dir in i18n")
        code, out = self.fx.run_contract()
        self.assertEqual(code, 1, out)
        self.assertIn("build_marker=", out)

    def test_dropping_the_reachability_check_fails_the_contract(self):
        self.fx.patch_build("unreachable_asset=${ref}", "skipped_asset=${ref}")
        code, out = self.fx.run_contract()
        self.assertEqual(code, 1, out)
        self.assertIn("build_marker=", out)


class BuildOutputTests(unittest.TestCase):
    """The build must refuse to emit an artifact the site cannot run."""

    def setUp(self):
        self.fx = Fixture()
        self.fx.write("vendor/supabase-js.js", "export const createClient = () => {};\n")

    def tearDown(self):
        self.fx.cleanup()

    def test_a_complete_surface_builds(self):
        self.fx.write("app.html", '<!doctype html><html><body><script src="/bg.js"></script></body></html>')
        self.fx.write("bg.js", "// present\n")
        code, out = self.fx.run_build()
        self.assertEqual(code, 0, out)
        self.assertIn("VERCEL_BUILD=PASS", out)
        self.assertTrue(os.path.isfile(os.path.join(self.fx.dir, "public", "vendor", "supabase-js.js")))

    def test_a_dropped_vendor_directory_fails_the_build(self):
        # VIOLATOR. Before this check the same tree printed VERCEL_BUILD=PASS.
        self.fx.patch_build("for dir in vendor i18n", "for dir in i18n")
        code, out = self.fx.run_build()
        self.assertEqual(code, 1, out)
        self.assertIn("public/vendor/supabase-js.js", out)

    def test_a_reference_to_a_file_that_is_not_emitted_fails_the_build(self):
        self.fx.write("app.html", '<!doctype html><html><body><script src="/absent.js"></script></body></html>')
        code, out = self.fx.run_build()
        self.assertEqual(code, 1, out)
        self.assertIn("unreachable_asset=/absent.js", out)

    def test_vercel_edge_paths_are_not_treated_as_missing(self):
        # /_vercel/* is injected by the platform, never built from the repo.
        self.fx.write("app.html", '<!doctype html><html><body><script src="/_vercel/insights/script.js"></script></body></html>')
        code, out = self.fx.run_build()
        self.assertEqual(code, 0, out)
        self.assertIn("VERCEL_BUILD=PASS", out)

    def test_a_missing_language_pack_fails_the_build(self):
        self.fx.write("i18n/fr.json", '{"a":"b"}')
        self.fx.patch_build("for dir in vendor i18n", "for dir in vendor")
        code, out = self.fx.run_build()
        self.assertEqual(code, 1, out)
        self.assertIn("i18n/fr.json", out)


if __name__ == "__main__":
    unittest.main()
