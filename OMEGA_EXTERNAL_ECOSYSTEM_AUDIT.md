# OMEGA_EXTERNAL_ECOSYSTEM_AUDIT

Evaluation record for external repositories considered for adoption into
`sydomega-live`. Its purpose is the same as `CLAUDE.md` §10.1's table, which it
extends: **so a future session does not re-fetch and re-read the same
repositories.** A verdict here is a decision, not a note — re-open one only when
the platform's own shape changes, not because the repo is popular.

`CLAUDE.md` §10.1 holds the short standing summary. This file holds the
evidence. Do not move the detail up into `CLAUDE.md`: it is loaded into every
session before any work starts and is budget-gated (`scripts/context-budget.py`).

---

## What could and could not be verified in this session

Stated up front, because several of the scoring dimensions the brief asks for
were **not reachable** and must not be presented as if they were.

| Evidence | Status |
|---|---|
| `README.md`, `LICENSE`, named sub-files via `raw.githubusercontent.com` | **Available** — 15 of 16 repos fetched, HTTP 200 |
| GitHub REST API (`api.github.com/repos/...`) | **Blocked** — HTTP 403 at the egress proxy |
| `github.com` HTML, `codeload.github.com` tarballs | **Blocked** — HTTP 403 |
| `agentskills.io` (the Agent Skills spec site) | **Blocked** — egress policy |
| Cloning any repo, enumerating a file tree | **Not possible** — no API, no tarball |

**Consequence:** stars, contributor counts, commit recency, issue/PR activity and
dependency-tree security were **not measured** for any repo below. Every verdict
here rests on first-party documentation content and on applicability to this
stack — which is the dimension that actually decides adoption here anyway (see
the bar below). Where a verdict would have turned on activity or community, it
is marked **NOT VERIFIED** rather than guessed.

## The bar

From `CLAUDE.md` §10.1, unchanged: install count / source reputation / stars,
**plus the rule this repo needs on top — the skill must name a mechanism that
exists here.** `sydomega-live` is a no-build, no-framework, no-bundler,
`noindex`, invite-gated static site (178 `.html` pages + 90 `omega-*.js`
modules + Supabase), deployed by copying files. A capability that assumes npm,
a component tree, a build step, or a public acquisition funnel does not become
applicable by rewriting its examples.

---

## Verdicts

| Repo | What it is | License | Verdict |
|---|---|---|---|
| `anthropics/skills` | Official Anthropic skills + Agent Skills spec + template | Apache-2.0 (docs skills source-available) | **ADOPTED (concept)** — see §1 |
| `cursor/plugins` | 17 official Cursor plugins | not fetched | **ADOPTED (concept)** — see §2 |
| `anthropics/claude-cookbooks` | API recipe notebooks | — | **REFERENCE ONLY** — see §3 |
| `affaan-m/everything-claude-code` (+4 forks) | Claude Code config collection | MIT | **WATCH** — see §4 |
| `vercel-labs/agent-browser` | Rust browser-automation CLI for agents | — | **REJECT** — duplicates existing harness, §5 |
| `vercel-labs/json-render` | Generative-UI framework | — | **REJECT** — requires build step, §5 |
| `deepseek-ai/deepseek-harness` | Plugin-based agent harness (`dsh`) | MIT | **REJECT** — §5 |
| `openai/openai-cookbook`, `openai/openai-agents-python` | OpenAI recipes / Python agents SDK | — | **REJECT** — wrong provider and runtime, §5 |
| `google-gemini/cookbook`, `google/adk-python` | Gemini recipes / Python agent kit | — | **REJECT** — §5 |
| `cursor/cookbook` | Cursor usage recipes | — | **REJECT** — different agent harness, §5 |
| `vercel-labs/next.js` | — | — | **DOES NOT EXIST** — §6 |
| `vercel-labs/agent-skills`, `vercel-labs/skills` | — | — | **ALREADY EVALUATED** — `CLAUDE.md` §10.1 |

---

## 1 · `anthropics/skills` — ADOPTED (concept), and it validated a live fix

First-party Anthropic, Apache-2.0 for the example skills (the `docx`/`pdf`/
`pptx`/`xlsx` document skills are source-available, not open source — noted
because that distinction matters if code is ever copied, which it was not).

Its `template/SKILL.md` is 140 bytes and is the whole canonical contract:

```
---
name: template-skill
description: Replace with description of the skill and when Claude should use it.
---
```

Two things follow, both acted on this session:

1. **`name` + `description` are the complete required frontmatter set.** That is
   exactly what `scripts/omega-registry.py` validates, so the registry's gate is
   checking the right fields rather than an invented house rule.

2. **"…and when Claude should use it"** is part of the contract, not decoration.
   This is first-party confirmation of the defect fixed in `ed2c76f`:
   `.claude/skills/grill-me-codex/SKILL.md` had no frontmatter at all, so its
   listing fell back to the `#` heading — *"Grill-Me-Codex: Safety Gate for
   High-Risk Decisions"* — which states what the skill **is** and never says
   **when to use it**. The safety gate for auth/schema/payments/RLS work was
   therefore the least selectable skill in the repo. Confirmed fixed in-session:
   after adding frontmatter, the harness reloaded the skill list showing the real
   trigger description.

**Not adopted:** any of the skills themselves. They target document generation
and MCP-server authoring; neither is a mechanism this platform has.

**NOT VERIFIED:** the spec at `agentskills.io` (egress-blocked), and
`spec/`'s contents (path guesses returned 404; the tree could not be listed).
The template above is first-party and sufficient for the claim made.

## 2 · `cursor/plugins` — ADOPTED (concept), produced a real defect class

17 official plugins. Two describe mechanisms this repo genuinely has — a
`scripts/` suite that coding agents run, and documentation that drifts:

- **`cli-for-agent`** — *"Patterns for designing CLIs that coding agents can run
  reliably: flags, help with examples, pipelines, errors, idempotency,
  --dry-run… Use when… reviewing whether an existing tool will block agents."*
- **`agent-compatibility`** — *"agents that audit startup, validation, and **docs
  against reality**."*

Grounding the first against `scripts/` (rather than installing it) found that
**all 18 agent-facing scripts ignored `--help` and ran their full job instead**,
and that five of them (`register-shell`, `register-chronometer`,
`register-demo-video`, `patch-account-auth`, `fix-module-loader`) write to
tracked files with no argv guard at all — so `--help` was an unrequested write,
masked only by their idempotency. Fixed in `adc9f2f`.

The second names precisely the problem `scripts/omega-registry.py` was built for
in `ed2c76f` (three documented skill counts, all wrong). Convergent evidence that
this is a real class, not a local quirk — the registry was already written when
this was read, so it is corroboration, not the source.

**Not adopted:** the plugins themselves. They are Cursor-harness artifacts
(`.cursor-plugin/plugin.json` manifests) and this repo runs Claude Code; the
transferable part was the review criteria, which are now encoded in the repo's
own scripts. The remaining 15 plugins are IDE-workflow, SaaS connectors
(Gmail/Drive/Gong), or parallel-cloud-agent orchestration — no mechanism here.

**NOT VERIFIED:** license (`LICENSE` not fetched — no code was copied, so no
obligation attaches).

## 3 · `anthropics/claude-cookbooks` — REFERENCE ONLY

First-party, high quality. It is API-recipe material (notebooks), and this
platform's only AI surface is one Edge Function (`supabase/functions/concierge`)
calling the Anthropic API server-side. If that function is ever extended, this is
the right reference to consult — but there is nothing to install, and a notebook
collection is not a capability this repo can hold.

## 4 · `everything-claude-code` — WATCH, and the brief's list was four forks of one repo

The brief named four repos (`worldflowai/`, `shoichiro-suzuki/`, `alphachoi/`,
`giovanisp/`) and asked not to assume forks are equivalent. They were compared,
and the finding is upstream of that question: **all four README files reference
`affaan-m/everything-claude-code`** — 7, 1, 11 and 25 times respectively, with
`worldflowai` and `alphachoi` still rendering their star badge from
`affaan-m`'s stargazers endpoint. They are forks of a single project the brief
never named. Evaluating four of them would have been the same evaluation done
four times.

They diverge in volume, not in kind — `giovanisp` is the most developed
(68,693-byte README, seven languages), `shoichiro-suzuki` the leanest (7,757
bytes) and the only one presenting itself as original work rather than a fork.

**WATCH, not ADOPT.** The content is Claude Code configuration — agents, hooks,
commands, MCP config — which is a mechanism this repo does have (`.claude/`). But
it is one individual's personal configuration under MIT, with no first-party
backing, and the bar in `CLAUDE.md` §10.1 is explicitly sceptical of low-install
sources. Adopting hooks or agents wholesale would add instructions a session must
read and then ignore, against a `.claude/` surface that is now measured and
CI-gated (`OMEGA_SKILL_REGISTRY.md`).

**NOT VERIFIED:** stars, install counts, maintenance activity — the exact
dimensions the bar asks for — all require the blocked GitHub API. The badge in
those READMEs renders a live count that could not be read. **Re-open only with
API access**, and evaluate `affaan-m/everything-claude-code` upstream, not the forks.

## 5 · Rejected, with the specific blocker

Not rejected for being low quality — several are excellent. Rejected because each
names a mechanism this platform does not have.

- **`vercel-labs/agent-browser`** — `npm install -g agent-browser`, a native Rust
  binary that downloads its own Chrome. This repo **already has** a working
  headless-Chromium harness at `.claude/skills/verify-in-browser/harness/`
  (`session.js`, `sbstub.js`, `serve.js`, `scan.js`) which encodes this
  platform's specific sandbox gotchas — the blocked `esm.sh` import that makes
  every gated page look broken, the service worker that defeats `page.route`,
  the four first-visit overlays that swallow clicks. Replacing it would discard
  hard-won knowledge to solve an already-solved problem, against the brief's own
  §35. Concept overlap noted; nothing to import.
- **`vercel-labs/json-render`** — generative UI, and the closest thing here to a
  genuinely wanted capability (the brief's §21). Blocked on distribution: every
  install path is an npm package against React / Vue / React Native / Remotion.
  Searched its README for a vanilla, CDN, `<script>`, `esm.sh` or no-build path —
  **zero matches**. Adopting it means adopting a build step, which `CLAUDE.md` §9
  and `vercel.json` make a deliberate, load-bearing property of this deploy.
  The *idea* (AI emits a validated schema, a safe renderer draws it — never
  arbitrary AI-generated HTML/JS) is sound and stays a candidate for a
  hand-rolled `omega-*.js` renderer; that would be a `FEATURE_IDEAS.md` proposal,
  not an adoption.
- **`deepseek-ai/deepseek-harness`** — a competing agent harness (Node + pnpm,
  everything-is-a-plugin, self-declared developer preview with
  "COMPATIBILITY-BREAKING CHANGES"). Not a capability for a static site.
- **`openai/openai-cookbook`, `openai/openai-agents-python`, `google-gemini/cookbook`,
  `google/adk-python`** — other providers' SDKs and recipes, in Python, for
  server-side agent runtimes. This platform's AI surface is one Anthropic-backed
  Edge Function; there is no Python runtime in the deploy at all.
- **`cursor/cookbook`** — usage recipes for a different agent harness.

## 6 · `vercel-labs/next.js` — does not exist

Fetched `README.md` on both `main` and `master`: **404**. Next.js is
`vercel/next.js` (its README lives on the `canary` branch). Recorded so the 404
is not re-investigated. Moot regardless: adopting Next.js is the framework
migration `CLAUDE.md` §9 says not to start without discussing it first, and the
brief's §27 likewise says not to migrate on fashion.

---

## Standing conclusion

Of 16 repos, **two contributed something** — and neither by installing anything.
Both contributed *review criteria* that, applied to this repo's real files,
found real defects: a safety-gate skill that could not be discovered, and 18
agent-facing scripts that answered `--help` by running. That is the shape
adoption takes on this stack, and the reason the bar's extra rule exists.
