#!/usr/bin/env python3
"""
Register omega-demo-video.js in the bg.js loader.

Run from the repository root:  python3 scripts/register_demo_video.py
Idempotent. Creates bg.js.bak. Verifies with `node --check`.

WHY THIS IS NEEDED
------------------
omega-demo-video.js was included via a per-page <script> tag on 41 of 105
pages. dashboard.html was NOT one of them — and account.html redirects every
successful login to /dashboard.html. Members landed on a page where the module
did not exist, so autoplay could never fire.

bg.js loads on 104 of 105 pages, so registering here guarantees the demo is
present everywhere a member can land. The existing per-page <script> tags stay
harmless: the module's __omegaDemoVideo guard makes a second load a no-op.
"""
import os, shutil, subprocess, sys

TARGET = "bg.js"
ANCHOR = "  /* Unified UI — footer, prev/next nav, back button, keyboard shortcuts */"
INJECTION = (
    "  /* Welcome demo video — must load on dashboard.html, the login landing page */\n"
    "  if(!document.querySelector('script[data-omega-demo]')){"
    "var _odv=document.createElement('script');_odv.src='/omega-demo-video.js';"
    "_odv.setAttribute('data-omega-demo','1');_odv.defer=true;"
    "if(document.body)document.body.appendChild(_odv);}\n\n"
)

def main():
    if not os.path.exists(TARGET):
        sys.exit("ERROR: bg.js not found. Run from the repository root.")
    if not os.path.exists("omega-demo-video.js"):
        sys.exit("ERROR: omega-demo-video.js not found in the repo root.")

    src = open(TARGET, encoding="utf-8").read()
    if "data-omega-demo" in src:
        print("Already registered. Nothing to do."); return 0
    if ANCHOR not in src:
        sys.exit("ERROR: anchor not found in bg.js. Insert by hand:\n\n" + INJECTION)

    shutil.copy2(TARGET, TARGET + ".bak")
    open(TARGET, "w", encoding="utf-8").write(src.replace(ANCHOR, INJECTION + ANCHOR, 1))
    print("Registered omega-demo-video.js in bg.js (backup: bg.js.bak)")

    try:
        subprocess.run(["node", "--check", TARGET], check=True)
        print("node --check passed.")
    except FileNotFoundError:
        print("node not found — verify in a browser.")
    except subprocess.CalledProcessError:
        shutil.copy2(TARGET + ".bak", TARGET)
        sys.exit("SYNTAX ERROR — bg.js restored from backup.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
