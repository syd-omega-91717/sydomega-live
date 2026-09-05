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
import socket
import sys
import urllib.error
import urllib.request
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


def main() -> int:
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    anon = os.environ.get("SUPABASE_ANON_KEY", "").strip()

    if not url:
        return fail("SUPABASE_URL is not configured in the CI secret store")
    if not anon:
        return fail("SUPABASE_ANON_KEY is not configured in the CI secret store")

    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.netloc:
        return fail("SUPABASE_URL must be a valid HTTPS URL")
    if parsed.path not in ("", "/"):
        return fail("SUPABASE_URL must be the project root URL, not a service path")
    if parsed.username or parsed.password:
        return fail("SUPABASE_URL must not contain embedded credentials")

    common = {
        "apikey": anon,
        "Authorization": f"Bearer {anon}",
        "Accept": "application/json",
    }

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
