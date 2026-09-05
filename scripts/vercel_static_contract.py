"""Validate the repository's native Vercel static deployment contract.

Asserts vercel.json declares no build (`builds`/`buildCommand`/`framework`),
publishes the repository root as its output, and that index.html is really on
disk -- the front door rested on a `/` rewrite with no file behind it and
served 404 in production (CLAUDE.md 8.4).

  python3 scripts/vercel_static_contract.py

It reads the repository only. A passing run says the configuration is right in
this commit; whether the live alias serves that commit is a separate question
no file on disk can answer.
"""
from __future__ import annotations

import sys

# CLAUDE.md 8.4: every scripts/*.py answers --help with its docstring and exits
# 0, before doing any work. This file shipped without the guard and ran its
# whole job instead, which is what turned test_script_help_contract red on main.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

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
    forbidden = {"builds", "buildCommand", "framework"}
    active = sorted(forbidden.intersection(config))
    if active:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL forbidden_config=" + ",".join(active))

    if config.get("outputDirectory") != ".":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL outputDirectory_must_be_root")

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
    print("output_directory=.")
    print("canonical_host=sydomega.com")
    print("www_canonicalization=present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
