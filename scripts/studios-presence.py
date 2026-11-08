#!/usr/bin/env python3
"""Check that every Studios item is present exactly once where it should be, and write the report of what exists and what remains.

"Present once and only once" is checked, not assumed. For the Studios program this verifies:
  * registry: ids, titles, names, script paths, series bibles and build pages are each listed once;
  * every playable build page (a franchise's game and each companion build): exactly one menu entry and one menu-map entry in nav.js,
    exactly one Help entry in omega-guide.js, exactly one row in the master status document, exactly one registry mention, its tests file exists;
  * every episode script and season bible on disk is claimed by exactly one series in the registry, and every claim exists on disk;
  * the universe bible lists every recorded conflict once and lists no conflict the registry does not have;
  * the owner-only library payload has one entry per franchise, unique document ids, and one teleplay per registered script.
It does not touch the 242-page navigation outside this scope: measured, each page appears once inside each menu flyout (the five pages
listed in two sections are marked `folded` in one of them, so they render once), and a section's icon and its flyout's first link going to
the same hub are two roles of one control, not two entries.

Usage:
  python3 scripts/studios-presence.py            # check; exit 1 on any finding or a stale report
  python3 scripts/studios-presence.py --write    # regenerate docs/studios/COMPLETENESS.md
  python3 scripts/studios-presence.py --summary  # print the totals only
"""
import collections
import importlib.util
import json
import pathlib
import re
import sys

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = pathlib.Path(__file__).resolve().parents[1]
REG = ROOT / "config" / "omega-studio-registry.json"
REPORT = ROOT / "docs" / "studios" / "COMPLETENESS.md"
STATUS_DOC = ROOT / "docs" / "studios" / "OMEGA_STUDIOS_MASTER_STATUS.md"
UNIVERSE_DOC = ROOT / "docs" / "studios" / "canon" / "OMEGA_STUDIOS_UNIVERSE_BIBLE.md"


def read(p):
    return (ROOT / p).read_text(encoding="utf-8")


def load_registry():
    return json.loads(REG.read_text(encoding="utf-8"))


def builds(reg):
    """Every playable build page: (franchise id, title, page file, tests file, status, kind)."""
    out = []
    for f in reg["franchises"]:
        g = f["game"]
        if g.get("build"):
            out.append((f["id"], g["title"], g["build"], g.get("tests"), g["status"], "game"))
        for c in g.get("companions", []):
            out.append((f["id"], c["title"], c["build"], c.get("tests"), c["status"], "companion"))
    return out


def dups(items):
    return sorted(k for k, v in collections.Counter(items).items() if v > 1)


def check(reg):
    errs = []

    def once(label, items):
        for d in dups(items):
            errs.append("%s listed more than once: %s" % (label, d))

    F = reg["franchises"]
    once("franchise id", [f["id"] for f in F]); once("franchise title", [f["title"] for f in F])
    once("film id", [m["id"] for f in F for m in f["films"]]); once("film title", [m["title"] for f in F for m in f["films"]])
    once("character id", [c["id"] for c in reg["characters"]]); once("character name", [c["name"] for c in reg["characters"]])
    once("conflict id", [c["id"] for c in reg["conflicts"]])
    once("series title", [f["series"]["title"] for f in F]); once("game title", [f["game"]["title"] for f in F] + [c["title"] for f in F for c in f["game"].get("companions", [])])
    once("episode script", [s for f in F for s in f["series"].get("scripts", [])])
    once("season bible", [f["series"]["bible"] for f in F if f["series"].get("bible")])
    bl = builds(reg); once("build page", [b[2] for b in bl])

    # every playable page: exactly one of each presence
    nav = read("nav.js"); guide = read("omega-guide.js"); status = STATUS_DOC.read_text(encoding="utf-8")
    regtext = REG.read_text(encoding="utf-8")
    for fid, title, page, tests, st, kind in bl:
        slug = page[:-5]
        if not (ROOT / page).is_file():
            errs.append("%s: build page %s does not exist" % (title, page)); continue
        if not tests or not (ROOT / tests).is_file():
            errs.append("%s: its tests file %r does not exist" % (title, tests))
        n_sub = len(re.findall(r"\['%s'\s*,\s*'[^']+'\s*,\s*'/%s'" % (re.escape(slug), re.escape(page)), nav))
        n_map = len(re.findall(r"(?<![A-Za-z0-9\-])'?%s'?\s*:\s*'[a-z]+'" % re.escape(slug), nav))
        n_help = len(re.findall(r"\['/%s'\s*," % re.escape(page), guide))
        n_stat = sum(1 for ln in status.splitlines() if ln.startswith("|") and ("`%s`" % page) in ln)
        n_reg = regtext.count('"%s"' % page)
        for what, n in (("menu entry in nav.js", n_sub), ("menu-map key in nav.js", n_map), ("Help entry in omega-guide.js", n_help), ("row in the master status document", n_stat), ("registry mention", n_reg)):
            if n != 1:
                errs.append("%s (%s): %d %s, expected exactly 1" % (title, page, n, what))

    # episode scripts and season bibles on disk vs claimed
    claimed = {s for f in F for s in f["series"].get("scripts", [])}
    on_disk = {str(p.relative_to(ROOT)) for p in (ROOT / "docs/studios/franchises").glob("*/series/*/season-*/episodes/*.fountain")}
    for p in sorted(on_disk - claimed): errs.append("episode script on disk but claimed by no series: %s" % p)
    for p in sorted(claimed - on_disk): errs.append("episode script claimed but not on disk: %s" % p)
    bibles = {f["series"]["bible"] for f in F if f["series"].get("bible")}
    bdisk = {str(p.relative_to(ROOT)) for p in (ROOT / "docs/studios/franchises").glob("*/series/*/season-*/BIBLE.md")}
    for p in sorted(bdisk - bibles): errs.append("season bible on disk but claimed by no series: %s" % p)
    for p in sorted(bibles - bdisk): errs.append("season bible claimed but not on disk: %s" % p)

    # universe bible: each conflict once, none extra
    inub = re.findall(r"^\|\s*(C-\d+)\s*\|", UNIVERSE_DOC.read_text(encoding="utf-8"), re.M)
    once("conflict row in the universe bible", inub)
    ids = {c["id"] for c in reg["conflicts"]}
    for x in sorted(ids - set(inub)): errs.append("conflict %s is in the registry but not in the universe bible" % x)
    for x in sorted(set(inub) - ids): errs.append("conflict %s is in the universe bible but not in the registry" % x)

    # library payload
    spec = importlib.util.spec_from_file_location("studio_library", ROOT / "scripts" / "studio-library.py")
    lib = importlib.util.module_from_spec(spec); spec.loader.exec_module(lib)
    pay = lib.build()
    once("franchise in the library", [f["id"] for f in pay["franchises"]])
    if len(pay["franchises"]) != len(F): errs.append("the library has %d franchises, the registry %d" % (len(pay["franchises"]), len(F)))
    tele = [k for k, d in pay["documents"].items() if d["kind"] == "teleplay"]
    if len(tele) != len(claimed): errs.append("the library has %d teleplays, the registry registers %d scripts" % (len(tele), len(claimed)))
    return errs


def totals(reg):
    F = reg["franchises"]; t = {}
    t["franchises"] = len(F)
    t["films"] = sum(len(f["films"]) for f in F)
    t["films_scripted"] = sum(1 for f in F for m in f["films"] if m["status"] in ("SCREENPLAY_DRAFT", "SCRIPT_DRAFT_SHORT", "SCRIPTS_DRAFT"))
    sized = [f for f in F if f["series"].get("seasons") and f["series"].get("episodesPerSeason")]
    t["episodes_declared"] = sum(f["series"]["seasons"] * f["series"]["episodesPerSeason"] for f in sized)
    t["series_unsized"] = [f["series"]["title"] for f in F if not (f["series"].get("seasons") and f["series"].get("episodesPerSeason"))]
    t["episodes_written"] = sum(len(f["series"].get("scripts", [])) for f in F)
    bl = builds(reg)
    t["games"] = len(F)
    t["builds"] = bl
    t["games_with_build"] = [f["game"]["title"] for f in F if f["game"].get("build")]
    t["games_without_build"] = [(f["game"]["title"], f["game"]["status"]) for f in F if not f["game"].get("build")]
    t["characters"] = len(reg["characters"])
    return t


def report(reg):
    t = totals(reg); F = reg["franchises"]
    L = ["# Studios completeness (generated)", "",
         "> Generated by `scripts/studios-presence.py --write` from `config/omega-studio-registry.json` and the files on disk; do not edit by hand. "
         "It says what exists and what remains, with no rounding up. Every item is a **proposal** unless the registry says FOUNDER_APPROVED; "
         "an episode script here is a short draft of about 1,000 to 1,300 words, not a 50-minute teleplay. Nothing is filmed, released, voiced or scored.", "",
         "## Totals", "",
         "| What | Exists | Declared or registered | Remains |", "|---|---|---|---|",
         "| Franchises | %d | %d | 0 |" % (t["franchises"], t["franchises"]),
         "| Films with a script (screenplay or short draft) | %d | %d | %d |" % (t["films_scripted"], t["films"], t["films"] - t["films_scripted"]),
         "| Series episodes written (short drafts) | %d | %d (series with a declared size) | %d |" % (t["episodes_written"], t["episodes_declared"], t["episodes_declared"] - t["episodes_written"]),
         "| Playable builds (games plus companions) | %d | %d games | %d games have no build |" % (len(t["builds"]), t["games"], len(t["games_without_build"])),
         "| Characters registered | %d | - | - |" % t["characters"], ""]
    if t["series_unsized"]:
        L += ["Series with no declared size (their remaining episodes cannot be counted): " + ", ".join(t["series_unsized"]) + ".", ""]
    L += ["## By franchise", "", "| Franchise | Films (scripted of all) | Series: written of declared | Game | Builds |", "|---|---|---|---|---|"]
    for f in F:
        s = f["series"]; sz = s["seasons"] * s["episodesPerSeason"] if s.get("seasons") and s.get("episodesPerSeason") else None
        sc = sum(1 for m in f["films"] if m["status"] in ("SCREENPLAY_DRAFT", "SCRIPT_DRAFT_SHORT", "SCRIPTS_DRAFT"))
        bs = [f["game"]["build"]] if f["game"].get("build") else []
        bs += [c["build"] for c in f["game"].get("companions", [])]
        L.append("| %s | %d of %d | %d of %s (%s) | %s: %s | %s |" % (f["title"], sc, len(f["films"]), len(s.get("scripts", [])), sz if sz else "not sized", s["title"], f["game"]["title"], f["game"]["status"], ", ".join("`%s`" % b for b in bs) or "none"))
    L += ["", "## What remains", "",
          "- **Films:** %d of %d have no script at all." % (t["films"] - t["films_scripted"], t["films"]),
          "- **Episodes:** %d of %d declared episodes are not written; the %d that exist are short drafts, so none of the %d is a finished teleplay." % (t["episodes_declared"] - t["episodes_written"], t["episodes_declared"], t["episodes_written"], t["episodes_declared"])]
    for title, st in t["games_without_build"]:
        L.append("- **Game with no build:** %s (%s)." % (title, st))
    L += ["- **Not built on purpose:** The Convergence series and films, because the registry says crossovers must be earned by the other six franchises first.",
          "- **Cannot be built in this repository:** footage, voice, music, finished art, multiplayer, a human playtest, and any release. These need people and tools outside the repository.", ""]
    return "\n".join(L)


def main():
    reg = load_registry()
    if "--write" in sys.argv:
        REPORT.write_text(report(reg), encoding="utf-8"); print("wrote %s" % REPORT.relative_to(ROOT)); return 0
    if "--summary" in sys.argv:
        t = totals(reg); print(json.dumps({k: v for k, v in t.items() if k != "builds"}, indent=1)); return 0
    errs = check(reg)
    if not REPORT.is_file() or REPORT.read_text(encoding="utf-8") != report(reg):
        errs.append("%s is stale or missing (run --write)" % REPORT.relative_to(ROOT))
    for e in errs: print("  - " + e)
    print("STUDIOS PRESENCE: %s (%d finding(s))" % ("PASS" if not errs else "FAIL", len(errs)))
    return 1 if errs else 0


if __name__ == "__main__":
    raise SystemExit(main())
