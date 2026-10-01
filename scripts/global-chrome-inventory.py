#!/usr/bin/env python3
"""Inventory shared visual chrome across the page estate.

Diagnostic only: it counts global injections, fixed surfaces, high z-index
surfaces and viewport-bound geometry so page-level information density can be
reviewed together with shared chrome.

Usage:
  python3 scripts/global-chrome-inventory.py
"""
from __future__ import annotations

import sys
if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", ".git", ".next", "dist", "build", "public"}
FILES = sorted(
    p for p in ROOT.rglob("*")
    if p.is_file() and p.suffix in {".js", ".html", ".css"}
    and not any(part in SKIP for part in p.relative_to(ROOT).parts)
)

BODY_APPEND = re.compile(r"(?:document\.)?body\s*\.\s*(?:appendChild|insertBefore)\s*\(", re.I)
FIXED = re.compile(r"position\s*:\s*fixed", re.I)
HIGH_Z = re.compile(r"z-index\s*:\s*(?:9\d\d|[1-9]\d{3,})", re.I)
VIEWPORT = re.compile(r"(?:width|min-width|max-width|inset)\s*:[^;{}]*(?:100vw|100vh)", re.I)
GLOBAL_ID = re.compile(r"(?:id\s*=\s*['\"](omega-[^'\"]+)['\"]|\.id\s*=\s*['\"](omega-[^'\"]+)['\"])", re.I)

def scan(p: Path) -> dict:
    text = p.read_text(encoding="utf-8", errors="replace")
    return {
        "file": str(p.relative_to(ROOT)),
        "body_injections": len(BODY_APPEND.findall(text)),
        "fixed": len(FIXED.findall(text)),
        "high_z": len(HIGH_Z.findall(text)),
        "viewport_geometry": len(VIEWPORT.findall(text)),
        "omega_ids": sorted({a or b for a, b in GLOBAL_ID.findall(text)}),
    }

def main() -> int:
    rows = [scan(p) for p in FILES]
    body = sum(r["body_injections"] for r in rows)
    fixed = sum(r["fixed"] for r in rows)
    high = sum(r["high_z"] for r in rows)
    viewport = sum(r["viewport_geometry"] for r in rows)
    ids = Counter(x for r in rows for x in r["omega_ids"])
    print(f"GLOBAL CHROME INVENTORY: {len(FILES)} visual/runtime files scanned")
    print(f"  body-level dynamic injections: {body}")
    print(f"  position:fixed declarations: {fixed}")
    print(f"  high z-index declarations (>=900): {high}")
    print(f"  viewport-sized geometry declarations: {viewport}")
    print(f"  distinct omega-* injected/declared ids: {len(ids)}")
    print("\nHighest shared-chrome files:")
    for r in sorted(rows, key=lambda x: (x["fixed"], x["body_injections"], x["high_z"]), reverse=True)[:25]:
        total = r["fixed"] + r["body_injections"] + r["high_z"]
        if total:
            print(f"  {r['file']}: fixed={r['fixed']} body-injections={r['body_injections']} high-z={r['high_z']} viewport={r['viewport_geometry']}")
    print("\nInterpretation:")
    print("  Fixed chrome is not automatically a defect.")
    print("  Consent, navigation, accessibility, modal and owner-gate surfaces are legitimate.")
    print("  Review any surface that is global, persistent, overlaps page identity, or duplicates an existing action.")
    print("  Prefer one shared surface per job instead of page-local replicas.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
