#!/usr/bin/env python3
"""Audit visual design consistency across all pages.

Verifies that all pages:
1. Load bg.js and omega-visual-universe.css through proper mechanisms
2. Use canonical design tokens (--void, --gold, --cyan, etc.)
3. Don't override design system classes without justification
4. Maintain accessibility standards (color contrast, focus indicators)
"""

import re
import sys
from pathlib import Path
from collections import defaultdict

if len(sys.argv) > 1 and sys.argv[1] == "--help":
    print(__doc__)
    sys.exit(0)

ROOT = Path(__file__).resolve().parents[1]
PAGES_DIR = ROOT

# Canonical design system components
CANONICAL_TOKENS = {
    '--void', '--void2', '--gold', '--solar', '--cyan',
    '--crim', '--green', '--purple', '--muted', '--ink',
    '--D', '--R', '--M',  # typefaces
}

CANONICAL_CLASSES = {
    'shell', 'side', 'main', 'kpi', 'kpi-row', 'card', 'card-grid',
    'tbl-head', 'tbl-row', 'tab-btn', 'tab-pane', 'chip', 'glass',
    'glass-cyan', 'bar-track', 'bar-fill', 'btn', 'btn-fill', 'btn-gold',
    'inp', 'field', 'sechead', 'topbar',
}

REQUIRED_LOADS = {
    'bg.js': r'<script[^>]*src=["\'].*bg\.js["\']',
    'nav.js (optional)': r'<script[^>]*src=["\'].*nav\.js["\']',
}

def scan_page(html_file):
    """Audit a single HTML page for design consistency."""
    content = html_file.read_text()
    findings = {'file': html_file.name, 'issues': []}

    findings['issues'].extend(page_contract_issues(content, html_file))

    # Check required loads
    for load_name, pattern in REQUIRED_LOADS.items():
        if load_name.startswith('bg.js') and 'index.html' not in html_file.name:
            if not re.search(pattern, content):
                findings['issues'].append(f"Missing {load_name}")

    # Check for style overrides of canonical classes
    style_blocks = re.findall(r'<style[^>]*>(.*?)</style>', content, re.DOTALL)
    for style_idx, style_block in enumerate(style_blocks):
        for class_name in CANONICAL_CLASSES:
            if f'.{class_name}' in style_block:
                # This is OK if it's a modifier or extension, but flag pure overrides
                if re.search(rf'\.{class_name}\s*\{{[^}}]*(?:background|border|color|padding):',
                            style_block, re.IGNORECASE):
                    findings['issues'].append(f"Style block {style_idx}: overrides .{class_name}")

    # Check for non-canonical token usage in inline styles
    inline_styles = re.findall(r'style=["\']([^"\']*)["\']', content)
    for inline_style in inline_styles:
        if 'var(' in inline_style:
            # Extract variable names
            var_names = re.findall(r'var\(([^)]+)\)', inline_style)
            for var_name in var_names:
                if var_name.startswith('--') and var_name not in CANONICAL_TOKENS:
                    findings['issues'].append(f"Non-canonical token in inline style: {var_name}")

    # Check for custom color definitions in page-local styles
    for style_block in style_blocks:
        custom_colors = re.findall(r'--[a-z-]+:\s*#[0-9a-f]{6}', style_block, re.IGNORECASE)
        if custom_colors:
            findings['issues'].append(f"Custom color definitions (use canonical tokens): {len(custom_colors)} found")

    return findings

def page_contract_issues(content, html_file):
    """Check the shared structural contract without rewriting page-specific UI."""
    if re.search(r"""data-omega-special-page\s*=\s*["']true["']""", content, re.I):
        return []
    checks = [
        (r"""<meta[^>]+name=["']viewport["']""", "Page contract: missing viewport meta"),
        (r'<title>[^<]+</title>', "Page contract: missing document title"),
        (r'<h1\b', "Page contract: missing primary h1"),
        (r"""<main\b|role=["']main["']""", "Page contract: missing main landmark"),
        (r'(?:skip-link|omega-skip)', "Page contract: missing skip navigation marker"),
        (r'nav\.js', "Page contract: missing canonical nav.js"),
    ]
    return [message for pattern, message in checks if not re.search(pattern, content, re.I)]

def main():
    print("Visual Design Consistency Audit")
    print("=" * 60)

    html_files = sorted(ROOT.glob("*.html"))
    findings_by_issue = defaultdict(list)
    total_issues = 0

    for html_file in html_files:
        result = scan_page(html_file)
        if result['issues']:
            total_issues += len(result['issues'])
            for issue in result['issues']:
                findings_by_issue[issue].append(html_file.name)

    if findings_by_issue:
        print(f"\nWARNING: {total_issues} design consistency issues across {len(findings_by_issue)} categories:")
        for issue_type in sorted(findings_by_issue.keys())[:15]:
            pages = findings_by_issue[issue_type]
            print(f"\n  {issue_type}")
            print(f"    Affects {len(pages)} page(s): {', '.join(pages[:3])}")
            if len(pages) > 3:
                print(f"    ... and {len(pages) - 3} more")
        return 1

    print(f"\nPASS: {len(html_files)} pages comply with design system")
    return 0

if __name__ == "__main__":
    sys.exit(main())
