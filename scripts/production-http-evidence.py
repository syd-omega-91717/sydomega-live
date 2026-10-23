#!/usr/bin/env python3
"""Read-only independent production evidence probe for SYD OMEGA 91717.

Checks public HTTPS delivery, release-manifest validity/parity, and critical
response headers. It does not deploy, authenticate, mutate data, or claim that
signed-in flows work. Run with --expected-sha to verify a specific release.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

DEFAULT_ORIGINS = ("https://sydomega.com", "https://www.sydomega.com", "https://sydomega.pages.dev")
RELEASE_PATH = "/.well-known/omega-release.json"
REQUIRED_HEADERS = {
    "content-security-policy": "CSP",
    "strict-transport-security": "HSTS",
    "x-content-type-options": "X-Content-Type-Options",
    "x-frame-options": "X-Frame-Options",
    "referrer-policy": "Referrer-Policy",
}
SHA_RE = re.compile(r"^[0-9a-f]{40}$")


def fetch(url: str, timeout: float = 12.0) -> tuple[int, dict[str, str], bytes, str]:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("only credential-free HTTPS URLs are allowed")
    request = Request(url, headers={"User-Agent": "SYD-OMEGA-Production-Evidence/1.0", "Accept": "text/html,application/json"})
    with urlopen(request, timeout=timeout) as response:
        return (
            int(response.status),
            {key.lower(): value.strip() for key, value in response.headers.items()},
            response.read(2_000_001),
            response.geturl(),
        )


def audit_origin(base_url: str, expected_sha: str | None = None, opener=fetch, allowed_hosts: set[str] | None = None) -> dict:
    base = base_url.rstrip("/")
    parsed = urlparse(base)
    result = {"origin": base, "checks": [], "failures": [], "manifest": None}

    def check(name: str, passed: bool, detail: str) -> None:
        result["checks"].append({"name": name, "passed": bool(passed), "detail": detail})
        if not passed:
            result["failures"].append({"name": name, "detail": detail})

    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        check("origin_url", False, "origin must be an HTTPS URL without embedded credentials")
        result["passed"] = False
        return result
    check("origin_url", True, "HTTPS origin syntax is valid")

    try:
        status, headers, body, final_url = opener(base + "/")
        final = urlparse(final_url)
        check("root_http", 200 <= status < 300, f"status={status}")
        check("redirect_stays_https", final.scheme == "https", f"final_url={final_url}")
        permitted_hosts = allowed_hosts or {parsed.hostname.lower()}
        check("redirect_host_allowed", bool(final.hostname and final.hostname.lower() in permitted_hosts), f"final_host={final.hostname or 'missing'}")
        check("root_html", "text/html" in headers.get("content-type", "").lower(), f"content_type={headers.get('content-type', 'missing')}")
        html_marker = b"<!doctype html" in body.lower() or b"<html" in body.lower()
        check("root_html_marker", html_marker, "HTML document marker present" if html_marker else "HTML document marker missing")
        for header, label in REQUIRED_HEADERS.items():
            value = headers.get(header, "")
            check("header_" + header.replace("-", "_"), bool(value), f"{label}={'present' if value else 'missing'}")
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        check("root_request", False, f"{type(exc).__name__}: {exc}")
        result["passed"] = False
        return result

    manifest_url = urljoin(base + "/", RELEASE_PATH.lstrip("/"))
    try:
        status, headers, body, final_url = opener(manifest_url)
        final = urlparse(final_url)
        check("manifest_http", status == 200, f"status={status}")
        check("manifest_redirect_stays_https", final.scheme == "https", f"final_url={final_url}")
        permitted_hosts = allowed_hosts or {parsed.hostname.lower()}
        check("manifest_redirect_host_allowed", bool(final.hostname and final.hostname.lower() in permitted_hosts), f"final_host={final.hostname or 'missing'}")
        check("manifest_json", "application/json" in headers.get("content-type", "").lower(), f"content_type={headers.get('content-type', 'missing')}")
        cache = headers.get("cache-control", "").lower()
        check("manifest_not_cached", "no-store" in cache or "no-cache" in cache, f"cache_control={cache or 'missing'}")
        try:
            manifest = json.loads(body.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError) as exc:
            manifest = None
            check("manifest_schema", False, f"invalid JSON: {exc}")
        if manifest is not None:
            valid = (
                isinstance(manifest, dict)
                and manifest.get("schema_version") == 1
                and manifest.get("project") == "SYD OMEGA 91717"
                and isinstance(manifest.get("commit_sha"), str)
                and bool(SHA_RE.fullmatch(manifest["commit_sha"]))
            )
            check("manifest_schema", valid, "schema/project/40-character commit SHA validated" if valid else "schema, project, or commit SHA is invalid")
            result["manifest"] = {
                "commit_sha": manifest.get("commit_sha"),
                "ref": manifest.get("ref"),
                "source": manifest.get("source"),
            }
            if expected_sha:
                actual = manifest.get("commit_sha")
                check("expected_release_sha", actual == expected_sha, f"expected={expected_sha} actual={actual}")
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
        check("manifest_request", False, f"{type(exc).__name__}: {exc}")

    result["passed"] = not result["failures"]
    return result


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", action="append", dest="origins", help="HTTPS origin to probe; repeat for cross-host parity")
    parser.add_argument("--expected-sha", help="expected 40-character release commit SHA")
    parser.add_argument("--timeout", type=float, default=12.0, help="per-request timeout in seconds (default: 12)")
    parser.add_argument("--json", action="store_true", help="emit machine-readable JSON")
    args = parser.parse_args(argv)

    expected = args.expected_sha.lower() if args.expected_sha else None
    if expected and not SHA_RE.fullmatch(expected):
        parser.error("--expected-sha must be a 40-character hexadecimal commit SHA")
    origins = args.origins or list(DEFAULT_ORIGINS)
    allowed_hosts = {urlparse(origin.rstrip("/")).hostname.lower() for origin in origins if urlparse(origin.rstrip("/")).hostname}
    results = []
    for origin in origins:
        def timed_fetch(url: str, timeout: float = args.timeout):
            return fetch(url, timeout=timeout)
        results.append(audit_origin(origin, expected, timed_fetch, allowed_hosts=allowed_hosts))

    manifests = [item["manifest"] for item in results if item.get("manifest")]
    if len(results) > 1 and len(manifests) == len(results):
        shas = {item.get("commit_sha") for item in manifests}
        parity = len(shas) == 1
        for item in results:
            item["checks"].append({"name": "cross_origin_release_parity", "passed": parity, "detail": "all supplied origins serve the same commit" if parity else "origins serve different commit SHAs"})
            if not parity:
                item["failures"].append({"name": "cross_origin_release_parity", "detail": "origins serve different commit SHAs"})
                item["passed"] = False

    report = {
        "schema_version": 1,
        "probe": "SYD OMEGA 91717 independent production evidence",
        "read_only": True,
        "origins_checked": len(results),
        "passed": all(item["passed"] for item in results),
        "results": results,
    }
    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        for item in results:
            print(f"ORIGIN {'PASS' if item['passed'] else 'FAIL'} {item['origin']}")
            for check_item in item["checks"]:
                print(f"  {'PASS' if check_item['passed'] else 'FAIL'} {check_item['name']}: {check_item['detail']}")
        print(f"PRODUCTION_EVIDENCE={'PASS' if report['passed'] else 'FAIL'} origins={len(results)}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
