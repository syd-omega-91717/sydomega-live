#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

printf '\nΩ VERCEL STATIC BUILD\n'
printf '%s\n' '────────────────────────────────────────────────────────'

# The repository is a framework-free static site. GitHub Actions performs the
# source/contract gates; this Vercel build step has one responsibility: emit a
# non-empty public artifact for the configured Vercel output directory.
rm -rf public
mkdir -p public

find . -maxdepth 1 -type f \
  \( -name '*.html' -o -name '*.css' -o -name '*.js' -o -name '*.json' \
     -o -name '*.svg' -o -name '*.ico' -o -name '*.png' -o -name '*.jpg' \
     -o -name '*.jpeg' -o -name '*.webp' -o -name '*.gif' -o -name '*.avif' \
     -o -name '*.webmanifest' -o -name '*.xml' -o -name '*.woff' -o -name '*.woff2' \
     -o -name '*.ttf' -o -name '*.otf' -o -name '*.mp3' -o -name '*.wav' \
     -o -name '*.mp4' -o -name '*.webm' \) \
  ! -name 'vercel.json' ! -name 'package.json' \
  -exec cp -f '{}' public/ \;

for dir in vendor i18n assets static images img icons media fonts audio video css js '.well-known'; do
  if [ -d "$dir" ]; then
    cp -R "$dir" public/
  fi
done

[ -s public/index.html ] || { echo 'VERCEL_BUILD=FAIL missing public/index.html'; exit 1; }

# The directory list above is an allow-list, so a web directory that is not on
# it is dropped from the deployment in silence. That already happened: vendor/
# was absent, so /vendor/supabase-js.js -- loaded by 127 pages, and the module
# every gated page needs before it renders anything -- 404'd in production
# while this script printed VERCEL_BUILD=PASS. A build that reports success on
# an artifact the site cannot run is the same defect class as a routing gate
# that checks a config key instead of a real fetch (CLAUDE.md 8.4).
#
# So the emitted tree now checks itself: every absolute local asset path that
# appears in a shipped file must resolve inside public/. A future top-level
# directory that nothing copies fails the build here instead of reaching the
# alias. Written in grep/sed rather than Python on purpose -- .vercelignore
# excludes *.py, so a Python helper is not part of the deployment input.
missing_refs=0
ref_list="$(grep -rhoE "[\"'(]/[A-Za-z0-9_][A-Za-z0-9._/-]*\\.(js|css|json|html|svg|png|jpg|jpeg|webp|gif|avif|ico|woff|woff2|ttf|otf|mp3|wav|mp4|webm|webmanifest|xml)" \
  --include='*.html' --include='*.js' --include='*.css' --include='*.json' --include='*.webmanifest' \
  public 2>/dev/null | sed 's/^.//' | sort -u || true)"

while IFS= read -r ref; do
  [ -n "${ref}" ] || continue
  # /_vercel/* is injected by the platform at the edge, not built from the repo.
  case "${ref}" in /_vercel/*) continue ;; esac
  if [ ! -f "public${ref}" ]; then
    echo "VERCEL_BUILD=FAIL unreachable_asset=${ref}"
    missing_refs=$((missing_refs + 1))
  fi
done <<EOF
${ref_list}
EOF

# Two runtime-critical paths are built by string concatenation, so the scan
# above cannot see them. Assert them by name.
[ -f public/vendor/supabase-js.js ] || { echo 'VERCEL_BUILD=FAIL missing public/vendor/supabase-js.js'; exit 1; }
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
