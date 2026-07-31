#!/usr/bin/env python3
"""
SYD OMEGA 91717 — repository integrity audit.

Run from the repository root:   python3 scripts/audit.py
Exit code 1 on any CRITICAL finding, so it can gate CI.

Checks:
  1. Modules requested by bg.js/nav.js that do not exist on disk  (CRITICAL)
  2. .js files on disk that nothing loads                          (warning)
  3. Tables created in more than one SQL file                      (warning)
  4. Tables with no ENABLE ROW LEVEL SECURITY anywhere             (CRITICAL)
  5. Files that vercel.json redirects away but still ship          (warning)
  6. Oversized assets in the deploy root                           (warning)
"""

import os
import re
import sys
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

LOADERS = ["bg.js", "nav.js"]
SQL_DIR = "supabase"
MAX_ASSET_BYTES = 1_000_000
REDIRECTED_EXT = (".ts", ".py", ".sol", ".sql", ".docx")

# Regex table extraction picks up stray keywords from multi-line DDL and
# comments. Anything here is not a table name.
NOT_A_TABLE = {
    "above", "alone", "is", "as", "if", "not", "exists", "the", "and", "or",
    "this", "that", "with", "on", "in", "to", "for", "select", "insert",
    "update", "delete", "where", "from", "table", "temp", "temporary",
}

critical = 0
warnings = 0


def head(title):
    print(f"\n{'=' * 68}\n{title}\n{'=' * 68}")


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


# ---------------------------------------------------------------- 1 & 2
head("1/2 · MODULE GRAPH")

on_disk = {f for f in os.listdir(".") if f.endswith(".js")}

loader_src = "".join(read(f) for f in LOADERS if os.path.exists(f))
injected = {
    m.split("/")[-1]
    for m in re.findall(r"""\.src\s*=\s*['"](/[^'"]+\.js)['"]""", loader_src)
}

static_included = set()
for page in (f for f in os.listdir(".") if f.endswith(".html")):
    for m in re.findall(r"""<script[^>]+src=["']([^"']+)""", read(page)):
        static_included.add(m.split("/")[-1].split("?")[0])

reachable = injected | static_included
missing = sorted(reachable - on_disk)
unloaded = sorted(on_disk - reachable)

print(f"  on disk: {len(on_disk)}   injected by loader: {len(injected)}   "
      f"in <script> tags: {len(static_included)}")

if missing:
    critical += 1
    print(f"\n  CRITICAL — requested but MISSING on disk ({len(missing)}):")
    for m in missing:
        stem = m[:-3]
        near = [d for d in on_disk if d[:-3].startswith(stem[:-1])]
        hint = f"   (did you mean {near[0]}?)" if near else ""
        print(f"    - {m}{hint}")
else:
    print("\n  OK — every requested module exists.")

if unloaded:
    warnings += 1
    print(f"\n  WARNING — on disk but never loaded ({len(unloaded)}):")
    print("    " + ", ".join(unloaded))

# ---------------------------------------------------------------- 3 & 4
head("3/4 · SQL SCHEMA INTEGRITY")

if not os.path.isdir(SQL_DIR):
    print(f"  {SQL_DIR}/ not found — skipping (expected after Session 2).")
else:
    sql_files = sorted(f for f in os.listdir(SQL_DIR) if f.endswith(".sql"))
    creates = collections.defaultdict(list)
    rls_on = set()
    policies = 0
    destructive = []

    for name in sql_files:
        src = read(os.path.join(SQL_DIR, name))
        for t in re.findall(
            r"""create\s+table\s+(?:if\s+not\s+exists\s+)?([`"\w\.]+)""", src, re.I
        ):
            clean = t.replace("public.", "").strip('"`')
            if clean.lower() in NOT_A_TABLE:
                continue
            creates[clean].append(name)
        for t in re.findall(
            r"""alter\s+table\s+([`"\w\.]+)\s+enable\s+row\s+level""", src, re.I
        ):
            rls_on.add(t.replace("public.", "").strip('"`'))
        policies += len(re.findall(r"create\s+policy", src, re.I))
        if re.search(r"drop\s+(table|schema)", src, re.I):
            destructive.append(name)

    dupes = {t: v for t, v in creates.items() if len(v) > 1}
    no_rls = sorted(set(creates) - rls_on)

    print(f"  files: {len(sql_files)}   tables: {len(creates)}   "
          f"policies: {policies}")
    print(f"  ordered (numeric-prefixed) files: "
          f"{sum(1 for f in sql_files if f[0].isdigit())}/{len(sql_files)}")

    if no_rls:
        critical += 1
        print(f"\n  CRITICAL — no ENABLE ROW LEVEL SECURITY found ({len(no_rls)}):")
        for t in no_rls:
            print(f"    - {t}  (created in: {', '.join(creates[t][:3])})")
        print("    Verify against the live DB — file analysis is indicative only.")

    if dupes:
        warnings += 1
        print(f"\n  WARNING — tables created in multiple files ({len(dupes)}):")
        for t, v in sorted(dupes.items(), key=lambda kv: -len(kv[1]))[:12]:
            print(f"    - {t}: {len(v)} files")

    if destructive:
        warnings += 1
        print(f"\n  WARNING — contains DROP TABLE/SCHEMA: {', '.join(destructive)}")

# ---------------------------------------------------------------- 5 & 6
head("5/6 · DEPLOY HYGIENE")

shipped = [
    f for f in os.listdir(".")
    if f.endswith(REDIRECTED_EXT) and os.path.isfile(f)
]
if shipped:
    warnings += 1
    print(f"  WARNING — unreachable but deployed ({len(shipped)}):")
    print("    " + ", ".join(sorted(shipped)))

big = [
    (f, os.path.getsize(f)) for f in os.listdir(".")
    if os.path.isfile(f) and os.path.getsize(f) > MAX_ASSET_BYTES
]
if big:
    warnings += 1
    print(f"\n  WARNING — assets over {MAX_ASSET_BYTES // 1000} KB in deploy root:")
    for f, s in sorted(big, key=lambda x: -x[1]):
        print(f"    - {f}  ({s / 1_000_000:.1f} MB)")

if os.path.isdir("__pycache__"):
    warnings += 1
    print("\n  WARNING — __pycache__/ is committed; extend .gitignore")

# ---------------------------------------------------------------- summary
head("SUMMARY")
print(f"  critical: {critical}    warnings: {warnings}")
if critical:
    print("\n  FAILED — critical findings must be resolved.")
    sys.exit(1)
print("\n  PASSED")
sys.exit(0)
