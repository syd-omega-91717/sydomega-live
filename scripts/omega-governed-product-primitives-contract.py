#!/usr/bin/env python3
"""Validate the governed referral/achievement/agent/notification contract."""

from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
required = [
    ROOT / "config/omega-referral-policy.json",
    ROOT / "config/omega-achievement-policy.json",
    ROOT / "config/omega-agent-execution-policy.json",
    ROOT / "supabase/migrations/20261002020000_referral_achievement_agent_notification_primitives.sql",
]
for path in required:
    if not path.exists() or not path.read_text(encoding="utf-8").strip():
        raise SystemExit(f"FAIL: missing or empty {path}")

ref = json.loads((ROOT / "config/omega-referral-policy.json").read_text())
ach = json.loads((ROOT / "config/omega-achievement-policy.json").read_text())
agent = json.loads((ROOT / "config/omega-agent-execution-policy.json").read_text())

assert ref["rules"]["one_attribution_per_referred_user"] is True
assert ref["rules"]["self_referral"] == "deny"
assert ref["rules"]["reward_before_qualification"] == "deny"
assert ref["rules"]["ledger_posting"] == "idempotent"
assert ach["rules"]["client_cannot_self_verify"] is True
assert ach["rules"]["certificate_requires_verified_achievement"] is True
assert agent["defaults"]["tool_access"] == "deny"
assert agent["defaults"]["autonomous_spend"] is False
assert agent["defaults"]["approval_required"] is True
assert agent["defaults"]["audit_required"] is True
assert agent["defaults"]["idempotency_required"] is True

sql = (ROOT / "supabase/migrations/20261002020000_referral_achievement_agent_notification_primitives.sql").read_text()
for token in (
    "omega_referral_attributions",
    "omega_referral_conversions",
    "omega_referral_rewards",
    "omega_fraud_signals",
    "omega_achievement_verifications",
    "omega_agent_tasks",
    "omega_agent_tool_grants",
    "omega_notifications",
    "enable row level security",
    "revoke all",
):
    assert token.lower() in sql.lower(), f"missing SQL contract token: {token}"

print("PASS: referral, achievement, governed-agent and notification contract")
