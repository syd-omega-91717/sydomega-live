# Graph redirect release-contract repair — 2026-11-11

## Trigger

The first post-merge workflow run for the unified Insight graph workspace exposed release-contract gaps. The graph routes themselves worked as redirects, but they no longer carried the repository's full page shell and several registries/tests still treated the old pages as independent destinations.

## Repairs

- Restored the exact shared Ω MORPH block in the head of all six compatibility routes.
- Added the unified background stylesheet, bg.js and nav.js runtime shell hooks to every redirect.
- Gave each redirect a unique title, description, heading, fallback sentence and link label; repeated copy is not hidden behind an allowlist.
- Kept all six routes assigned to the Intel page core so the page estate remains fully governed, while removing them from the user-facing hub picker. The picker JSON and JavaScript lists now match exactly and expose only Insight plus the owner Graph Admin surface.
- Updated redirect contract evidence to state that the routes no longer query Supabase directly.
- Corrected the page-copy test assertion scope and moved the near-duplicate report-heading assertion into the markdown-report test.
- Corrected the owner profile display to show the full founder name only when is_owner is true, and added S.Y.D as an abbreviation inside the hidden owner-only identity block.

## Verification boundaries

- JavaScript syntax for redirect scripts and the canonical Insight runtime was checked.
- Redirect route mappings, shell hooks, unique titles/descriptions, page-core membership, hub-picker JSON/JavaScript parity, and contract registry entries were checked against the branch.
- Hosted GitHub Actions rerun is required before merge.
- No production database rows, migrations, RLS policies, Edge Functions, payment settings, or secrets were changed.
