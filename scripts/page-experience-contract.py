#!/usr/bin/env python3
"""Validate the canonical page-experience profiles used by the UI runtime."""
from pathlib import Path
import json, sys

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'config'/'page-experience.json'
errors=[]
try: data=json.loads(path.read_text(encoding='utf-8'))
except Exception as exc:
    print(f'PAGE EXPERIENCE CONTRACT: FAIL\n- invalid JSON: {exc}'); sys.exit(1)
allowed_motion={'none','micro','ambient','cinematic','immersive'}
allowed_depth={'flat','layered','3d'}
allowed_density={'minimal','balanced','rich'}
for key in ('version','defaults','archetypes'):
    if key not in data: errors.append(f'missing {key}')
def check(name,obj):
    for key in ('motion','depth','contentDensity','primaryAction'):
        if not isinstance(obj.get(key),str) or not obj[key].strip(): errors.append(f'{name}: missing {key}')
    if obj.get('motion') not in allowed_motion: errors.append(f'{name}: invalid motion')
    if obj.get('depth') not in allowed_depth: errors.append(f'{name}: invalid depth')
    if obj.get('contentDensity') not in allowed_density: errors.append(f'{name}: invalid contentDensity')
if isinstance(data.get('defaults'),dict): check('defaults',data['defaults'])
if isinstance(data.get('archetypes'),dict):
    for name,obj in data['archetypes'].items():
        if isinstance(obj,dict): check(name,obj)
        else: errors.append(f'{name}: profile must be object')
if errors:
    print('PAGE EXPERIENCE CONTRACT: FAIL')
    for e in errors: print('- '+e)
    sys.exit(1)
print(f"PAGE EXPERIENCE CONTRACT: PASS ({len(data['archetypes'])} archetypes)")
