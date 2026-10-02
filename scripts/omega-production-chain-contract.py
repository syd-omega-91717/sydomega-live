#!/usr/bin/env python3
"""Repository contract for the SYD OMEGA commercial-to-service production chain."""

from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CONFIG=ROOT/"config/omega-production-chain.json"

REQUIRED=[
    "supabase/functions/stripe-webhook/index.ts",
    "supabase/migrations/20261002034000_stripe_settlement_to_ledger.sql",
    "supabase/migrations/20261002027000_service_order_entitlement_activation.sql",
    "supabase/migrations/20261002028000_server_event_ingestion_boundary.sql",
]

def main():
    data=json.loads(CONFIG.read_text(encoding="utf-8"))
    errors=[]
    for path in REQUIRED:
        if not (ROOT/path).is_file():
            errors.append(f"missing implementation: {path}")
    lifecycle=data.get("lifecycle",[])
    if lifecycle != [
        "stripe_event_verified","payment_event_idempotent","ledger_transaction_posted",
        "payment_reconciled","subscription_or_order_activated","entitlement_active",
        "service_execution_authorized","platform_event_recorded","evidence_recorded",
        "achievement_verified","notification_queued","audit_recorded"
    ]:
        errors.append("production lifecycle contract changed unexpectedly")
    inv=data.get("invariants",[])
    if len(inv) < 9:
        errors.append("production invariant set incomplete")
    if data.get("verificationBoundary",{}).get("liveStripePayment") != "NOT_FABRICATED":
        errors.append("live Stripe payment fabrication boundary missing")
    if errors:
        print("OMEGA PRODUCTION CHAIN CONTRACT: FAIL")
        for e in errors: print(" -",e)
        return 1
    print("OMEGA PRODUCTION CHAIN CONTRACT: PASS")
    print("stages="+str(len(lifecycle)))
    print("liveStripePayment=NOT_FABRICATED")
    print("liveVercelProductionProof=PROVIDER_AUTHORIZATION_REQUIRED")
    return 0

if __name__=="__main__":
    raise SystemExit(main())
