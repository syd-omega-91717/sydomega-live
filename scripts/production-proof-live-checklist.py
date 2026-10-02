#!/usr/bin/env python3
"""Emit the non-fabricating live proof checklist for release verification."""

from __future__ import annotations
import json

GATES = [
    ("auth_e2e", "Auth registration/confirmation/login/reset/session invalidation/MFA"),
    ("authorization_e2e", "Member/owner/cross-user authorization denial matrix"),
    ("storage_e2e", "Private upload/read/delete and cross-user denial"),
    ("stripe_e2e", "Checkout/webhook/idempotency/entitlement lifecycle"),
    ("progression_e2e", "Task -> sovereign event -> evidence -> award -> replay"),
    ("ai_e2e", "Provider/fallback/permission/provenance/cost controls"),
    ("backup_restore", "Backup creation and restoration exercise"),
    ("browser_smoke", "Critical desktop/mobile production journeys"),
    ("accessibility_performance", "Representative accessibility/performance release gates"),
    ("vercel_provider", "Deployment ID/alias/log inspection through authorized Vercel scope"),
    ("auth_security_setting", "Leaked-password protection enabled in Supabase Auth"),
]
print(json.dumps({
    "schemaVersion":"1.0.0",
    "contract":"live-production-proof-checklist",
    "gates":[{"id":i,"requirement":d,"status":"OPEN"} for i,d in GATES],
    "rule":"A gate may only change from OPEN after direct runtime/provider evidence is captured; source-code existence is insufficient."
},indent=2))

import sys

if "--help" in sys.argv:
    print(__doc__ or "")
    raise SystemExit(0)
