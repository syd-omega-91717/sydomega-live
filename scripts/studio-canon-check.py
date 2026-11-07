#!/usr/bin/env python3
"""Validate the Studios canon registry and render the franchise bibles from it.

WHY THIS EXISTS

The Studios division promises one interconnected universe with no contradictory biographies, timelines or titles
(docs/studios/PLAN.md). config/omega-studio-registry.json is the single source for franchises, ages, characters and
the recorded conflicts. This script fails when:

  * an id is duplicated, malformed or points at nothing,
  * a status is outside the vocabulary, or a film claims more than CONCEPT without evidence in
    config/omega-studio-productions.json,
  * two characters share a name token (first or last name) and no recorded conflict names both of them,
  * a franchise maps from an id that is not in config/omega-franchise-slate.json,
  * a document under docs/studios writes the frequency as '9.17 Hz' instead of the canon 9.1717 Hz,
  * a generated bible differs from the registry (run with --write-bibles to refresh).

USAGE
    python3 scripts/studio-canon-check.py                 # validate; exit 1 on any finding
    python3 scripts/studio-canon-check.py --summary       # counts by franchise
    python3 scripts/studio-canon-check.py --write-bibles  # regenerate docs/studios/franchises/<id>/bible.md
"""
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
REG_PATH = ROOT / "config" / "omega-studio-registry.json"
SLATE_PATH = ROOT / "config" / "omega-franchise-slate.json"
PROD_PATH = ROOT / "config" / "omega-studio-productions.json"
BIBLE_DIR = ROOT / "docs" / "studios" / "franchises"
ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*(?:/[a-z0-9]+(?:-[a-z0-9]+)*)?$")
HONORIFICS = {"dr", "professor", "queen", "emperor", "commander", "princess", "admiral", "director", "the", "of", "and"}
BAD_FREQ = re.compile(r"9\.17\s?Hz", re.I)


def load(p):
    return json.loads(p.read_text(encoding="utf-8"))


def name_tokens(name):
    return {t for t in re.split(r"[^a-z0-9]+", name.lower()) if len(t) >= 3 and t not in HONORIFICS}


def validate(reg, slate, prod):
    errs = []
    ids = {}

    def reg_id(i, kind):
        if not ID.match(i):
            errs.append("malformed id %r (%s)" % (i, kind))
        if i in ids:
            errs.append("duplicate id %r (%s and %s)" % (i, ids[i], kind))
        ids[i] = kind

    vocab = set(reg["approvalStatuses"])
    for key in ("divisions", "principles", "ages"):
        for e in reg[key]:
            reg_id(e["id"], key)
    div_ids = {d["id"] for d in reg["divisions"]}
    age_ids = {a["id"] for a in reg["ages"]}
    slate_ids = {f["id"] for f in slate["franchises"]}
    prod_by_id = {p["id"]: p for p in prod["productions"]}
    for f in reg["franchises"]:
        reg_id(f["id"], "franchise")
        if f["division"] not in div_ids:
            errs.append("%s: unknown division %r" % (f["id"], f["division"]))
        if f["canonStatus"] not in vocab:
            errs.append("%s: status %r outside vocabulary" % (f["id"], f["canonStatus"]))
        for a in f["ages"]:
            if a not in age_ids:
                errs.append("%s: unknown age %r" % (f["id"], a))
        for m in f["mappedFrom"]:
            if m not in slate_ids:
                errs.append("%s: mappedFrom %r is not in omega-franchise-slate.json" % (f["id"], m))
        if not f["films"]:
            errs.append("%s: no films" % f["id"])
        for film in f["films"]:
            reg_id(film["id"], "film")
            if not film["id"].startswith(f["id"] + "/"):
                errs.append("%s: film id %r not under the franchise" % (f["id"], film["id"]))
            if film["status"] != "CONCEPT":
                p = prod_by_id.get(film.get("production", ""))
                if not p or p["status"] == "CONCEPT":
                    errs.append("%s claims %s with no production record" % (film["id"], film["status"]))
    chars = reg["characters"]
    fr_ids = {f["id"] for f in reg["franchises"]}
    for c in chars:
        reg_id(c["id"], "character")
        if c["franchise"] not in fr_ids:
            errs.append("%s: unknown franchise %r" % (c["id"], c["franchise"]))
        if c["canonStatus"] not in vocab:
            errs.append("%s: status %r outside vocabulary" % (c["id"], c["canonStatus"]))
    for c in reg["conflicts"]:
        for s in c["subjects"]:
            if s not in ids:
                errs.append("conflict %s names unknown subject %r" % (c["id"], s))
        if c["status"] not in ("OPEN", "PROPOSED_RESOLUTION", "RESOLVED"):
            errs.append("conflict %s has status %r" % (c["id"], c["status"]))
        if not c["resolution"].strip():
            errs.append("conflict %s has no resolution text" % c["id"])
    covered = [set(c["subjects"]) for c in reg["conflicts"]]
    by_token = {}
    for c in chars:
        for t in name_tokens(c["name"]):
            by_token.setdefault(t, []).append(c["id"])
    for tok, who in sorted(by_token.items()):
        for i in range(len(who)):
            for j in range(i + 1, len(who)):
                pair = {who[i], who[j]}
                if not any(pair <= s for s in covered):
                    errs.append("name token %r shared by %s and %s with no recorded conflict" % (tok, who[i], who[j]))
    for p in (ROOT / "docs" / "studios").rglob("*"):
        if p.is_file() and p.suffix in (".md", ".fountain"):
            for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
                if BAD_FREQ.search(line) and not re.search(r"9\.17\s?Hz.*9\.1717|9\.1717.*9\.17\s?Hz|brief says", line, re.I):
                    errs.append("%s:%d writes the frequency as 9.17 Hz (canon: 9.1717 Hz)" % (p.relative_to(ROOT), n))
    return errs


def render_bible(reg, f):
    chars = [c for c in reg["characters"] if c["franchise"] == f["id"]]
    ids = {f["id"]} | {x["id"] for x in f["films"]} | {c["id"] for c in chars}
    confl = [c for c in reg["conflicts"] if set(c["subjects"]) & ids]
    ages = {a["id"]: a for a in reg["ages"]}
    L = ["# %s — franchise bible (%s)" % (f["title"], reg["canonVersion"]), "",
         "> **Status: %s.** Generated from `config/omega-studio-registry.json` by `scripts/studio-canon-check.py --write-bibles`; edit the registry, not this file. Nothing here is released, filmed or playable." % f["canonStatus"], "",
         "**Division:** %s · **Genre:** %s" % (f["division"], f["genre"]), "", "## Premise", "", f["premise"], "",
         "## Where it sits in the chronology", ""]
    L += ["- **%s** (%s): %s" % (ages[a]["title"], a, ages[a]["summary"]) for a in f["ages"]]
    L += ["", "## Reconciliation with merged canon", "", f["reconciliation"], ""]
    if f["mappedFrom"]:
        L += ["Maps from merged slate entries: %s." % ", ".join("`%s`" % m for m in f["mappedFrom"]), ""]
    L += ["## Film slate", "", "| Film | Premise | Status |", "|---|---|---|"]
    L += ["| %s | %s | %s |" % (x["title"], x["premise"] or "not yet written", x["status"]) for x in f["films"]]
    s = f["series"]
    cnt = "%d seasons of %d episodes" % (s["seasons"], s["episodesPerSeason"]) if s["seasons"] else "season and episode counts not specified"
    L += ["", "## Series", "", "**%s** — %s. No episode script exists." % (s["title"], cnt), "",
          "## Game", "", "**%s** — %s. No playable build exists." % (f["game"]["title"], f["game"]["genre"]), "",
          "## Characters", "", "| Id | Name | Role | Canon status |", "|---|---|---|---|"]
    L += ["| `%s` | %s | %s | %s |" % (c["id"], c["name"], c["role"], c["canonStatus"]) for c in chars]
    L += ["", "## Recorded conflicts touching this franchise", ""]
    L += ["- **%s** (%s, %s): %s" % (c["id"], c["kind"], c["status"], c["resolution"]) for c in confl] or ["None."]
    L += [""]
    return "\n".join(L)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--summary", action="store_true", help="print counts by franchise")
    ap.add_argument("--write-bibles", action="store_true", help="regenerate the franchise bibles")
    args = ap.parse_args()
    reg, slate, prod = load(REG_PATH), load(SLATE_PATH), load(PROD_PATH)
    if args.write_bibles:
        for f in reg["franchises"]:
            d = BIBLE_DIR / f["id"]
            d.mkdir(parents=True, exist_ok=True)
            (d / "bible.md").write_text(render_bible(reg, f), encoding="utf-8")
        print("wrote %d bibles" % len(reg["franchises"]))
    errs = validate(reg, slate, prod)
    for f in reg["franchises"]:
        p = BIBLE_DIR / f["id"] / "bible.md"
        if not p.is_file():
            errs.append("missing bible %s (run --write-bibles)" % p.relative_to(ROOT))
        elif p.read_text(encoding="utf-8") != render_bible(reg, f):
            errs.append("%s is stale (run --write-bibles)" % p.relative_to(ROOT))
    if args.summary:
        for f in reg["franchises"]:
            n = sum(1 for c in reg["characters"] if c["franchise"] == f["id"])
            print("%-26s films %d  characters %2d  status %s" % (f["id"], len(f["films"]), n, f["canonStatus"]))
        print("open conflicts: %d of %d" % (sum(1 for c in reg["conflicts"] if c["status"] == "OPEN"), len(reg["conflicts"])))
    for e in errs:
        print("FINDING:", e)
    print("STUDIO CANON: %s (%d finding(s))" % ("FAIL" if errs else "PASS", len(errs)))
    return 1 if errs else 0


if __name__ == "__main__":
    sys.exit(main())
