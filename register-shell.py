#!/usr/bin/env python3
"""
Register omega-shell.js in the bg.js loader.

Run from the repository root, AFTER copying omega-shell.js there:
    python3 scripts/register_shell.py

Idempotent. Creates bg.js.bak. Verifies with `node --check` if node is present.
"""
import os, re, shutil, subprocess, sys

TARGET = "bg.js"
ANCHOR = "  /* Unified UI — footer, prev/next nav, back button, keyboard shortcuts */"

INJECTION = (
    "  /* Async region shell — loading/empty/error states + retry (audit F-6) */\n"
    "  if(!document.querySelector('script[data-omega-shell]')){"
    "var _osh=document.createElement('script');_osh.src='/omega-shell.js';"
    "_osh.setAttribute('data-omega-shell','1');_osh.defer=true;"
    "if(document.body)document.body.appendChild(_osh);}\n\n"
)

def main():
    if not os.path.exists(TARGET):
        sys.exit("ERROR: bg.js not found. Run from the repository root.")
    if not os.path.exists("omega-shell.js"):
        sys.exit("ERROR: omega-shell.js not found. Copy it to the repo root first.")

    src = open(TARGET, encoding="utf-8").read()
    if "data-omega-shell" in src:
        print("Already registered. Nothing to do.")
        return 0
    if ANCHOR not in src:
        sys.exit(
            "ERROR: anchor comment not found in bg.js.\n"
            "bg.js has changed since the audit. Insert the injection by hand,\n"
            "next to the other module injections:\n\n" + INJECTION
        )

    shutil.copy2(TARGET, TARGET + ".bak")
    open(TARGET, "w", encoding="utf-8").write(src.replace(ANCHOR, INJECTION + ANCHOR, 1))
    print("Registered omega-shell.js in bg.js (backup: bg.js.bak)")

    try:
        subprocess.run(["node", "--check", TARGET], check=True)
        print("node --check passed.")
    except FileNotFoundError:
        print("node not found — skipping syntax check. Verify in a browser.")
    except subprocess.CalledProcessError:
        shutil.copy2(TARGET + ".bak", TARGET)
        sys.exit("SYNTAX ERROR introduced — bg.js restored from backup.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
