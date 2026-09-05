"""Validate the repository's native Vercel static deployment contract."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    config_path = ROOT / "vercel.json"
    index_path = ROOT / "index.html"
    if not config_path.is_file():
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing=vercel.json")
    if not index_path.is_file():
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing=index.html")

    config = json.loads(config_path.read_text(encoding="utf-8"))
    forbidden = {"builds", "buildCommand", "outputDirectory", "framework"}
    active = sorted(forbidden.intersection(config))
    if active:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL forbidden_config=" + ",".join(active))

    redirects = config.get("redirects", [])
    www_rules = [
        r for r in redirects
        if any(h.get("type") == "host" and h.get("value") == "www.sydomega.com" for h in r.get("has", []))
    ]
    if not www_rules:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing_www_canonicalization")

    html = index_path.read_text(encoding="utf-8", errors="strict").lower()
    for marker in ("<!doctype html", "<html", "<title>"):
        if marker not in html:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL index_marker=" + marker)

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_root")
    print("canonical_host=sydomega.com")
    print("www_canonicalization=present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
