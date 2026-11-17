#!/usr/bin/env python3
"""Apply and verify the repository's declarative main-branch ruleset.

Requires GH_REPO_ADMIN_TOKEN from a protected GitHub Actions environment.
The token is read only from the environment and is never printed or stored.
"""
from __future__ import annotations

import subprocess
import tempfile
import json
import os
import sys
from pathlib import Path

REPOSITORY = "syd-omega-91717/sydomega-live"
RULESET_ID = 20176798
API_URL = "https://api.github.com/repos/syd-omega-91717/sydomega-live/rulesets/20176798"
CONFIG = Path(__file__).resolve().parents[1] / "config/github-main-ruleset.json"


def request(method: str, token: str, payload: dict | None = None) -> dict:
    if method not in {"GET", "PUT"}:
        raise ValueError("unsupported GitHub API method")
    if not token:
        raise ValueError("GitHub API token is required")
    if "\r" in token or "\n" in token:
        raise ValueError("GitHub API token contains an invalid line break")

    config = [
        f"url = {json.dumps(API_URL)}",
        f"header = {json.dumps('Authorization: Bearer ' + token)}",
        f"header = {json.dumps('Accept: application/vnd.github+json')}",
        f"header = {json.dumps('X-GitHub-Api-Version: 2022-11-28')}",
        f"header = {json.dumps('Content-Type: application/json')}",
        f"header = {json.dumps('User-Agent: sydomega-main-ruleset-guard')}",
    ]

    with tempfile.TemporaryDirectory(prefix="omega-github-api-") as temp_dir:
        if payload is not None:
            payload_path = Path(temp_dir) / "payload.json"
            payload_path.write_text(
                json.dumps(payload, separators=(",", ":"), ensure_ascii=True),
                encoding="utf-8",
            )
            config.append(f"data-binary = {json.dumps('@' + str(payload_path))}")
        config.append(f"request = {json.dumps(method)}")

        command = [
            "curl",
            "--disable",
            "--config", "-",
            "--noproxy", "*",
            "--silent",
            "--show-error",
            "--fail-with-body",
            "--proto", "=https",
            "--tlsv1.2",
            "--connect-timeout", "10",
            "--max-time", "20",
            "--write-out", "\n__OMEGA_HTTP_STATUS__%{http_code}",
        ]
        completed = subprocess.run(
            command,
            input=("\n".join(config) + "\n").encode("utf-8"),
            capture_output=True,
            check=False,
            timeout=25,
        )

    output = completed.stdout.decode("utf-8", errors="replace")
    marker = "\n__OMEGA_HTTP_STATUS__"
    if marker not in output:
        detail = completed.stderr.decode("utf-8", errors="replace")[:500]
        raise RuntimeError(f"GitHub API curl request failed (exit {completed.returncode}): {detail}")

    raw, status_text = output.rsplit(marker, 1)
    try:
        status = int(status_text.strip())
    except ValueError as error:
        raise RuntimeError("GitHub API curl response had an invalid HTTP status") from error

    if not 200 <= status < 300:
        detail = raw[:500]
        raise RuntimeError(f"GitHub API returned HTTP {status}: {detail}")
    if completed.returncode != 0:
        raise RuntimeError(f"GitHub API curl request failed with exit {completed.returncode}")
    return json.loads(raw) if raw else {}


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
        print(__doc__ or "Apply and verify the GitHub main-branch ruleset.")
        return 0
    token = os.environ.get("GH_REPO_ADMIN_TOKEN")
    if not token:
        print("ERROR: GH_REPO_ADMIN_TOKEN is not set.", file=sys.stderr)
        return 2
    expected = json.loads(CONFIG.read_text(encoding="utf-8"))
    before = request("GET", token)
    if before.get("id") != RULESET_ID or before.get("name") != expected["name"]:
        raise RuntimeError("refusing to overwrite an unexpected ruleset")
    request("PUT", token, expected)
    after = request("GET", token)
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
