#!/usr/bin/env python3
"""Fail the release contract when capability evidence is presented as current but is stale.

This is deliberately conservative: historical live-verification text is retained, but a
capability cannot be promoted to VERIFIED unless `verified` is true.  Any entry whose
live_verification claims a dated live check older than the configured freshness window
must explicitly say that current production verification is still open/blocked.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import date
from pathlib import Path

REGISTRY = Path("docs/capabilities/registry.json")
MAX_DAYS = 7
DATE_RE = re.compile(r"\b(20\d{2})-(\d{2})-(\d{2})\b")
CURRENT_MARKERS = ("current production", "currently verified", "verified this session")
OPEN_MARKERS = ("unverified", "blocked", "open", "not verified")


def main() -> int:
    data = json.loads(REGISTRY.read_text(encoding="utf-8"))
    today = date.today()
    failures: list[str] = []

    for item in data.get("capabilities", []):
        cid = item.get("id", "<unknown>")
        verified = bool(item.get("verified", False))
        live = str(item.get("contract", {}).get("live_verification", "")).strip()
        dates = [date(int(y), int(m), int(d)) for y, m, d in DATE_RE.findall(live)]
        if not dates:
            continue
        newest = max(dates)
        age = (today - newest).days
        if age > MAX_DAYS and not verified:
            lowered = live.lower()
            if any(marker in lowered for marker in CURRENT_MARKERS):
                failures.append(
                    f"{cid}: stale live-verification date {newest.isoformat()} ({age} days old) "
                    "is described as current while verified=false"
                )
            elif not any(marker in lowered for marker in OPEN_MARKERS):
                print(
                    f"WARN {cid}: historical live verification {newest.isoformat()} is "
                    f"{age} days old; verified=false and no explicit open/blocked marker"
                )

    if failures:
        print("CAPABILITY_EVIDENCE_FRESHNESS=FAIL")
        for failure in failures:
            print(f"ERROR: {failure}")
        return 1

    print(f"CAPABILITY_EVIDENCE_FRESHNESS=PASS (freshness window={MAX_DAYS} days)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
