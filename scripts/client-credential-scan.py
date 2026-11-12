#!/usr/bin/env python3
"""Fail when client-shipped files contain service-role credentials or key markers."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLIENT_SUFFIXES = {".js", ".html", ".json"}
INTERNAL_EVIDENCE = {
    "config/omega-implementation-ledger.json",
    "supabase/remote-migrations.json",
}
SERVICE_ROLE_VALUE = re.compile(
    r"""["']?service_role["']?\s*[:=]\s*["']([A-Za-z0-9._-]{24,})["']""",
    re.IGNORECASE,
)


def finding(line: str) -> str | None:
    """Return a non-secret finding label; never return or print the matched value."""
    lowered = line.lower()
    if "supabase_service_role_key" in lowered:
        return "service-role key marker"
    if SERVICE_ROLE_VALUE.search(line):
        return "credential-like service_role value"
    return None


def scan(root: Path = ROOT) -> list[str]:
    hits: list[str] = []
    for path in root.rglob("*"):
        if ".git" in path.parts or "scripts" in path.parts or not path.is_file():
            continue
        relative = path.relative_to(root).as_posix()
        if relative in INTERNAL_EVIDENCE or path.suffix.lower() not in CLIENT_SUFFIXES:
            continue
        try:
            contents = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for line_number, line in enumerate(contents.splitlines(), 1):
            reason = finding(line)
            if reason:
                hits.append(f"{relative}:{line_number}: {reason}")
    return hits


def main() -> int:
    hits = scan()
    if hits:
        print(f"CLIENT CREDENTIAL SCAN: FAIL ({len(hits)} finding(s))")
        for hit in hits:
            print(hit)
        return 1
    print("CLIENT CREDENTIAL SCAN: PASS — no service-role credential marker or value")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
