#!/usr/bin/env python3
"""Deterministic page-action/task audit for the Ω platform estate.

This scanner inventories executable page controls without treating DOM
presence as proof of functionality. Every executable control is classified
only from explicit source evidence:
  GOVERNED                  explicit data-omega-task-id or capability marker
  AVAILABLE_WITHOUT_MUTATION read-only navigation/form evidence
  UNAVAILABLE              disabled control with an explicit reason
  UNMAPPED                 executable control with no governing marker

Use --write to emit config/omega-page-action-audit.json.
Use --check to validate the generated/current audit structure.
"""

import argparse
import json
import re
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VALID = {"GOVERNED","AVAILABLE_WITHOUT_MUTATION","UNAVAILABLE","UNMAPPED"}
PURE_NAVIGATION_PATTERNS = (
    re.compile(r"""^\\s*(?:window\\.)?location\\.(?:href|assign|replace)\\s*=\\s*['"]([^'"]+)['"]\\s*;?\\s*$""", re.I),
    re.compile(r"""^\\s*(?:window\\.)?open\\s*\\(\\s*['"]([^'"]+)['"][^)]*\\)\\s*;?\\s*$""", re.I),
)

def pure_navigation_target(handler):
    if not handler:
        return None
    for pattern in PURE_NAVIGATION_PATTERNS:
        match = pattern.match(handler)
        if match and match.group(1).lower().split("#", 1)[0].endswith(".html"):
            return match.group(1)
    return None

class ActionParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.actions=[]
        self._form_depth=0
        self._index=0

    def _record(self, kind, attrs, reason=None):
        a=dict(attrs)
        executable = (
            kind in {"button","form","submit","file_input"} or
            "onclick" in a or "onsubmit" in a or
            (a.get("href","").lower().startswith("javascript:")) or
            a.get("download") is not None
        )
        if not executable:
            return
        self._index += 1
        task=a.get("data-omega-task-id")
        capability=a.get("data-omega-capability-id")
        disabled=("disabled" in a or a.get("aria-disabled","").lower()=="true")
        unavailable_reason=a.get("data-omega-unavailable-reason","").strip()
        navigation_target = pure_navigation_target(a.get("onclick","")) or pure_navigation_target(a.get("onsubmit",""))
        if disabled and unavailable_reason:
            state="UNAVAILABLE"
        elif task or capability:
            state="GOVERNED"
        elif navigation_target:
            state="AVAILABLE_WITHOUT_MUTATION"
        elif kind in {"a"} and a.get("href","").lower().startswith("javascript:"):
            state="UNMAPPED"
        elif kind=="form" and a.get("method","get").lower()=="get" and not a.get("onsubmit"):
            state="AVAILABLE_WITHOUT_MUTATION"
        else:
            state="UNMAPPED"
        self.actions.append({
            "action_id": self._index,
            "kind": kind,
            "state": state,
            "task_id": task,
            "capability_id": capability,
            "explicit_unavailable_reason": unavailable_reason or None,
            "evidence": {
                "disabled": disabled,
                "onclick": "onclick" in a,
                "onsubmit": "onsubmit" in a,
                "javascript_href": a.get("href","").lower().startswith("javascript:"),
                "navigation_target": navigation_target,
                "download": a.get("download") is not None,
                "data_task_marker": bool(task),
                "data_capability_marker": bool(capability),
            },
        })

    def handle_starttag(self, tag, attrs):
        t=tag.lower()
        if t=="form":
            self._form_depth += 1
            self._record("form", attrs)
        elif t=="button":
            self._record("button", attrs)
        elif t=="input":
            a=dict(attrs)
            if a.get("type","").lower() in {"submit","button","image"}:
                self._record("submit", attrs)
            elif a.get("type","").lower()=="file":
                self._record("file_input", attrs)
        elif t=="a":
            self._record("a", attrs)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)

    def handle_endtag(self, tag):
        if tag.lower()=="form" and self._form_depth:
            self._form_depth -= 1

def audit_html(page_id, path, text):
    parser=ActionParser()
    parser.feed(text)
    for action in parser.actions:
        action["page"]=page_id
        action["path"]=path
        if action["state"]=="GOVERNED" and not (action["task_id"] or action["capability_id"]):
            action["state"]="UNMAPPED"
    return parser.actions

def audit_estate(root=ROOT):
    rows=[]
    pages=sorted(root.glob("*.html"))
    for path in pages:
        page_id=path.stem
        rows.extend(audit_html(page_id,path.name,path.read_text(encoding="utf-8",errors="ignore")))
    counts={s:sum(1 for r in rows if r["state"]==s) for s in sorted(VALID)}
    return {
        "schema_version":1,
        "name":"Ω Page Action / Task Audit",
        "status":"SOURCE_EVIDENCE_ONLY",
        "page_count":len(pages),
        "action_count":len(rows),
        "counts":counts,
        "actions":rows,
        "truth_boundary":"DOM presence does not prove functionality, authorization, truth, production deployment or successful execution.",
        "unmapped_rule":"UNMAPPED actions require an explicit governed task/capability mapping or an explicit unavailable state before production-complete classification.",
        "navigation_rule":"Pure local HTML navigation proven directly by onclick/onsubmit source is AVAILABLE_WITHOUT_MUTATION; opaque or mutating handlers remain UNMAPPED.",
    }

def validate(data):
    required={"schema_version","name","status","page_count","action_count","counts","actions"}
    missing=required-set(data)
    if missing:
        raise SystemExit("missing audit fields: "+", ".join(sorted(missing)))
    if data["status"]!="SOURCE_EVIDENCE_ONLY":
        raise SystemExit("invalid audit status")
    if data["action_count"]!=len(data["actions"]):
        raise SystemExit("action_count mismatch")
    if sum(data["counts"].values())!=data["action_count"]:
        raise SystemExit("state counts mismatch")
    if any(a["state"] not in VALID for a in data["actions"]):
        raise SystemExit("invalid action state")
    return 0

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--write",action="store_true",help="write config/omega-page-action-audit.json")
    ap.add_argument("--check",action="store_true",help="validate generated/current audit structure")
    args=ap.parse_args()
    data=audit_estate()
    validate(data)
    if args.write:
        out=ROOT/"config"/"omega-page-action-audit.json"
        out.write_text(json.dumps(data,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
        print(f"WROTE {out}")
    else:
        print(json.dumps({k:data[k] for k in ("page_count","action_count","counts")},ensure_ascii=False))
    return 0

if __name__=="__main__":
    raise SystemExit(main())
