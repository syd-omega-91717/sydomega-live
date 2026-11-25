#!/usr/bin/env python3
"""Build an evidence-bound page-to-domain-hub ownership matrix.

The matrix is an inventory artifact, not permission to merge or redirect pages.
Navigation section evidence is preserved; ambiguous and unmapped pages stay open.
"""
from __future__ import annotations

import json
import re
from collections import Counter
from pathlib import Path
import sys

if "--help" in sys.argv:
    print(__doc__.strip())
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
CONTRACTS = ROOT / "config" / "omega-page-contracts.json"
NAV = ROOT / "nav.js"
OUTPUT = ROOT / "config" / "omega-page-hub-ownership.json"

HUBS = {
    "command": "dashboard.html",
    "identity": "profile.html",
    "ascend": "ascend.html",
    "cosmos": "cosmos.html",
    "vault": "vault.html",
    "order": "order.html",
    "life": "life.html",
    "services": "services.html",
    "intel": "intel.html",
    "arena": "sovereign-ai.html",
    "govern": "govern.html",
    "invest": "invest.html",
    "achieve": "achieve.html",
    "media": "media.html",
}
PROTECTED_HUB_BY_STEM = {
    "account": "profile.html",
    "kyc": "profile.html",
    "terms": "govern.html",
    "subscriptions": "vault.html",
    "wallet": "invest.html",
    "portfolio": "invest.html",
    "treasury": "invest.html",
    "privacy": "govern.html",
    "security": "profile.html",
    "settings": "profile.html",
    "control-center": "govern.html",
    "control-plane": "govern.html",
    "graph-admin": "intel.html",
    "approvals": "intel.html",
    "contracts": "services.html",
}
SPECIAL = {
    "404", "500", "offline", "maintenance", "login", "signup",
    # Keep security, identity, legal, financial and owner-control lifecycles
    # as independent top-level routes until their dedicated contracts are proven.
    "account", "approvals", "contracts", "control-center", "control-plane", "graph-admin",
    "kyc", "portfolio", "privacy", "security", "settings",
    "subscriptions", "terms", "treasury", "wallet",
}
AMBIGUOUS_SECTIONS = {"archive"}
SECTION_HUB = {**HUBS, "archive": None}

def main() -> int:
    contracts = json.loads(CONTRACTS.read_text(encoding="utf-8"))
    source = NAV.read_text(encoding="utf-8")
    match = re.search(r"var PS\s*=\s*\{(.*?)\};", source, re.S)
    if not match:
        raise SystemExit("Could not locate canonical page-section map in nav.js")
    pairs = re.findall(r"(['\"]?)([a-zA-Z0-9_-]+)\1\s*:\s*['\"]([a-zA-Z0-9_-]+)['\"]", match.group(1))
    values: dict[str, str] = {}
    duplicate_keys: dict[str, list[str]] = {}
    for _, key, section in pairs:
        if key in values and values[key] != section:
            duplicate_keys.setdefault(key, [values[key]]).append(section)
        values[key] = section

    rows = []
    counts = Counter()
    for page in contracts.get("contracts", []):
        path = page.get("path", "")
        stem = Path(path).stem
        section = values.get(stem)
        if stem in SPECIAL:
            state, hub = "KEEP_SEPARATE", None
            reason = "System, identity, legal, financial or owner-control route; retain a dedicated route until its independent access and lifecycle contracts are verified."
        elif section in AMBIGUOUS_SECTIONS:
            state, hub = "AMBIGUOUS", None
            reason = "Navigation places this page in a legacy archive group; canonical identity/order ownership requires review."
        elif section in SECTION_HUB and SECTION_HUB[section]:
            state, hub = "CANDIDATE_MERGE_PANEL", SECTION_HUB[section]
            reason = "Mapped by the effective page-section entry in nav.js; functional and authorization parity still unverified."
        elif section:
            state, hub = "UNMAPPED_SECTION", None
            reason = "Navigation section has no approved canonical hub mapping."
        else:
            state, hub = "UNMAPPED", None
            reason = "No effective page-section entry found in nav.js."
        counts[state] += 1
        rows.append({
            "page_id": page.get("page_id"),
            "path": path,
            "navigation_section": section,
            "candidate_hub": hub,
            "protected_hub": PROTECTED_HUB_BY_STEM.get(stem),
            "classification": state,
            "rationale": reason,
            "contract_authority": page.get("authority", "UNVERIFIED"),
            "authorization_state": page.get("authorization", "UNVERIFIED"),
            "truth_states": page.get("truth_states", ["UNVERIFIED"]),
        })

    expected = contracts.get("page_count")
    if len(rows) != expected:
        raise SystemExit(f"Contract count mismatch: expected {expected}, got {len(rows)}")
    ids = [row["page_id"] for row in rows]
    paths = [row["path"] for row in rows]
    if len(ids) != len(set(ids)) or len(paths) != len(set(paths)):
        raise SystemExit("Duplicate page IDs or paths detected")

    result = {
        "schema_version": 1,
        "name": "Ω SYD OMEGA 91717 Page-to-Hub Ownership Matrix",
        "status": "SOURCE_INVENTORY_ONLY",
        "source_files": ["config/omega-page-contracts.json", "nav.js"],
        "page_count": len(rows),
        "hub_count": len(HUBS),
        "classification_counts": dict(sorted(counts.items())),
        "navigation_duplicate_keys": duplicate_keys,
        "unresolved_count": sum(count for key, count in counts.items() if key in {"AMBIGUOUS", "UNMAPPED", "UNMAPPED_SECTION"}),
        "merge_policy": "Only CANDIDATE_MERGE_PANEL routes are eligible for the user-facing domain workspace layer. Sensitive identity, legal, financial, authentication and owner-control routes remain separate. No page may be deleted or redirected from this matrix alone; verify unique tasks, scripts, data sources, authorization, RLS, events, failure paths, accessibility, responsive behavior and production parity first.",
        "hubs": [{"section": section, "path": path} for section, path in HUBS.items()],
        "pages": rows,
    }
    OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"PAGE_COUNT={len(rows)}")
    print(f"HUB_COUNT={len(HUBS)}")
    for key, value in sorted(counts.items()):
        print(f"{key}={value}")
    print(f"UNRESOLVED={result['unresolved_count']}")
    print(f"NAV_DUPLICATE_KEYS={len(duplicate_keys)}")
    print(f"WROTE={OUTPUT.relative_to(ROOT)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
