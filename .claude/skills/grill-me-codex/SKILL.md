# Grill-Me-Codex: Safety Gate for High-Risk Decisions

**Purpose**: Structured interrogation framework for catching intent-mismatch bugs before they become code. Locks down HIGH-RISK decisions (auth, schema, payments, RLS changes) by forcing explicit threat-model review and decision documentation.

**When to use**:
- You're implementing a feature involving authentication, database schema, payments, or RLS policy changes
- You're unsure whether your approach handles all the edge cases
- You want an audit trail of the decision-making process
- You need to prove to a reviewer that you've thought through the security implications

---

## Quick Start

### Mode 1: Standard (default, 3 rounds, structured)
```
/grill-me-codex <task description>
```
**Best for**: Most HIGH-RISK decisions (auth, schema, payments, RLS). Balances thoroughness with speed.

**Flow**:
1. **Round 1** — You answer 5 focused questions (tailored to inferred domain)
   - "What data changes?" "Who accesses it?" "What could go wrong?" etc.
2. **Claude writes** — PLAN.md with these sections: Goal, Threat Surface, Approach, Key Decisions, Risks, Out-of-Scope, Success Criteria
3. **Round 2** — Codex reviews PLAN.md against threat model, returns VERDICT (APPROVED or REVISE)
4. **Round 3 (if REVISE)** — You revise PLAN.md, Codex re-reviews
5. **Output** — Final PLAN.md + CODEX_REVIEW.md (audit trail)

### Mode 2: Extended (5 rounds, for complex decisions)
```
/grill-me-codex rounds=5 type=schema <task description>
```
**Best for**: Complex schema redesigns, multi-service auth systems, payment logic with many state transitions.

**Same as Standard, but allows 5 rounds of back-and-forth instead of 3.**

### Mode 3: Quick (single-shot, wizard-style, no Codex review)
```
/grill-me-codex quick <task description>
```
**Best for**: Non-critical decisions, UI features, docs, or when you need a decision record fast but don't need adversarial review.

**Flow**:
1. Interactive questionnaire (one question at a time, in the same session)
2. Claude writes PLAN.md
3. No Codex review (faster, less rigorous)
4. Output — PLAN.md only (no CODEX_REVIEW.md)

---

## Mode Selection Heuristic

| Risk Level | Decision Type | Recommended Mode | Reason |
|---|---|---|---|
| **HIGH** | Auth (privilege, sessions, tokens) | 1 or 2 | Adversarial review catches subtle escalations |
| **HIGH** | Schema (RLS, migrations, constraints) | 1 or 2 | Silent constraint failures need explicit modeling |
| **HIGH** | Payments (idempotency, webhooks, state) | 1 or 2 | Financial correctness is non-negotiable |
| **HIGH** | RLS policy changes | 1 or 2 | Authorization bugs are silent and catastrophic |
| **MEDIUM** | New feature with new tables | 1 | Schema design benefits from threat modeling |
| **MEDIUM** | New RPC or Edge Function | 1 | Public-callable code needs gating checks |
| **LOW** | UI improvements | 3 | No data/auth implications |
| **LOW** | Documentation | 3 | No code changes |
| **LOW** | Styling or layout | 3 | Cosmetic only |

---

## The Threat Model

Codex hunts for 8 specific bug classes, grounded in [sydomega-live's actual failure history](../../../CLAUDE.md#8-known-debt):

1. **Stored XSS** — Member-writable data rendered unescaped
2. **Silent-failure writes** — `.insert()/.update()/.rpc()` missing `.error` checks
3. **RLS policy gaps** — `WITH CHECK(true)` or missing owner-bypass clauses
4. **Column-name mismatches** — `.select()/.insert()` referencing non-existent columns
5. **Module-boundary bugs** — Inline `onclick=` handlers calling module-scoped functions
6. **Unguarded RPCs** — Public-callable functions missing `is_platform_owner()` checks
7. **Race conditions** — Concurrent writes leaving data inconsistent
8. **Missing edge cases** — "What happens if this fails?" undefined

**Domain extensions** (opt-in via `type=` flag):

- `type=auth` — Additionally hunts: privilege escalation, session fixation, token validation, credential handling
- `type=schema` — Additionally hunts: migration ordering, constraint conflicts, type mismatches, foreign-key cascades, RLS per-column scoping
- `type=payments` — Additionally hunts: idempotency keys, webhook signature validation, PCI concerns, Stripe event replay handling, subscription state races

See [THREAT_MODEL.md](./THREAT_MODEL.md) for detailed threat class definitions and examples.

---

## Output Artifacts

### PLAN.md (always generated)
Structured decision document with:
- **Goal** — What you're building and why
- **Threat Surface** — Which of the 8 bug classes apply to this decision
- **Approach** — How you're addressing the threats
- **Key Decisions** — Explicit tradeoffs made
- **Risks / Open Questions** — What could still go wrong
- **Out-of-Scope** — What you're deliberately not handling
- **Success Criteria** — How you'll know it worked

**Status header** (required): 
- `# Status: APPROVED-BY-CODEX` — Codex found no issues
- `# Status: REVISE` — Codex wants changes; not ready to ship
- `# Status: OVERRIDE` — You're proceeding despite Codex concerns (document your reasoning)
- `# Status: AWAITING-HUMAN-REVIEW` — You want human escalation instead of Codex verdict

### CODEX_REVIEW.md (Modes 1, 2 only)
Audit trail of:
- Codex verdict each round (APPROVED or REVISE)
- Specific findings if REVISE
- What you changed between rounds
- Final decision and reasoning

**Purpose**: Track what Codex checked, what it found, and how you responded. Enables learning ("what did I miss?") and dispute resolution ("Codex said X, but here's why X doesn't apply").

---

## Integration with Other Skills

**Recommended workflow** for HIGH-RISK decisions:

```
1. /grill-me-codex [write & lock intent]
   ↓
2. /feature-architect [blueprint implementation]
   ↓
3. /autonomous-coder [write the code]
   ↓
4. (human review of PLAN.md + CODEX_REVIEW.md via PRE_FLIGHT.md checklist)
   ↓
5. /subscriber-portal [expose to users, once human approves]
```

**For LOW-RISK decisions** (UI, docs), you can skip grill-me-codex entirely or use Mode 3 (quick) for a decision record.

---

## Enforcement & Governance

### Tier 1 — All Decisions (soft guardrails, no CI block)
- Every PLAN.md must have a `# Status:` header
- Every Mode 1/2 decision gets a CODEX_REVIEW.md audit trail
- Human reviewers check [PRE_FLIGHT.md](../../../PRE_FLIGHT.md) to ensure threats are addressed
- Disagreement is transparent: document it in `## Disagreement:` section of PLAN.md

### Tier 2 — HIGH-RISK Decisions (optional hard CI gates)
- Repo can enable `python3 scripts/check-plan-status.py` in CI
- Blocks merge if: PLAN.md missing, Status is REVISE, Status is OVERRIDE with no justification
- User can override via `git push --force-with-lease --no-verify` (visible, logged, auditable)

### Tier 3 — Escalation Paths
- Disagree with Codex verdict? Set `# Status: AWAITING-HUMAN-REVIEW`
- Bring a human reviewer (security-focused peer for auth, database architect for schema, payments expert for payments)
- Human reviewer decides: `APPROVED-BY-HUMAN` or `REVISE`
- Escalation is logged in CODEX_REVIEW.md (audit trail)

---

## Threat Model Versioning

If a new bug class is discovered later (e.g., "we found a 9th class we didn't anticipate"), the threat model can be updated:

1. Add new class to [THREAT_MODEL.md](./THREAT_MODEL.md) with `Version: 2` timestamp
2. Run `scripts/flag-stale-plans.py` to mark old PLAN.md files created under Version 1
3. Optionally re-validate past decisions (no automatic re-review; just a signal)

---

## Example: How Mode 1 Works

**You invoke**:
```
/grill-me-codex Add privilege-escalation guard to approve_member RPC
```

**Round 1 — Claude asks**:
- What data does `approve_member` change? (profiles.access_approved, trial_expires_at)
- Who can call it today? (anyone authenticated? owner only?)
- What's the current RLS policy? (show me the code)
- What could an attacker do? (grant approval to themselves? grant to others?)
- How do you prevent that? (is_platform_owner() check, audit log?)

**Claude writes PLAN.md** with Goal/Threat Surface/Approach/etc.

**Round 2 — Codex reviews**:
- Checks all 8 threat classes + auth domain extension
- Finds: "You said `is_platform_owner()` guard exists, but RPC body has no guard"
- Returns: `VERDICT: REVISE — Fix #1: Add explicit guard before any data mutation`

**Round 3 — You revise PLAN.md**:
- Update Approach: "Guard: `if (!is_platform_owner()) throw 'Unauthorized'`"
- Update Key Decisions: "Guard must run before any `.update()` call"

**Codex re-reviews**:
- Returns: `VERDICT: APPROVED`

**Output**:
- `PLAN.md` with `# Status: APPROVED-BY-CODEX`
- `CODEX_REVIEW.md` showing Round 1 REVISE (finding #1) and Round 2 APPROVED

You commit both, feature-architect references the PLAN.md, autonomous-coder implements with confidence, human reviewer checks PRE_FLIGHT.md checklist.

---

## Troubleshooting

**Q: Codex keeps saying REVISE. How do I know what to fix?**
A: CODEX_REVIEW.md lists specific findings. Read the threat class it flags, check the example in THREAT_MODEL.md, and update your Approach/Key Decisions accordingly.

**Q: Should I use Mode 1 or Mode 2 (Extended)?**
A: Mode 1 (3 rounds) is fast and works for most decisions. Use Mode 2 (5 rounds) if you think 3 might not be enough (complex multi-service integrations, deep schema changes) or if Codex keeps finding new issues.

**Q: Can I use Mode 3 (Quick) for auth changes?**
A: Not recommended. Mode 3 skips Codex review entirely, which defeats the purpose for HIGH-RISK decisions. Use Mode 1 unless the change is genuinely LOW-RISK (e.g., docs only).

**Q: What if I disagree with Codex's verdict?**
A: Document your disagreement in PLAN.md: `## Disagreement: Codex said X, but here's why X doesn't apply because Y`. Then set Status to `OVERRIDE` (soft) or `AWAITING-HUMAN-REVIEW` (escalate). Either way, it's logged in CODEX_REVIEW.md.

---

## Links

- [Full Framework Reference](../../../grill-me-codex.md) — Detailed flow, examples, templates
- [Threat Model Reference](./THREAT_MODEL.md) — 8 threat classes + domain extensions + concrete examples
- [PRE_FLIGHT Checklist](../../../PRE_FLIGHT.md) — What reviewers check before merging
- [CLAUDE.md §10](../../../CLAUDE.md#10-autonomous-feature-proposal-pipeline) — Integration with feature-architect, autonomous-coder, subscriber-portal
