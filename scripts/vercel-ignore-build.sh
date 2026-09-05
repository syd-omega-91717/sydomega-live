#!/usr/bin/env bash
set -euo pipefail

# Vercel Ignore Build Step contract.
# Exit 1 = deploy/build; exit 0 = skip.
# The site is a static projection of web-facing root files and the listed
# asset/runtime directories. Backend, database, CI, documentation and agent
# changes do not require a new Vercel deployment.

if ! git rev-parse --verify HEAD^ >/dev/null 2>&1; then
  exit 1
fi

changed="$(git diff --name-only HEAD^ HEAD)"

while IFS= read -r path; do
  [ -n "$path" ] || continue
  case "$path" in
    # Root web surface.
    *.html|*.css|*.js|*.json|*.svg|*.ico|*.png|*.jpg|*.jpeg|*.webp|*.gif|*.avif|*.webmanifest|*.xml|*.woff|*.woff2|*.ttf|*.otf|*.mp3|*.wav|*.mp4|*.webm)
      exit 1 ;;
    # Runtime/static asset trees copied by vercel-build.sh.
    vendor/*|i18n/*|assets/*|static/*|images/*|img/*|icons/*|media/*|fonts/*|audio/*|video/*|css/*|js/*|.well-known/*)
      exit 1 ;;
    # Vercel deployment contract itself.
    vercel.json|.vercelignore|scripts/vercel-build.sh|scripts/vercel-ignore-build.sh)
      exit 1 ;;
  esac
done <<< "$changed"

# No web-facing change: Vercel should skip the build and preserve the current
# production deployment. This is intentional and prevents CI/database churn
# from consuming Vercel build capacity.
exit 0
