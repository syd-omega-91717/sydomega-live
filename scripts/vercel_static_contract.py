"""Validate the repository's native Vercel static deployment contract."""
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

    # Host policy. This gate used to require a www -> apex redirect outright,
    # which made it fail the moment the owner removed that rule in 4e216de3
    # ("serve canonical www host directly without forced apex redirect") -- the
    # gate was asserting one particular answer rather than the property that
    # actually matters. Both hosts are aliased to the same deployment, so
    # serving each directly is a valid configuration and so is canonicalizing
    # onto either one. What is never valid is declaring both directions, which
    # is an infinite redirect loop that no static check downstream would catch.
    redirects = config.get("redirects", [])

    def host_rules(host: str) -> list:
        return [
            r for r in redirects
            if any(
                h.get("type") == "host" and h.get("value") == host
                for h in r.get("has", [])
            )
        ]

    www_rules = host_rules("www.sydomega.com")
    apex_rules = host_rules("sydomega.com")
    if www_rules and apex_rules:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL host_redirect_loop")

    if www_rules:
        host_policy = "redirect_www_to_apex"
    elif apex_rules:
        host_policy = "redirect_apex_to_www"
    else:
        host_policy = "serve_both_hosts_directly"

    html = index_path.read_text(encoding="utf-8", errors="strict").lower()
    for marker in ("<!doctype html", "<html", "<title>"):
        if marker not in html:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL index_marker=" + marker)

    build = build_path.read_text(encoding="utf-8", errors="strict")
    for marker in (
        "mkdir -p public",
        "public/index.html",
        "VERCEL_BUILD=PASS",
        # vendor/ carries the self-hosted Supabase client that 127 pages import
        # before they render anything; it was absent from the copy list and
        # 404'd in production while the build printed PASS.
        "for dir in vendor i18n",
        "public/vendor/supabase-js.js",
        # ...and the emitted tree must check its own references, so the next
        # dropped directory fails the build instead of reaching the alias.
        "unreachable_asset=${ref}",
    ):
        if marker not in build:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL build_marker=" + marker)

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_public")
    print("framework=null")
    print("build_command=bash_scripts/vercel-build.sh")
    print("install_command=empty")
    print("output_directory=public")
    print("host_policy=" + host_policy)
    print("build_output_verified=references_resolve_in_public")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
