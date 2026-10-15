#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

printf '\nΩ VERCEL STATIC BUILD — COMPLETE SURFACE\n'
printf '%s\n' '────────────────────────────────────────────────────────'

# Framework-free static build: publish the complete web artifact, preserving
# nested application pages instead of silently dropping them from public/.
rm -rf public
mkdir -p public

# Copy every web-deliverable asset recursively while excluding source-control,
# dependency, test, build-output and server-only material. This is deliberately
# extension-based so application pages under frontend/, web/, root/, etc. are
# shipped exactly where their absolute /... links expect them.
find . -type f \
  \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' \
     -o -name '*.svg' -o -name '*.ico' -o -name '*.png' -o -name '*.jpg' \
     -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' -o -name '*.avif' \
     -o -name '*.webmanifest' -o -name '*.xml' -o -name '*.woff' -o -name '*.woff2' \
     -o -name '*.ttf' -o -name '*.otf' -o -name '*.mp3' -o -name '*.wav' \
     -o -name '*.mp4' -o -name '*.webm' \) \
  ! -path './public/*' \
  ! -path './.git/*' \
  ! -path './node_modules/*' \
  ! -path './tests/*' \
  ! -path './scripts/*' \
  ! -path './.claude/*' \
  ! -path './supabase/*' \
  ! -path './core/*' \
  ! -path './docs/*' \
  ! -path './config/omega-implementation-ledger.json' \
  ! -path './config/*' \
  ! -path './vendor/*' \
  ! -path './i18n/*' \
  ! -name 'vercel.json' ! -name 'package.json' \
  -print0 | while IFS= read -r -d '' file; do
    target="public/${file#./}"
    mkdir -p "$(dirname "$target")"
    cp -f "$file" "$target"
  done

[ -s public/index.html ] || { echo 'VERCEL_BUILD=FAIL missing public/index.html'; exit 1; }

# Enhance emitted HTML before resolving runtime config references. The enhancer
# injects shared runtime scripts into pages; those scripts can introduce
# /config/*.json dependencies. Resolving config references before this step
# silently omitted those dependencies from public/ and made failover validation
# fail (or left pages broken) even though the canonical Vercel build could pass.
if command -v node >/dev/null 2>&1 && [ -f scripts/vercel-build-enhance.mjs ]; then
  node scripts/vercel-build-enhance.mjs
fi

# config/ is internal (security policies, migration provenance, live-runtime
# evidence: 68 files) except the handful a shipped module fetches at runtime.
# Ship exactly those -- derived from the references in the emitted tree, so a
# new runtime fetch ships itself and nothing else leaks. The unreachable-asset
# scan below still fails the build if a referenced config file is missing.
{ grep -rhoE "/config/[A-Za-z0-9._-]+\.json" --include='*.html' --include='*.js' public 2>/dev/null || true; } \
  | sort -u | while IFS= read -r cfg; do
    [ -f ".${cfg}" ] || continue
    mkdir -p "public/config"
    cp -f ".${cfg}" "public${cfg}"
  done
# Plus the files published by contract (config/public-config.txt: one name per line, # comments).
{ [ -f config/public-config.txt ] && grep -vE '^[[:space:]]*(#|$)' config/public-config.txt || true; } | while IFS= read -r cfg; do
  [ -f "config/${cfg}" ] || { echo "VERCEL_BUILD=FAIL public-config.txt names missing config/${cfg}"; exit 1; }
  mkdir -p public/config
  cp -f "config/${cfg}" "public/config/${cfg}"
done
# `| while` runs in a subshell, so its exit 1 cannot fail this script: re-assert here.
if [ -f config/public-config.txt ]; then
  for cfg in $(grep -vE '^[[:space:]]*(#|$)' config/public-config.txt); do
    [ -s "public/config/${cfg}" ] || { echo "VERCEL_BUILD=FAIL public-config.txt names missing config/${cfg}"; exit 1; }
  done
fi
# A published config file can reference another (the runtime manifest names the
# object model). Follow /config/ references out of public/config until none are new.
for _pass in 1 2 3 4 5; do
  added=0
  for cfg in $( { grep -rhoE "/config/[A-Za-z0-9._-]+\.json" public/config 2>/dev/null || true; } | sort -u); do
    [ -f "public${cfg}" ] && continue
    [ -f ".${cfg}" ] || continue
    cp -f ".${cfg}" "public${cfg}"; added=1
  done
  [ "${added}" -eq 1 ] || break
done
[ ! -e "public/config/omega-implementation-ledger.json" ] || { echo 'VERCEL_BUILD=FAIL internal_ledger_exposed'; exit 1; }

# Copy directories that cannot be copied by the extension-based find above.
for dir in vendor i18n; do
  [ -d "${dir}" ] || continue
  cp -r "${dir}" "public/${dir}"
done

# The emitted tree must be self-contained. This catches dropped directories,
# renamed assets, and broken absolute local references before Vercel publishes.
missing_refs=0
ref_list="$(grep -rhoE "[\"'(]/[A-Za-z0-9_][A-Za-z0-9._/-]*\\.(js|css|json|html|svg|png|jpg|jpeg|webp|gif|avif|ico|woff|woff2|ttf|otf|mp3|wav|mp4|webm|webmanifest|xml)" \
  --include='*.html' --include='*.js' --include='*.css' --include='*.json' --include='*.webmanifest' \
  public 2>/dev/null | sed 's/^.//' | sort -u || true)"

while IFS= read -r ref; do
  [ -n "${ref}" ] || continue
  case "${ref}" in /_vercel/*) continue ;; esac
  if [ ! -f "public${ref}" ]; then
    echo "VERCEL_BUILD=FAIL unreachable_asset=${ref}"
    missing_refs=$((missing_refs + 1))
  fi
done <<EOF
${ref_list}
EOF

# Runtime-critical paths are sometimes assembled dynamically and cannot be
# discovered by the static reference scan above.
# Every vendored bundle is fetched at runtime by a URL this scan cannot see:
# omega-oss.js builds its <script src> from a registry object, omega-realm.js
# import()s a variable. Naming only supabase-js.js here left the other seven
# unasserted -- and a vendored file absent from production is exactly the
# 404-on-127-pages failure this allow-list exists to prevent. Assert the
# whole directory instead of one member of it.
# Every FILE under vendor/, not just *.js: leaflet.css is fetched by a <link>
# this scan cannot see either, and vendor/images/*.png are referenced from
# inside that CSS by url(images/...) -- a CSS url() is invisible to the HTML/JS
# reference scan above, so those five PNGs had no assertion at all.
find vendor -type f 2>/dev/null | while IFS= read -r vendored; do
  [ -f "public/${vendored}" ] || { echo "VERCEL_BUILD=FAIL missing public/${vendored}"; exit 1; }
done
# `find | while` runs the loop in a subshell, so its exit 1 cannot fail this
# script. Re-assert the count in the parent shell.
vendor_src="$(find vendor -type f 2>/dev/null | wc -l | tr -d ' ')"
vendor_out="$(find public/vendor -type f 2>/dev/null | wc -l | tr -d ' ')"
[ "${vendor_src}" -eq "${vendor_out}" ] || {
  echo "VERCEL_BUILD=FAIL vendor files src=${vendor_src} public=${vendor_out}"; exit 1; }
for lang_pack in i18n/*.json; do
  [ -e "${lang_pack}" ] || break
  [ -f "public/${lang_pack}" ] || { echo "VERCEL_BUILD=FAIL missing public/${lang_pack}"; exit 1; }
done

[ "${missing_refs}" -eq 0 ] || { echo "VERCEL_BUILD=FAIL unreachable_assets=${missing_refs}"; exit 1; }



html_count="$(find public -type f -name '*.html' | wc -l | tr -d ' ')"
js_count="$(find public -type f -name '*.js' | wc -l | tr -d ' ')"
css_count="$(find public -type f -name '*.css' | wc -l | tr -d ' ')"
[ "${html_count}" -gt 0 ] || { echo 'VERCEL_BUILD=FAIL no_html'; exit 1; }

echo 'VERCEL_BUILD=PASS'
echo 'output=public'
echo "html=${html_count}"
echo "js=${js_count}"
echo "css=${css_count}"
exit 0
