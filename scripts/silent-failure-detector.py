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
        # vendor/ is third-party code served from this origin rather than a CDN
        # (CLAUDE.md §4). It is never edited here, so a finding in it can never
        # be acted on -- and the Supabase client's own `.rpc(e,t,n)` definition
        # was being reported as an unchecked call to itself.
        if "vendor" in js_file.parts or "node_modules" in js_file.parts:
            continue
        findings.extend(_check_file(js_file, write_patterns))

    return findings


def _strip_js_comments(src):
    """Blank out // and /* */ comments, preserving offsets and line numbers.

    Every character removed is replaced by a space and every newline kept, so
    reported line numbers stay correct. Without this the scanner matched inside
    documentation: omega-ring.js:20 is the line

        OmegaRing.update(canvas, newValue)      // animate current → newValue

    inside a /* */ block describing OmegaRing's own API -- not a Supabase call,
    and not even a real call. Same class as the SQL string literal that made
    evidence-audit.py report a relation named `as` (FIXES_LOG.md 92d).

    String literals are deliberately NOT stripped: a real call's arguments are
    strings, and blanking them would destroy the call text this reports.
    """
    out = []
    i, n = 0, len(src)
    while i < n:
        two = src[i:i + 2]
        if two == "//":
            while i < n and src[i] != "\n":
                out.append(" ")
                i += 1
        elif two == "/*":
            while i < n and src[i:i + 2] != "*/":
                out.append("\n" if src[i] == "\n" else " ")
                i += 1
            out.append("  ")
            i += 2
        elif src[i] in "\"'`":
            q = src[i]
            out.append(src[i])
            i += 1
            while i < n and src[i] != q:
                if src[i] == "\\" and i + 1 < n:
                    out.append(src[i]); out.append(src[i + 1]); i += 2
                    continue
                out.append(src[i])
                i += 1
            if i < n:
                out.append(src[i])
                i += 1
        else:
            out.append(src[i])
            i += 1
    return "".join(out)


# A write only matters if it is a Supabase call. `.update(`/`.insert(` on any
# other object is not one -- omega-confetti.js:115 is `p.update()` on a
# particle in a requestAnimationFrame loop, and was reported as a database
# write whose failure could mislead the UI.
_SB_RECEIVER = re.compile(
    r"(?:\bsb\b|supabase|__omegaSb|OmegaSB|\.from\s*\(|_client\b|admin\b)",
    re.IGNORECASE)


def _looks_like_supabase(content, call_start):
    """Is the call at call_start part of a Supabase chain?

    Looks back to the start of the statement (bounded, so an unrelated earlier
    line cannot vouch for this one) for a token that identifies the client.
    """
    back = content[max(0, call_start - 200):call_start]
    # `;` only. `{` and `}` are NOT statement boundaries here -- cutting at them
    # truncates the destructuring form this scanner most needs to read,
    # `const { error } = await sb.from(...)`, to ` = await sb.from(...)`.
    cut = back.rfind(";")
    if cut != -1:
        back = back[cut + 1:]
    return bool(_SB_RECEIVER.search(back))


# This scanner's stated risk is "UI may show success while a WRITE silently
# failed". A read that fails yields empty data, which is a different defect
# (CLAUDE.md 8.1 class 9, fabricated data rendered as fact) with its own gate.
# Reporting reads here put get_all_members, get_platform_flag and
# check_trial_status on the list as unchecked writes.
#
# The prefixes are this repository's own naming convention for read RPCs,
# checked against supabase/*.sql. A name heuristic is a heuristic: it narrows
# what this gate claims rather than what it can see, and an RPC that writes
# must not be named `get_*`.
_READ_RPC = re.compile(
    r"\.rpc\s*\(\s*['\"](?:get|list|check|fetch|recall|find|search|count|is|has)_",
    re.IGNORECASE)


def _statement_slice(content, start):
    """The text of the statement beginning at `start`, up to its own `;`.

    A fixed character window is not a statement. Widening the `.catch()` search
    to a flat 500 characters made bg.js:1520 disappear -- an unrelated outer
    chain's `.catch(function(){})`, six lines below, vouched for a
    `.rpc('expire_trial',…).then(function(){location.replace(…)})` that checks
    nothing. Hiding a real finding is worse than reporting a false one, so the
    search is bounded by the statement, tracking parenthesis depth so a `;`
    inside a callback body does not end it early.
    """
    depth = 0
    i, n = start, min(len(content), start + 2000)
    while i < n:
        ch = content[i]
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        elif ch == ";" and depth <= 0:
            return content[start:i + 1]
        i += 1
    return content[start:n]


def _check_file(file_path, patterns):
    """Check a single file for unchecked writes."""
    findings = []

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    content = _strip_js_comments(content)

    for pattern, op_type in patterns:
        for match in re.finditer(pattern, content):
            call_start = match.start()
            line_num = content[:call_start].count("\n") + 1

            if not _looks_like_supabase(content, call_start):
                continue

            if op_type == "rpc" and _READ_RPC.match(content, call_start):
                continue

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

            # The check can sit to the LEFT of the call, and the commonest
            # correct form does: `const { error } = await sb.from(...).update(...)`.
            # Looking only forward reported omega-council.js:219 -- which
            # destructures `error` on the same line -- as unchecked.
            if not has_error_check:
                back = content[max(0, call_start - 160):call_start]
                cut = back.rfind(";")
                if cut != -1:
                    back = back[cut + 1:]
                if re.search(r"\berror\b", back):
                    has_error_check = True

            # A `.catch()` anywhere in the same chain handles it. This used to
            # look only at the first 200 characters and only for rpc, so
            # omega-onboard.js:106 -- which ends `.catch(function(){})` after a
            # multi-line argument object -- was reported as unchecked, despite
            # CLAUDE.md §9 naming that very file as one that gets this right.
            stmt = _statement_slice(content, call_start)
            if re.search(r"\.catch\s*\(", stmt, re.IGNORECASE):
                has_error_check = True

            # A RETURNED promise is the caller's to handle, and flagging it here
            # names the wrong site. bg.js:562 is
            # `return sb.rpc('report_client_error',…)` inside a `.then`, whose
            # outer chain ends `.catch(function(){busy=false;})`; and
            # omega-sovereign-os.js:20's writeEvent returns its insert into a
            # CircuitBreaker that has a real catch. Neither is fixed by editing
            # the line the scanner points at.
            line_start = content.rfind("\n", 0, call_start) + 1
            if re.search(r"\breturn\s+[^;]*$", content[line_start:call_start]):
                has_error_check = True

            # The await-style equivalent of a `.then(r => …)` that inspects its
            # result: bind it to a name, then read that name. omega-feedback.js:81
            # is `var r = await sb.rpc('submit_feedback',…)` followed by
            # `if (r.data && r.data.ok) { …thank you… } else { …'Could not send.'… }`
            # -- a genuine outcome check with a failure branch, which this
            # scanner reported as unchecked only because the word `.error` does
            # not appear in it.
            assign = re.search(r"(?:var|let|const)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?[^;]*$",
                               content[line_start:call_start])
            if assign:
                name = assign.group(1)
                after = content[call_start + len(stmt):call_start + len(stmt) + 400]
                if re.search(r"\b%s\s*[.\[]" % re.escape(name), after):
                    has_error_check = True

            # The real shape of this bug class is a `.then()` that asserts
            # success without looking at the result:
            #     sb.rpc('expire_trial',…).then(function(){ location.replace(…) })
            # The callback takes no argument, so it cannot distinguish success
            # from `{data:null,error}` -- the member is told the trial expired
            # whether or not it did. A callback that DOES take the result and
            # reads it is inspecting the outcome, which is what a read like
            # `.then(function(r){ var members=(r.data||[]) … })` does; treating
            # those as unchecked writes is what put get_all_members and
            # check_trial_status on this list.
            then_match = re.search(r"\.then\s*\(\s*(?:async\s+)?(?:function\s*)?\(([^)]*)\)",
                                   stmt)
            if then_match and then_match.group(1).strip():
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
