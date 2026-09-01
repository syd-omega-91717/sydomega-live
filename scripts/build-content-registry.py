#!/usr/bin/env python3
"""Generate a deterministic inventory of the static HTML page estate.

This is intentionally additive: it inventories existing pages without deleting,
renaming, or rewriting them. Human-curated fields can be added later to the
canonical registry and are never overwritten by this generator.
"""
from pathlib import Path
import json
import re

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "config" / "page-estate.generated.json"
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
DESC_RE = re.compile(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', re.I | re.S)

def clean(value):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", value or "")).strip()

pages = []
for path in sorted(ROOT.glob("*.html")):
    if path.name.startswith("_"):
        continue
    text = path.read_text(encoding="utf-8", errors="ignore")
    title = clean((TITLE_RE.search(text) or [None, ""])[1])
    description = clean((DESC_RE.search(text) or [None, ""])[1])
    route = "/" + path.name
    page_id = path.stem.lower().replace("_", "-")
    pages.append({
        "id": page_id,
        "route": route,
        "title": title,
        "description": description,
        "source": path.name,
    })

payload = {
    "version": "1.0.0",
    "generated": True,
    "pageCount": len(pages),
    "pages": pages,
}
OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"PAGE ESTATE INVENTORY: {len(pages)} HTML pages")
print(OUT.relative_to(ROOT))
