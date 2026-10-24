#!/usr/bin/env python3
"""Read-only static CSP and external-origin inventory for the SYD OMEGA site.

This report supports a staged CSP migration. It does not modify policy or claim
to capture runtime-computed URLs, browser network traffic, or every dependency.
Run: python3 scripts/csp-static-inventory.py [--root PATH] [--format json|markdown]
"""
from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from pathlib import Path
from urllib.parse import urlsplit

URL_RE = re.compile(r"(?<![A-Za-z0-9])(?:https?|wss?)://[^\s\"'<>]+", re.I)
SCRIPT_RE = re.compile(r"<script\b([^>]*)>(.*?)</script\s*>", re.I | re.S)
SRC_RE = re.compile(r"\bsrc\s*=", re.I)
EVENT_RE = re.compile(r"(?<![\w:-])on[a-z][a-z0-9_-]*\s*=", re.I)
TRAILING_URL_PUNCTUATION = ".,;:!?)\]}"

def _origin(raw_url: str) -> str | None:
    candidate = raw_url.rstrip(TRAILING_URL_PUNCTUATION)
    try:
        parsed = urlsplit(candidate)
        scheme = parsed.scheme.lower()
        if scheme not in {"http", "https", "ws", "wss"} or not parsed.hostname:
            return None
        host = parsed.hostname.lower()
        port = parsed.port
        default_port = {"http": 80, "https": 443, "ws": 80, "wss": 443}.get(scheme)
        authority = host if port is None or port == default_port else f"{host}:{port}"
        return f"{scheme}://{authority}"
    except ValueError:
        return None

def _csp_from_config(root: Path) -> list[dict[str, object]]:
    config_path = root / "vercel.json"
    if not config_path.is_file():
        return []
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return []
    policies = []
    for group in config.get("headers", []):
        source = group.get("source", "")
        for header in group.get("headers", []):
            if header.get("key", "").lower() != "content-security-policy":
                continue
            directives = {}
            for directive in header.get("value", "").split(";"):
                tokens = directive.split()
                if tokens:
                    directives[tokens[0]] = tokens[1:]
            policies.append({"source": source, "directives": directives})
    return policies

def build_inventory(root: Path) -> dict[str, object]:
    html_files = sorted(root.glob("*.html"))
    js_files = sorted(root.glob("*.js"))
    source_files = html_files + js_files
    origins: Counter[str] = Counter()
    origin_files: dict[str, set[str]] = {}
    inline_script_blocks = 0
    inline_event_handlers = 0
    javascript_urls = 0
    scanned_files = 0

    for path in source_files:
        try:
            content = path.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        scanned_files += 1
        for raw_url in URL_RE.findall(content):
            origin = _origin(raw_url)
            if origin:
                origins[origin] += 1
                origin_files.setdefault(origin, set()).add(path.name)
        if path.suffix.lower() == ".html":
            inline_script_blocks += sum(
                1 for attrs, _body in SCRIPT_RE.findall(content) if not SRC_RE.search(attrs)
            )
            inline_event_handlers += len(EVENT_RE.findall(content))
            javascript_urls += len(re.findall(r"\b(?:href|src)\s*=\s*[\"']\s*javascript:", content, re.I))

    return {
        "scope": "root-level HTML and JavaScript source files plus CSP header in vercel.json",
        "limitations": [
            "Static source inventory only; it does not observe browser runtime requests.",
            "Computed URLs, URLs assembled from fragments, fetched configuration, and dependencies loaded indirectly may be missed.",
            "Origin counts are textual occurrences and may include comments or examples.",
            "This tool is advisory and does not change or enforce Content Security Policy.",
        ],
        "files": {"html": len(html_files), "javascript": len(js_files), "scanned": scanned_files},
        "csp_policies": _csp_from_config(root),
        "html_risk_indicators": {
            "inline_script_blocks": inline_script_blocks,
            "inline_event_handler_attributes": inline_event_handlers,
            "javascript_scheme_attributes": javascript_urls,
        },
        "external_literal_origins": [
            {"origin": origin, "occurrences": count, "files": sorted(origin_files[origin])}
            for origin, count in sorted(origins.items())
        ],
    }

def render_markdown(report: dict[str, object]) -> str:
    files = report["files"]
    risks = report["html_risk_indicators"]
    lines = [
        "# Static CSP and External-Origin Inventory", "",
        f"Scope: {report['scope']}.", "",
        "## Source coverage", "",
        f"- HTML files: {files['html']}",
        f"- Root JavaScript files: {files['javascript']}",
        f"- Files scanned: {files['scanned']}", "",
        "## HTML migration indicators", "",
        f"- Inline script blocks: {risks['inline_script_blocks']}",
        f"- Inline event-handler attributes: {risks['inline_event_handler_attributes']}",
        f"- javascript: URL attributes: {risks['javascript_scheme_attributes']}", "",
        "## CSP policy from vercel.json", "",
    ]
    if report["csp_policies"]:
        for policy in report["csp_policies"]:
            lines.append(f"### Source: {policy['source']}")
            for directive, sources in policy["directives"].items():
                lines.append(f"- {directive}: {' '.join(sources)}")
            lines.append("")
    else:
        lines.extend(["No parseable Content-Security-Policy header was found.", ""])
    lines.extend(["## External literal origins", ""])
    if report["external_literal_origins"]:
        lines.extend(["| Origin | Occurrences | Source files |", "|---|---:|---|"])
        for item in report["external_literal_origins"]:
            lines.append(f"| {item['origin']} | {item['occurrences']} | {', '.join(item['files'])} |")
    else:
        lines.append("No literal external origins found in the scanned files.")
    lines.extend(["", "## Limitations", ""])
    lines.extend(f"- {item}" for item in report["limitations"])
    lines.append("")
    return "\n".join(lines)

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--format", choices=("json", "markdown"), default="markdown")
    args = parser.parse_args()
    report = build_inventory(args.root.resolve())
    if args.format == "json":
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(render_markdown(report))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
