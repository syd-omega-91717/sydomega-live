#!/usr/bin/env python3
"""Verify every HTML page emitted by the production build is reachable on the live host.

This is a route-availability smoke test, not a substitute for browser interaction,
authenticated-flow, API-contract, or visual regression testing.
"""
from __future__ import annotations

import concurrent.futures
import os
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen

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


def check_route(route: str, expected_host: str) -> tuple[bool, str]:
    url = BASE_URL + route
    last_error = "unknown_error"
    for attempt in range(RETRIES + 1):
        try:
            request = Request(
                url,
                headers={
                    "User-Agent": "SYD-OMEGA-Production-Surface-Smoke/1.0",
                    "Accept": "text/html,application/xhtml+xml",
                },
            )
            with urlopen(request, timeout=TIMEOUT) as response:
                status = response.status
                content_type = response.headers.get("Content-Type", "").lower()
                final_url = response.geturl()
                body = response.read(256 * 1024).lower()
            final = urlparse(final_url)
            if final.scheme != "https" or final.hostname != expected_host:
                return False, f"{route} redirect_host={final.hostname or 'missing'}"
            if not 200 <= status < 300:
                return False, f"{route} status={status}"
            if "text/html" not in content_type:
                return False, f"{route} content_type={content_type or 'missing'}"
            if b"<html" not in body and b"<!doctype html" not in body:
                return False, f"{route} html_marker_missing"
            return True, route
        except HTTPError as exc:
            last_error = f"status={exc.code}"
            if exc.code < 500 or attempt == RETRIES:
                break
        except (URLError, TimeoutError, OSError) as exc:
            last_error = type(exc).__name__
        if attempt < RETRIES:
            time.sleep(min(2 ** attempt, 4))
    return False, f"{route} {last_error}"


def main() -> int:
    if not BASE_URL.startswith("https://"):
        print("PRODUCTION_SURFACE=FAIL reason=https_required")
        return 2
    parsed = urlparse(BASE_URL)
    if not parsed.hostname or parsed.username or parsed.password:
        print("PRODUCTION_SURFACE=FAIL reason=invalid_base_url")
        return 2
    if not PUBLIC.is_dir():
        print(f"PRODUCTION_SURFACE=FAIL reason=public_dir_missing path={PUBLIC}")
        return 2

    routes = sorted({
        route
        for page in PUBLIC.rglob("*.html")
        if (route := route_for(page)) is not None
    })
    if not routes:
        print("PRODUCTION_SURFACE=FAIL reason=no_html_routes_found")
        return 2

    failures: list[str] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as pool:
        futures = [pool.submit(check_route, route, parsed.hostname) for route in routes]
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
    raise SystemExit(main())
