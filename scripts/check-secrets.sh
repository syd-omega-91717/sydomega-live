#!/usr/bin/env bash
# ============================================================================
# SYD OMEGA 91717 — check-secrets.sh
#
# Verifies which Supabase Edge Function secrets are configured in the live
# project before deploying. Run from the repository root:
#
#   ./scripts/check-secrets.sh
#
# Requires: supabase CLI logged in and project linked
#           (supabase login && supabase link --project-ref ydqhzvvoyufiiqvzcjns)
# ============================================================================
set -euo pipefail

PROJECT_REF="ydqhzvvoyufiiqvzcjns"

# --- required secrets per function ---
declare -A REQUIRED
REQUIRED["concierge"]="ANTHROPIC_API_KEY"
REQUIRED["checkout"]="STRIPE_SECRET_KEY STRIPE_PRICE_MAP SITE_URL"
REQUIRED["stripe-webhook"]="STRIPE_WEBHOOK_SECRET STRIPE_SECRET_KEY"
REQUIRED["notify-access"]="RESEND_API_KEY"
# intel-feed uses only Hacker News public API — no secrets required

echo "=============================================================="
echo "SYD OMEGA 91717 — Edge Function secrets check"
echo "Project: $PROJECT_REF"
echo "=============================================================="
echo

# Get all configured secrets
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
  echo "  Set missing secrets with:"
  echo "    supabase secrets set KEY=value --project-ref $PROJECT_REF"
  echo
  echo "  Then deploy updated functions:"
  echo "    supabase functions deploy --no-verify-jwt"
  echo
  echo "  See setup.md for RESEND_API_KEY instructions."
  echo "  See supabase/functions/stripe-webhook/index.ts for STRIPE_WEBHOOK_SECRET."
fi
