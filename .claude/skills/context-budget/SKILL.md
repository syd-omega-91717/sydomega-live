---
name: context-budget
description: Keep this repo's per-session context cost down — measure what every agent session loads before it starts, decide where new documentation belongs so CLAUDE.md does not regrow, and read this repo's very large files cheaply. Use when adding to CLAUDE.md or any audit doc, when the context-budget CI check fails, when a session feels like it is spending its context on reading rather than working, or when asked to reduce token use.
---

# Context budget

## The problem this exists for

`CLAUDE.md` is loaded into every session in this repository before any work
begins. Nothing reported that cost, so it grew unchecked to **275,623 bytes
(~68,900 approx tokens)** — of which section 8 alone was 242,802 bytes, 88% of
the file, and almost entirely closed, verified history. Every session paid for
it. Moving that history to `FIXES_LOG.md` cut ~58,000 approx tokens per
session.

The pressure that caused it has not gone away: CLAUDE.md §9 requires every
change to update the docs, so the default action is always to append. This
skill is the counter-pressure.

Token figures throughout are estimated at bytes ÷ 4. That is an estimate, not
a measurement — no tokenizer is vendored here — but it is applied consistently,
so comparisons and trends are meaningful.

## 1. Measure first

```bash
python3 scripts/context-budget.py            # report + enforce (exit 1 if over)
python3 scripts/context-budget.py --report   # report only, never fails
```

It prints what is auto-loaded and counted against budget, and separately what
is merely *large and commonly read* — files where one full read costs more than
the entire auto-loaded context.

This runs in CI as a blocking step. A failure is not a formatting nit; it means
the next several hundred sessions would each pay for what was just added.

## 2. Where new documentation belongs

Ask one question: **does a session starting work need this to make a correct
decision?** If not, it does not belong in `CLAUDE.md`.

| What you have | Where it goes |
|---|---|
| A bug you fixed, with its evidence | `FIXES_LOG.md`, appended at the end |
| A *standing* fact that changed — a new recurring bug class, an item opening or closing, a moved baseline number, a method note that saves the next session real time | `CLAUDE.md` §8.1–§8.4, editing the specific subsection |
| Detailed audit findings, table-by-table or page-by-page | `REPOSITORY_AUDIT.md` / `GAP_ANALYSIS.md` |
| A long procedure or checklist | A skill under `.claude/skills/` — loads only when invoked |
| A feature proposal | `FEATURE_IDEAS.md` |

The distinction that matters: **§8 holds standing facts, `FIXES_LOG.md` holds
the record.** "We fixed X in `page.html` on this date, here is the query output
proving it" is a record. "PostgREST rejects the whole query when any column is
unknown, so one wrong name empties a page silently" is a standing fact — it
changes what the next session does.

When a fix does both — closes an open item *and* has evidence — write the
evidence entry in `FIXES_LOG.md` and edit the one line in §8.2 that said it was
open. Do not restate the evidence in §8.

## 3. Reading this repo's large files cheaply

Several files cost more in one read than the entire auto-loaded context:
`FIXES_LOG.md` (~61,600), `profile.html` (~43,800), `bg.js` (~34,500),
`GAP_ANALYSIS.md` (~26,300). Run the script for current figures.

`bg.js` is the worst trap, because almost all of its size is a **single
JS string literal** holding the whole injected stylesheet. Reading the file to
find one CSS rule pulls that entire string into context.

Do this instead:

```bash
# Find the rule, then read only around it.
grep -n "omega-depth-field" bg.js
grep -o "#omega-depth-field{.\{0,200\}" bg.js     # just the declaration body
```

For `FIXES_LOG.md`, search rather than read — that is what it is for:

```bash
grep -n "task_completions" FIXES_LOG.md | head        # has this bug happened before?
grep -n "^- \*\*\[Fixed" FIXES_LOG.md | head -40      # scan entry headers only
```

For a page, get the shape before the content:

```bash
grep -n "^<script\|^</script>\|<section\|id=\"" profile.html | head -40
```

Then `Read` with `offset`/`limit` on the range you actually need.

## 4. Editing inside `bg.js`'s style string — the trap that has already bitten

The stylesheet lives inside a single-quoted JS string with `\n` escapes, and
its section headers use **real box-drawing characters** (`──`), not escapes.
A Python `str.replace()` written against `\\u2500` matches nothing and returns
the string unchanged — silently. A no-op edit looks exactly like a successful
one.

So: after any programmatic edit to that string, **assert the replacement
happened**, and then confirm in a browser that the rule actually applies:

```python
assert s.count(old) == 1, s.count(old)   # before replacing
```

```bash
# and verify the rendered result, not the file contents
node --check bg.js
```

A rule that landed in the file but not in the cascade will report
`z-index: auto` and `0` background layers at runtime while looking perfect in
the diff. `.claude/skills/verify-in-browser/` is the tool for that check.

## 5. Raising a budget

`BUDGETS` in `scripts/context-budget.py` is a deliberate ceiling, not a
starting value. Raising it to make the check pass converts a permanent
per-session cost into a silent one — which is exactly how CLAUDE.md reached
68,900 tokens.

Raise it only when the content genuinely must be auto-loaded, say so in the
commit message with what was added and why it could not live elsewhere, and
move something else out in the same change where you can.
