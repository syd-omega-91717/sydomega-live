#!/usr/bin/env python3
"""Claude Code hook: catch this repo's costliest edit mistakes at the moment they are made.

Wired from .claude/settings.json. Reads the hook event JSON on stdin.

    omega_guard.py pre   (PreToolUse, Edit|Write|MultiEdit|NotebookEdit)
        Blocks (exit 2, reason on stderr -> fed back to the agent):
          - any write under public/      -- the Vercel build output; never committed
                                            (CLAUDE.md 8.2, scripts/vercel-build.sh)
          - any write to .env / .env.*   -- secrets go through `supabase secrets set`
                                            (CLAUDE.md 9); .env.example is allowed
          - an edit to a supabase/migrations/*.sql file that already exists on
            origin/main                  -- applied migrations are never rewritten;
                                            new schema is a NEW timestamped file
                                            (CLAUDE.md 5). A migration created on
                                            this branch can still be edited.

    omega_guard.py post  (PostToolUse, same matcher)
        After a write to a repo-root .js file, runs `node --check`; after a write
        to any .json file outside vendor/, parses it. On failure exits 2 so the
        agent sees the error immediately. bg.js is loaded by every page and a
        parse error in it takes the whole platform down (CLAUDE.md 2), and CI
        only finds out after the push.

Never blocks on its own failure: an unreadable payload, missing node, or no git
remote exits 0. A guard that breaks editing is worse than no guard.
"""

import json
import os
import subprocess
import sys

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)


def repo_root():
    return os.environ.get("CLAUDE_PROJECT_DIR") or os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def target(payload):
    ti = payload.get("tool_input") or {}
    p = ti.get("file_path") or ti.get("notebook_path") or ""
    if not p:
        return None, None
    root = os.path.realpath(repo_root())
    absp = os.path.realpath(p if os.path.isabs(p) else os.path.join(root, p))
    if absp != root and not absp.startswith(root + os.sep):
        return absp, None  # outside the repo: not ours to judge
    return absp, os.path.relpath(absp, root).replace(os.sep, "/")


def block(msg):
    print("omega_guard: " + msg, file=sys.stderr)
    raise SystemExit(2)


def on_main(rel):
    try:
        r = subprocess.run(["git", "cat-file", "-e", "origin/main:" + rel], cwd=repo_root(),
                           capture_output=True, timeout=10)
        return r.returncode == 0
    except Exception:
        return False


def pre(payload):
    _, rel = target(payload)
    if not rel:
        return
    base = rel.rsplit("/", 1)[-1]
    if rel == "public" or rel.startswith("public/"):
        block("public/ is the Vercel build output (scripts/vercel-build.sh) and is never committed. "
              "Edit the source file at the repo root instead.")
    if (base == ".env" or base.startswith(".env.")) and base != ".env.example":
        block("secrets are never written to files here; set them with `supabase secrets set` (CLAUDE.md 9).")
    if rel.startswith("supabase/migrations/") and rel.endswith(".sql") and on_main(rel):
        block("%s is already on origin/main, so treat it as applied: never rewrite an applied migration. "
              "Put the change in a NEW timestamped migration (CLAUDE.md 5)." % rel)


def post(payload):
    absp, rel = target(payload)
    if not rel or not os.path.isfile(absp):
        return
    if rel.endswith(".js") and "/" not in rel:
        try:
            r = subprocess.run(["node", "--check", absp], capture_output=True, text=True, timeout=30)
        except Exception:
            return
        if r.returncode != 0:
            extra = " bg.js is loaded by every page: this would take the whole platform down." if rel == "bg.js" else ""
            block("node --check failed on %s.%s\n%s" % (rel, extra, (r.stderr or r.stdout).strip()[-1500:]))
    elif rel.endswith(".json") and not rel.startswith("vendor/"):
        try:
            with open(absp, encoding="utf-8") as fh:
                json.load(fh)
        except ValueError as e:
            block("%s is no longer valid JSON: %s" % (rel, e))


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ""
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0
    if mode == "pre":
        pre(payload)
    elif mode == "post":
        post(payload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
