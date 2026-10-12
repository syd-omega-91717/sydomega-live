#!/usr/bin/env python3
"""Validate the GitHub Pages artifact before and after deployment.

This is a static-hosting resilience gate. It never treats Pages reachability
as proof that Supabase, authentication, payments, or other backend providers
are healthy.
"""
from __future__ import annotations

import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path("public")
REQUIRED = ("index.html", "world.html", "standing-dashboard.html", "recovery.html", "evidence.html")
FORBIDDEN_DIRS = (".git", "docs", "config", "supabase", "scripts", "private")
SECRET_PATTERNS = (
    re.compile(r"sk_(?:live|test)_[A-Za-z0-9]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"-----BEGIN (?:RSA|EC|OPENSSH|PRIVATE) KEY-----"),
)


def artifact_check() -> int:
    if not ROOT.is_dir():
        print("FAIL: public/ does not exist")
        return 1

    failures = []
    for name in REQUIRED:
        if not (ROOT / name).is_file():
            failures.append(f"missing required artifact: {name}")

    cname = ROOT / "CNAME"
    if not cname.is_file() or cname.read_text(encoding="utf-8").strip() != "sydomega.com":
        failures.append("CNAME must contain exactly sydomega.com")

    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in FORBIDDEN_DIRS for part in rel.parts):
            failures.append(f"forbidden directory in artifact: {rel}")
            continue
        if path.suffix.lower() in {".pem", ".key", ".p12", ".pfx"}:
            failures.append(f"credential-like file in artifact: {rel}")
            continue
        try:
            text = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                failures.append(f"secret-shaped value in artifact: {rel}")

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    print(f"PASS: static failover artifact validated ({sum(1 for _ in ROOT.rglob('*'))} paths)")
    return 0


def remote_check(base_url: str) -> int:
    base = base_url.rstrip("/")
    routes = ("/", "/index.html", "/world.html", "/standing-dashboard.html", "/recovery.html", "/evidence.html")
    failures = []
    for route in routes:
        url = base + route
        try:
            # The URL is supplied by the operator as the explicit smoke-test target.
            # Restrict it to HTTPS before opening it; do not permit file:// or other schemes.
            if not url.startswith("https://"):
                raise ValueError(f"refusing non-https URL: {url!r}")
            # nosemgrep: python.lang.security.audit.dynamic-urllib-use-detected.dynamic-urllib-use-detected
            with urllib.request.urlopen(url, timeout=20) as response:
                status = response.status
                body = response.read(8192).decode("utf-8", "ignore")
            if status != 200:
                failures.append(f"{route}: HTTP {status}")
            elif route == "/" and "<html" not in body.lower():
                failures.append(f"{route}: response is not HTML")
        except Exception as exc:
            failures.append(f"{route}: {exc}")

    if failures:
        for failure in failures:
            print(f"FAIL: {failure}")
        return 1

    print(f"PASS: GitHub Pages smoke passed for {len(routes)} routes")
    return 0


def main() -> int:
    if "--help" in sys.argv:
        print(__doc__.strip())
        return 0
    if len(sys.argv) == 1:
        return artifact_check()
    if len(sys.argv) == 3 and sys.argv[1] == "--url":
        return remote_check(sys.argv[2])
    print("usage: omega-pages-failover-smoke.py [--url <https://...>]")
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
