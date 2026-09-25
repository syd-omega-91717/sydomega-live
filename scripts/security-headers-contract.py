#!/usr/bin/env python3
"""Validate the production security-header contract in vercel.json."""
from __future__ import annotations
import json
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "vercel.json"
REQUIRED = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy": None,
    "Content-Security-Policy": None,
}
CSP_REQUIRED = (
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "connect-src 'self'",
)
def main() -> int:
    if not CONFIG.exists():
        print("SECURITY HEADERS CONTRACT FAILED: vercel.json missing")
        return 1
    data = json.loads(CONFIG.read_text(encoding="utf-8"))
    headers = {}
    for group in data.get("headers", []):
        for item in group.get("headers", []):
            headers[item.get("key")] = item.get("value", "")
    errors = []
    for key, expected in REQUIRED.items():
        value = headers.get(key)
        if value is None:
            errors.append(f"missing {key}")
        elif expected is not None and value != expected:
            errors.append(f"{key} has unexpected value")
    csp = headers.get("Content-Security-Policy", "")
    for directive in CSP_REQUIRED:
        if directive not in csp:
            errors.append(f"CSP missing {directive}")
    if errors:
        print("SECURITY HEADERS CONTRACT FAILED")
        for error in errors:
            print(" - " + error)
        return 1
    print("SECURITY HEADERS CONTRACT PASSED")
    return 0
if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        raise SystemExit(0)
    raise SystemExit(main())
