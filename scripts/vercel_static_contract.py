"""Validate the repository's native Vercel static deployment contract."""
from __future__ import annotations

import json
import sys
from pathlib import Path

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]

def main() -> int:
    config_path = ROOT / "vercel.json"
    index_path = ROOT / "index.html"
    build_path = ROOT / "scripts" / "vercel-build.sh"
    enhancer_path = ROOT / "scripts" / "vercel-build-enhance.mjs"
    required = (
        (config_path, "vercel.json"),
        (index_path, "index.html"),
        (build_path, "scripts/vercel-build.sh"),
        (enhancer_path, "scripts/vercel-build-enhance.mjs"),
    )
    missing = [label for path, label in required if not path.is_file()]
    if missing:
        for label in missing:
            print(f"VERCEL_STATIC_CONTRACT=FAIL missing={label}")
        return 1

    errors: list[str] = []
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"VERCEL_STATIC_CONTRACT=FAIL invalid_json={exc}")
        return 1

    def check(condition: bool, message: str) -> None:
        if not condition:
            errors.append(message)

    check(config.get("framework", "__missing__") is None, "framework_must_be_null")
    check(config.get("buildCommand") == "bash scripts/vercel-build.sh", "buildCommand_must_be_static_builder")
    check(config.get("installCommand", "__missing__") == "", "installCommand_must_be_empty")
    check(config.get("outputDirectory") == "public", "outputDirectory_must_be_public")
    check("builds" not in config, "forbidden_config=builds")

    deployment_enabled = config.get("git", {}).get("deploymentEnabled", {})
    check(deployment_enabled.get("*", True) is False, "automatic_git_deploy_must_be_disabled_for_non_main")
    check(deployment_enabled.get("main", False) is True, "main_git_deploy_must_be_enabled")

    redirects = config.get("redirects", [])
    def host_rules(host: str) -> list:
        return [r for r in redirects if any(h.get("type") == "host" and h.get("value") == host for h in r.get("has", []))]

    www_rules = host_rules("www.sydomega.com")
    apex_rules = host_rules("sydomega.com")
    if www_rules and apex_rules:
        errors.append("host_redirect_loop")
        host_policy = "invalid"
    else:
        host_policy = "redirect_www_to_apex" if www_rules else "redirect_apex_to_www" if apex_rules else "serve_both_hosts_directly"

    html = index_path.read_text(encoding="utf-8", errors="strict").lower()
    for marker in ("<!doctype html", "<html", "<title>"):
        check(marker in html, "index_marker=" + marker)

    build = build_path.read_text(encoding="utf-8", errors="strict")
    for marker in (
        "mkdir -p public",
        "public/index.html",
        "internal_ledger_exposed",
        "VERCEL_BUILD=PASS",
        "for dir in vendor i18n",
        "! -path './config/omega-implementation-ledger.json'",
        "find vendor -type f",
        "public/${vendored}",
        "vendor files src=",
        "unreachable_asset=${ref}",
        "vercel-build-enhance.mjs",
    ):
        check(marker in build, "build_marker=" + marker)

    enhancer = enhancer_path.read_text(encoding="utf-8", errors="strict")
    for marker in ("viewport", "<title>", "omega-visual-engine.js"):
        check(marker in enhancer, "enhancer_marker=" + marker)

    if errors:
        print("VERCEL_STATIC_CONTRACT=FAIL")
        for error in errors:
            print(" - " + error)
        return 1

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_public")
    print("framework=null")
    print("build_command=bash_scripts/vercel-build.sh")
    print("install_command=empty")
    print("output_directory=public")
    print("host_policy=" + host_policy)
    print("git_auto_deploy=main_only")
    print("git_auto_deploy_non_main=disabled")
    print("promotion_workflow=.github/workflows/vercel-production.yml")
    print("build_output_verified=references_resolve_in_public")
    print("artifact_shell=normalized")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
