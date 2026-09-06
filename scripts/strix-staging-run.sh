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

Exit codes mirror Strix:
  0 = completed with no validated vulnerabilities in analyzed scope
  2 = validated vulnerabilities found
  1 = execution/configuration failure
OMEGA_HELP
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" || $# -lt 1 || $# -gt 3 ]]; then
  usage
  [[ $# -ge 1 && "${1:-}" != "--help" && "${1:-}" != "-h" ]] && exit 2 || exit 0
fi

target="$1"
mode="${2:-standard}"
budget="${3:-20}"

case "$mode" in quick|standard|deep) ;; *) echo "ERROR: scan mode must be quick, standard, or deep" >&2; exit 1 ;; esac
[[ "$budget" =~ ^[0-9]+([.][0-9]+)?$ ]] || { echo "ERROR: max budget must be numeric" >&2; exit 1; }
[[ "$target" =~ ^https?:// ]] || { echo "ERROR: target must be an HTTP(S) URL" >&2; exit 1; }

host="${target#*://}"; host="${host%%/*}"; host="${host%%:*}"
shopt -s nocasematch
if [[ "$host" == "www.sydomega.com" || "$host" == "sydomega.com" || "$host" == "*.sydomega.com" ]]; then
  echo "ERROR: production-looking OMEGA target rejected: $host" >&2
  exit 1
fi
if [[ "$host" != *staging* && "$host" != *stage* && "$host" != *nonprod* && "$host" != *non-prod* && "$host" != *test* && "$host" != *preview* && "$host" != localhost && "$host" != 127.0.0.1 ]]; then
  echo "ERROR: target host does not identify a controlled staging/test environment: $host" >&2
  exit 1
fi
shopt -u nocasematch

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
