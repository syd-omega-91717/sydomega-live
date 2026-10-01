#!/usr/bin/env python3
"""Platform-wide visual/readability/flexibility/scalability survey.

Diagnostic only. It scans every root HTML page and reports:
- readability: small text, dense letter spacing, long unbroken labels
- flexibility: fixed-width geometry, viewport-sized geometry, nowrap pressure
- scalability: card/section/tab/control density and repeated chrome
- information focus: whether the page has a clear title and whether the
  visible structure is becoming a dashboard of unrelated surfaces

This deliberately does NOT decide that a high-density page is wrong. Data
grids, admin consoles and media libraries can legitimately be dense. The
report separates "review" from "contract failure" so legitimate specialist
pages are not destroyed by a generic visual rule.

Usage:
  python3 scripts/visual-page-survey.py
  python3 scripts/visual-page-survey.py --json /tmp/omega-visual-survey.json
"""
from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {"node_modules", ".git", ".next", "dist", "build", "public"}
HTML_FILES = sorted(
    p for p in ROOT.rglob("*.html")
    if not any(part in SKIP_DIRS for part in p.relative_to(ROOT).parts)
)

TAG_RE = re.compile(r"<[^>]+>")
TEXT_RE = re.compile(r"[A-Za-z0-9Ω][A-Za-z0-9Ω'’./:%#&+\-]{1,}")
FONT_RE = re.compile(r"font-size\s*:\s*(\d+(?:\.\d+)?)px", re.I)
LETTER_RE = re.compile(r"letter-spacing\s*:\s*(-?\d+(?:\.\d+)?)px", re.I)
FIXED_WIDTH_RE = re.compile(r"(?:width|min-width|max-width)\s*:\s*(\d+(?:\.\d+)?)px", re.I)
VW_RE = re.compile(r"(?:width|min-width|max-width)\s*:\s*(?:calc\([^)]*100vw|100vw)", re.I)
NOWRAP_RE = re.compile(r"white-space\s*:\s*nowrap", re.I)
FIXED_RE = re.compile(r"position\s*:\s*fixed", re.I)
STYLE_RE = re.compile(r"<style\b[^>]*>(.*?)</style>", re.I | re.S)
TOPBAR_TITLE_RE = re.compile(r'<(?:div|span)\b[^>]*class=["\'][^"\']*\b(?:t|topbar-title)\b[^"\']*["\'][^>]*>(.*?)</(?:div|span)>', re.I | re.S)
H1_RE = re.compile(r"<h1\b[^>]*>(.*?)</h1>", re.I | re.S)
DESC_RE = re.compile(r'<meta\b[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', re.I)
TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.I | re.S)


class _VisibleParser(HTMLParser):
    """Collect text that is plausibly visible in the initial page surface.

    Script/style/template content is never text. Elements explicitly hidden,
    aria-hidden, display:none, and inactive .tab-panel containers are omitted.
    The parser uses a stack, so nested divs inside a tab panel are handled
    correctly; regex-only removal cannot do that safely.
    """
    SKIP_TAGS = {"script", "style", "noscript", "template"}
    CONTAINER_TAGS = {"div", "section", "article", "aside", "nav", "main", "header", "footer"}

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.hidden_depth = 0
        self._hidden_stack: list[bool] = []
        self.parts: list[str] = []

    @staticmethod
    def _hidden(attrs: list[tuple[str, str | None]], parent_hidden: bool) -> bool:
        if parent_hidden:
            return True
        a = {str(k).lower(): (v or "") for k, v in attrs}
        if "hidden" in a or a.get("aria-hidden", "").lower() == "true":
            return True
        if re.search(r"display\\s*:\\s*none", a.get("style", ""), re.I):
            return True
        classes = a.get("class", "")
        if re.search(r"\\btab-panel\\b", classes, re.I) and not re.search(r"\\b(?:active|on)\\b", classes, re.I):
            return True
        return False

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        is_hidden = tag in self.SKIP_TAGS or self._hidden(attrs, self.hidden_depth > 0)
        self._hidden_stack.append(is_hidden)
        if is_hidden:
            self.hidden_depth += 1

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        if self.hidden_depth == 0 and tag not in self.SKIP_TAGS and not self._hidden(attrs, False):
            self.handle_data(" ")

    def handle_endtag(self, tag: str) -> None:
        if not self._hidden_stack:
            return
        is_hidden = self._hidden_stack.pop()
        if is_hidden:
            self.hidden_depth = max(0, self.hidden_depth - 1)

    def handle_data(self, data: str) -> None:
        if self.hidden_depth == 0:
            self.parts.append(data)

    def text(self) -> str:
        return " ".join(self.parts)


def visible_fragment(s: str) -> str:
    parser = _VisibleParser()
    parser.feed(s)
    parser.close()
    return parser.text()


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", TAG_RE.sub(" ", visible_fragment(s))).strip()


def count_words(s: str) -> int:
    return len(TEXT_RE.findall(clean(s)))


def scan(path: Path) -> dict:
    text = path.read_text(encoding="utf-8", errors="replace")
    body_m = re.search(r"<body\b[^>]*>(.*?)</body>", text, re.I | re.S)
    body = body_m.group(1) if body_m else text
    styles = "\n".join(STYLE_RE.findall(text))

    fonts = [float(x) for x in FONT_RE.findall(text)]
    letters = [float(x) for x in LETTER_RE.findall(text)]
    fixed_widths = [float(x) for x in FIXED_WIDTH_RE.findall(text) if float(x) >= 320]
    viewport_geometry = len(VW_RE.findall(text))
    nowrap = len(NOWRAP_RE.findall(text))
    fixed = len(FIXED_RE.findall(text))

    cards = len(re.findall(r'class=["\'][^"\']*\b(?:card|kpi|tile|panel|module|widget|tier-card|pred-card|lab-card)\b', text, re.I))
    sections = len(re.findall(r'class=["\'][^"\']*\b(?:sechead|section-head|section-title|section-hd|sect-hd)\b', text, re.I))
    tabs = len(re.findall(r'class=["\'][^"\']*\b(?:tab-btn|tab-link)\b', text, re.I))
    buttons = len(re.findall(r'<button\\b', text, re.I)) + len(re.findall(r'class=[\"\'][^\"\']*\\bbtn(?:-|\\b)[^\"\']*[\"\']', text, re.I))
    links = len(re.findall(r"<a\b", body, re.I))
    forms = len(re.findall(r"<(?:input|select|textarea)\b", body, re.I))
    images = len(re.findall(r"<img\b", body, re.I))

    title = clean(TITLE_RE.search(text).group(1)) if TITLE_RE.search(text) else ""
    h1m = H1_RE.search(text)
    h1 = clean(h1m.group(1)) if h1m else ""
    topm = TOPBAR_TITLE_RE.search(text)
    topbar = clean(topm.group(1)) if topm else ""
    duplicate_title = bool(h1 and topbar and h1.lower() == topbar.lower())

    body_words = count_words(body)
    small = sum(1 for x in fonts if x < 12)
    borderline = sum(1 for x in fonts if 12 <= x < 13)
    dense_tracking = sum(1 for x in letters if x >= 3)
    long_nowrap = len(re.findall(r"[A-Za-z]{24,}", clean(body)))

    issues = []
    if not re.search(r'<meta[^>]+name=["\']viewport["\']', text, re.I):
        issues.append("CONTRACT: missing viewport")
    if not title:
        issues.append("CONTRACT: missing title")
    if not h1 and not re.search(r'role=["\']heading["\'][^>]*aria-level=["\']1["\']', text, re.I):
        issues.append("CONTRACT: no visible/semantic level-1 heading")
    if small:
        issues.append(f"READABILITY: {small} declarations below 12px")
    if dense_tracking:
        issues.append(f"READABILITY: {dense_tracking} declarations at >=3px letter spacing")
    if fixed_widths:
        issues.append(f"FLEXIBILITY: {len(fixed_widths)} fixed widths >=320px")
    if viewport_geometry:
        issues.append(f"FLEXIBILITY: {viewport_geometry} viewport-width geometry declarations")
    if nowrap >= 8:
        issues.append(f"FLEXIBILITY: {nowrap} nowrap declarations")
    if cards > 50:
        issues.append(f"DENSITY: {cards} card-like surfaces")
    if sections > 12:
        issues.append(f"DENSITY: {sections} section headings")
    if tabs > 12:
        issues.append(f"DENSITY: {tabs} tabs")
    if duplicate_title:
        issues.append("FOCUS: topbar title duplicates h1")
    # Catalog pages with explicit tab segmentation intentionally keep their
    # complete catalog in the DOM so tab switches are instant. Do not classify
    # that conditional content as an unfocused first-view surface. Density is
    # still reported separately, so the page remains reviewable without a false
    # "too much visible text" alarm.
    tab_segmented_catalog = tabs >= 4 and cards >= 50
    if body_words > 2200 and not tab_segmented_catalog:
        issues.append(f"FOCUS: {body_words} visible-word tokens before dynamic rendering")

    penalty = 0
    penalty += min(small * 2, 12)
    penalty += min(dense_tracking, 6)
    penalty += min(max(0, fixed_widths.__len__() - 3), 6)
    penalty += min(max(0, nowrap - 6), 6)
    penalty += 8 if cards > 80 else (4 if cards > 50 else 0)
    penalty += 6 if sections > 18 else (3 if sections > 12 else 0)
    penalty += 5 if tabs > 18 else (2 if tabs > 12 else 0)
    penalty += 3 if duplicate_title else 0
    penalty += 5 if body_words > 3000 else (2 if body_words > 2200 else 0)

    return {
        "page": path.name,
        "title": title,
        "h1": h1,
        "body_words": body_words,
        "cards": cards,
        "sections": sections,
        "tabs": tabs,
        "buttons": buttons,
        "links": links,
        "forms": forms,
        "images": images,
        "small_font_declarations": small,
        "borderline_font_declarations": borderline,
        "dense_tracking_declarations": dense_tracking,
        "fixed_width_declarations": len(fixed_widths),
        "viewport_geometry_declarations": viewport_geometry,
        "nowrap_declarations": nowrap,
        "fixed_position_declarations": fixed,
        "long_unbroken_labels": long_nowrap,
        "duplicate_title": duplicate_title,
        "focus_score": max(0, 100 - penalty),
        "findings": issues,
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", dest="json_path")
    args = ap.parse_args()

    rows = [scan(p) for p in HTML_FILES]
    review = [r for r in rows if r["findings"]]
    severe = [r for r in rows if any(x.startswith("CONTRACT:") for x in r["findings"])]

    print(f"VISUAL PAGE SURVEY: {len(rows)} HTML pages scanned (root + nested application surfaces)")
    print(f"Pages requiring visual review: {len(review)}")
    print(f"Pages with structural contract findings: {len(severe)}")
    if rows:
        avg = sum(r["focus_score"] for r in rows) / len(rows)
        print(f"Mean information-focus score: {avg:.1f}/100")

    buckets = Counter()
    for r in rows:
        for f in r["findings"]:
            buckets[f.split(":", 1)[0]] += 1
    for key, value in buckets.most_common():
        print(f"  {key}: {value} page findings")

    print("\nHighest-density pages:")
    for r in sorted(rows, key=lambda x: (x["cards"], x["sections"], x["body_words"]), reverse=True)[:20]:
        print(f"  {r['page']}: cards={r['cards']} sections={r['sections']} tabs={r['tabs']} words={r['body_words']} focus={r['focus_score']}")

    if args.json_path:
        Path(args.json_path).write_text(json.dumps(rows, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\nWrote {args.json_path}")

    # Diagnostic survey: do not block the repository on legitimate high-density
    # specialist pages. Structural failures remain visible, but the existing
    # visual-design contract remains the authoritative gate.
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
