#!/usr/bin/env python3
"""Block duplicate object keys, case labels, parameters and class members in production JS.

Runs ESLint (pinned, `npx`) over every root `*.js` with ONLY the `no-dupe-*` / `no-duplicate-case`
rules from scripts/eslint-dupes.config.mjs. A duplicate key is a silent override: the later value
wins and the earlier one is dead code that still looks live in a diff (the bug class behind
FIXES_LOG 2026-11-01, a dead second `pages:` in nav.js).

Before the real run it proves the gate can fail: a planted `({a:1,a:2})` must be reported, otherwise
the run fails (a "0 findings" result from a broken linter is worthless, CLAUDE.md 8.4).

Needs Node with `npx` and network access for the first `npx` fetch (cached afterwards).

Usage:
  python3 scripts/check-dupe-keys.py
  python3 scripts/check-dupe-keys.py --help

Exit 0 = clean, 1 = duplicates found or the gate could not prove itself.
"""
import json
import shutil
import subprocess
import sys
import time
from pathlib import Path

ESLINT = "9.39.5"  # exact pin: a lint rule set must not change under a green build
ROOT = Path(__file__).resolve().parent.parent
CONFIG = "scripts/eslint-dupes.config.mjs"
BASE = ["npx", "--yes", "eslint@" + ESLINT, "--no-config-lookup", "-c", CONFIG]


def run(args, stdin=None):
    """Run eslint; retry only when npx itself failed to fetch (network), never on lint findings."""
    last = None
    for attempt in range(3):
        last = subprocess.run(args, cwd=ROOT, input=stdin, capture_output=True, text=True)
        npx_failed = last.returncode not in (0, 1) and ("npm error" in last.stderr or "ENOTFOUND" in last.stderr
                                                         or "ETIMEDOUT" in last.stderr or "ECONNRESET" in last.stderr)
        if not npx_failed:
            return last
        time.sleep(2 * (attempt + 1))
    return last


def main() -> int:
    if any(a in ("--help", "-h") for a in sys.argv[1:]):
        print(__doc__)
        return 0
    if not shutil.which("npx"):
        print("DUPE-KEYS=FAIL npx not found: install Node (see .nvmrc)")
        return 1

    # 1. The gate must be able to fail.
    planted = run(BASE + ["--stdin", "--stdin-filename", "planted.js", "-f", "json"], stdin="({a: 1, a: 2});")
    try:
        found = [m.get("ruleId") for f in json.loads(planted.stdout) for m in f["messages"]]
    except Exception:
        found = []
    if "no-dupe-keys" not in found:
        print("DUPE-KEYS=FAIL self-check: a planted duplicate key was NOT reported, so a clean result would mean nothing")
        print((planted.stdout + planted.stderr)[-600:])
        return 1

    # 2. The real run.
    files = sorted(p.name for p in ROOT.glob("*.js"))
    res = run(BASE + ["--max-warnings", "0", "-f", "json", *files])
    try:
        report = json.loads(res.stdout)
    except Exception:
        print("DUPE-KEYS=FAIL eslint produced no JSON report")
        print((res.stdout + res.stderr)[-800:])
        return 1
    bad = [(Path(f["filePath"]).name, m) for f in report for m in f["messages"]]
    for name, m in bad:
        kind = "PARSE ERROR" if m.get("fatal") else m.get("ruleId")
        print(f"  {name}:{m.get('line')}  {kind}  {m.get('message')}")
    if bad:
        print(f"DUPE-KEYS=FAIL {len(bad)} finding(s) in {len({n for n, _ in bad})} file(s) "
              "(delete the earlier, dead duplicate; the later one is what runs)")
        return 1
    print(f"DUPE-KEYS=PASS {len(files)} root .js files, eslint@{ESLINT}, self-check ok")
    return 0


if __name__ == "__main__":
    sys.exit(main())
