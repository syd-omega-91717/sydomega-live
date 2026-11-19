#!/usr/bin/env python3
"""Fingerprint local CSS/JS URLs in the deploy artifact with the release commit."""
from __future__ import annotations

import hashlib
import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = Path(os.environ.get("OMEGA_PUBLIC_DIR", ROOT / "public")).resolve()
ASSET_EXTENSIONS = {".js", ".css"}
TEXT_EXTENSIONS = {".html", ".js", ".css", ".json"}
SAME_ORIGIN_HOSTS = {"sydomega.com", "www.sydomega.com"}

ATTRIBUTE_RE = re.compile(
    r"""(?P<prefix>\b(?:src|href|data-src|data-script|data-module)\s*=\s*)"""
    r"""(?P<quote>["'])(?P<url>[^"']+)(?P=quote)""",
    re.IGNORECASE,
)
STRING_RE = re.compile(
    r"""(?P<quote>["'\x60])"""
    r"""(?P<url>(?:https?://(?:www\.)?sydomega\.com|/|\.{1,2}/)[^"'\x60\s<>]*\.(?:js|css)"""
    r"""(?:\?[^"'\x60\s<>]*)?(?:#[^"'\x60\s<>]*)?)"""
    r"""(?P=quote)""",
    re.IGNORECASE,
)


def release_version() -> str:
    for name in (
        "OMEGA_ASSET_VERSION",
        "OMEGA_RELEASE_SHA",
        "CF_PAGES_COMMIT_SHA",
        "VERCEL_GIT_COMMIT_SHA",
        "GITHUB_SHA",
    ):
        candidate = os.environ.get(name, "").strip().lower()
        if re.fullmatch(r"[0-9a-f]{7,40}", candidate):
            return candidate[:12]

    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=ROOT,
            check=True,
            capture_output=True,
            text=True,
        )
        candidate = result.stdout.strip().lower()
        if re.fullmatch(r"[0-9a-f]{7,40}", candidate):
            return candidate[:12]
    except (OSError, subprocess.CalledProcessError):
        pass

    digest = hashlib.sha256()
    for path in sorted(PUBLIC.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS:
            digest.update(path.relative_to(PUBLIC).as_posix().encode("utf-8"))
            digest.update(path.read_bytes())
    return digest.hexdigest()[:12]


def is_deployed_local_asset(url: str, source_file: Path) -> bool:
    if not url or chr(36) + "{" in url:
        return False
    parts = urlsplit(url)
    if not parts.path or Path(parts.path).suffix.lower() not in ASSET_EXTENSIONS:
        return False

    if parts.scheme or parts.netloc:
        if os.environ.get("OMEGA_ASSET_VERSION_ABSOLUTE") != "1":
            return False
        if parts.scheme and parts.scheme.lower() not in {"http", "https"}:
            return False
        if parts.netloc.lower() not in SAME_ORIGIN_HOSTS:
            return False
        candidate = (PUBLIC / unquote(parts.path).lstrip("/")).resolve()
    else:
        raw_path = unquote(parts.path)
        if raw_path.startswith("/"):
            candidate = (PUBLIC / raw_path.lstrip("/")).resolve()
        else:
            candidate = (source_file.parent / raw_path).resolve()

    try:
        candidate.relative_to(PUBLIC)
    except ValueError:
        return False
    return candidate.is_file()


def version_url(url: str, source_file: Path, version: str) -> str:
    if not is_deployed_local_asset(url, source_file):
        return url
    parts = urlsplit(url)
    query = [
        (key, value)
        for key, value in parse_qsl(parts.query, keep_blank_values=True)
        if key.lower() != "v"
    ]
    query.append(("v", version))
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(query), parts.fragment))


def rewrite_file(path: Path, version: str) -> int:
    try:
        content = path.read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return 0

    changes = 0

    def replace_match(match: re.Match[str]) -> str:
        nonlocal changes
        old_url = match.group("url")
        new_url = version_url(old_url, path, version)
        if new_url != old_url:
            changes += 1
        return match.group(0).replace(old_url, new_url, 1)

    # Dynamic script.src/import() strings and static CSS/JS references.
    content = STRING_RE.sub(replace_match, content)
    # Explicit HTML asset attributes; reprocessing an already versioned URL is
    # idempotent because the existing v= parameter is replaced, not duplicated.
    content = ATTRIBUTE_RE.sub(replace_match, content)
    if changes:
        path.write_text(content, encoding="utf-8")
    return changes


def main() -> int:
    if not PUBLIC.is_dir():
        print(f"ASSET_VERSION=FAIL public_directory_missing={PUBLIC}")
        return 1

    version = release_version()
    files = 0
    references = 0
    for path in sorted(PUBLIC.rglob("*")):
        if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS:
            changed = rewrite_file(path, version)
            if changed:
                files += 1
                references += changed

    unversioned = []
    for path in sorted(PUBLIC.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in TEXT_EXTENSIONS:
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError):
            continue
        found = set()
        for pattern in (STRING_RE, ATTRIBUTE_RE):
            for match in pattern.finditer(content):
                url = match.group("url")
                if not is_deployed_local_asset(url, path):
                    continue
                query = parse_qsl(urlsplit(url).query, keep_blank_values=True)
                if not any(key.lower() == "v" and value == version for key, value in query):
                    found.add(url)
        unversioned.extend((path.relative_to(PUBLIC).as_posix(), url) for url in sorted(found))

    print(f"ASSET_VERSION={version}")
    print(f"ASSET_VERSIONED_FILES={files}")
    print(f"ASSET_REFERENCES_VERSIONED={references}")
    print(f"ASSET_REFERENCES_UNVERSIONED={len(unversioned)}")
    for path, url in unversioned[:10]:
        print(f"ASSET_VERSION=FAIL unversioned_reference={path}:{url}")
    return 1 if unversioned else 0


if __name__ == "__main__":
    if any(arg in {"-h", "--help"} for arg in sys.argv[1:]):
        print(__doc__ or "")
        raise SystemExit(0)
    raise SystemExit(main())
