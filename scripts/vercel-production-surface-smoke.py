#!/usr/bin/env python3
"""Verify every HTML page emitted by the production build is reachable on the live host.

This is a route-availability smoke test, not a substitute for browser interaction,
authenticated-flow, API-contract, or visual regression testing.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import http.client
import html
import re
import ssl
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = Path(os.environ.get("OMEGA_PUBLIC_DIR", ROOT / "public")).resolve()
BASE_URL = os.environ.get("OMEGA_PRODUCTION_BASE_URL", "https://sydomega.com").rstrip("/")
WORKERS = max(1, min(int(os.environ.get("OMEGA_SMOKE_WORKERS", "12")), 24))
TIMEOUT = max(3, min(int(os.environ.get("OMEGA_SMOKE_TIMEOUT", "20")), 60))
RETRIES = max(0, min(int(os.environ.get("OMEGA_SMOKE_RETRIES", "2")), 5))
EXCLUDED = {"404.html", "500.html"}


def route_for(path: Path) -> str | None:
    relative = path.relative_to(PUBLIC).as_posix()
    if relative in EXCLUDED or relative.rsplit("/", 1)[-1].startswith("_"):
        return None
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")].rstrip("/")
    if relative.endswith(".html"):
        return "/" + relative[:-5]
    return None



def page_identity(body: bytes | str) -> tuple[str, str]:
    """Return stable title and omega realm markers from an HTML document."""
    text = body.decode("utf-8", errors="replace") if isinstance(body, bytes) else body
    title_match = re.search(r"<title\\b[^>]*>(.*?)</title\\s*>", text, re.IGNORECASE | re.DOTALL)
    title = ""
    if title_match:
        raw_title = re.sub(r"<[^>]+>", " ", title_match.group(1))
        title = " ".join(html.unescape(raw_title).split()).casefold()
    realm_match = re.search(r"\\bdata-omega-realm\\s*=\\s*['\"]([^'\"]+)['\"]", text, re.IGNORECASE)
    realm = realm_match.group(1).strip().casefold() if realm_match else ""
    return title, realm


def identity_mismatch(expected_body: bytes, actual_body: bytes, route: str) -> str | None:
    """Reject a successful HTTP response that serves a different page identity."""
    expected_title, expected_realm = page_identity(expected_body)
    actual_title, actual_realm = page_identity(actual_body)
    if expected_realm and actual_realm != expected_realm:
        return f"{route} page_realm_mismatch expected={expected_realm!r} actual={actual_realm or 'missing'!r}"
    if expected_title and actual_title != expected_title:
        return f"{route} page_title_mismatch expected={expected_title!r} actual={actual_title or 'missing'!r}"
    if not expected_realm and not expected_title:
        return f"{route} expected_page_identity_missing"
    return None
def check_route(route: str, expected_host: str, expected_body: bytes) -> tuple[bool, str]:
    request_path = quote(route, safe="/-._~")
    last_error = "unknown_error"

    for attempt in range(RETRIES + 1):
        connection: http.client.HTTPSConnection | None = None
        try:
            # A TLS-only connection to a validated hostname prevents arbitrary URL
            # schemes and hosts from entering the request path.
            # Explicit default TLS context validates the server certificate and hostname.
            # This is a TLS-only smoke probe to a validated host, not an unencrypted HTTP request.
            connection = http.client.HTTPSConnection(  # nosemgrep: python.lang.security.audit.httpsconnection-detected.httpsconnection-detected
                expected_host,
                timeout=TIMEOUT,
                context=ssl.create_default_context(),
            )
            connection.request(
                "GET",
                request_path,
                headers={
                    "User-Agent": "SYD-OMEGA-Production-Surface-Smoke/1.0",
                    "Accept": "text/html,application/xhtml+xml",
                    "Connection": "close",
                },
            )
            response = connection.getresponse()
            status = response.status
            content_type = response.getheader("Content-Type", "").lower()
            location = response.getheader("Location")
            body = response.read(256 * 1024).lower()

            if status in (301, 302, 303, 307, 308):
                if not location:
                    return False, f"{route} redirect_location_missing"
                target = urlparse(location)
                if target.scheme and target.scheme != "https":
                    return False, f"{route} redirect_scheme={target.scheme}"
                if target.hostname and target.hostname != expected_host:
                    return False, f"{route} redirect_host={target.hostname}"
                if target.port not in (None, 443):
                    return False, f"{route} redirect_port={target.port}"
                request_path = target.path or "/"
                if target.query:
                    request_path += "?" + target.query
                if attempt == RETRIES:
                    return False, f"{route} redirect_limit_exceeded"
                continue

            if not 200 <= status < 300:
                last_error = f"status={status}"
                if status < 500 or attempt == RETRIES:
                    break
                continue
            if "text/html" not in content_type:
                return False, f"{route} content_type={content_type or 'missing'}"
            if b"<html" not in body and b"<!doctype html" not in body:
                return False, f"{route} html_marker_missing"
            mismatch = identity_mismatch(expected_body, body, route)
            if mismatch:
                return False, mismatch
            return True, route
        except (OSError, http.client.HTTPException, TimeoutError) as exc:
            last_error = type(exc).__name__
        finally:
            if connection is not None:
                connection.close()

        if attempt < RETRIES:
            time.sleep(min(2 ** attempt, 4))

    return False, f"{route} {last_error}"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    if not BASE_URL.startswith("https://"):
        print("PRODUCTION_SURFACE=FAIL reason=https_required")
        return 2
    parsed = urlparse(BASE_URL)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
        or parsed.port not in (None, 443)
        or parsed.path not in ("", "/")
        or parsed.query
        or parsed.fragment
    ):
        print("PRODUCTION_SURFACE=FAIL reason=invalid_base_url")
        return 2
    if not PUBLIC.is_dir():
        print(f"PRODUCTION_SURFACE=FAIL reason=public_dir_missing path={PUBLIC}")
        return 2

    route_pages: dict[str, Path] = {}
    for page in sorted(PUBLIC.rglob("*.html")):
        route = route_for(page)
        if route is not None:
            route_pages.setdefault(route, page)
    routes = sorted(route_pages)
    if not routes:
        print("PRODUCTION_SURFACE=FAIL reason=no_html_routes_found")
        return 2

    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(check_route, route, parsed.hostname, route_pages[route].read_bytes()) for route in routes]
        for future in concurrent.futures.as_completed(futures):
            ok, result = future.result()
            if not ok:
                failures.append(result)

    if failures:
        print(f"PRODUCTION_SURFACE=FAIL checked={len(routes)} failed={len(failures)}")
        for failure in sorted(failures):
            print(f" - {failure}")
        return 1

    print(
        f"PRODUCTION_SURFACE=PASS checked={len(routes)} "
        f"host={parsed.hostname} workers={WORKERS}"
    )
    return 0


if __name__ == "__main__":
    if "--help" in sys.argv[1:]:
        print(__doc__ or "")
        raise SystemExit(0)
    raise SystemExit(main())
