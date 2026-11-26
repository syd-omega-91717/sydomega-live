#!/usr/bin/env python3
"""Static inventory of HTML controls and directly traceable JavaScript listeners.

This is deliberately a source-level correlation tool, not a browser/runtime
test. A discovered listener does not prove that its callback succeeds, that
its backend call is authorized, or that the page is deployed.
"""
from __future__ import annotations

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
CONTROL_TAGS = {"button", "input", "select", "textarea", "form"}
EVENTS = {"click", "submit", "change", "input", "keydown", "keyup", "focus", "blur", "pointerdown", "drop"}
def mask_js_non_code(source):
    """Replace comments and quoted literals with tokens before regex correlation.

    This prevents listener-shaped text inside comments, strings, and template
    literals from being reported as executable event wiring. Template
    interpolation is intentionally not parsed by this conservative scanner.
    """
    output = []
    strings = {}
    i = 0
    while i < len(source):
        ch = source[i]
        nxt = source[i + 1] if i + 1 < len(source) else ""
        if ch == "/" and nxt == "/":
            while i < len(source) and source[i] not in "\\r\\n":
                output.append(" ")
                i += 1
            continue
        if ch == "/" and nxt == "*":
            output.extend("  ")
            i += 2
            while i < len(source):
                if source[i] == "*" and i + 1 < len(source) and source[i + 1] == "/":
                    output.extend("  ")
                    i += 2
                    break
                output.append("\\n" if source[i] == "\\n" else " ")
                i += 1
            continue
        if ch in ("'", '"', "`"):
            quote = ch
            i += 1
            literal = []
            while i < len(source):
                current = source[i]
                if current == "\\\\" and i + 1 < len(source):
                    literal.append(source[i:i + 2])
                    i += 2
                    continue
                if current == quote:
                    i += 1
                    break
                literal.append(current)
                i += 1
            token_id = len(strings)
            strings[token_id] = "".join(literal)
            output.append(f"__OMEGA_STRING_{token_id}__")
            continue
        output.append(ch)
        i += 1
    return "".join(output), strings


STRING_TOKEN = re.compile(r"__OMEGA_STRING_(\\d+)__")
ASSIGNMENT = re.compile(
    r"\\b(?:var|let|const)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*document\\s*\\.\\s*"
    r"(getElementById|querySelector|querySelectorAll)\\s*\\(\\s*__OMEGA_STRING_(\\d+)__\\s*\\)",
    re.S,
)
VARIABLE_LISTENER = re.compile(
    r"\\b([A-Za-z_$][\\w$]*)\\s*\\.\\s*addEventListener\\s*\\(\\s*__OMEGA_STRING_(\\d+)__",
    re.S,
)
DIRECT_LISTENER = re.compile(
    r"document\\s*\\.\\s*(getElementById|querySelector|querySelectorAll)\\s*"
    r"\\(\\s*__OMEGA_STRING_(\\d+)__\\s*\\)\\s*\\.\\s*addEventListener\\s*"
    r"\\(\\s*__OMEGA_STRING_(\\d+)__",
    re.S,
)
DELEGATED_LISTENER = re.compile(
    r"\\b(document|window|body)\\s*\\.\\s*addEventListener\\s*\\(\\s*__OMEGA_STRING_(\\d+)__",
    re.S,
)



class PageParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.controls = []
        self.scripts = []
        self._script_src = None
        self._script_parts = []
        self._inside_script = False
        self._index = 0

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        tag = tag.lower()
        if tag == "script":
            self._script_src = attrs.get("src")
            self._script_parts = []
            self._inside_script = True
        if tag in CONTROL_TAGS or (tag == "a" and (attrs.get("href") or attrs.get("onclick"))):
            self._index += 1
            self.controls.append({
                "control_id": self._index,
                "tag": tag,
                "id": attrs.get("id"),
                "classes": sorted((attrs.get("class") or "").split()),
                "attributes": {k: v for k, v in attrs.items() if k.startswith("data-")},
                "type": attrs.get("type"),
                "name": attrs.get("name"),
            })

    def handle_data(self, data):
        if self._inside_script:
            self._script_parts.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "script":
            self.scripts.append({
                "src": self._script_src,
                "inline_source": "".join(self._script_parts) if self._script_src is None else "",
            })
            self._script_src = None
            self._script_parts = []
            self._inside_script = False


def local_script_path(src, page_path):
    if not src:
        return None
    parsed = urlsplit(src)
    if parsed.scheme or parsed.netloc or src.startswith("//") or parsed.path.startswith("data:"):
        return None
    raw = parsed.path
    if not raw:
        return None
    return (Path("/") / raw.lstrip("/")) if raw.startswith("/") else (page_path.parent / raw)


def selector_matches(selector, control):
    selector = selector.strip()
    if not selector:
        return False
    if selector.startswith("#"):
        return control.get("id") == selector[1:]
    if selector.startswith("."):
        return selector[1:] in control.get("classes", [])
    attr = re.fullmatch(r"""\[([\w:-]+)(?:\s*=\s*['"]?(.*?)['"]?)?\]""", selector)
    if attr:
        key, expected = attr.groups()
        attrs = control.get("attributes", {})
        if key == "id":
            actual = control.get("id")
        elif key == "class":
            actual = " ".join(control.get("classes", []))
        else:
            actual = attrs.get(key)
        return actual is not None and (expected is None or str(actual) == expected)
    return control.get("tag") == selector.lower()


def selector_to_control(selector, controls, method):
    if method == "getElementById":
        selector = "#" + selector
    matches = [c["control_id"] for c in controls if selector_matches(selector, c)]
    return matches


def extract_bindings(source, controls, source_name):
    code, literals = mask_js_non_code(source)

    def literal(token_id):
        return literals.get(int(token_id), "")

    bindings = []
    variables = {}
    for match in ASSIGNMENT.finditer(code):
        variable, method, token_id = match.groups()
        variables[variable] = (method, literal(token_id))
    for match in VARIABLE_LISTENER.finditer(code):
        variable, token_id = match.groups()
        event = literal(token_id)
        if variable not in variables or event not in EVENTS:
            continue
        method, selector = variables[variable]
        bindings.append({
            "source": source_name, "event": event, "selector": selector,
            "selector_method": method,
            "control_ids": selector_to_control(selector, controls, method),
            "binding_kind": "direct_variable",
        })
    for match in DIRECT_LISTENER.finditer(code):
        method, selector_id, event_id = match.groups()
        selector, event = literal(selector_id), literal(event_id)
        if event not in EVENTS:
            continue
        bindings.append({
            "source": source_name, "event": event, "selector": selector,
            "selector_method": method,
            "control_ids": selector_to_control(selector, controls, method),
            "binding_kind": "direct_chain",
        })
    delegated = [
        {"source": source_name, "target": target, "event": literal(token_id)}
        for target, token_id in DELEGATED_LISTENER.findall(code)
        if literal(token_id) in EVENTS
    ]
    return bindings, delegated


def audit_page(page_path, root=ROOT):
    page_path = Path(page_path)
    if not page_path.is_absolute():
        page_path = root / page_path
    page_path = page_path.resolve()
    parser = PageParser()
    html = page_path.read_text(encoding="utf-8", errors="ignore")
    parser.feed(html)
    bindings, delegated, missing, external = [], [], [], []
    loaded = []
    for script in parser.scripts:
        src = script["src"]
        if src is None:
            found, global_events = extract_bindings(script["inline_source"], parser.controls, "<inline>")
            bindings.extend(found); delegated.extend(global_events)
            continue
        parsed = urlsplit(src)
        if parsed.scheme or parsed.netloc or src.startswith("//"):
            external.append(src)
            continue
        candidate = local_script_path(src, page_path)
        if src.startswith("/"):
            candidate = root / str(candidate).lstrip("/")
        else:
            candidate = candidate.resolve()
        try:
            candidate.resolve().relative_to(root.resolve())
        except ValueError:
            missing.append({"src": src, "reason": "path escapes repository root"})
            continue
        if not candidate.is_file():
            missing.append({"src": src, "reason": "local script file not found"})
            continue
        relative = candidate.relative_to(root).as_posix()
        loaded.append(relative)
        source = candidate.read_text(encoding="utf-8", errors="ignore")
        found, global_events = extract_bindings(source, parser.controls, relative)
        bindings.extend(found); delegated.extend(global_events)
    matched = sorted({control_id for item in bindings for control_id in item["control_ids"]})
    return {
        "page": page_path.relative_to(root).as_posix(),
        "control_count": len(parser.controls),
        "controls_with_static_direct_bindings": len(matched),
        "unmatched_controls": [c["control_id"] for c in parser.controls if c["control_id"] not in matched],
        "controls": parser.controls,
        "scripts": sorted(set(loaded)),
        "external_scripts": sorted(set(external)),
        "missing_local_scripts": missing,
        "direct_bindings": bindings,
        "delegated_bindings": delegated,
        "truth_boundary": "Static source correlation only; does not prove callback execution, backend authorization, success, or production deployment.",
    }


def audit_estate(root=ROOT):
    pages = sorted(root.glob("*.html"))
    reports = [audit_page(p, root) for p in pages]
    return {
        "schema_version": 1,
        "name": "Ω Page JavaScript Binding Audit",
        "status": "STATIC_SOURCE_CORRELATION_ONLY",
        "page_count": len(reports),
        "control_count": sum(p["control_count"] for p in reports),
        "direct_binding_count": sum(len(p["direct_bindings"]) for p in reports),
        "delegated_binding_count": sum(len(p["delegated_bindings"]) for p in reports),
        "missing_local_script_count": sum(len(p["missing_local_scripts"]) for p in reports),
        "pages": reports,
        "truth_boundary": "Static source correlation is not runtime verification or proof of functional/security correctness.",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--page", help="audit one HTML page")
    parser.add_argument("--write", action="store_true", help="write config/omega-page-js-binding-audit.json")
    args = parser.parse_args()
    data = audit_page(args.page) if args.page else audit_estate()
    if args.write:
        output = ROOT / "config" / "omega-page-js-binding-audit.json"
        output.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print(f"WROTE {output}")
    else:
        if args.page:
            print(json.dumps({k: data[k] for k in ("page", "control_count", "controls_with_static_direct_bindings", "scripts", "missing_local_scripts", "direct_bindings", "delegated_bindings")}, ensure_ascii=False, indent=2))
        else:
            print(json.dumps({k: data[k] for k in ("page_count", "control_count", "direct_binding_count", "delegated_binding_count", "missing_local_script_count")}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
