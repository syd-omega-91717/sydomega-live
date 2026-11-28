#!/usr/bin/env python3
"""Static inventory of browser-storage keys and the member-state mirror policy.

This is source analysis, not proof of runtime writes or successful cloud sync.
"""
import argparse
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path("docs/operations/MEMBER_STATE_KEY_INVENTORY.md")
SUFFIXES = {".html", ".js", ".mjs"}
EXCLUDED_DIRS = {".git", ".github", "node_modules", "public", "dist", "coverage", ".vercel", "docs", "scripts"}
CALL_RE = re.compile(r"(?:window\s*\.\s*)?localStorage\s*\.\s*(getItem|setItem|removeItem|clear)\s*\(")
CONST_RE = re.compile(r"\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(['\"\x60])([^'\"\x60\n]*)\2")
MAP_RE = re.compile(r"\bvar\s+(SKIP|NO_MIRROR)\s*=\s*\{([^}]*)\}", re.S)
MAP_KEY_RE = re.compile(r"""['"]?([A-Za-z0-9_:-]+)['"]?\s*:""")


def mask_comments_and_strings(source):
    """Return code-only mask with original offsets/newlines preserved."""
    out = list(source)
    i = 0
    n = len(source)
    while i < n:
        if source.startswith("//", i):
            j = source.find("\n", i + 2)
            if j < 0:
                j = n
            for k in range(i, j):
                out[k] = " "
            i = j
        elif source.startswith("/*", i):
            j = source.find("*/", i + 2)
            j = n if j < 0 else j + 2
            for k in range(i, j):
                if source[k] != "\n":
                    out[k] = " "
            i = j
        elif source[i] in ("'", '"', chr(96)):
            quote = source[i]
            j = i
            i += 1
            while i < n:
                if source[i] == "\\":
                    i += 2
                    continue
                if source[i] == quote:
                    i += 1
                    break
                i += 1
            for k in range(j, min(i, n)):
                if source[k] != "\n":
                    out[k] = " "
        else:
            i += 1
    return "".join(out)


def extract_first_argument(source, open_paren):
    """Read one call argument while respecting strings and nested delimiters."""
    i = open_paren + 1
    start = i
    depth = 0
    quote = None
    while i < len(source):
        ch = source[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in ("'", '"', chr(96)):
            quote = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            if ch == ")" and depth == 0:
                return source[start:i].strip(), i + 1
            depth = max(0, depth - 1)
        elif ch == "," and depth == 0:
            return source[start:i].strip(), i + 1
        i += 1
    return source[start:i].strip(), i


def read_policy(source):
    code = mask_comments_and_strings(source)
    maps = {"SKIP": set(), "NO_MIRROR": set()}
    for match in MAP_RE.finditer(source):
        if code[match.start():match.start() + 3].strip() == "":
            continue
        maps[match.group(1)].update(MAP_KEY_RE.findall(match.group(2)))
    return maps


DECL_START_RE = re.compile(r"\\b(?:const|let|var)\\s+")


def _declaration_end(code, start):
    depth = 0
    for i in range(start, len(code)):
        ch = code[i]
        if ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth = max(0, depth - 1)
        elif depth == 0 and ch == ";":
            return i
        elif depth == 0 and ch == "\\n" and not code[start:i].rstrip().endswith(","):
            return i
    return len(code)


def _split_declarators(statement):
    parts = []
    start = 0
    depth = 0
    quote = None
    escaped = False
    for i, ch in enumerate(statement):
        if quote:
            if escaped:
                escaped = False
            elif ch == "\\\\":
                escaped = True
            elif ch == quote:
                quote = None
        elif ch in ("'", '"', chr(96)):
            quote = ch
        elif ch in "([{":
            depth += 1
        elif ch in ")]}":
            depth = max(0, depth - 1)
        elif ch == "," and depth == 0:
            parts.append(statement[start:i])
            start = i + 1
    parts.append(statement[start:])
    return parts


def _literal_declarator(part):
    name = re.match(r"\\s*([A-Za-z_$][\\w$]*)\\s*=\\s*", part)
    if not name:
        return None
    i = name.end()
    if i >= len(part) or part[i] not in ("'", '"', chr(96)):
        return None
    quote = part[i]
    i += 1
    value = []
    while i < len(part):
        ch = part[i]
        if ch == "\\\\" and i + 1 < len(part):
            value.append(part[i:i + 2])
            i += 2
            continue
        if ch == quote:
            if part[i + 1:].strip():
                return None
            literal = "".join(value)
            if quote == chr(96) and "${" in literal:
                return None
            return name.group(1), literal
        value.append(ch)
        i += 1
    return None


def constants_in(source):
    """Resolve literal const/let/var bindings, including comma-separated declarations.

    Computed expressions and dynamic template literals remain unresolved. This
    is intentionally lexical rather than a full JavaScript scope/data-flow parser.
    """
    code = mask_comments_and_strings(source)
    constants = {}
    for match in DECL_START_RE.finditer(code):
        start = match.end()
        end = _declaration_end(code, start)
        statement = source[start:end]
        for part in _split_declarators(statement):
            binding = _literal_declarator(part)
            if binding:
                constants[binding[0]] = binding[1]
    return constants


def resolve_key(expression, constants):
    """Return (exact_key, dynamic_prefix, unresolved_expression)."""
    expr = expression.strip()
    literal = re.fullmatch(r"""(['"])(.*?)\1""", expr, re.S)
    if literal:
        return literal.group(2), None, None
    tick = chr(96)
    template = re.fullmatch(re.escape(tick) + r"(.*?)" + re.escape(tick), expr, re.S)
    if template:
        value = template.group(1)
        marker = chr(36) + "{"
        if marker not in value:
            return value, None, None
        return None, value.split(marker, 1)[0], None
    if re.fullmatch(r"[A-Za-z_$][\w$]*", expr) and expr in constants:
        return constants[expr], None, None
    prefix_literal = re.match(r"""^\s*(['"])(.*?)\1\s*\+""", expr, re.S)
    if prefix_literal:
        return None, prefix_literal.group(2), None
    prefix_name = re.match(r"^\s*([A-Za-z_$][\w$]*)\s*\+", expr)
    if prefix_name and prefix_name.group(1) in constants:
        return None, constants[prefix_name.group(1)], None
    return None, None, expr


def classify(exact, prefix, policy):
    if exact is not None:
        if exact in policy["SKIP"]:
            return "EPHEMERAL_OR_BROWSER_LOCAL_SKIP"
        if exact in policy["NO_MIRROR"]:
            return "FINANCE_LOCAL_NO_MIRROR"
        if exact.startswith("omega_analytics_"):
            return "ANALYTICS_EXCLUDED_FROM_MIRROR"
        if exact.startswith("omega:cache:"):
            return "CACHE_MIRROR_ELIGIBLE_BACKUP_EXCLUDED"
        if exact.startswith("omega"):
            return "MEMBER_STATE_MIRROR_ELIGIBLE"
        return "OUTSIDE_MEMBER_STATE_PREFIX"
    if prefix is not None:
        if prefix.startswith("omega_analytics_"):
            return "DYNAMIC_ANALYTICS_EXCLUDED"
        if prefix.startswith("omega"):
            return "DYNAMIC_MEMBER_STATE_CANDIDATE"
        return "DYNAMIC_OUTSIDE_MEMBER_STATE_PREFIX"
    return "DYNAMIC_KEY_UNRESOLVED"


def source_files(root):
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in SUFFIXES:
            continue
        relative = path.relative_to(root)
        if any(part in EXCLUDED_DIRS for part in relative.parts):
            continue
        yield path


def build_inventory(root=ROOT):
    member_file = root / "omega-member-state.js"
    policy = read_policy(member_file.read_text(encoding="utf-8")) if member_file.is_file() else {"SKIP": set(), "NO_MIRROR": set()}
    records = defaultdict(lambda: {"category": "", "operations": set(), "refs": set(), "expression": ""})
    clears = []
    scanned = 0
    for path in source_files(root):
        source = path.read_text(encoding="utf-8", errors="replace")
        code = mask_comments_and_strings(source)
        constants = constants_in(source)
        scanned += 1
        for match in CALL_RE.finditer(code):
            operation = match.group(1)
            line = source.count("\n", 0, match.start()) + 1
            relative = path.relative_to(root).as_posix()
            if operation == "clear":
                clears.append((relative, line))
                continue
            expression, _ = extract_first_argument(source, match.end() - 1)
            exact, prefix, unresolved = resolve_key(expression, constants)
            category = classify(exact, prefix, policy)
            label = exact if exact is not None else (prefix + "{dynamic}" if prefix is not None else "{unresolved: " + expression + "}")
            record = records[label]
            record["category"] = category
            record["operations"].add(operation)
            record["refs"].add((relative, line))
            record["expression"] = expression if exact is None else ""
    return {
        "records": dict(records),
        "clears": sorted(set(clears)),
        "scanned": scanned,
        "skip": sorted(policy["SKIP"]),
        "no_mirror": sorted(policy["NO_MIRROR"]),
    }


def render_markdown(inventory):
    records = inventory["records"]
    categories = defaultdict(list)
    for key, record in records.items():
        categories[record["category"]].append((key, record))
    tick = chr(96)
    lines = [
        "# Member-State Key Lifecycle Inventory",
        "",
        "**Generated by scripts/member-state-key-audit.py; do not edit by hand.**",
        "",
        "## Scope and limits",
        "",
        f"Scanned {inventory['scanned']} first-party HTML/JS/MJS source files for direct localStorage getItem, setItem, removeItem, and clear calls.",
        "This is static source evidence. It does not prove a key is present in a member's browser, that a mirror upload succeeded, or that a remote row exists.",
        "Computed keys are reported as dynamic candidates or unresolved expressions. This scanner does not parse arbitrary JavaScript data flow, IndexedDB, cookies, Cache API, or Web Storage aliases.",
        "",
        "## Policy from omega-member-state.js",
        "",
        f"- SKIP: {len(inventory['skip'])} exact keys excluded from the mirror and shared member export predicate.",
        f"- NO_MIRROR: {len(inventory['no_mirror'])} exact finance keys excluded from cloud mirroring but intentionally remain exportable.",
        "- omega_analytics_*: excluded from the mirror by prefix; export paths have separate handling.",
        "- Other keys beginning with omega are eligible only when signed in, readable, within 512 KiB, and successfully upserted.",
        "",
        "### Exact SKIP keys",
        "",
        ", ".join(tick + key + tick for key in inventory["skip"]) or "_None found._",
        "",
        "### Exact NO_MIRROR keys",
        "",
        ", ".join(tick + key + tick for key in inventory["no_mirror"]) or "_None found._",
        "",
        "## Inventory summary",
        "",
        "| Classification | Keys/patterns |",
        "|---|---:|",
    ]
    for category in sorted(categories):
        lines.append(f"| {tick}{category}{tick} | {len(categories[category])} |")
    lines.extend(["", "## Key references", ""])
    for category in sorted(categories):
        lines.extend([f"### {category}", ""])
        for key, record in sorted(categories[category], key=lambda item: item[0]):
            ops = ", ".join(sorted(record["operations"]))
            lines.append(f"- {tick}{key}{tick} — {ops}")
            if record["expression"]:
                lines.append(f"  - Expression: {tick}{record['expression']}{tick}")
            for path, line in sorted(record["refs"]):
                lines.append(f"  - {tick}{path}:{line}{tick}")
        lines.append("")
    lines.extend(["## Global clear operations", ""])
    if inventory["clears"]:
        lines.extend(f"- {tick}{path}:{line}{tick} — localStorage.clear()" for path, line in inventory["clears"])
    else:
        lines.append("_No direct localStorage.clear() calls found._")
    lines.extend([
        "",
        "## Required review before deletion semantics",
        "",
        "- Confirm every dynamic pattern's intended data class with its owning page/module.",
        "- Confirm browser-only analytics/cache/telemetry keys are excluded from the mirror and export paths where required.",
        "- Keep finance keys excluded from cloud mirroring unless an explicit owner decision changes the privacy boundary.",
        "- Do not infer deletion from a missing local key; an empty browser is a valid recovery target.",
        "- Design tombstones and restore conflict rules only after the inventory is reviewed.",
        "",
    ])
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="write the generated inventory into the repository")
    args = parser.parse_args()
    report = render_markdown(build_inventory())
    if args.write:
        target = ROOT / OUTPUT
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(report, encoding="utf-8")
        print(f"wrote {OUTPUT}")
    else:
        print(report)


if __name__ == "__main__":
    main()
