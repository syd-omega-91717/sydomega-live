# Ω Page Copy Uniqueness

**Status:** Implemented as an evidence-only audit. First full scheduled report pending.

## Purpose

The page estate is intentionally multi-page. It must not repeat substantial explanatory copy, duplicate a feature under multiple URLs without a clear reason, or repeat a long instruction inside the same page. The audit is designed to identify those cases without confusing shared site chrome or short labels with duplicated product content.

## What the audit measures

Run:

    python3 scripts/page-copy-audit.py
    python3 scripts/page-copy-audit.py --markdown
    python3 scripts/page-copy-audit.py --json /tmp/page-copy-audit.json

The scanner:

- Reads HTML pages while excluding build output, dependencies and Git metadata.
- Extracts visible content blocks from main content when a main element exists; otherwise it uses the page body.
- Excludes scripts, styles, SVG, navigation, shared headers/footers, sidebars, hidden content and elements marked data-copy-ignore.
- Normalises Unicode, case and whitespace before comparing exact text.
- Reports exact repeated prose across pages separately from repeated prose inside one page.
- Classifies explicitly justified cross-page repeats through config/page-copy-allowlist.json; allowlist entries require a reason and unused entries are reported.
- Reports repeated button/link calls to action separately; standard CTA reuse is not misclassified as duplicate explanatory content.
- Uses a configurable minimum word count (default 8) to avoid flagging short labels such as OVERVIEW, SAVE or OPEN.
- Produces a Markdown report suitable for the GitHub Actions job summary.

## What it does not do

- It does not rewrite, delete, merge or redirect pages.
- It does not assume that repeated legal, privacy, safety or operational text is wrong.
- It does not equate repeated page chrome, navigation, shared database tables or common CTA labels with duplicated page purpose.
- It does not decide whether two similar pages should be merged. That decision requires a feature-by-feature port plan, canonical destination, redirects, registry/navigation updates and regression coverage.

## Governance

- The deterministic regression tests run in the blocking contract suite.
- The full repository scan runs in the blocking contract suite as an advisory report (it fails only on scan errors, not on repeated copy) and is appended to the contract output.
- The scheduled/on-demand Page Overlap Audit workflow also appends the report to the GitHub Actions job summary.
- Existing title/description uniqueness remains a separate blocking contract.
- Purpose overlap remains a separate advisory analysis in scripts/page-consolidation.py.
- Every proposed page merge must preserve source features and data compatibility. Do not remove a page merely because its text similarity score is high.
- Required route-level release, privacy, safety and persistence notices may repeat only with an explicit allowlist reason; do not remove truth-critical disclosures to make a duplicate count look better.

## Next remediation sequence

1. Review the first full scan and classify exact repeats as accidental, legally required, shared standard, or intentional.
2. Fix repeated explanatory copy within individual pages first; these are the lowest-risk edits.
3. Consolidate cross-page repeated prose into canonical shared content only where the meaning and authorization context are identical.
4. Evaluate page merges one batch at a time. The existing consolidation report identifies budget + expenses as a candidate, but a merge is not approved until every unique feature, storage migration, link, page contract, menu entry, locale and redirect is accounted for.
5. Re-run the audit and browser regression tests after each batch.

