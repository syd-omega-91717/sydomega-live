#!/usr/bin/env python3
"""Assert omega-emblem-panel.js never rebuilds its panel via raw innerHTML.

Guards against the dynamic-HTML-sink regression this module previously had
(CLAUDE.md 8.1 class: an interpolated string handed to innerHTML). Reporting
only -- source is read, never rewritten.
"""
import sys
from pathlib import Path

if "--help" in sys.argv[1:] or "-h" in sys.argv[1:]:
    print(__doc__)
    sys.exit(0)

p = Path('omega-emblem-panel.js')
s = p.read_text(encoding='utf-8')
assert "body.innerHTML = html" not in s
assert "wrap.innerHTML = html" not in s
assert "'<div id=\\\"oep-panel\\\"" not in s
print('emblem-panel dynamic HTML interpolation absent')
