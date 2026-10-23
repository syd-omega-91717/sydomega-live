import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location(
    "production_http_evidence", ROOT / "production-http-evidence.py"
)
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)

SHA_A = "a" * 40
SHA_B = "b" * 40


def response(url, *, status=200, headers=None, body=b""):
    return status, headers or {}, body, url


class ProductionHttpEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.manifest = json.dumps({
            "schema_version": 1,
            "project": "SYD OMEGA 91717",
            "commit_sha": SHA_A,
            "ref": "main",
            "source": "cloudflare-pages-git",
        }).encode()
        self.root_headers = {
            "content-type": "text/html; charset=utf-8",
            "content-security-policy": "default-src 'self'",
            "strict-transport-security": "max-age=63072000",
            "x-content-type-options": "nosniff",
            "x-frame-options": "DENY",
            "referrer-policy": "strict-origin-when-cross-origin",
        }
        self.manifest_headers = {
            "content-type": "application/json",
            "cache-control": "no-store, no-cache, must-revalidate, max-age=0",
        }

    def opener_for(self, root_headers=None, manifest_body=None, manifest_headers=None, manifest_status=200):
        root_headers = self.root_headers if root_headers is None else root_headers
        manifest_body = self.manifest if manifest_body is None else manifest_body
        manifest_headers = self.manifest_headers if manifest_headers is None else manifest_headers

        def opener(url):
            if url.endswith("/"):
                return response(url, headers=root_headers, body=b"<!doctype html><html></html>")
            return response(url, status=manifest_status, headers=manifest_headers, body=manifest_body)
        return opener

    def test_valid_origin_and_expected_release_pass(self):
        result = probe.audit_origin(
            "https://example.test", expected_sha=SHA_A, opener=self.opener_for()
        )
        self.assertTrue(result["passed"], result["failures"])
        self.assertEqual(result["manifest"]["commit_sha"], SHA_A)

    def test_expected_commit_mismatch_fails(self):
        result = probe.audit_origin(
            "https://example.test", expected_sha=SHA_B, opener=self.opener_for()
        )
        self.assertFalse(result["passed"])
        self.assertIn("expected_release_sha", {item["name"] for item in result["failures"]})

    def test_missing_security_header_fails(self):
        headers = dict(self.root_headers)
        headers.pop("content-security-policy")
        result = probe.audit_origin(
            "https://example.test", opener=self.opener_for(root_headers=headers)
        )
        self.assertFalse(result["passed"])
        self.assertIn("header_content_security_policy", {item["name"] for item in result["failures"]})

    def test_cacheable_release_manifest_fails(self):
        headers = {"content-type": "application/json", "cache-control": "public, max-age=3600"}
        result = probe.audit_origin(
            "https://example.test", opener=self.opener_for(manifest_headers=headers)
        )
        self.assertFalse(result["passed"])
        self.assertIn("manifest_not_cached", {item["name"] for item in result["failures"]})

    def test_invalid_manifest_fails(self):
        result = probe.audit_origin(
            "https://example.test", opener=self.opener_for(manifest_body=b"{broken")
        )
        self.assertFalse(result["passed"])
        self.assertIn("manifest_schema", {item["name"] for item in result["failures"]})

    def test_non_https_origin_is_rejected_without_network(self):
        result = probe.audit_origin("http://example.test", opener=lambda _: self.fail("network must not run"))
        self.assertFalse(result["passed"])
        self.assertEqual(result["failures"][0]["name"], "origin_url")

    def test_redirect_to_unlisted_host_fails(self):
        def opener(url):
            final = "https://untrusted.example/"
            if url.endswith("/"):
                return response(final, headers=self.root_headers, body=b"<!doctype html><html></html>")
            return response(final, headers=self.manifest_headers, body=self.manifest)
        result = probe.audit_origin(
            "https://example.test",
            opener=opener,
            allowed_hosts={"example.test"},
        )
        self.assertFalse(result["passed"])
        names = {item["name"] for item in result["failures"]}
        self.assertIn("redirect_host_allowed", names)
        self.assertIn("manifest_redirect_host_allowed", names)

    def test_unexpected_http_status_fails(self):
        def opener(url):
            if url.endswith("/"):
                return response(url, status=503, headers=self.root_headers, body=b"")
            return response(url, headers=self.manifest_headers, body=self.manifest)
        result = probe.audit_origin("https://example.test", opener=opener)
        self.assertFalse(result["passed"])
        self.assertIn("root_http", {item["name"] for item in result["failures"]})


if __name__ == "__main__":
    unittest.main()
