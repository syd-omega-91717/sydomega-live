#!/usr/bin/env python3
"""CI-parity contract: a script a PR workflow runs must also run in ci-local.sh.

WHY THIS EXISTS

`./scripts/ci-local.sh` and the pre-push hook report "ALL PASSED", and people
(and agents) believe it. FIXES_LOG 203a measured the failure: a node test ran
in ci.yml but not locally, so a change was green locally and red on GitHub.
Measured again on 2026-11-02: 27 scripts invoked by PR-triggered workflows
(ci.yml, contracts.yml, ...) were never run by ci-local.sh at all.

WHAT IT CHECKS

For every workflow that triggers on `pull_request`, take each repo script it
invokes (`python scripts/x.py`, `node scripts/x.js`, `bash scripts/x.sh`).
Each must be named in `scripts/ci-local.sh` or `scripts/contract-suite.py`
(directly, or as a bare stem, which is how ci-local's loops spell them), or be
listed in `config/ci-parity-exempt.json` with a reason.

An exemption is a statement that the script cannot run in a local checkout
(needs production, a database, a secret, a specific runner). It is not a place
to park a failing gate. A stale exemption -- one for a script no PR workflow
calls any more, or that ci-local now runs -- also fails, so the list cannot
rot into a second source of truth.

WHAT IT DOES NOT PROVE

It proves a script is named, not that it runs with the same arguments or
passes. Arguments are reviewed by hand; each mirrored gate is run once before
it is added.

Usage: python3 scripts/ci-parity-contract.py [--list]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WF = os.path.join(ROOT, '.github', 'workflows')
EXEMPT = os.path.join(ROOT, 'config', 'ci-parity-exempt.json')
INVOKE = re.compile(r'(?:python3?|node|bash|sh)\s+(?:\./)?scripts/([\w\-./]+\.(?:py|js|sh))')
QUOTED = re.compile(r"['\"]scripts/([\w\-./]+\.(?:py|js|sh))['\"]")


def triggers_on_pr(text):
    m = re.search(r'^on:\s*\n(.*?)(?=^\S)', text, re.S | re.M)
    block = m.group(1) if m else ''
    if not m:
        m2 = re.search(r'^on:\s*(.+)$', text, re.M)
        block = m2.group(1) if m2 else ''
    return 'pull_request' in block


def workflow_scripts():
    """{script path under scripts/: [workflow file, ...]} for PR-triggered workflows."""
    found = {}
    for name in sorted(os.listdir(WF)):
        if not name.endswith(('.yml', '.yaml')):
            continue
        text = open(os.path.join(WF, name), encoding='utf-8').read()
        if not triggers_on_pr(text):
            continue
        for rx in (INVOKE, QUOTED):
            for m in rx.finditer(text):
                path = m.group(1)
                if os.path.exists(os.path.join(ROOT, 'scripts', path)):
                    found.setdefault(path, set()).add(name)
    return found


def mirror_text():
    out = ''
    for f in ('scripts/ci-local.sh', 'scripts/contract-suite.py'):
        out += open(os.path.join(ROOT, f), encoding='utf-8').read()
    return out


def is_mirrored(path, text):
    base = os.path.basename(path)
    stem = os.path.splitext(base)[0]
    return base in text or re.search(r'(?<![\w-])' + re.escape(stem) + r'(?![\w-])', text) is not None


def main(argv):
    if '-h' in argv or '--help' in argv:
        print(__doc__)
        return 0
    scripts = workflow_scripts()
    text = mirror_text()
    exempt = json.load(open(EXEMPT, encoding='utf-8')) if os.path.exists(EXEMPT) else {}
    exempt = {k: v for k, v in exempt.items() if not k.startswith('_')}
    problems = []
    for path, wfs in sorted(scripts.items()):
        if is_mirrored(path, text):
            if path in exempt:
                problems.append('stale exemption (ci-local now runs it): %s' % path)
            continue
        if path in exempt:
            if not str(exempt[path]).strip():
                problems.append('exemption without a reason: %s' % path)
            continue
        problems.append('%s runs in %s but not in ci-local.sh / contract-suite.py'
                        % (path, ', '.join(sorted(wfs))))
    for path in sorted(exempt):
        if path not in scripts:
            problems.append('stale exemption (no PR workflow calls it): %s' % path)
    if '--list' in argv:
        for path, wfs in sorted(scripts.items()):
            tag = 'mirrored' if is_mirrored(path, text) else ('exempt' if path in exempt else 'MISSING')
            print('%-9s %s  [%s]' % (tag, path, ', '.join(sorted(wfs))))
        return 0
    if problems:
        print('CI-PARITY CONTRACT FAILED (%d):' % len(problems))
        for p in problems:
            print('  - ' + p)
        return 1
    print('CI-PARITY CONTRACT PASSED: %d PR-workflow scripts, %d mirrored, %d exempt'
          % (len(scripts), sum(1 for p in scripts if is_mirrored(p, text)), len(exempt)))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
