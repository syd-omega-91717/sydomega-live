#!/usr/bin/env python3
"""Ratchet unescaped dynamic values written into HTML sinks.

WHY THIS EXISTS

The production CSP is `script-src 'self' 'unsafe-inline'` (see
csp-inline-ratchet.py), so a string that reaches innerHTML as markup can run
script. CodeQL caught one real instance on 2026-11-02 (omega-daily-brief.js:
stored values -> innerHTML, FIXES_LOG 204a); no gate stops the next one. Root
*.html and *.js hold ~1,260 interpolations into HTML sinks that no escape
helper wraps (measured 2026-11-02).

WHAT IT COUNTS

Per root *.html / *.js file, every dynamic piece written into an HTML sink:
  sinks:  .innerHTML = / += ,  .outerHTML = ,  insertAdjacentHTML(pos, ...),
          document.write(...)
  pieces: each `${expr}` of a template literal and each non-literal operand
          of a `+` chain on the right-hand side.
A piece is SAFE (not counted) when it is
  - one whole call to an escape helper -- a function defined in the SAME file
    whose own body replaces `&`/`<` or builds a text node (a name like `h` or
    `e` is not trusted: they are often event arguments or heights);
  - Number()/parseInt()/parseFloat()/Math.*(), a `.length`, `.toFixed()`, or a
    digit literal;
  - a conditional whose two branches are both string/number literals.

WHAT IT DOES NOT PROVE

It is syntactic. It cannot tell a constant (`s.col` from a static table) from
a stored string (`m.name`), so the number is NOT a vulnerability count -- a
sample of it was mostly constants, with a minority of real data fields. It
ratchets: a file may never exceed its baseline and a file absent from the
baseline must be at 0, so new code is born clean while old code is migrated.
To lower the baseline run with --update (it refuses while anything is over; it only
creates a missing baseline file).

EXEMPTIONS

A deliberate case that cannot be escaped may carry `xss-ok: <reason>` (at
least 8 characters of reason) in a comment inside the sink statement or on the
line above it. Exempt sinks are excluded from the count and listed with
--exempt, so they stay visible. A bare `xss-ok` does not count.

Usage:
  python3 scripts/xss-sink-ratchet.py            check against the baseline
  python3 scripts/xss-sink-ratchet.py --update   lower the baseline
  python3 scripts/xss-sink-ratchet.py --top N    N worst files
  python3 scripts/xss-sink-ratchet.py --file F   list each counted piece in F
  python3 scripts/xss-sink-ratchet.py --exempt   list xss-ok exemptions

Exit 0 on pass, 1 when a file is over its baseline.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "scripts" / "xss-sink-baseline.json"

SINK = re.compile(
    r"(\.(?:innerHTML|outerHTML)\s*\+?=(?!=)"
    r"|insertAdjacentHTML\s*\(\s*[^,()]+,"
    r"|document\.write(?:ln)?\s*\()"
)
FUNC = re.compile(
    r"(?:function\s+([A-Za-z_$][\w$]*)\s*\("
    r"|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*"
    r"(?:function\s*\(|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>))"
)
ESCAPING_BODY = re.compile(r"&amp;|&lt;|createTextNode|textContent|&#")
LITERAL = re.compile(r"""^(?:'[^'\\]*'|"[^"\\]*"|\d+(?:\.\d+)?|`[^`$\\]*`)$""")
EXEMPT = re.compile(r"xss-ok:\s*(\S[^\n*]{7,})")
MAX_STATEMENT = 8000


def helpers(text: str) -> set[str]:
    """Names of functions in this file whose own body escapes or text-nodes."""
    out = set()
    for m in FUNC.finditer(text):
        if ESCAPING_BODY.search(text[m.end():m.end() + 400]):
            out.add(m.group(1) or m.group(2))
    return out


def statement(text: str, i: int) -> str:
    """The right-hand side starting at i, through the end of its statement."""
    n = len(text)
    j = i
    depth = 0
    while j < n and j - i < MAX_STATEMENT:
        c = text[j]
        if c in "'\"":
            q = c
            j += 1
            while j < n and text[j] != q and text[j] != "\n":
                if text[j] == "\\":
                    j += 1
                j += 1
        elif c == "`":
            j += 1
            lvl = 0
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == "`" and lvl == 0:
                    break
                if text[j] == "$" and text[j + 1:j + 2] == "{":
                    lvl += 1
                    j += 2
                    continue
                if text[j] == "}" and lvl > 0:
                    lvl -= 1
                j += 1
        elif c in "([{":
            depth += 1
        elif c in ")]}":
            if depth == 0:
                break
            depth -= 1
        elif c == ";" and depth == 0:
            break
        j += 1
    return text[i:j]


def skip_literal(s: str, i: int) -> int:
    """Index just past the quoted/template literal that starts at s[i]."""
    q = s[i]
    j = i + 1
    n = len(s)
    if q == "`":
        lvl = 0
        while j < n:
            if s[j] == "\\":
                j += 2
                continue
            if s[j] == "`" and lvl == 0:
                return j + 1
            if s[j] == "$" and s[j + 1:j + 2] == "{":
                lvl += 1
                j += 2
                continue
            if s[j] == "}" and lvl > 0:
                lvl -= 1
            j += 1
        return n
    while j < n and s[j] != q and s[j] != "\n":
        if s[j] == "\\":
            j += 1
        j += 1
    return min(j + 1, n)


def split_top(s: str, seps: str) -> list[str]:
    """Split on seps at bracket depth 0, outside literals ('++' / '+=' are not '+')."""
    out, cur, d, i, n = [], "", 0, 0, len(s)
    while i < n:
        c = s[i]
        if c in "'\"`":
            j = skip_literal(s, i)
            cur += s[i:j]
            i = j
            continue
        if c in "([{":
            d += 1
        elif c in ")]}":
            d -= 1
        if d == 0 and c in seps and not (c == "+" and (s[i + 1:i + 2] in ("+", "=") or s[i - 1:i] == "+")):
            out.append(cur)
            cur = ""
        else:
            cur += c
        i += 1
    out.append(cur)
    return out


def groups(s: str) -> list[str]:
    """Inner text of each top-level (...) [...] {...} group in s."""
    out, d, i, n, start = [], 0, 0, len(s), 0
    while i < n:
        c = s[i]
        if c in "'\"`":
            i = skip_literal(s, i)
            continue
        if c in "([{":
            if d == 0:
                start = i + 1
            d += 1
        elif c in ")]}" and d > 0:
            d -= 1
            if d == 0:
                out.append(s[start:i])
        i += 1
    return out


def top_templates(s: str) -> list[str]:
    """Template literals (with backticks) sitting at depth 0 of s."""
    out, d, i, n = [], 0, 0, len(s)
    while i < n:
        c = s[i]
        if c in "'\"`":
            j = skip_literal(s, i)
            if c == "`" and d == 0:
                out.append(s[i:j])
            i = j
            continue
        d += (c in "([{") - (c in ")]}")
        i += 1
    return out


def template_pieces(s: str) -> list[str]:
    out = []
    i = 0
    while i < len(s):
        if s[i] == "\\":
            i += 2
            continue
        if s[i] == "$" and s[i + 1:i + 2] == "{":
            d = 1
            j = i + 2
            while j < len(s) and d:
                if s[j] == "{":
                    d += 1
                elif s[j] == "}":
                    d -= 1
                j += 1
            out.append(s[i + 2:j - 1])
            i = j
            continue
        i += 1
    return out


HTMLISH = re.compile(r"""['"`][^'"`]*<""")
PREFIX = re.compile(r"^\s*(?:return\s+|(?:var|let|const)\s+[\w$]+\s*=\s*|[\w$.\[\]]+\s*\+?=(?!=)\s*)")


def is_lit(o: str) -> bool:
    o = o.strip()
    return len(o) > 1 and o[0] in "'\"`" and skip_literal(o, 0) == len(o)


def walk(text: str, names: set[str], out: list[str], depth: int = 0) -> None:
    """Collect dynamic operands that are written into HTML, descending into
    callbacks and nested templates (innerHTML = rows.map(r => '<tr>' + r.x))."""
    if depth > 12:
        return
    for stmt in split_top(text, ";,"):
        ops = [PREFIX.sub("", o, count=1) for o in split_top(stmt, "+")]
        chain = len(ops) > 1 and any(is_lit(o) for o in ops)
        for o in ops:
            o = o.strip()
            if not o:
                continue
            tpls = [o] if (o[0] == "`" and is_lit(o)) else top_templates(o)
            for t in tpls:
                for ex in template_pieces(t[1:-1]):
                    consider(ex, names, out)
                    walk(ex, names, out, depth + 1)
            if is_lit(o):
                continue
            if chain:
                consider(o, names, out)
            for g in groups(o):
                walk(g, names, out, depth + 1)


def consider(expr: str, names: set[str], out: list[str]) -> None:
    if is_safe(expr, names) or HTMLISH.search(expr):
        return  # an operand that itself builds markup is judged by its own parts
    out.append(" ".join(expr.split())[:100])


def pieces(rhs: str, names: set[str]) -> list[str]:
    out: list[str] = []
    walk(rhs, names, out)
    return out


def whole_call(expr: str, names: set[str]) -> bool:
    m = re.match(r"^([A-Za-z_$][\w$.]*)\s*\(", expr)
    if not m or m.group(1).split(".")[-1] not in names:
        return False
    d = 0
    for k in range(m.end() - 1, len(expr)):
        if expr[k] == "(":
            d += 1
        elif expr[k] == ")":
            d -= 1
            if d == 0:
                return k == len(expr) - 1
    return False


def is_safe(expr: str, names: set[str]) -> bool:
    e = expr.strip()
    if whole_call(e, names):
        return True
    if re.match(r"^(?:Number|parseInt|parseFloat|Math\.\w+)\(.*\)$", e, re.S):
        return True
    if re.match(r"^[\w$.\[\]]*\.length$", e) or re.match(r"^\(?.*\)?\.toFixed\(\d*\)$", e, re.S):
        return True
    if re.match(r"^\d+$", e):
        return True
    m = re.match(r"^\(?[^?]+\?\s*(.+?)\s*:\s*([^:]+?)\)?$", e, re.S)
    if m and all(LITERAL.match(x.strip()) or not x.strip() for x in m.groups()):
        return True
    return False


def line_of(text: str, pos: int) -> int:
    return text.count("\n", 0, pos) + 1


def exempt_here(text: str, start: int, rhs: str) -> str | None:
    line_start = text.rfind("\n", 0, start) + 1
    prev_start = text.rfind("\n", 0, max(line_start - 1, 0)) + 1
    for chunk in (text[prev_start:line_start], text[line_start:start], rhs):
        m = EXEMPT.search(chunk)
        if m:
            return m.group(1).strip()
    return None


def scan(text: str) -> tuple[list[tuple[int, str]], list[tuple[int, str]]]:
    """(counted pieces, exemptions) as (line, text)."""
    names = helpers(text)
    counted, exempt = [], []
    for m in SINK.finditer(text):
        rhs = statement(text, m.end())
        why = exempt_here(text, m.start(), rhs)
        if why:
            exempt.append((line_of(text, m.start()), why))
            continue
        found = pieces(rhs, names)
        ident = re.fullmatch(r"\s*([A-Za-z_$][\w$]*)\s*", rhs)
        if ident and not found:
            # `el.innerHTML = html`: judge how `html` was built, not the bare name
            built = False
            for a in re.finditer(r"\b" + re.escape(ident.group(1)) + r"\s*\+?=(?!=)", text[max(0, m.start() - 6000):m.start()]):
                built = True
                base = max(0, m.start() - 6000) + a.end()
                found += pieces(statement(text, base), names)
            if not built:
                found = [ident.group(1)]  # origin unknown (parameter / outer scope)
        for p in found:
            counted.append((line_of(text, m.start()), p))
    return counted, exempt


def counts() -> dict[str, int]:
    out = {}
    for p in sorted(ROOT.glob("*.html")) + sorted(ROOT.glob("*.js")):
        n = len(scan(p.read_text(encoding="utf-8", errors="ignore"))[0])
        if n:
            out[p.name] = n
    return out


def main(argv: list[str]) -> int:
    if "--file" in argv:
        name = argv[argv.index("--file") + 1]
        for line, e in scan((ROOT / name).read_text(encoding="utf-8", errors="ignore"))[0]:
            print(f"{name}:{line}  {e}")
        return 0
    if "--exempt" in argv:
        for p in sorted(ROOT.glob("*.html")) + sorted(ROOT.glob("*.js")):
            for line, why in scan(p.read_text(encoding="utf-8", errors="ignore"))[1]:
                print(f"{p.name}:{line}  xss-ok: {why}")
        return 0
    cur = counts()
    if "--top" in argv:
        n = int(argv[argv.index("--top") + 1])
        for name, c in sorted(cur.items(), key=lambda kv: -kv[1])[:n]:
            print(f"{c:5d}  {name}")
        return 0
    base = json.loads(BASELINE.read_text()) if BASELINE.exists() else {}
    base = {k: v for k, v in base.items() if not k.startswith("_")}
    over = {k: (v, base.get(k, 0)) for k, v in cur.items() if v > base.get(k, 0)}
    under = {k: (v, base[k]) for k, v in base.items() if cur.get(k, 0) < v}
    if "--update" in argv:
        if over and BASELINE.exists():
            print(f"refusing to update: {len(over)} file(s) are over their baseline "
                  "(escape the new pieces, or add `xss-ok: <reason>`):", ", ".join(sorted(over)[:8]))
            return 1
        out = {"_doc": "Unescaped dynamic pieces written into HTML sinks, per root file. "
                       "May only fall. See scripts/xss-sink-ratchet.py."}
        out.update(dict(sorted(cur.items())))
        BASELINE.write_text(json.dumps(out, indent=1) + "\n")
        print(f"baseline written: {len(cur)} files, {sum(cur.values())} pieces")
        return 0
    if over:
        print(f"XSS SINK RATCHET FAILED ({len(over)} file(s) over baseline):")
        for k, (v, b) in sorted(over.items()):
            print(f"  {k}: {v} unescaped piece(s) in HTML sinks, baseline {b}")
            for line, e in scan((ROOT / k).read_text(encoding="utf-8", errors="ignore"))[0][-(v - b):]:
                print(f"      line {line}: {e}")
        print("Escape it with a helper that replaces & < > \" ', build it with textContent / createElement,")
        print("or, if it is deliberately unescaped, add `xss-ok: <reason>` in a comment on the sink.")
        return 1
    print(f"XSS SINK RATCHET PASSED: {sum(cur.values())} legacy pieces in {len(cur)} files, none above baseline"
          + (f"; {len(under)} file(s) below baseline (run --update)" if under else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(_sys.argv[1:]))
