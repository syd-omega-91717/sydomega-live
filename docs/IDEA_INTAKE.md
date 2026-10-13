# Idea intake

Every idea that is not yet a full `FEATURE_IDEAS.md` proposal goes here first,
one line each, so nothing raised in a conversation, a review or a member request
is lost. `scripts/idea-ledger.py` reads this file into `docs/IDEA_LEDGER.md`,
and its `--check` (blocking, in `scripts/contract-suite.py`) fails on a line it
cannot parse or on a status it does not know.

Format, one per line under **Ideas**:

    - [STATUS] Title — evidence or next step (YYYY-MM-DD)

STATUS is one of: `PROPOSED`, `NEEDS_DECISION`, `IN_PROGRESS`, `PARTIAL`,
`DORMANT`, `SHIPPED`, `DECIDED`, `SUPERSEDED`, `REJECTED`. Promote an idea by
changing its status *with evidence* (a file:line, a PR, a migration version);
never mark it SHIPPED on assumption. When one grows into a full proposal, move
it to `FEATURE_IDEAS.md` and delete the line here.

## Ideas

- [SHIPPED] Copilot visual commands — 14 slash commands (/handwritten, /decision-matrix, /infographic, /canvas, /layers, /cycle, /diagram, /roadmap, /sketchnotes, /iceberg, /blueprint, /explodedview, /tree, /timeline); omega-copilot-visuals.js, PR #874 (2026-10-12)
- [SHIPPED] Owner two-factor deep link — settings.html#two-factor opens the enrolment section; approvals offers it on aal2_no_factor, PR #875 (2026-10-12)
- [DECIDED] Extract the 608 unextracted 999-blueprint points — the owner re-supplied the full text 2026-10-12; it is the same source and does not contain those numbers, so none are invented (scripts/blueprint-truth-map.py) (2026-10-12)
- [SHIPPED] Map every 999-blueprint point — all 413 entries (391 + 8 restored duplicates + 14 appendix Nodes) classified with reasons by scripts/blueprint-truth-map.py (2026-10-12)
- [NEEDS_DECISION] Database backups the owner controls — the blueprint's Mars Ledger (points 9, 615) reduces to off-site backups / point-in-time restore, which needs Supabase Pro (2026-10-12)
- [IN_PROGRESS] Owner concept media on the Vision Board — 6 Veo clips + 3 boards as a labelled CONCEPT ART tab (vision.html, assets/concept/, 6.6 MB, faststart); each board states what exists today (2026-10-13)
- [PROPOSED] Certificate PDF per earned certificate — from the Sovereign Terminal board; reuse omega-passport.js (vendored jsPDF) and the certificates profile.html already lists (2026-10-13)
- [NEEDS_DECISION] Member sticker and logo pack — from the Unified Blueprint board; no sticker surface exists in the repo (2026-10-13)
- [REJECTED] 9x9x9 = 729-node matrix (Master Blueprint board) — conflicts with the canon 9^5 = 59,049 lattice, omega-canon.json nine_fold (2026-10-13)
- [REJECTED] 9-stage Sand to Omega Master ladder (Sovereign Terminal board) — conflicts with the 12 canon tiers the owner chose 2026-10-12 (2026-10-13)
- [REJECTED] Gold or rhodium bar purchases, revenue sweep, 51% master vault, 51% currency control (boards) — every money item stays dormant by the owner decision of 2026-10-12, docs/COUNSEL_BRIEF.md (2026-10-13)
- [REJECTED] Nginx, Redis, microservices, G7 servers, PPO reinforcement-learning agents (boards) — the platform is a static site on Supabase with no build step, CLAUDE.md sections 1 and 9 (2026-10-13)
