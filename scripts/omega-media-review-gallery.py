#!/usr/bin/env python3
"""Generate a local, read-only visual review gallery for repository media.

The gallery is an inspection aid, not a rights decision or deployment claim.
It embeds repository-relative image/video previews and records each file's
SHA-256 so a human review can be tied to exact bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import mimetypes
from pathlib import Path
from urllib.parse import quote

IMAGE_EXTENSIONS = {".avif", ".bmp", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".tif", ".tiff", ".webp"}
VIDEO_EXTENSIONS = {".m4v", ".mkv", ".mov", ".mp4", ".ogv", ".webm"}
SKIP_DIRS = {".git", ".vercel", ".next", "node_modules", "__pycache__", ".pytest_cache"}


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def media_files(root: Path):
    for path in root.rglob("*"):
        if not path.is_file() or any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        suffix = path.suffix.lower()
        if suffix in IMAGE_EXTENSIONS or suffix in VIDEO_EXTENSIONS:
            yield path, "image" if suffix in IMAGE_EXTENSIONS else "video"


def build_gallery(root: Path, output: Path) -> dict:
    root = root.resolve()
    output = output.resolve()
    if not output.is_relative_to(root):
        raise ValueError("output must be inside the repository root so previews remain local and relative")
    entries = []
    for path, kind in sorted(media_files(root), key=lambda item: item[0].as_posix().casefold()):
        rel = path.relative_to(root).as_posix()
        href = quote(Path(__import__("os").path.relpath(path, output.parent)).as_posix(), safe="/")
        name = html.escape(rel)
        media = (
            f'<img loading="lazy" decoding="async" src="{href}" alt="Preview of {name}">'
            if kind == "image" else
            f'<video controls preload="none" playsinline src="{href}">Video preview unavailable</video>'
        )
        entries.append(
            f'<article class="asset" data-kind="{kind}">'
            f'<div class="preview">{media}</div>'
            f'<div class="meta"><strong>{name}</strong>'
            f'<span>{kind.upper()} · {path.stat().st_size:,} bytes</span>'
            f'<code>SHA-256 {digest(path)}</code>'
            f'<label><input type="checkbox"> Visually reviewed</label>'
            f'<label>Notes <input class="notes" type="text" placeholder="Record observations"></label>'
            f'<p class="warning">Rights, ownership and publication remain UNVERIFIED.</p>'
            f'</div></article>'
        )
    counts = {
        "asset_count": len(entries),
        "image_count": sum(1 for _, kind in media_files(root) if kind == "image"),
        "video_count": sum(1 for _, kind in media_files(root) if kind == "video"),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    document = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>SYD OMEGA — Media Visual Review</title>
<style>
:root{color-scheme:dark;background:#020206;color:#e8e4d8;font:15px/1.5 system-ui,sans-serif}
body{margin:0;padding:24px;max-width:1600px;margin-inline:auto}
h1{color:#e8c97a} .summary{position:sticky;top:0;background:#0a0a0f;padding:12px;border:1px solid #51472b;z-index:2}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;margin-top:20px}
.asset{min-width:0;background:#0a0a0f;border:1px solid #29252a;border-radius:10px;overflow:hidden}
.preview{height:220px;background:#000;display:grid;place-items:center}
.preview img,.preview video{width:100%;height:100%;object-fit:contain}
.meta{padding:12px;display:grid;gap:7px;overflow-wrap:anywhere}
.meta span,.meta code{color:#aaa;font-size:12px}.warning{color:#e8c97a;font-size:12px;margin:0}
label{font-size:13px}.notes{width:100%;box-sizing:border-box;background:#020206;color:#fff;border:1px solid #555;padding:7px}
</style></head><body>
<h1>Ω SYD OMEGA 91717 — Media Visual Review</h1>
<div class="summary"><strong>LOCAL REVIEW ONLY</strong> — checking a box does not persist a rights decision or change the repository.
<div id="count"></div><p>All assets remain rights/ownership UNVERIFIED. Record review findings separately with source evidence.</p></div>
<div class="grid">""" + "".join(entries) + """</div>
<script>const cards=[...document.querySelectorAll('.asset')];document.querySelector('#count').textContent=cards.length+' assets · '+cards.filter(x=>x.dataset.kind==='image').length+' images · '+cards.filter(x=>x.dataset.kind==='video').length+' videos';</script>
</body></html>
"""
    output.write_text(document, encoding="utf-8")
    return counts


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", type=Path, default=Path("artifacts/media-visual-review/index.html"))
    args = parser.parse_args()
    root = args.root.resolve()
    output = args.output if args.output.is_absolute() else root / args.output
    try:
        print(build_gallery(root, output))
    except (OSError, ValueError) as error:
        parser.error(str(error))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
