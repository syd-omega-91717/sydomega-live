#!/usr/bin/env python3
"""Check the i18n dictionary against the markup that actually uses it.

WHY THIS EXISTS

Nothing in CI ever looked at i18n, and three separate real defects lived in
that blind spot at once:

  1. A LANGUAGE PACK THAT SILENTLY LOST CONTENT. `i18n/nl.json`, `zh.json` and
     `hi.json` shipped 14 keys short of `T_EN` for weeks. One commit wrote the
     translations but left each file unparseable; the next "fixed" the parse
     error by restoring the pre-translation blobs, discarding the translations
     along with the corruption. Both commits were green.

  2. A KEY THE MARKUP ASKS FOR THAT THE DICTIONARY DOES NOT HAVE. `apply()`
     does `var entry=T[key]; if(entry){...}` -- no entry means the element is
     skipped in EVERY language, so it can never be translated. `feed.html`'s
     topbar sat like that, and 138 more references across four pages did too.
     Silent: the authored English still renders, so the page looks fine in the
     base language and only a non-English reader sees the gap.

  3. AN HTML ENTITY INSIDE A DICTIONARY VALUE. Every write path is textual --
     `setOwnText` assigns `nodeValue`, placeholders and alts are attributes --
     so `&mdash;` and `&#9670;` reach the screen as those literal characters,
     never as the punctuation intended. Verified in a real render: Arabic
     showed `... &mdash; ...` to the reader.

WHAT IS BLOCKING, AND WHY EACH ONE IS SAFE TO BLOCK ON

  A. every `i18n/*.json` parses                      -- defect 1
  B. every static `data-i18n` key resolves in `T_EN` -- defect 2
  C. no pack carries a key `T_EN` does not have      -- drift in the other
                                                        direction; the merge
                                                        loop is driven by
                                                        `T_EN`, so such a key
                                                        is dead weight
  D. no value in any source contains an HTML entity  -- defect 3

WHAT IS REPORTED BUT NOT BLOCKING

Per-pack translation coverage. A pack missing a key is not broken: the lookup
chain is `entry[lang] || entry['en'] || key`, so it falls back to English,
which is the designed behaviour for a translation still in progress. Blocking
on it would only create pressure to invent translations to get CI green.

Coverage still cannot silently regress: `scripts/omega-registry.py` records
each pack's key count in the generated census, and its `--check` gate fails on
drift. That is what makes defect 1 impossible to repeat -- a pack losing keys
changes a committed number.

USAGE
    python3 scripts/i18n-contract.py            # blocking checks + coverage
    python3 scripts/i18n-contract.py --report   # coverage only, always exit 0
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
I18N_JS = ROOT / "i18n.js"
PACK_DIR = ROOT / "i18n"

# One `&name;` / `&#123;` / `&#xAB;` reference. Deliberately requires the
# semicolon and a plausible body, so a bare ampersand in prose ("Q&A", "R&D")
# is not flagged -- only something that was clearly meant as markup.
ENTITY = re.compile(r"&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});")

# A static data-i18n attribute. Values built at runtime ('data-i18n="'+k+'"')
# are skipped rather than guessed at -- see _static_keys.
ATTR = re.compile(r"""data-i18n\s*=\s*(?:"([^"]*)"|'([^']*)')""")
DYNAMIC = re.compile(r"[+${}<>\\]|\bthis\b")


def load_t_en():
    """Keys and values of the inlined English dictionary in i18n.js."""
    src = I18N_JS.read_text(encoding="utf-8")
    m = re.search(r"var T_EN=\{(.*?)\n\};", src, re.S)
    if not m:
        raise SystemExit("i18n-contract: could not locate the T_EN block in i18n.js")
    body = m.group(1)
    pairs = re.findall(r'^"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"', body, re.M)
    declared = re.findall(r'^"([^"]+)"\s*:', body, re.M)
    if len(pairs) != len(declared):
        missed = set(declared) - {k for k, _ in pairs}
        raise SystemExit(
            "i18n-contract: %d T_EN entries are not plain string literals "
            "and cannot be checked: %s" % (len(missed), sorted(missed)[:5]))
    return dict(pairs)


def load_packs():
    """lang -> (dict or None, parse error or None). A bad pack is a finding."""
    packs = {}
    for path in sorted(PACK_DIR.glob("*.json")):
        try:
            packs[path.stem] = (json.loads(path.read_text(encoding="utf-8")), None)
        except Exception as exc:
            packs[path.stem] = (None, str(exc))
    return packs


def _static_keys(text):
    """Literal data-i18n values in one document, skipping runtime-built ones."""
    keys = []
    for quoted, single in ATTR.findall(text):
        val = quoted or single
        if not val or DYNAMIC.search(val):
            continue
        keys.append(val)
    return keys


def markup_keys():
    """key -> sorted list of pages referencing it."""
    used = {}
    for page in sorted(ROOT.glob("*.html")):
        for key in _static_keys(page.read_text(encoding="utf-8", errors="ignore")):
            used.setdefault(key, set()).add(page.name)
    return {k: sorted(v) for k, v in used.items()}


def main():
    report_only = "--report" in _sys.argv[1:]
    en = load_t_en()
    packs = load_packs()
    used = markup_keys()
    errors = []

    # A. packs parse
    for lang, (data, err) in sorted(packs.items()):
        if data is None:
            errors.append("i18n/%s.json does not parse as JSON: %s" % (lang, err))

    # B. every referenced key exists in the English dictionary
    missing = {k: v for k, v in used.items() if k not in en}
    for key, pages in sorted(missing.items()):
        errors.append(
            "data-i18n=\"%s\" has no T_EN entry, so it can never be translated "
            "(referenced by %s)" % (key, ", ".join(pages)))

    # C. no pack key the English dictionary lacks
    for lang, (data, _) in sorted(packs.items()):
        if data is None:
            continue
        for key in sorted(set(data) - set(en)):
            errors.append(
                "i18n/%s.json defines \"%s\", which T_EN does not -- the merge "
                "loop is driven by T_EN, so this string is never used" % (lang, key))

    # D. no HTML entities in any value
    sources = [("T_EN (i18n.js)", en)]
    sources += [("i18n/%s.json" % l, d) for l, (d, _) in sorted(packs.items()) if d]
    for name, data in sources:
        for key, val in sorted(data.items()):
            found = ENTITY.findall(val)
            if found:
                errors.append(
                    "%s: \"%s\" contains %s -- every write path is textual "
                    "(setOwnText assigns nodeValue; placeholder/alt are "
                    "attributes), so this reaches the reader literally"
                    % (name, key, ", ".join(sorted(set(found)))))

    print("=" * 70)
    print("I18N CONTRACT")
    print("=" * 70)
    print("T_EN entries: %d   packs: %d   keys referenced by markup: %d"
          % (len(en), len(packs), len(used)))
    print()
    print("Translation coverage (a gap falls back to English by design):")
    for lang, (data, err) in sorted(packs.items()):
        if data is None:
            print("  %-4s UNPARSEABLE" % lang)
            continue
        have = len(set(en) & set(data))
        pct = (100.0 * have / len(en)) if en else 0.0
        gap = len(en) - have
        print("  %-4s %5d / %d  %5.1f%%%s"
              % (lang, have, len(en), pct, ("   %d untranslated" % gap) if gap else ""))

    unused = sorted(set(en) - set(used))
    if unused:
        print("\n%d T_EN entries are not referenced by any static data-i18n "
              "attribute." % len(unused))
        print("  Not an error: pages also translate through OmegaI18n.t() at "
              "runtime. Listed for pruning decisions only.")

    if errors:
        print("\nFOUND %d PROBLEM(S):\n" % len(errors))
        for e in errors:
            print("  - %s" % e)
        print("=" * 70)
        return 0 if report_only else 1

    print("\n  No i18n contract violations.")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    _sys.exit(main())
