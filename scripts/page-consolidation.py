#!/usr/bin/env python3
"""Rank likely page-purpose overlap using visible content and interaction evidence.

Advisory only: this tool never deletes, redirects, hides, or edits a page.
It compares visible copy, headings, rare data sources, explicit task/capability
markers, and internal destinations. Shared chrome, scripts, hidden content,
ubiquitous tables, and ubiquitous links are excluded.

Usage:
  python3 scripts/page-consolidation.py
  python3 scripts/page-consolidation.py --markdown
  python3 scripts/page-consolidation.py --json /tmp/page-purpose.json
  python3 scripts/page-consolidation.py --min 0.32 --top 100
"""
from __future__ import annotations

import argparse
import json
import math
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

SKIP_DIRS = {".git", "node_modules", ".next", "dist", "build", "public"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "template", "nav", "footer", "aside"}
SKIP_CLASSES = {"omega-side", "sidebar", "topbar", "global-nav", "breadcrumbs",
                "cookie-banner", "cookie-consent", "site-header", "site-footer"}
VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
             "meta", "param", "source", "track", "wbr"}
STOP = set("the and for with your you are this that from have has not can all any its into onto per via our their was were will they them then than more most only also but out use used using page pages open close back home help sign log new one two see view set get platform omega member members workspace system current latest data record records status state access account user users".split())
TOKEN_RE = re.compile(r"[^\W_]+", re.UNICODE)
TABLE_RE = re.compile(r"\.from\s*\(\s*['\"]([a-z_][a-z_0-9]*)['\"]", re.I)
RPC_RE = re.compile(r"\.rpc\s*\(\s*['\"]([a-z_][a-z_0-9]*)['\"]", re.I)


def tokens(value: str) -> list[str]:
    return [word for word in TOKEN_RE.findall(value.casefold())
            if len(word) > 2 and word not in STOP]


def cosine(left: dict[str, float], right: dict[str, float]) -> float:
    if not left or not right:
        return 0.0
    dot = sum(value * right.get(key, 0.0) for key, value in left.items())
    a = math.sqrt(sum(value * value for value in left.values()))
    b = math.sqrt(sum(value * value for value in right.values()))
    return dot / (a * b) if a and b else 0.0


def jaccard(left: set[str], right: set[str]) -> float:
    return len(left & right) / len(left | right) if left and right else 0.0


class PurposeParser(HTMLParser):
    """Extract page-visible purpose and explicit interaction markers."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.stack: list[tuple[str, bool]] = []
        self.skip_depth = 0
        self.script_depth = 0
        self.script_parts: list[str] = []
        self.inline_scripts: list[str] = []
        self.visible: list[str] = []
        self.main_visible: list[str] = []
        self.title: list[str] = []
        self.headings: list[str] = []
        self.main_headings: list[str] = []
        self.in_title = False
        self.heading_depth = 0
        self.has_main = False
        self.main_depth = 0
        self.links: set[str] = set()
        self.scripts: list[str] = []
        self.capabilities: set[str] = set()
        self.tasks: set[str] = set()
        self.controls: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        attrs_map = {str(key).lower(): (value or "") for key, value in attrs}
        classes = set(attrs_map.get("class", "").lower().split())
        skip = (tag in SKIP_TAGS or "hidden" in attrs_map
                or attrs_map.get("aria-hidden", "").lower() == "true"
                or attrs_map.get("role", "").lower() in {"banner", "contentinfo"}
                or "data-copy-ignore" in attrs_map
                or bool(classes & SKIP_CLASSES))
        if tag not in VOID_TAGS:
            self.stack.append((tag, skip))
            if skip:
                self.skip_depth += 1
        if tag == "main":
            self.has_main = True
            self.main_depth += 1
        if tag == "script":
            self.script_depth += 1
            if attrs_map.get("src"):
                self.scripts.append(attrs_map["src"])
        if self.skip_depth:
            return
        if tag == "title":
            self.in_title = True
        if tag in {"h1", "h2", "h3", "h4"}:
            self.heading_depth += 1
        if tag == "a":
            href = attrs_map.get("href", "").strip()
            if href and not href.startswith(("#", "mailto:", "tel:", "javascript:", "data:", "http://", "https://")):
                target = urlsplit(href).path.lstrip("/")
                if target.endswith(".html"):
                    self.links.add(target)
        if tag in {"button", "form", "input", "select", "textarea"}:
            kind = attrs_map.get("type", "") if tag == "input" else ""
            self.controls.add(tag + (":" + kind if kind else ""))
        if attrs_map.get("data-omega-capability-id"):
            self.capabilities.add(attrs_map["data-omega-capability-id"].strip())
        if attrs_map.get("data-omega-task-id"):
            self.tasks.add(attrs_map["data-omega-task-id"].strip())

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self.handle_starttag(tag, attrs)
        self.handle_endtag(tag)

    def handle_data(self, data: str) -> None:
        if self.script_depth:
            self.script_parts.append(data)
            return
        if self.skip_depth:
            return
        self.visible.append(data)
        if self.in_title:
            self.title.append(data)
        if self.main_depth:
            self.main_visible.append(data)
        if self.heading_depth:
            self.headings.append(data)
            if self.main_depth:
                self.main_headings.append(data)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in VOID_TAGS:
            return
        if tag == "script" and self.script_depth:
            self.script_depth -= 1
            if not self.script_depth:
                self.inline_scripts.append(" ".join(self.script_parts))
                self.script_parts = []
        if tag == "title":
            self.in_title = False
        if tag in {"h1", "h2", "h3", "h4"} and self.heading_depth:
            self.heading_depth -= 1
        for index in range(len(self.stack) - 1, -1, -1):
            frame_tag, was_skip = self.stack[index]
            del self.stack[index:]
            if was_skip:
                self.skip_depth = max(0, self.skip_depth - 1)
            if frame_tag == "main":
                self.main_depth = max(0, self.main_depth - 1)
            if frame_tag == tag:
                break


def source_data(parser: PurposeParser, root: Path, slug: str) -> tuple[set[str], set[str]]:
    code = " ".join(parser.inline_scripts)
    for source in parser.scripts:
        if source.startswith(("//", "http://", "https://")):
            continue
        path = (root / source.split("?", 1)[0].lstrip("/")).resolve()
        if not path.is_file():
            continue
        stem = path.stem.casefold()
        if not stem.startswith("omega-") or slug.casefold() not in stem:
            continue
        try:
            code += " " + path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
    return set(TABLE_RE.findall(code)), set(RPC_RE.findall(code))


def scan_page(path: Path, root: Path) -> dict:
    parser = PurposeParser()
    parser.feed(path.read_text(encoding="utf-8", errors="replace"))
    parser.close()
    tables, rpcs = source_data(parser, root, path.stem)
    visible_source = parser.main_visible if parser.has_main else parser.visible
    heading_source = parser.main_headings if parser.has_main else parser.headings
    visible = " ".join(" ".join(visible_source).split())
    title = " ".join(" ".join(parser.title).split())
    headings = " ".join(" ".join(heading_source).split())
    return {
        "page": path.relative_to(root).as_posix(),
        "title": title,
        "visible_words": len(tokens(visible)),
        "text_tokens": Counter(tokens(visible)),
        "heading_tokens": Counter(tokens(title + " " + headings)),
        "links": parser.links,
        "tables": tables,
        "rpcs": rpcs,
        "capabilities": parser.capabilities,
        "tasks": parser.tasks,
        "controls": parser.controls,
    }


def build_report(root: Path, minimum: float = 0.27, min_words: int = 25) -> dict:
    files = sorted(path for path in root.rglob("*.html")
                   if path.is_file() and not any(part in SKIP_DIRS for part in path.relative_to(root).parts))
    rows, errors = [], []
    for path in files:
        try:
            rows.append(scan_page(path, root))
        except (OSError, ValueError) as exc:
            errors.append({"page": path.relative_to(root).as_posix(), "error": str(exc)})

    count = max(1, len(rows))
    document_frequency = Counter()
    for row in rows:
        document_frequency.update(set(row["text_tokens"]))
    idf = {word: math.log((count + 1) / (frequency + 1)) + 1
           for word, frequency in document_frequency.items()}
    for row in rows:
        row["text_vector"] = {
            word: (1 + math.log(freq)) * idf[word]
            for word, freq in row["text_tokens"].items()
        }
        row["heading_vector"] = {
            word: 1 + math.log(freq) for word, freq in row["heading_tokens"].items()
        }

    table_frequency, rpc_frequency, link_frequency = Counter(), Counter(), Counter()
    for row in rows:
        table_frequency.update(row["tables"])
        rpc_frequency.update(row["rpcs"])
        link_frequency.update(row["links"])
    common_tables = {item for item, freq in table_frequency.items() if freq / count > 0.12}
    common_rpcs = {item for item, freq in rpc_frequency.items() if freq / count > 0.12}
    common_links = {item for item, freq in link_frequency.items() if freq / count > 0.20}
    for row in rows:
        row["rare_data"] = (row["tables"] - common_tables) | (row["rpcs"] - common_rpcs)
        row["rare_links"] = row["links"] - common_links

    eligible = [row for row in rows if row["visible_words"] >= min_words]
    weights = {"visible_text": 0.42, "title_headings": 0.20, "rare_data": 0.16,
               "capability_task": 0.14, "internal_destinations": 0.08}
    candidates = []
    for index, left in enumerate(eligible):
        for right in eligible[index + 1:]:
            components = {
                "visible_text": cosine(left["text_vector"], right["text_vector"]),
                "title_headings": cosine(left["heading_vector"], right["heading_vector"]),
                "rare_data": jaccard(left["rare_data"], right["rare_data"]),
                "capability_task": jaccard(left["capabilities"] | left["tasks"],
                                           right["capabilities"] | right["tasks"]),
                "internal_destinations": jaccard(left["rare_links"], right["rare_links"]),
            }
            present = {
                "rare_data": bool(left["rare_data"] and right["rare_data"]),
                "capability_task": bool((left["capabilities"] | left["tasks"])
                                        and (right["capabilities"] | right["tasks"])),
                "internal_destinations": bool(left["rare_links"] and right["rare_links"]),
            }
            active = {key: weight for key, weight in weights.items()
                      if key in {"visible_text", "title_headings"} or present[key]}
            denominator = sum(active.values())
            score = (sum(components[key] * weight for key, weight in active.items()) / denominator
                     if denominator else 0.0)
            if score < minimum:
                continue
            if score >= 0.58 and (components["visible_text"] >= 0.35
                                  or components["title_headings"] >= 0.55):
                classification = "HIGH_PURPOSE_OVERLAP"
            elif score >= 0.40:
                classification = "REVIEW"
            else:
                classification = "WEAK_SIGNAL"
            def evidence(row: dict) -> dict:
                return {"title": row["title"], "words": row["visible_words"],
                        "tables": sorted(row["tables"]), "rpcs": sorted(row["rpcs"]),
                        "capabilities": sorted(row["capabilities"]),
                        "tasks": sorted(row["tasks"]), "controls": sorted(row["controls"])}
            candidates.append({
                "score": round(score, 3),
                "classification": classification,
                "left": left["page"],
                "right": right["page"],
                "components": {key: round(value, 3) for key, value in components.items()},
                "left_evidence": evidence(left),
                "right_evidence": evidence(right),
            })
    candidates.sort(key=lambda item: (-item["score"], item["left"], item["right"]))
    return {
        "version": 2,
        "method": "visible text + headings + rare data + explicit task/capability markers + rare internal destinations",
        "page_count": len(rows),
        "eligible_page_count": len(eligible),
        "candidate_count": len(candidates),
        "minimum_score": minimum,
        "minimum_visible_words": min_words,
        "ignored_common_tables": sorted(common_tables),
        "ignored_common_rpcs": sorted(common_rpcs),
        "ignored_common_internal_destinations": sorted(common_links),
        "errors": errors,
        "candidates": candidates,
    }


def markdown(report: dict, top: int = 100) -> str:
    lines = [
        "# Page-purpose overlap audit",
        "",
        f"- Pages scanned: **{report['page_count']}** (eligible: {report['eligible_page_count']})",
        f"- Candidate pairs: **{report['candidate_count']}** at score ≥ {report['minimum_score']:.2f}",
        f"- Extraction errors: **{len(report['errors'])}**",
        f"- Method: {report['method']}",
        "",
        "Scores are review signals, not merge decisions. Shared tables, templates, and visual patterns do not prove two pages have the same user job. No page is changed, hidden, redirected, or deleted by this audit.",
        "",
    ]
    for item in report["candidates"][:top]:
        component = item["components"]
        lines.extend([
            f"## {item['classification']} · {item['score']:.3f}",
            f"**{item['left']}** ↔ **{item['right']}**",
            "Text {0:.2f} · headings {1:.2f} · rare data {2:.2f} · task/capability {3:.2f} · destinations {4:.2f}".format(
                component["visible_text"], component["title_headings"], component["rare_data"],
                component["capability_task"], component["internal_destinations"]),
            "- Left: {0} ({1} words; tables: {2})".format(
                item["left_evidence"]["title"] or "Untitled", item["left_evidence"]["words"],
                ", ".join(item["left_evidence"]["tables"]) or "none"),
            "- Right: {0} ({1} words; tables: {2})".format(
                item["right_evidence"]["title"] or "Untitled", item["right_evidence"]["words"],
                ", ".join(item["right_evidence"]["tables"]) or "none"),
            "",
        ])
    if not report["candidates"]:
        lines.append("No page-purpose overlap candidates crossed the configured threshold.")
    if report["errors"]:
        lines.extend(["## Extraction errors", ""])
        lines.extend("- {0}: {1}".format(item["page"], item["error"]) for item in report["errors"])
    lines.extend(["", "**Required human review:** compare each page's user job, workflows, authorization, data ownership, and inbound links before consolidation. Preserve routes with redirects and regression coverage."])
    return "\n".join(lines) + "\n"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--min", type=float, default=0.27, dest="minimum")
    parser.add_argument("--min-words", type=int, default=25)
    parser.add_argument("--top", type=int, default=100)
    parser.add_argument("--markdown", action="store_true")
    parser.add_argument("--json", type=Path)
    args = parser.parse_args(argv)
    report = build_report(args.root.resolve(), args.minimum, args.min_words)
    if args.json:
        args.json.parent.mkdir(parents=True, exist_ok=True)
        args.json.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if args.markdown or not args.json:
        print(markdown(report, args.top), end="")
    elif args.json:
        print("PAGE PURPOSE AUDIT: wrote {0}; {1} candidates from {2} pages".format(
            args.json, report["candidate_count"], report["page_count"]))
    return 1 if report["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
