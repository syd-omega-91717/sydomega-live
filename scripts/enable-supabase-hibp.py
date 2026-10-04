#!/usr/bin/env python3
"""Enable and verify Supabase Auth leaked-password protection.

Requires SUPABASE_ACCESS_TOKEN with auth_config_write + project_admin_write.
The token is read only from the environment and never printed or stored.
"""
import json
import os
import sys
import urllib.error
import urllib.request

PROJECT_REF = "ydqhzvvoyufiiqvzcjns"
BASE = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/config/auth"


def request(method, url, token, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    if not url.startswith("https://"):
        raise ValueError(f"refusing non-https URL: {url!r}")
    try:
        # https-only, checked above, so no file:// or other scheme reaches urlopen.
        # nosemgrep: dynamic-urllib-use-detected
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read().decode()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise RuntimeError(f"Supabase Management API returned HTTP {exc.code}: {detail}") from exc


def main(argv):
    if "--help" in argv or "-h" in argv:
        print(__doc__)
        return 0

    token = os.environ.get("SUPABASE_ACCESS_TOKEN")
    if not token:
        print("ERROR: SUPABASE_ACCESS_TOKEN is not set.", file=sys.stderr)
        return 2

    status, before = request("GET", BASE, token)
    current = bool(before.get("password_hibp_enabled"))
    print(f"password_hibp_enabled before: {str(current).lower()}")

    if not current:
        status, after = request("PATCH", BASE, token, {"password_hibp_enabled": True})
        current = bool(after.get("password_hibp_enabled"))
        print(f"password_hibp_enabled after: {str(current).lower()}")

    if not current:
        print("ERROR: Supabase did not confirm password_hibp_enabled=true.", file=sys.stderr)
        return 1

    print("OK: Supabase Auth leaked-password protection is enabled.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
