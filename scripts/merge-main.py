#!/usr/bin/env python3
"""Merge origin/main into the current branch and resolve the conflicts that are always resolved the same way.

WHY: five times in one day a PR went "conflicting" because another PR merged first, and each time the fix was the same
few steps done by hand. This does them, safely, so a session (or an automation) cannot get them subtly wrong.
It is a MERGE commit, never a rebase or force-push (CLAUDE.md 8.2: an open PR's head is never rewritten).

WHAT IT RESOLVES
  FIXES_LOG.md                              keep both sides (main first). Frozen history: fixes-log-frozen.py will
                                            then tell the author to move their entry to docs/fixes/.
  scripts/{xss-sink,csp-inline,esc-copy}-baseline.json
                                            a ratchet may only fall: per key, the lower of the two sides.
  OMEGA_SKILL_REGISTRY.md                   take main's, then regenerate (scripts/omega-registry.py).
  config/omega-page-contract{s,-bootstrap}.json
                                            take main's, then regenerate (omega-page-contract-bootstrap.py --promote).
Anything else is left conflicted and listed: a human (or you) decides, because both sides changed the same logic.

After it succeeds, re-run the gates (./scripts/ci-local.sh) before pushing: a resolved file is not a verified one.

Usage: python3 scripts/merge-main.py        (working tree must be clean)       Exit 0 merged, 1 conflicts left, 2 usage.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
import subprocess
import time
from pathlib import Path

BASELINES = {"scripts/xss-sink-baseline.json", "scripts/csp-inline-baseline.json", "scripts/esc-copy-baseline.json"}
GENERATED = {
    "OMEGA_SKILL_REGISTRY.md": ["python3", "scripts/omega-registry.py"],
    "config/omega-page-contracts.json": ["python3", "scripts/omega-page-contract-bootstrap.py", "--promote"],
    "config/omega-page-contract-bootstrap.json": ["python3", "scripts/omega-page-contract-bootstrap.py", "--promote"],
}
BLOCK = re.compile(r"^<<<<<<< [^\n]*\n(.*?)^=======\n(.*?)^>>>>>>> [^\n]*\n", re.S | re.M)


def git(root, *args, check=True):
    return subprocess.run(["git", "-C", str(root), *args], capture_output=True, text=True, check=check)


def lower(a, b):
    """Per key the lower of two ratchet baselines; a key missing on one side counts as 0 and is dropped."""
    if isinstance(a, dict) and isinstance(b, dict):
        out = {}
        for k in sorted(set(a) | set(b)):
            if k.startswith("_"):
                out[k] = a.get(k, b.get(k))
                continue
            if k in a and k in b:
                v = lower(a[k], b[k])
                if v not in (0, {}, None):
                    out[k] = v
        return out
    if isinstance(a, int) and isinstance(b, int):
        return min(a, b)
    return a


def resolve_fixes_log(root):
    p = root / "FIXES_LOG.md"
    text = p.read_text(encoding="utf-8")
    blocks = BLOCK.findall(text)
    if len(blocks) != 1:
        return False
    ours, theirs = blocks[0]
    p.write_text(BLOCK.sub(lambda m: theirs.rstrip("\n") + "\n\n" + ours.lstrip("\n"), text, count=1), encoding="utf-8")
    return True


def resolve_baseline(root, rel):
    try:
        ours = json.loads(git(root, "show", f":2:{rel}").stdout)
        theirs = json.loads(git(root, "show", f":3:{rel}").stdout)
    except (subprocess.CalledProcessError, ValueError):
        return False
    (root / rel).write_text(json.dumps(lower(ours, theirs), indent=1) + "\n", encoding="utf-8")
    return True


def main(argv: list[str]) -> int:
    top = git(Path.cwd(), "rev-parse", "--show-toplevel", check=False)
    if top.returncode:
        print("not inside a git repository")
        return 2
    root = Path(top.stdout.strip())
    if git(root, "status", "--porcelain").stdout.strip():
        print("working tree is not clean: commit or stash first")
        return 2
    for i in range(4):
        if git(root, "fetch", "-q", "origin", "main", check=False).returncode == 0:
            break
        time.sleep(2 ** (i + 1))
    else:
        print("could not fetch origin/main")
        return 2
    if git(root, "merge", "--no-edit", "origin/main", check=False).returncode == 0:
        print("merged origin/main cleanly (no conflicts)")
        return 0
    conflicted = [f for f in git(root, "diff", "--name-only", "--diff-filter=U").stdout.split("\n") if f]
    left, regen = [], []
    for rel in conflicted:
        ok = False
        if rel == "FIXES_LOG.md":
            ok = resolve_fixes_log(root)
        elif rel in BASELINES:
            ok = resolve_baseline(root, rel)
        elif rel in GENERATED:
            ok = git(root, "checkout", "--theirs", "--", rel, check=False).returncode == 0
            regen.append(rel)
        if ok:
            git(root, "add", "--", rel)
            print(f"  resolved  {rel}")
        else:
            left.append(rel)
    if left:
        print(f"{len(left)} file(s) still conflicted (both sides changed the same logic; decide by hand):")
        for rel in left:
            print("  CONFLICT ", rel)
        return 1
    for cmd in {tuple(GENERATED[r]) for r in regen}:
        if (root / cmd[1]).exists():
            subprocess.run(list(cmd), cwd=root, capture_output=True)
            print("  regenerated with", " ".join(cmd))
    git(root, "add", "-A")
    git(root, "commit", "-q", "--no-edit")
    print("merged origin/main; now re-run ./scripts/ci-local.sh before you push")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(_sys.argv[1:]))
