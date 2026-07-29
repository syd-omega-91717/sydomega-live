#!/usr/bin/env bash
# ============================================================================
# SYD OMEGA 91717 — remove unreachable files from the deploy root.
# Audit finding F-4. Run from the repository root.
#
#   ./scripts/cleanup_dead_files.sh            # dry run, shows what it would do
#   ./scripts/cleanup_dead_files.sh --apply    # actually removes
#
# Every file below is either (a) redirected to dashboard.html by vercel.json so
# it can never be served, or (b) a stale backup. Each is grepped for references
# before removal — nothing is deleted blind.
# ============================================================================
set -euo pipefail

APPLY=0
[ "${1:-}" = "--apply" ] && APPLY=1

DEAD=(
  "platform.jsx"                    # 88 KB React; repo has no React and no build step
  "omega.ts"                        # .ts redirected by vercel.json
  "download.ts"
  "index.ts"
  "core_engine.py"                  # .py redirected by vercel.json
  "sydomega-live.py"
  "blockchain_ledger.sol"           # .sol redirected by vercel.json
  "omega-sigil.js.archive.txt"      # 26 KB stale backup in the deploy root
  "bg.js.bak"                       # patcher backup, if present
)

RELOCATE=(
  "SYD-OMEGA-Legal-IP-Brief.docx:a legal document must not sit in a public web root"
  "SYDOMEGA91717_DEMOD-1-.mp4:3.7 MB, 45% of repo size — serve from Supabase Storage or a CDN"
)

echo "=============================================================="
[ "$APPLY" -eq 1 ] && echo "CLEANUP — APPLYING" || echo "CLEANUP — DRY RUN (pass --apply to execute)"
echo "=============================================================="

for f in "${DEAD[@]}"; do
  [ -e "$f" ] || { echo "  skip    $f (not present)"; continue; }
  base="$(basename "$f")"
  refs=$(grep -rIl --exclude-dir=.git --exclude-dir=scripts \
           --exclude="$base" -F "$base" . 2>/dev/null | grep -v '\.md$' || true)
  if [ -n "$refs" ]; then
    echo "  KEEP    $f — still referenced by:"
    echo "$refs" | sed 's/^/            /'
  else
    echo "  DELETE  $f (no references found)"
    [ "$APPLY" -eq 1 ] && rm -f "$f"
  fi
done

if [ -d "__pycache__" ]; then
  echo "  DELETE  __pycache__/ (committed build artefact)"
  [ "$APPLY" -eq 1 ] && rm -rf __pycache__
fi

echo
echo "  --- RELOCATE MANUALLY (not deleted) ---"
for entry in "${RELOCATE[@]}"; do
  f="${entry%%:*}"; why="${entry#*:}"
  [ -e "$f" ] && echo "  MOVE    $f — $why"
done

echo
echo "Next: python3 scripts/audit.py && node --check bg.js"
