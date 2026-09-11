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
  ! -path './supabase/*' \
  ! -path './core/*' \
  ! -path './docs/*' \
  ! -path './vendor/*' \
  ! -path './i18n/*' \
  ! -name 'vercel.json' ! -name 'package.json' \
  -print0 | while IFS= read -r -d '' file; do
    target="public/${file#./}"
    mkdir -p "$(dirname "$target")"
    cp -f "$file" "$target"
  done

[ -s public/index.html ] || { echo 'VERCEL_BUILD=FAIL missing public/index.html'; exit 1; }

# Copy directories that cannot be copied by the extension-based find above.
# This must happen before the reachability check so vendor/ and i18n/ are present.
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
[ -f public/vendor/supabase-js.js ] || { echo 'VERCEL_BUILD=FAIL missing public/vendor/supabase-js.js'; exit 1; }
for lang_pack in i18n/*.json; do
  [ -e "${lang_pack}" ] || break
  [ -f "public/${lang_pack}" ] || { echo "VERCEL_BUILD=FAIL missing public/${lang_pack}"; exit 1; }
done

[ "${missing_refs}" -eq 0 ] || { echo "VERCEL_BUILD=FAIL unreachable_assets=${missing_refs}"; exit 1; }

if command -v node >/dev/null 2>&1 && [ -f scripts/vercel-build-enhance.mjs ]; then
  node scripts/vercel-build-enhance.mjs
fi

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
