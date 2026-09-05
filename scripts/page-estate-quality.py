#!/usr/bin/env python3
"""Fail-closed quality audit for the static page estate.

Reports structural issues without modifying pages. It deliberately avoids
semantic similarity claims; those require a canonical registry review.
"""
from pathlib import Path
from html.parser import HTMLParser
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
errors=[]; warnings=[]

class P(HTMLParser):
    def __init__(self):
        super().__init__(); self.title=[]; self.in_title=False; self.h1=0; self.meta_desc=0
    def handle_starttag(self, tag, attrs):
        tag=tag.lower(); attrs=dict(attrs)
        if tag=='title': self.in_title=True
        if tag=='h1': self.h1+=1
        if tag=='meta' and attrs.get('name','').lower()=='description': self.meta_desc+=1
    def handle_endtag(self, tag):
        if tag.lower()=='title': self.in_title=False
    def handle_data(self,data):
        if self.in_title: self.title.append(data)

pages=sorted(p for p in ROOT.rglob('*.html') if not any(x in p.parts for x in SKIP))
titles={}; descriptions={}
for p in pages:
    try: text=p.read_text(encoding='utf-8',errors='replace'); q=P(); q.feed(text)
    except Exception as exc: errors.append(f'{p.relative_to(ROOT)}: parse failure: {exc}'); continue
    title=' '.join(''.join(q.title).split())
    if not title: errors.append(f'{p.relative_to(ROOT)}: missing title')
    else: titles.setdefault(title,[]).append(p)
    if q.h1>1: warnings.append(f'{p.relative_to(ROOT)}: multiple H1 elements ({q.h1})')
    if q.meta_desc>1: warnings.append(f'{p.relative_to(ROOT)}: multiple meta descriptions')

for title,paths in titles.items():
    if len(paths)>1: warnings.append('duplicate title: '+repr(title)+' -> '+', '.join(str(x.relative_to(ROOT)) for x in paths))

print(f'PAGE ESTATE: {len(pages)} HTML pages scanned')
print(f'UNIQUE TITLES: {len(titles)}')
if warnings: print(f'WARNINGS: {len(warnings)}'); [print('- '+x) for x in warnings]
if errors:
    print(f'ERRORS: {len(errors)}'); [print('- '+x) for x in errors]; sys.exit(1)
print('PAGE ESTATE QUALITY: PASS')
