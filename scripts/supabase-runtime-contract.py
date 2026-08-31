#!/usr/bin/env python3
"""Fail-closed runtime contract for the configured Supabase project.

This gate deliberately proves only what can be proven safely from CI:
- the project URL is present and HTTPS;
- the public anon key is present without being printed;
- the REST endpoint is reachable; and
- the endpoint accepts the public key without returning an authentication
  failure.

It does not use a service-role key and never mutates the database.
Migration/schema deployment is a separate controlled operation.
"""
from __future__ import annotations

import os
import sys
import urllib.error
import urllib.request
from urllib.parse import urlparse


def fail(message: str) -> int:
    print(f"::error::{message}")
    return 1


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
        return fail("SUPABASE_URL must be the project root URL, not a REST path")

    endpoint = url + "/rest/v1/"
    request = urllib.request.Request(
        endpoint,
        headers={
            "apikey": anon,
            "Authorization": f"Bearer {anon}",
            "Accept": "application/openapi+json, application/json",
            "User-Agent": "sydomega-supabase-runtime-contract/1.0",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            status = response.status
            response.read(4096)
    except urllib.error.HTTPError as exc:
        if exc.code in (401, 403):
            return fail(f"Supabase REST authentication rejected the configured public key (HTTP {exc.code})")
        return fail(f"Supabase REST endpoint returned HTTP {exc.code}")
    except urllib.error.URLError as exc:
        return fail(f"Supabase REST endpoint is unreachable: {exc.reason}")
    except TimeoutError:
        return fail("Supabase REST endpoint timed out after 15 seconds")
    except Exception as exc:
        return fail(f"Supabase runtime probe failed: {type(exc).__name__}: {exc}")

    if status < 200 or status >= 300:
        return fail(f"Supabase REST endpoint returned unexpected HTTP {status}")

    print("SUPABASE_RUNTIME_CONTRACT=PASSED")
    print("Supabase project URL is valid, REST is reachable, and the public key was accepted.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
