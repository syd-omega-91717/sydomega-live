# docs/fixes/ — one file per fix entry

**Why.** Every PR used to append its entry to the end of `FIXES_LOG.md`, so any two open PRs collided on the same
lines. Measured on 2026-11-02: all 12 of the last 12 merges touched that file, and GitHub flags a PR "conflicting"
for an append at the same place (a `merge=union` rule in `.gitattributes` was tested on real PRs and GitHub ignores it).
A new entry is now a **new file**, so two PRs can never touch the same line.

**How.** `python3 scripts/new-fix-entry.py <slug> "<title>"` creates `docs/fixes/<YYYY-MM-DD>-<slug>.md`. Fill it in with
the same rules as before: cite file:line, command output or a query result, say what was *not* verified, and never mark
something fixed that was not. Cite it as `docs/fixes/<file>`; the numbered entries 1 to 211 stay in `FIXES_LOG.md`.

**What is frozen.** `FIXES_LOG.md` is history. `scripts/fixes-log-frozen.py` fails if it changes. If you must correct
history, edit it, run `python3 scripts/fixes-log-frozen.py --update`, and say why in the PR.

**Other shared files.** Do not hand-edit counts in `CLAUDE.md` (derive them), and merge `main` into your branch with
`python3 scripts/merge-main.py` before every push: it resolves the generated files and ratchet baselines the right way.
