#!/usr/bin/env bash
# vercel-ignore.sh -- Vercel "Ignored Build Step": skip a production build when
# the commit changes nothing that ships.
#
# WHY THIS EXISTS
#
# vercel.json used `"ignoreCommand": "exit 1"`, so EVERY push to main built and
# deployed ~85 MB / ~1,095 files -- docs-only commits, registry refreshes,
# migrations, tests, sometimes twice for one SHA. 42 production deployments in
# ~3.5 days preceded the 2026-10-06 outage, when Vercel blocked the Hobby
# account ("This deployment is temporarily paused", status "Account is
# blocked"). Most of those commits shipped no byte that differed.
#
# CONTRACT (Vercel semantics)
#
#   exit 0  -> SKIP the build   (nothing that ships changed)
#   exit 1  -> PROCEED to build (something ships, or we cannot tell)
#
# Every uncertainty builds: no previous SHA, a SHA the shallow clone lacks, a
# git error. Skipping a needed deploy is worse than one extra deploy.
#
# WHAT "SHIPS" MEANS -- mirrors scripts/vercel-build.sh, keep the two in step:
#   * build inputs: vercel.json, .vercelignore, package.json,
#     scripts/vercel-build.sh, scripts/vercel-build-enhance.mjs, this file
#   * vendor/** and i18n/** (copied whole)
#   * any file with a web extension the build copies, outside the excluded
#     trees (scripts/ supabase/ core/ docs/ tests/ .claude/ .github/ public/)
#     and not config/omega-implementation-ledger.json
#
# USAGE
#   bash scripts/vercel-ignore.sh               # as Vercel runs it
#   printf 'a.md\nb.html\n' | bash scripts/vercel-ignore.sh --classify
#       # prints SHIP/SKIP per path, exits 1 if any ships (for tests)
#   bash scripts/vercel-ignore.sh --help

set -u

if [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  sed -n '2,/^set -u/p' "$0" | sed '$d' | sed 's/^# \{0,1\}//'
  exit 0
fi

ships() {
  local p="$1"
  case "$p" in
    vercel.json|.vercelignore|package.json) return 0 ;;
    scripts/vercel-build.sh|scripts/vercel-build-enhance.mjs|scripts/vercel-ignore.sh) return 0 ;;
    vendor/*|i18n/*) return 0 ;;
    scripts/*|supabase/*|core/*|docs/*|tests/*|.claude/*|.github/*|public/*|node_modules/*) return 1 ;;
    config/omega-implementation-ledger.json) return 1 ;;
  esac
  case "$p" in
    *.html|*.css|*.js|*.json|*.svg|*.ico|*.png|*.jpg|*.jpeg|*.webp|*.gif|*.avif|\
    *.webmanifest|*.xml|*.woff|*.woff2|*.ttf|*.otf|*.mp3|*.wav|*.mp4|*.webm) return 0 ;;
  esac
  return 1
}

classify() {
  local any=1 p
  while IFS= read -r p; do
    [ -n "$p" ] || continue
    if ships "$p"; then echo "SHIP $p"; any=0; else echo "SKIP $p"; fi
  done
  # any=0 means something ships -> build (exit 1); otherwise skip (exit 0)
  [ "$any" -eq 0 ] && return 1 || return 0
}

if [ "${1:-}" = "--classify" ]; then
  classify
  exit $?
fi

prev="${VERCEL_GIT_PREVIOUS_SHA:-}"
cur="${VERCEL_GIT_COMMIT_SHA:-HEAD}"

if [ -z "$prev" ]; then
  echo "vercel-ignore: no previous deployed SHA -> build"
  exit 1
fi

# Vercel clones shallow; fetch the previous SHA if it is not here yet.
if ! git cat-file -e "${prev}^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=50 origin "$prev" 2>/dev/null || true
fi
if ! git cat-file -e "${prev}^{commit}" 2>/dev/null; then
  echo "vercel-ignore: previous SHA ${prev} unavailable -> build"
  exit 1
fi

if ! changed="$(git diff --name-only "$prev" "$cur" 2>/dev/null)"; then
  echo "vercel-ignore: git diff failed -> build"
  exit 1
fi

if [ -z "$changed" ]; then
  echo "vercel-ignore: no file changes since ${prev} -> skip"
  exit 0
fi

result="$(printf '%s\n' "$changed" | classify)"
status=$?
shipped="$(printf '%s\n' "$result" | grep -c '^SHIP ' || true)"
total="$(printf '%s\n' "$result" | grep -c . || true)"
if [ "$status" -eq 1 ]; then
  echo "vercel-ignore: ${shipped}/${total} changed file(s) ship -> build"
  printf '%s\n' "$result" | grep '^SHIP ' | head -20
  exit 1
fi
echo "vercel-ignore: 0/${total} changed file(s) ship (docs/tooling/backend only) -> skip"
exit 0
