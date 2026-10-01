#!/usr/bin/env python3
"""Contract checks for the Ω Control Center and its navigation registration."""
from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parents[1]
page = root / "control-center.html"
nav = root / "nav.js"
runtime = root / "control-center-runtime.js"

errors = []
if not page.exists(): errors.append("control-center.html is missing")
if not nav.exists(): errors.append("nav.js is missing")
if not runtime.exists(): errors.append("control-center-runtime.js is missing")

if page.exists():
    html = page.read_text(encoding="utf-8")
    page_required = [
        'id="omega-side"',
        'data-page="control-center"',
        "/bg.js",
        "/verify-deployment.html",
        "/verify-modules.html",
    ]
    for token in page_required:
        if token not in html:
            errors.append(f"control-center.html missing contract: {token}")
    if re.search(r"<script[^>]+src=['\"]https?://", html, re.I):
        errors.append("control-center.html must not add a third-party script dependency")
    if "document.write(" in html or "eval(" in html:
        errors.append("control-center.html contains a forbidden dynamic execution primitive")

if runtime.exists():
    runtime_text = runtime.read_text(encoding="utf-8")
    runtime_required = [
        "navigator.onLine",
        "localStorage",
        "serviceWorker",
        "fetch(path,{cache:'no-store'",
    ]
    for token in runtime_required:
        if token not in runtime_text:
            errors.append(f"control-center-runtime.js missing contract: {token}")

if nav.exists():
    nav_text = nav.read_text(encoding="utf-8")
    if "control-center:'govern'" not in nav_text:
        errors.append("nav.js does not map control-center to GOVERN")
    if "['control-center','CONTROL CENTER','/control-center.html']" not in nav_text:
        errors.append("nav.js does not expose CONTROL CENTER in GOVERN")
    if nav_text.count("control-center") < 2:
        errors.append("nav.js control-center registration is incomplete")

if errors:
    print("CONTROL CENTER CONTRACT: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("CONTROL CENTER CONTRACT: PASS")
