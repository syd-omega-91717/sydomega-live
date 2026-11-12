# Visual page survey integrity correction

**Date:** 2026-11-12  
**Scope:** Static audit tooling only

## Defects found

The visual survey could not reliably identify or measure every scanned HTML document:

- It stored only `path.name`, so a root page and a nested template with the same basename collided in reports.
- The hidden-content matchers were double-escaped. Inline `display:none` and inactive `.tab-panel` containers were therefore not consistently excluded from the visible-text pass.
- The action counter's regexes were double-escaped and could miss native buttons and styled non-button actions.
- H1 extraction selected the first regex match without retaining its ancestor visibility context. A hidden H1 could mask a later visible H1.

## Correction

- Preserve the legacy `page` basename and add a repository-relative `path` as the unique document identity.
- Correct the whitespace and word-boundary expressions used for hidden-state detection.
- Collect H1 text inside the visibility-aware HTML parser and select the first visible H1.
- Count native `<button>` elements and styled non-button actions separately, avoiding double-counting a button with a `.btn` class.
- Report root HTML pages and nested HTML files separately; use the relative path in density output.

## Regression coverage

`scripts/tests/test_visual_page_survey.py` covers:

1. Inline-hidden, inactive-tab, `aria-hidden`, and `hidden` content exclusion.
2. Selecting a visible H1 when an earlier H1 is inside a hidden ancestor.
3. Distinguishing two documents that share the same basename.
4. Counting a native button and a styled anchor once each.

The test is registered in `scripts/contract-suite.py`, so it runs in the blocking static contract suite and the local gate list.

## CI evidence

The PR's static contract run reports **4 tests passed, 0 failed**. The visual survey workflow also completed successfully and scanned **251 HTML documents: 241 root pages and 10 nested HTML files**.

## Limits

This remains a source-level survey. It does not execute page JavaScript, compute final styles from external stylesheets, or replace real browser checks at mobile and desktop viewports. A page with zero static visible words may be dynamically populated; it must be checked in a rendered browser before being classified as empty or incomplete.

No production page, route, permission, database object, migration, secret, provider setting, or production deployment was changed.
