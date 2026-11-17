#!/usr/bin/env python3
"""Apply and verify the repository's declarative main-branch ruleset.

Requires GH_REPO_ADMIN_TOKEN from a protected GitHub Actions environment.
The token is read only from the environment and is never printed or stored.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPOSITORY = "syd-omega-91717/sydomega-live"
RULESET_ID = 20176798
API = f"https://api.github.com/repos/{REPOSITORY}/rulesets/{RULESET_ID}"
CONFIG = Path(__file__).resolve().parents[1] / "config/github-main-ruleset.json"


def request(method: str, url: str, token: str, payload: dict | None = None) -> dict:
    if not url.startswith("https://api.github.com/"):
        raise ValueError("refusing non-GitHub HTTPS API URL")
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            "User-Agent": "sydomega-main-ruleset-guard",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"GitHub API returned HTTP {exc.code}: {detail}") from exc


def verify(state: dict, expected: dict) -> None:
    if state.get("id") != RULESET_ID or state.get("name") != expected["name"]:
        raise RuntimeError("ruleset identity does not match the reviewed target")
    if state.get("enforcement") != "active":
        raise RuntimeError("ruleset enforcement is not active")
    if state.get("target") != "branch":
        raise RuntimeError("ruleset target is not branch")
    refs = state.get("conditions", {}).get("ref_name", {})
    if refs.get("include") != ["refs/heads/main"] or refs.get("exclude") != []:
        raise RuntimeError("ruleset does not target exactly refs/heads/main")
    if state.get("bypass_actors") != []:
        raise RuntimeError("unexpected ruleset bypass actor configured")
    expected_rules = {item["type"]: item.get("parameters", {}) for item in expected["rules"]}
    actual_rules = {item.get("type"): item.get("parameters", {}) for item in state.get("rules", [])}
    if set(actual_rules) != set(expected_rules):
        raise RuntimeError("provider rules do not exactly match the reviewed ruleset")
    pr = actual_rules["pull_request"]
    expected_pr = expected_rules["pull_request"]
    for key, value in expected_pr.items():
        if pr.get(key) != value:
            raise RuntimeError(f"pull request rule parameter {key} does not match reviewed policy")
    checks = actual_rules["required_status_checks"]
    expected_checks = expected_rules["required_status_checks"]
    for key in ("strict_required_status_checks_policy", "do_not_enforce_on_create"):
        if checks.get(key) != expected_checks.get(key):
            raise RuntimeError(f"required status check parameter {key} does not match reviewed policy")
    actual_list = checks.get("required_status_checks", [])
    actual = [entry.get("context") for entry in actual_list]
    expected_contexts = [entry["context"] for entry in expected_checks["required_status_checks"]]
    if actual != expected_contexts:
        raise RuntimeError("provider required status check contexts do not exactly match reviewed policy")


def main() -> int:
    if any(argument in ("-h", "--help") for argument in sys.argv[1:]):
        print(__doc__ or "Apply and verify the GitHub main branch ruleset.")
        return 0
    token = os.environ.get("GH_REPO_ADMIN_TOKEN")
    if not token:
        print("ERROR: GH_REPO_ADMIN_TOKEN is not set.", file=sys.stderr)
        return 2
    expected = json.loads(CONFIG.read_text(encoding="utf-8"))
    before = request("GET", API, token)
    if before.get("id") != RULESET_ID or before.get("name") != expected["name"]:
        raise RuntimeError("refusing to overwrite an unexpected ruleset")
    request("PUT", API, token, expected)
    after = request("GET", API, token)
    verify(after, expected)
    print("GITHUB_MAIN_RULESET=ACTIVE")
    print("target=refs/heads/main")
    print("required_status_checks=" + str(len(expected["rules"][-1]["parameters"]["required_status_checks"])))
    print("bypass_actors=0")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
