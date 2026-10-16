#!/usr/bin/env bash
# Verify the public production surface after a Vercel promotion.
# This checks reachability and HTML delivery, not authenticated workflows or API correctness.
set -euo pipefail

BASE_URL="${OMEGA_PRODUCTION_BASE_URL:-https://sydomega.com}"
BASE_URL="${BASE_URL%/}"
case "$BASE_URL" in
  https://*) ;;
  *)
    echo "PRODUCTION_SMOKE=FAIL reason=base_url_must_use_https"
    exit 2
    ;;
esac
EXPECTED_HOST="${BASE_URL#https://}"
EXPECTED_HOST="${EXPECTED_HOST%%/*}"
if [[ -z "$EXPECTED_HOST" || "$EXPECTED_HOST" == *"@"* ]]; then
  echo "PRODUCTION_SMOKE=FAIL reason=invalid_base_url_host"
  exit 2
fi

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

for path in / /world.html /evidence.html; do
  url="${BASE_URL}${path}"
  meta="$(curl --silent --show-error --fail --location --proto '=https' --proto-redir '=https' --retry 5 --retry-all-errors --retry-delay 3 --connect-timeout 10 --max-time 30 --output "$tmp" --write-out '%{http_code}|%{content_type}|%{url_effective}' "$url")" || {
    echo "PRODUCTION_SMOKE=FAIL url=$url reason=request_failed"
    exit 1
  }
  IFS='|' read -r status content_type effective_url <<< "$meta"
  effective_host="${effective_url#https://}"
  effective_host="${effective_host%%/*}"
  if [[ "$effective_host" != "$EXPECTED_HOST" ]]; then
    echo "PRODUCTION_SMOKE=FAIL url=$url reason=redirect_left_expected_host expected=$EXPECTED_HOST actual=$effective_host"
    exit 1
  fi
  if [[ "$status" != 2* || "$content_type" != text/html* ]]; then
    echo "PRODUCTION_SMOKE=FAIL url=$url status=$status content_type=$content_type"
    exit 1
  fi
  if ! grep -Eiq '<!doctype[[:space:]]+html|<html([[:space:]>])' "$tmp"; then
    echo "PRODUCTION_SMOKE=FAIL url=$url reason=html_document_marker_missing"
    exit 1
  fi
  echo "PRODUCTION_SMOKE=PASS status=$status url=$effective_url"
done

echo "PRODUCTION_SMOKE=PASS base=$BASE_URL routes=3"
