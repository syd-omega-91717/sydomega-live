#!/usr/bin/env python3
"""Contract for evidence-gated achievement/certificate and referral settlement primitives."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261002075824_complete_achievement_and_referral_state_transitions_20261002.sql"
FIX = ROOT / "supabase/migrations/20261002075836_fix_achievement_assignment_function_20261002.sql"
IDEMPOTENCY = ROOT / "supabase/migrations/20261002080541_fix_achievement_verification_idempotency_20261002.sql"
CONFLICT = ROOT / "supabase/migrations/20261002141940_harden_achievement_verification_conflict_race_20261002.sql"
POLICY_A = ROOT / "config/omega-achievement-policy.json"
POLICY_R = ROOT / "config/omega-referral-policy.json"
REMOTE = ROOT / "supabase/remote-migrations.json"


def require(text: str, needle: str, label: str, errors: list[str]) -> None:
    if needle not in text:
        errors.append(f"{label}: missing {needle}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    errors: list[str] = []
    for path in (MIGRATION, FIX, IDEMPOTENCY, CONFLICT, POLICY_A, POLICY_R, REMOTE):
        if not path.is_file():
            errors.append(f"missing required artifact: {path.relative_to(ROOT)}")

    if errors:
        print("OMEGA ACHIEVEMENT/REFERRAL CONTRACT: FAIL")
        for error in errors:
            print(" -", error)
        return 1

    sql = MIGRATION.read_text(encoding="utf-8")
    fix = FIX.read_text(encoding="utf-8")
    idempotency = IDEMPOTENCY.read_text(encoding="utf-8")
    conflict = CONFLICT.read_text(encoding="utf-8")
    achievement = json.loads(POLICY_A.read_text(encoding="utf-8"))
    referral = json.loads(POLICY_R.read_text(encoding="utf-8"))
    remote = json.loads(REMOTE.read_text(encoding="utf-8"))

    for fn in (
        "omega_private.assign_achievement",
        "omega_private.issue_certificate",
        "omega_private.verify_achievement",
        "omega_private.post_referral_reward",
        "omega_private.reverse_referral_reward",
        "omega_private.qualify_referral_conversion",
    ):
        require(sql, f"create or replace function {fn}", "function", errors)

    require(sql, "security definer", "privileged functions", errors)
    require(sql, "set search_path=''", "pinned search_path", errors)
    require(sql, "certificate_requires_verified_achievement", "certificate gate", errors)
    require(sql, "certificate_requires_approved_verification", "certificate evidence gate", errors)
    require(sql, "approved_verification_requires_evidence", "approval evidence gate", errors)
    require(sql, "on conflict(achievement_id,user_id) do nothing", "achievement idempotency", errors)
    require(sql, "on conflict(conversion_id) do update", "referral reward idempotency", errors)
    require(idempotency + conflict, "verification_idempotency_conflict", "verification conflict guard", errors)
    require(conflict, "unique_violation", "verification race guard", errors)
    require(sql, "severity in ('high','critical')", "fraud gate", errors)
    require(sql, "status in ('open','confirmed')", "active fraud gate", errors)
    require(sql, "'leaderboard_points',200", "source reward policy", errors)
    require(sql, "perform omega_private.post_referral_reward(v_id)", "reward settlement", errors)
    require(sql, "perform omega_private.reverse_referral_reward(v_id)", "reward reversal", errors)
    require(sql, "revoke all on function omega_private.assign_achievement", "client execute revocation", errors)
    require(sql, "revoke all on function omega_private.verify_achievement", "client execute revocation", errors)
    require(sql, "grant execute on function omega_private.assign_achievement", "service grant", errors)
    require(sql, "grant execute on function omega_private.qualify_referral_conversion", "service grant", errors)
    require(fix, "not exists(select 1 from auth.users where id=p_user_id)", "assignment user validation", errors)

    if achievement.get("rules", {}).get("client_cannot_self_verify") is not True:
        errors.append("achievement policy must prohibit client self-verification")
    if achievement.get("rules", {}).get("certificate_requires_verified_achievement") is not True:
        errors.append("achievement policy must require verified state for certificates")
    if referral.get("rules", {}).get("self_referral") != "deny":
        errors.append("referral policy must deny self-referral")
    if referral.get("rules", {}).get("reward_before_qualification") != "deny":
        errors.append("referral policy must deny pre-qualification reward")
    if referral.get("rules", {}).get("reversal") != "supported":
        errors.append("referral policy must support reversal")

    versions = {str(item.get("version")): item.get("name") for item in remote.get("migrations", [])}
    expected = {
        "20261002075824": "complete_achievement_and_referral_state_transitions_20261002",
        "20261002075836": "fix_achievement_assignment_function_20261002",
        "20261002080541": "fix_achievement_verification_idempotency_20261002",
        "20261002141908": "fix_achievement_verification_idempotency_conflict_20261002",
        "20261002141940": "harden_achievement_verification_conflict_race_20261002",
    }
    for version, name in expected.items():
        if versions.get(version) != name:
            errors.append(f"remote migration evidence mismatch: {version} -> {versions.get(version)!r}")

    # User state must remain empty in the repository migration: this contract
    # may define product rules and functions, but it must never seed user
    # achievements, certificates, referral rewards, or point ledger rows.
    forbidden_seed_markers = (
        "insert into public.omega_user_achievements",
        "insert into public.omega_certificates",
        "insert into public.omega_referral_rewards",
        "insert into public.sovereign_points_ledger",
    )
    for marker in forbidden_seed_markers:
        if marker in sql and "function" not in sql.split(marker, 1)[0][-120:]:
            # Function bodies are expected; only top-level seed INSERTs are forbidden.
            prefix = sql.split(marker, 1)[0]
            if prefix.count("$$") % 2 == 0:
                errors.append(f"repository migration contains a possible top-level fabricated-state insert: {marker}")

    if errors:
        print("OMEGA ACHIEVEMENT/REFERRAL CONTRACT: FAIL")
        for error in errors:
            print(" -", error)
        return 1

    print("OMEGA ACHIEVEMENT/REFERRAL CONTRACT: PASS")
    print("achievement_assignment=pending_only")
    print("certificate=verified_and_evidence_gated")
    print("referral_reward=confirmed_settlement_and_fraud_gated")
    print("reversal=supported")
    print("client_execution=revoked")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
