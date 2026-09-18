# Ω SYD OMEGA 91717 — Integrity Contract

## Purpose

`python3 scripts/omega-integrity-contract.py` provides a deterministic, dependency-free preflight check before visual or deployment changes are accepted.

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
