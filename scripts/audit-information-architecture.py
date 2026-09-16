#!/usr/bin/env python3
"""Ω SYD OMEGA 91717 — deterministic information-architecture audit."""
from __future__ import annotations
import re, sys
from pathlib import Path
from collections import defaultdict
ROOT = Path(__file__).resolve().parents[1]
NAV = ROOT / "nav.js"
def main() -> int:
    if not NAV.exists(): print("IA-AUDIT: FAIL: nav.js is missing"); return 1
    text = NAV.read_text(encoding="utf-8")
    entries = re.findall(r"\[['\"]([^'\"]+)['\"],['\"]([^'\"]+)['\"],['\"]([^'\"]+)['\"]\]", text)
    if not entries: print("IA-AUDIT: FAIL: no navigation entries detected"); return 1
    def duplicates(values):
        groups=defaultdict(list)
        for i,value in enumerate(values,1): groups[value].append(i)
        return {k:v for k,v in groups.items() if len(v)>1}
    keys=[x[0] for x in entries]; labels=[x[1] for x in entries]; targets=[x[2] for x in entries]
    dk,dl,dt=duplicates(keys),duplicates(labels),duplicates(targets)
    html_pages={p.name for p in ROOT.glob("*.html")}
    nav_pages={Path(h.split('#',1)[0]).name for h in targets if h.startswith('/') and h.endswith('.html')}
    orphan=sorted(html_pages-nav_pages)
    print(f"IA-AUDIT: nav_entries={len(entries)} unique_keys={len(set(keys))} unique_labels={len(set(labels))} unique_targets={len(set(targets))}")
    print(f"IA-AUDIT: html_pages={len(html_pages)} nav_referenced_pages={len(html_pages & nav_pages)}")
    print(f"IA-AUDIT: duplicate_keys={len(dk)} duplicate_labels={len(dl)} duplicate_targets={len(dt)} orphan_html_pages={len(orphan)}")
    for name,findings in (("key",dk),("label",dl),("target",dt)):
        for value,positions in sorted(findings.items()): print(f"IA-AUDIT: duplicate_{name}: {value!r} occurrences={len(positions)}")
    for page in orphan: print(f"IA-AUDIT: orphan_page: {page}")
    print("IA-AUDIT: PASS: overlap inventory generated; no files were modified")
    return 0
if __name__ == "__main__": sys.exit(main())
