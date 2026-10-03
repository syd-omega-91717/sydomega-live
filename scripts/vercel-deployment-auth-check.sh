#!/usr/bin/env bash
set -euo pipefail

: "\${VERCEL_TOKEN:?VERCEL_TOKEN is required}"
: "\${VERCEL_ORG_ID:?VERCEL_ORG_ID is required}"
: "\${VERCEL_PROJECT_ID:?VERCEL_PROJECT_ID is required}"

echo "Ω VERCEL DEPLOYMENT AUTHORITY CHECK"
echo "org=\${VERCEL_ORG_ID}"
echo "project=\${VERCEL_PROJECT_ID}"

identity="$(npx --yes vercel@59.6.0 whoami --token "\$VERCEL_TOKEN" 2>&1)" || {
  echo "VERCEL_AUTH=FAIL"
  echo "\$identity"
  echo "The deployment token is invalid, expired, revoked, or not authorized for the Vercel account."
  exit 1
}
echo "\$identity"
echo "VERCEL_AUTH=PASS"

mkdir -p .vercel
printf '{"orgId":"%s","projectId":"%s"}\n' "\$VERCEL_ORG_ID" "\$VERCEL_PROJECT_ID" > .vercel/project.json

project_info="$(npx --yes vercel@59.6.0 project inspect --token "\$VERCEL_TOKEN" 2>&1)" || {
  echo "VERCEL_PROJECT_ACCESS=FAIL"
  echo "\$project_info"
  echo "The token authenticated but cannot access the configured Vercel project."
  exit 1
}
echo "\$project_info"
echo "VERCEL_PROJECT_ACCESS=PASS"
