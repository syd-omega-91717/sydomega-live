#!/usr/bin/env python3
"""Validate the Studios Worlds layer: thrones, places, pantheons, the sky and the planets.

WHY THIS EXISTS

config/omega-studio-worlds.json is the single source for the fiction's kings (thrones), cities and other places,
pantheons, sky events and planets (docs/studios/PLAN.md promises one universe with no contradictory facts). It must add
no facts of its own: each entry cites the files it comes from, and a status is a claim that needs evidence. The first
draft of this layer guessed nine of the twelve Zodiac worlds and would have contradicted the merged canon
(docs/canon/zodiac-wars/BIBLE.md puts Athena on Ceres, Demeter on Pluto, Hestia on Saturn); this check exists so a
guess like that fails instead of shipping. It fails when:

  * an id is duplicated or malformed, or a reference (franchise, character, world, seat, age, production) points at nothing,
  * a status is outside the registry's vocabulary plus OPEN, or a non-OPEN entry cites no source,
  * a cited source file does not exist, or a named place/world is not named in any file it cites,
  * a REPO_CANON entry cites only files under docs/ (proposals), or a REPO_CANON world is not named together with its
    ruler in one cited platform file (e.g. media.html: 'Ares presses Mars'),
  * a FOUNDER_APPROVED entry has no approvedBy production, that production is not owner-approved, or a place is not
    named in that production's package; a non-approved entry carries approvedBy,
  * the twelve worlds do not map tracks 1-12 once each onto the canon module's gods in omega-canon.json,
  * an OPEN entry is not raised by an openQuestion (an unfilled slot must be visible, never silently empty),
  * the gated function's generated payload (supabase/functions/studio-canon/worlds-data.ts) differs from the config file,
  * a throne, place or pantheon reuses the name of a real-world king listed on kings.html (those stay on that page).

USAGE
    python3 scripts/studio-worlds-check.py             # validate; exit 1 on any finding
    python3 scripts/studio-worlds-check.py --summary   # counts by section and status
    python3 scripts/studio-worlds-check.py --print-characters   # the registry-derived table the data file must carry
    python3 scripts/studio-worlds-check.py --write-function-data  # regenerate the approval-gated function's payload
"""
import argparse
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
WORLDS_PATH = ROOT / "config" / "omega-studio-worlds.json"
REG_PATH = ROOT / "config" / "omega-studio-registry.json"
PROD_PATH = ROOT / "config" / "omega-studio-productions.json"
CANON_PATH = ROOT / "omega-canon.json"
KINGS_PAGE = ROOT / "kings.html"
FUNCTION_DATA = ROOT / "supabase" / "functions" / "studio-canon" / "worlds-data.ts"
ID = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
WORLD_KINDS = {"star", "planet", "moon", "dwarf", "asteroid"}
PLACE_KINDS = {"city", "chamber", "site", "citadel", "region", "colony", "foundry", "archive", "structure", "open"}
HOLDER_STATES = {"seated", "refused", "historical", "unknown", "claimant", "vacant"}
WORLD_BASES = {"canon", "proposed", "inferred"}
SECTIONS = ("worlds", "places", "thrones", "pantheons")


def load(p):
    return json.loads(pathlib.Path(p).read_text(encoding="utf-8"))


def read_text(rel):
    p = ROOT / rel
    return p.read_text(encoding="utf-8", errors="replace") if p.is_file() else None


def norm(s):
    return re.sub(r"[^a-z0-9]+", " ", str(s).lower()).strip()


def strip_article(s):
    return re.sub(r"^the\s+", "", norm(s))


def real_king_names(kings_html=None):
    """Names listed in kings.html's KINGS_DATA: the real-world rulers the fiction must not reuse."""
    html = kings_html if kings_html is not None else KINGS_PAGE.read_text(encoding="utf-8")
    block = re.search(r"var KINGS_DATA=\[(.*?)\n\];", html, re.S)
    return {norm(m) for m in re.findall(r"\{name:'([^']+)'", block.group(1))} if block else set()


def validate(w, reg, prod, canon, kings, read=read_text):
    errs = []
    vocab = set(reg["approvalStatuses"]) | {"OPEN"}
    if set(w.get("statuses", [])) != vocab:
        errs.append("statuses must equal the registry's approvalStatuses plus OPEN")
    chars = {c["id"]: c for c in reg["characters"]}
    franchises = {f["id"] for f in reg["franchises"]}
    ages = {a["id"] for a in reg["ages"]}
    prods = {p["id"]: p for p in prod["productions"]}
    tracks = {t["n"]: t for t in canon["tracks"]}
    elements = {e["n"]: e for e in canon["elements"]}

    ids = {}

    def reg_id(i, kind):
        if not isinstance(i, str) or not ID.match(i):
            errs.append("malformed id %r (%s)" % (i, kind))
            return
        if i in ids:
            errs.append("duplicate id %r (%s and %s)" % (i, ids[i], kind))
        ids[i] = kind

    cache = {}

    def src(rel):
        if rel not in cache:
            cache[rel] = read(rel)
        return cache[rel]

    def check_entry(e, kind):
        eid = e.get("id")
        reg_id(eid, kind)
        st = e.get("status")
        if st not in vocab:
            errs.append("%s: status %r outside vocabulary" % (eid, st))
        if e.get("franchise") is not None and e["franchise"] not in franchises:
            errs.append("%s: unknown franchise %r" % (eid, e["franchise"]))
        sources = e.get("sources", [])
        if st != "OPEN" and not sources:
            errs.append("%s: status %s needs at least one source" % (eid, st))
        if st == "OPEN" and sources:
            errs.append("%s: an OPEN slot must not cite sources (it has no canon yet)" % eid)
        texts = []
        for s in sources:
            t = src(s)
            if t is None:
                errs.append("%s: cited source %r does not exist" % (eid, s))
            else:
                texts.append((s, t))
        if st == "REPO_CANON" and not any(not s.startswith("docs/") for s in sources):
            errs.append("%s: REPO_CANON must cite a platform file outside docs/ (docs/ holds proposals, not repository canon)" % eid)
        if st == "FOUNDER_APPROVED":
            pid = e.get("approvedBy")
            p = prods.get(pid)
            if not p:
                errs.append("%s: FOUNDER_APPROVED needs approvedBy naming a production" % eid)
            elif not (p.get("approvedByOwner") and p.get("approvedOn")):
                errs.append("%s: production %r is not owner-approved" % (eid, pid))
        elif e.get("approvedBy"):
            errs.append("%s: approvedBy is only valid on a FOUNDER_APPROVED entry" % eid)
        return st, texts

    def named_in(e, texts):
        names = [e["name"]] + list(e.get("aliases", []))
        for _, t in texts:
            low = norm(t)
            for n in names:
                if strip_article(n) and re.search(r"\b%s\b" % re.escape(strip_article(n)), low):
                    return True
        return False

    # ----- worlds
    track_use = {}
    for e in w["worlds"]:
        st, texts = check_entry(e, "world")
        if e.get("kind") not in WORLD_KINDS:
            errs.append("%s: unknown world kind %r" % (e.get("id"), e.get("kind")))
        if not isinstance(e.get("ring"), int):
            errs.append("%s: ring must be an integer" % e.get("id"))
        if st != "OPEN" and not named_in(e, texts):
            errs.append("%s: %r is not named in any cited source" % (e.get("id"), e.get("name")))
        t = e.get("track")
        if t is not None:
            if t not in tracks:
                errs.append("%s: track %r is not 1-12" % (e["id"], t))
            else:
                track_use.setdefault(t, []).append(e["id"])
                if norm(tracks[t]["god"]) != norm(e.get("ruler")):
                    errs.append("%s: ruler %r is not the canon god %r for track %s" % (e["id"], e.get("ruler"), tracks[t]["god"], t))
                if not e.get("shadow"):
                    errs.append("%s: a ruled world needs its Shadow" % e["id"])
        elif e.get("ruler") or e.get("shadow"):
            errs.append("%s: a ruler or Shadow needs a track" % e.get("id"))
        if st == "REPO_CANON" and e.get("ruler"):
            platform = [(s, tx) for s, tx in texts if not s.startswith("docs/")]
            ok = any(re.search(r"\b%s\b.{0,40}\b%s\b" % (re.escape(norm(e["ruler"])), re.escape(strip_article(e["name"]))), norm(tx))
                     for _, tx in platform)
            if not ok:
                errs.append("%s: REPO_CANON, but no platform file (outside docs/) names %s and %s together" % (e["id"], e["ruler"], e["name"]))
    for n in range(1, 13):
        if len(track_use.get(n, [])) != 1:
            errs.append("track %d must be used by exactly one world (found %s)" % (n, track_use.get(n, [])))
    world_ids = {e["id"] for e in w["worlds"]}
    for e in w["worlds"]:
        if e.get("parent") is not None and e["parent"] not in world_ids:
            errs.append("%s: parent %r is not a world" % (e["id"], e["parent"]))
    if "earth" not in world_ids:
        errs.append("Earth must be a world")

    # ----- places
    place_ids = {e["id"] for e in w["places"]}
    for e in w["places"]:
        st, texts = check_entry(e, "place")
        if e.get("kind") not in PLACE_KINDS:
            errs.append("%s: unknown place kind %r" % (e.get("id"), e.get("kind")))
        if (e.get("kind") == "open") != (st == "OPEN"):
            errs.append("%s: kind 'open' and status OPEN go together" % e.get("id"))
        if st != "OPEN" and not named_in(e, texts):
            errs.append("%s: %r is not named in any cited source" % (e.get("id"), e.get("name")))
        wd = e.get("world")
        if wd is not None:
            if wd not in world_ids:
                errs.append("%s: world %r is not a world" % (e["id"], wd))
            if e.get("worldBasis") not in WORLD_BASES:
                errs.append("%s: a placed entry needs worldBasis canon|proposed|inferred" % e["id"])
        elif e.get("worldBasis"):
            errs.append("%s: worldBasis without a world" % e["id"])
        if st == "FOUNDER_APPROVED" and e.get("approvedBy") in prods:
            pkg = read(prods[e["approvedBy"]]["package"])
            if pkg is None or strip_article(e["name"]) not in norm(pkg):
                errs.append("%s: not named in the approved production's package" % e["id"])

    # ----- thrones
    for e in w["thrones"]:
        st, _ = check_entry(e, "throne")
        seat = e.get("seat")
        if seat is not None and seat not in place_ids:
            errs.append("%s: seat %r is not a place" % (e["id"], seat))
        if e.get("derive") not in (None, "worlds-with-track"):
            errs.append("%s: unknown derive rule %r" % (e["id"], e.get("derive")))
        if st == "OPEN" and e.get("holders"):
            errs.append("%s: an OPEN throne cannot have holders" % e["id"])
        for h in e.get("holders", []):
            if h.get("character") not in chars:
                errs.append("%s: holder %r is not in the character registry" % (e["id"], h.get("character")))
            if h.get("state") not in HOLDER_STATES:
                errs.append("%s: holder state %r unknown" % (e["id"], h.get("state")))

    # ----- pantheons
    for e in w["pantheons"]:
        check_entry(e, "pantheon")
        if e.get("derive") not in (None, "worlds-shadow"):
            errs.append("%s: unknown derive rule %r" % (e["id"], e.get("derive")))
        if not e.get("members"):
            errs.append("%s: a pantheon needs members" % e["id"])
        for m in e.get("members", []):
            keys = [k for k in ("character", "track", "element", "name") if k in m]
            if len(keys) != 1:
                errs.append("%s: each member has exactly one of character|track|element|name" % e["id"])
            elif keys[0] == "character" and m["character"] not in chars:
                errs.append("%s: member %r is not in the character registry" % (e["id"], m["character"]))
            elif keys[0] == "track" and m["track"] not in tracks:
                errs.append("%s: member track %r is not 1-12" % (e["id"], m["track"]))
            elif keys[0] == "element" and (m["element"] not in elements or elements[m["element"]]["type"] == "physical"):
                errs.append("%s: member element %r must be a non-physical canon element" % (e["id"], m["element"]))
    shadows = [x.get("shadow") for x in w["worlds"] if x.get("track")]
    if len(set(shadows)) != 12:
        errs.append("the twelve ruled worlds need twelve distinct Shadows")

    # ----- sky
    for e in w["sky"]["events"]:
        check_entry(e, "sky-event")
        if e.get("age") is not None and e["age"] not in ages:
            errs.append("%s: unknown age %r" % (e["id"], e["age"]))
    rg = w["sky"]["rings"]
    if len(rg["inscribed"]) != 7 or rg["blank"] != 2:
        errs.append("the ring wall is seven inscribed rings and two blank")
    if rg["status"] not in vocab or not all(src(s) is not None for s in rg["sources"]):
        errs.append("sky.rings: bad status or missing source")

    # ----- open questions: an unfilled slot must be raised
    qids, raised = set(), set()
    for q in w["openQuestions"]:
        reg_id(q["id"], "question")
        qids.add(q["id"])
        if not q.get("subjects"):
            errs.append("%s: a question needs subjects" % q["id"])
        for s in q.get("subjects", []):
            if s not in ids:
                errs.append("%s: subject %r does not exist" % (q["id"], s))
            raised.add(s)
    for sec in SECTIONS:
        for e in w[sec]:
            if e.get("status") == "OPEN" and e["id"] not in raised:
                errs.append("%s: OPEN but no openQuestion raises it" % e["id"])

    # ----- the shipped character table must equal the registry (the page does not fetch the registry itself)
    if w.get("characters") != character_table(w, reg):
        errs.append("characters table is out of sync with the registry; regenerate it with --print-characters")

    # ----- the fiction must not reuse a real-world king
    names = [(e["id"], e["name"]) for sec in SECTIONS for e in w[sec]]
    for t in w["thrones"]:
        names += [(t["id"], chars[h["character"]]["name"]) for h in t.get("holders", []) if h.get("character") in chars]
    for eid, n in names:
        if norm(n) in kings:
            errs.append("%s: %r is a real-world king; those stay on /kings.html" % (eid, n))
    return errs


def character_table(w, reg):
    """Name and status of every character a throne or pantheon references, read from the registry.

    The page ships only config/omega-studio-worlds.json: the registry holds unreleased plot reveals and stays internal.
    """
    chars = {c["id"]: c for c in reg["characters"]}
    ids = set()
    for t in w["thrones"]:
        ids.update(h["character"] for h in t.get("holders", []) if h.get("character") in chars)
    for p in w["pantheons"]:
        ids.update(m["character"] for m in p.get("members", []) if m.get("character") in chars)
    return {i: {"name": chars[i]["name"], "status": chars[i]["canonStatus"]} for i in sorted(ids)}


def render_function_data(w):
    """The approval-gated function ships the canon as a TypeScript module generated from the config file."""
    return ("// GENERATED by scripts/studio-worlds-check.py --write-function-data from config/omega-studio-worlds.json.\n"
            "// Do not edit by hand: the validator fails when this differs from its source.\n"
            "export const WORLDS = " + json.dumps(w, indent=2, ensure_ascii=False) + ";\n")


def summary(w):
    lines = []
    for sec in SECTIONS:
        by = {}
        for e in w[sec]:
            by[e["status"]] = by.get(e["status"], 0) + 1
        lines.append("%-10s %2d  %s" % (sec, len(w[sec]), ", ".join("%s=%d" % kv for kv in sorted(by.items()))))
    lines.append("sky events %2d  rings 7+%d blank" % (len(w["sky"]["events"]), w["sky"]["rings"]["blank"]))
    lines.append("open questions %d" % len(w["openQuestions"]))
    return "\n".join(lines)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--summary", action="store_true", help="print counts by section and status")
    ap.add_argument("--write-function-data", action="store_true", help="regenerate supabase/functions/studio-canon/worlds-data.ts")
    ap.add_argument("--print-characters", action="store_true", help="print the registry-derived character table to paste into the data file")
    args = ap.parse_args()
    w = load(WORLDS_PATH)
    if args.write_function_data:
        FUNCTION_DATA.write_text(render_function_data(w), encoding="utf-8")
        print("wrote", FUNCTION_DATA.relative_to(ROOT))
        return 0
    if args.print_characters:
        print(json.dumps(character_table(w, load(REG_PATH)), indent=2, ensure_ascii=False))
        return 0
    errs = validate(w, load(REG_PATH), load(PROD_PATH), load(CANON_PATH), real_king_names())
    if not FUNCTION_DATA.is_file() or FUNCTION_DATA.read_text(encoding="utf-8") != render_function_data(w):
        errs.append("supabase/functions/studio-canon/worlds-data.ts is stale; run --write-function-data")
    if args.summary:
        print(summary(w))
    for e in errs:
        print("FINDING:", e)
    if errs:
        print("%d finding(s)" % len(errs))
        return 1
    print("studio-worlds-check: OK (%d worlds, %d places, %d thrones, %d pantheons)" % tuple(len(w[s]) for s in SECTIONS))
    return 0


if __name__ == "__main__":
    sys.exit(main())
