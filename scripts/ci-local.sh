#!/usr/bin/env bash
# Run the repository's deterministic production verification suite locally.
#
# A local pass is execution evidence, never a fabricated GitHub Actions pass.
# GitHub remains the authoritative merge gate when its runners are available.

case "${1:-}" in
  --help|-h)
    cat <<'OMEGA_HELP'
Run the complete deterministic production verification suite locally.

Usage: scripts/ci-local.sh [--all] [--help]

  (no flags)  run every blocking repository contract
  --all       also run advisory checks
  --help      show this text
OMEGA_HELP
    exit 0
    ;;
esac

set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

RUN_ALL=0
[ "${1:-}" = "--all" ] && RUN_ALL=1

pass=0; fail=0
step() {
  local name="$1"; shift
  printf '\n\033[1m── %s\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32m   PASS\033[0m  %s\n' "$name"; pass=$((pass+1))
  else
    printf '\033[31m   FAIL\033[0m  %s\n' "$name"; fail=$((fail+1))
  fi
}

js_syntax() {
  local bad=0
  for f in *.js; do
    node --check "$f" || { echo "  syntax error: $f"; bad=1; }
  done
  return $bad
}

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

service_role_scan() {
  if grep -rIn --include='*.js' --include='*.html' --include='*.json' \
       -e 'service_role' -e 'SUPABASE_SERVICE' . ; then
    echo "  service_role reference found in client code"
    return 1
  fi
  return 0
}

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

printf '\033[1mLocal CI — complete production verification\033[0m\n'

step "0.   Workflow contract"                  python3 scripts/workflow-contract.py
step "0b.  Release completeness gate"          python3 scripts/release-gate.py
step "1.   JavaScript syntax"                  js_syntax
step "1b.  Inline <script> syntax"             python3 scripts/check-inline-js.py
step "2.   Repository audit"                   python3 scripts/audit.py
step "2b.  Audit tooling self-tests"           python3 -m unittest discover -s scripts/tests
step "2g.  TypeScript types from schema"       python3 scripts/types-from-schema.py
step "2h.  Context budget"                     python3 scripts/context-budget.py
step "2j.  Skill/agent registry"               python3 scripts/omega-registry.py --check
step "2k.  i18n contract"                      python3 scripts/i18n-contract.py
step "2l.  Resilience audit"                   python3 scripts/resilience-audit.py
step "2m.  Commerce contract"                  python3 scripts/commerce-contract.py
step "4.   Broken local asset refs"            broken_assets
step "5.   Service-role key scan"               service_role_scan
step "7.   Service worker precache"             sw_precache
step "8.   PWA manifest icons"                  manifest_icons
step "9.   Production contract"                 python3 scripts/production-contract.py
step "10.  Capability evidence contract"       python3 scripts/capability-audit.py --check
step "10b. Capability registry JSON"            python3 -m json.tool docs/capabilities/registry.json >/dev/null
step "11.  Production JavaScript syntax"       js_syntax

if [ "$RUN_ALL" -eq 1 ]; then
  printf '\n\033[1m── advisory (never blocks a merge) ─────────────────────────\033[0m\n'
  for s in schema-dictionary rls-auditor silent-failure-detector \
           migration-consistency upsert-conflict-check; do
    printf '\n\033[1m── %s (advisory)\033[0m\n' "$s"
    python3 "scripts/$s.py" || true
  done
  printf '\n\033[1m── runtime verification (advisory; needs playwright-core + Chrome)\033[0m\n'
  node scripts/verify-runtime.js || true
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
