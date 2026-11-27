# Evidence Matrix Refresh — 2026-11-27

Regenerate the committed evidence matrix after PR #1578 merged the corrected mirror-eligibility audit.

Required scanner semantics:
- Directly loaded local page modules are included; global bootstrap/runtime scripts remain excluded.
- Supabase Storage bucket calls are not classified as Postgres relations.
- Member-state mirror reporting reads the actual SKIP and NO_MIRROR exclusions and treats omega_analytics_* keys as excluded.
- PARTIAL and LOCAL_ONLY rows report static eligibility only, never guaranteed successful cloud synchronization.

The refresh workflow must update only EVIDENCE_MATRIX.md on this automation branch. Review the generated artifact against the 237-page census and the scanner tests before opening a PR. This matrix is source inventory, not end-to-end production proof.
