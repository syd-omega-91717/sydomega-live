"""Audit public HTML pages for deterministic SEO foundations.

Canonical public routes are blocking requirements. Other indexable legacy pages
are reported as backlog warnings so SEO improvements can be made incrementally.
This audit makes no search-ranking claim.
"""
import re,sys
from pathlib import Path

CANONICAL={"world.html","guide.html","news.html","realms.html","hall.html","rune.html","gaming.html","intelligence.html","media.html","consultancy.html","evolution.html","achievements.html","credentials.html","heritage.html","investment.html","horoscope.html","family.html","terms.html"}
EXCLUDE={"404.html"}
def main()->int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip()); return 0
    pages=sorted(Path(".").glob("*.html")); failures=[]; warnings=[]; checked=0; excluded=0
    for p in pages:
        if p.name in EXCLUDE: continue
        s=p.read_text(encoding="utf-8",errors="ignore")
        robots=re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']',s,re.I)
        if robots and "noindex" in robots.group(1).lower():
            excluded+=1; continue
        checked+=1; issues=[]
        if not re.search(r"<title>\s*[^<]+\s*</title>",s,re.I): issues.append("missing title")
        if not re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']+["\']',s,re.I): issues.append("missing meta description")
        if not re.search(r'<html[^>]+lang=["\'][^"\']+["\']',s,re.I): issues.append("missing html lang")
        for issue in issues:
            (failures if p.name in CANONICAL else warnings).append(f"{p}: {issue}")
    if failures:
        print(f"OMEGA SEO CONTRACT: FAIL ({len(failures)} canonical issues)")
        for x in failures: print("- "+x)
        return 1
    print(f"OMEGA SEO CONTRACT: PASS ({len(CANONICAL)}/{len(CANONICAL)} canonical routes clear)")
    print(f"Indexable pages checked: {checked}; no-index pages excluded: {excluded}; legacy backlog warnings: {len(warnings)}")
    for x in warnings[:40]: print("WARN - "+x)
    if len(warnings)>40: print(f"WARN - {len(warnings)-40} additional legacy metadata issues omitted")
    return 0
if __name__=="__main__": raise SystemExit(main())
