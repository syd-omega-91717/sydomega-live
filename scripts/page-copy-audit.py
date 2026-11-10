#!/usr/bin/env python3
"""Audit repeated member-facing copy across the shipped HTML page estate.

This is an evidence report, not an auto-rewriter. It extracts visible content
blocks from each page, excludes shared chrome and executable/style content,
and reports exact repeated prose separately from repeated calls to action.

Usage:
  python3 scripts/page-copy-audit.py
  python3 scripts/page-copy-audit.py --markdown
  python3 scripts/page-copy-audit.py --json /tmp/page-copy-audit.json
  python3 scripts/page-copy-audit.py --root /path/to/repo --min-words 8
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from collections import defaultdict
from html.parser import HTMLParser
from pathlib import Path

SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "public"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "nav", "header", "footer", "aside"}
BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p", "li", "button", "a", "label", "summary", "blockquote", "dt", "dd"}
CTA_TAGS = {"button", "a"}
SKIP_CLASSES = {
    "omega-side", "sidebar", "topbar", "global-nav", "breadcrumbs",
    "cookie-banner", "cookie-consent", "site-header", "site-footer",
}
TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)


def normalise(value: str) -> str:
    value = unicodedata.normalize("NFKC", value).casefold()
    return " ".join(TOKEN_RE.findall(value))


def word_count(value: str) -> int:
    return len(TOKEN_RE.findall(value))


class CopyParser(HTMLParser):
    """Extract meaningful text blocks while excluding shared chrome and code."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool, bool]] = []
        self.skip_depth = 0
        self.main_depth = 0
        self.has_main = False
        self.current_tag: str | None = None
        self.current_parts: list[str] = []
        self.current_main = False
        self.current_exempt = False
        self.blocks: list[dict] = []

    def _flush(self) -> None:
        if self.current_tag:
            text = " ".join(" ".join(self.current_parts).split())
            if text and not self.current_exempt:
                self.blocks.append({"tag": self.current_tag, "text": text, "main": self.current_main})
        self.current_tag = None
        self.current_parts = []
        self.current_main = False
        self.current_exempt = False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        a = {str(k).lower(): (v or "") for k, v in attrs}
        classes = set(a.get("class", "").lower().split())
        parent_skip = self.skip_depth > 0
        own_skip = (
            tag in SKIP_TAGS
            or "hidden" in a
            or a.get("aria-hidden", "").lower() == "true"
            or "data-copy-ignore" in a
            or bool(classes & SKIP_CLASSES)
        )
        if tag == "main":
            self.has_main = True
            self.main_depth += 1
        self.stack.append((tag, own_skip, tag == "main"))
        if own_skip:
            self.skip_depth += 1
        if parent_skip or own_skip:
            return
        if tag in BLOCK_TAGS:
            self._flush()
            self.current_tag = tag
            self.current_main = self.main_depth > 0

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data: str) -> None:
        if self.skip_depth == 0 and self.current_tag:
            self.current_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if self.current_tag == tag:
            self._flush()
        for index in range(len(self.stack) - 1, -1, -1):
            frame_tag, was_skip, was_main = self.stack[index]
            if was_skip:
                self.skip_depth = max(0, self.skip_depth - 1)
            if was_main:
                self.main_depth = max(0, self.main_depth - 1)
            del self.stack[index:]
            if frame_tag == tag:
                break

    def result(self) -> list[dict]:
        self._flush()
        if self.has_main:
            return [block for block in self.blocks if block["main"]]
        return self.blocks


def scan_page(path: Path, root: Path, min_words: int) -> list[dict]:
    parser = CopyParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    parser.close()
    rel = path.relative_to(root).as_posix()
    result = []
    for block in parser.result():
        clean = normalise(block["text"])
        count = word_count(clean)
        if count < min_words:
            continue
        result.append({
            "page": rel,
            "tag": block["tag"],
            "text": block["text"],
            "normalised": clean,
            "words": count,
            "kind": "cta" if block["tag"] in CTA_TAGS else "copy",
        })
    return result


def build_report(root: Path, min_words: int = 8) -> dict:
    pages = sorted(
        p for p in root.rglob("*.html")
        if p.is_file() and not any(part in SKIP_DIRS for part in p.relative_to(root).parts)
    )
    all_blocks = []
    for page in pages:
        try:
            all_blocks.extend(scan_page(page, root, min_words))
        except (OSError, ValueError) as exc:
            all_blocks.append({
                "page": page.relative_to(root).as_posix(),
                "tag": "error", "text": str(exc), "normalised": "",
                "words": 0, "kind": "error",
            })

    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for block in all_blocks:
        if block["normalised"]:
            groups[(block["kind"], block["normalised"])].append(block)

    cross_page, within_page, cta_reuse = [], [], []
    for (kind, normal), items in groups.items():
        if len(items) < 2:
            continue
        paths = sorted({item["page"] for item in items})
        group = {
            "kind": kind, "text": items[0]["text"], "normalised": normal,
            "words": items[0]["words"], "occurrences": len(items), "pages": paths,
            "locations": [{"page": item["page"], "tag": item["tag"]} for item in items],
        }
        if kind == "cta":
            cta_reuse.append(group)
        elif len(paths) > 1:
            cross_page.append(group)
        else:
            within_page.append(group)

    sort_key = lambda item: (-item["occurrences"], -item["words"], item["text"].casefold())
    for collection in (cross_page, within_page, cta_reuse):
        collection.sort(key=sort_key)
    errors = [b for b in all_blocks if b["kind"] == "error"]
    return {
        "schema_version": 1,
        "generated_by": "scripts/page-copy-audit.py",
        "page_count": len(pages),
        "block_count": sum(1 for b in all_blocks if b["kind"] != "error"),
        "min_words": min_words,
        "cross_page_duplicate_groups": cross_page,
        "within_page_duplicate_groups": within_page,
        "reused_cta_groups": cta_reuse,
        "scan_errors": errors,
        "truth_note": "Exact text repetition is a review signal, not proof of an error. Shared legal copy, standard controls, and intentionally repeated instructions may be justified.",
    }


def markdown(report: dict, limit: int = 30) -> str:
    lines = [
        "# Ω Page Copy Uniqueness Audit", "",
        f"- Pages scanned: **{report['page_count']}**",
        f"- Visible content blocks: **{report['block_count']}**",
        f"- Cross-page repeated prose groups: **{len(report['cross_page_duplicate_groups'])}**",
        f"- Within-page repeated prose groups: **{len(report['within_page_duplicate_groups'])}**",
        f"- Reused CTA groups (reported separately): **{len(report['reused_cta_groups'])}**",
        f"- Scan errors: **{len(report['scan_errors'])}**", "",
        "> Repetition is a review signal, not an automatic defect. Legal, safety, privacy, and standard control copy may intentionally repeat. No page is changed or deleted by this audit.",
        "", "## Repeated prose across pages", "",
    ]
    if not report["cross_page_duplicate_groups"]:
        lines.append("No exact repeated prose blocks met the configured word threshold.")
    for item in report["cross_page_duplicate_groups"][:limit]:
        lines.extend([
            f"### {item['occurrences']} occurrences · {item['words']} words", "",
            f"> {item['text']}", "",
            ", ".join(item["pages"]), "",
        ])
    lines.extend(["## Repeated prose within a page", ""])
    if not report["within_page_duplicate_groups"]:
        lines.append("No within-page repeated prose blocks met the configured word threshold.")
    for item in report["within_page_duplicate_groups"][:limit]:
        lines.append(f"- **{item['occurrences']}×** in {item['pages'][0]} — {item['text']}")
    lines.extend(["", "## Reused calls to action", ""])
    if not report["reused_cta_groups"]:
        lines.append("No repeated CTA labels met the configured word threshold.")
    for item in report["reused_cta_groups"][:limit]:
        lines.append(f"- **{item['occurrences']}×** — “{item['text']}” ({', '.join(item['pages'])})")
    if report["scan_errors"]:
        lines.extend(["", "## Scan errors", ""])
        for item in report["scan_errors"]:
            lines.append(f"- {item['page']} — {item['text']}")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    ap.add_argument("--min-words", type=int, default=8)
    ap.add_argument("--json", dest="json_path", type=Path)
    ap.add_argument("--markdown", action="store_true")
    args = ap.parse_args()
    if args.min_words < 1:
        ap.error("--min-words must be positive")
    report = build_report(args.root.resolve(), args.min_words)
    if args.json_path:
        args.json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.markdown:
        sys.stdout.write(markdown(report))
    else:
        print(f"PAGE_COPY_AUDIT_PAGES={report['page_count']}")
        print(f"PAGE_COPY_AUDIT_BLOCKS={report['block_count']}")
        print(f"CROSS_PAGE_REPEAT_GROUPS={len(report['cross_page_duplicate_groups'])}")
        print(f"WITHIN_PAGE_REPEAT_GROUPS={len(report['within_page_duplicate_groups'])}")
        print(f"REUSED_CTA_GROUPS={len(report['reused_cta_groups'])}")
        print(f"SCAN_ERRORS={len(report['scan_errors'])}")
    return 1 if report["scan_errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
