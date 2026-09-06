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

# The extension list below describes the ROOT web surface, and must only be
# applied to files AT the root. A bash `case` glob matches the whole string, so
# an unanchored `*.js` also matches `scripts/verify-runtime.js`, and `*.json`
# matches `docs/capabilities/registry.json`, `supabase/live-schema.json` and
# `package.json`. None of those reach the artifact: scripts/vercel-build.sh
# copies root files at -maxdepth 1 plus a fixed directory allow-list, and
# supabase/ and *.py are excluded by .vercelignore outright. Deploying for them
# rebuilt a byte-identical site and spent a deployment doing it -- which is not
# free: this project hit Vercel's "api-deployments-free-per-day" limit (>100 in
# one day) on 2026-09-06. Anchor by testing for a path separator first.

while IFS= read -r path; do
  [ -n "$path" ] || continue

  # Vercel deployment contract itself -- these DO change the artifact.
  case "$path" in
    vercel.json|.vercelignore|scripts/vercel-build.sh|scripts/vercel-ignore-build.sh)
      exit 1 ;;
  esac

  # Runtime/static asset trees copied by vercel-build.sh, matched at any depth.
  case "$path" in
    vendor/*|i18n/*|assets/*|static/*|images/*|img/*|icons/*|media/*|fonts/*|audio/*|video/*|css/*|js/*|.well-known/*)
      exit 1 ;;
  esac

  # Root web surface only: skip anything containing a directory separator.
  case "$path" in
    */*) continue ;;
  esac

  # scripts/vercel-build.sh copies every root file EXCEPT these two, so a
  # change to package.json cannot alter the artifact (installCommand is ""
  # so dependencies are never installed either). vercel.json is handled
  # above and DOES deploy, because it changes headers, redirects and the
  # build contract even though it is not copied.
  case "$path" in
    package.json) continue ;;
  esac
  case "$path" in
    *.html|*.css|*.js|*.json|*.svg|*.ico|*.png|*.jpg|*.jpeg|*.webp|*.gif|*.avif|*.webmanifest|*.xml|*.woff|*.woff2|*.ttf|*.otf|*.mp3|*.wav|*.mp4|*.webm)
      exit 1 ;;
  esac
done <<< "$changed"

# No web-facing change: Vercel should skip the build and preserve the current
# production deployment. This is intentional and prevents CI/database churn
# from consuming Vercel build capacity.
exit 0
