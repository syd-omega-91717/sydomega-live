#!/usr/bin/env python3
"""Refuse a shared-primitive class that no stylesheet defines.

WHY THIS EXISTS

`bg.js` injects the design system's layout primitives once, for every page
(CLAUDE.md sections 3 and 4). A page that misspells one gets **no error, no
warning, and no styling** -- the markup is valid, the class simply matches
nothing, and the page renders as though the rule had never been written.

That shipped on the front door. `enter.html` wrote:

    <div class="tab-pane active" id="tab-gateway">

while `bg.js` defines `.tab-panel` -- one letter longer:

    .tab-panel,.tab-panels>.tab-panel{display:none}
    .tab-panel.active,.tab-panel.on,.tab-panel.act{display:block}

So `display:none` never applied and **all four tab panes rendered stacked**, on
the page `/` rewrites to. The tab bar was decorative: clicking it toggled an
`active` class that changed nothing visible. Measured in a render before the
fix: `{"total":4,"visible":4}`; after: exactly one visible per tab.

TWO MEASUREMENT ERRORS THIS CHECK EXISTS TO PREVENT REPEATING

1. A repo-wide `grep 'class="tab-pane'` reported **159 pages**. The real number
   was **1**. `tab-pane` is a prefix of `tab-panel`, so the grep matched every
   correct page too -- CLAUDE.md 8.4's "a repo-wide grep is a candidate
   generator, not a verdict", overcounting six-fold. Only a render settled it.

2. The FIRST version of this script reported 0 findings against the broken file.
   It collected "locally defined" classes from the whole page source, so the
   page's own `document.querySelectorAll('.tab-pane')` counted as a definition
   and masked the bug. A selector in JavaScript is a USE, not a definition. Only
   `<style>` blocks define. That is why `local_definitions()` below parses style
   blocks and nothing else, and why this docstring says so: a gate that cannot
   catch the bug it was written for is worse than no gate, because its green
   result is read as evidence.

SCOPE, deliberately narrow

Only class tokens beginning with a shared-primitive prefix are checked. A
page-local class nobody else uses is that page's business; a token that *looks*
like it is asking for a platform primitive, and gets nothing, is a defect.
Validated at 0 false positives across the estate -- widen PREFIXES only with the
same before/after evidence.

Class attributes containing a quote or `+` are skipped: those are JavaScript
template fragments (`class="card'+(mine?' mine':'')+'"`), not markup.

Findings are BLOCKING: the failure mode is silent and visual, which is exactly
the kind CI has to catch because a diff review will not.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Prefixes of the shared layout primitives CLAUDE.md section 4 enumerates.
PREFIXES = ('tab-', 'kpi', 'card', 'glass', 'bar-', 'chip', 'tbl-', 'btn')

# Where the platform's shared classes are actually defined.
GLOBAL_SOURCES = ('bg.js', 'nav.js')

CLASS_TOKEN = re.compile(r'\.([A-Za-z][A-Za-z0-9_-]+)')
STYLE_BLOCK = re.compile(r'<style[^>]*>(.*?)</style>', re.S | re.I)
CLASS_ATTR = re.compile(r'class="([^"]+)"')


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8', errors='ignore') as fh:
        return fh.read()


def global_definitions():
    """Every class token defined by bg.js, nav.js and any root .css file."""
    out = set()
    sources = list(GLOBAL_SOURCES) + sorted(
        f for f in os.listdir(ROOT) if f.endswith('.css'))
    for name in sources:
        if os.path.isfile(os.path.join(ROOT, name)):
            out |= set(CLASS_TOKEN.findall(read(name)))
    return out


def local_definitions(src):
    """Classes this page defines ITSELF -- <style> blocks only.

    Emphatically not the whole file: `querySelectorAll('.tab-pane')` is a use of
    a class, and treating it as a definition is what made the first version of
    this script blind to the defect it exists for.
    """
    return set(CLASS_TOKEN.findall(' '.join(STYLE_BLOCK.findall(src))))


def used_classes(src):
    out = set()
    for value in CLASS_ATTR.findall(src):
        # A JS template fragment, not markup: class="card'+(mine?' x':'')+'"
        if "'" in value or '"' in value or '+' in value:
            continue
        out |= set(value.split())
    return out


def pages():
    return sorted(f for f in os.listdir(ROOT)
                  if f.endswith('.html') and os.path.isfile(os.path.join(ROOT, f)))


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    defined = global_definitions()
    findings = {}

    for name in pages():
        src = read(name)
        local = local_definitions(src)
        for token in used_classes(src):
            if not token.startswith(PREFIXES):
                continue
            if token in defined or token in local:
                continue
            findings.setdefault(token, []).append(name)

    print('=' * 68)
    print('SHARED CLASS CONTRACT')
    print('=' * 68)
    print('  %d page(s), %d global class token(s) available'
          % (len(pages()), len(defined)))
    print()

    if not findings:
        print('  OK -- every shared-primitive class used in markup is defined.')
        return 0

    print('  UNDEFINED -- markup asks for a shared primitive that does not')
    print('  exist, so it renders with no styling and no error (BLOCKING)')
    for token, refs in sorted(findings.items(), key=lambda kv: -len(kv[1])):
        print('    .%s' % token)
        print('      %d page(s): %s%s'
              % (len(refs), ', '.join(refs[:6]), ' ...' if len(refs) > 6 else ''))
    print()
    print('  Fix: use the class bg.js actually defines (check the injected')
    print('  stylesheet), or define it in that page\'s own <style> block.')
    print()
    print('  %d undefined shared class(es) -- BLOCKING.' % len(findings))
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
