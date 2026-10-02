# Ω SYD OMEGA 91717 — Release Surface Quality Contract

The release pipeline now runs a deterministic static quality contract before the Vercel production promotion stage.

## Checks

- HTML documents declare a language.
- HTML documents declare a responsive viewport.
- HTML documents have a non-empty title.
- Duplicate DOM IDs fail the artifact gate.
- Images without an alt attribute fail the artifact gate.
- Suspiciously unnamed form controls are reported.
- Oversized HTML, JavaScript, and CSS assets fail the artifact gate.

Run locally:

    python3 scripts/release-surface-quality.py

## Evidence boundary

A PASS proves only that the checked repository/build artifact satisfies these deterministic checks.

It does not prove:

- production accessibility;
- browser journey correctness;
- mobile/desktop runtime behavior;
- Core Web Vitals;
- Lighthouse/axe/Pa11y results;
- production alias health.

Therefore the live accessibility_performance proof gate remains OPEN until fresh browser-based evidence is captured against the deployed release SHA.

This distinction is intentional and is part of the production-proof contract.
