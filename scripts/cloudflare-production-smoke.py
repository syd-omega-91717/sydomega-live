#!/usr/bin/env python3
"""Smoke-test registered production pages and same-origin HTML assets safely."""
from __future__ import annotations

import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import hashlib
import json
from pathlib import Path
import sys
from urllib.parse import urldefrag, urljoin, urlsplit

try:
    import requests
except ImportError:  # Unit tests can inspect URL policy without the CI-only HTTP client.
    requests = None

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "config/omega-page-contracts.json"
SKIP_SCHEMES = {"data", "blob", "javascript", "mailto", "tel", "sms", "about"}
API_PREFIXES = ("/api/", "/functions/v1/")
CLOUDFLARE_EMAIL_PLACEHOLDER_PATH = "/cdn-cgi/l/email-protection"
ALLOWED_HOST_SUFFIXES = (".sydomega.com", ".pages.dev", ".vercel.app")
ALLOWED_ROOT_HOSTS = {"sydomega.com"}
REQUEST_HEADERS = {
    # Cloudflare bot management treated the bespoke CI-only user agent differently
    # from a real browser. Keep the same strict URL/redirect checks while presenting
    # a normal browser request profile for public static assets.
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    "Accept": "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    # requests reliably decodes gzip/deflate; do not negotiate Brotli without
    # a guaranteed decoder in the pinned smoke-client environment.
    "Accept-Encoding": "gzip, deflate",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

REQUIRED_GLOBAL_ASSETS = (
    # These are content markers, not cache keys. The production build rewrites
    # every local CSS/JS query fingerprint to the current commit SHA.
    ("/bg.js", "javascript", "omega-platform-experience-v5.css"),
    (
        "/omega-platform-experience-v4.css",
        "text/css",
        "Ω SYD OMEGA 91717 — PLATFORM EXPERIENCE V4",
    ),
    (
        "/omega-platform-experience-v5.css",
        "text/css",
        "Ω SYD OMEGA 91717 — PLATFORM EXPERIENCE V5",
    ),
    ("/bg.js", "javascript", "omega-domain-hub.css"),
    (
        "/omega-domain-hubs.js",
        "javascript",
        "Ω SYD OMEGA 91717 — DOMAIN HUB WORKSPACES",
    ),
    (
        "/omega-domain-hub.css",
        "text/css",
        "Ω SYD OMEGA 91717 — DOMAIN HUB WORKSPACES",
    ),
)


class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: set[str] = set()
        self.cloudflare_email_placeholders_skipped = 0

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if tag in {"a", "area", "link"} and values.get("href"):
            href = values["href"].strip()
            if urlsplit(href).path == CLOUDFLARE_EMAIL_PLACEHOLDER_PATH:
                self.cloudflare_email_placeholders_skipped += 1
            else:
                self.refs.add(href)
        for key in ("src", "poster"):
            if values.get(key):
                self.refs.add(values[key].strip())
        if tag == "source" and values.get("srcset"):
            for candidate in values["srcset"].split(","):
                url = candidate.strip().split(" ", 1)[0]
                if url:
                    self.refs.add(url)

def is_safe_http_url(
    url: str, allowed_host: str | None = None, allowed_port: int | None = None
) -> bool:
    """Reject unsafe schemes, credentials and optionally cross-origin hosts."""
    try:
        parts = urlsplit(url)
        port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
    except ValueError:
        return False
    return (
        parts.scheme.lower() in {"http", "https"}
        and bool(parts.hostname)
        and not parts.username
        and not parts.password
        and (allowed_host is None or parts.hostname.lower() == allowed_host.lower())
        and (allowed_port is None or port == allowed_port)
    )


class SameOriginRedirectHandler:
    """Small compatibility guard used by unit tests and redirect policy checks."""

    def __init__(self, allowed_host: str, allowed_port: int) -> None:
        self.allowed_host = allowed_host.lower()
        self.allowed_port = allowed_port

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not is_safe_http_url(newurl, self.allowed_host, self.allowed_port):
            return None
        return req


def validate_request_url(url: str) -> str:
    """Allow only HTTPS on the platform's known production/preview host families."""
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError as exc:
        raise ValueError("invalid production smoke URL") from exc
    host = (parts.hostname or "").lower()
    approved_host = host in ALLOWED_ROOT_HOSTS or any(
        host.endswith(suffix) for suffix in ALLOWED_HOST_SUFFIXES
    )
    if (
        parts.scheme.lower() != "https"
        or not parts.netloc
        or parts.username is not None
        or parts.password is not None
        or port not in (None, 443)
        or parts.fragment
        or not approved_host
    ):
        raise ValueError(
            "production smoke URL must be HTTPS on an approved SYD OMEGA, Pages, or Vercel host"
        )
    return url


def request_url(
    url: str, method: str, timeout: int, redirects: int = 0,
    _origin: tuple[str, int] | None = None,
) -> tuple[int, str, str]:
    """Request a URL without proxy-env inheritance or cross-origin redirects."""
    try:
        safe_url = validate_request_url(url)
        parts = urlsplit(safe_url)
        port = parts.port or 443
        origin = _origin or (parts.hostname.lower(), port)
        if (parts.hostname.lower(), port) != origin:
            return 0, "", "cross_origin_redirect_blocked"
    except (TypeError, ValueError):
        return 0, "", "unsupported_url_scheme_or_authority"

    if requests is None:
        return 0, "", "requests dependency is not installed; install scripts/requirements.txt"
    session = requests.Session()
    session.trust_env = False
    try:
        response = session.request(
            method,
            safe_url,
            headers=REQUEST_HEADERS,
            timeout=timeout,
            allow_redirects=False,
            verify=True,
        )
        status = response.status_code
        content_type = response.headers.get("Content-Type", "")
        if status in {301, 302, 303, 307, 308}:
            location = response.headers.get("Location")
            response.close()
            if not location:
                return status, content_type, "redirect response has no Location header"
            if redirects >= 5:
                return status, content_type, "redirect limit exceeded"
            next_url = urljoin(safe_url, location)
            next_parts = urlsplit(next_url)
            next_port = next_parts.port or 443
            if (next_parts.hostname or "").lower() != origin[0] or next_port != origin[1]:
                return status, content_type, "cross_origin_redirect_blocked"
            next_method = (
                "GET" if status == 303 or (status in {301, 302} and method not in {"GET", "HEAD"})
                else method
            )
            return request_url(next_url, next_method, timeout, redirects + 1, origin)
        if method == "HEAD" and status in {405, 501}:
            response.close()
            return request_url(safe_url, "GET", timeout, redirects, origin)
        body = response.text if method == "GET" else ""
        response.close()
        return status, content_type, body
    except requests.RequestException as exc:
        return 0, "", str(exc)
    finally:
        session.close()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="https://sydomega.com")
    parser.add_argument("--workers", type=int, default=12)
    parser.add_argument("--timeout", type=int, default=20)
    args = parser.parse_args()
    try:
        safe_base = validate_request_url(args.base_url)
        base_parts = urlsplit(safe_base)
        if base_parts.query or base_parts.fragment:
            raise ValueError("base URL must not include a query or fragment")
        base = safe_base.rstrip("/") + "/"
        base_host = base_parts.netloc.lower()
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
        contracts = registry.get("contracts", [])
        if registry.get("page_count") != len(contracts) or not contracts:
            raise ValueError("page contract registry count does not match its records")
        pages = sorted({urljoin(base, str(item["path"]).lstrip("/")) for item in contracts})
        page_failures: list[tuple[str, int, str]] = []
        refs: set[str] = set()
        external_count = 0
        api_count = 0
        placeholders_skipped = 0

        def fetch_page(url: str):
            return url, request_url(url, "GET", args.timeout)

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(fetch_page, url) for url in pages]
            for future in as_completed(futures):
                url, (status, content_type, body) = future.result()
                if status != 200:
                    page_failures.append((url, status, body[:240]))
                    continue
                if "html" not in content_type.lower():
                    page_failures.append((url, status, f"unexpected content type: {content_type}"))
                    continue
                ref_parser = RefParser()
                ref_parser.feed(body)
                placeholders_skipped += ref_parser.cloudflare_email_placeholders_skipped
                for ref in ref_parser.refs:
                    if not ref or ref.startswith("#") or urlsplit(ref).scheme.lower() in SKIP_SCHEMES:
                        continue
                    absolute = urldefrag(urljoin(url, ref))[0]
                    parts = urlsplit(absolute)
                    if parts.scheme.lower() not in {"http", "https"}:
                        continue
                    if parts.netloc.lower() != base_host:
                        external_count += 1
                        continue
                    if parts.path.startswith(API_PREFIXES):
                        api_count += 1
                        continue
                    refs.add(absolute)

        global_asset_failures: list[tuple[str, int, str]] = []
        for path, expected_type, marker in REQUIRED_GLOBAL_ASSETS:
            asset_url = urljoin(base, path.lstrip("/"))
            status, content_type, body = request_url(asset_url, "GET", args.timeout)
            valid_type = expected_type in content_type.lower()
            if status != 200 or not valid_type or marker not in body:
                body_bytes = body.encode("utf-8", errors="replace")
                body_prefix = repr(body[:180])
                body_sha256 = hashlib.sha256(body_bytes).hexdigest()
                global_asset_failures.append((
                    asset_url,
                    status,
                    f"type={content_type}; body_bytes={len(body_bytes)}; "
                    f"marker_present={marker in body}; sha256={body_sha256}; "
                    f"body_prefix={body_prefix}",
                ))

        ref_failures: list[tuple[str, int, str]] = []
        def check_ref(url: str):
            return url, request_url(url, "HEAD", args.timeout)

        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(check_ref, url) for url in sorted(refs)]
            for future in as_completed(futures):
                url, (status, _, detail) = future.result()
                if status not in {200, 206}:
                    ref_failures.append((url, status, detail[:240]))

        summary = {
            "base_url": base.rstrip("/"),
            "registered_pages": len(pages),
            "pages_passed": len(pages) - len(page_failures),
            "same_origin_references_checked": len(refs),
            "required_global_assets_checked": len(REQUIRED_GLOBAL_ASSETS),
            "required_global_asset_failures": global_asset_failures[:20],
            "references_passed": len(refs) - len(ref_failures),
            "external_references_not_checked": external_count,
            "same_origin_api_references_deferred_to_api_contracts": api_count,
            "cloudflare_email_placeholders_skipped": placeholders_skipped,
            "page_failures": page_failures[:30],
            "reference_failures": ref_failures[:30],
        }
        print(json.dumps(summary, indent=2))
        if page_failures or ref_failures or global_asset_failures:
            print("CLOUDFLARE PRODUCTION SMOKE: FAIL")
            return 1
        print("CLOUDFLARE PRODUCTION SMOKE: PASS")
        return 0
    except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
        print(f"CLOUDFLARE PRODUCTION SMOKE: FAIL — {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
