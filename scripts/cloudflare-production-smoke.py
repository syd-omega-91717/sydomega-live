#!/usr/bin/env python3
"""Smoke-test every registered production page and same-origin HTML asset/link."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
from http.client import HTTPSConnection, HTTPException
import ssl
import json
from pathlib import Path
import sys
from urllib.parse import urldefrag, urljoin, urlsplit

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
    parts = urlsplit(safe_url)
    host = parts.hostname
    if host is None:
        return 0, "", "missing hostname"
    target = parts.path or "/"
    if parts.query:
        target += "?" + parts.query
    connection = HTTPSConnection(
        host,
        parts.port or 443,
        timeout=timeout,
        context=ssl.create_default_context(),
    )
    try:
        connection.request(
            method,
            target,
            headers={"User-Agent": "SYD-OMEGA-Production-Smoke/1.0", "Accept": "*/*"},
        )
        response = connection.getresponse()
        content_type = response.getheader("Content-Type", "")
        status = response.status

        if status in {301, 302, 303, 307, 308}:
            location = response.getheader("Location")
            response.read()
            if not location:
                return status, content_type, "redirect response has no Location header"
            if redirects >= 5:
                return status, content_type, "redirect limit exceeded"
            next_url = urljoin(safe_url, location)
            next_method = "GET" if status == 303 or (status in {301, 302} and method not in {"GET", "HEAD"}) else method
            return request_url(next_url, next_method, timeout, redirects + 1)

        if method == "HEAD" and status in {405, 501}:
            response.read()
            return request_url(safe_url, "GET", timeout, redirects)

        body = response.read() if method == "GET" else b""
        return status, content_type, body.decode("utf-8", errors="replace")
    except (HTTPException, TimeoutError, OSError) as exc:
        return 0, "", str(exc)
    finally:
        connection.close()

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
