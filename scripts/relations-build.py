#!/usr/bin/env python3
"""Build config/omega-relations.json: the relations between workspace hubs, each with its evidence.

The one-shell map (omega-one-shell.js) draws a line between two hubs ONLY if this file lists it. An edge is evidence, never design:

  shared_pages      a page listed in both hubs' WORKSPACES (omega-single-page-workspaces.js)
  shared_relations  a Supabase table/RPC that a page in each hub reads or writes (.from('t') / .rpc('f') in the page's own HTML
                    or in a local <script src> it loads)

Plumbing is left out so it cannot connect everything to everything: `profiles`, and any relation touched by more than
PLUMBING_SHARE of the pages that touch the database at all. They are listed under "excluded" so the omission is visible.
A regex over source is a candidate list, not a verdict (CLAUDE.md 8.4): an edge says "these hubs touch the same
data", not "one feeds the other".

Usage:
  python3 scripts/relations-build.py            write config/omega-relations.json
  python3 scripts/relations-build.py --check    exit 1 if the committed file differs from a fresh build
  python3 scripts/relations-build.py --summary  print the edge list, write nothing
"""
import json
import re
import sys
from collections import defaultdict
from itertools import combinations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "config" / "omega-relations.json"
WORKSPACES_JS = ROOT / "omega-single-page-workspaces.js"
PLUMBING_SHARE = 0.25

FROM_RE = re.compile(r"""\.from\(\s*['"]([a-z0-9_]+)['"]\s*\)""")
RPC_RE = re.compile(r"""\.rpc\(\s*['"]([a-z0-9_]+)['"]""")
SRC_RE = re.compile(r"""<script[^>]+src=["']/?([A-Za-z0-9_./-]+\.js)(?:\?[^"']*)?["']""")


def workspaces():
    """{hub: [page,...]} from the WORKSPACES literal. Hub key is the hub page's slug ('/life.html' -> 'life')."""
    text = WORKSPACES_JS.read_text(encoding="utf-8")
    body = text[text.index("var WORKSPACES={"):]
    body = body[:body.index("};")]
    out = {}
    for m in re.finditer(r"'/([a-z0-9-]+)\.html':\[([^\]]*)\]", body):
        out[m.group(1)] = re.findall(r"'([a-z0-9-]+)'", m.group(2))
    if len(out) < 10:
        raise SystemExit("could not parse WORKSPACES (found %d hubs)" % len(out))
    return out


def relations_of(slug):
    """The set of tables and RPCs a page touches: its own HTML plus the local scripts it loads by <script src>."""
    f = ROOT / (slug + ".html")
    if not f.exists():
        return set()
    html = f.read_text(encoding="utf-8", errors="replace")
    blobs = [html]
    for src in SRC_RE.findall(html):
        p = ROOT / src
        if p.is_file() and p.suffix == ".js":
            blobs.append(p.read_text(encoding="utf-8", errors="replace"))
    found = set()
    for b in blobs:
        found.update("table:" + t for t in FROM_RE.findall(b))
        found.update("rpc:" + r for r in RPC_RE.findall(b))
    return found


def build():
    hubs = workspaces()
    members = {h: sorted(set([h] + pages)) for h, pages in hubs.items()}
    page_rel = {p: relations_of(p) for p in sorted({p for ps in members.values() for p in ps})}

    touching = [p for p, r in page_rel.items() if r]
    use = defaultdict(int)
    for p in touching:
        for r in page_rel[p]:
            use[r] += 1
    plumbing = sorted(r for r, n in use.items() if r == "table:profiles" or n > PLUMBING_SHARE * len(touching))

    hub_rel = {h: set().union(*[page_rel[p] for p in members[h]]) - set(plumbing) for h in hubs}
    edges = []
    for a, b in combinations(sorted(hubs), 2):
        shared_pages = sorted((set(members[a]) & set(members[b])) - {a, b})
        shared_rel = sorted(hub_rel[a] & hub_rel[b])
        if shared_pages or shared_rel:
            edges.append({"a": a, "b": b, "weight": len(shared_pages) * 3 + len(shared_rel),
                          "shared_pages": shared_pages, "shared_relations": shared_rel})
    edges.sort(key=lambda e: (-e["weight"], e["a"], e["b"]))
    return {
        "schema": 1,
        "about": "Evidence for every line the one-shell map draws. See scripts/relations-build.py for what counts as an edge and what is excluded.",
        "hubs": sorted(hubs),
        "excluded": {"plumbing_relations": plumbing, "rule": "profiles, plus any relation touched by >%d%% of pages that use the database" % int(PLUMBING_SHARE * 100)},
        "edges": edges,
    }


def render(doc):
    return json.dumps(doc, indent=1, sort_keys=False) + "\n"


def main(argv):
    if "--help" in argv or "-h" in argv:
        print(__doc__)
        return 0
    doc = build()
    text = render(doc)
    if "--summary" in argv:
        print("%d hubs, %d edges, plumbing excluded: %s" % (len(doc["hubs"]), len(doc["edges"]), ", ".join(doc["excluded"]["plumbing_relations"]) or "none"))
        for e in doc["edges"][:25]:
            print("  %-10s %-10s w=%-3d pages=%s rel=%s" % (e["a"], e["b"], e["weight"], ",".join(e["shared_pages"]) or "-", ",".join(r.split(":")[1] for r in e["shared_relations"]) or "-"))
        return 0
    if "--check" in argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != text:
            print("FAIL  config/omega-relations.json is out of date. Run: python3 scripts/relations-build.py")
            return 1
        print("OK    config/omega-relations.json matches the source (%d edges)" % len(doc["edges"]))
        return 0
    OUT.write_text(text, encoding="utf-8")
    print("wrote %s: %d hubs, %d edges" % (OUT.relative_to(ROOT), len(doc["hubs"]), len(doc["edges"])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
