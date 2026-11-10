# Ω Page Copy Uniqueness

**Status:** Implemented as a blocking-contract evidence audit. Baseline scan completed 2026-11-10; targeted remediation is in progress and a post-remediation full scan is still required.

## Purpose

The page estate is intentionally multi-page. It must not repeat substantial explanatory copy, duplicate a feature under multiple URLs without a clear reason, or repeat a long instruction inside the same page. The audit is designed to identify those cases without confusing shared site chrome or short labels with duplicated product content.

## First full scan and remediation

The baseline Contracts run on 2026-11-10 scanned **251 HTML pages** and **1,830 visible content blocks**. It reported 12 unapproved exact cross-page prose groups, 2 explicitly approved truth notices, 0 exact within-page prose groups at the eight-word threshold, 0 repeated CTA groups and 0 scan errors. The baseline report predates near-duplicate analysis and is not the final post-remediation result. The first fuzzy-copy baseline must be captured on the final branch.

The following source-level corrections have since been made on the page-copy audit branch:

- `academy.html` is the single owner of the exam and certification catalogue; `gaming.html` now links to Academy and retains only mastery/play cards.
- The full authority calculation and gate definitions have one canonical reference in `evolution.html`; related pages retain their own live data or purpose-specific explanations.
- The Vault no longer repeats the owner-only Covenant article catalogue. Its Covenant link is revealed only after the authenticated profile is verified as owner.
- The full founder name and professional order number are removed from the global member runtime, public canon JSON and Profile. Member-facing identity uses the public abbreviation `S.Y.D`; the full name remains on owner-only Covenant and Approvals surfaces.
- Honors, Approvals, Dashboard, Academy, Gaming and Vault now use page-specific content instead of repeating the same formula/gate explanation.
- Exact duplicate checks are protected by regression tests for catalogue ownership, owner identity boundaries and the canonical progression reference.

**Verification boundary:** the baseline report is not a post-remediation scan. Re-run `python3 scripts/page-copy-audit.py --markdown` on the final branch, inspect exact and near-duplicate candidates, and only then report the remaining counts.

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
- Reports near-duplicate prose candidates using word-trigram Jaccard similarity (default threshold 0.78, minimum 20 words), including candidates inside the same page. This is a lexical review signal, not semantic proof or an automatic rewrite.
- Classifies explicitly justified cross-page repeats through config/page-copy-allowlist.json; allowlist entries require a reason and an exact page scope; scope drift and unused entries are reported.
- Reports repeated button/link calls to action separately; standard CTA reuse is not misclassified as duplicate explanatory content.
- Uses a configurable minimum word count (default 8) to avoid flagging short labels such as OVERVIEW, SAVE or OPEN.
- Allows the near-duplicate minimum word count and similarity threshold to be tuned with `--near-min-words` and `--near-threshold`.
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

1. Run the final exact and near-duplicate scan on the completed branch; capture the first fuzzy-copy baseline.
2. Classify every remaining candidate as accidental, legally required, shared standard, intentional, or a false positive.
3. Fix repeated explanatory copy within individual pages first; these are the lowest-risk edits.
4. Consolidate cross-page repeated prose into canonical shared content only where the meaning and authorization context are identical.
5. Evaluate page merges one batch at a time. The existing consolidation report identifies budget + expenses as a candidate, but a merge is not approved until every unique feature, storage migration, link, page contract, menu entry, locale and redirect is accounted for.
6. Re-run the audit and browser regression tests after each batch.

