#!/usr/bin/env python3
"""Run the Ω Intelligence Fabric against this repository and report the matrix.

WHAT THIS IS

`core/intelligence_fabric/` shipped as six well-typed, dependency-free
primitives -- an execution boundary, a policy firewall, a model router, a proof
engine, a skill registry and an evidence matrix. Every one of them was an empty
container: nothing in the repository ever constructed an `IntelligenceFabric`
with real agents, or an `EvidenceMatrix` with real points, so the fabric could
not observe anything. This script is the part that makes them real. It loads
the platform's actual state, drives it through those primitives, and prints the
resulting evidence matrix.

WHY IT REPLACED A FILE-EXISTENCE CHECK

The first version of this script asserted that nine files existed and parsed,
then printed `FABRIC_AUDIT=PASS files=9`. That is a syntax check wearing an
audit's name: it stayed green while the platform's front door returned 404 in
production. It also ran that whole job on `--help`, breaking the repo-wide
contract in CLAUDE.md 8.4 (`scripts/tests/test_script_help_contract.py` was
failing on `main` because of it). The structural check survives here as one
evidence point among many, which is the weight it deserves.

THE THREE PLANES, AND WHY THEY ARE SEPARATE

This repository already proves things in three different ways, and nothing
joined them:

  SOURCE  static gates over files on disk -- `scripts/contract-suite.py`
  RENDER  headless Chromium over real pages -- `scripts/verify-runtime.js`
  LIVE    the production Supabase project -- reachable from a session, but in
          CI only through the dated snapshots `supabase/live-schema.json` and
          `supabase/remote-migrations.json`

A capability can be green in source, green in render, and wrong live. Keeping
the planes labelled is the point: a SOURCE point never licenses a LIVE claim.

THE HONESTY RULE THIS GATE ENFORCES ON ITSELF

`UNVERIFIED` is a first-class outcome, not a failure to paper over. When no
browser is present, or no live database was reached, the matrix says so and the
gate still exits 0 -- because "not checked" is not "broken", and forcing it to
one or the other is how a green board stops meaning anything. The gate fails
only on FAILED, or on a `critical` point that is not VERIFIED.

SNAPSHOT AGE IS EVIDENCE

CLAUDE.md warns twice that a dated snapshot lies in both directions: on
2026-08-29 `live-schema.json` reported eight relations "absent live" and one had
existed all along. Nothing in the repository measured how old those snapshots
were. Two points here do, and they degrade to PARTIAL rather than failing --
staleness is a known-unknown, not a defect.

Usage: python3 scripts/omega_fabric_audit.py [--json] [--help]
"""
from __future__ import annotations

import sys

# CLAUDE.md 8.4: every scripts/*.py answers --help with its docstring and exits
# 0, before doing any work. The previous version of this file ran its whole job
# instead, which is the violation that turned test_script_help_contract red.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

import ast
import datetime as _dt
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from core.intelligence_fabric import (  # noqa: E402
    FabricRequest,
    IntelligenceFabric,
    PolicyFirewall,
    Risk,
    Skill,
    SkillRegistry,
)
from core.intelligence_fabric.evidence_matrix import (  # noqa: E402
    EvidenceMatrix,
    EvidencePoint,
    EvidenceState,
)

VERIFIED = EvidenceState.VERIFIED
PARTIAL = EvidenceState.PARTIAL
UNVERIFIED = EvidenceState.UNVERIFIED
FAILED = EvidenceState.FAILED

# A snapshot older than this is reported PARTIAL: still usable, no longer
# something to build a finding on without regenerating it first.
SNAPSHOT_FRESH_DAYS = 14

FABRIC_FILES = (
    "core/intelligence_fabric/__init__.py",
    "core/intelligence_fabric/fabric.py",
    "core/intelligence_fabric/model_router.py",
    "core/intelligence_fabric/policy_firewall.py",
    "core/intelligence_fabric/proof_engine.py",
    "core/intelligence_fabric/skill_registry.py",
    "core/intelligence_fabric/evidence_matrix.py",
    "tests/test_intelligence_fabric.py",
    "tests/test_evidence_matrix.py",
)


def _read_json(rel: str):
    """Parse a repo JSON file, or return the exception so a point can record it."""
    try:
        return json.loads((ROOT / rel).read_text(encoding="utf-8"))
    except Exception as exc:  # a missing or malformed source IS the finding
        return exc


def _age_days(captured) -> int | None:
    if not isinstance(captured, str):
        return None
    try:
        day = _dt.date.fromisoformat(captured[:10])
    except ValueError:
        return None
    return (_dt.date.today() - day).days


# ---------------------------------------------------------------- SOURCE plane


def point_front_door() -> EvidencePoint:
    """GET / must have a file to serve, not a rewrite that may not fire.

    On 2026-09-05 the production root answered 404 and served 404.html while
    the same response carried this repo's CSP and HSTS headers -- vercel.json
    was being read and its {"source":"/"} rewrite still did not apply. The
    filesystem is the only entry point that cannot silently stop working.
    """
    index = ROOT / "index.html"
    if not index.is_file():
        return EvidencePoint(
            "SRC-01", "source", "GET / resolves from the filesystem",
            FAILED, "no index.html at the repository root", critical=True)
    cfg = _read_json("vercel.json")
    if isinstance(cfg, Exception):
        return EvidencePoint(
            "SRC-01", "source", "GET / resolves from the filesystem",
            FAILED, "vercel.json does not parse: %s" % cfg, critical=True)
    rewrites = cfg.get("rewrites") or []
    if any(r.get("source") == "/" for r in rewrites if isinstance(r, dict)):
        return EvidencePoint(
            "SRC-01", "source", "GET / resolves from the filesystem",
            PARTIAL,
            "index.html exists but vercel.json still rewrites '/', which is "
            "the arrangement that returned 404 live",
            critical=True)
    return EvidencePoint(
        "SRC-01", "source", "GET / resolves from the filesystem",
        VERIFIED, "index.html present; no '/' rewrite to shadow it", critical=True)


def point_fabric_structure() -> EvidencePoint:
    """The fabric's own modules exist and parse -- the original gate's whole job."""
    for rel in FABRIC_FILES:
        path = ROOT / rel
        if not path.is_file():
            return EvidencePoint(
                "SRC-02", "source", "fabric modules present and parseable",
                FAILED, "missing %s" % rel, critical=True)
        try:
            ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
        except SyntaxError as exc:
            return EvidencePoint(
                "SRC-02", "source", "fabric modules present and parseable",
                FAILED, "syntax error in %s: %s" % (rel, exc), critical=True)
    return EvidencePoint(
        "SRC-02", "source", "fabric modules present and parseable",
        VERIFIED, "%d files parsed" % len(FABRIC_FILES), critical=True)


def point_capability_contracts() -> EvidencePoint:
    """Every capability carries all six contract fields, non-empty."""
    reg = _read_json("docs/capabilities/registry.json")
    if isinstance(reg, Exception):
        return EvidencePoint(
            "SRC-03", "source", "every capability carries a complete contract",
            FAILED, "registry.json does not parse: %s" % reg, critical=True)
    required = [k for k in (reg.get("contract_fields") or {}) if not k.startswith("_")]
    caps = reg.get("capabilities") or []
    incomplete = [
        c.get("id", "?") for c in caps
        if not all(str((c.get("contract") or {}).get(f, "")).strip() for f in required)
    ]
    if incomplete:
        return EvidencePoint(
            "SRC-03", "source", "every capability carries a complete contract",
            FAILED, "incomplete contract: %s" % ", ".join(sorted(incomplete)),
            critical=True)
    return EvidencePoint(
        "SRC-03", "source", "every capability carries a complete contract",
        VERIFIED, "%d capabilities x %d contract fields" % (len(caps), len(required)),
        critical=True)


def point_agent_binding(fabric: IntelligenceFabric) -> EvidencePoint:
    """Drive the real 12-agent roster through the fabric's execution boundary.

    This is the fabric doing its job rather than existing: every agent named in
    omega-agents.json must authorize inside its own domain and be refused
    outside it. A roster the boundary cannot bind is a roster the boundary does
    not actually govern.
    """
    if not fabric.agents:
        return EvidencePoint(
            "SRC-04", "source", "the agent roster binds to the execution boundary",
            FAILED, "omega-agents.json produced no agents", critical=True)
    for agent, tools in sorted(fabric.agents.items()):
        own = sorted(tools)[0]
        allowed = fabric.authorize(FabricRequest(agent, "audit", own))
        if not allowed.allowed:
            return EvidencePoint(
                "SRC-04", "source", "the agent roster binds to the execution boundary",
                FAILED, "%s refused its own tool %s: %s" % (agent, own, allowed.reason),
                critical=True)
        foreign = fabric.authorize(FabricRequest(agent, "audit", "tool.not.bound"))
        if foreign.allowed:
            return EvidencePoint(
                "SRC-04", "source", "the agent roster binds to the execution boundary",
                FAILED, "%s authorized a tool it does not own" % agent, critical=True)
    return EvidencePoint(
        "SRC-04", "source", "the agent roster binds to the execution boundary",
        VERIFIED, "%d agents bound, each refused a foreign tool" % len(fabric.agents),
        critical=True)


def point_policy_firewall() -> EvidencePoint:
    """Every irreversible operation demands human approval, and low risk does not."""
    fw = PolicyFirewall()
    for tool in sorted(PolicyFirewall.IRREVERSIBLE):
        if fw.evaluate(tool, Risk.LOW, human_approved=False).allowed:
            return EvidencePoint(
                "SRC-05", "source", "irreversible operations require human approval",
                FAILED, "%s allowed without approval" % tool, critical=True)
        if not fw.evaluate(tool, Risk.LOW, human_approved=True).allowed:
            return EvidencePoint(
                "SRC-05", "source", "irreversible operations require human approval",
                FAILED, "%s stayed blocked after approval" % tool, critical=True)
    if not fw.evaluate("read.report", Risk.LOW).allowed:
        return EvidencePoint(
            "SRC-05", "source", "irreversible operations require human approval",
            FAILED, "a read-only low-risk operation was blocked", critical=True)
    return EvidencePoint(
        "SRC-05", "source", "irreversible operations require human approval",
        VERIFIED, "%d irreversible tools gated; read path open"
        % len(PolicyFirewall.IRREVERSIBLE), critical=True)


# ---------------------------------------------------------------- RENDER plane


def point_render_entrypoints() -> EvidencePoint:
    """Capability entrypoints that scripts/verify-runtime.js renders.

    This gate never claims a render it did not perform. It reports how many
    entrypoints exist to be rendered, and leaves the verdict UNVERIFIED --
    `node scripts/verify-runtime.js` is the only thing that can promote it, and
    it needs a browser this process does not have.
    """
    reg = _read_json("docs/capabilities/registry.json")
    if isinstance(reg, Exception):
        return EvidencePoint(
            "RND-01", "render", "capability entrypoints render headless",
            FAILED, "registry.json does not parse: %s" % reg)
    pages, missing = set(), []
    for cap in reg.get("capabilities") or []:
        for entry in cap.get("entrypoints") or []:
            if entry.endswith(".html"):
                pages.add(entry)
                if not (ROOT / entry).is_file():
                    missing.append(entry)
    if missing:
        return EvidencePoint(
            "RND-01", "render", "capability entrypoints render headless",
            FAILED, "entrypoint file absent: %s" % ", ".join(sorted(missing)))
    return EvidencePoint(
        "RND-01", "render", "capability entrypoints render headless",
        UNVERIFIED,
        "%d page entrypoints on disk; run `node scripts/verify-runtime.js` "
        "with a browser to promote this point" % len(pages))


# ------------------------------------------------------------------ LIVE plane


def _snapshot_point(pid: str, rel: str, what: str) -> EvidencePoint:
    data = _read_json(rel)
    if isinstance(data, Exception):
        return EvidencePoint(pid, "live", what, FAILED,
                             "%s does not parse: %s" % (rel, data))
    age = _age_days(data.get("_captured"))
    if age is None:
        return EvidencePoint(pid, "live", what, UNVERIFIED,
                             "%s carries no usable _captured date" % rel)
    if age > SNAPSHOT_FRESH_DAYS:
        return EvidencePoint(
            pid, "live", what, PARTIAL,
            "%s captured %s, %d days old -- regenerate before building a "
            "finding on it" % (rel, data.get("_captured"), age))
    return EvidencePoint(pid, "live", what, VERIFIED,
                         "%s captured %s, %d days old"
                         % (rel, data.get("_captured"), age))


def point_live_verification_blocked() -> EvidencePoint:
    """How many capabilities still record no live check at all.

    `contract.live_verification` is required to start with BLOCKED when no
    production check was possible. Counting them is the only live-plane fact
    this process can establish without a database connection.
    """
    reg = _read_json("docs/capabilities/registry.json")
    if isinstance(reg, Exception):
        return EvidencePoint(
            "LIVE-03", "live", "capabilities carry a real live verification",
            FAILED, "registry.json does not parse: %s" % reg)
    caps = reg.get("capabilities") or []
    blocked = [c.get("id", "?") for c in caps
               if str((c.get("contract") or {}).get("live_verification", ""))
               .strip().upper().startswith("BLOCKED")]
    if blocked:
        return EvidencePoint(
            "LIVE-03", "live", "capabilities carry a real live verification",
            PARTIAL, "%d of %d still BLOCKED: %s"
            % (len(blocked), len(caps), ", ".join(sorted(blocked))))
    return EvidencePoint(
        "LIVE-03", "live", "capabilities carry a real live verification",
        VERIFIED, "%d capabilities, none BLOCKED" % len(caps))


# ---------------------------------------------------------------------- runner


def build_fabric() -> IntelligenceFabric:
    """Construct the execution boundary from the real 12-agent roster.

    Each agent's declared `domains` become the tools bound to it, namespaced so
    a domain string can never be confused with a tool from elsewhere. Nothing
    here is invented: if omega-agents.json is unreadable the fabric comes back
    empty and SRC-04 fails, which is the correct outcome.
    """
    roster = _read_json("omega-agents.json")
    agents: dict[str, set[str]] = {}
    if not isinstance(roster, Exception):
        for entry in (roster.get("agents") or []):
            name = str(entry.get("name", "")).strip()
            domains = [str(d).strip() for d in (entry.get("domains") or []) if str(d).strip()]
            if name and domains:
                agents[name] = {"domain.%s" % d for d in domains}
    return IntelligenceFabric(agents=agents)


def build_skill_registry(fabric: IntelligenceFabric) -> SkillRegistry:
    """One governed skill per agent domain, so the registry describes reality."""
    registry = SkillRegistry()
    for agent, tools in sorted(fabric.agents.items()):
        for tool in sorted(tools):
            registry.register(Skill(
                name="%s:%s" % (agent, tool.split(".", 1)[-1]),
                purpose="%s governs %s" % (agent, tool.split(".", 1)[-1]),
                tool=tool,
            ))
    return registry


def build_matrix() -> tuple[EvidenceMatrix, IntelligenceFabric, SkillRegistry]:
    fabric = build_fabric()
    registry = build_skill_registry(fabric)
    matrix = EvidenceMatrix()
    for point in (
        point_front_door(),
        point_fabric_structure(),
        point_capability_contracts(),
        point_agent_binding(fabric),
        point_policy_firewall(),
        point_render_entrypoints(),
        _snapshot_point("LIVE-01", "supabase/live-schema.json",
                        "the live schema snapshot is fresh enough to reason from"),
        _snapshot_point("LIVE-02", "supabase/remote-migrations.json",
                        "the migration history snapshot is fresh enough to reason from"),
        point_live_verification_blocked(),
    ):
        matrix.add(point)
    return matrix, fabric, registry


def main(argv: list[str]) -> int:
    matrix, fabric, registry = build_matrix()
    points = matrix.export()
    summary = matrix.summary()
    blockers = matrix.release_blockers()
    failed = [p for p in points if p["state"] == FAILED.value]

    verdict = "FAIL" if (failed or blockers) else "PASS"

    # --json emits machine-readable output and NOTHING else. It used to print
    # the JSON and then append the human FABRIC_AUDIT= line, so `| json.tool`
    # choked on trailing data; the verdict belongs inside the document.
    if "--json" in argv:
        print(json.dumps({
            "verdict": verdict,
            "summary": summary,
            "agents": len(fabric.agents),
            "skills": len(registry.inventory()),
            "failed": [p["point_id"] for p in failed],
            "release_blockers": [p.point_id for p in blockers],
            "points": points,
        }, indent=2))
        return 1 if verdict == "FAIL" else 0

    if True:
        print("Ω INTELLIGENCE FABRIC — evidence matrix")
        print("  boundary: %d agents, %d governed skills"
              % (len(fabric.agents), len(registry.inventory())))
        plane = None
        for p in points:
            if p["domain"] != plane:
                plane = p["domain"]
                print("\n  %s plane" % plane.upper())
            print("    %-9s %-8s %s" % (p["point_id"], p["state"], p["requirement"]))
            print("              %s" % p["evidence"])
        print("\n  " + " ".join("%s=%d" % (k, v) for k, v in summary.items() if v))

    if failed:
        print("\nFABRIC_AUDIT=FAIL failed=%s"
              % ",".join(p["point_id"] for p in failed))
        return 1
    if blockers:
        print("\nFABRIC_AUDIT=FAIL unresolved_critical=%s"
              % ",".join(p.point_id for p in blockers))
        return 1
    unverified = summary.get(UNVERIFIED.value, 0) + summary.get(PARTIAL.value, 0)
    print("\nFABRIC_AUDIT=PASS points=%d unverified_or_partial=%d"
          % (len(points), unverified))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
