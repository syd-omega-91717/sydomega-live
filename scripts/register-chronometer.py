#!/usr/bin/env python3
"""
Register omega-chronometer.js in the bg.js loader.
Run from the repository root:  python3 scripts/register-chronometer.py
Idempotent. Creates bg.js.bak. Verifies with `node --check`.
"""
import os, shutil, subprocess, sys
TARGET="bg.js"
ANCHOR="  /* Unified UI — footer, prev/next nav, back button, keyboard shortcuts */"
INJECTION=("  /* Chronometers: 9m17s approval window + 9h17m17s daily presence */\n"
 "  if(!document.querySelector('script[data-omega-chronometer]')){"
 "var _och=document.createElement('script');_och.src='/omega-chronometer.js';"
 "_och.setAttribute('data-omega-chronometer','1');_och.defer=true;"
 "if(document.body)document.body.appendChild(_och);}\n\n")

def main():
    if not os.path.exists(TARGET): sys.exit("ERROR: bg.js not found. Run from the repo root.")
    if not os.path.exists("omega-chronometer.js"): sys.exit("ERROR: omega-chronometer.js not in repo root.")
    src=open(TARGET,encoding="utf-8").read()
    if "data-omega-chronometer" in src: print("Already registered."); return 0
    if ANCHOR not in src: sys.exit("ERROR: anchor not found. Insert by hand:\n\n"+INJECTION)
    shutil.copy2(TARGET,TARGET+".bak")
    open(TARGET,"w",encoding="utf-8").write(src.replace(ANCHOR,INJECTION+ANCHOR,1))
    print("Registered omega-chronometer.js in bg.js")
    try:
        subprocess.run(["node","--check",TARGET],check=True); print("node --check passed.")
    except FileNotFoundError: print("node not found — verify in a browser.")
    except subprocess.CalledProcessError:
        shutil.copy2(TARGET+".bak",TARGET); sys.exit("SYNTAX ERROR — bg.js restored.")
    return 0
if __name__=="__main__": sys.exit(main())
