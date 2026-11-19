from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "version-static-assets.py"
BUILD = (ROOT / "scripts" / "vercel-build.sh").read_text(encoding="utf-8")
VERCELIGNORE = (ROOT / ".vercelignore").read_text(encoding="utf-8")
VERSION = "89aed3dbce68"


class StaticAssetVersioningTests(unittest.TestCase):
    def run_versioner(self, public: Path, absolute: bool = False):
        env = os.environ.copy()
        env.pop("OMEGA_ASSET_VERSION_ABSOLUTE", None)
        env["OMEGA_PUBLIC_DIR"] = str(public)
        env["OMEGA_ASSET_VERSION"] = VERSION
        if absolute:
            env["OMEGA_ASSET_VERSION_ABSOLUTE"] = "1"
        return subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=ROOT,
            env=env,
            check=True,
            capture_output=True,
            text=True,
        )

    def test_versions_html_assets_and_dynamic_javascript_loaders(self):
        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            assets = public / "assets"
            assets.mkdir(parents=True)
            (assets / "site.css").write_text("body { color: black; }", encoding="utf-8")
            (public / "bg.js").write_text(
                "const script = document.createElement('script'); "
                "script.src = '/omega-sculpture.js'; "
                "import('./vendor-runtime.js'); "
                "const external = 'https://cdn.example.test/app.js';",
                encoding="utf-8",
            )
            (public / "omega-sculpture.js").write_text("window.signet = true;", encoding="utf-8")
            (public / "vendor-runtime.js").write_text("window.vendor = true;", encoding="utf-8")
            html = (
                '<link rel="stylesheet" href="/assets/site.css?theme=dark">'
                '<script src="/bg.js?v=old"></script>'
                '<a href="/search.html">Search</a>'
                '<script>const local = "/omega-sculpture.js";</script>'
            )
            (public / "index.html").write_text(html, encoding="utf-8")

            result = self.run_versioner(public)
            rendered_html = (public / "index.html").read_text(encoding="utf-8")
            rendered_js = (public / "bg.js").read_text(encoding="utf-8")

            self.assertIn(f"/assets/site.css?theme=dark&v={VERSION}", rendered_html)
            self.assertIn(f"/bg.js?v={VERSION}", rendered_html)
            self.assertIn('href="/search.html"', rendered_html)
            self.assertIn(f"/omega-sculpture.js?v={VERSION}", rendered_html)
            self.assertIn(f"/omega-sculpture.js?v={VERSION}", rendered_js)
            self.assertIn(f"./vendor-runtime.js?v={VERSION}", rendered_js)
            self.assertIn("https://cdn.example.test/app.js", rendered_js)
            self.assertIn(f"ASSET_VERSION={VERSION}", result.stdout)
            self.assertIn("ASSET_REFERENCES_VERSIONED=", result.stdout)

    def test_versioning_is_idempotent_and_replaces_old_fingerprint(self):
        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            public.mkdir()
            (public / "app.js").write_text("window.app = true;", encoding="utf-8")
            (public / "index.html").write_text(
                '<script src="/app.js?v=previous"></script>', encoding="utf-8"
            )
            self.run_versioner(public)
            self.run_versioner(public)
            html = (public / "index.html").read_text(encoding="utf-8")
            self.assertEqual(html.count(f"v={VERSION}"), 1)
            self.assertNotIn("v=previous", html)




    def test_versions_bare_local_css_filenames_used_by_runtime_loaders(self):
        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            public.mkdir()
            (public / "omega-visual-universe.css").write_text("body {}", encoding="utf-8")
            (public / "omega-visual-runtime.js").write_text(
                "addSheet('omega-visual-runtime-css', 'omega-visual-universe.css');",
                encoding="utf-8",
            )
            result = self.run_versioner(public)
            runtime = (public / "omega-visual-runtime.js").read_text(encoding="utf-8")
            self.assertIn(f"omega-visual-universe.css?v={VERSION}", runtime)
            self.assertIn("ASSET_REFERENCES_UNVERSIONED=0", result.stdout)

    def test_versions_same_origin_absolute_assets_in_production_mode(self):
        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            public.mkdir()
            (public / "omega-page-elevation.css").write_text("body {}", encoding="utf-8")
            (public / "bg.js").write_text(
                "const signet = 'https://www.sydomega.com/omega-sculpture.js'; "
                "const external = 'https://cdn.example.test/external.js';",
                encoding="utf-8",
            )
            (public / "omega-sculpture.js").write_text("window.signet = true;", encoding="utf-8")
            (public / "index.html").write_text(
                '<link href="https://www.sydomega.com/omega-page-elevation.css">'
                '<script src="https://sydomega.com/bg.js"></script>',
                encoding="utf-8",
            )
            result = self.run_versioner(public, absolute=True)
            html = (public / "index.html").read_text(encoding="utf-8")
            js = (public / "bg.js").read_text(encoding="utf-8")
            self.assertIn(f"https://www.sydomega.com/omega-page-elevation.css?v={VERSION}", html)
            self.assertIn(f"https://sydomega.com/bg.js?v={VERSION}", html)
            self.assertIn(f"https://www.sydomega.com/omega-sculpture.js?v={VERSION}", js)
            self.assertIn("https://cdn.example.test/external.js", js)
            self.assertIn("ASSET_REFERENCES_UNVERSIONED=0", result.stdout)

    def test_preview_does_not_rewrite_absolute_production_asset_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            public = Path(tmp) / "public"
            public.mkdir()
            (public / "app.css").write_text("body {}", encoding="utf-8")
            (public / "index.html").write_text(
                '<link href="https://www.sydomega.com/app.css">', encoding="utf-8"
            )
            self.run_versioner(public, absolute=False)
            html = (public / "index.html").read_text(encoding="utf-8")
            self.assertIn('href="https://www.sydomega.com/app.css"', html)
            self.assertNotIn(f"app.css?v={VERSION}", html)

    def test_vercel_upload_includes_the_build_time_versioner(self):
        self.assertIn("!scripts/version-static-assets.py", VERCELIGNORE)
        self.assertIn("!scripts/portable-host-config.py", VERCELIGNORE)

    def test_build_runs_asset_versioning_after_html_enhancement(self):
        enhancer = BUILD.index("node scripts/vercel-build-enhance.mjs")
        vendor_copy = BUILD.index("for dir in vendor i18n; do")
        versioner = BUILD.index("python3 scripts/version-static-assets.py")
        reference_scan = BUILD.index("missing_refs=0")
        self.assertLess(enhancer, vendor_copy)
        self.assertLess(vendor_copy, versioner)
        self.assertLess(versioner, reference_scan)
        self.assertIn('if [[ "${CF_PAGES_BRANCH:-}" == "main" || "${VERCEL_ENV:-}" == "production" ]]; then', BUILD)
        self.assertIn("export OMEGA_ASSET_VERSION_ABSOLUTE=1", BUILD)
        self.assertIn('OMEGA_ASSET_VERSION_ABSOLUTE: "1"', WORKFLOW)


if __name__ == "__main__":
    unittest.main()
