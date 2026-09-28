"""Validate the OMEGA agent tool governance boundary."""
import sys
from pathlib import Path
DOC=Path("docs/OMEGA_AGENT_TOOL_GOVERNANCE.md")
MARKERS=["AUTH → POLICY → VALIDATE INPUT → RATE LIMIT → TIMEOUT → EXECUTE → VALIDATE OUTPUT → AUDIT","Default-deny execution","PRIVILEGED","DESTRUCTIVE","no default secrets","existing 12 OMEGA agents"]
def main()->int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip()); return 0
    if not DOC.exists(): print("OMEGA AGENT TOOL CONTRACT: FAIL\n- missing governance document"); return 1
    s=DOC.read_text(encoding="utf-8"); bad=[m for m in MARKERS if m not in s]
    if bad:
        print("OMEGA AGENT TOOL CONTRACT: FAIL")
        for m in bad: print("- missing marker: "+m)
        return 1
    print("OMEGA AGENT TOOL CONTRACT: PASS")
    return 0
if __name__=="__main__": raise SystemExit(main())
