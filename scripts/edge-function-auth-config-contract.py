#!/usr/bin/env python3
"""Fail closed when deployed Edge Function auth modes and CLI JWT config drift."""
from __future__ import annotations

import json
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "supabase/config.toml"
SNAPSHOT = ROOT / "docs/runtime/supabase-edge-functions-live.json"
AUTH_REGISTRY = ROOT / "config/omega-edge-function-auth.json"
FUNCTIONS = ROOT / "supabase/functions"


def fail(errors: list[str]) -> int:
    print("EDGE FUNCTION AUTH CONFIG CONTRACT: FAIL")
    for error in errors:
        print(" - " + error)
    return 1


def main() -> int:
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0

    for path in (CONFIG, SNAPSHOT, AUTH_REGISTRY):
        if not path.is_file():
            return fail([f"required file missing: {path.relative_to(ROOT)}"])

    config = tomllib.loads(CONFIG.read_text(encoding="utf-8"))
    snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
    registry = json.loads(AUTH_REGISTRY.read_text(encoding="utf-8"))
    deployed = {
        name: meta for name, meta in snapshot.get("functions", {}).items()
        if meta.get("state") == "DEPLOYED"
    }
    declared = registry.get("functions", {})
    configured = config.get("functions", {})
    errors: list[str] = []

    if set(declared) != set(deployed):
        errors.append(
            "auth registry/live snapshot mismatch: "
            f"missing={sorted(set(deployed) - set(declared))}; "
            f"extra={sorted(set(declared) - set(deployed))}"
        )
    if set(configured) != set(deployed):
        errors.append(
            "supabase/config.toml must explicitly configure every deployed function: "
            f"missing={sorted(set(deployed) - set(configured))}; "
            f"extra={sorted(set(configured) - set(deployed))}"
        )

    for name, meta in declared.items():
        if name not in deployed:
            continue
        live_verify = deployed[name].get("verify_jwt")
        if not isinstance(live_verify, bool):
            errors.append(f"{name}: live snapshot has no boolean verify_jwt")
            continue
        if meta.get("verify_jwt") is not live_verify:
            errors.append(f"{name}: auth registry verify_jwt disagrees with live snapshot")
        config_verify = configured.get(name, {}).get("verify_jwt")
        if config_verify is not live_verify:
            errors.append(f"{name}: supabase/config.toml verify_jwt disagrees with live snapshot")

        mode = meta.get("auth_mode")
        source_path = FUNCTIONS / name / "index.ts"
        if not source_path.is_file():
            errors.append(f"{name}: source entrypoint missing")
            continue
        source = source_path.read_text(encoding="utf-8")

        if mode == "SUPABASE_JWT":
            if live_verify is not True:
                errors.append(f"{name}: SUPABASE_JWT mode requires verify_jwt=true")
        elif mode == "USER_SESSION":
            if live_verify is not False or not (
                ('auth: "user"' in source or "auth: 'user'" in source)
                and "userClaims?.sub" in source
            ):
                errors.append(f"{name}: USER_SESSION requires an explicit user-session guard")
        elif mode == "PUBLIC_READONLY":
            if live_verify is not False or "req.method !== \"GET\"" not in source:
                errors.append(f"{name}: PUBLIC_READONLY must remain public and GET-only")
            if "SUPABASE_SERVICE_ROLE_KEY" in source or "secretKey(" in source:
                errors.append(f"{name}: PUBLIC_READONLY source must not use privileged database credentials")
        elif mode == "SHARED_SECRET":
            if live_verify is not False:
                errors.append(f"{name}: SHARED_SECRET requires verify_jwt=false plus application-level secret auth")
            adapter_secret = "withSupabase({ auth: 'secret' }" in source or 'withSupabase({ auth: "secret" }' in source
            header_secret = "OMEGA_PROVIDER_WORKER_SECRET" in source and "x-omega-worker-secret" in source
            # Vault-backed webhook secret (notify-access): read through a
            # service_role-only RPC, compared before the body, 401 otherwise.
            vault_secret = ("x-omega-webhook-secret" in source and "omega_notify_access_secret" in source
                            and '"unauthorized" }, 401' in source)
            if not (adapter_secret or header_secret or vault_secret):
                errors.append(f"{name}: no recognized application-level shared-secret check")
        elif mode == "STRIPE_SIGNATURE":
            required = ("verifyStripeSignature", "stripe-signature", "STRIPE_WEBHOOK_SECRET")
            if live_verify is not False or any(token not in source for token in required):
                errors.append(f"{name}: Stripe webhook signature verification contract is incomplete")
        else:
            errors.append(f"{name}: unsupported or missing auth_mode {mode!r}")

    if errors:
        return fail(errors)

    counts: dict[str, int] = {}
    for meta in declared.values():
        mode = meta["auth_mode"]
        counts[mode] = counts.get(mode, 0) + 1
    print(
        "EDGE FUNCTION AUTH CONFIG CONTRACT: PASS "
        f"({len(declared)} deployed functions; "
        + ", ".join(f"{key}={counts[key]}" for key in sorted(counts))
        + ")"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
