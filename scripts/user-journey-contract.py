#!/usr/bin/env python3
from pathlib import Path
import json,sys
p=Path(__file__).resolve().parents[1]/'config'/'user-journey-contract.json'
try:d=json.loads(p.read_text(encoding='utf-8'))
except Exception as e: print('USER JOURNEY CONTRACT: FAIL\n- '+str(e));sys.exit(1)
errors=[]
if not isinstance(d.get('version'),str):errors.append('missing version')
rules=d.get('rules')
if not isinstance(rules,list) or not rules:errors.append('rules must be non-empty')
ids=set()
for i,r in enumerate(rules or []):
 if not isinstance(r,dict):errors.append(f'rules[{i}] must be object');continue
 for k in ('id','from','to','goal'):
  if not isinstance(r.get(k),str) or not r[k].strip():errors.append(f'rules[{i}].{k} required')
 if r.get('id') in ids:errors.append(f'duplicate journey id: {r.get("id")}')
 ids.add(r.get('id'))
req=d.get('requirements')
if not isinstance(req,list) or not req:errors.append('requirements must be non-empty')
if errors:
 print('USER JOURNEY CONTRACT: FAIL');[print('- '+x) for x in errors];sys.exit(1)
print(f'USER JOURNEY CONTRACT: PASS ({len(rules)} journeys)')
