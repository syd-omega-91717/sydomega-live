"""Validate the Ω capability provenance experience contract.

The provenance layer must reuse the World registry, expose evidence boundaries,
and remain explicit about what route reachability does not prove.
"""
import sys
from pathlib import Path

REQUIRED_DOC = Path("docs/OMEGA_CAPABILITY_PROVENANCE.md")
REQUIRED_FILES = [Path("omega-capability-provenance.js"), Path("world.html"), Path("omega-world-engine.js"), Path("omega-world-engine.css")]
REQUIRED_HTML = ['id="omega-capability-provenance"', 'omega-capability-provenance.js']
REQUIRED_DOC_MARKERS = ["route evidence state","freshness timestamp","authorization boundary","database-health boundary","business-correctness boundary","LIVE: directly observed from the current route check.","UNAVAILABLE: the required evidence is not available."]

def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0
    failures=[]
    for path in REQUIRED_FILES:
        if not path.exists(): failures.append(f"missing {path}")
    if not REQUIRED_DOC.exists(): failures.append(f"missing {REQUIRED_DOC}")
    else:
        doc=REQUIRED_DOC.read_text(encoding="utf-8")
        for marker in REQUIRED_DOC_MARKERS:
            if marker not in doc: failures.append(f"documentation marker missing: {marker}")
    if Path("world.html").exists():
        html=Path("world.html").read_text(encoding="utf-8")
        for marker in REQUIRED_HTML:
            if marker not in html: failures.append(f"world integration marker missing: {marker}")
    if failures:
        print("OMEGA CAPABILITY PROVENANCE CONTRACT: FAIL")
        for failure in failures: print(f"- {failure}")
        return 1
    print("OMEGA CAPABILITY PROVENANCE CONTRACT: PASS")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())