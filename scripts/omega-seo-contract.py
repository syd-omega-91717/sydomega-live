"""Audit indexable HTML pages for deterministic SEO foundations.

No-index/internal pages are excluded from public SEO requirements. This audit
checks metadata presence and avoids making search-engine ranking claims.
"""
import re,sys
from pathlib import Path

EXCLUDE={"404.html"}
def main()->int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip()); return 0
    pages=sorted(Path(".").glob("*.html"))
    failures=[]; checked=0; excluded=0
    for p in pages:
        if p.name in EXCLUDE: continue
        s=p.read_text(encoding="utf-8",errors="ignore")
        robots=re.search(r'<meta[^>]+name=["\']robots["\'][^>]+content=["\']([^"\']*)["\']',s,re.I)
        if robots and "noindex" in robots.group(1).lower():
            excluded+=1; continue
        checked+=1
        if not re.search(r"<title>\s*[^<]+\s*</title>",s,re.I): failures.append(f"{p}: missing title")
        if not re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'][^"\']+["\']',s,re.I): failures.append(f"{p}: missing meta description")
        if not re.search(r'<html[^>]+lang=["\'][^"\']+["\']',s,re.I): failures.append(f"{p}: missing html lang")
    if failures:
        print(f"OMEGA SEO CONTRACT: FAIL ({len(failures)} issues across {checked} indexable pages; {excluded} no-index pages excluded)")
        for x in failures[:100]: print("- "+x)
        return 1
    print(f"OMEGA SEO CONTRACT: PASS ({checked} indexable HTML pages; {excluded} no-index pages excluded)")
    return 0
if __name__=="__main__": raise SystemExit(main())
