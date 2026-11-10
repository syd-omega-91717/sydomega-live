#!/usr/bin/env python3
"""Audit repeated member-facing copy across the shipped HTML page estate.

This is an evidence report, not an auto-rewriter. It extracts visible content
blocks from each page, excludes shared chrome and executable/style content,
and reports exact/near-duplicate prose separately from repeated calls to action.

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
SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "nav", "footer", "aside"}
BLOCK_TAGS = {"h1", "h2", "h3", "h4", "p", "li", "div", "section", "article", "button", "a", "label", "summary", "blockquote", "dt", "dd"}
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


def word_shingles(value: str, size: int = 3) -> set[tuple[str, ...]]:
    tokens = TOKEN_RE.findall(normalise(value))
    if len(tokens) < size:
        return set()
    return {tuple(tokens[index:index + size]) for index in range(len(tokens) - size + 1)}


def jaccard_similarity(left: set[tuple[str, ...]], right: set[tuple[str, ...]]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)


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
            or a.get("role", "").lower() in {"banner", "contentinfo"}
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


def build_report(root: Path, min_words: int = 8, near_min_words: int = 20, near_threshold: float = 0.78) -> dict:
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

    errors = []
    allowlist_path = root / "config" / "page-copy-allowlist.json"
    approved_text: dict[str, dict] = {}
    if allowlist_path.is_file():
        try:
            allowlist = json.loads(allowlist_path.read_text(encoding="utf-8"))
            for item in allowlist.get("approved", []):
                normal = str(item.get("normalised_text", "")).strip()
                reason = str(item.get("reason", "")).strip()
                scope = item.get("scope", [])
                if normal and reason and isinstance(scope, list) and scope and all(isinstance(page, str) and page.strip() for page in scope):
                    approved_text[normal] = {"reason": reason, "scope": set(scope)}
                else:
                    errors.append({"page": "config/page-copy-allowlist.json", "tag": "error", "text": "allowlist entries require normalised_text, reason, and a non-empty scope list", "normalised": "", "words": 0, "kind": "error"})
        except (OSError, ValueError) as exc:
            errors.append({"page": "config/page-copy-allowlist.json", "tag": "error", "text": str(exc), "normalised": "", "words": 0, "kind": "error"})

    groups: dict[tuple[str, str], list[dict]] = defaultdict(list)
    for block in all_blocks:
        if block["normalised"]:
            groups[(block["kind"], block["normalised"])].append(block)

    cross_page, approved_cross_page, within_page, cta_reuse = [], [], [], []
    allowlist_scope_mismatches = []
    seen_allowlist: set[str] = set()
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
            approval = approved_text.get(normal)
            if approval:
                seen_allowlist.add(normal)
                if set(paths) == approval["scope"]:
                    group["approved_reason"] = approval["reason"]
                    group["approved_scope"] = sorted(approval["scope"])
                    approved_cross_page.append(group)
                else:
                    group["allowlist_scope_expected"] = sorted(approval["scope"])
                    allowlist_scope_mismatches.append({
                        "text": items[0]["text"],
                        "expected_pages": sorted(approval["scope"]),
                        "actual_pages": paths,
                    })
                    cross_page.append(group)
            else:
                cross_page.append(group)
        else:
            within_page.append(group)

    # Fuzzy copy review catches lightly rewritten paragraphs that exact matching misses.
    # It is advisory: similarity is a review signal, never an automatic deletion decision.
    near_duplicate_pairs = []
    eligible = [
        block for block in all_blocks
        if block["kind"] == "copy" and block["words"] >= near_min_words
    ]
    shingle_cache = [word_shingles(block["normalised"]) for block in eligible]
    for left_index, left in enumerate(eligible):
        left_words = left["words"]
        left_shingles = shingle_cache[left_index]
        for right_index in range(left_index + 1, len(eligible)):
            right = eligible[right_index]
            if left["normalised"] == right["normalised"]:
                continue
            if min(left_words, right["words"]) / max(left_words, right["words"]) < 0.72:
                continue
            similarity = jaccard_similarity(left_shingles, shingle_cache[right_index])
            if similarity >= near_threshold:
                near_duplicate_pairs.append({
                    "similarity": round(similarity, 3),
                    "left": {"page": left["page"], "tag": left["tag"], "text": left["text"]},
                    "right": {"page": right["page"], "tag": right["tag"], "text": right["text"]},
                    "same_page": left["page"] == right["page"],
                })
    near_duplicate_pairs.sort(key=lambda item: (-item["similarity"], item["left"]["page"], item["right"]["page"]))

    sort_key = lambda item: (-item["occurrences"], -item["words"], item["text"].casefold())
    for collection in (cross_page, approved_cross_page, within_page, cta_reuse):
        collection.sort(key=sort_key)
    errors.extend(b for b in all_blocks if b["kind"] == "error")
    unused_allowlist = sorted(set(approved_text) - seen_allowlist)
    return {
        "schema_version": 1,
        "generated_by": "scripts/page-copy-audit.py",
        "page_count": len(pages),
        "block_count": sum(1 for b in all_blocks if b["kind"] != "error"),
        "min_words": min_words,
        "near_min_words": near_min_words,
        "near_threshold": near_threshold,
        "near_duplicate_pairs": near_duplicate_pairs,
        "cross_page_duplicate_groups": cross_page,
        "approved_cross_page_duplicate_groups": approved_cross_page,
        "within_page_duplicate_groups": within_page,
        "reused_cta_groups": cta_reuse,
        "unused_allowlist_entries": unused_allowlist,
        "allowlist_scope_mismatches": allowlist_scope_mismatches,
        "scan_errors": errors,
        "truth_note": "Exact and lexical near-duplicate text are review signals, not proof of an error. Shared legal copy, standard controls, and intentionally repeated instructions may be justified.",
    }


def markdown(report: dict, limit: int = 30) -> str:
    lines = [
        "# Ω Page Copy Uniqueness Audit", "",
        f"- Pages scanned: **{report['page_count']}**",
        f"- Visible content blocks: **{report['block_count']}**",
        f"- Unapproved cross-page repeated prose groups: **{len(report['cross_page_duplicate_groups'])}**",
        f"- Approved cross-page repeated prose groups: **{len(report['approved_cross_page_duplicate_groups'])}**",
        f"- Within-page repeated prose groups: **{len(report['within_page_duplicate_groups'])}**",
        f"- Reused CTA groups (reported separately): **{len(report['reused_cta_groups'])}**",
        f"- Near-duplicate prose candidates (word-trigram Jaccard ≥ {report['near_threshold']:.2f}): **{len(report['near_duplicate_pairs'])}**",
        f"- Scan errors: **{len(report['scan_errors'])}**", "",
        "> Exact and near repetition are review signals, not automatic defects. Legal, safety, privacy, and standard control copy may intentionally repeat. No page is changed or deleted by this audit.",
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
    lines.extend(["## Near-duplicate prose candidates", ""])
    if not report["near_duplicate_pairs"]:
        lines.append("No near-duplicate prose candidates met the configured similarity threshold.")
    for item in report["near_duplicate_pairs"][:limit]:
        scope = "within " + item["left"]["page"] if item["same_page"] else item["left"]["page"] + " ↔ " + item["right"]["page"]
        lines.extend([
            f"- **{item['similarity']:.0%} similarity** · {scope}",
            f"  - Left: {item['left']['text']}",
            f"  - Right: {item['right']['text']}",
        ])
    lines.append("")
    lines.extend(["## Approved repeated prose", ""])
    if not report["approved_cross_page_duplicate_groups"]:
        lines.append("No repeated prose has an explicit allowlist justification.")
    for item in report["approved_cross_page_duplicate_groups"][:limit]:
        lines.extend([
            f"- **{item['occurrences']}×** — {item['text']}",
            f"  Reason: {item['approved_reason']}",
            f"  Pages: {', '.join(item['pages'])}",
        ])
    if report["unused_allowlist_entries"]:
        lines.extend(["", "## Stale allowlist entries", ""])
        for item in report["unused_allowlist_entries"]:
            lines.append(f"- {item}")
    if report["allowlist_scope_mismatches"]:
        lines.extend(["", "## Allowlist scope mismatches", ""])
        for item in report["allowlist_scope_mismatches"]:
            lines.append(f"- {item['text']} — expected {item['expected_pages']}; found {item['actual_pages']}")
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
    ap.add_argument("--near-min-words", type=int, default=20, help="minimum words for fuzzy-copy candidates")
    ap.add_argument("--near-threshold", type=float, default=0.78, help="word-trigram Jaccard threshold from 0 to 1")
    ap.add_argument("--json", dest="json_path", type=Path)
    ap.add_argument("--markdown", action="store_true")
    args = ap.parse_args()
    if args.min_words < 1 or args.near_min_words < 1:
        ap.error("--min-words and --near-min-words must be positive")
    if not 0.0 <= args.near_threshold <= 1.0:
        ap.error("--near-threshold must be between 0 and 1")
    report = build_report(args.root.resolve(), args.min_words, args.near_min_words, args.near_threshold)
    if args.json_path:
        args.json_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.markdown:
        sys.stdout.write(markdown(report))
    else:
        print(f"PAGE_COPY_AUDIT_PAGES={report['page_count']}")
        print(f"PAGE_COPY_AUDIT_BLOCKS={report['block_count']}")
        print(f"CROSS_PAGE_REPEAT_GROUPS={len(report['cross_page_duplicate_groups'])}")
        print(f"APPROVED_REPEAT_GROUPS={len(report['approved_cross_page_duplicate_groups'])}")
        print(f"WITHIN_PAGE_REPEAT_GROUPS={len(report['within_page_duplicate_groups'])}")
        print(f"REUSED_CTA_GROUPS={len(report['reused_cta_groups'])}")
        print(f"UNUSED_ALLOWLIST_ENTRIES={len(report['unused_allowlist_entries'])}")
        print(f"ALLOWLIST_SCOPE_MISMATCHES={len(report['allowlist_scope_mismatches'])}")
        print(f"SCAN_ERRORS={len(report['scan_errors'])}")
    return 1 if report["scan_errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
