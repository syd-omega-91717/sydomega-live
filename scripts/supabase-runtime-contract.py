#!/usr/bin/env python3
"""Fail-closed runtime contract for the configured Supabase project.

This gate proves only safe, read-only runtime facts from CI:
- the project URL is present and HTTPS;
- the public anon key is present without being printed;
- Supabase Auth health is reachable; and
- PostgREST is reachable and accepts the public key.

It does not use a service-role key, enumerate application data, or mutate the
project. Schema/migration verification remains a separate controlled gate.
"""
from __future__ import annotations

import os
import re
import socket
import sys
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

TIMEOUT_SECONDS = 15
USER_AGENT = "sydomega-supabase-runtime-contract/1.1"


def fail(message: str) -> int:
    print(f"::error::{message}")
    return 1


def get(url: str, headers: dict[str, str] | None = None) -> tuple[int, bytes]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, **(headers or {})},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.status, response.read(4096)


# The credentials this contract needs are NOT secrets, and treating them as
# secrets is what kept this gate permanently red. bg.js:1506 ships both to every
# visitor -- `createClient("https://<project>.supabase.co", "sb_publishable_...")`
# -- because RLS, not key custody, is the authorization boundary here (CLAUDE.md
# 1 and 5). The project URL is also committed unsecreted in
# production-surface-smoke.yml's env block.
#
# So read what the platform actually ships, and let the CI secrets override it.
# That is strictly stronger than a separately-maintained copy: a secret can
# drift from what production uses, and this cannot. It is also CLAUDE.md 8.4's
# rule -- derive the fact, do not store a second copy of it.
#
# A service-role key would never be sourced this way; it is never in client code
# at all, and ci.yml's scan blocks it (CLAUDE.md 5).
CLIENT_BOOTSTRAP = Path(__file__).resolve().parents[1] / "bg.js"
SHIPPED_CLIENT_RE = re.compile(
    r"""createClient\(\s*["'](https://[a-z0-9-]+\.supabase\.co)["']\s*,\s*["'](sb_publishable_[A-Za-z0-9_-]+)["']"""
)


def shipped_credentials() -> tuple[str, str]:
    """The (url, publishable key) pair bg.js hands to every page, or ("", "")."""
    try:
        match = SHIPPED_CLIENT_RE.search(CLIENT_BOOTSTRAP.read_text(encoding="utf-8", errors="replace"))
    except OSError:
        return "", ""
    return (match.group(1), match.group(2)) if match else ("", "")


# The new opaque API keys are NOT JWTs, and sending one as a bearer token is
# the documented way to get a 401. Supabase's own docs, verbatim: "A common
# mistake is sending a publishable or secret key as a bearer token:
# `Authorization: Bearer sb_publishable_...`. The new API keys are not JWTs.
# The platform check can't validate them ... Instead, put API keys in the
# `apikey` header."
#
# This contract sent `Authorization: Bearer <key>` on every probe. Auth health
# survived it (that route verifies no JWT); PostgREST rejected it with 401, and
# the gate read that as "Supabase rejected the configured public key" -- a
# production-sounding failure that was entirely the check's own doing. It went
# unnoticed because the job had never run at all (FIXES_LOG.md 106).
#
# A LEGACY anon key IS a JWT (`eyJ...`), and for those the platform copies the
# apikey value into Authorization, so the header stays correct there. Hence:
# branch on the key format, never assume one.
OPAQUE_KEY_PREFIXES = ("sb_publishable_", "sb_secret_")


def bearer_for(key: str) -> dict[str, str]:
    """The Authorization header this key type should carry, if any."""
    if key.startswith(OPAQUE_KEY_PREFIXES):
        return {}
    return {"Authorization": f"Bearer {key}"}


def main() -> int:
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    anon = os.environ.get("SUPABASE_ANON_KEY", "").strip()

    source = "ci_secrets"
    if not url or not anon:
        shipped_url, shipped_anon = shipped_credentials()
        url = url or shipped_url
        anon = anon or shipped_anon
        source = "shipped_client" if (shipped_url or shipped_anon) else source

    if not url:
        return fail("SUPABASE_URL is not set and bg.js does not declare a project URL")
    if not anon:
        return fail("SUPABASE_ANON_KEY is not set and bg.js does not declare a publishable key")
    print(f"credential_source={source}")

    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        return fail("SUPABASE_URL must be a valid HTTPS URL")
    if parsed.path not in ("", "/"):
        return fail("SUPABASE_URL must be the project root URL, not a service path")
    if parsed.username or parsed.password:
        return fail("SUPABASE_URL must not contain embedded credentials")

    common = {"apikey": anon, "Accept": "application/json", **bearer_for(anon)}

    checks = (
        ("Auth health", url + "/auth/v1/health", common),
        ("PostgREST", url + "/rest/v1/", {
            **common,
            "Accept": "application/openapi+json, application/json",
        }),
    )

    for name, endpoint, headers in checks:
        try:
            status, _ = get(endpoint, headers)
        except urllib.error.HTTPError as exc:
            if exc.code in (401, 403):
                return fail(f"Supabase {name} rejected the configured public key (HTTP {exc.code})")
            return fail(f"Supabase {name} returned HTTP {exc.code}")
        except urllib.error.URLError as exc:
            return fail(f"Supabase {name} is unreachable: {exc.reason}")
        except (TimeoutError, socket.timeout):
            return fail(f"Supabase {name} timed out after {TIMEOUT_SECONDS} seconds")
        except Exception as exc:
            return fail(f"Supabase {name} probe failed: {type(exc).__name__}: {exc}")

        if status < 200 or status >= 300:
            return fail(f"Supabase {name} returned unexpected HTTP {status}")

    print("SUPABASE_RUNTIME_CONTRACT=PASSED")
    print("Supabase Auth health and PostgREST are reachable and accepted the public key.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
