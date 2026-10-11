#!/usr/bin/env python3
"""peek -- outline a large file before reading it, so a session reads only the part it needs.

WHY THIS EXISTS

Several files here cost more in one full read than the whole auto-loaded
context: FIXES_LOG.md is ~1.4 MB (~350,000 approx tokens), bg.js ~194 KB,
profile.html and GAP_ANALYSIS.md tens of thousands of tokens each. The
context-budget skill (section 3) already says "get the shape before the
content" and lists hand-written grep recipes for each file type. This script is
those recipes, run in one command, with line numbers to feed straight into
Read's offset/limit.

Inspired by the "outline first, read only what matters, keep line references"
pattern of large-file reader plugins -- implemented here with the stdlib only,
because this repo has no build step and no package manager (CLAUDE.md section 9).

WHAT IT PRINTS (by extension)

    .md            headings (#, ##, ###) and FIXES_LOG-style "- **[...]" entry headers
    .js / .mjs     top-level functions, IIFEs, window.X publishers, and the
                   section markers inside bg.js's stylesheet string (Omega-* / "── X ──")
    .html          <title>, <style>/<script> blocks, <main>/<section>, h1-h3, id'd landmarks
    .sql           CREATE TABLE / FUNCTION / POLICY / VIEW / INDEX / TRIGGER, GRANT, REVOKE
    .json          top-level keys with value type and size
    anything else  line count and the longest lines (a single-line blob is the bg.js trap)

Every outline line is "<line>: <text>", truncated to --width columns, and ends
with a size line giving bytes and approx tokens (bytes/4, the same estimate
scripts/context-budget.py uses).

USAGE

    python3 scripts/peek.py FILE [FILE...]            # outline
    python3 scripts/peek.py FILE --grep REGEX         # matching lines only, truncated
    python3 scripts/peek.py FILE --grep REGEX -C 2    # ...with 2 lines of context
    python3 scripts/peek.py FILE --max 80 --width 140 # cap outline entries / columns

Read-only. Exit 0 on success, 2 on a missing file or bad regex.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import argparse
import json
import os
import re
import sys

MD_HEAD = re.compile(r"^(#{1,3})\s+\S")
MD_ENTRY = re.compile(r"^- \*\*\[")
JS_TOP = re.compile(
    r"^(?:async\s+)?function\s+[\w$]+|^\(function\s*\(|^\(\(\)\s*=>|^(?:const|let|var)\s+[\w$]+\s*=\s*(?:function|\(|async)"
    r"|^\s{0,2}window\.[\w$]+\s*=(?!=)"
)
JS_MARK = re.compile(r"──\s*([^─\n]{1,70}?)\s*──|(Ω-[A-Z][A-Z0-9-]+)")
HTML_TAG = re.compile(
    r"<title>|<style\b|</style>|<script\b|</script>|<main\b|<section\b|<h[1-3]\b|<(?:div|nav|aside|header|footer)\b[^>]*\bid=",
    re.I,
)
SQL_STMT = re.compile(
    r"^\s*(?:create\s+(?:or\s+replace\s+)?(?:table|function|policy|view|materialized\s+view|(?:unique\s+)?index|trigger)"
    r"|alter\s+table\s+\S+\s+enable\s+row\s+level|grant\s|revoke\s)",
    re.I,
)


def clip(text, width):
    text = text.rstrip("\n").replace("\t", " ")
    return text if len(text) <= width else text[: width - 1] + "…"


def outline_lines(path, lines, width, cap):
    ext = os.path.splitext(path)[1].lower()
    out = []

    def add(n, text):
        out.append("%6d: %s" % (n, clip(text, width)))

    if ext == ".md":
        for i, ln in enumerate(lines, 1):
            if MD_HEAD.match(ln) or MD_ENTRY.match(ln):
                add(i, ln)
    elif ext in (".js", ".mjs", ".cjs"):
        for i, ln in enumerate(lines, 1):
            if JS_TOP.match(ln):
                add(i, ln.strip())
            seen = set()
            for m in JS_MARK.finditer(ln):
                label = (m.group(1) or m.group(2)).strip()
                if label and label not in seen:
                    seen.add(label)
                    add(i, "  [section @col %d] %s" % (m.start() + 1, label))
    elif ext in (".html", ".htm"):
        for i, ln in enumerate(lines, 1):
            if HTML_TAG.search(ln):
                add(i, ln.strip())
    elif ext == ".sql":
        for i, ln in enumerate(lines, 1):
            if SQL_STMT.match(ln):
                add(i, ln.strip())
    elif ext == ".json":
        try:
            data = json.loads("".join(lines))
        except ValueError as e:
            return ["  (invalid JSON: %s)" % e]
        if isinstance(data, dict):
            for k, v in data.items():
                size = len(v) if isinstance(v, (list, dict, str)) else ""
                out.append("  %s: %s%s" % (k, type(v).__name__, "[%s]" % size if size != "" else ""))
        else:
            out.append("  top-level %s[%s]" % (type(data).__name__, len(data) if hasattr(data, "__len__") else ""))
    else:
        longest = sorted(range(len(lines)), key=lambda j: -len(lines[j]))[:5]
        for j in sorted(longest):
            add(j + 1, "(%d chars) %s" % (len(lines[j]), lines[j]))

    if cap and len(out) > cap:
        hidden = len(out) - cap
        out = out[:cap] + ["  … %d more (raise --max, or narrow with --grep)" % hidden]
    return out


def grep_lines(lines, pattern, ctx, width, cap):
    hits = [i for i, ln in enumerate(lines) if pattern.search(ln)]
    shown, out, last = set(), [], -2
    for i in hits:
        for j in range(max(0, i - ctx), min(len(lines), i + ctx + 1)):
            if j in shown:
                continue
            if ctx and last >= 0 and j > last + 1:
                out.append("    --")
            shown.add(j)
            out.append("%6d%s %s" % (j + 1, ":" if j == i else "-", clip(lines[j], width)))
            last = j
    if cap and len(out) > cap:
        hidden = len(out) - cap
        out = out[:cap] + ["  … %d more lines" % hidden]
    return out, len(hits)


def main(argv):
    ap = argparse.ArgumentParser(add_help=False)
    ap.add_argument("files", nargs="+")
    ap.add_argument("--grep")
    ap.add_argument("-C", type=int, default=0)
    ap.add_argument("--max", type=int, default=120)
    ap.add_argument("--width", type=int, default=160)
    a = ap.parse_args(argv)

    pattern = None
    if a.grep:
        try:
            pattern = re.compile(a.grep)
        except re.error as e:
            print("peek: bad regex: %s" % e, file=sys.stderr)
            return 2

    status = 0
    for path in a.files:
        if not os.path.isfile(path):
            print("peek: no such file: %s" % path, file=sys.stderr)
            status = 2
            continue
        with open(path, encoding="utf-8", errors="replace") as fh:
            lines = fh.readlines()
        size = os.path.getsize(path)
        print("== %s" % path)
        if pattern:
            body, n = grep_lines(lines, pattern, a.C, a.width, a.max)
            print("\n".join(body) if body else "  (no match)")
            tail = "%d matching line(s)" % n
        else:
            body = outline_lines(path, lines, a.width, a.max)
            print("\n".join(body) if body else "  (no structural markers found)")
            tail = "outline"
        print("-- %d lines, %d bytes, ~%d approx tokens for a full read; %s" % (len(lines), size, size // 4, tail))
    return status


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
