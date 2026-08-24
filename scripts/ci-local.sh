#!/usr/bin/env bash
# Run the full CI suite locally, exactly as .github/workflows/ci.yml does.
#
# WHY THIS EXISTS
#
# GitHub Actions on this account has been unable to assign a runner since
# 2026-08-22 -- jobs are created and die in 2-5 seconds with runner_id 0, no
# steps array, 0 billable ms, and a completely empty check-run output. That is
# an account-level Actions quota block (this repo is private on a personal
# account, so minutes draw on the account allowance), not anything a code
# change can affect. While it lasts, nothing verifies a commit automatically.
#
# This script closes that gap. It mirrors every BLOCKING step in ci.yml, in the
# same order, and exits non-zero on the first real failure -- so a green run
# here means the same things CI would have checked are green.
#
#   ./scripts/ci-local.sh          # blocking steps only (what gates a merge)
#   ./scripts/ci-local.sh --all    # also run the advisory checks
#
# Deliberately NOT a replacement for CI: it runs on whatever is in the working
# tree, on this machine's toolchain, with no clean checkout. It is a pre-push
# gate, not a merge gate.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

RUN_ALL=0
[ "${1:-}" = "--all" ] && RUN_ALL=1

pass=0; fail=0
step() {                       # step "name" command...
  local name="$1"; shift
  printf '\n\033[1m── %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m   PASS\033[0m  %s\n' "$name"; pass=$((pass+1))
  else
    printf '\033[31m   FAIL\033[0m  %s\n' "$name"; fail=$((fail+1))
  fi
}

# ---- 1. JavaScript syntax. bg.js is loaded by nearly every page; if it does
#         not parse, the whole platform is down.
js_syntax() {
  local bad=0
  for f in *.js; do
    node --check "$f" || { echo "  syntax error: $f"; bad=1; }
  done
  return $bad
}

# ---- 4. Every page must reference only files that exist.
broken_assets() {
  local missing=0
  for page in *.html; do
    local assets
    assets=$(grep -oE '(src|href)="/[^"#?:]+\.(js|css|png|jpg|svg|ico|webp|mp4)"' "$page" \
             | sed -E 's/.*"\/(.*)"/\1/' | sort -u)
    for asset in $assets; do
      [ -e "$asset" ] || { echo "  $page -> missing $asset"; missing=$((missing+1)); }
    done
  done
  [ "$missing" -eq 0 ]
}

# ---- 5. A service_role key in client code would be a full data breach.
service_role_scan() {
  if grep -rIn --include='*.js' --include='*.html' --include='*.json' \
       -e 'service_role' -e 'SUPABASE_SERVICE' . ; then
    echo "  service_role reference found in client code"
    return 1
  fi
  return 0
}

# ---- 7. sw.js precache list vs. files that actually exist.
sw_precache() {
  local bad=0 assets
  assets=$(node -e "
    const src = require('fs').readFileSync('sw.js','utf8');
    const m = src.match(/var CORE_ASSETS\s*=\s*\[([\s\S]*?)\]/);
    if(!m) process.exit(0);
    (m[1].replace(/\/\/[^\n]*/g,'').match(/'([^']+)'/g)||[])
      .forEach(a => console.log(a.replace(/'/g,'')));
  ") || return 1
  for asset in $assets; do
    [ -e "${asset#/}" ] || { echo "  sw.js precache references missing $asset"; bad=1; }
  done
  return $bad
}

# ---- 8. manifest.json icon paths exist.
manifest_icons() {
  node -e "
    const fs = require('fs');
    const m = JSON.parse(fs.readFileSync('manifest.json','utf8'));
    const icons = [...(m.icons||[]), ...(m.shortcuts||[]).flatMap(s=>s.icons||[])];
    let bad = 0;
    icons.forEach(i => {
      if(!fs.existsSync(i.src.replace(/^\//,''))){ console.log('  missing icon ' + i.src); bad = 1; }
    });
    process.exit(bad);
  "
}

printf '\033[1mLocal CI — mirroring .github/workflows/ci.yml blocking steps\033[0m\n'

step "1.  JavaScript syntax"            js_syntax
step "1b. Inline <script> syntax"       python3 scripts/check-inline-js.py
step "2.  Repository audit"             python3 scripts/audit.py
step "2b. Audit tooling self-tests"     python3 -m unittest discover -s scripts/tests
step "2g. TypeScript types from schema" python3 scripts/types-from-schema.py
step "2h. Context budget"               python3 scripts/context-budget.py
step "4.  Broken local asset refs"      broken_assets
step "5.  Service-role key scan"        service_role_scan
step "7.  Service worker precache"      sw_precache
step "8.  PWA manifest icons"           manifest_icons

if [ "$RUN_ALL" -eq 1 ]; then
  printf '\n\033[1m── advisory (never blocks a merge) ─────────────────────────\033[0m\n'
  for s in schema-dictionary rls-auditor silent-failure-detector \
           migration-consistency upsert-conflict-check; do
    printf '\n\033[1m── %s (advisory)\033[0m\n' "$s"
    python3 "scripts/$s.py" || true
  done
fi

printf '\n══════════════════════════════════════════════════════════\n'
if [ "$fail" -eq 0 ]; then
  printf '\033[32m  ALL %d BLOCKING CHECKS PASSED\033[0m\n' "$pass"
  printf '══════════════════════════════════════════════════════════\n'
  exit 0
fi
printf '\033[31m  %d BLOCKING CHECK(S) FAILED\033[0m (%d passed)\n' "$fail" "$pass"
printf '══════════════════════════════════════════════════════════\n'
exit 1
