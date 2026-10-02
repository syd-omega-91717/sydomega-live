#!/usr/bin/env python3
"""Contract checks for the Ω Control Center and its navigation registration."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "control-center.html"
NAV = ROOT / "nav.js"
RUNTIME = ROOT / "control-center-runtime.js"

def main() -> int:
    errors = []
    if not PAGE.exists(): errors.append("control-center.html is missing")
    if not NAV.exists(): errors.append("nav.js is missing")
    if not RUNTIME.exists(): errors.append("control-center-runtime.js is missing")

    html = PAGE.read_text(encoding="utf-8") if PAGE.exists() else ""
    runtime = RUNTIME.read_text(encoding="utf-8") if RUNTIME.exists() else ""
    nav = NAV.read_text(encoding="utf-8") if NAV.exists() else ""

    for token in [
        'id="omega-side"', 'data-page="control-center"', '/bg.js',
        '/verify-deployment.html', '/verify-modules.html'
    ]:
        if token not in html:
            errors.append(f"control-center.html missing contract: {token}")

    for token in ["navigator.onLine", "localStorage", "serviceWorker", "fetch(path,{cache:'no-store'"]:
        if token not in runtime:
            errors.append(f"control-center-runtime.js missing contract: {token}")

    if re.search(r"<script[^>]+src=['\"]https?://", html, re.I):
        errors.append("control-center.html must not add a third-party script dependency")
    if "document.write(" in html or "eval(" in html:
        errors.append("control-center.html contains a forbidden dynamic execution primitive")

    if not re.search(r"control-center\s*:\s*['\"]govern['\"]", nav):
        errors.append("nav.js does not map control-center to GOVERN")
    if "control-center" not in nav:
        errors.append("nav.js does not register control-center")
    if "CONTROL CENTER" not in nav or "/control-center.html" not in nav:
        errors.append("nav.js does not expose CONTROL CENTER")

    if errors:
        print("CONTROL CENTER CONTRACT: FAIL")
        for error in errors:
            print(" -", error)
        return 1
    print("CONTROL CENTER CONTRACT: PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
