#!/usr/bin/env python3
"""Fail-closed check that the platform's non-destructive engineering rules exist."""
from pathlib import Path
import json, sys
p=Path(__file__).resolve().parents[1]/'config'/'platform-principles.json'
try: d=json.loads(p.read_text(encoding='utf-8'))
except Exception as e: print(f'PLATFORM PRINCIPLES: FAIL\n- {e}'); sys.exit(1)
required={'preserve','canonical','action','accessibility','trust','evidence','rollback'}
actual={x.get('id') for x in d.get('principles',[]) if isinstance(x,dict)}
missing=required-actual
if missing:
 print('PLATFORM PRINCIPLES: FAIL')
 for x in sorted(missing): print('- missing principle: '+x)
 sys.exit(1)
print('PLATFORM PRINCIPLES: PASS')
