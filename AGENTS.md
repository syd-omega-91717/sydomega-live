# AGENTS.md — multi-agent working contract for `sydomega-live`

**Audience: any AI assistant other than the Claude Code session that owns this
repo's `CLAUDE.md` — primarily ChatGPT / Codex, but the rules are tool-agnostic.**

Three agents now work this repository, one contract each. They must agree; where
they differ on a *fact about the codebase*, `CLAUDE.md` is authoritative and the
others are stale.

| agent | contract | loaded how |
|---|---|---|
| Claude Code | `CLAUDE.md` | automatically |
| ChatGPT / Codex | **this file**, or `CHATGPT_CONTEXT_RULES.md` pasted into a browser chat | `AGENTS.md` automatically for Codex; pasted otherwise |
| GitHub Copilot | `.github/copilot-instructions.md` | automatically (Chat, code review, coding agent) |

`AGENTS.md` is the filename OpenAI Codex reads automatically. If you are using
ChatGPT in a browser without repo access, paste
[`CHATGPT_CONTEXT_RULES.md`](CHATGPT_CONTEXT_RULES.md) into the conversation
instead — it is the same contract, condensed into one self-contained block that
restates the facts it needs rather than pointing at files ChatGPT cannot open.
If the two ever disagree, **this file wins** and the paste block is stale.

---

## 0. Why this file exists

Two agents are improving this repository in parallel. They do not see each
other's work in progress. Every conflict observed so far falls into one of five
classes, and only the first is the kind git can warn you about:

| class | what it looks like | who catches it |
|---|---|---|
| **A. Textual** | Both agents edited `bg.js`. Git refuses to merge. | git |
| **B. Semantic** | Both edits merge cleanly, and the result is broken. A page-local `:root` override that is dead code; a hand-rolled auth check that races the real one. | nobody, until production |
| **C. Generated-artifact** | Both regenerated `EVIDENCE_MATRIX.md`. Or one hand-edited it. | a blocking CI gate, after the fact |
| **D. Live-state** | Both applied a Supabase migration. The database ledger now diverges from the repo, permanently. | nobody. This one is not revertible by git. |
| **E. Budget/gate** | ChatGPT appended a paragraph to `CLAUDE.md`. CI now fails on every PR from both agents. | a blocking CI gate |

Class B and class D are the expensive ones. This contract is mostly about them.

**The governing principle:** this repo has *single owners* for almost everything
— one file owns the design tokens, one directory owns the schema, one script
owns each generated artifact. Conflicts happen when a second agent writes a
second owner for something that already had one. Do not create a second owner.

---

## 1. The contract in one paragraph

ChatGPT works on `chatgpt/<topic>` branches only, branched fresh from
`origin/main`, one concern per branch. It authors **new** files freely and edits
**existing** files only within its assigned lane (§2). It never touches the nine
Never-Touch items in §5, never hand-edits a generated file (§6), never applies a
migration or deploys anything to a live service (§5.1), and never adds a line to
`CLAUDE.md`. Every handoff states which files changed and which of the repo's own
checks were run. If a check could not be run, it says so plainly rather than
claiming green.

---

## 2. Lane assignment — who works on what

Lanes are how two agents avoid the same file. They are not a statement about
capability; they are a collision-avoidance schedule.

### 2.1 ChatGPT's lane — work here freely

These are areas where a clean merge is also a correct merge:

- **New standalone `.html` pages.** A new page is a new file; it cannot conflict
  textually. Follow §4's page rules exactly, including the `nav.js` wiring
  (which is the one shared file a new page must touch — see §3.4 for how).
- **New `supabase/migrations/` files.** Authoring is safe. *Applying* is not (§5.1).
- **Page-local content, copy, and structure** inside a single `.html` file —
  provided the page is not one Claude currently has open in a PR (§3.1).
- **`i18n/*.json` translation values** — subject to the triple-write rule in §4.6.
- **Edge Function source** under `supabase/functions/` — authoring only, never
  deploying.
- **Python tooling under `scripts/`** — new scripts, and fixes to existing ones.
  Every script must answer `--help` with its docstring and exit 0; this is
  enforced by `scripts/tests/test_script_help_contract.py`.
- **Documentation other than `CLAUDE.md`** — see §8.
- **Review, analysis, second opinions on anything.** Reading is never a conflict.

### 2.2 Claude's lane — do not edit these without a handoff

- **`bg.js`** (~137 KB, one file). This is the platform's single point of
  failure: every page loads it, and if it fails to parse the whole site is down.
  It is also the file most likely to be open in a Claude PR at any moment. If a
  change genuinely requires `bg.js`, write the exact patch you want as a diff in
  your handoff and let it be applied in one place — do not commit it yourself.
- **`nav.js`** — except the two additive lines a new page needs (§3.4).
- **`omega-*.js` platform modules** — the loader graph, guard attributes, and
  publish/subscribe globals are interdependent in ways a single-file read does
  not reveal.
- **`.github/workflows/*`** and `scripts/ci-local.sh` — the gate definitions.
- **`vercel.json`, `.vercelignore`, `scripts/vercel-build.sh`** — the deploy surface.
- **RLS policies and `GRANT`s on existing tables.**

### 2.3 Neither agent acts alone

- Turning a `platform_settings` flag from `false` to `true`. That is the owner's
  decision, not an agent's.
- Anything touching Stripe (`supabase/functions/checkout`, `stripe-webhook`).
- Deleting a page, a table, or a column.
- Changing the auth or approval-gate flow.

---

## 3. Git protocol — preventing class A conflicts

### 3.1 Before you start: look at what is already in flight

Two agents editing the same file is avoidable if each looks first. Before
proposing any edit to an existing file:

1. List open PRs and open branches. Anything on a `claude/*` branch is in
   flight — treat every file it touches as locked until it merges or closes.
2. If your task needs a locked file, either wait, or scope your change to a
   different file, or hand the patch over (§9).

There is no lock file and no ticket system in this repo. **The open PR list is
the lock.** Respect it.

### 3.2 Branch naming

| agent | branch prefix |
|---|---|
| Claude Code | `claude/<topic>` |
| ChatGPT / Codex | `chatgpt/<topic>` |
| Human | anything else |

Never commit to a branch carrying another agent's prefix. Never commit directly
to `main`.

### 3.3 Branch hygiene — the rules that have actually cost this repo work

- **Always branch from a freshly fetched `origin/main`.** Not from a stale local
  main, not from another feature branch.
- **One concern per branch and per PR.** A branch that touches a page, a
  migration, and a workflow will conflict with three other branches instead of one.
- **Once a PR is open, its head is frozen. Never amend, rebase, or force-push it.**
  This repo has measured the failure twice: GitHub merges the head it had when it
  computed the merge, so a force-push silently loses exactly what a trailing
  commit would have. Follow-up work is a **new commit** if the PR is still open,
  or a **new branch from the merged `main` in a new PR** if it is not.
- **A merged PR is finished.** Never stack new commits on a merged branch.
- Confirm a commit actually landed with
  `git merge-base --is-ancestor <sha> origin/main` — not from a merge notification.

### 3.4 The one shared file a new page must touch

A new page is unreachable — and `scripts/audit.py` warns about it — unless it is
wired into `nav.js`. That means two additive edits:

1. One entry in the `PS` map (page slug → nav section).
2. One entry in the relevant `SECTIONS` array.

Both are single-line additions. Add them at the **end** of their respective
blocks, never in the middle, so that two agents adding two pages produce a
trivially resolvable conflict instead of an interleaved one. Change nothing else
in `nav.js`.

---

## 4. File ownership — preventing class B conflicts

These are the cases where both diffs look correct, merge without complaint, and
the result is broken. Each one has been a real, shipped bug here.

### 4.1 The cascade has a rendered sheet order, and it is not the obvious one

A live render of `dashboard.html` enumerates **62 stylesheets**. Order decides
ties at equal specificity, and the order is:

- **sheet 0** — the page's own `<style>` block
- **sheet 1** — the stylesheet `bg.js` injects
- **sheets 2–61** — everything else, including `omega-visual-evolution.css` (13),
  `nav.js` (16), `theme.js` (19), `omega-backdrop.js` (20)

Three consequences that repeatedly catch new contributors:

- **A page's own `<style>` loses to `bg.js`.** Redefining a canonical token in a
  page's `:root` is dead code. 62 pages already do this; every one of those
  blocks is measured dead. Do not add a 63rd.
- **`bg.js` does not own the palette.** `theme.js` re-declares `--void`, `--crim`,
  `--ink`, `--muted`, `--line` later in the cascade and wins. Changing a palette
  token in `bg.js` alone does not ship.
- **A rule written in `bg.js` for a surface `bg.js` does not own is dead code that
  looks correct in the diff.**

| surface | actual owner |
|---|---|
| design tokens, layout, `.glass`, `.chip`, `.btn`, `.bar-*` | `bg.js` |
| `.card` / `.kpi` shadow + border, `.topbar`, `.sechead` | `omega-visual-evolution.css` |
| `#omega-side` (with `!important`) | `nav.js` |
| `body { background }` (with `!important`) | `omega-backdrop.js` |
| `--void`, `--crim`, `--ink`, `--muted`, `--line` | `theme.js` |

**Before styling any shared class, verify the owner in a render — not in this
table, and not by grepping `bg.js`.**

### 4.2 Do not hand-roll what `bg.js` already provides

Every page loads `bg.js`, which injects the design system, the approval guard
(it hides `#app` / `.shell` / `main.main` until the profile is confirmed
approved), the nav, and the platform modules. A new page must:

- load `bg.js` the way existing pages do;
- use the existing classes and tokens (`.card`, `.kpi`, `.btn-gold`, `--gold`,
  `--cyan`, …);
- **not** write its own auth check. The per-page auth check is exactly the bug the
  approval guard was built to fix — it had a timing gap between "session exists"
  and "profile approved."

### 4.3 The Supabase client is self-hosted. Never import from a CDN.

The client lives at `/vendor/supabase-js.js`. Do **not** write:

```js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'  // NEVER
```

That pattern was removed from 146 call sites. It puts a third-party CDN on the
critical path of every page view, and a top-level import that never resolves runs
*none* of that module's code — the page paints its placeholders and sits there
forever, with no error. The verification harness stubs the local path, not
`esm.sh`, so this also silently invalidates every browser check.

### 4.4 A Supabase write does not throw. It resolves.

This is the single most repeated root cause of real bugs in this repository.

```js
// WRONG — catches nothing. This is the bug, not a defense against it.
try { await sb.from('t').insert(row); toast('Saved'); } catch (e) { ... }

// RIGHT
const { error } = await sb.from('t').insert(row);
if (error) { toast('Could not save'); return; }
toast('Saved');
```

Supabase resolves to `{ data: null, error }`. Every non-read `sb.from(...)` /
`sb.rpc(...)` call must check `.error` **before** showing success, advancing a
flow, or updating state optimistically. `scripts/silent-failure-detector.py`
gates this and is blocking in CI.

### 4.5 A wrong column name empties the whole page, silently

PostgREST rejects the *entire* query when any single column name is unknown — so
one typo blanks a page with no visible error. `supabase/live-schema.json` is the
snapshot of what the database actually has; `scripts/schema-dictionary.py` gates
column names against it. Historical offenders, all now swept: `zodiac_sign` →
`sign`, `full_name` → `display_name`, `agent_name` → `agent`, `created_at` →
`occurred_at` on event tables.

### 4.6 A user-facing string lives in eight places

Adding or changing a `data-i18n` string means writing:

1. the HTML attribute,
2. the `T_EN` key set inlined in `i18n.js`,
3. **all six** packs — `i18n/{ar,es,fr,hi,nl,zh}.json`.

Fixing only the HTML leaves five translations lying to five audiences.
`scripts/i18n-contract.py` is blocking: every static `data-i18n` key must resolve
in `T_EN`, no pack may carry a key `T_EN` lacks, and **no value may contain an
HTML entity** (every write path here is textual, so entities render literally).

### 4.7 Never hardcode a bottom offset, and never assert a number in copy

- **Bottom chrome.** Five modules anchor fixed elements to the viewport floor.
  They coordinate through `--omega-chrome-bottom` and `--omega-transient-bottom`,
  published by `omega-bottom-stack.js`. Read the property; never add another
  `bottom: 102px`. Mark new persistent furniture `data-omega-bottom-chrome`.
- **Counts in member-visible copy drift.** Six pages once asserted a page count to
  the member and every one was wrong. `scripts/page-count-claims.py` is blocking.
  Derive numbers; don't type them.

### 4.8 Attribute values must be quoted with straight quotes

`class=tab-pane active` parses as class `"tab-pane"` plus a stray attribute — and
three pages once rendered completely blank because `.tab-pane.active` never
matched. A curly quote (`”`) is not a delimiter at all. 294 such sites existed
across 8 pages. Quote every attribute value, with `"`.

### 4.9 Never render fabricated data as fact

`Math.random() * 100` was once drawn as a member's real progress, and a revenue
figure was accumulated from ad paints under a "creators earn 70%" label. If the
data model records completion, show completion — do not invent a percentage it
cannot support. `scripts/commerce-contract.py` gates the money shape and is
blocking.

### 4.10 New web directories must be added to the build allow-list

Vercel no longer serves the repo root. `scripts/vercel-build.sh` copies the web
surface into `public/` from a **fixed directory allow-list**:

```
vendor  i18n  assets  static  images  img  icons  media  fonts  audio  video  css  js  .well-known
```

A new top-level directory not on that list is simply absent from production while
the build still prints `PASS`. That already cost `/vendor/supabase-js.js` on 127
pages. Add the directory to the list in the same change — and **never commit
`public/`**.

---

## 5. Hard stops — never do these

### 5.1 Never write to a live service

Authoring is your lane. Applying is not. **ChatGPT must never:**

1. **Apply a Supabase migration**, run `apply_migration`, or execute DDL against
   the live project. The live ledger (`supabase_migrations.schema_migrations`)
   matches `supabase/migrations/` file for file. An out-of-band apply creates a
   remote row with no local file, and **git cannot undo it.** Author the migration
   file; hand it over for applying.
2. **Deploy an Edge Function.** Nothing in CI type-checks them (there is zero
   `deno check` in `.github/workflows/`), so a deploy is the first place an error
   appears — in production.
3. **Promote or deploy to Vercel.**
4. **Set or read a secret.** `STRIPE_*`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`
   live in Supabase secrets and are never committed.

### 5.2 Never commit a `service_role` key or `SUPABASE_SERVICE*` reference to
client-shipped code. This is a blocking CI scan and a genuine security boundary:
RLS policies are the *only* authorization layer between a member and the data.

### 5.3 Never add a line to `CLAUDE.md`

`CLAUDE.md` is at **15,996 of a hard 16,000-token budget**, enforced blocking by
`scripts/context-budget.py`. That is roughly four tokens of headroom — about two
words. Appending one sentence fails CI on **every open PR from both agents**,
including ones that have nothing to do with your change.

If you have something that genuinely belongs in permanent context, propose the
edit in your handoff along with what should be **removed** to pay for it. See §8
for where documentation actually goes.

### 5.4 Never introduce a build step, framework, bundler, or npm dependency

"No build step" is a load-bearing, deliberate property of this deployment.
`vercel.json` explicitly disables install and build. Every `.html` and `.js` file
ships as-is. React, Next, Tailwind, Vite, a component tree, a package manager —
none of these exist here, and a proposal that assumes one is not a proposal for
this repo.

### 5.5 Never ship a monetizable or legally-sensitive feature live

Tokens, payments, and data-sharing ship **dormant behind a
`public.platform_settings` flag**, matching the existing `tokens_enabled` pattern,
with user-facing copy in the future tense until the owner turns it on.

### 5.6 Never disable, skip, or quarantine a check to get to green

Not a test, not a CI step, not a gate. If a gate is wrong, say so in the handoff
with the evidence; do not route around it.

### 5.7 Never rewrite an applied migration

Never renumber, edit, or delete a migration that has already been applied. New
schema goes in a **new** timestamped file.

### 5.8 Never put schema only in `supabase/*.sql`

`supabase/migrations/` is authoritative. The flat `supabase/*.sql` bag is
reference material with no ledger, applied by hand — **schema declared only there
never deploys.** A new migration also needs its row in
`supabase/remote-migrations.json` in the same change.

### 5.9 Never treat a search result as a verdict

A repo-wide grep is a candidate generator. Confident grep findings here have been
flatly wrong — `theme-color` "missing on 121 pages" was actually fine on 172 of
173, because `bg.js` injects it at runtime. If you cannot render the page, say
"grep suggests" and never "measured."

---

## 6. Generated files — never hand-edit, always regenerate

Hand-editing any of these fails a blocking gate, and two agents regenerating one
produces a guaranteed conflict.

| artifact | generator |
|---|---|
| `OMEGA_SKILL_REGISTRY.md` (the census) | `python3 scripts/omega-registry.py` |
| `EVIDENCE_MATRIX.md` | `python3 scripts/evidence-audit.py` |
| `docs/capabilities/registry.json` | `python3 scripts/capability-audit.py` |
| `supabase/live-schema.json` | regenerated from the live database, by whoever applied the schema |
| `public/` | `scripts/vercel-build.sh` — **never commit it** |

**Rules:**

- Regenerate as the **last step before commit**, never mid-work.
- If a generated file conflicts on merge, **take neither side.** Resolve the
  source files, then re-run the generator and commit its output.
- If you cannot run the generator, say so and leave the file untouched. A stale
  generated file is a caught error; a hand-written one is an uncaught lie.
- The census gate is the only thing that notices a third party editing the
  estate. Do not auto-commit it in CI and do not weaken it.

---

## 7. Before you hand anything over: the verification contract

**One command settles almost everything:**

```bash
./scripts/ci-local.sh          # the blocking gates
./scripts/ci-local.sh --all    # plus the seven that block on GitHub only
```

That is 23 blocking checks locally, plus a tail of seven that are **blocking on
GitHub and reported only locally** (`schema-dictionary`, `rls-auditor`,
`silent-failure-detector`, `migration-consistency`, `migration-history-contract`,
`upsert-conflict-check`, `supabase-migration-security-audit`). The tail's exit
codes are swallowed by `|| true` — **read its output; a green summary line does
not cover it.**

Install the hook so this cannot be skipped:

```bash
git config core.hooksPath .githooks
```

For a UI or data-layer change, also run the render:

```bash
node scripts/verify-runtime.js
```

`node --check` on a `.js` file is **not** verification. It proves the file parses;
it proves nothing about whether the rule reached the cascade, whether the element
was measured after the approval guard lifted, or whether the write actually
persisted.

### 7.1 If you cannot run the checks

ChatGPT in a browser generally cannot run this repo's Python gates. That is fine
— it changes the handoff, not the standard. **Say which checks you ran and which
you could not.** Output that has not been through `ci-local.sh` is a *proposal*,
and the handoff should label it as one so it gets run before it is committed.

Claiming a check passed when it was not run is the one failure mode this contract
cannot absorb: it converts a caught problem into a shipped one.

### 7.2 Verification traps specific to this repo

- **A "0 findings" result may be a broken scanner.** A stopped static server
  reports 0. So does a regex damaged in transit. Cross-check with a run that
  *must* find something.
- **A shallow clone answers `git log -1 -- <path>` with the graft boundary and
  does not fail.** Every file dates to the clone. Three wrong dates reached a
  committed registry that way.
- **DOM presence is not visibility.** `querySelectorAll` happily counts 171 rows
  inside a `display:none` panel.
- **A before/after screenshot diff has a ~1.6% noise floor here** (particle canvas
  and drift keyframes never settle). Diff a same-build pair first to establish it.

---

## 8. Documentation protocol

`CLAUDE.md` is closed (§5.3). Everything else routes as follows:

| what you have | where it goes |
|---|---|
| A bug you fixed, with evidence | **append to the end of `FIXES_LOG.md`** |
| A gap you found but did not close | `GAP_ANALYSIS.md` §S |
| A page / module / table / RPC / Edge Function added or removed | `REPOSITORY_AUDIT.md` + `CAPABILITY_INVENTORY.md` |
| A term with no clear meaning here | `OMEGA_TAXONOMY.md` pending-terminology list |
| A feature idea | `FEATURE_IDEAS.md` — proposal only, no code |
| Rules for how agents collaborate | **this file** |

Two standards apply to all of them:

- **Every claim is evidence-cited** — a `file:line`, a command's actual output, or
  a query result. Never mark something fixed, applied, or verified unless it
  actually was, in that session. An unverified item stays unverified; do not
  upgrade it on assumption.
- **Update the section that changed**, rather than rewriting the file. Two agents
  rewriting one document is an unresolvable conflict; two agents editing different
  sections is a clean merge.

`FIXES_LOG.md` is append-at-the-end **specifically so two agents can both write to
it without conflicting.** Do not insert entries in the middle.

---

## 9. Conflict resolution — when it happens anyway

### 9.1 Who wins, by file class

| file class | resolution |
|---|---|
| Generated artifact (§6) | **Neither.** Resolve sources, re-run the generator. |
| `bg.js`, `nav.js`, `omega-*.js` | Claude's version is the base. Re-apply the ChatGPT change on top as a separate commit, then re-verify. |
| `supabase/migrations/*` | **Never merge two migrations into one file.** Both stay as separate timestamped files. If they contradict, the later one wins and the earlier is superseded by a third migration — never by an edit. |
| A single `.html` page | Whoever's PR opened first keeps the file; the other rebases their change onto the merged result. |
| `i18n/*.json` | Union of keys. Both agents' translations are kept. |
| `FIXES_LOG.md` / audit docs | Union. Both entries are kept, in timestamp order. |
| `CLAUDE.md` | There should be no conflict, because neither agent appends (§5.3). If there is one, it is a bug in this process — stop and raise it. |

### 9.2 The merge-conflict procedure

Merge the base branch **into** the feature branch — never rebase or force-push a
branch with an open PR (§3.3). Regenerate lockfiles and generated files with the
repo's tooling, never by hand. Then re-run `./scripts/ci-local.sh` before pushing:
a conflict resolution is a code change and deserves the same gate.

### 9.3 Handoff template

When ChatGPT produces something another agent or the owner must land, end with
this block. It is what makes a handoff actionable instead of a re-derivation:

```
── HANDOFF ──
Branch:        chatgpt/<topic>          (or: uncommitted proposal)
Intent:        <one sentence>
Files changed: <exact paths>
Shared files touched: <bg.js / nav.js / i18n / migrations — or "none">
Checks run:    <e.g. "none — no repo access"> 
Checks NOT run: <name them>
Live services touched: none        ← must always read "none"
Known risks:   <what you are unsure about>
Needs from the other agent: <specific asks>
```

---

## 10. Quick reference card

**Always**

- Branch `chatgpt/<topic>` from a fresh `origin/main`; one concern per PR.
- Check open PRs before editing any existing file.
- Check `.error` on every Supabase write before showing success.
- Quote every HTML attribute value with straight quotes.
- Write a user-facing string to the HTML, `T_EN`, **and** all six packs.
- Add a new page to `nav.js`'s `PS` map and its `SECTIONS` entry.
- Add a new web directory to `scripts/vercel-build.sh`'s allow-list.
- Regenerate generated files last, with their generator.
- Say which checks you ran and which you did not.

**Never**

- Append to `CLAUDE.md` (4 tokens of headroom; blocking gate).
- Apply a migration, deploy an Edge Function, or promote a deploy.
- Amend, rebase, or force-push a branch with an open PR.
- Import Supabase from `esm.sh` or any CDN.
- Redefine a canonical token in a page's `:root` (dead code — sheet 0 loses).
- Hand-roll an auth check on a page.
- Hardcode a `bottom:` offset or a page count in copy.
- Render `Math.random()` — or any invented number — as member data.
- Introduce a build step, framework, bundler, or npm dependency.
- Commit a `service_role` key, any secret, or `public/`.
- Disable, skip, or weaken a check to reach green.
- Flip a `platform_settings` flag to `true`.

**When unsure:** author the file, run what you can, and hand it over with the
§9.3 block. A proposal that is honestly labelled costs one review. A change that
claims verification it does not have costs a production incident.

---

*Companion documents: `CLAUDE.md` (Claude Code's operating context — read it, do
not edit it), `FIXES_LOG.md` (evidence-cited bug history — search it before
concluding a bug is new), `GAP_ANALYSIS.md` §S (what is genuinely open).*
