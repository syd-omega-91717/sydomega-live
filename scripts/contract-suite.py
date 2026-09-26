#!/usr/bin/env python3
"""Run every static contract gate in one process, and report all of them.

WHY THIS EXISTS

Two separate defects, one fix.

1. CI COULD NOT CONCLUDE. Twenty workflows targeted the single serial
   self-hosted Windows runner, eleven of them a full checkout for one short
   Python script. Every push queued twenty jobs behind one worker. Measured on
   2026-09-03: of the last thirty CI runs on `main` -- back to 2026-09-01 --
   *every one* concluded `cancelled`. Not one success, not one failure. The
   runner's own log reports a cancelled job as "completed with result: Failed",
   which is what a stack of red checks in the UI was actually showing.

   The gates were never the cost. Measured locally, the static gates run in
   well under a second combined (`--list` prints the current set); the eleven checkouts around them were the whole
   expense. Folding them into one job removes ten checkouts per commit.

2. THE LOCAL GATE DISAGREED WITH GITHUB. `content-uniqueness-contract` and
   `page-experience-contract` were blocking workflows on GitHub yet absent from
   `ci-local.sh`'s blocking list, so `./scripts/ci-local.sh` and the pre-push
   hook both reported green while `main` carried two genuinely failing gates.
   That is the same shape as CLAUDE.md section 8.4's "verify a 0 findings result
   is real": a clean report from a check that never ran.

   Hence one list, here, consumed by BOTH `.github/workflows/contracts.yml` and
   `scripts/ci-local.sh`. Adding a gate in one place adds it to both. A gate
   that exists on GitHub and not locally can no longer happen, because there is
   no second list to fall out of sync with.

WHY IT RUNS EVERY GATE INSTEAD OF STOPPING AT THE FIRST FAILURE

GitHub Actions stops a job at the first failing step, and
`workflow-contract-lint.py` forbids `continue-on-error: true` outright. On a
runner where a queued job can wait an hour, learning about one failure per hour
is the difference between fixing an afternoon's work in one pass and in six. So
every gate runs, and the exit code is set at the end.

WHAT IS DELIBERATELY NOT HERE

`page-overlap-audit.py` is advisory and O(n^2) over the page estate -- measured
at 2 to 5 minutes locally, which on this runner is longer than the static
gates put together by two orders of magnitude. It is scheduled, not per-push.

`supabase-runtime-contract.py` talks to the live Supabase project. Mixing a
network-dependent liveness probe into the static gates would make a transient
outage look like a source defect. It stays its own workflow.
"""

import hashlib
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# (id, what it protects, argv). Order is cheapest-first only for readability;
# every gate runs regardless, so the order carries no meaning.
GATES = [
    ('content-registry',
     'the canonical content registry matches the page estate',
     ['scripts/content-registry-contract.py']),
    ('content-uniqueness',
     'no two pages share a title or description',
     ['scripts/content-uniqueness-contract.py']),
    ('experience-principles',
     'every page honours the stated experience principles',
     ['scripts/experience-principles-contract.py']),
    ('page-estate-quality',
     'the page estate meets its quality floor',
     ['scripts/page-estate-quality.py']),
    ('page-count-claims',
     'every "N pages" claim in member-visible copy matches a real count',
     ['scripts/page-count-claims.py']),
    ('migration-drift',
     'supabase/migrations/ and the live migration history agree both ways',
     ['scripts/migration-drift.py']),
    ('page-experience',
     'every experience profile declares its required fields',
     ['scripts/page-experience-contract.py']),
    ('platform-principles',
     'the platform principles contract holds',
     ['scripts/platform-principles-contract.py']),
    ('production-surface',
     'the shipped surface matches what production expects',
     ['scripts/production-surface-contract.py']),
    ('repository-integrity',
     'repository structure and required files are intact',
     ['scripts/repository-integrity-contract.py']),
    ('user-journey',
     'every declared user journey resolves end to end',
     ['scripts/user-journey-contract.py']),
    ('workflow-contract-lint',
     'no workflow carries a forbidden production hazard',
     ['scripts/workflow-contract-lint.py']),
    ('absolute-asset',
     'every absolute URL on our own domain resolves to a committed file',
     ['scripts/absolute-asset-check.py']),
    ('shared-class',
     'markup never asks for a shared primitive no stylesheet defines',
     ['scripts/shared-class-check.py']),
    ('type-scale',
     'no page or module declares interface type below the 12px floor',
     ['scripts/type-scale.py', '--check']),
    ('intelligence-fabric',
     'the Ω Intelligence Fabric evidence matrix carries no failed or '
     'unresolved-critical point',
     ['scripts/omega_fabric_audit.py']),
    ('brand-glyph',
     'no symbol renders as a colour emoji against the monochrome palette',
     ['scripts/brand-glyph-check.py']),
    ('csp-inline-ratchet',
     "no file gains inline on*= handlers or inline <script> blocks -- the "
     "migration to a script-src without 'unsafe-inline' only moves one way",
     ['scripts/csp-inline-ratchet.py']),
]

INVENTORY_SCRIPT = 'scripts/build-content-registry.py'
INVENTORY_OUTPUT = 'config/page-estate.generated.json'


def _sha256(path):
    with open(path, 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()


def run_gate(argv):
    """Run one gate. Returns (returncode, combined output)."""
    proc = subprocess.run(
        [sys.executable] + argv,
        cwd=ROOT, capture_output=True, text=True,
        errors='replace',
    )
    return proc.returncode, (proc.stdout or '') + (proc.stderr or '')


def inventory_determinism():
    """Build the page-estate inventory twice; the bytes must not move.

    Lifted from page-estate-inventory.yml, which did this with two
    Get-FileHash calls in PowerShell. A non-deterministic generator is how a
    committed inventory silently stops describing the repo -- the same failure
    mode CLAUDE.md section 8.4 records for hand-typed counts.
    """
    rc, out = run_gate([INVENTORY_SCRIPT])
    if rc != 0:
        return rc, out
    target = os.path.join(ROOT, INVENTORY_OUTPUT)
    if not os.path.exists(target):
        return 1, out + '\n%s was not produced by %s\n' % (
            INVENTORY_OUTPUT, INVENTORY_SCRIPT)
    first = _sha256(target)
    rc2, out2 = run_gate([INVENTORY_SCRIPT])
    if rc2 != 0:
        return rc2, out + out2
    second = _sha256(target)
    if first != second:
        return 1, (out + out2 + '\n%s is not deterministic: %s then %s\n'
                   % (INVENTORY_OUTPUT, first[:16], second[:16]))
    return 0, out + '\ninventory deterministic across two builds (%s)\n' % first[:16]


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    if '--list' in argv:
        for gate_id, why, _ in GATES:
            print('%-24s %s' % (gate_id, why))
        print('%-24s %s' % ('page-estate-inventory',
                            'the generated inventory is byte-identical across builds'))
        return 0

    # GitHub renders ::group:: as a foldable section and ::error:: as an
    # annotation on the run. Locally both are just text, which is why they are
    # emitted unconditionally rather than sniffing for CI.
    on_ci = bool(os.environ.get('GITHUB_ACTIONS'))

    results = []
    jobs = list(GATES) + [
        ('page-estate-inventory',
         'the generated inventory is byte-identical across builds', None),
    ]

    for gate_id, why, gate_argv in jobs:
        started = time.time()
        if gate_argv is None:
            rc, out = inventory_determinism()
        else:
            rc, out = run_gate(gate_argv)
        elapsed = time.time() - started
        results.append((gate_id, rc, elapsed))

        if on_ci:
            print('::group::%s %s (%s)'
                  % ('PASS' if rc == 0 else 'FAIL', gate_id, why))
        else:
            print('--- %s %s' % ('PASS' if rc == 0 else 'FAIL', gate_id))
        print(out.rstrip())
        print('exit %d in %.2fs' % (rc, elapsed))
        if on_ci:
            print('::endgroup::')

    failed = [g for g, rc, _ in results if rc != 0]

    print()
    print('=' * 68)
    print('CONTRACT SUITE: %s' % ('FAIL' if failed else 'PASS'))
    print('=' * 68)
    for gate_id, rc, elapsed in results:
        print('  %-24s %-4s %6.2fs' % (gate_id, 'ok' if rc == 0 else 'FAIL', elapsed))
    print('  %d gate(s), %d failing' % (len(results), len(failed)))

    if failed:
        # One annotation per failing gate, so the run summary names them all
        # rather than only the step that happened to stop the job.
        for gate_id in failed:
            print('::error::contract gate failed: %s' % gate_id)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
