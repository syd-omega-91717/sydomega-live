#!/usr/bin/env python3
"""Find pages that overlap in PURPOSE (not just in boilerplate) and print the evidence. Advisory: it never changes a file.

Why this exists. scripts/page-overlap-audit.py compares the first 1,200 characters of each page's raw text including its inline CSS and JavaScript,
so shared boilerplate dominates the score. A first attempt at this analysis made the same mistake: it reported 316 candidate pairs, almost all of them
two pages that share the `profiles` table and the page chrome. Two corrections make the result usable:
  * words are weighted by TF-IDF across the whole estate, so text every page carries counts for nothing;
  * database tables that more than 12% of pages touch (today only `profiles`) are ignored when comparing what two pages read and write.
Score = 0.55 x text similarity + 0.25 x shared rare tables + 0.20 x title/heading similarity; pairs at or above --min (default 0.27) are listed.
A score is a prompt for a human decision, not a verdict: read docs/PAGE_CONSOLIDATION.md for the decisions made from it.

Usage:  python3 scripts/page-consolidation.py [--min 0.27]
"""
import collections
import glob
import math
import os
import re
import sys
from html.parser import HTMLParser

if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MIN = float(sys.argv[sys.argv.index("--min") + 1]) if "--min" in sys.argv else 0.27
STOP = set("the and for with your you are this that from have has not can all any its into onto per via our their was were will they them then than more most only also but out use used using page pages open close back home help sign log new one two see view set get".split())


class Page(HTMLParser):
    def __init__(self):
        super().__init__(); self.skip = 0; self.text = []; self.title = ""; self.h1 = ""; self._t = False; self._h = False; self.scripts = []; self.inline = []; self._in = False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("script", "style", "noscript", "svg"): self.skip += 1
        if tag == "script":
            if a.get("src"): self.scripts.append(a["src"])
            else: self._in = True
        if tag == "title": self._t = True
        if tag == "h1": self._h = True

    def handle_endtag(self, tag):
        if tag in ("script", "style", "noscript", "svg"): self.skip = max(0, self.skip - 1)
        if tag == "script": self._in = False
        if tag == "title": self._t = False
        if tag == "h1": self._h = False

    def handle_data(self, d):
        if self._t: self.title += d
        if self._in: self.inline.append(d)
        if self.skip: return
        if self._h: self.h1 += d
        self.text.append(d)


def toks(s):
    return [w for w in re.findall(r"[a-z]{4,}", s.lower()) if w not in STOP]


def load():
    nav = open(os.path.join(ROOT, "nav.js"), encoding="utf-8").read()
    rows = {}
    for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        n = os.path.basename(f)[:-5]
        try:
            p = Page(); p.feed(open(f, encoding="utf-8", errors="ignore").read())
        except Exception:
            continue
        code = " ".join(p.inline)
        for src in p.scripts:
            sp = os.path.join(ROOT, src.lstrip("/")) if src.startswith("/") and not src.startswith("//") else None
            if sp and os.path.isfile(sp) and os.path.basename(sp).startswith("omega-") and n.split("-")[0] in os.path.basename(sp):
                code += open(sp, encoding="utf-8", errors="ignore").read()
        tables = set(re.findall(r"\.from\(\s*['\"]([a-z_0-9]+)['\"]", code)) | set(re.findall(r"\.rpc\(\s*['\"]([a-z_0-9]+)['\"]", code))
        words = collections.Counter(toks(" ".join(p.text)))
        rows[n] = dict(title=re.sub(r"\s+", " ", p.title).strip(), h1=re.sub(r"\s+", " ", p.h1).strip(), tables=tables, words=words, nw=sum(words.values()),
                       menu=bool(re.search(r"\['%s'\s*," % re.escape(n), nav)), folded=bool(re.search(r"\['%s'\s*,\s*'[^']+'\s*,\s*'/%s\.html'\s*,\s*'folded'" % (re.escape(n), re.escape(n)), nav)))
    return rows


def cos(a, b):
    num = sum(a[k] * b.get(k, 0) for k in a); da = math.sqrt(sum(v * v for v in a.values())); db = math.sqrt(sum(v * v for v in b.values()))
    return num / (da * db) if da and db else 0.0


def jac(a, b):
    return len(a & b) / len(a | b) if a | b else 0.0


def main():
    rows = load(); N = len(rows)
    df = collections.Counter(); [df.update(set(r["words"])) for r in rows.values()]
    idf = {w: math.log(N / (1 + c)) for w, c in df.items()}
    for r in rows.values(): r["tfidf"] = {w: (1 + math.log(c)) * idf[w] for w, c in r["words"].items() if idf[w] > 1.2}
    tdf = collections.Counter(); [tdf.update(r["tables"]) for r in rows.values()]
    common = {t for t, c in tdf.items() if c >= N * 0.12}
    for r in rows.values(): r["rare"] = r["tables"] - common
    pairs = []; names = list(rows)
    for i, a in enumerate(names):
        for b in names[i + 1:]:
            A, B = rows[a], rows[b]
            if A["nw"] < 25 or B["nw"] < 25: continue
            t = cos(A["tfidf"], B["tfidf"]); tb = jac(A["rare"], B["rare"]) if A["rare"] and B["rare"] else 0.0
            ti = jac(set(toks(A["title"] + " " + A["h1"])), set(toks(B["title"] + " " + B["h1"])))
            s = 0.55 * t + 0.25 * tb + 0.2 * ti
            if s >= MIN: pairs.append((round(s, 3), a, b, round(t, 2), round(tb, 2), round(ti, 2)))
    pairs.sort(reverse=True)
    print("pages analysed: %d; ubiquitous tables ignored: %s; candidate pairs at >= %.2f: %d" % (N, sorted(common), MIN, len(pairs)))
    for s, a, b, t, tb, ti in pairs:
        print("%.3f  %-18s %-18s text=%.2f tables=%.2f titles=%.2f  words=%d/%d  menu=%s/%s" % (s, a, b, t, tb, ti, rows[a]["nw"], rows[b]["nw"],
              "folded" if rows[a]["folded"] else ("yes" if rows[a]["menu"] else "NO"), "folded" if rows[b]["folded"] else ("yes" if rows[b]["menu"] else "NO")))
    print("\npages with a menu entry missing (reachable only by a link):", ", ".join(n for n, r in rows.items() if not r["menu"] and r["nw"] >= 60 and n not in ("index",))[:600])
    print("thin pages (under 90 words of visible text) that read database tables:", ", ".join(n for n, r in rows.items() if r["nw"] < 90 and r["tables"]))


if __name__ == "__main__":
    main()
