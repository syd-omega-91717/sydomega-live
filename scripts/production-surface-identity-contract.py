#!/usr/bin/env python3
"""Prevent production smoke checks from treating generic HTML as app availability."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
if __name__ == "__main__" and any(arg in {"--help", "-h"} for arg in sys.argv[1:]):
    print(__doc__.strip())
    raise SystemExit(0)

WORKFLOW = ROOT / ".github/workflows/production-surface-smoke.yml"
FAILOVER = ROOT / "scripts/omega-pages-failover-smoke.py"


def main() -> int:
    workflow = WORKFLOW.read_text(encoding="utf-8")
    failover = FAILOVER.read_text(encoding="utf-8")
    checks = {
        "production smoke checks expected Omega title": bool(re.search(r"<title\[\^>\]\*\>\[\^<\]\*SYD OMEGA 91717", workflow)),
        "production smoke checks canonical CSS asset": "omega-visual-universe.css" in workflow,
        "production smoke reports identity state": "identity_ok" in workflow and "asset_http_code" in workflow,
        "failover smoke checks HTML for every route": 'elif "<html" not in body.lower()' in failover,
        "failover root verifies brand title and canonical CSS": "syd omega 91717" in failover.lower() and "omega-visual-universe.css" in failover,
        "generic HTML alone cannot mark production reachable": "Expected page title and CSS reference found" in workflow,
    }
    failed = [name for name, ok in checks.items() if not ok]
    for name, ok in checks.items():
        print(f"{'PASS' if ok else 'FAIL'} production-identity: {name}")
    if failed:
        print(f"PRODUCTION_IDENTITY_CONTRACT=FAIL checks={len(failed)}/{len(checks)}")
        return 1
    print(f"PRODUCTION_IDENTITY_CONTRACT=PASS checks={len(checks)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
