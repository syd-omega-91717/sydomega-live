#!/usr/bin/env bash
# Controlled, headless Strix security execution for an explicitly supplied staging target.
# This script never deploys, never changes Supabase, and refuses obvious production targets.
set -euo pipefail

usage() {
  cat <<'OMEGA_HELP'
Run an authorized Strix pentest against a staging target.

Usage:
  scripts/strix-staging-run.sh <staging-url> [quick|standard|deep] [max-budget-usd]

Required environment:
  STRIX_LLM       LiteLLM model id, for example openai/gpt-5.4
  LLM_API_KEY     Provider API key; never commit or print it

Prerequisites:
  docker, strix

Safety:
  The target must be an HTTP(S) URL and must contain a staging/test/nonprod
  marker. Production-looking hosts such as www.sydomega.com are rejected.

Target authorization:
  The host must be BOTH inside an owned zone AND marked as non-production.
  Owned zones are localhost, 127.0.0.1 and *.sydomega.com. Any other host --
  a third party, a Vercel preview URL -- must be named explicitly in
  OMEGA_STRIX_ALLOW_HOST, which is a deliberate act of authorization.

  The non-production marker is matched as a WHOLE leftmost DNS label, never as
  a substring: "test.sydomega.com" is a staging host, "latest.sydomega.com" is
  not one and is rejected.

Exit codes mirror Strix:
  0 = completed with no validated vulnerabilities in analyzed scope
  2 = validated vulnerabilities found
  1 = execution/configuration failure
  64 = usage or target-authorization error (never confused with 2)
OMEGA_HELP
}

# Usage errors exit 64 (EX_USAGE), NOT 2. Exit 2 is this script's "validated
# vulnerabilities found" signal, so a mistyped argument returning 2 would report
# a security finding that does not exist to anything reading the exit code.
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then usage; exit 0; fi
if [[ $# -lt 1 || $# -gt 3 ]]; then usage >&2; exit 64; fi

target="$1"
mode="${2:-standard}"
budget="${3:-20}"

case "$mode" in quick|standard|deep) ;; *) echo "ERROR: scan mode must be quick, standard, or deep" >&2; exit 64 ;; esac
[[ "$budget" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "ERROR: max budget must be numeric" >&2; exit 64; }
[[ "$target" =~ ^https?:// ]] || { echo "ERROR: target must be an HTTP(S) URL" >&2; exit 64; }

host="${target#*://}"; host="${host%%/*}"; host="${host%%:*}"
host="$(printf '%s' "$host" | tr '[:upper:]' '[:lower:]')"

# Two independent conditions, both required. Either one alone has been shown to
# pass a target that must never be scanned.
#
#   ZONE   -- is this host ours to test at all? Scanning infrastructure you do
#             not own is not a configuration mistake, it is unauthorized access.
#   MARKER -- within our own zone, is this the non-production instance?
#
# Both were previously matched with unanchored globs, and both failed:
#
#   [[ "$host" == "*.sydomega.com" ]]   the pattern is QUOTED, so it is a
#     literal string, not a glob. It matched only a host named, verbatim,
#     "*.sydomega.com". Every real subdomain walked straight past it.
#
#   [[ "$host" != *test* ]]             substring, not label. "test" occurs
#     inside "latest", so latest.sydomega.com -- a plausible production alias --
#     was accepted as a staging host. So was evil-test.attacker.example, a
#     third party we have no authorization to touch whatsoever.
#
# Verified: guard-cases.txt in this directory is the table both versions were
# run against; the old one accepted 3 targets it names as must-reject.

NONPROD_LABELS='staging stage nonprod non-prod test testing preview dev qa uat sandbox'

is_owned_zone=0
case "$host" in
  localhost|127.0.0.1|::1)             is_owned_zone=1 ;;
  sydomega.com|www.sydomega.com)       is_owned_zone=0 ;;   # the apex IS production
  *.sydomega.com)                      is_owned_zone=1 ;;   # unquoted -> a real glob
esac
# Anything else is a third party (or a preview URL on a shared host such as
# vercel.app) and needs the operator to name it, exactly, on purpose.
if [[ $is_owned_zone -eq 0 && -n "${OMEGA_STRIX_ALLOW_HOST:-}" && "$host" == "${OMEGA_STRIX_ALLOW_HOST,,}" ]]; then
  is_owned_zone=1
  echo "OMEGA_STRIX_AUTHORIZED_BY=OMEGA_STRIX_ALLOW_HOST" >&2
fi
if [[ $is_owned_zone -eq 0 ]]; then
  echo "ERROR: target host is not an authorized OMEGA test zone: $host" >&2
  echo "       Owned zones: localhost, 127.0.0.1, *.sydomega.com (the apex and www are production)." >&2
  echo "       To authorize any other host, set OMEGA_STRIX_ALLOW_HOST to it exactly." >&2
  echo "       Do not do so for infrastructure you do not own or have written permission to test." >&2
  exit 64
fi

# Whole-label match. localhost/127.0.0.1 are self-evidently non-production.
has_marker=0
case "$host" in localhost|127.0.0.1|::1) has_marker=1 ;; esac
if [[ $has_marker -eq 0 ]]; then
  IFS='.' read -r -a _labels <<< "$host"
  for _l in "${_labels[@]}"; do
    for _m in $NONPROD_LABELS; do
      [[ "$_l" == "$_m" ]] && { has_marker=1; break 2; }
    done
  done
fi
if [[ $has_marker -eq 0 ]]; then
  echo "ERROR: target host does not identify a controlled non-production environment: $host" >&2
  echo "       One whole DNS label must be one of: $NONPROD_LABELS" >&2
  echo "       (matched as a label, not a substring -- 'latest' is not 'test')" >&2
  exit 64
fi

command -v docker >/dev/null 2>&1 || { echo "ERROR: Docker is required" >&2; exit 1; }
command -v strix >/dev/null 2>&1 || { echo "ERROR: Strix CLI is required; install it outside the repository" >&2; exit 1; }
docker info >/dev/null 2>&1 || { echo "ERROR: Docker daemon is unavailable" >&2; exit 1; }
[[ -n "${STRIX_LLM:-}" ]] || { echo "ERROR: STRIX_LLM is unset" >&2; exit 1; }
[[ -n "${LLM_API_KEY:-}" ]] || { echo "ERROR: LLM_API_KEY is unset" >&2; exit 1; }

run_stamp="$(date -u +%Y%m%dT%H%M%SZ)"
echo "OMEGA_STRIX_TARGET=$host"
echo "OMEGA_STRIX_MODE=$mode"
echo "OMEGA_STRIX_BUDGET=$budget"
echo "OMEGA_STRIX_STARTED=$run_stamp"

set +e
strix -n -t "$target" --scan-mode "$mode" --max-budget "$budget"
rc=$?
set -e

case "$rc" in
  0) echo "OMEGA_STRIX_RESULT=NO_VALIDATED_VULNERABILITIES" ;;
  2) echo "OMEGA_STRIX_RESULT=VALIDATED_VULNERABILITIES_FOUND" ;;
  *) echo "OMEGA_STRIX_RESULT=EXECUTION_FAILURE" ;;
esac

echo "OMEGA_STRIX_EXIT=$rc"
exit "$rc"
