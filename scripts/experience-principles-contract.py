#!/usr/bin/env python3
"""Fail-closed validation for platform experience principles."""
from pathlib import Path
import json,sys
p=Path(__file__).resolve().parents[1]/'config'/'experience-principles.json'
try: d=json.loads(p.read_text(encoding='utf-8'))
except Exception as e: print('EXPERIENCE PRINCIPLES: FAIL\n- '+str(e)); sys.exit(1)
required={'one-purpose','visual-first','non-repetitive','living-content','safe-creation','monetization-trust','investment-boundary','accessible-motion','failure-visible','reversible'}
actual={x.get('id') for x in d.get('principles',[]) if isinstance(x,dict)}
missing=required-actual
if not isinstance(d.get('version'),str) or missing:
 print('EXPERIENCE PRINCIPLES: FAIL')
 if not isinstance(d.get('version'),str): print('- missing version')
 for x in sorted(missing): print('- missing principle: '+x)
 sys.exit(1)
print(f'EXPERIENCE PRINCIPLES: PASS ({len(actual)} principles)')
