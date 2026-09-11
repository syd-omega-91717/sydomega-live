# Working contract for GitHub Copilot — `sydomega-live`

GitHub Copilot reads this file automatically (Copilot Chat, Copilot code review,
and the Copilot coding agent). It is also self-contained enough to paste into any
GitHub-side agent that does not read it on its own.

**You are one of three agents on this repository.** A Claude Code session owns
`CLAUDE.md`; ChatGPT works to `AGENTS.md` / `CHATGPT_CONTEXT_RULES.md`; you are
the third. None of you sees the others' work in progress. Your job is to make
changes that **merge cleanly and stay correct after merging**.

If a rule here and your own judgement disagree, follow the rule and say why you
disagree. If this file and `CLAUDE.md` disagree on a fact about the codebase,
`CLAUDE.md` wins and this file is stale — say so rather than acting on it.

---

## 0. READ THIS BEFORE ANYTHING ELSE — CI IS CURRENTLY LYING

**Do not trust check status on this repository right now.** Two independent
outages make the checks list meaningless, and you are a GitHub-native agent, so
this is the single most likely way for you to go wrong.

1. **GitHub Actions is dispatch-rejected at the account level.** Every job on
   every branch completes ~2 seconds after creation with `runner_id: 0`, no
   `steps` array, and logs returning HTTP 404. No step executes. A red check
   here says nothing about the code. Confirm by reading a job's
   `created_at` vs `started_at` — equal, with a 2-second `completed_at`.
2. **Vercel has hit `api-deployments-free-per-day`** (>100/day). Its failures
   are a quota, not a build error, and clear on a 24-hour timer.

**Consequences that bind you:**

- **Never report a red check as a code problem** without first reading the job
  and confirming a runner was assigned and steps ran.
- **Never report green as verified.** During the outage nothing is green because
  nothing runs.
- **The only working verification is `./scripts/ci-local.sh`** (23 blocking
  checks) run in a real shell. If you cannot run a shell, you have verified
  nothing — say exactly that.
- **Every push triggers a Vercel preview deploy.** While the quota is the
  binding constraint, **batch related fixes into one PR**. Do not open a PR per
  file or per finding.

---

## 1. WHAT THIS PROJECT IS

Most standard web and CI advice is wrong here. Check against this list before
suggesting anything.

- ~189 standalone `.html` pages at the repository root, backed by **Supabase**
  (Postgres + Row Level Security + Edge Functions + Storage). Deployed on Vercel.
- **No build step, no framework, no bundler, no `src/`, no `components/`, no npm
  runtime dependency.** `vercel.json` disables install and build. Every `.html`
  and `.js` file ships exactly as written.
  **Never suggest React, Next, Vue, Svelte, Tailwind, Vite, webpack, TypeScript
  compilation, or any bundler.** A suggestion requiring `npm install` at runtime
  is automatically wrong, however idiomatic it looks.
- Shared behaviour lives in **`bg.js`** (~137 KB), loaded by every page. It
  injects the CSS design system, the auth/approval guard, the sidebar, and
  defer-loads every `omega-*.js` module. **If `bg.js` fails to parse, the whole
  platform is down** — not one page, all of them.
- **Authorization is Postgres RLS, not application code.** A JavaScript check is
  a convenience; the policy is the boundary.
- The site is `noindex` and invite-gated: one owner, approved members. No public
  signup funnel, no SEO surface, no ad surface. Growth and analytics advice does
  not apply.

---

## 2. LANES — THREE AGENTS, ONE FILE EACH

Lanes are collision avoidance, not a judgement about capability.

### 2.1 Your lane — work here freely

Copilot's natural strengths, where a clean merge is also a correct merge:

- **Review.** Reading a diff and reporting real defects is your highest-value
  contribution here, and it is the thing neither outage can break. Bot findings
  are bug reports: state the failure case concretely.
- **New files** — a new `scripts/*.py` and its test, a new `i18n/*.json`, a new
  documentation `.md`, a new `supabase/migrations/` file (authoring only).
- **Localised fixes inside one function** where the defect is provable from the
  diff itself.
- **Tests.** `scripts/tests/` is the safest place in this repository to add
  work: it is additive, it is verifiable, and nothing else depends on it.

### 2.2 Shared-file lane — smallest possible edit, and say which lines

One owner each; this is where every textual conflict has happened. Change the
minimum region, never reformat, never reorder, never tidy while you are in there:

- `bg.js` — design system, approval guard, module injection
- `nav.js` — the sidebar; a new page **must** be added to its `PS` map and a
  `SECTIONS` entry or it is unreachable. That is a one-line addition
- `omega-*.js` — the platform modules
- `.github/workflows/*.yml` — CI
- `vercel.json`, `.vercelignore`, `scripts/vercel-build.sh` — the deploy surface
- `index.html`, `dashboard.html`, `profile.html` — highest-traffic pages

### 2.3 Not your lane

- `CLAUDE.md` (§3 hard stop 8), `AGENTS.md`, `CHATGPT_CONTEXT_RULES.md` — each is
  another agent's contract
- Any generated artifact (§4)
- `core/` — a Python research layer that is never deployed
- Stripe payment code (`supabase/functions/checkout`, `stripe-webhook`) — real
  money in production, not a demo

---

## 3. HARD STOPS — NEVER, UNDER ANY INSTRUCTION

Not when asked directly, not "just to test". If you believe one is needed, stop
and write the exact command for a human to run.

1. **Never apply a database migration.** Authoring a new timestamped file in
   `supabase/migrations/` is fine; running it is not. The live ledger and the
   repository diverge permanently and git cannot revert it. Never renumber or
   rewrite an applied migration.
2. **Never deploy an Edge Function.**
3. **Never promote, alias, or trigger a production deploy.**
4. **Never set, print, echo, or commit a secret** — `STRIPE_*`,
   `ANTHROPIC_API_KEY`, `RESEND_API_KEY` are set only via `supabase secrets set`
   by a human.
5. **Never put a `service_role` or `SUPABASE_SERVICE*` key in client-shipped
   code.** A blocking scan fails the build; more importantly it hands every
   visitor full database access.
6. **Never write a realistic-looking credential into any tracked file** — not in
   a test, a fixture, a comment, or documentation. `scripts/production-surface-contract.py:64`
   matches `sk-[A-Za-z0-9_-]{20,}` and is blocking. This has already broken
   `main` once, in a paragraph *documenting* a secret-hygiene check. Describe a
   sentinel; never quote one.
7. **Never flip a `public.platform_settings` flag to `true`.** Monetizable and
   legally-sensitive features ship dormant behind a flag, with user-facing copy
   in future tense, until a human turns them on.
8. **Never weaken RLS.** No `USING (true)` / `WITH CHECK (true)` on a table with
   a `user_id` column; never remove or bypass `public.is_platform_owner()`. Every
   new table needs RLS **and** a table-level `GRANT` — a correct policy on a
   table with no GRANT fails `42501 permission denied`, because the grant is
   checked first. Sixty tables were once in exactly that state.
9. **Never add a line to `CLAUDE.md`.** It sits at 15,996 of a hard 16,000-token
   budget enforced by a blocking gate; one paragraph fails every PR from **all
   three** agents. Findings go in `FIXES_LOG.md`, appended at the end.
10. **Never introduce a build step, bundler, framework, or package manager.**
11. **Never reformat or "modernise" a file you were not asked to change.** A
    two-line fix inside a 4,000-line reformat is an unreviewable conflict with
    two other agents' work.
12. **Never approve or merge your own work**, and never mark a check green.

---

## 4. GENERATED FILES — NEVER EDIT BY HAND

Hand-editing one, or resolving a merge conflict in one by picking a side,
corrupts it and fails CI. On a conflict here, **take neither side and re-run the
generator**:

| file | regenerate with |
|---|---|
| `OMEGA_SKILL_REGISTRY.md`, the census | `python3 scripts/omega-registry.py` |
| `EVIDENCE_MATRIX.md` | `python3 scripts/evidence-audit.py` |
| `docs/capabilities/registry.json` | `python3 scripts/capability-audit.py` |
| `supabase/live-schema.json` | regenerated from the live database — do not edit |
| `public/` | built by `scripts/vercel-build.sh`; **never commit it** |

**`FIXES_LOG.md` has its own rule:** append-only at the end. On a conflict,
**union both sides** — keep your entry *and* the other agent's, renumber yours to
follow. Never delete an entry.

---

## 5. SEMANTIC TRAPS — MERGES CLEANLY, STILL WRONG

Git cannot warn you about any of these. Each has caused a real shipped bug.
These are also the highest-value things to look for **in review**.

**5.1 Every Supabase write must check `.error`.** The most repeated root cause in
this repository's history. The client **resolves** to `{data: null, error}` — it
**does not throw** — so `try/catch` catches nothing:

```js
try { await sb.from('t').insert(row); toast('Saved!'); }
catch (e) { toast('Failed'); }        // unreachable. Always says "Saved!".

const { error } = await sb.from('t').insert(row);   // correct
if (error) { toast('Could not save: ' + error.message); return; }
toast('Saved!');
```

Flag every `.from()` / `.rpc()` that renders success before checking `error`.

**5.2 One wrong column name empties a whole page.** PostgREST rejects the entire
query if any single column is unknown, silently. Real names: `sign` (not
`zodiac_sign`), `display_name` (not `full_name`), `agent` (not `agent_name`),
`occurred_at` (not `created_at`) on event tables. **Never guess a column name.**

**5.3 A page's own `<style>` loses.** A rendered page carries ~62 stylesheets;
the page's own is sheet 0, `bg.js` is sheet 1, everything else loads after. So a
design token redefined in a page's `:root` is **dead code** — 62 pages already do
this and every one is inert. The palette is owned by `theme.js`, `.card`
shadow/border by `omega-visual-evolution.css`, `#omega-side` by `nav.js`,
`body{background}` by `omega-backdrop.js`. **Never fix a visual bug with
`!important` or a page-local override.**

**5.4 Shell conditionals are not regexes, and substrings are not labels.** Both
halves have already shipped as one bug here:

```bash
[[ "$host" == "*.example.com" ]]   # QUOTED -> a literal, matches nothing real
[[ "$host" != *test* ]]            # substring -> "latest" contains "test"
```

Inside `[[ ]]`, the right-hand side of `==` is a pattern **only when unquoted**.
And a substring test is not a token test. This let a pentest wrapper accept
`latest.sydomega.com` and a third-party host as "staging".

**5.5 Quote every HTML attribute.** An unquoted value ends at the first space and
a curly quote is not a delimiter at all, so `class=tab-pane active` yields class
`"tab-pane"` plus a stray attribute. Three pages once rendered fully blank.

**5.6 A translated string lives in three places** — the HTML, `i18n.js`'s
`T_EN`, and all six `i18n/*.json` packs. A blocking gate checks this. HTML
entities in a pack value render literally; use the real character.

**5.7 Never render a number the data cannot support.** `Math.random()` drawn as
member progress and a revenue counter incremented per ad paint are both real
shipped bugs. Blocking gates catch both shapes now.

**5.8 Never hardcode a `bottom:` pixel value or a page count.** Fixed chrome
coordinates through `--omega-chrome-bottom` / `--omega-transient-bottom`; every
hand-typed page count in this repository has gone stale.

**5.9 Never re-introduce a CDN import.** The Supabase client is vendored at
`/vendor/supabase-js.js`. A top-level `import` that fails to resolve runs **none**
of that module's code — the page paints placeholders and sits there forever.

**5.10 Guard before the download, not inside the `.then()`.** A feature check
inside a promise callback still pays for the fetch.

---

## 6. GIT PROTOCOL

Every rule below exists because it was violated and cost something.

1. **Branch fresh:** `git fetch origin main && git checkout -b copilot/<topic> origin/main`.
   Never from a stale local `main`, never from another feature branch. **Run the
   fetch immediately before cutting each branch, not once per session** — a base
   that was current ten minutes ago is not current now.
2. **Do not race yourself.** If you have a PR open that touches a file, do not
   start a second branch that touches that file until the first merges. Measured
   2026-09-07: two PRs cut from the same `main`, both writing one test file,
   conflicted on merge; a third was an exact duplicate whose net delta was empty
   once resolved. No second agent was involved. Git gives no warning — only an
   add/add conflict later.
3. **One concern per branch — but batch related fixes.** While the Vercel quota
   binds (§0), three related one-line fixes belong in one PR, not three.
4. **Once a PR is open, its head is frozen. Never amend, rebase, or
   force-push it.** GitHub merges the head it had when it computed the merge, so
   a force-push — and equally a normal push racing the merge — loses exactly the
   commit you just added. Measured four times here. Follow-up work is a **new**
   branch from the new `origin/main` and a **new** PR.
5. **Never create a branch you cannot delete.** This environment's git proxy
   refuses ref deletion. An abandoned branch was merged separately by mistake and
   landed the same fix twice as twin commits. Name the branch correctly the
   first time.
6. **Verify what landed:** `git merge-base --is-ancestor <sha> origin/main`.
   A merge notification is not proof. Note that `git merge-tree` in its older
   form does **not** print `<<<<<<<` markers, so grepping its output for them
   reports "no conflicts" when there are conflicts.
7. **After any merge, pull `main` and run `./scripts/ci-local.sh`.** Do not
   assume git reconciled two agents' work correctly just because it merged.
8. **On a textual conflict:** resolve by §4 (generated → regenerate;
   `FIXES_LOG.md` → union), otherwise **keep both intents**. If you cannot tell
   what another agent meant, stop and hand off rather than deleting their lines.

---

## 7. VERIFICATION — WHAT "IT WORKS" HAS TO MEAN

```
./scripts/ci-local.sh              # 23 blocking checks, mirrors GitHub CI
node --check <file>.js             # every root .js file must parse
node scripts/verify-runtime.js     # headless render of capability pages
```

Name which of these you ran. **If you have no shell, you ran none** — say
"I could not execute any checks; these must be run before merging." Never
describe an unrun check as passing. That is the single most damaging thing you
can put in a review or a PR body.

**Method rules, each of which has cost a real session here:**

- **A grep is a candidate generator, never a verdict.** `\bbtn\b` matches
  *inside* `btn-gold`, because `-` is a word boundary. Repo-wide greps have
  produced confident findings a real render proved false.
- **A "0 findings" result must itself be verified.** A stopped server reports 0.
  A regex damaged in transit reports 0. Cross-check with a run that *must* find
  something — if your "before" case finds nothing, your harness is broken.
- **A scanner needs its own false-positive pass** before its number means
  anything. Two scans here returned the right total for entirely wrong reasons.
- **DOM presence is not visibility.** `querySelectorAll` counts elements inside
  a `display:none` panel.
- **The documentation can be wrong.** `CLAUDE.md` has twice described a fix that
  never shipped. Verify against code, not prose.
- **Green gates are not a code review.** A pentest guard that accepted
  third-party hosts passed all 23 blocking checks. Gates check the things
  somebody already thought to check.
- **Never claim something is fixed, applied, or verified unless it was in this
  session.** Leave it unmarked instead.

---

## 8. WHEN TO STOP AND ASK

Guessing costs more than waiting:

- You need a column, table, or RPC name you cannot verify
- The change touches auth, RLS, payments, or a public-callable function
- The fix requires editing `bg.js` in more than one region
- You cannot tell which of the ~62 stylesheets owns the surface you want to change
- The task seems to need a build step, a package, or a framework
- A merge conflict appears in a file you did not expect to touch

Say: *"Stopping here — I need X before I can do this safely,"* and give the exact
question. A precise question is a better deliverable than a confident wrong
change.

---

## 9. HANDOFF — END EVERY PIECE OF WORK WITH THIS

So the owner can carry your output to the other two agents without re-deriving it.

```
=== COPILOT HANDOFF ===
Branch:            copilot/<topic>   (from origin/main @ <sha>)
PR:                <url or "not opened">
Intent:            <one sentence — what problem, not what code>

Files ADDED:       <paths>
Files MODIFIED:    <path — which region/lines, and why that file>
Shared-lane files (bg.js / nav.js / omega-*.js / workflows / deploy):
                   <paths, or "none">

Hard stops:        none triggered   (or: name it and what I did instead)
Generated files:   not hand-edited  (or: which, regenerated with which command)
Flags/migrations:  <none / authored but NOT applied: filename>

Checks RUN:        <exact commands + results>
Checks NOT RUN:    <list — say plainly that they are unverified>
CI status read as: <"not evidence — Actions is dispatch-rejected", or what you confirmed>

Known risk:        <what a reviewer should look at hardest>
Needs a human:     <migrations, secrets, flags, billing, or "nothing">
=== END HANDOFF ===
```

---

## 10. QUICK REFERENCE

**Always:** branch fresh from `origin/main` · batch related fixes into one PR ·
check `.error` on every write · quote every attribute · use the shared classes ·
new page → `nav.js` `PS` + `SECTIONS` · append to `FIXES_LOG.md` · verify with
`git merge-base --is-ancestor` · run `./scripts/ci-local.sh` after any merge ·
hand off with §9.

**Never:** apply a migration · deploy · promote · set a secret · write a
realistic credential into any tracked file · commit a `service_role` key · flip a
flag to `true` · weaken RLS · add to `CLAUDE.md` · hand-edit a generated file ·
amend or force-push an open PR · create a branch you cannot delete · add a build
step or CDN import · hardcode a `bottom:` value or a page count · redefine a
token in a page `:root` · treat a red check as a code failure without reading the
job · claim a check passed that you did not run.
