#!/usr/bin/env python3
"""Validate the production security-header contract in vercel.json.

Also holds the CSP host list narrow: script-src/style-src/font-src may not
name a third-party code CDN (esm.sh, unpkg.com, cdn.jsdelivr.net), in the
vercel.json header or in any page's <meta http-equiv> CSP. Every library is
self-hosted in /vendor/, so a CDN host there is only ever attack surface --
and a meta CSP is enforced alongside the header, so it must stay narrow too.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)
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
    "form-action 'self'",
)
# Third-party code CDNs. Nothing loads from them since /vendor/ took over, so
# allowing them only widens what an injected <script src> could pull in.
FORBIDDEN_CODE_HOSTS = ("esm.sh", "unpkg.com", "cdn.jsdelivr.net")
CODE_DIRECTIVES = ("script-src", "style-src", "font-src", "default-src")
import re as _re
# content= holds 'self' etc., so match up to the SAME quote that opened it.
META_CSP_RE = _re.compile(
    r'<meta[^>]+http-equiv=["\']Content-Security-Policy["\'][^>]*content=(["\'])(.*?)\1', _re.I | _re.S)


def csp_host_errors(csp: str, where: str) -> list[str]:
    errors = []
    for part in csp.split(";"):
        tokens = part.split()
        if not tokens or tokens[0] not in CODE_DIRECTIVES:
            continue
        for host in FORBIDDEN_CODE_HOSTS:
            if any(host in t for t in tokens[1:]):
                errors.append(f"{where}: {tokens[0]} allows third-party CDN {host}")
    return errors
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
    errors += csp_host_errors(csp, "vercel.json")
    for page in sorted(ROOT.glob("*.html")):
        for _q, meta in META_CSP_RE.findall(page.read_text(encoding="utf-8", errors="ignore")):
            errors += csp_host_errors(meta, page.name)
    if errors:
        print("SECURITY HEADERS CONTRACT FAILED")
        for error in errors:
            print(" - " + error)
        return 1
    print("SECURITY HEADERS CONTRACT PASSED")
    return 0
if __name__ == "__main__":
    raise SystemExit(main())
