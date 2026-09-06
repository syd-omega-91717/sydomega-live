#!/usr/bin/env python3
"""Deterministic static security baseline for SYD OMEGA 91717.

This gate verifies repository controls that can be proven without production
credentials. It deliberately does not claim live WAF, Auth, Supabase, Stripe,
or Vercel behavior; those require runtime evidence.
"""
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAIL = 0
WARN = 0


def fail(message: str) -> None:
    global FAIL
    FAIL += 1
    print(f"FAIL: {message}")


def warn(message: str) -> None:
    global WARN
    WARN += 1
    print(f"WARN: {message}")


def check_vercel_security() -> None:
    path = ROOT / "vercel.json"
    if not path.exists():
        fail("vercel.json is missing")
        return
    try:
        cfg = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"vercel.json is not valid JSON: {exc}")
        return
    headers = cfg.get("headers", [])
    values = {}
    for block in headers:
        for item in block.get("headers", []):
            values[item.get("key", "").lower()] = item.get("value", "")
    required = {
        "x-content-type-options": "nosniff",
        "x-frame-options": "DENY",
        "referrer-policy": "strict-origin-when-cross-origin",
        "strict-transport-security": "max-age=63072000; includeSubDomains; preload",
        "content-security-policy": "",
    }
    for key, expected in required.items():
        actual = values.get(key)
        if not actual:
            fail(f"missing security header: {key}")
        elif expected and actual != expected:
            fail(f"unexpected {key} value")
    csp = values.get("content-security-policy", "")
    for directive in ("default-src", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'"):
        if directive not in csp:
            fail(f"CSP missing required directive: {directive}")
    if "unsafe-eval" in csp:
        fail("CSP contains unsafe-eval")
    if "http://" in csp:
        fail("CSP contains insecure http:// source")
    if "unsafe-inline" in csp:
        warn("CSP uses unsafe-inline; source pages may still require inline compatibility")


def client_files() -> list[Path]:
    files: list[Path] = []
    for pattern in ("*.html", "*.js", "*.json"):
        files.extend(ROOT.glob(pattern))
        files.extend((ROOT / "assets").rglob(pattern) if (ROOT / "assets").exists() else [])
    return [p for p in files if p.is_file()]


def check_secret_patterns() -> None:
    # Scan only browser-delivered surfaces. Server-side Edge Functions and docs
    # legitimately contain environment variable names such as STRIPE_SECRET_KEY;
    # those names are not credentials and must not be treated as leaked secrets.
    patterns = [
        re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
        re.compile(r"\bsk-[A-Za-z0-9_-]{20,}"),
        re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
        re.compile(r"service_role\s*[:=]\s*['\"]ey", re.I),
    ]
    for path in client_files():
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in patterns:
            if pattern.search(text):
                fail(f"credential-shaped material in client file {path.relative_to(ROOT)}: {pattern.pattern}")


def check_mixed_content() -> None:
    pattern = re.compile(r"(?:src|href|action)\s*=\s*['\"]http://", re.I)
    for path in list(ROOT.glob("*.html")) + list(ROOT.glob("*.js")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        if pattern.search(text):
            fail(f"mixed-content URL in {path.name}")


def check_bg_syntax() -> None:
    bg = ROOT / "bg.js"
    if not bg.exists():
        fail("bg.js is missing")
        return
    result = subprocess.run(["node", "--check", str(bg)], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        fail("bg.js failed node --check")
        if result.stderr.strip():
            print(result.stderr.strip())


def check_pwa_contract() -> None:
    for name in ("manifest.json", "sw.js"):
        if not (ROOT / name).exists():
            fail(f"PWA contract file missing: {name}")
    manifest = ROOT / "manifest.json"
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
            for key in ("name", "start_url", "display"):
                if not data.get(key):
                    fail(f"manifest missing required field: {key}")
        except Exception as exc:
            fail(f"manifest.json is invalid: {exc}")


def check_dormant_monetization_markers() -> None:
    sql_files = list((ROOT / "supabase").rglob("*.sql")) if (ROOT / "supabase").exists() else []
    js_files = [ROOT / "omega-flags.js"] if (ROOT / "omega-flags.js").exists() else []
    combined = "\n".join(p.read_text(encoding="utf-8", errors="ignore") for p in sql_files + js_files)
    if "platform_settings" not in combined:
        warn("platform_settings was not found in repository sources; live feature state remains unverified")
    if "tokens_enabled" not in combined:
        warn("tokens_enabled was not found in repository sources; token activation state remains unverified")


def main() -> int:
    print("OMEGA SECURITY BASELINE")
    check_vercel_security()
    check_secret_patterns()
    check_mixed_content()
    check_bg_syntax()
    check_pwa_contract()
    check_dormant_monetization_markers()
    print(f"SECURITY_BASELINE_FAILS={FAIL}")
    print(f"SECURITY_BASELINE_WARNINGS={WARN}")
    if FAIL:
        print("SECURITY_BASELINE=FAIL")
        return 1
    print("SECURITY_BASELINE=PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
