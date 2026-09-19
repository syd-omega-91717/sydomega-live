# Ω SYD OMEGA 91717 — Integrity Contract

## Purpose

`python3 scripts/omega-integrity-contract.py` provides a deterministic, dependency-free preflight check before visual or deployment changes are accepted.

**Corrected 2026-09-19**: the first version's `CANONICAL_ASSETS` list named four
files (`omega-visual-system.css`, `omega-visual-system-v2.css`,
`omega-visual-engine.js`, `omega-evidence.js`) that do not exist anywhere in
this repository — verified with `find . -iname 'omega-visual-system*' -o
-iname 'omega-visual-engine*' -o -iname 'omega-evidence.js'`, zero hits. It
now checks the design system's real owners per `CLAUDE.md` §4: `bg.js`,
`nav.js`, `theme.js`, `css/omega-system.css`, `omega-visual-evolution.css`.
The reference-resolution regexes also false-positived on three real,
already-working patterns and were fixed: `data-src="…"` attributes (matched
as if `src=`), JS template-literal interpolation inside dynamically-built
markup such as `src="${cover}"` in `library.html`, and a percent-encoded
SVG-internal fragment (`url(%23n)`) nested inside a `data:` URI in
`css/omega-system.css`. Before this fix, running the checker against this
repo reported 13 errors; all 13 were false positives from these three
causes, and none reflected a real defect (`scripts/tests` also failed
because the script didn't answer `--help`, which is now fixed too).

## Checks

- Canonical visual/runtime assets exist in either the repository root or `public/`.
- Local HTML `src`/`href` references resolve without network access.
- Local CSS `url(...)` references resolve without network access.
- Duplicate HTML element IDs are reported as errors.
- Light-mode declarations are reported as warnings for review against the dark-only product direction.
- Output is sorted and deterministic for CI logs and reproducible audits.

## Safe adoption rule

This contract is additive. It does not move, delete, rename, or rewrite existing pages, assets, routes, or deployment configuration. Root and `public/` asset locations are both recognized because the repository contains multiple historical delivery layouts.

## Run locally

```bash
python3 scripts/omega-integrity-contract.py .
```

Exit codes:

- `0`: no integrity errors detected; warnings may still be present.
- `1`: one or more integrity errors detected.
- `2`: invalid repository root.

## CI integration guidance

Run this contract in an explicit audit/preflight job first. Do not make it a deployment gate until the repository's canonical asset location and intentional multi-surface routing contract have been finalized. This avoids turning historical layout ambiguity into an accidental production outage.
