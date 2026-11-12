#!/usr/bin/env python3
"""Smoke-test every registered production page and same-origin HTML asset/link."""
from __future__ import annotations
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from html.parser import HTMLParser
import json
from pathlib import Path
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urldefrag, urljoin, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
REGISTRY = ROOT / "config/omega-page-contracts.json"
SKIP_SCHEMES = {"data", "blob", "javascript", "mailto", "tel", "sms", "about"}
API_PREFIXES = ("/api/", "/functions/v1/")
CLOUDFLARE_EMAIL_PLACEHOLDER_PATH = "/cdn-cgi/l/email-protection"

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
                # Cloudflare rewrites protected email addresses to this client-decoded
                # placeholder. It is not a page or asset endpoint to crawl with HEAD.
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

def request_url(url: str, method: str, timeout: int) -> tuple[int, str, str]:
    parts = urlsplit(url)
    if parts.scheme.lower() not in {"http", "https"} or not parts.netloc or parts.username or parts.password:
        return 0, "", "unsupported_url_scheme_or_authority"
    req = Request(url, method=method, headers={"User-Agent": "SYD-OMEGA-Production-Smoke/1.0", "Accept": "*/*"})
    try:
        # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
        # The URL is restricted to credential-free HTTP(S) above; the caller also
        # constrains discovered references to the selected production origin.
        with urlopen(req, timeout=timeout) as response:
            content_type = response.headers.get("Content-Type", "")
            body = response.read() if method == "GET" else b""
            return response.status, content_type, body.decode("utf-8", errors="replace")
    except HTTPError as exc:
        if method == "HEAD" and exc.code in {405, 501}:
            return request_url(url, "GET", timeout)
        return exc.code, exc.headers.get("Content-Type", "") if exc.headers else "", ""
    except (URLError, TimeoutError, OSError) as exc:
        return 0, "", str(exc)

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
        base = args.base_url.rstrip("/") + "/"
        base_parts = urlsplit(base)
        if base_parts.scheme.lower() not in {"http", "https"} or not base_parts.netloc or base_parts.username or base_parts.password:
            raise ValueError("--base-url must be a credential-free HTTP(S) URL")
        base_host = base_parts.netloc.lower()
        pages = sorted({urljoin(base, str(item["path"]).lstrip("/")) for item in contracts})
        page_failures: list[tuple[str, int, str]] = []
        refs: set[str] = set()
        external_count = 0
        api_count = 0
        cloudflare_email_placeholders_skipped = 0

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
                cloudflare_email_placeholders_skipped += parser.cloudflare_email_placeholders_skipped
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
            "cloudflare_email_placeholders_skipped": cloudflare_email_placeholders_skipped,
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
