#!/usr/bin/env bash
# Ω SYD OMEGA 91717 — Vercel production build gate
#
# Vercel is currently the available execution plane while GitHub Actions is
# account-level runner blocked. A successful deployment must therefore prove
# the same deterministic source gates before static output is published.
#
# This is intentionally source-only: no credentials, network calls, or live
# database assumptions are required. GitHub Actions remains the authoritative
# merge gate when runners are available again.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

printf '\nΩ VERCEL PRODUCTION GATE\n'
printf '%s\n' '────────────────────────────────────────────────────────'

run() {
  local name="$1"; shift
  printf '\n▶ %s\n' "$name"
  "$@"
}

# Keep the Vercel gate aligned with the repository's local blocking CI suite.
run 'Repository CI contract' ./scripts/ci-local.sh
ci_status=$?
if [ "$ci_status" -ne 0 ]; then
  echo 'Vercel build blocked: repository CI contract failed.'
  exit "$ci_status"
fi

# The two production-specific GitHub gates are also executed here so a Vercel
# deployment cannot become the only green signal while Actions is unavailable.
run 'Production contract' python3 scripts/production-contract.py
contract_status=$?
if [ "$contract_status" -ne 0 ]; then
  echo 'Vercel build blocked: production contract failed.'
  exit "$contract_status"
fi

run 'Capability evidence contract' python3 scripts/capability-audit.py --check
evidence_status=$?
if [ "$evidence_status" -ne 0 ]; then
  echo 'Vercel build blocked: capability evidence contract failed.'
  exit "$evidence_status"
fi

printf '\n%s\n' '────────────────────────────────────────────────────────'
printf 'Ω VERCEL PRODUCTION GATE: PASS\n'
printf 'Static output may be published.\n'
exit 0
