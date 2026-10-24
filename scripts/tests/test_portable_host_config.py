"""vercel.json and the generated _headers/_redirects must say the same thing.

Cloudflare Pages reads only _headers/_redirects, so a rule that the generator
drops or mistranslates would vanish from production without failing a build.
"""
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("phc", ROOT / "scripts" / "portable-host-config.py")
phc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(phc)


class PortableHostConfigTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        self.headers, self.redirects = phc.build(self.config)

    def test_every_header_value_is_carried(self):
        for rule in self.config["headers"]:
            for h in rule["headers"]:
                self.assertIn(f"{h['key']}: {h['value']}", self.headers, rule["source"])

    def test_release_manifest_is_explicitly_non_cacheable_on_pages(self):
        rule = next(
            (rule for rule in self.config["headers"]
             if rule["source"] == "/.well-known/omega-release.json"),
            None,
        )
        self.assertIsNotNone(rule, "release manifest requires an exact-path cache rule")
        cache_control = next(
            (h["value"] for h in rule["headers"] if h["key"].lower() == "cache-control"),
            None,
        )
        self.assertEqual(
            cache_control,
            "no-store, no-cache, must-revalidate, max-age=0",
            "release manifest must not inherit the general static-asset cache policy",
        )
        block = self.headers.split("\n/.well-known/omega-release.json\n", 1)[1].split("\n/", 1)[0]
        self.assertIn("! Cache-Control", block)
        self.assertIn("Cache-Control: no-store, no-cache, must-revalidate, max-age=0", block)
        self.assertLess(
            block.index("! Cache-Control"),
            block.index("Cache-Control: no-store, no-cache, must-revalidate, max-age=0"),
        )

    def test_security_headers_apply_to_every_path(self):
        block = self.headers.split("\n/*\n", 1)[1].split("\n/", 1)[0]
        for key in ("Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options"):
            self.assertIn(key + ":", block)

    def test_overridden_header_is_detached_first(self):
        sw = self.headers.split("\n/sw.js\n", 1)[1].split("\n/", 1)[0]
        self.assertIn("! Cache-Control", sw)
        self.assertLess(sw.index("! Cache-Control"), sw.index("Cache-Control: no-cache"))

    def test_every_redirect_and_its_html_twin(self):
        lines = set(self.redirects.splitlines())
        for r in self.config["redirects"]:
            code = "301" if r.get("permanent", True) else "302"
            sources = {l.split()[0] for l in lines if not l.startswith("#")}
            self.assertIn(r["source"], sources)
            if "." not in r["source"].rsplit("/", 1)[-1]:
                self.assertIn(f"{r['source']}.html {r['destination']} {code}", lines)

    def test_untranslatable_source_fails(self):
        bad = {"headers": [{"source": "/(?!api)(.*)", "headers": [{"key": "X", "value": "1"}]}]}
        with self.assertRaises(ValueError):
            phc.build(bad)

    def test_within_cloudflare_rule_limit(self):
        self.assertLessEqual(sum(1 for l in self.headers.splitlines() if l.startswith("/")), 100)


if __name__ == "__main__":
    unittest.main()
