### Four reds on main: esc ratchet, two orrery tests, two member-state tests (2026-11-28)

**Why.** `main` at `882f5433d` (the #1599 merge) had CI and Contracts failing. Reproduced on a clean worktree of `origin/main`:
- `scripts/esc-copy-ratchet.py`: `elemental-resonance.js` defined its own `escapeXml` (1 local escaper, baseline 0).
- `test_studio_franchise_orrery` (2 tests): the page writes `"SOLOMON'S SOVEREIGNTY"` with double quotes, the test's franchise-title regex read single quotes only, so it listed 6 titles against the scene's 7; and the scene's "narrative index" contract is in the block comment directly above `SCENES.studio`, outside the test's slice, while "narrative navigation ... not production or release telemetry" lives in the module's description table.
- `test_member_state_key_audit` (2 tests): fixtures wrote `\\n` (a literal backslash-n) instead of a newline, which the scanner (narrowed to real `<script>` bodies by #1599) correctly does not treat as JavaScript; the asserted line number (4) only holds with real newlines.

**Fix.** `elemental-resonance.js` now uses the shared `OmegaEsc.esc` (empty string if absent, never unescaped text); the two test files were corrected as described. No product behaviour or scanner logic changed.

**Verified.** Before, on `origin/main`: `unittest test_member_state_key_audit test_studio_franchise_orrery` FAILED (failures=2, errors=2); `esc-copy-ratchet.py` FAILED. After: those two modules plus `test_elemental_resonance_composer`, `test_omega_esc`, `test_studio_library`: 64 tests OK; `esc-copy-ratchet.py` and `xss-sink-ratchet.py` PASSED.

**Not done / not verified.** The full `ci-local.sh` was not re-run on this branch, and the remote CI result is what counts. SVG export output was not re-rendered; `&#39;` replaces `&apos;` for apostrophes (both valid XML).
