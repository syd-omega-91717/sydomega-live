### verify-family-canvases.js: Semgrep path-join finding left on main by #1602 (2026-11-28)

**Why.** #1602 merged at `52b6275a9`. Its "Blocking supply-chain scan" had failed on that head with `javascript.lang.security.audit.path-traversal.path-join-resolve-traversal` at `scripts/verify-family-canvases.js` (one finding; two on the first push). A second fix, `6d7e9e987`, was pushed to the PR branch but the PR merged at the earlier head, so `main` carries the failing form (`origin/main:scripts/verify-family-canvases.js` still has `serve(root, urlPath)`). This is the frozen-head trap in CLAUDE.md 8.2.

**Fix.** The served path is built inline from a local `u` and the module constant, the form `scripts/verify-watch-extras.js` already uses and that passed Semgrep in #1564, with the containment check kept. The helper whose parameters Semgrep may treat as untrusted is removed. No behaviour change.

**Verified.** `node scripts/verify-family-canvases.js`: PASSED 24; against the pre-fix `main` worktree it fails 16; `test_hidpi_charts` OK; registry matches.

**Not done / not verified.** Semgrep itself could not be run locally (the rule registry is blocked by the proxy), so whether this form clears the finding is known only from CI on this PR. The earlier "same shape as verify-watch-extras" reasoning is an inference, not a measurement.
