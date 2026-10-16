#!/usr/bin/env python3
"""Authenticated, local-only end-to-end test for the private content pipeline.

This test refuses non-loopback Supabase URLs. It creates disposable local users,
uploads a file to private Storage, registers it through content-ingest, downloads
it through content-delivery, verifies owner isolation and audit evidence, then
relies on the isolated CI stack teardown for final cleanup. No production data
or credentials are used.
"""
from __future__ import annotations

import json
import os
import re
import secrets
import shlex
import subprocess
import tempfile
import time
from datetime import datetime, timezone
import uuid
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]


class E2EFailure(RuntimeError):
    pass


def require(condition: bool, stage: str) -> None:
    if not condition:
        raise E2EFailure(stage)


def request(method: str, url: str, headers: dict[str, str] | None = None,
            body: bytes | dict | None = None, timeout: int = 15):
    data = json.dumps(body).encode("utf-8") if isinstance(body, dict) else body
    req = Request(url, data=data, headers=headers or {}, method=method)
    try:
        with urlopen(req, timeout=timeout) as response:
            raw = response.read()
            status = response.status
            content_type = response.headers.get("Content-Type", "")
    except HTTPError as exc:
        raw = exc.read()
        status = exc.code
        content_type = exc.headers.get("Content-Type", "")
    except URLError:
        return 0, None, b""
    parsed = None
    if "json" in content_type.lower():
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            parsed = None
    elif raw:
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            parsed = None
    return status, parsed, raw


def local_env() -> dict[str, str]:
    result = subprocess.run(
        ["supabase", "status", "-o", "env"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    )
    values: dict[str, str] = {}
    for line in result.stdout.splitlines():
        match = re.match(r"^([A-Z0-9_]+)=(.*)$", line.strip())
        if not match:
            continue
        key, raw = match.groups()
        try:
            parsed = shlex.split(raw)
            values[key] = parsed[0] if parsed else ""
        except ValueError:
            values[key] = raw.strip('"')
    api_url = values.get("API_URL") or values.get("SUPABASE_URL") or ""
    anon_key = values.get("ANON_KEY") or values.get("SUPABASE_ANON_KEY") or ""
    service_key = values.get("SERVICE_ROLE_KEY") or values.get("SUPABASE_SERVICE_ROLE_KEY") or ""
    parsed_url = urlparse(api_url)
    require(parsed_url.scheme in {"http", "https"} and parsed_url.hostname in {"127.0.0.1", "localhost", "::1"},
            "refusing_nonlocal_supabase_target")
    require(bool(anon_key) and bool(service_key), "local_supabase_keys_missing")
    return {
        "SUPABASE_URL": api_url.rstrip("/"),
        "SUPABASE_ANON_KEY": anon_key,
        "SUPABASE_SERVICE_ROLE_KEY": service_key,
        "API_URL": api_url.rstrip("/"),
        "ANON_KEY": anon_key,
        "SERVICE_ROLE_KEY": service_key,
    }


def auth_headers(api_key: str, access_token: str | None = None) -> dict[str, str]:
    headers = {"apikey": api_key, "Content-Type": "application/json"}
    if access_token:
        headers["Authorization"] = "Bearer " + access_token
    return headers


def create_user(api_url: str, anon_key: str, service_key: str) -> tuple[str, str]:
    email = "omega-content-e2e-" + uuid.uuid4().hex + "@example.test"
    password = secrets.token_urlsafe(28)
    status, user, _ = request(
        "POST", api_url + "/auth/v1/admin/users",
        headers=auth_headers(service_key, service_key),
        body={"email": email, "password": password, "email_confirm": True},
    )
    require(status in (200, 201) and isinstance(user, dict), "local_test_user_create_failed")
    user_id = user.get("id") or (user.get("user") or {}).get("id")
    require(isinstance(user_id, str) and bool(user_id), "local_test_user_id_missing")
    status, session, _ = request(
        "POST", api_url + "/auth/v1/token?grant_type=password",
        headers=auth_headers(anon_key),
        body={"email": email, "password": password},
    )
    require(status == 200 and isinstance(session, dict) and session.get("access_token"),
            "local_test_user_signin_failed")
    return user_id, session["access_token"]


def invoke(api_url: str, anon_key: str, token: str | None, function: str, payload: dict | None):
    headers = {"apikey": anon_key, "Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    status, data, raw = request(
        "POST", f"{api_url}/functions/v1/{function}",
        headers=headers, body=payload or {},
    )
    return status, data, raw


def rest_rows(api_url: str, service_key: str, table: str, params: dict[str, str]):
    query = urlencode(params, safe="(),.*")
    status, data, _ = request(
        "GET", f"{api_url}/rest/v1/{table}?{query}",
        headers={"apikey": service_key, "Authorization": "Bearer " + service_key},
    )
    require(status == 200 and isinstance(data, list), f"service_role_read_failed_{table}")
    return data


def run_e2e(env: dict[str, str]) -> None:
    api_url = env["API_URL"]
    anon_key = env["ANON_KEY"]
    service_key = env["SERVICE_ROLE_KEY"]
    first_id = first_token = second_id = second_token = None
    storage_path = None
    file_id = None

    # Readiness probe deliberately expects auth rejection; this confirms the
    # function is routed and JWT verification is active without mutating data.
    deadline = time.time() + 90
    while time.time() < deadline:
        status, _, _ = request(
            "POST", api_url + "/functions/v1/content-ingest",
            headers={"apikey": anon_key, "Content-Type": "application/json"},
            body={},
            timeout=2,
        )
        if status == 401:
            break
        time.sleep(1)
    else:
        raise E2EFailure("content_ingest_edge_runtime_not_ready")

    first_id, first_token = create_user(api_url, anon_key, service_key)
    second_id, second_token = create_user(api_url, anon_key, service_key)
    filename = "omega-content-e2e-" + uuid.uuid4().hex + ".txt"
    storage_path = first_id + "/" + filename
    contents = ("SYD OMEGA content pipeline E2E " + uuid.uuid4().hex + "\n").encode("utf-8")

    status, _, _ = request(
        "POST", f"{api_url}/storage/v1/object/uploads/{quote(storage_path, safe='/')}",
        headers={
            "apikey": anon_key,
            "Authorization": "Bearer " + first_token,
            "Content-Type": "text/plain",
            "x-upsert": "false",
        },
        body=contents,
    )
    require(status in (200, 201), "private_storage_upload_failed")

    # Deliberately lie about client-supplied metadata; server must trust Storage.
    ingest_body = {
        "bucket": "uploads",
        "filename": filename,
        "path": storage_path,
        "size_bytes": 1,
        "mime_type": "application/x-client-claimed",
    }
    status, ingest, _ = invoke(api_url, anon_key, first_token, "content-ingest", ingest_body)
    require(status == 200 and isinstance(ingest, dict) and ingest.get("ok") is True,
            "content_ingest_registration_failed")
    file_record = ingest.get("file") or {}
    file_id = file_record.get("id")
    require(isinstance(file_id, str) and bool(file_id), "content_ingest_id_missing")
    require(ingest.get("review_state") == "PENDING_REVIEW", "upload_must_not_imply_publication")
    require(ingest.get("rights_state") == "UNVERIFIED", "upload_must_not_imply_rights_clearance")

    status, duplicate, _ = invoke(api_url, anon_key, first_token, "content-ingest", ingest_body)
    require(status == 200 and isinstance(duplicate, dict) and duplicate.get("duplicate") is True,
            "duplicate_registration_not_idempotent")
    require((duplicate.get("file") or {}).get("id") == file_id, "duplicate_registration_changed_identity")

    status, bad_path, _ = invoke(
        api_url, anon_key, first_token, "content-ingest",
        {**ingest_body, "path": first_id + "/../" + filename},
    )
    require(status == 400, "path_traversal_not_rejected")

    # Gateway-level JWT enforcement must reject an unauthenticated request.
    status, _, _ = invoke(api_url, anon_key, None, "content-ingest", ingest_body)
    require(status == 401, "unauthenticated_ingest_not_rejected")

    status, delivery, _ = invoke(
        api_url, anon_key, first_token, "content-delivery", {"file_id": file_id},
    )
    require(status == 200 and isinstance(delivery, dict) and delivery.get("ok") is True,
            "owner_signed_download_failed")
    require(delivery.get("delivery_state") == "SIGNED", "signed_delivery_state_missing")
    expires_at = delivery.get("expires_at")
    require(isinstance(expires_at, str), "signed_url_expiry_missing")
    try:
        expiry_time = datetime.fromisoformat(expires_at.replace("Z", "+00:00"))
    except ValueError as exc:
        raise E2EFailure("signed_url_expiry_invalid") from exc
    remaining = (expiry_time - datetime.now(timezone.utc)).total_seconds()
    require(885 <= remaining <= 915, "signed_url_expiry_not_900_seconds")
    signed_url = delivery.get("signed_url")
    require(isinstance(signed_url, str) and signed_url.startswith(("http://", "https://", "/")),
            "signed_url_missing")
    if signed_url.startswith("/object/"):
        signed_url = api_url + "/storage/v1" + signed_url
    elif signed_url.startswith("/storage/"):
        signed_url = api_url + signed_url
    status, _, downloaded = request("GET", signed_url, timeout=15)
    require(status == 200 and downloaded == contents, "signed_download_content_mismatch")

    status, forbidden, _ = invoke(
        api_url, anon_key, second_token, "content-delivery", {"file_id": file_id},
    )
    require(status == 403 and isinstance(forbidden, dict) and forbidden.get("error") == "forbidden",
            "cross_user_download_not_forbidden")

    rows = rest_rows(api_url, service_key, "storage_files", {
        "select": "id,owner_id,filename,storage_path,mime_type,size_bytes,visibility",
        "id": "eq." + file_id,
        "limit": "2",
    })
    require(len(rows) == 1, "storage_file_metadata_missing_or_duplicated")
    row = rows[0]
    require(row.get("owner_id") == first_id, "metadata_owner_mismatch")
    require(row.get("storage_path") == storage_path, "metadata_path_mismatch")
    require(row.get("size_bytes") == len(contents), "client_supplied_size_was_trusted")
    require(row.get("mime_type") == "text/plain", "client_supplied_mime_was_trusted")
    require(row.get("visibility") == "private", "content_not_private_by_default")

    events = rest_rows(api_url, service_key, "omega_platform_events", {
        "select": "event_type,actor_user_id,metadata",
        "actor_user_id": "eq." + first_id,
        "limit": "100",
    })
    event_names = {
        (event.get("metadata") or {}).get("event_name")
        for event in events
        if event.get("actor_user_id") == first_id
    }
    require("content_asset_registered" in event_names, "content_registration_audit_missing")
    require("content_asset_signed_download" in event_names, "signed_download_audit_missing")
    signed_event = next(
        (event for event in events if (event.get("metadata") or {}).get("event_name") == "content_asset_signed_download"),
        None,
    )
    require(
        signed_event is not None and (signed_event.get("metadata") or {}).get("expires_seconds") == 900,
        "signed_download_audit_expiry_mismatch",
    )
    print("CONTENT_PIPELINE_E2E=PASS local_only=true stages=auth,upload,registration,idempotency,path_guard,jwt,owner_download,expiry,audit")


def main() -> int:
    env = local_env()
    with tempfile.TemporaryDirectory(prefix="omega-content-pipeline-e2e-") as tmp:
        temp = Path(tmp)
        env_file = temp / "functions.env"
        env_file.write_text(
            "\n".join(f"{key}={value}" for key, value in (
                ("SUPABASE_URL", env["SUPABASE_URL"]),
                ("SUPABASE_ANON_KEY", env["SUPABASE_ANON_KEY"]),
                ("SUPABASE_SERVICE_ROLE_KEY", env["SUPABASE_SERVICE_ROLE_KEY"]),
            )) + "\n",
            encoding="utf-8",
        )
        log_path = temp / "edge-runtime.log"
        with log_path.open("w+", encoding="utf-8") as log:
            server = subprocess.Popen(
                ["supabase", "functions", "serve", "--env-file", str(env_file)],
                cwd=ROOT, stdout=log, stderr=subprocess.STDOUT, text=True,
            )
            try:
                run_e2e(env)
            except Exception as exc:
                server.poll()
                log.flush()
                log.seek(0)
                logs = log.read()
                for secret in (env["ANON_KEY"], env["SERVICE_ROLE_KEY"]):
                    logs = logs.replace(secret, "[redacted]")
                tail = logs[-2500:].strip()
                print("CONTENT_PIPELINE_E2E=FAIL stage=" + str(exc))
                if tail:
                    print("EDGE_RUNTIME_LOG_TAIL_BEGIN")
                    print(tail)
                    print("EDGE_RUNTIME_LOG_TAIL_END")
                return 1
            finally:
                if server.poll() is None:
                    server.terminate()
                    try:
                        server.wait(timeout=10)
                    except subprocess.TimeoutExpired:
                        server.kill()
                        server.wait(timeout=5)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
