#!/usr/bin/env python3
from pathlib import Path
p=Path('omega-emblem-panel.js')
s=p.read_text(encoding='utf-8')
assert "body.innerHTML = html" not in s
assert "wrap.innerHTML = html" not in s
assert "'<div id=\\\"oep-panel\\\"" not in s
print('emblem-panel dynamic HTML interpolation absent')
