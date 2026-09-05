#!/usr/bin/env python3
"""Repository-wide deterministic integrity audit for SYD OMEGA 91717."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORE_DIRS = {".git", "node_modules", "public"}
TEXT_EXTS = {".html", ".htm", ".js", ".mjs", ".cjs", ".json", ".css", ".py", ".sh", ".sql", ".md", ".yml", ".yaml", ".txt", ".xml", ".svg"}
LOCAL_RE = re.compile(r'''(?:src|href|action)\\s*=\\s*["']([^"'#?]+)''', re.I)
ABS_LOCAL = re.compile(r"^(?:/|\\./|\\.\\./)")

class Parser(HTMLParser):
    def error(self, message: str) -> None:
        raise ValueError(message)


def files():
    for p in ROOT.rglob("*"):
        if not p.is_file() or any(part in IGNORE_DIRS for part in p.relative_to(ROOT).parts):
            continue
        yield p


def local_target(page: Path, ref: str) -> Path | None:
    if ref.startswith(("http://", "https://", "mailto:", "tel:", "data:", "blob:", "javascript:", "#")):
        return None
    clean = ref.split("?", 1)[0].split("#", 1)[0]
    if not clean:
        return None
    if clean.startswith("/"):
        return ROOT / clean.lstrip("/")
    return page.parent / clean


def main() -> int:
    all_files = list(files())
    failures: list[str] = []
    stats = {"files": len(all_files), "html": 0, "js": 0, "json": 0, "python": 0, "shell": 0, "refs": 0}

    for p in all_files:
        rel = p.relative_to(ROOT).as_posix()
        try:
            if p.stat().st_size == 0:
                failures.append(f"empty_file={rel}")
                continue
            data = p.read_bytes()
            if b"\x00" in data:
                failures.append(f"nul_byte={rel}")
            if b"<<<<<<<" in data or b"=======\n" in data or b">>>>>>>" in data:
                failures.append(f"merge_conflict_marker={rel}")
        except OSError as exc:
            failures.append(f"unreadable={rel}:{exc}")
            continue

        suffix = p.suffix.lower()
        if suffix not in TEXT_EXTS:
            continue
        try:
            text = p.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            failures.append(f"non_utf8_text={rel}")
            continue

        if suffix in {".html", ".htm"}:
            stats["html"] += 1
            try:
                Parser().feed(text)
            except ValueError as exc:
                failures.append(f"html_parse={rel}:{exc}")
            for match in LOCAL_RE.finditer(text):
                target = local_target(p, match.group(1))
                if target is None:
                    continue
                stats["refs"] += 1
                if ABS_LOCAL.match(match.group(1)) and not target.exists():
                    failures.append(f"missing_local_ref={rel}->{match.group(1)}")
        elif suffix in {".js", ".mjs", ".cjs"}:
            stats["js"] += 1
            result = subprocess.run(["node", "--check", str(p)], cwd=ROOT, capture_output=True, text=True)
            if result.returncode:
                failures.append(f"js_syntax={rel}:{result.stderr.strip()[:240]}")
        elif suffix == ".json":
            stats["json"] += 1
            try:
                json.loads(text)
            except json.JSONDecodeError as exc:
                failures.append(f"json_syntax={rel}:{exc}")
        elif suffix == ".py":
            stats["python"] += 1
            try:
                compile(text, rel, "exec")
            except SyntaxError as exc:
                failures.append(f"python_syntax={rel}:{exc}")
        elif suffix == ".sh":
            stats["shell"] += 1
            result = subprocess.run(["bash", "-n", str(p)], cwd=ROOT, capture_output=True, text=True)
            if result.returncode:
                failures.append(f"shell_syntax={rel}:{result.stderr.strip()[:240]}")

    print(f"REPOSITORY_FILES={stats['files']}")
    print(f"HTML_FILES={stats['html']}")
    print(f"JAVASCRIPT_FILES={stats['js']}")
    print(f"JSON_FILES={stats['json']}")
    print(f"PYTHON_FILES={stats['python']}")
    print(f"SHELL_FILES={stats['shell']}")
    print(f"LOCAL_REFERENCES_CHECKED={stats['refs']}")
    if failures:
        for item in failures[:100]:
            print(f"FAIL {item}")
        print(f"REPOSITORY_INTEGRITY=FAIL failures={len(failures)}")
        return 1
    print("REPOSITORY_INTEGRITY=PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
