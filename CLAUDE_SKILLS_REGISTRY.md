# Claude Code Skills Registry — sydomega-live

**Last Updated:** 2026-08-30 (added supabase, supabase-postgres-best-practices, supabase-server, find-skills)  
**Project Type:** Static site + Supabase backend (no build step)

---

## Available Skills

### 🟢 Highly Applicable to This Project

#### 1. code-review
- **Purpose:** Review diffs for correctness bugs and code quality
- **Use:** Before pushing to main, review changes with `/code-review`
- **Effort levels:** low (high-confidence only) / medium (balanced) / high (thorough)
- **Commands:** `/code-review`, `/code-review --fix`, `/code-review --comment`

#### 2. security-review
- **Purpose:** Security audit of pending changes
- **Use:** Before any auth/RLS/Edge Function changes
- **Commands:** `/security-review`

#### 3. verify-in-browser
- **Purpose:** Test UI changes in headless Chrome
- **Use:** Validate page rendering before pushing
- **Supports:** Supabase stub auth, localStorage inspection, visual regression

#### 4. context-budget
- **Purpose:** Measure and manage session context size
- **Use:** Keep CLAUDE.md, FIXES_LOG.md, large files tracked
- **Commands:** `scripts/context-budget.py` (runs in CI)

#### 5. interface-guidelines
- **Purpose:** Design system audit across all pages
- **Use:** Verify UI consistency before/after design changes
- **Based on:** vercel-labs/agent-skills guidelines, adapted to this design system

#### 6. run
- **Purpose:** Start dev server and test changes
- **Use:** Verify pages render correctly
- **Detects:** No build step required

#### 7. simplify
- **Purpose:** Clean up code without behavior changes
- **Use:** Post-fix refactoring
- **Scope:** Reuse, inefficiencies, dead code

#### 8. supabase — *installed at `.claude/skills/supabase/`*
- **Purpose:** General Supabase skill — Database, Auth, Edge Functions, Realtime, Storage, RLS, CLI/MCP, migrations, and debugging PostgREST/Postgres errors + reading logs.
- **Use:** Any task touching the Supabase backend. This *is* a Supabase project.
- **Source:** vendored from `supabase/agent-skills`.

#### 9. supabase-postgres-best-practices — *installed at `.claude/skills/supabase-postgres-best-practices/`*
- **Purpose:** Postgres best practices — schema/column types, RLS policies + tests, indexes, triggers, functions, `pg_cron`/`pgmq`, migrations; and diagnosing slow queries, timeouts, locks, cross-tenant row leaks.
- **Use:** BEFORE any `supabase/*.sql` change or query work. Directly targets `CLAUDE.md` §8.1's recurring bug classes (wrong column names, missing GRANTs, RLS gaps, upsert-conflict targets, migration drift).
- **Source:** vendored from `supabase/agent-skills` (MIT). 33 reference files.

#### 10. supabase-server — *installed at `.claude/skills/supabase-server/`*
- **Purpose:** Server-side `@supabase/server` usage — Edge Functions, webhook handlers, inbound-auth validation, `auth:` modes.
- **Use:** Before touching `supabase/functions/`. The 11 existing functions use the legacy `Deno.serve` + `createClient(Deno.env.get(...))` pattern this skill treats as a migration target.
- **Source:** vendored from `supabase/server`.

#### 11. find-skills
- **Purpose:** Discover and install agent skills (`npx skills find/add`).
- **Use:** When evaluating whether a new external skill fits — apply `CLAUDE.md` §10.1's bar (names a mechanism that exists here) before adopting.

---

### 🟡 Conditionally Applicable

#### 12. claude-api
- **Purpose:** Claude/Anthropic API reference
- **Use:** When building Edge Functions that call Anthropic API
- **Example:** `supabase/functions/concierge` (existing, uses Anthropic)

#### 13. deploy-gate
- **Purpose:** Deployment readiness checks
- **Use:** Before Vercel deployments
- **Checks:** CI passing, no service-role keys, schema consistent

#### 14. feature-architect
- **Purpose:** Design implementation plans for new features
- **Use:** Part of platform's autonomous pipeline (§10 in CLAUDE.md)
- **Output:** File-by-file blueprint

#### 15. grill-me-codex
- **Purpose:** Threat model & decision documentation for high-risk features
- **Use:** Before implementing auth changes, RLS policies, payments, new public RPCs
- **Output:** PLAN.md + CODEX_REVIEW.md

#### 16. autonomous-coder
- **Purpose:** Implement blueprints from feature-architect
- **Use:** Part of platform's autonomous pipeline
- **Scope:** Never flips platform_settings flags, never merges to main

#### 17. web-trend-scout
- **Purpose:** Research features from web trends
- **Use:** Generate FEATURE_IDEAS.md proposals
- **Part of:** Autonomous feature pipeline (§10)

#### 18. subscriber-portal
- **Purpose:** Wire features into subscriber-facing pages
- **Use:** After feature is complete and flag is flipped on
- **Uses:** membership_tier + OmegaCanon.tierUnlocks() system

---

### 🔴 Not Applicable to This Project

**Why these don't fit:**

| Skill | Reason |
|---|---|
| design / canvas-design | No build step; static HTML only. Use artifact-design skill instead. |
| dataviz | Not a multi-chart project; existing pages use inline SVG. |
| session-start-hook | Project already runs without setup. |
| doc-coauthoring / docx / pptx / pdf / xlsx | Not document editing; CLAUDE.md is markdown. |
| brand-guidelines | Omega brand already defined in omega-agents.json + design system. |
| slack-gif-creator / theme-factory | Not relevant to backend/membership platform. |
| image-pipeline / cinematic-media | No media generation; images are static assets. |
| algorithmic-art | Not an art project. |
| mcp-builder | No custom MCP servers needed. |
| skill-creator | Skills documented in this file; not building new ones. |
| internal-comms | Solo platform; no team comms needed. |
| learn | Not a learning tool. |
| morning / import-memory | Session management (not applicable). |
| keybindings-help | IDE config (personal preference). |
| update-config | Already using git hooks (`.githooks/pre-push`). |
| fewer-permission-prompts | Tool allowlists (not needed yet). |
| loop | One-off tasks; no recurring intervals. |
| web-artifacts-builder | Artifacts are published via Artifact tool directly. |

---

## Skill Activation Checklist

### Before Major Features
- [ ] `/grill-me-codex` — if auth/RLS/payments/new public RPCs involved
- [ ] `/feature-architect` — to design the implementation
- [ ] `/code-review` — after changes, before commit

### Before Pushing to Main
- [ ] `/code-review --fix` — clean up code
- [ ] `/security-review` — if any SQL/RLS/auth touched
- [ ] `/verify-in-browser` — test affected pages
- [ ] `git config core.hooksPath .githooks` — enable pre-push CI

### During Schema Work (Phase 2–4)
- [ ] `supabase-postgres-best-practices` — load BEFORE writing/altering any table, RLS policy, index, trigger, function, or migration
- [ ] `supabase` — for PostgREST/Postgres error debugging and log reading
- [ ] `supabase-server` — before touching `supabase/functions/`
- [ ] `/code-review` — verify SQL consolidation
- [ ] `scripts/context-budget.py --check` — keep docs current
- [ ] `/deploy-gate` — validate before Vercel push

### For Autonomous Pipeline (Future)
1. `/web-trend-scout` → FEATURE_IDEAS.md proposal
2. `/grill-me-codex` → PLAN.md + decision record (if HIGH-RISK)
3. `/feature-architect` → Implementation blueprint
4. `/autonomous-coder` → Implement + verify CI
5. `/subscriber-portal` → Wire into UI (after flag flip)

---

## How to Use Skills

### Invoking a Skill
```bash
# Slash command
/code-review

# Or pass arguments
/code-review --fix
/code-review --comment

# Or via Skill() tool
claude skill code-review
```

### Skill-Specific Commands

**Code Review (3 effort levels)**
```bash
/code-review              # Last used level (default: medium)
/code-review low          # Only high-confidence bugs
/code-review high         # Broader coverage
/code-review --fix        # Apply fixes to working tree
/code-review --comment    # Post as PR inline comments
```

**Verify in Browser**
```bash
/verify-in-browser        # Test current page in headless Chrome
# Supports: Supabase stub, localStorage, visual regression
```

**Security Review**
```bash
/security-review          # Audit pending changes for security issues
```

**Context Budget**
```bash
scripts/context-budget.py --check  # Verify CLAUDE.md token cost
scripts/context-budget.py          # Regenerate context measurements
```

---

## Skill Integration Points

### 1. Pre-Push CI
File: `.githooks/pre-push`
```bash
#!/bin/bash
./scripts/ci-local.sh  # 17 blocking checks
```
Skills invoked: None (automated)

### 2. Pull Request Review
**Suggested workflow:**
```bash
git checkout -b fix/something
# ... make changes ...
/code-review low
/security-review          # if RLS/auth touched
/verify-in-browser        # if UI changed
git add ...
git commit ...
git push
```

### 3. Feature Development
**Suggested workflow:**
```bash
/web-trend-scout          # Research feature
/grill-me-codex           # HIGH-RISK only: threat model
/feature-architect        # Design blueprint
/autonomous-coder         # Implement (for routine features)
/code-review --fix        # Polish
/security-review          # Verify safety
git push
```

### 4. Schema Consolidation (Phase 2–4)
**Suggested workflow:**
```bash
# Phase 2: Deduplicate files
/code-review low          # Verify SQL syntax

# Phase 3: Audit against live schema
scripts/schema-dictionary.py --regenerate
/deploy-gate              # Verify readiness

# Phase 4: Archive & document
# (manual documentation)
```

---

## Status Per Skill

| Skill | Integrated | Tested | Notes |
|---|---|---|---|
| code-review | ✅ Available | ✅ Used before each push | Critical for quality gate |
| security-review | ✅ Available | ⏳ Not yet (no auth changes recent) | Ready for RLS work |
| verify-in-browser | ✅ Available | ⏳ Needs test setup | Useful for UI regression |
| context-budget | ✅ Available | ✅ Blocks CI if CLAUDE.md > 16KB | Active in CI |
| feature-architect | ✅ Available | ✅ Used for Phase 1 schema work | Part of pipeline |
| grill-me-codex | ✅ Available | ⏳ Not yet (no HIGH-RISK features) | Ready for auth/payments |
| autonomous-coder | ✅ Available | ✅ Used for schema automation | Part of pipeline |
| deploy-gate | ✅ Available | ⏳ Not yet | Ready for Vercel pushes |
| run | ✅ Available | ⏳ No dev server (static site) | Limited applicability |

---

## Future: Expanding the Autonomous Pipeline

When ready to enable full autonomous feature pipeline (§10 in CLAUDE.md):

1. **Activate web-trend-scout** → Research feeds into FEATURE_IDEAS.md
2. **Activate feature-architect** → Takes proposals to file-by-file blueprints
3. **Activate grill-me-codex** (conditionally) → HIGH-RISK features get threat review
4. **Activate autonomous-coder** → Implements blueprints, verifies with CI
5. **Activate subscriber-portal** → Wires features into subscriber-facing pages

Current state: Skills available, pipeline designed, not yet scheduled.

---

## Quick Reference

**Need to...** | **Skill to use**
---|---
Review changes for bugs | `/code-review`
Check security of auth/RLS | `/security-review`
Test UI in browser | `/verify-in-browser`
Design a new feature | `/feature-architect`
Threat-model a risky feature | `/grill-me-codex`
Clean up code | `/simplify` or `/code-review --fix`
Verify deployment readiness | `/deploy-gate`
Research trends for ideas | `/web-trend-scout`
Implement a feature blueprint | `/autonomous-coder`
Check context size | `scripts/context-budget.py`
---

**Last verified:** 2026-08-30  
**Repo:** syd-omega-91717/sydomega-live  
**Branch:** main (production ready)
