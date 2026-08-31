#!/usr/bin/env python3
"""Catch the failures that arrive on someone else's schedule, not ours.

WHY THIS EXISTS

Every other gate in scripts/ answers "is the code correct as written today".
None of them answer "will this same, unchanged code still work in six months".
That second class does not announce itself in a diff, is invisible to
node --check, audit.py, the capability registry and the runtime render, and
lands in production with no commit to blame. This repo already carries several:

  FLOATING DEPENDENCY -- 6 of the 11 Edge Functions imported
      https://esm.sh/@supabase/supabase-js@2
    with no minor/patch. esm.sh resolves that to whatever the newest 2.x is at
    *deploy* time, so two deploys of identical source can ship different
    libraries. The repo already knows this hurts: vendor/supabase-js.js exists
    precisely because a third-party CDN on the critical path took the whole
    platform down (see that file's header, and CLAUDE.md section 4).

  UNPINNED PAYMENT API -- supabase/functions/checkout/index.ts:57 and
    stripe-webhook/index.ts:238 call api.stripe.com with no Stripe-Version
    header. Stripe then applies the *account's* default version. That default
    moves when Stripe migrates the account or the owner clicks upgrade in a
    dashboard this repo cannot see -- request and response shapes change under
    code that never changed. This is real payment code (CLAUDE.md section 5),
    so the failure mode is charges, not cosmetics.
      Reported as a WARNING, not a finding, and deliberately: the correct
    value is the account's current default API version, readable only from the
    Stripe dashboard. Pinning a guessed version breaks checkout immediately
    instead of eventually, so this one needs a human with the dashboard open --
    it is the highest-severity item here and the one this script must not
    silently "fix".

  DEPRECATED RUNTIME IMPORT -- weekly-digest pulled `serve` from
    deno.land/std@0.168.0, a release line that is frozen and being retired in
    favour of JSR. Supabase's Edge Runtime has had Deno.serve built in for
    years, so the dependency bought nothing and could only ever break.

  ROTTING SNAPSHOT -- supabase/live-schema.json is what schema-dictionary.py
    checks every column name against, and it is a dated hand-captured file
    (_captured). Nothing failed when it went stale, and a stale snapshot
    re-opens the false positives its own README warns about -- while a schema
    change applied live and never re-captured makes the gate confidently wrong
    in the *other* direction. CLAUDE.md section 8.1 class 2 is the single most
    expensive recurring bug class here; this file is its only defence.

  SINGLE-RUNNER CI -- all five workflows are pinned to the identical
    [self-hosted, Windows, X64] label set. That is one physical machine. When
    it is offline every gate is unrunnable, jobs queue indefinitely, and
    nothing can be validated or merged. Not hypothetical: CLAUDE.md section
    8.2 records jobs draining one at a time on this runner already.

WHAT THIS DOES NOT DO, stated plainly. It reads the repository. It cannot
reach Stripe, esm.sh, npm or the live database, so it never confirms that a
pinned version still exists, that a Stripe version string is the account's
actual default, or that live-schema.json matches production. It proves a pin
is *present*, never that it is *right*. A green run here means no time-bomb of
a known shape is visible in source -- the same limit EVIDENCE_MATRIX.md states
about "BUILT" (CLAUDE.md section 8.4).

Findings block (exit 1). Warnings report and do not block (exit 0), because
they name decisions that are the owner's to make -- a second CI runner and an
enforced CSP both cost money or risk breakage, and this script does not get to
make that call.

Usage:
    python3 scripts/resilience-audit.py            # findings block, warnings report
    python3 scripts/resilience-audit.py --strict   # warnings block too
    python3 scripts/resilience-audit.py --help
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
import sys
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# How stale the live-schema snapshot may get before it stops being evidence.
# 90 days is deliberately generous: the schema moves in bursts here, and a
# gate that cries every fortnight gets ignored, which is worse than no gate.
SCHEMA_MAX_AGE_DAYS = 90

findings = []   # (where, what, why_it_breaks, how_to_fix)
warnings = []


def add(bucket, where, what, why, fix):
    bucket.append((where, what, why, fix))


def rel(p):
    return str(p.relative_to(ROOT)).replace("\\", "/")


# ---------------------------------------------------------------------------
# 1. Floating third-party pins in Edge Functions
# ---------------------------------------------------------------------------
# A remote ESM import is resolved at deploy time. Without a full version the
# same source deploys differently on different days.

IMPORT_RE = re.compile(r'from\s+["\'](https://[^"\']+)["\']')
# esm.sh/<pkg>@<ver> or deno.land/x/<mod>@<ver>
FULL_PIN_RE = re.compile(r"@(\d+\.\d+\.\d+)")


def check_edge_function_pins():
    fns = ROOT / "supabase" / "functions"
    if not fns.is_dir():
        return
    for ts in sorted(fns.rglob("*.ts")):
        for n, line in enumerate(ts.read_text(encoding="utf-8", errors="ignore").splitlines(), 1):
            m = IMPORT_RE.search(line)
            if not m:
                continue
            url = m.group(1)

            if "deno.land/std" in url:
                add(findings, "%s:%d" % (rel(ts), n),
                    "imports the frozen deno.land/std line (%s)" % url,
                    "deno.land/std is retired in favour of JSR; Supabase Edge "
                    "Runtime provides Deno.serve natively, so this dependency "
                    "can only break, never help.",
                    "Delete the import and call Deno.serve(...) directly.")
                continue

            if not FULL_PIN_RE.search(url.split("/")[-1]) and \
               not FULL_PIN_RE.search(url):
                add(findings, "%s:%d" % (rel(ts), n),
                    "floating dependency pin: %s" % url,
                    "Resolved at deploy time, so identical source can ship a "
                    "different library on a different day -- undiagnosable "
                    "from the repo.",
                    "Pin the full major.minor.patch. vendor/supabase-js.js is "
                    "2.112.4 and is the version this platform already proves "
                    "in production.")


# ---------------------------------------------------------------------------
# 2. Stripe calls with no pinned API version
# ---------------------------------------------------------------------------
# Stripe applies the ACCOUNT default when no Stripe-Version header is sent.
# That default is changed outside this repo.

def check_stripe_version_pin():
    fns = ROOT / "supabase" / "functions"
    if not fns.is_dir():
        return
    for ts in sorted(fns.rglob("*.ts")):
        text = ts.read_text(encoding="utf-8", errors="ignore")
        if "api.stripe.com" not in text:
            continue
        if "Stripe-Version" in text:
            continue
        lines = [str(i) for i, l in enumerate(text.splitlines(), 1)
                 if "api.stripe.com" in l]
        add(warnings, "%s:%s" % (rel(ts), ",".join(lines)),
            "calls the Stripe API with no Stripe-Version header  [HIGHEST SEVERITY]",
            "Stripe falls back to the account's default API version, which "
            "moves when Stripe migrates the account or someone clicks upgrade "
            "in the dashboard. Request and response shapes then change under "
            "code that never changed -- in payment code.",
            "Send Stripe-Version on every api.stripe.com request, set to the "
            "account's CURRENT default (Stripe Dashboard -> Developers -> API "
            "versions). Do not guess a version string: pinning to the wrong "
            "one breaks checkout immediately instead of eventually.")


# ---------------------------------------------------------------------------
# 3. live-schema.json staleness
# ---------------------------------------------------------------------------

def check_schema_snapshot_age():
    snap = ROOT / "supabase" / "live-schema.json"
    if not snap.is_file():
        add(findings, "supabase/live-schema.json", "missing",
            "schema-dictionary.py checks every client column name against "
            "this file. Without it the most expensive recurring bug class in "
            "this repo (CLAUDE.md 8.1 class 2) has no gate at all.",
            "Re-capture it from the live database.")
        return
    try:
        data = json.loads(snap.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        add(findings, "supabase/live-schema.json", "does not parse (%s)" % e,
            "An unparseable snapshot silently disables the column-name gate.",
            "Re-capture it from the live database.")
        return

    captured = data.get("_captured")
    if not captured:
        add(findings, "supabase/live-schema.json", "has no _captured date",
            "Without a capture date the snapshot cannot be known to be "
            "current, so it cannot be trusted as evidence.",
            "Add _captured (YYYY-MM-DD) when re-capturing.")
        return

    try:
        cap = datetime.strptime(str(captured), "%Y-%m-%d").date()
    except ValueError:
        add(findings, "supabase/live-schema.json",
            "_captured is not YYYY-MM-DD (%r)" % captured,
            "The staleness of the column-name gate cannot be measured.",
            "Write _captured as YYYY-MM-DD.")
        return

    age = (date.today() - cap).days
    if age > SCHEMA_MAX_AGE_DAYS:
        add(findings, "supabase/live-schema.json",
            "captured %s -- %d days old (limit %d)" % (cap, age, SCHEMA_MAX_AGE_DAYS),
            "A stale snapshot makes schema-dictionary.py confidently wrong in "
            "both directions: false positives on columns that now exist, and "
            "silence on columns that no longer do.",
            "Re-capture from live and commit, per supabase/live-schema.json's "
            "own README note.")
    else:
        print("  live-schema.json captured %s (%d days old, limit %d) -- OK"
              % (cap, age, SCHEMA_MAX_AGE_DAYS))


# ---------------------------------------------------------------------------
# 4. CI single point of failure  (warning: buying a second runner is a decision)
# ---------------------------------------------------------------------------

RUNS_ON_RE = re.compile(r"^\s*runs-on:\s*(.+?)\s*$", re.M)


def check_ci_runner_spof():
    wf = ROOT / ".github" / "workflows"
    if not wf.is_dir():
        return
    labels = {}
    for y in sorted(wf.glob("*.yml")):
        for m in RUNS_ON_RE.finditer(y.read_text(encoding="utf-8", errors="ignore")):
            labels.setdefault(m.group(1).strip(), []).append(y.name)
    if not labels:
        return
    if len(labels) == 1:
        only = next(iter(labels))
        if "self-hosted" in only:
            add(warnings, ".github/workflows/",
                "all %d workflows target the single label set %s"
                % (len(labels[only]), only),
                "That is one physical machine. While it is offline every gate "
                "is unrunnable, jobs queue indefinitely, and nothing can be "
                "validated or merged -- CI failure becomes total, not partial.",
                "Add a fallback lane so the gates can still run without that "
                "box: either a hosted-runner job for the checks that need no "
                "Windows (all of scripts/*.py are platform-independent), or a "
                "second self-hosted runner sharing the label set.")


# ---------------------------------------------------------------------------
# 5. CSP that reports nowhere  (warning: enforcing a CSP can break pages)
# ---------------------------------------------------------------------------

def check_csp_reporting():
    vj = ROOT / "vercel.json"
    if not vj.is_file():
        return
    text = vj.read_text(encoding="utf-8", errors="ignore")
    if "Content-Security-Policy-Report-Only" not in text:
        return
    if "report-uri" in text or "report-to" in text:
        return
    add(warnings, "vercel.json",
        "Content-Security-Policy-Report-Only is set with no report-uri/report-to",
        "Report-Only does not enforce, and with no reporting endpoint the "
        "violations go nowhere. The header currently costs bytes and buys "
        "nothing -- and reads, to a future session, as protection that is not "
        "happening (the same shape as OmegaGuardian's badge, CLAUDE.md 8.2).",
        "Either add a reporting endpoint and use the collected data to decide "
        "an enforceable policy, or promote the header to a real "
        "Content-Security-Policy once the inline-script surface allows it.")


# ---------------------------------------------------------------------------

def main():
    strict = "--strict" in sys.argv[1:]

    print("=" * 70)
    print("RESILIENCE AUDIT  --  failures that arrive on someone else's schedule")
    print("=" * 70)

    check_edge_function_pins()
    check_stripe_version_pin()
    check_schema_snapshot_age()
    check_ci_runner_spof()
    check_csp_reporting()

    def dump(title, items):
        print("\n%s (%d):\n" % (title, len(items)))
        for where, what, why, fix in items:
            print("  %s" % where)
            print("      %s" % what)
            print("      why it breaks: %s" % why)
            print("      fix: %s\n" % fix)

    if warnings:
        dump("WARNINGS -- owner decisions, not blocking", warnings)

    if findings:
        dump("FINDINGS -- blocking", findings)
        print("=" * 70)
        print("  RESILIENCE AUDIT FAILED: %d finding(s)" % len(findings))
        print("=" * 70)
        return 1

    if strict and warnings:
        print("=" * 70)
        print("  RESILIENCE AUDIT FAILED (--strict): %d warning(s)" % len(warnings))
        print("=" * 70)
        return 1

    print("\n  No time-bombs of a known shape visible in source.")
    print("""
  Scope, stated plainly: this reads the repository only. It never reached
  Stripe, esm.sh or the live database, so it proves a pin is PRESENT, never
  that it is RIGHT.""")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
