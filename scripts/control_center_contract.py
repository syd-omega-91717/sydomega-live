#!/usr/bin/env python3
"""Contract checks for the Ω Control Center and its navigation registration."""
from pathlib import Path
import re
import sys

root=Path(__file__).resolve().parents[1]
page=root/"control-center.html"
nav=root/"nav.js"

errors=[]
if not page.exists(): errors.append("control-center.html is missing")
if not nav.exists(): errors.append("nav.js is missing")

if page.exists():
    text=page.read_text(encoding="utf-8")
    required=[
        'id="omega-side"','data-page="control-center"',
        '/bg.js','/verify-deployment.html','/verify-modules.html',
        'navigator.onLine','localStorage','serviceWorker',
        "fetch(path,{cache:'no-store'",
    ]
    for token in required:
        if token not in text: errors.append(f"control-center.html missing contract: {token}")
    if re.search(r"<script[^>]+src=['\"]https?://", text, re.I):
        errors.append("control-center.html must not add a third-party script dependency")
    if 'document.write(' in text or 'eval(' in text:
        errors.append("control-center.html contains a forbidden dynamic execution primitive")

if nav.exists():
    text=nav.read_text(encoding="utf-8")
    if "control-center:'govern'" not in text:
        errors.append("nav.js does not map control-center to GOVERN")
    if "['control-center','CONTROL CENTER','/control-center.html']" not in text:
        errors.append("nav.js does not expose CONTROL CENTER in GOVERN")
    if text.count("control-center") < 2:
        errors.append("nav.js control-center registration is incomplete")

if errors:
    print("CONTROL CENTER CONTRACT: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

print("CONTROL CENTER CONTRACT: PASS")
