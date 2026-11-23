#!/usr/bin/env python3
"""Build a deterministic, evidence-labelled dependency graph for root browser scripts.

Read-only: does not change script order, add a bundler, or infer that a heuristic
global reference is a proven execution dependency.

Usage:
  python3 scripts/omega-script-dependency-graph.py
  python3 scripts/omega-script-dependency-graph.py --json
  python3 scripts/omega-script-dependency-graph.py --root /path/to/checkout --json
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from collections import defaultdict, deque
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit

SCRIPT_SUFFIXES = {".js", ".mjs", ".cjs"}
GLOBAL_PUBLISHERS = (
    re.compile(r"\b(?:window|globalThis|self)\s*\.\s*((?:Omega|omega)[A-Za-z0-9_$]+)\s*="),
    re.compile(r"\b(?:window|globalThis|self)\s*\[\s*['\"]((?:Omega|omega)[A-Za-z0-9_$]+)['\"]\s*\]\s*="),
)
SIDE_EFFECTS = (
    ("injects-css", re.compile(r"createElement\(\s*['\"]style['\"]\s*\)|adoptedStyleSheets|insertRule\(")),
    ("sets-css-custom-property", re.compile(r"setProperty\(\s*['\"]--")),
    ("dispatches-events", re.compile(r"dispatchEvent\(|new CustomEvent\(")),
    ("listens-for-omega-events", re.compile(r"addEventListener\(\s*['\"]omega[:\w.-]*['\"]")),
    ("hooks-dom-ready", re.compile(r"['\"]DOMContentLoaded['\"]")),
    ("uses-mutation-observer", re.compile(r"new MutationObserver\(")),
    ("listens-to-scroll-or-resize", re.compile(r"addEventListener\(\s*['\"](?:scroll|resize)['\"]")),
)
IMPORT_PATTERNS = (
    re.compile(r"\bimport\s+(?:[^;]*?\s+from\s+)?['\"]([^'\"]+)['\"]"),
    re.compile(r"\bexport\s+[^;]*?\s+from\s+['\"]([^'\"]+)['\"]"),
    re.compile(r"\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"),
    re.compile(r"\brequire\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"),
)

class ScriptTagParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.sources = []
    def handle_starttag(self, tag, attrs):
        if tag.lower() == "script":
            src = dict(attrs).get("src")
            if src:
                self.sources.append(src)

def read_text(path):
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""

def discover_root_scripts(root):
    return {p.name: read_text(p) for p in sorted(root.iterdir(), key=lambda p: p.name)
            if p.is_file() and p.suffix.lower() in SCRIPT_SUFFIXES}

def local_script_ref(raw, known):
    if not raw or raw.startswith(("data:", "blob:", "//")):
        return None
    parsed = urlsplit(raw)
    if parsed.scheme or parsed.netloc:
        return None
    path = parsed.path.split("?", 1)[0].split("#", 1)[0].lstrip("/")
    return path if path in known else None

def scan_bg_injection(bg, known):
    result = {}
    pattern = re.compile(r"""['"]/?([A-Za-z0-9_.-]+\.js)['"]""")
    matches = list(pattern.finditer(bg))
    for index, match in enumerate(matches):
        name = match.group(1)
        if name not in known or name == "bg.js":
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else min(len(bg), match.end() + 1200)
        window = bg[match.end():min(end, match.end() + 1200)]
        idle, immediate = window.find("__omegaIdleAppend("), window.find("__omegaAppend(")
        if idle >= 0 and (immediate < 0 or idle < immediate):
            result.setdefault(name, "idle")
        elif immediate >= 0:
            result.setdefault(name, "immediate")
        else:
            result.setdefault(name, "referenced-in-bg-unclassified")
    return result

def scan_bg_loader_sequence(bg, known):
    """Capture root script assignments followed by the matching append helper."""
    assignment = re.compile(
        r"(?P<variable>[A-Za-z_$][A-Za-z0-9_$]*)\.src\s*=\s*['\"]/(?P<path>[A-Za-z0-9_.-]+\.js)['\"]"
    )
    matches = list(assignment.finditer(bg))
    sequence = []
    for index, match in enumerate(matches):
        name = match.group("path")
        if name not in known or name == "bg.js":
            continue
        end = matches[index + 1].start() if index + 1 < len(matches) else min(len(bg), match.end() + 1600)
        window = bg[match.end():end]
        variable = re.escape(match.group("variable"))
        append = re.search(r"__omega(Idle)?Append\s*\(\s*" + variable + r"\s*\)", window)
        if not append:
            continue
        helper = "idle" if append.group(1) else "immediate"
        append_offset = match.end() + append.start()
        sequence.append({
            "order": len(sequence) + 1,
            "path": name,
            "helper": helper,
            "source_line": bg.count("\n", 0, match.start()) + 1,
            "append_line": bg.count("\n", 0, append_offset) + 1,
        })
    return sequence


def inspect_bg_loader_contract(bg):
    """Report source-level signals for loader guarantees; these are not runtime proof."""
    append_start = bg.find("function __omegaAppend(el){")
    idle_start = bg.find("function __omegaIdleAppend(el){")
    platform_start = bg.find("/* Platform nervous system */")
    append_end = platform_start if platform_start > append_start >= 0 else len(bg)
    append_block = bg[append_start:append_end] if append_start >= 0 else ""
    idle_end = append_start if append_start > idle_start >= 0 else len(bg)
    idle_block = bg[idle_start:idle_end] if idle_start >= 0 else ""

    ordered = bool(re.search(r"\bel\.async\s*=\s*false\b", append_block))
    promise = bool(re.search(r"\bnew\s+Promise\s*\(", append_block))
    registry_names = set(re.findall(
        r"\b([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*new\s+(?:Map|WeakMap)\s*\(",
        bg,
    ))
    shared_registry = any(
        re.search(r"\b" + re.escape(name) + r"\.get\s*\(", append_block)
        and re.search(r"\breturn\s+" + re.escape(name) + r"\.get\s*\(", append_block)
        for name in registry_names
    )
    onload = bool(re.search(r"\.onload\s*=|addEventListener\(\s*['\"]load['\"]", append_block))
    onerror = bool(re.search(r"\.onerror\s*=|addEventListener\(\s*['\"]error['\"]", append_block))
    timeout = bool(re.search(r"\bsetTimeout\s*\(", append_block))
    retry_api = bool(re.search(
        r"\bfunction\s+retry[A-Za-z0-9_$]*\s*\(|\bretry[A-Za-z0-9_$]*\s*=\s*function",
        append_block,
    ))
    registry_cleanup = bool(re.search(r"\.delete\s*\(|delete\s+[A-Za-z_$][\w$]*\s*\[", append_block))
    dedupe = "WeakSet" in append_block and "isConnected" in append_block
    idle_cap = re.search(r"requestIdleCallback\s*\(\s*run\s*,\s*\{\s*timeout\s*:\s*(\d+)", idle_block)
    idle_waits_for_load = (
        "document.readyState==='complete'" in idle_block
        and re.search(r"addEventListener\(\s*['\"]load['\"].*?once\s*:\s*true", idle_block, re.S) is not None
    )
    complete_signals = ordered and promise and shared_registry and onload and onerror and timeout and retry_api and registry_cleanup
    return {
        "append_helper_present": append_start >= 0,
        "idle_helper_present": idle_start >= 0,
        "sets_async_false_before_append_signal": ordered,
        "ordered_dynamic_execution_signal": ordered,
        "creates_load_promise_signal": promise,
        "shared_inflight_promise_registry_signal": shared_registry,
        "has_load_callback_signal": onload,
        "has_error_callback_signal": onerror,
        "has_timeout_signal": timeout,
        "has_retry_api_signal": retry_api,
        "has_registry_cleanup_signal": registry_cleanup,
        "deduplicates_existing_scripts_signal": dedupe,
        "idle_waits_for_window_load_signal": idle_waits_for_load,
        "idle_request_timeout_ms": int(idle_cap.group(1)) if idle_cap else None,
        "status": "ORDERED_WITH_SHARED_PROMISE_AND_RETRY_SIGNALS" if complete_signals
                  else "ORDERED_WITH_PARTIAL_LIFECYCLE_SIGNALS" if ordered
                  else "DEDUPE_AND_IDLE_ONLY" if dedupe and idle_waits_for_load
                  else "PARTIAL_OR_UNRECOGNIZED",
        "interpretation": (
            "Dynamically inserted classic scripts are not explicitly ordered by this helper."
            if not ordered else
            "The helper signals ordered execution; verify dependency order and runtime behavior in a browser."
        ),
    }


def resolve_local_import(specifier, importer, known):
    if not specifier.startswith((".", "/")):
        return None
    candidate = (Path(importer).parent / specifier).as_posix() if not specifier.startswith("/") else specifier.lstrip("/")
    candidates = [candidate]
    if not Path(candidate).suffix:
        candidates.extend(candidate + suffix for suffix in (".js", ".mjs", ".cjs"))
        candidates.extend((candidate + "/index.js", candidate + "/index.mjs"))
    for item in candidates:
        if Path(item).as_posix() in known:
            return Path(item).as_posix()
    return None

def topological_order(nodes, edges):
    outgoing, indegree = defaultdict(set), {node: 0 for node in nodes}
    for edge in edges:
        source, target = edge["from"], edge["to"]
        if source in indegree and target in indegree and target not in outgoing[source]:
            outgoing[source].add(target)
            indegree[target] += 1
    ready = deque(sorted(node for node, degree in indegree.items() if degree == 0))
    ordered = []
    while ready:
        node = ready.popleft()
        ordered.append(node)
        for target in sorted(outgoing[node]):
            indegree[target] -= 1
            if indegree[target] == 0:
                ready.append(target)
        ready = deque(sorted(ready))
    return ordered, sorted(node for node, degree in indegree.items() if degree > 0)

def build_inventory(root):
    scripts = discover_root_scripts(root)
    known = set(scripts)
    pages = sorted(root.glob("*.html"), key=lambda p: p.name)
    page_consumers, page_orders = defaultdict(set), {}
    for page in pages:
        parser = ScriptTagParser()
        parser.feed(read_text(page))
        ordered = []
        for raw in parser.sources:
            local = local_script_ref(raw, known)
            if local and local not in ordered:
                ordered.append(local)
                page_consumers[local].add(page.name)
        page_orders[page.name] = ordered

    bg_loads = scan_bg_injection(scripts.get("bg.js", ""), known)
    bg_sequence = scan_bg_loader_sequence(scripts.get("bg.js", ""), known)
    bg_loader_contract = inspect_bg_loader_contract(scripts.get("bg.js", ""))
    publishers = defaultdict(set)
    for name, source in scripts.items():
        for regex in GLOBAL_PUBLISHERS:
            publishers[name].update(regex.findall(source))

    hard_edges, advisory_edges, rows = [], [], []
    identifier = re.compile(r"\b(?:Omega|omega)[A-Za-z0-9_$]+\b")
    tokens_by_file = {name: set(identifier.findall(source)) for name, source in scripts.items()}
    for name, source in scripts.items():
        dependencies, globals_read = set(), set()
        for regex in IMPORT_PATTERNS:
            for specifier in regex.findall(source):
                dependency = resolve_local_import(specifier, name, known)
                if dependency and dependency != name:
                    dependencies.add(dependency)
                    hard_edges.append({"from": dependency, "to": name, "type": "static-local-import"})
        for owner, symbols in publishers.items():
            if owner == name:
                continue
            for symbol in symbols.intersection(tokens_by_file[name]):
                globals_read.add(symbol)
                advisory_edges.append({"from": owner, "to": name, "type": "global-symbol-reference", "symbol": symbol})
        effects = [label for label, regex in SIDE_EFFECTS if regex.search(source)]
        load_state = "entrypoint" if name == "bg.js" else bg_loads.get(name, "not-observed-in-bg")
        if dependencies:
            classification = "STATIC_DEPENDENCY"
        elif globals_read:
            classification = "GLOBAL_CONTRACT_REVIEW"
        elif effects:
            classification = "SIDE_EFFECT_REVIEW"
        else:
            classification = "NO_STATIC_DEPENDENCY_FOUND"
        rows.append({
            "path": name, "bytes": len(source.encode("utf-8")), "load_state": load_state,
            "pages": sorted(page_consumers.get(name, set())),
            "publishes": sorted(publishers.get(name, set())),
            "reads_published_globals": sorted(globals_read),
            "static_dependencies": sorted(dependencies), "side_effects": effects,
            "classification": classification,
        })

    order, cycles = topological_order(sorted(scripts), hard_edges)
    return {
        "schema_version": 2, "analysis_mode": "static-evidence-only",
        "root_script_count": len(scripts), "html_page_count": len(pages),
        "bg_injected_script_count": len(bg_loads),
        "bg_loader_sequence": bg_sequence,
        "bg_loader_contract": bg_loader_contract,
        "bg_load_states": {state: sorted(name for name, value in bg_loads.items() if value == state)
                           for state in sorted(set(bg_loads.values()))},
        "summary": {category: sum(row["classification"] == category for row in rows)
                    for category in ("STATIC_DEPENDENCY", "GLOBAL_CONTRACT_REVIEW", "SIDE_EFFECT_REVIEW", "NO_STATIC_DEPENDENCY_FOUND")},
        "hard_dependency_edges": sorted(hard_edges, key=lambda e: (e["from"], e["to"], e["type"])),
        "advisory_global_edges": sorted(advisory_edges, key=lambda e: (e["from"], e["to"], e["symbol"])),
        "deterministic_topological_order": order, "hard_dependency_cycles_or_blocked_nodes": cycles,
        "scripts": sorted(rows, key=lambda row: row["path"]),
        "page_script_order": {key: page_orders[key] for key in sorted(page_orders)},
        "limitations": [
            "Static analysis cannot prove runtime independence or discover dynamically constructed property names.",
            "Global-symbol references and side-effect classes are review signals, not proof of execution order.",
            "The topological order includes only statically resolved local import/require edges.",
            "The bg.js loader sequence is source-order evidence, not a runtime trace or dependency proof.",
            "An async=false check is scoped to the append helper; browser execution order still requires a render test.",
            "No script tags, runtime loaders, globals, feature flags, or production behavior are changed by this tool."
        ],
    }

def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent, help="repository root")
    parser.add_argument("--json", action="store_true", help="emit complete machine-readable inventory")
    args = parser.parse_args()
    result = build_inventory(args.root.resolve())
    if args.json:
        print(json.dumps(result, indent=2, sort_keys=True))
        return 0
    print("OMEGA SCRIPT DEPENDENCY INVENTORY")
    print("Root scripts: {root_script_count} | HTML pages: {html_page_count} | bg.js references: {bg_injected_script_count}".format(**result))
    for category, count in result["summary"].items():
        print("  {0:28s} {1:4d}".format(category, count))
    print("Hard local-import edges: {0} | cycles/blocked nodes: {1}".format(
        len(result["hard_dependency_edges"]), len(result["hard_dependency_cycles_or_blocked_nodes"])))
    if result["hard_dependency_cycles_or_blocked_nodes"]:
        print("HARD DEPENDENCY CYCLE REVIEW REQUIRED:")
        for name in result["hard_dependency_cycles_or_blocked_nodes"]:
            print("  " + name)
    print("No runtime code was changed. Heuristic findings require browser validation.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
