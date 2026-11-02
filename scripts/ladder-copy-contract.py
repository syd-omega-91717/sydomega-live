#!/usr/bin/env python3
"""The 12-gate ladder has one owner: OmegaCanon.authority (omega-canon.json: gates, gate_names).

CLAUDE.md 8.1 class 8 (two divergent copies of one canonical table). This gate finds every hard-coded copy of the
ladder in client code and fails when
  1. a copy DISAGREES with the canon (a different threshold, or the same names in a different order/set), or
  2. the number of copies grows past config/ladder-copies-baseline.json (the count can only go down).

Run: python3 scripts/ladder-copy-contract.py            check (exit 1 on a finding)
     python3 scripts/ladder-copy-contract.py --list     print every copy found
     python3 scripts/ladder-copy-contract.py --write-baseline   record today's counts (a deliberate act)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "config" / "ladder-copies-baseline.json"
canon = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))["authority"]
GATES = [float(x) for x in canon["gates"]]
NAMES = list(canon["gate_names"])

NUM = re.compile(r"-?\d+(?:\.\d+)?")


def files():
    for pat in ("*.html", "*.js"):
        for p in sorted(ROOT.glob(pat)):
            if p.name in ("omega-canon.js",) or p.parent != ROOT:
                continue
            yield p


def numeric_copies(text):
    """Bracketed literals holding >= 8 of the 12 canon thresholds. Returns (matches_canon, snippet)."""
    out = []
    for m in re.finditer(r"\[([^\[\]]{20,600})\]", text):
        nums = [float(x) for x in NUM.findall(m.group(1))]
        hits = [g for g in nums if any(abs(g - c) < 1e-4 for c in GATES)]
        if len(hits) >= 8:
            # a copy may carry a leading 0 (a floor) or trailing extras; the 12 thresholds must appear in order
            ok = any(nums[i:i + 12] == GATES for i in range(0, max(1, len(nums) - 11)))
            # the last rung is sometimes a named constant (APEX) rather than a literal: 11 literals, all equal
            ok = ok or nums[:11] == GATES[:11] and len(nums) == 11
            out.append((ok, m.group(1)[:60].replace("\n", " ")))
    return out


def name_copies(text):
    """Runs of quoted/`name:` tokens that start at INITIATE and are meant to be the 12 gate names."""
    out = []
    for m in re.finditer(r"""['"]INITIATE['"]""", text):
        window = text[m.start(): m.start() + 900]
        toks = re.findall(r"""['"]([A-Z][A-Z .]{2,18})['"]""", window)
        seq = toks[:12]
        if len(seq) >= 8:
            # only a ladder if most tokens are canon names; ignores unrelated INITIATE mentions
            known = [t for t in seq if t.split()[0] in NAMES]
            if len(known) >= 8:
                # the 12th rung is displayed as APEX, APEX SOVEREIGN, APEX · SOVEREIGN FOUNDER...: a display variant of
                # the same rung, not a different ladder. The first 11 names are the unambiguous part.
                out.append((seq[:11] == NAMES[:11], ",".join(seq[:4])))
    return out


def scan():
    found = {}
    for p in files():
        t = p.read_text(encoding="utf-8", errors="ignore")
        n = numeric_copies(t)
        s = name_copies(t)
        if n or s:
            found[p.name] = {"numeric": n, "names": s}
    return found


def main(argv):
    found = scan()
    mismatches, counts = [], {}
    for f, d in found.items():
        counts[f] = len(d["numeric"]) + len(d["names"])
        for ok, snip in d["numeric"]:
            if not ok:
                mismatches.append("%s: threshold copy differs from the canon: [%s...]" % (f, snip))
        for ok, snip in d["names"]:
            if not ok:
                mismatches.append("%s: gate-name copy differs from the canon: %s..." % (f, snip))
    total = sum(counts.values())
    if "--list" in argv:
        for f in sorted(counts):
            print("%-34s %d" % (f, counts[f]))
        print("TOTAL %d copies in %d files" % (total, len(counts)))
        return 0
    if "--write-baseline" in argv:
        BASELINE.write_text(json.dumps({"total": total, "files": counts}, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        print("baseline written: %d copies in %d files" % (total, len(counts)))
        return 0
    base = json.loads(BASELINE.read_text(encoding="utf-8")) if BASELINE.exists() else {"total": total, "files": {}}
    errors = list(mismatches)
    for f, n in counts.items():
        if n > base["files"].get(f, 0):
            errors.append("%s: %d ladder copies, baseline %d (new copies must read OmegaCanon.authority)" % (f, n, base["files"].get(f, 0)))
    print("LADDER COPY CONTRACT: %d copies in %d files (baseline %d); %d disagree with the canon"
          % (total, len(counts), base["total"], len(mismatches)))
    for e in errors:
        print(" - " + e)
    if errors:
        print("LADDER COPY CONTRACT: FAIL")
        return 1
    print("LADDER COPY CONTRACT: PASS")
    return 0


if __name__ == "__main__":
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__)
        sys.exit(0)
    sys.exit(main(sys.argv[1:]))
