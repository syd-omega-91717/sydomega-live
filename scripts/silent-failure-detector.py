#!/usr/bin/env python3
"""
Silent failure detector.

Scans all .html/.js files for .insert()/.update()/.upsert()/.rpc() calls
that don't check .error before showing success or mutating state.

This catches the root cause of ~15 bugs in this repo's history where writes
silently failed while the UI reported success.

Exit code 0 if clean, 1 if findings.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import os
import re
import sys
from pathlib import Path

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

# ============================================================================
# SILENT FAILURE DETECTION
# ============================================================================

def find_unchecked_writes():
    """Find Supabase write calls that don't check .error."""
    findings = []

    # Patterns to find write operations
    write_patterns = [
        (r"\.insert\s*\(", "insert"),
        (r"\.update\s*\(", "update"),
        (r"\.upsert\s*\(", "upsert"),
        (r"\.rpc\s*\(", "rpc"),
    ]

    for html_file in Path(".").glob("*.html"):
        findings.extend(_check_file(html_file, write_patterns))

    for js_file in Path(".").glob("**/*.js"):
        findings.extend(_check_file(js_file, write_patterns))

    return findings


def _check_file(file_path, patterns):
    """Check a single file for unchecked writes."""
    findings = []

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    for pattern, op_type in patterns:
        for match in re.finditer(pattern, content):
            call_start = match.start()
            line_num = content[:call_start].count("\n") + 1

            # Get the context around this call (next 500 chars)
            context_start = match.start()
            context_end = min(match.end() + 500, len(content))
            context = content[context_start:context_end]

            # Check if this looks like a try/catch wrapped call (passes)
            lines_before = content[:call_start].split("\n")
            if len(lines_before) >= 2:
                line_before = lines_before[-2].strip()
                if "try" in line_before or "try" in lines_before[-1]:
                    # Check if there's a catch block after this call
                    after_call = content[match.end():]
                    if re.search(r"\.catch\s*\(", after_call[:200], re.IGNORECASE):
                        # Has try/catch, likely safe
                        continue

            # Look for error checking patterns after this call
            error_patterns = [
                r"\.error",
                r"\?.error",  # optional chaining
                r"if\s*\(\s*!?error",
                r"if\s*\(\s*!?result\.error",
            ]

            has_error_check = False
            for error_pattern in error_patterns:
                if re.search(error_pattern, context[:300], re.IGNORECASE):
                    has_error_check = True
                    break

            # Also check for catch after rpc
            if op_type == "rpc" and re.search(r"\.catch\s*\(", context[:200], re.IGNORECASE):
                has_error_check = True

            # Get the actual call text (up to the closing paren)
            call_match = re.match(r"(\.(?:insert|update|upsert|rpc)\s*\([^)]*\))", context)
            call_text = call_match.group(1) if call_match else context[:50]

            if not has_error_check:
                findings.append({
                    "file": str(file_path),
                    "line": line_num,
                    "op_type": op_type,
                    "call": call_text.strip(),
                })

    return findings


# ============================================================================
# MAIN
# ============================================================================

def main():
    """Scan for unchecked write operations."""
    print("Scanning for .insert()/.update()/.upsert()/.rpc() calls without .error checks...")
    findings = find_unchecked_writes()

    if not findings:
        print("OK — every write operation checks .error (or is try/catch wrapped).")
        return 0

    # Filter out known safe patterns (best-effort updates with no UI feedback)
    filtered_findings = []
    for f in findings:
        # Skip if the call is clearly marked as best-effort
        if "best-effort" in f["call"].lower() or "silent" in f["call"].lower():
            continue
        filtered_findings.append(f)

    if not filtered_findings:
        print("OK — all potentially-problematic writes have appropriate guards.")
        return 0

    print(f"\nFOUND {len(filtered_findings)} UNCHECKED WRITE(S):")
    for f in filtered_findings:
        print(f"  {f['file']}:{f['line']} — {f['op_type']} call does not check .error:")
        print(f"    {f['call']}")
        print(f"    Risk: UI may show success while write silently failed (data integrity issue)")

    return 1


if __name__ == "__main__":
    sys.exit(main())
