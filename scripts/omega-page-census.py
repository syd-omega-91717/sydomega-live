#!/usr/bin/env python3
"""Census every HTML page into the unified platform model.

This is intentionally evidence-only: it inventories what the page contains and
never promotes a page to LIVE merely because a pattern exists in source.
"""
from __future__ import annotations
import json, re, sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"config/omega-page-census.json"

def scan(path:Path)->dict:
    text=path.read_text(encoding="utf-8",errors="ignore")
    scripts=re.findall(r'<script[^>]+src=["\']([^"\']+)["\']',text,re.I)
    assets=re.findall(r'(?:src|href)=["\']([^"\']+)["\']',text,re.I)
    tables=sorted(set(re.findall(r'\.from\(["\']([^"\']+)',text)))
    rpcs=sorted(set(re.findall(r'\.rpc\(["\']([^"\']+)',text)))
    buttons=len(re.findall(r'<button\b',text,re.I))
    forms=len(re.findall(r'<form\b',text,re.I))
    links=len(re.findall(r'<a\b',text,re.I))
    inputs=len(re.findall(r'<(?:input|textarea|select)\b',text,re.I))
    media={
        "images":len(re.findall(r'<img\b',text,re.I)),
        "video":len(re.findall(r'<video\b',text,re.I)),
        "audio":len(re.findall(r'<audio\b',text,re.I)),
        "iframes":len(re.findall(r'<iframe\b',text,re.I))
    }
    return {
        "page_id":path.stem,
        "path":path.as_posix(),
        "scripts":sorted(set(scripts)),
        "assets":sorted(set(assets)),
        "supabase_tables":tables,
        "supabase_rpcs":rpcs,
        "interactive":{
            "buttons":buttons,"forms":forms,"links":links,"inputs":inputs
        },
        "media":media,
        "signals":{
            "localStorage":"localStorage" in text,
            "uploads":bool(re.search(r'upload|storage\.from',text,re.I)),
            "downloads":bool(re.search(r'download|signedUrl|createSignedUrl',text,re.I)),
            "events":bool(re.search(r'omega_platform_events|event-ingest|recordEvent',text,re.I)),
            "truth_state":bool(re.search(r'LIVE|UNAVAILABLE|UNVERIFIED|BLOCKED|LORE|CALCULATED|SIMULATED',text))
        }
    }

def main()->int:
    pages=sorted(ROOT.glob("*.html"))
    rows=[scan(p) for p in pages]
    OUT.write_text(json.dumps({
        "version":1,
        "generated_by":"scripts/omega-page-census.py",
        "page_count":len(rows),
        "pages":rows
    },indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    print(f"PAGES={len(rows)}")
    print(f"INTERACTIVE={sum(r['interactive']['buttons']+r['interactive']['forms']+r['interactive']['inputs'] for r in rows)}")
    print(f"MEDIA_IMAGES={sum(r['media']['images'] for r in rows)}")
    print(f"MEDIA_VIDEO={sum(r['media']['video'] for r in rows)}")
    print(f"MEDIA_AUDIO={sum(r['media']['audio'] for r in rows)}")
    print(f"UPLOAD_SURFACES={sum(r['signals']['uploads'] for r in rows)}")
    print(f"DOWNLOAD_SURFACES={sum(r['signals']['downloads'] for r in rows)}")
    print(f"TRUTH_STATE_SURFACES={sum(r['signals']['truth_state'] for r in rows)}")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
