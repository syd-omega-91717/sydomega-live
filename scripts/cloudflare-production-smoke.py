#!/usr/bin/env python3
"""Smoke-test every registered production page and same-origin HTML asset/link."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.parse import urldefrag, urljoin, urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "config/omega-page-contracts.json"
SKIP_SCHEMES = {"data", "blob", "javascript", "mailto", "tel", "sms", "about"}
API_PREFIXES = ("/api/", "/functions/v1/")

class RefParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.refs: set[str] = set()

    def handle_starttag(self, tag: str, attrs) -> None:
        values = dict(attrs)
        if tag in {"a", "area", "link"} and values.get("href"):
            self.refs.add(values["href"].strip())
        for key in ("src", "poster"):
            if values.get(key):
                self.refs.add(values[key].strip())
        if tag == "source" and values.get("srcset"):
            for candidate in values["srcset"].split(","):
                url = candidate.strip().split(" ", 1)[0]
                if url:
                    self.refs.add(url)

def is_safe_http_url(url: str, allowed_host: str | None = None, allowed_port: int | None = None) -> bool:
    """Reject file/custom schemes, credentials and cross-origin redirects."""
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


class SameOriginRedirectHandler(HTTPRedirectHandler):
    def __init__(self, allowed_host: str, allowed_port: int) -> None:
        super().__init__()
        self.allowed_host = allowed_host
        self.allowed_port = allowed_port

    def redirect_request(self, req, fp, code, msg, headers, newurl):
        if not is_safe_http_url(newurl, self.allowed_host, self.allowed_port):
            return None
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def request_url(url: str, method: str, timeout: int) -> tuple[int, str, str]:
    if not is_safe_http_url(url):
        return 0, "", "blocked unsupported URL scheme or authority"
    parts = urlsplit(url)
    allowed_port = parts.port or (443 if parts.scheme.lower() == "https" else 80)
    opener = build_opener(SameOriginRedirectHandler(parts.hostname.lower(), allowed_port))
    req = Request(url, method=method, headers={"User-Agent": "SYD-OMEGA-Production-Smoke/1.0", "Accept": "*/*"})
    try:
        with opener.open(req, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            body = response.read() if method == "GET" else b""
            return response.status, content_type, body.decode("utf-8", errors="replace")
    except HTTPError as exc:
        if method == "HEAD" and exc.code in {405, 501}:
            return request_url(url, "GET", timeout)
        return exc.code, exc.headers.get("Content-Type", "") if exc.headers else "", ""
    except (URLError, TimeoutError, OSError) as exc:
def validate_request_url(url: str) -> str:
    """Allow only HTTPS production/preview hosts; never pass file or arbitrary schemes to urllib."""
    try:
        parts = urlsplit(url)
        port = parts.port
    except ValueError as exc:
        raise ValueError("invalid production smoke URL") from exc
    host = (parts.hostname or "").lower()
    allowed_host = (
        host == "sydomega.com"
        or host.endswith(".sydomega.com")
        or host.endswith(".pages.dev")
        or host.endswith(".vercel.app")
    )
    if (
        parts.scheme.lower() != "https"
        or not parts.netloc
        or parts.username is not None
        or parts.password is not None
        or port not in (None, 443)
        or parts.fragment
        or not allowed_host
    ):
        raise ValueError("production smoke URL must be HTTPS on an approved SYD OMEGA, Pages, or Vercel host")
    return url


def request_url(url: str, method: str, timeout: int, redirects: int = 0) -> tuple[int, str, str]:
    safe_url = validate_request_url(url)
    import requests

    session = requests.Session()
    session.trust_env = False
    try:
        response = session.request(
            method,
            safe_url,
            headers={"User-Agent": "SYD-OMEGA-Production-Smoke/1.0", "Accept": "*/*"},
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
            next_method = "GET" if status == 303 or (status in {301, 302} and method not in {"GET", "HEAD"}) else method
            return request_url(next_url, next_method, timeout, redirects + 1)

        if method == "HEAD" and status in {405, 501}:
            response.close()
            return request_url(safe_url, "GET", timeout, redirects)

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
        registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
        contracts = registry.get("contracts", [])
        if registry.get("page_count") != len(contracts) or not contracts:
            raise ValueError("page contract registry count does not match its records")
        safe_base = validate_request_url(args.base_url)
        base_parts = urlsplit(safe_base)
        if base_parts.query or base_parts.fragment:
            raise ValueError("base URL must not include a query or fragment")
        base = safe_base.rstrip("/") + "/"
        base_host = urlsplit(base).netloc.lower()
        pages = sorted({urljoin(base, str(item["path"]).lstrip("/")) for item in contracts})
        page_failures: list[tuple[str, int, str]] = []
        refs: set[str] = set()
        external_count = 0
        api_count = 0

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
                parser = RefParser()
                parser.feed(body)
                for ref in parser.refs:
                    if not ref or ref.startswith("#"):
                        continue
                    scheme = urlsplit(ref).scheme.lower()
                    if scheme in SKIP_SCHEMES:
                        continue
                    absolute = urldefrag(urljoin(url, ref))[0]
                    parts = urlsplit(absolute)
                    if parts.scheme not in {"http", "https"}:
                        continue
                    if parts.netloc.lower() != base_host:
                        external_count += 1
                        continue
                    if parts.path.startswith(API_PREFIXES):
                        api_count += 1
                        continue
                    refs.add(absolute)

        ref_failures: list[tuple[str, int, str]] = []
        def check_ref(url: str):
            return url, request_url(url, "HEAD", args.timeout)
        with ThreadPoolExecutor(max_workers=args.workers) as pool:
            futures = [pool.submit(check_ref, url) for url in sorted(refs)]
            for future in as_completed(futures):
                url, (status, content_type, detail) = future.result()
                if status not in {200, 206}:
                    ref_failures.append((url, status, detail[:240]))

        summary = {
            "base_url": base.rstrip("/"),
            "registered_pages": len(pages),
            "pages_passed": len(pages) - len(page_failures),
            "same_origin_references_checked": len(refs),
            "references_passed": len(refs) - len(ref_failures),
            "external_references_not_checked": external_count,
            "same_origin_api_references_deferred_to_api_contracts": api_count,
            "page_failures": page_failures[:30],
            "reference_failures": ref_failures[:30],
        }
        print(json.dumps(summary, indent=2))
        if page_failures or ref_failures:
            print("CLOUDFLARE PRODUCTION SMOKE: FAIL")
            return 1
        print("CLOUDFLARE PRODUCTION SMOKE: PASS")
        return 0
    except (OSError, json.JSONDecodeError, KeyError, ValueError) as exc:
        print(f"CLOUDFLARE PRODUCTION SMOKE: FAIL — {exc}")
        return 1

if __name__ == "__main__":
    raise SystemExit(main())
