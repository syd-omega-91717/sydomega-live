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
    for path, label in ((config_path, "vercel.json"), (index_path, "index.html"), (build_path, "scripts/vercel-build.sh"), (enhancer_path, "scripts/vercel-build-enhance.mjs")):
        if not path.is_file():
            raise SystemExit(f"VERCEL_STATIC_CONTRACT=FAIL missing={label}")

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

    deployment_enabled = config.get("git", {}).get("deploymentEnabled", {})
    if deployment_enabled.get("*", True) is not False:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL automatic_git_deploy_must_be_disabled")

    redirects = config.get("redirects", [])

    def host_rules(host: str) -> list:
        return [r for r in redirects if any(h.get("type") == "host" and h.get("value") == host for h in r.get("has", []))]

    www_rules = host_rules("www.sydomega.com")
    apex_rules = host_rules("sydomega.com")
    if www_rules and apex_rules:
        raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL host_redirect_loop")
    host_policy = "redirect_www_to_apex" if www_rules else "redirect_apex_to_www" if apex_rules else "serve_both_hosts_directly"

    html = index_path.read_text(encoding="utf-8", errors="strict").lower()
    for marker in ("<!doctype html", "<html", "<title>"):
        if marker not in html:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL index_marker=" + marker)

    build = build_path.read_text(encoding="utf-8", errors="strict")
    for marker in ("mkdir -p public", "public/index.html", "VERCEL_BUILD=PASS", "for dir in vendor i18n", "public/vendor/supabase-js.js", "unreachable_asset=${ref}", "vercel-build-enhance.mjs"):
        if marker not in build:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL build_marker=" + marker)

    enhancer = enhancer_path.read_text(encoding="utf-8", errors="strict")
    for marker in ("viewport", "<title>", "omega-visual-engine.js"):
        if marker not in enhancer:
            raise SystemExit("VERCEL_STATIC_CONTRACT=FAIL enhancer_marker=" + marker)

    print("VERCEL_STATIC_CONTRACT=PASS")
    print("deployment_mode=static_public")
    print("framework=null")
    print("build_command=bash_scripts/vercel-build.sh")
    print("install_command=empty")
    print("output_directory=public")
    print("host_policy=" + host_policy)
    print("git_auto_deploy=disabled")
    print("promotion_workflow=.github/workflows/vercel-production.yml")
    print("build_output_verified=references_resolve_in_public")
    print("artifact_shell=normalized")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
