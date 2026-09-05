#!/usr/bin/env python3
"""Detect likely duplicate/overlapping HTML pages without changing the estate.

This is an advisory audit: existing overlap is reported, never auto-deleted.
The comparison uses normalized visible text and page titles and is intended
for human consolidation decisions, not as proof of equivalence.
"""
from pathlib import Path
from html.parser import HTMLParser
from difflib import SequenceMatcher
import re
import sys

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", ".git", ".next", "dist", "build", "public"}  # public/ is this repo's build output
# (scripts/vercel-build.sh copies the whole web surface into it), so leaving it
# in scope makes every page a duplicate of itself. The set already excluded
# dist/ and build/ for exactly this reason; it just did not know our name for it.
LIMIT = 1200

class Extractor(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=[]; self.h1=[]; self._title=False; self._h1=False; self.body=[]
    def handle_starttag(self, tag, attrs):
        t=tag.lower()
        if t=='title': self._title=True
        if t=='h1': self._h1=True
        if t in {'script','style','noscript','svg'}: self.body.append(' ')
    def handle_endtag(self, tag):
        t=tag.lower()
        if t=='title': self._title=False
        if t=='h1': self._h1=False
    def handle_data(self,data):
        if self._title: self.title.append(data)
        if self._h1: self.h1.append(data)
        self.body.append(data)

def norm(value):
    return re.sub(r'\s+', ' ', value).strip().lower()

pages=[]
for path in sorted(ROOT.rglob('*.html')):
    if any(part in SKIP for part in path.parts): continue
    try:
        parser=Extractor(); parser.feed(path.read_text(encoding='utf-8',errors='replace'))
        text=norm(' '.join(parser.body))
        pages.append((path,text,norm(' '.join(parser.title)),norm(' '.join(parser.h1))))
    except Exception as exc:
        print(f'PARSE ERROR: {path.relative_to(ROOT)}: {exc}')

pairs=[]
for i,(a,ta,tila,h1a) in enumerate(pages):
    if len(ta)<80: continue
    for b,tb,tilb,h1b in pages[i+1:]:
        if len(tb)<80: continue
        if tila and tila==tilb:
            score=1.0
        elif h1a and h1a==h1b:
            score=0.98
        else:
            # Compare bounded content to keep CI deterministic and fast.
            score=SequenceMatcher(None,ta[:LIMIT],tb[:LIMIT],autojunk=False).ratio()
        if score>=0.92:
            pairs.append((score,a.relative_to(ROOT),b.relative_to(ROOT)))

print(f'PAGE OVERLAP AUDIT: {len(pages)} pages scanned')
if pairs:
    print(f'LIKELY OVERLAPS: {len(pairs)}')
    for score,a,b in sorted(pairs,reverse=True)[:200]:
        print(f'- {score:.3f} | {a} | {b}')
else:
    print('LIKELY OVERLAPS: 0')
print('PAGE OVERLAP AUDIT: PASS (advisory; no files modified)')
