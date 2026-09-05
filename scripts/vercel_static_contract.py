"""Validate the repository's native Vercel static deployment contract.

The production surface is a framework-free static site. Vercel must not infer
Next.js or another framework, must not run an install/build command, and must
serve the repository root directly.

This is a repository contract only. A passing result proves the committed
configuration is internally correct; live deployment health is checked by the
production surface smoke workflow.
"""
from __future__ import annotations

import sys

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

    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"VERCEL_STATIC_CONTRACT=FAIL invalid_json={exc}") from exc

    if config.get("framework", "__missing__") is not None:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL framework_must_be_null")
    if config.get("buildCommand", "__missing__") is not None:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL buildCommand_must_be_null")
    if config.get("installCommand", "__missing__") != "":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL installCommand_must_be_empty")
    if config.get("outputDirectory") != ".":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL outputDirectory_must_be_root")
    if "builds" in config:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL forbidden_config=builds")

    redirects = config.get("redirects", [])
    www_rules = [
        r for r in redirects
        if any(
            h.get("type") == "host" and h.get("value") == "www.sydomega.com"
            for h in r.get("has", [])
        )
    ]
    if not www_rules:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing_www_canonicalization")

    html = index_path.read_text(encoding="utf-8", errors="strict").lower()
    for marker in ("<!doctype html", "<html", "<title>"):
        if marker not in html:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL index_marker=" + marker)

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_root")
    print("framework=null")
    print("build_command=null")
    print("install_command=empty")
    print("output_directory=.")
    print("canonical_host=sydomega.com")
    print("www_canonicalization=present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
