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

for dir in assets static images img icons media fonts audio video css js '.well-known'; do
  if [ -d "$dir" ]; then
    cp -R "$dir" public/
  fi
done

[ -s public/index.html ] || { echo 'VERCEL_BUILD=FAIL missing public/index.html'; exit 1; }

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
