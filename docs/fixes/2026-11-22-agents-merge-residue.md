### agents.html shipped broken by a bad merge (PR 1517) (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Defect (measured, not inferred).** `main` at `f47f455` failed 5 blocking gates, all rooted in `agents.html`:
`check-inline-js.py` (`agents.html:197 SyntaxError: Unexpected end of input`), `production-contract.py`
(`duplicate id='tab-hierarchy'`), `omega-morph-sync.py` drift, and `test_agent_council_contract`
(`onclick=` x5). A merge of `main` into `feat/omega-sovereign-hubs-agent-hierarchy` kept BOTH sides of four
conflicts: two `<div id="tab-hierarchy">` (one never closed), two `renderHierarchy()` (the static one missing its
closing brace, so the whole inline script failed to parse and the page's JS was dead), two tab bars (the old one
with inline `onclick=`), and the hierarchy CSS inside the canonical morph block.

**Fix.** Kept the newer side of each: accessible tab bar, async canonical `renderHierarchy()`, one panel. Moved the
hierarchy CSS into the page's own `<style>` (outside the morph block, per commit 6f2c00b), re-ran
`omega-morph-sync.py`.

**Evidence after.** `check-inline-js.py` OK; `production-contract.py` PASSED; `test_agent_council_contract` +
`test_omega_morph_contract` 16/16; `verify-runtime.js --pages agents.html` PASS (headless chromium).
`ci-local.sh`: 35 pass / 2 fail; the 2 are environmental (2j shallow clone; 2v needs `public/` built).
