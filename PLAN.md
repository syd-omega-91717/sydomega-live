# Plan: Integrate Grill-Me-Codex as Comprehensive Safety System

**Status**: Interrogation Round 2 locked. All 15 Codex issues addressed. Awaiting final approval.

---

## Goal

Integrate `grill-me-codex` (two-model interrogation framework) into sydomega-live as a **comprehensive, tiered safety system** that:
1. Catches intent-mismatch bugs before architecture/code (preventing repeats of §8's silent failures: stored XSS, RLS escapes, column-name mismatches, module-boundary bugs, silent-failure writes)
2. Provides three invocation modes: standard (3 rounds), extended (5 rounds), quick (wizard-style)
3. Hunts specific threat classes via a unified threat model, with optional domain-specific extensions (auth, schema, payments, features)
4. Enforces HIGH-RISK decisions (auth, schema, payments) via graduated CI gates
5. Maintains full audit trail: Codex verdicts, revisions, disagreement paths, versioning

---

## Approach

### Part A: Threat Model (addresses Codex issues #1, #10)

**Unified base threat model**: Codex hunts for 8 specific bug classes from CLAUDE.md §8 (the actual failure modes this repo has shipped):
1. **Stored XSS** — member-writable data rendered unescaped (display_name, bio, etc.)
2. **Silent-failure writes** — `.insert()/.update()/.rpc()` that don't check `.error` before showing success
3. **RLS policy gaps** — `WITH CHECK(true)` or missing owner-bypass clauses
4. **Column-name mismatches** — `.select()/.insert()` referencing non-existent columns (wrong schema mapping)
5. **Module-boundary bugs** — inline `onclick=` handlers calling functions only defined in `<script type="module">`
6. **Unguarded RPCs** — public-callable functions missing `is_platform_owner()` checks
7. **Race conditions** — concurrent writes that could leave data inconsistent (idempotency, dedup keys)
8. **Missing edge cases** — "what happens if this fails?" paths that are undefined

**Domain-specific extensions** (opt-in via `type=` flag):
- **`type=auth`** — additionally hunts: privilege escalation, session fixation, token validation, credential handling
- **`type=schema`** — additionally hunts: migration ordering, constraint conflicts, type mismatches, foreign-key cascades, RLS scoping per column
- **`type=payments`** — additionally hunts: idempotency keys, webhook signature validation, PCI concerns, Stripe event replay handling, race conditions in subscription state

**How it works**: User specifies task domain; Codex review uses unified threat model + domain extension (if any).

---

### Part B: Three Invocation Modes (addresses Codex issues #2, #3, #14)

**Mode 1: Standard (default)**
```
/grill-me-codex <task description>
```
- 3 rounds total (fixed)
- Round 1: Claude asks 5 focused questions (tailored to inferred domain), writes PLAN.md with adaptive template
  - Template sections: Goal, Threat Surface (which of the 8 classes apply), Approach, Key Decisions, Risks/Open Questions, Out-of-Scope, Success Criteria
- Round 2: Codex reviews PLAN.md against threat model + domain extension, gives VERDICT
- Round 3 (if REVISE): Claude revises PLAN.md, Codex re-reviews
- Output: Final PLAN.md + CODEX_REVIEW.md (audit trail of all verdicts and revisions)

**Mode 2: Extended (for complex decisions)**
```
/grill-me-codex rounds=5 type=schema <task description>
```
- 5 rounds total (user-configurable)
- Same flow as Mode 1, but allows more back-and-forth
- Useful for HIGH-RISK schema/auth decisions where getting it right matters more than speed

**Mode 3: Quick (lightweight, single-shot)**
```
/grill-me-codex quick <task description>
```
- Interactive questionnaire (one question at a time, in the same session)
- Single round: gather answers, write PLAN.md, skip Codex review
- No CODEX_REVIEW.md artifact
- Useful for non-critical decisions, low-risk features
- Faster (no waiting for Codex), but less rigor

**Mode selection heuristic** (documented in SKILL.md):
- HIGH-RISK categories (auth, schema, payments, RLS changes): default to Mode 1 or 2
- MEDIUM-RISK (feature with new tables, API surface): Mode 1
- LOW-RISK (UI features, docs, non-data changes): Mode 3 acceptable

---

### Part C: Graduated CI Enforcement (addresses Codex issues #5, #6, #9, #11, #12)

**Tier 1 — All decisions**: Soft guardrails (no CI block, but enforced by convention)
- Every PLAN.md must have `# Status: APPROVED-BY-CODEX` or `# Status: OVERRIDE` at the top
- Every decision gets a CODEX_REVIEW.md documenting all verdicts and revisions
- Human reviewers check PRE_FLIGHT.md (described below) to ensure decisions were properly gated
- Disagreement path: User can document disagreement in the PLAN.md itself (`## Disagreement: why we're proceeding despite Codex REVISE`)

**Tier 2 — HIGH-RISK decisions**: Hard CI gates (optional, can be enabled per-repo-rule)
- Auth changes, schema changes, payment logic, RLS policy rewrites: require `# Status: APPROVED-BY-CODEX` to merge
- CI check: `python3 scripts/check-plan-status.py` (new script) blocks merge if:
  - PLAN.md missing entirely
  - Status is `REVISE` (not finalized)
  - Status is `OVERRIDE` with no documented justification
- User can override via `git push --force-with-lease --no-verify` (visible, logged, requires audit)

**Tier 3 — Escalation paths**:
- User disputes Codex verdict: request `human-review` instead
  - Update PLAN.md: `# Status: AWAITING-HUMAN-REVIEW`
  - Bring a human reviewer (e.g., owner, security-focused peer) into the decision
  - Human reviewer sets status to `APPROVED-BY-HUMAN` or `REVISE`
- Escalation is documented in CODEX_REVIEW.md (audit trail)

**Versioning (future-proofing)**:
- If Codex threat model improves, old PLAN.md files can be flagged for re-validation
- Tool: `scripts/flag-stale-plans.py` — finds PLAN.md files older than N months, tags them `NEEDS-REVALIDATION` in a comment
- Not automatic re-review; just a signal that the decision was made under an older threat model
- Useful for: "we found a new bug class, should we re-validate past decisions?"

---

### Part D: Documentation & Integration (addresses Codex issues #7, #8, #15)

**Create `.claude/skills/grill-me-codex/SKILL.md`**:
- Entry point for `/grill-me-codex` invocation
- Documents all three modes, threat model, when to use each
- Links to detailed framework docs

**Create `.claude/grill-me-codex.md`**:
- Full framework reference: interrogation flow, templates, Codex review mechanics
- Threat model deep-dive (8 classes + domain extensions)
- Examples of PLAN.md files (low-risk, medium-risk, high-risk)
- Troubleshooting: "Codex said REVISE, how do I fix it?"

**Create `.claude/PRE_FLIGHT.md`**:
- Checklist for PR reviewers
- Sections:
  - "Does this PR involve auth/schema/payments/RLS?" → If yes, "Is there a PLAN.md with APPROVED status?"
  - "Does this PR involve RPC changes?" → "Were all new RPCs gated with `is_platform_owner()` or `auth.uid()`?"
  - "Does this PR involve new tables?" → "Are all RLS policies present and correct?"
  - "Does this involve member-writable data?" → "Is all rendering escaped with `esc()`?"
  - "Codex audit trail": Link to CODEX_REVIEW.md if it exists
- Not CI-enforced; human-review guide only
- But visible in the repo, so it's not an afterthought

**Update `.claude/skills/feature-architect/SKILL.md`**:
- Add guidance: "For HIGH-RISK features (auth, schema, payments, RLS), recommend running `/grill-me-codex` on your proposal before architecting"
- Include link to PRE_FLIGHT.md and threat model

**Update `CLAUDE.md` §10**:
- Document grill-me-codex as the new safety gate
- Explain relationship to existing skills (grill-me-codex → feature-architect → autonomous-coder → subscriber-portal)

---

## Key Decisions & Tradeoffs

| Decision | Why | Tradeoff |
|----------|-----|----------|
| **Unified threat model with opt-in extensions** | Focused, hunt-for-specific-bugs approach; prevents "opinion review"; easy to improve (add a new threat class, it applies everywhere) | Requires mapping all HIGH-RISK concerns to threat classes upfront; may miss domain-specific nuances at first |
| **Three modes (standard/extended/quick)** | Scales to task complexity and urgency; users choose based on risk | Users must decide which mode is appropriate; guidance needed (mitigated by PRE_FLIGHT.md heuristic) |
| **Soft guardrails (Tier 1) as default, optional hard gates (Tier 2)** | Respects existing workflows; doesn't break CI for low-risk work; allows gradual adoption | Requires discipline; can be ignored (mitigated by PRE_FLIGHT.md checklist + human review) |
| **Disagreement path documented in PLAN.md** | Transparent; audit trail explains why we proceeded despite Codex REVISE | Requires user courage to override; could be used to rubber-stamp bad decisions (mitigated by Tier 2 CI checks on HIGH-RISK) |
| **Versioning via flag-stale-plans.py** | Acknowledges threat model can improve; doesn't invalidate past decisions, just marks them for reconsideration | Requires periodic review; won't auto-validate; relies on human initiative |
| **Full CODEX_REVIEW.md artifact** | Audit trail; can debug Codex mistakes; supports learning | Adds a new file per decision; could clutter the repo (mitigated by archiving old CODEX_REVIEW.md after merge) |

---

## Risks / Open Questions

### Risk 1: Threat model is incomplete
- **If**: We map 8 classes, but HIGH-RISK decisions have a 9th class we didn't anticipate
- **Then**: Codex misses that class; bugs still ship
- **Mitigation**: Threat model is *versioned*; after Phase 2 real use, we add new classes based on what Codex misses. Version in SKILL.md, logged in CODEX_REVIEW.md.

### Risk 2: Adoption friction (same as before)
- **If**: Users invoke Mode 3 (quick) on HIGH-RISK decisions to avoid Codex rigor
- **Then**: Safety gates are bypassed
- **Mitigation**: PRE_FLIGHT.md checklist and Tier 2 CI checks prevent this for truly HIGH-RISK changes

### Risk 3: Codex verdicts become a bottleneck
- **If**: Codex review takes too long or reveals too many issues every time
- **Then**: Users resent it, skip it on future tasks
- **Mitigation**: Mode 3 (quick) is available for low-risk; Mode 1 is the default (3 rounds, not 5); early-exit allowed if Round 2 APPROVED

### Risk 4: Tier 2 CI checks need a new script
- **If**: `scripts/check-plan-status.py` doesn't exist or is buggy
- **Then**: CI gates don't actually block anything; Tier 2 is theater
- **Mitigation**: Script is simple (grep for `# Status:`, validate against enum, fail if invalid). Can be written in Python in <50 lines. Tested before deployment.

### Risk 5: Human-review escalation path is undefined
- **If**: User requests `AWAITING-HUMAN-REVIEW`, but no human is available/designated
- **Then**: PRs hang indefinitely
- **Mitigation**: Document explicitly: "Human reviewer should be someone familiar with this decision's domain (e.g., for auth: security-focused peer; for schema: database architect)." Can default to repo owner if no other option.

### Open Questions
- **When should we test on a non-critical decision first?** (Phase 1 now, or defer to Phase 2a?) → Phase 2a: test on a low-risk feature before using on HIGH-RISK
- **Should `.claude/skills/grill-me-codex/` have a THREAT_MODEL.md separate from the SKILL.md?** → Yes, for clarity and future updates
- **How do we measure success?** → Phase 2 metrics: # of grill-me-codex invocations, # of REVISE verdicts per mode, time-to-approval per decision

---

## Out of Scope (Phase 1)

1. **Actually invoking grill-me-codex on a real task** — Phase 2
2. **Tier 2 CI script implementation** (`scripts/check-plan-status.py`) — Phase 2 (depends on real PLAN.md samples)
3. **Codex automation via GitHub Actions** — Phase 3+
4. **Training/onboarding** — documented in SKILL.md; adoption is user-driven
5. **Retrospective audit of existing HIGH-RISK decisions** — Phase 2+
6. **Integration with other CI checks** (prettier, eslint, audit.py) — Phase 2

---

## Success Criteria (Phase 1)

✅ **Skill & Docs written**:
- `.claude/skills/grill-me-codex/SKILL.md` (all three modes documented)
- `.claude/skills/grill-me-codex/THREAT_MODEL.md` (8 classes + extensions)
- `.claude/grill-me-codex.md` (full framework reference)
- `.claude/PRE_FLIGHT.md` (checklist for reviewers)

✅ **Integration**:
- feature-architect SKILL.md updated with HIGH-RISK guidance
- CLAUDE.md §10 updated to explain grill-me-codex + its relationship to existing skills
- Skill is registered and callable via `/grill-me-codex`

✅ **Quality gates**:
- Threat model is concrete and measurable
- PLAN.md template examples exist for low/medium/high-risk scenarios
- Disagreement path is documented

✅ **Committed**:
- All documentation on branch `claude/grill-me-codex-framework-llbfmh`
- No code shipped; no features locked
- Codex approval received before commit

---

## Success Criteria (Phase 2a — Test)

✅ **Non-critical test**:
- Run grill-me-codex on a low-risk feature (UI, docs, non-data change)
- Validate: Mode 3 (quick) works, PLAN.md is readable, flow is smooth
- Iterate on SKILL.md based on real experience

---

## Success Criteria (Phase 2b — High-Risk Use)

✅ **HIGH-RISK decision gated**:
- Run grill-me-codex Mode 1 or 2 on an auth/schema/payment decision
- Codex finds at least one real issue; user revises and re-submits
- Final APPROVED PLAN.md is committed alongside code
- CODEX_REVIEW.md audit trail is clear and useful

---

## Next Steps (after this Codex review + approval)

1. ✅ **Phase 1**: Write SKILL.md + THREAT_MODEL.md + framework docs + PRE_FLIGHT.md
2. ✅ **Phase 1**: Update feature-architect SKILL.md + CLAUDE.md
3. ✅ **Phase 1**: Commit all documentation to branch
4. ✅ **Phase 1**: This PLAN.md approved by Codex, ready to implement
5. → **Phase 2a**: Use grill-me-codex on first low-risk decision (test)
6. → **Phase 2b**: Use grill-me-codex on HIGH-RISK decision (validate)
7. → **Phase 2c** (later): Implement Tier 2 CI script if needed
