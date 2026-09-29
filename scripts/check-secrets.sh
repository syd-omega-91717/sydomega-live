#!/usr/bin/env bash
# ============================================================================
# SYD OMEGA 91717 — check-secrets.sh
# Verifies which Supabase Edge Function secrets are configured in the live
# project before deploying. Never prints a secret value.
# ============================================================================
case "${1:-}" in
  --help|-h)
    cat <<'OMEGA_HELP'
Verify the Supabase Edge Function secrets are set before deploying.

Usage: scripts/check-secrets.sh [--help]

Reads expected secret names and reports which are missing.
It never sets, prints, or commits a secret value.
OMEGA_HELP
    exit 0
    ;;
esac

set -euo pipefail

PROJECT_REF="ydqhzvvoyufiiqvzcjns"

declare -A REQUIRED
REQUIRED["concierge"]="ANTHROPIC_API_KEY"
REQUIRED["checkout"]="STRIPE_SECRET_KEY STRIPE_PRICE_MAP SITE_URL"
REQUIRED["stripe-webhook"]="STRIPE_WEBHOOK_SECRET STRIPE_SECRET_KEY"
REQUIRED["notify-access"]="RESEND_API_KEY NOTIFY_ACCESS_WEBHOOK_SECRET"
REQUIRED["market-price"]="TWELVE_DATA_API_KEY"
# intel-feed uses only Hacker News public API — no secrets required

echo "=============================================================="
echo "SYD OMEGA 91717 — Edge Function secrets check"
echo "Project: $PROJECT_REF"
echo "=============================================================="
echo

if ! configured=$(supabase secrets list --project-ref "$PROJECT_REF" 2>&1); then
  echo "  ERROR: could not list secrets. Make sure you are logged in:"
  echo "    supabase login"
  echo "    supabase link --project-ref $PROJECT_REF"
  exit 1
fi

ok=0
missing=0

for fn in "${!REQUIRED[@]}"; do
  echo "--- supabase/functions/$fn ---"
  for secret in ${REQUIRED[$fn]}; do
    if echo "$configured" | grep -q "^$secret"; then
      echo "  OK       $secret"
      ((ok++))
    else
      echo "  MISSING  $secret"
      ((missing++))
    fi
  done
  echo
done

echo "=============================================================="
echo "  configured: $ok    missing: $missing"
echo
if [ "$missing" -gt 0 ]; then
  echo "  Set missing secrets through the Supabase secret manager."
  echo "  Never commit secret values to the repository."
fi
