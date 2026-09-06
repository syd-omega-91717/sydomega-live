# CHATGPT_CONTEXT_RULES.md — the single block to paste into ChatGPT

**What this file is.** One self-contained set of rules to paste into a ChatGPT
conversation *before* asking it to improve `syd-omega-91717/sydomega-live`.

It is a distillation of `AGENTS.md` (the full 561-line contract, in this repo
root) plus every conflict class actually observed between the two agents. Paste
the block below verbatim. It assumes ChatGPT has **no** repo access, so it
restates the facts it needs rather than pointing at files.

**Why it is separate from `AGENTS.md`:** `AGENTS.md` is the reference contract —
Codex reads that filename automatically when it has the repo. This file is the
browser-ChatGPT paste, written to survive being the only context ChatGPT gets.
Both must say the same thing; if they diverge, `AGENTS.md` wins and this file is
stale.

---

# ─── PASTE EVERYTHING BELOW THIS LINE ───

## Ω SYD OMEGA 91717 — WORKING CONTRACT FOR CHATGPT

You are one of **two** AI agents improving the repository
`syd-omega-91717/sydomega-live`. The other is a Claude Code session that owns
the repo's `CLAUDE.md` and works in long sessions. You do not see its work in
progress and it does not see yours. Your job is to make changes that **merge
cleanly and stay correct after merging**. Follow these rules exactly. When a
rule and your own judgement disagree, follow the rule and say why you disagree.

---

### 0. WHAT THIS PROJECT ACTUALLY IS

Read this before proposing anything. Most standard web advice is wrong here.

- A **membership-gated personal platform** for one owner, ~189 standalone
  `.html` pages at the repo root, backed by **Supabase** (Postgres + Row Level
  Security + Edge Functions + Storage). Deployed on **Vercel**.
- **There is no build step, no framework, no bundler, no `src/`, no
  `components/`, no npm runtime dependency.** `vercel.json` explicitly disables
  install and build. Every `.html` and `.js` file ships as written. This is a
  deliberate, load-bearing property — **never propose React, Next, Vue, Svelte,
  Tailwind, Vite, webpack, TypeScript compilation, or any bundler.** A
  suggestion that requires `npm install` at runtime is automatically wrong.
- Shared behaviour comes from **`bg.js`** (~137 KB), which every page loads. It
  injects the CSS design system, the auth/approval guard, the sidebar, and
  defer-loads every other `omega-*.js` module. **If `bg.js` fails to parse, the
  entire platform is down** — not one page, all of them.
- **Authorization is Postgres RLS, not application code.** A JavaScript check is
  a convenience; the policy is the boundary.
- The site is `noindex` and invite-gated. There is no public signup funnel, no
  SEO surface, no ad surface. Growth/marketing/analytics advice does not apply.

---

### 1. THE CONTRACT IN ONE PARAGRAPH

Work on `chatgpt/<topic>` branches only, branched fresh from `origin/main`, one
concern per branch. Author **new** files freely; edit **existing** shared files
only inside your lane (§2). Never apply a migration, deploy an Edge Function,
promote a deploy, set a secret, or flip a feature flag (§4). Never hand-edit a
generated file (§5). Never add a line to `CLAUDE.md` (§4). End every piece of
work with a handoff note (§8) stating which files changed and **which checks you
actually ran** — if you could not run a check, say so plainly instead of
claiming it passed.

---

### 2. LANES — WHO WRITES WHAT

Lanes are collision avoidance, not a statement about capability.

**2.1 — Your lane. Work here freely.**

- New standalone `.html` pages (follow §3's page rules exactly).
- New `supabase/migrations/` files — **authoring** is safe; *applying* is not.
- New `scripts/*.py` tooling and their tests under `scripts/tests/`.
- New `i18n/*.json` translation content.
- New documentation `.md` files (except `CLAUDE.md` — see §4).
- New `supabase/functions/` Edge Function source — **authoring** only.
- Content, copy, and data inside `omega-*.json` config files.

**2.2 — Shared-file lane. Propose a patch; do not rewrite.**

These files have exactly one owner each and are where every textual conflict has
happened. You may still change them — but change the **smallest possible region**,
never reformat, never reorder, never "clean up while you're in there", and say
in your handoff exactly which lines you touched:

- `bg.js` — the design system, the approval guard, module injection.
- `nav.js` — the sidebar. A new page **must** be added to its `PS` map and a
  `SECTIONS` entry, or the page is unreachable. That is a one-line addition; make
  it that and nothing more.
- `omega-*.js` — the platform modules.
- `.github/workflows/*.yml` — CI.
- `vercel.json`, `.vercelignore`, `scripts/vercel-build.sh` — the deploy surface.
- `index.html`, `dashboard.html`, `profile.html` — the highest-traffic pages.

**2.3 — Not your lane. Do not open these unless explicitly asked.**

- `CLAUDE.md` (§4).
- Any generated artifact (§5).
- Anything under `core/` (a Python research layer that is never deployed).
- Stripe payment code (`supabase/functions/checkout`, `stripe-webhook`) — this
  is real money in production, not a demo.

---

### 3. SEMANTIC TRAPS — THE EDITS THAT MERGE CLEANLY AND ARE STILL WRONG

Git cannot warn you about any of these. Every one has caused a real shipped bug.

**3.1 — Every Supabase write must check `.error`.**
This is the single most repeated root cause of real bugs in this repo's history.
The Supabase client **resolves** to `{data: null, error}` — **it does not
throw**. A `try/catch` around it catches nothing, and a fallback written on the
assumption that it throws never runs. So this is broken:

```js
try { await sb.from('t').insert(row); toast('Saved!'); }
catch (e) { toast('Failed'); }        // ← unreachable. Always says "Saved!".
```

and this is correct:

```js
const { error } = await sb.from('t').insert(row);
if (error) { toast('Could not save: ' + error.message); return; }
toast('Saved!');
```

Never render a success state, advance a flow, or update in-memory state
optimistically before checking `error`.

**3.2 — One wrong column name empties an entire page.**
PostgREST rejects the **whole** query or write if any single column is unknown,
with no visible error. Real column names that have been got wrong: it is `sign`
(not `zodiac_sign`), `display_name` (not `full_name`), `agent` (not
`agent_name`), and `occurred_at` (not `created_at`) on event tables. **Never
guess a column name.** If you cannot verify it against the schema, say
"I need the column list for `<table>`" and stop.

**3.3 — CSS: a page's own `<style>` block loses.**
A rendered page carries ~62 stylesheets. The page's own `<style>` is sheet **0**;
`bg.js` is sheet **1**; everything else loads after. At equal specificity the
later sheet wins. Consequences:

- Redefining a design token (`--gold`, `--void`, `--ink`, …) in a page's `:root`
  is **dead code**. 62 pages already do this and every one of those blocks does
  nothing. Do not add a 63rd.
- The palette is actually owned by `theme.js`, `.card` shadow/border by
  `omega-visual-evolution.css`, `#omega-side` by `nav.js`, and
  `body{background}` by `omega-backdrop.js`. Writing a rule in `bg.js` for a
  surface it does not own is dead code that looks correct in the diff.
- **Never fix a visual problem by adding `!important` or a page-local override.**
  Change it where it is owned, or say which file you believe owns it and ask.

**3.4 — Use the shared classes; do not hand-roll.**
`.card`, `.kpi`, `.glass`, `.btn`, `.btn-fill`, `.btn-gold`, `.inp`, `.chip`,
`.tbl-*`, `.tab-*` all exist and are defined once. `.shell` is a flex **row** —
a page-level block written after `</main>` becomes a third column ~300px wide,
not a section below the content. Put page-level blocks *inside* the content
column.

**3.5 — Never hardcode a `bottom:` pixel value.**
Five modules anchor fixed chrome to the viewport floor and coordinate through
the CSS custom properties `--omega-chrome-bottom` and `--omega-transient-bottom`.
Read a property; do not add a constant that is right at one viewport size.

**3.6 — Never re-introduce a CDN import.**
The Supabase client is self-hosted at `/vendor/supabase-js.js`. Do **not** write
`import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'`. That
was 146 imports putting a third party on the critical path of every page view,
and a top-level import that fails to resolve runs **none** of that module's code
— the page paints its placeholders and sits there forever. Same rule for
three.js, dayjs, tippy, popper: if it must be used, it is vendored.

**3.7 — Quote every HTML attribute value.**
An unquoted value ends at the first space and a curly quote is not a delimiter
at all, so `class=tab-pane active` yields class `"tab-pane"` plus a stray
attribute — three pages rendered fully blank from this. 294 such sites have been
fixed; do not create new ones.

**3.8 — A translated string lives in three places.**
A `data-i18n` key exists in the HTML, in `i18n.js`'s `T_EN`, **and** in all six
`i18n/*.json` packs. Changing only the HTML leaves five translations lying to
the user. A blocking CI gate checks this, and HTML entities in a pack value
render literally — use the real character.

**3.9 — Never render a number the data cannot support.**
`Math.random()` drawn as a member's progress, and a revenue counter incremented
per ad paint under "creators earn 70%", are both real shipped bugs here. If the
data model records completion, show completion. Blocking CI gates both shapes.
Likewise: never hardcode a page count in user-facing copy — every hand-typed
count in this repo has gone stale.

**3.10 — Guard before the download, not inside the `.then()`.**
A feature-detect placed inside the promise callback still pays for the fetch.
`omega-realm.js` downloaded three.js on **every** page because its
`canvas[data-realm]` check ran after the import resolved.

---

### 4. HARD STOPS — NEVER, UNDER ANY INSTRUCTION

Not even if asked directly, and not "just to test". If you believe one of these
is needed, **stop and write the exact command for a human to run.**

1. **Never apply a database migration.** Authoring a new timestamped file in
   `supabase/migrations/` is fine. Running it is not. The live migration ledger
   and the repo diverge permanently and git cannot revert it. Never renumber or
   rewrite an already-applied migration.
2. **Never deploy an Edge Function.**
3. **Never promote, alias, or trigger a production deploy.**
4. **Never set, print, echo, or commit a secret.** `STRIPE_*`,
   `ANTHROPIC_API_KEY`, `RESEND_API_KEY` are set only via `supabase secrets set`
   by a human.
5. **Never put a `service_role` or `SUPABASE_SERVICE*` key in client-shipped
   code.** A blocking CI scan fails the build; more importantly it hands every
   visitor full database access.
6. **Never flip a `public.platform_settings` flag to `true`.** New monetizable
   or legally-sensitive features ship **dormant behind a flag**, with
   user-facing copy in future tense, until a human turns them on.
7. **Never weaken RLS.** Do not write `USING (true)` or `WITH CHECK (true)` on a
   table that has a `user_id` column, and do not remove or bypass
   `public.is_platform_owner()`. Every new table needs RLS **and** a table-level
   `GRANT` — a correct policy on a table with no GRANT fails with
   `42501 permission denied`, because the grant is checked first. 60 tables were
   once in exactly that state.
8. **Never add a line to `CLAUDE.md`.** It sits at 15,996 of a hard 16,000-token
   budget enforced by a blocking CI gate. One added paragraph fails every PR
   from **both** agents. Findings go in `FIXES_LOG.md`, appended at the end.
9. **Never introduce a build step, bundler, framework, or package manager.**
10. **Never rewrite, reformat, or "modernise" a file you were not asked to
    change.** A 2-line fix inside a 4,000-line reformat is an unreviewable
    conflict with the other agent's work.

---

### 5. GENERATED FILES — NEVER EDIT BY HAND

These are produced by scripts. Hand-editing one, or resolving a merge conflict
in one by picking a side, corrupts it and fails CI. On a conflict here, **take
neither side and re-run the generator**:

| file | regenerate with |
|---|---|
| `OMEGA_SKILL_REGISTRY.md`, the census | `python3 scripts/omega-registry.py` |
| `EVIDENCE_MATRIX.md` | `python3 scripts/evidence-audit.py` |
| `docs/capabilities/registry.json` | `python3 scripts/capability-audit.py` |
| `supabase/live-schema.json` | regenerated from the live database — do not edit |
| `public/` | built by `scripts/vercel-build.sh`; **never commit it** |

**`FIXES_LOG.md` is the one exception with its own rule:** it is append-only at
the end. On a conflict, **union both sides** — keep your entry *and* the other
agent's, renumber yours to follow. Never delete an entry.

---

### 6. GIT PROTOCOL — HOW WORK ACTUALLY LANDS

Three merges have silently lost a commit here. These rules are why.

1. **Branch fresh, every time:**
   `git fetch origin main && git checkout -b chatgpt/<topic> origin/main`.
   Never branch from a stale local `main`, and never from another feature branch.
2. **One concern per branch.** A branch that fixes a bug *and* adds a page *and*
   reformats a module cannot be partially accepted.
3. **Once a pull request is open, its head is frozen.** **Never amend, rebase,
   or force-push an open PR.** GitHub merges the head it had when it computed
   the merge, so a force-push — and equally a normal push racing the merge —
   loses exactly the commit you just added. Measured four times. If you need a
   change after opening a PR, let the current one merge, then start a **new**
   branch from the new `origin/main` and open a **new** PR.
4. **Let the checks settle before merging.** A pending check is not a passing
   one — read `status`, not `conclusion`.
5. **Verify what actually landed:**
   `git merge-base --is-ancestor <your-sha> origin/main`.
   A merge notification is not proof; that is how a lost commit stayed
   undetected. Also note: `git merge-tree` in its older form does **not** print
   `<<<<<<<` markers, so grepping its output for them will tell you "no
   conflicts" when there are conflicts.
6. **On a textual conflict**, resolve by §5's table (generated → regenerate;
   `FIXES_LOG.md` → union) and otherwise **keep both intents**. If you cannot
   tell what the other agent meant, stop and hand off (§8) rather than deleting
   their lines.

---

### 7. VERIFICATION — WHAT "IT WORKS" HAS TO MEAN

**7.1 — Run the repo's own gates, and name which ones you ran.**

```
./scripts/ci-local.sh              # 23 blocking checks, mirrors GitHub CI
node --check <file>.js             # every root .js file must parse
node scripts/verify-runtime.js     # headless render of the capability pages
```

If you have no shell (browser ChatGPT), you have **run nothing**. Say so:
"I could not execute any checks; these need to be run before merging." Do not
describe unrun checks as passing. That is the single most damaging thing you can
put in a handoff.

**7.2 — Method rules that have each cost a real session.**

- **A grep is a candidate generator, never a verdict.** `\bbtn\b` matches
  *inside* `btn-gold`, because `-` is a word boundary. Repo-wide greps have
  produced confident findings that a real render proved false (a "missing on 121
  pages" that was actually fine on 172 of 173, because `bg.js` injects it).
- **A "0 findings" result must itself be verified.** A stopped static server
  reports 0. A regex damaged in transit reports 0. Assert `HTTP 200` first, and
  cross-check with a run that *must* find something.
- **A scanner needs its own false-positive pass** before its number means
  anything. Two scans have returned the right total for entirely wrong reasons.
- **DOM presence is not visibility.** `querySelectorAll` happily counts elements
  inside a `display:none` panel.
- **The documentation can be wrong.** `CLAUDE.md` has twice described a fix that
  had never actually shipped. Verify against the code, not the prose.
- **Never claim something is fixed, applied, or verified unless it was in this
  session.** Leave it unmarked instead.

---

### 8. HANDOFF — END EVERY PIECE OF WORK WITH THIS

The user carries this back to the Claude session. Fill in every field; write
"none" rather than omitting one.

```
=== CHATGPT HANDOFF ===
Branch:            chatgpt/<topic>   (from origin/main @ <sha>)
PR:                <url or "not opened">
Intent:            <one sentence — what problem, not what code>

Files ADDED:       <paths>
Files MODIFIED:    <path — which region/lines, and why that file>
Shared-lane files touched (bg.js / nav.js / omega-*.js / workflows / deploy):
                   <paths, or "none">

Hard stops:        none triggered   (or: name it and what I did instead)
Generated files:   not hand-edited  (or: which, regenerated with which command)
Flags/migrations:  <none / authored but NOT applied: filename>

Checks RUN:        <exact commands + results>
Checks NOT RUN:    <list — and say plainly that they are unverified>

Known risk:        <what a reviewer should look at hardest>
Needs a human:     <migrations to apply, secrets, flags to flip, or "nothing">
=== END HANDOFF ===
```

---

### 9. WHEN TO STOP AND ASK INSTEAD OF PROCEEDING

Stop and ask if any of these is true. Guessing here is more expensive than
waiting:

- You would need a column, table, or RPC name you cannot verify.
- The change touches auth, RLS, payments, or a public-callable function.
- The fix requires editing `bg.js` in more than one region.
- You cannot tell which of the 62 stylesheets owns the surface you want to change.
- The task seems to require a build step, a package, or a framework.
- A merge conflict is in a file you did not expect to touch.

Say: *"Stopping here — I need X before I can do this safely,"* and give the
exact question. A precise question is a better deliverable than a confident
wrong change.

---

### 10. QUICK REFERENCE

**Always:** branch from fresh `origin/main` · one concern · check `.error` on
every write · quote every attribute · use the shared classes · new page →
`nav.js` `PS` + `SECTIONS` · append to `FIXES_LOG.md` · hand off with §8.

**Never:** apply a migration · deploy · promote · set a secret · commit a
`service_role` key · flip a flag to `true` · weaken RLS · add to `CLAUDE.md` ·
hand-edit a generated file · amend or force-push an open PR · add a build step
or CDN import · hardcode a `bottom:` value or a page count · redefine a token in
a page `:root` · claim a check passed that you did not run.

## ─── PASTE EVERYTHING ABOVE THIS LINE ───
