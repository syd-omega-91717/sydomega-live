"""Validate the repository's native Vercel static deployment contract."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    config_path = ROOT / "vercel.json"
    index_path = ROOT / "index.html"
    build_path = ROOT / "scripts" / "vercel-build.sh"
    if not config_path.is_file():
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing=vercel.json")
    if not index_path.is_file():
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing=index.html")
    if not build_path.is_file():
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL missing=scripts/vercel-build.sh")

    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"VERCEL_STATIC_CONTRACT=FAIL invalid_json={exc}") from exc

    if config.get("framework", "__missing__") is not None:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL framework_must_be_null")
    if config.get("buildCommand") != "bash scripts/vercel-build.sh":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL buildCommand_must_be_static_builder")
    if config.get("installCommand", "__missing__") != "":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL installCommand_must_be_empty")
    if config.get("outputDirectory") != "public":
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL outputDirectory_must_be_public")
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

    build = build_path.read_text(encoding="utf-8", errors="strict")
    for marker in ("mkdir -p public", "public/index.html", "VERCEL_BUILD=PASS"):
        if marker not in build:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL build_marker=" + marker)

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_public")
    print("framework=null")
    print("build_command=bash_scripts/vercel-build.sh")
    print("install_command=empty")
    print("output_directory=public")
    print("canonical_host=sydomega.com")
    print("www_canonicalization=present")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
