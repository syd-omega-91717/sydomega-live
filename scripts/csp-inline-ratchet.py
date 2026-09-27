#!/usr/bin/env python3
"""Ratchet the inline code that blocks a strict script-src CSP.

vercel.json still sends `script-src 'self' 'unsafe-inline'` because pages carry
inline `on*=` handlers and inline <script> blocks, which a policy without
'unsafe-inline' refuses. Removing them is a page-by-page migration; this gate
makes sure it only moves one way while it happens.

For every root *.html and *.js it counts:
  handlers  -- inline on*= event attributes: in HTML markup, and inside JS
               strings that build markup (innerHTML templates emit them too)
  scripts   -- inline <script> blocks with a body and no src (HTML only;
               JSON data blocks such as application/ld+json are not code)

and compares against scripts/csp-inline-baseline.json. A file may never rise
above its baseline, and a file absent from the baseline must be at 0 -- new
pages and modules are born CSP-clean. A lower count passes and is reported;
run with --update to lower the baseline in the same change (it never raises
a file's number: --update refuses while anything is over).

Exit 0 on pass, 1 on any file over its baseline.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "scripts" / "csp-inline-baseline.json"

SCRIPT_RE = re.compile(r"<script(\s[^>]*)?>(.*?)</script\s*>", re.S | re.I)
TAG_RE = re.compile(r"<[a-zA-Z][^<>]*>")
# An on*= event attribute: preceded by whitespace (or an escaped quote/space in
# a JS string), followed by = and a quote. `\son` keeps `button`/`json` out.
ATTR_RE = re.compile(r"""\son[a-z]+\s*=\s*(?:\\?["']|[^\s>"'=]+)""", re.I)
JS_ATTR_RE = re.compile(r"""\son[a-z]+\s*=\s*\\?["']""", re.I)
DATA_TYPES = ("application/ld+json", "application/json", "importmap", "text/template")


def count_html(text: str) -> tuple[int, int]:
    handlers = scripts = 0
    for m in SCRIPT_RE.finditer(text):
        attrs = (m.group(1) or "").lower()
        if "src=" in attrs:
            continue
        if any(t in attrs for t in DATA_TYPES):
            continue
        body = m.group(2)
        if body.strip():
            scripts += 1
            handlers += len(JS_ATTR_RE.findall(body))
    markup = SCRIPT_RE.sub("", text)
    for tag in TAG_RE.findall(markup):
        handlers += len(ATTR_RE.findall(tag))
    return handlers, scripts


def count_js(text: str) -> tuple[int, int]:
    return len(JS_ATTR_RE.findall(text)), 0


def measure() -> dict[str, dict[str, int]]:
    out: dict[str, dict[str, int]] = {}
    for path in sorted(ROOT.glob("*.html")) + sorted(ROOT.glob("*.js")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        h, s = (count_html if path.suffix == ".html" else count_js)(text)
        if h or s:
            out[path.name] = {"handlers": h, "scripts": s}
    return out


def main() -> int:
    current = measure()
    baseline = json.loads(BASELINE.read_text()) if BASELINE.exists() else {}
    over, lowered = [], []
    for name in sorted(set(current) | set(baseline)):
        cur = current.get(name, {"handlers": 0, "scripts": 0})
        base = baseline.get(name, {"handlers": 0, "scripts": 0})
        for k in ("handlers", "scripts"):
            if cur[k] > base[k]:
                over.append(f"{name}: {k} {base[k]} -> {cur[k]}")
            elif cur[k] < base[k]:
                lowered.append(f"{name}: {k} {base[k]} -> {cur[k]}")

    th = sum(v["handlers"] for v in current.values())
    ts = sum(v["scripts"] for v in current.values())
    print("CSP INLINE RATCHET")
    print(f"  inline handlers: {th}   inline <script> blocks: {ts}   files: {len(current)}")
    if "--update" in _sys.argv[1:]:
        if over and BASELINE.exists():
            print("  refusing --update: the baseline never rises. Over:")
            for line in over:
                print("    " + line)
            return 1
        BASELINE.write_text(json.dumps(current, indent=1, sort_keys=True) + "\n")
        print(f"  baseline written ({len(lowered)} reduction(s))")
        return 0
    if lowered:
        print(f"  {len(lowered)} reduction(s) not yet in the baseline -- run with --update:")
        for line in lowered[:20]:
            print("    " + line)
    if over:
        print("  FAIL -- inline code added (use addEventListener / a src= file instead):")
        for line in over:
            print("    " + line)
        return 1
    print("  PASS -- no file above its baseline")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
