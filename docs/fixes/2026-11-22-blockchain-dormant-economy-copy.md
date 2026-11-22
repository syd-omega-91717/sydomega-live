### blockchain.html described the dormant Omega Token economy as live (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Defect (read from source, then proved by a test).** `blockchain.html` ships a token economy that `platform_settings.tokens_enabled=false` keeps off, but only step V
of its workflow said so. The rest asserted a live economy in present tense: "Tokens are earned through platform participation", "Platform activity is the primary source
of sovereign tokens", "Sovereign NFTs are minted at gate thresholds", "Tokens and NFTs held in your sovereign wallet contribute to your lattice standing", "The 9.17% sovereign
commission applies to all marketplace transactions", "Token and NFT values are anchored to authority score" (the last implies the tokens have a value), plus unlabelled
`917.385B Ω MAX SUPPLY` / `9.17% COMMISSION` chips and a meta description and search entry calling it "the sovereign blockchain economy". CLAUDE.md section 9 requires future tense until the
flag is on. No gate saw it: `commerce-contract.py` looks for currency amounts and revenue-shaped accumulators, and the finance-hub test only checks that other pages link here.

**Fix.** A top banner ("DESIGN PREVIEW · NOT LIVE", naming `tokens_enabled` and "no commission is charged"); every workflow step and architecture card rewritten as "Planned: ... would ...";
the supply and commission chips labelled PLANNED; the topbar, meta description and `search.html` entry rewritten. Design, parameters and layout unchanged.

**Evidence.** New `scripts/tests/test_blockchain_dormancy_truth.py` (6 tests, registered in `contract-suite.py` as `blockchain-dormancy-truth`): **17 failures against the original pages, 0 against the fix.**
`check-inline-js.py` OK, `commerce-contract.py` OK.

**Also corrected.** `GAP_ANALYSIS.md` still listed `advertising.html`'s "104,976-NODE REACH" as open; the page on `main` already shows `AUDIENCE REACH · NOT MEASURED`. Marked closed with the source evidence.
My own earlier report that the page "still sells" that claim was wrong: I had read the stale gap entry instead of the page.

**Not claimed.** This is source copy only. Whether `tokens_enabled` is false in the live database was not read (the Supabase connector refused this session).

### Found on the way: `supabase/remote-migrations.json` was invalid JSON on `main` (fixed here)

`4c0efd2` (the merge inside #1521) interleaved the two valid parents of the provider ledger: the 440-version side (finance migrations) and the 441-version side (adds the
`advance_matrix` closure `20261122105012`). The result had duplicate `source` / `remoteMigrationCount` / `latestRemoteMigration` keys and a `versions` array with a missing comma
(`"20261122101614"` twice, line 450). `json.loads` raised `Expecting ',' delimiter`, so every test that loads the ledger errored in `setUpClass` (dozens: migration pending boundary,
main-merge integrity, provider column privileges, progression/personal-context guardrails, `test_advance_matrix_closed`). Reproduced on `origin/main` (`c618336`) with
`git show origin/main:supabase/remote-migrations.json | python3 -c "import json,sys;json.load(sys.stdin)"`.
The 441 parent is a strict superset of the 440 parent (it adds only `20261122105012`) and is internally consistent (count 441, 441 versions, 441 names), so it is restored verbatim.
