# Grill-Me-Codex Framework: Full Reference

Complete documentation for the two-model interrogation framework integrated into sydomega-live as a comprehensive safety system.

---

## What This Is

A structured decision-locking framework designed to catch intent-mismatch bugs before they become code, through adversarial review and explicit threat-model auditing.

**Core insight**: Sydomega-live has shipped serious bugs silently (see [CLAUDE.md §8](./CLAUDE.md#8-known-debt)). Most were intent mismatches, not typos:
- Code author thought "this RPC is owner-only" but never wrote the guard
- Code author thought "members can't see each other's data" but RLS was `WITH CHECK(true)`
- Code author thought "this write will always succeed" but error was never checked

Grill-Me-Codex forces the intent onto paper (PLAN.md) and subjects it to adversarial review (Codex) *before* code is written. It's a design gate, not a code gate.

---

## Three Invocation Modes

### Mode 1: Standard (3 Rounds, Structured)

**Command**:
```
/grill-me-codex <task description>
```

**Flow**:

#### Round 1: Interrogation & Planning
Claude asks you 5 focused questions tailored to your task domain:

**If your task is about authentication**:
- What user data will be readable/writable?
- How do you prevent privilege escalation?
- How is session identity validated?
- What happens if a token expires mid-operation?
- Who can call which RPC functions?

**If your task is about schema**:
- What tables are created/altered?
- How do RLS policies scope reads/writes per user?
- Are foreign keys indexed? Cascading?
- How do migrations order against existing data?
- What happens if a constraint validation fails?

**If your task is about payments**:
- How are idempotency keys generated?
- How is the webhook signature validated?
- What happens if Stripe calls the webhook twice?
- How is subscription state consistent under concurrent updates?
- Are card details ever stored locally?

**You answer the questions**, then Claude writes **PLAN.md** with sections:
- **Goal** — What you're building and why
- **Threat Surface** — Which of the 8 bug classes apply to this decision
- **Approach** — How you're addressing each threat
- **Key Decisions** — Explicit tradeoffs made
- **Risks / Open Questions** — What could still go wrong
- **Out-of-Scope** — What you're deliberately not handling
- **Success Criteria** — How you'll know it worked

#### Round 2: Adversarial Review
**Codex reviews PLAN.md** against the threat model. For each threat class that applies, Codex asks:
- "You said X addresses Stored XSS. How exactly?"
- "You said RLS policy prevents reads. Where's the `USING` clause?"
- "You said the write checks `.error`. What happens if it's false?"

**Codex returns a VERDICT**:
- **APPROVED** — No issues found; you can proceed
- **REVISE** — Issues found; Codex lists them specifically
- **APPROVED WITH NOTES** — No blockers, but here are things to think about

**Examples of issues Codex might find**:
- "You said `is_platform_owner()` guards the RPC, but the function body has no such check"
- "Column `authority_score` doesn't exist; you're probably reading from `axis_a/b/c` and computing client-side"
- "RLS policy is `WITH CHECK(true)`; any authenticated user can insert anything"
- "No `.error` check after the `.update()` call; silent failure if it fails"

#### Round 3 (if REVISE): Revision & Re-Review
You update PLAN.md to address Codex's findings, then Codex re-reviews. Repeat until APPROVED or you decide to escalate (see Tier 3 below).

#### Output
- **PLAN.md** with `# Status: APPROVED-BY-CODEX`
- **CODEX_REVIEW.md** (audit trail showing each round, verdict, findings)

---

### Mode 2: Extended (5 Rounds, For Complex Decisions)

**Command**:
```
/grill-me-codex rounds=5 type=schema <task description>
```

**Same as Mode 1, but**:
- Allows 5 rounds of back-and-forth instead of 3
- Adds domain-specific extensions (type=auth, type=schema, type=payments)
- Each round can dig deeper before Codex declares APPROVED or REVISE

**Use when**:
- Complex schema redesigns with many tables/constraints
- Multi-service auth systems (federation, session sync, etc.)
- Payment logic with many state transitions
- You anticipate needing more than 3 rounds to lock it down

---

### Mode 3: Quick (Single-Shot, Wizard-Style, No Codex Review)

**Command**:
```
/grill-me-codex quick <task description>
```

**Flow**:
1. Interactive questionnaire (one question at a time, in the same session)
2. Claude writes PLAN.md
3. **No Codex review** (faster, less rigorous)

**Output**: PLAN.md only (no CODEX_REVIEW.md)

**Use when**:
- LOW-RISK decision (UI, docs, styling, non-data changes)
- You want a decision record for later reference, but don't need adversarial review
- You need the PLAN.md quickly and rigor isn't critical
- You're recording a decision that's already finalized (not for new designs)

**Do NOT use Mode 3 for**:
- Auth changes (use Mode 1)
- Schema changes (use Mode 1)
- Payment logic (use Mode 1)
- RLS policy rewrites (use Mode 1)
- Any HIGH-RISK decision

---

## PLAN.md Template

Every PLAN.md follows this structure:

```markdown
# Plan: <Short title of decision>

**Status**: APPROVED-BY-CODEX  # or REVISE, OVERRIDE, AWAITING-HUMAN-REVIEW

---

## Goal

<1-2 paragraphs: what are you building, why, who does it affect>

---

## Threat Surface

Which of the 8 bug classes apply to this decision?

- [ ] Stored XSS — Any member-writable data rendered unescaped?
- [ ] Silent-failure writes — Any `.insert()/.update()/.rpc()` that could fail silently?
- [ ] RLS policy gaps — Any reads/writes missing `WITH CHECK` conditions?
- [ ] Column-name mismatches — Any non-existent columns referenced?
- [ ] Module-boundary bugs — Any inline handlers calling module-scoped functions?
- [ ] Unguarded RPCs — Any public-callable functions without privilege checks?
- [ ] Race conditions — Any concurrent writes that could leave data inconsistent?
- [ ] Missing edge cases — Any "what if this fails?" paths undefined?

Mark all that apply.

---

## Approach

<Paragraphs: How do you address each threat surface item above?>

For each bullet above that you checked, explain in concrete terms how your approach prevents it.

Example:
- **Stored XSS**: We render `display_name` via `.textContent`, not `.innerHTML`, so injected HTML is safe.
- **Silent-failure writes**: Every `.update()` call checks `if (error)` before showing success.
- **RLS policy gaps**: Members can only read/write their own rows; owner has `is_platform_owner()` bypass.

---

## Key Decisions

<Table or bullets: explicit tradeoffs made>

| Decision | Why | Tradeoff |
|---|---|---|
| Use RLS instead of app-layer auth | Smaller attack surface; RLS is the actual authorization boundary | Requires SQL changes, can't iterate without DB deploy |
| Require idempotency key for payments | Prevents double-charges on webhook retry | Adds complexity to checkout flow |
| Make trial expiration a computed field | No scheduled jobs; always consistent with current time | Can't override expiration manually; requires code change |

---

## Risks / Open Questions

<Bullets: what could still go wrong>

- Risk: If webhook signature validation is weak, attackers could forge Stripe events
  - Mitigation: Use Stripe's official webhook library, validate signature before trusting body
- Question: Should we also audit past payments to look for double-charges?
  - Defer to Phase 2 (decide this post-launch)

---

## Out of Scope

<Bullets: what you're deliberately not handling>

- Automated refunds for double-charges (manual admin process for now)
- Subscription pauses (only allow cancel, not pause)
- Multi-currency pricing (USD only in Phase 1)

---

## Success Criteria

<Bullets: how you'll know it worked>

- [ ] All 8 threat classes have explicit mitigations in Approach section
- [ ] No silent-failure writes (every mutation checks `.error`)
- [ ] All new RLS policies have `WITH CHECK` conditions
- [ ] Feature works end-to-end on staging database
- [ ] Codex approval received before merging
- [ ] Human reviewer checks PRE_FLIGHT.md before merging

---

## (Optional) Disagreement

If you disagree with a Codex verdict, document it here:

**Codex said**: "Column `authority_score` doesn't exist; how do you compute it?"

**Why it doesn't apply**: We compute `authority_score` client-side from `axis_a`, `axis_b`, `axis_c` using the formula documented in `omega-share-card.js`. No column lookup needed; Codex misread the approach section.
```

---

## CODEX_REVIEW.md Artifact

Codex generates an audit trail for every Mode 1/2 decision:

```markdown
# Codex Review: <Task Title>

## Round 1: Interrogation & Planning

Claude asked:
- What data does this RPC modify?
- How is caller identity validated?
- [...]

You answered:
- [Answers from Round 1]

**Claude wrote PLAN.md**
- Goal: [generated goal]
- Approach: [generated approach]
- [...]

---

## Round 2: Adversarial Review

**Codex verdict**: REVISE

**Finding #1**: Stored XSS — `display_name` rendered to `.innerHTML` without escaping
- **Why it matters**: Member A sets name to `<img onerror="...">`, script executes in owner's browser
- **How to fix**: Use `.textContent` or `esc()` helper
- **Priority**: CRITICAL

**Finding #2**: Silent-failure write — `.update()` call has no `.error` check
- **Why it matters**: User sees "✓ Updated!" even if write failed
- **How to fix**: Check `if (error) { alert(...); return; }`
- **Priority**: HIGH

---

## Round 3: Revision & Re-Review

You updated PLAN.md:
- **Change to Finding #1**: Added `.textContent` rendering; FIXED
- **Change to Finding #2**: Added `.error` check before success toast; FIXED

**Codex verdict**: APPROVED

No further issues found. Ready to proceed.

---

## Final Status

**Status**: APPROVED-BY-CODEX  
**Date**: 2026-08-22  
**Threat Model Version**: 1.0

Codex confirmed this decision addresses all applicable threat classes.
```

---

## Enforcement & Governance

### Tier 1: Soft Guardrails (All Decisions)

- Every PLAN.md must have a `# Status:` header
- Every Mode 1/2 decision gets a CODEX_REVIEW.md
- Human reviewers check [PRE_FLIGHT.md](./PRE_FLIGHT.md) before merging
- Disagreement is transparent: document in `## Disagreement:` section of PLAN.md

**Enforcement mechanism**: Convention + human review (no CI block by default)

### Tier 2: Hard CI Gates (Optional, Per-Repo HIGH-RISK)

Repo can enable `python3 scripts/check-plan-status.py` in CI. Blocks merge if:
- PLAN.md missing entirely
- Status is `REVISE` (not finalized)
- Status is `OVERRIDE` with no documented disagreement

**Enforcement mechanism**: CI pipeline (explicit opt-in per repo/rule)

**Override path**: `git push --force-with-lease --no-verify` (visible, logged, audited)

### Tier 3: Escalation Paths

**User disputes Codex verdict**?
1. Document disagreement in PLAN.md: `## Disagreement: Codex said X, but here's why...`
2. Set Status to `OVERRIDE` (proceed anyway, fully documented) or `AWAITING-HUMAN-REVIEW` (request human escalation)
3. If AWAITING-HUMAN-REVIEW: bring a human reviewer (security peer for auth, DBA for schema, payments expert for payments)
4. Human reviewer reads PLAN.md + CODEX_REVIEW.md, decides: `APPROVED-BY-HUMAN` or `REVISE`
5. Escalation is logged in CODEX_REVIEW.md

---

## Integration with Other Skills

**Recommended workflow for HIGH-RISK decisions**:

```
/grill-me-codex [Mode 1/2: lock intent and threat model]
  ↓
  → PLAN.md + CODEX_REVIEW.md committed

/feature-architect [blueprint implementation]
  ↓
  → References PLAN.md; outputs blueprint

/autonomous-coder [implement blueprint]
  ↓
  → Outputs code, references PLAN.md in commit

(Human review: checks PLAN.md + CODEX_REVIEW.md via PRE_FLIGHT.md)
  ↓
  → Approves or requests changes

/subscriber-portal [expose feature]
  ↓
  → Wires into real UI once code is approved
```

**For LOW-RISK decisions**, you can skip grill-me-codex or use Mode 3 (quick, no Codex).

---

## Examples

### Example 1: Auth Change (Mode 1, Standard)

**Your task**: "Add a privilege-escalation guard to the `approve_member()` RPC"

**Round 1 — Claude asks**:
- Who can call this RPC today? (any authenticated member or owner-only?)
- What data does it modify? (set `access_approved=true`?)
- How do you prevent member A from approving member B or themselves?
- What's the current RPC body? (show me the code)
- If the guard fails, what happens? (error message? silent no-op?)

**You answer**, Claude writes PLAN.md with:
- Goal: Ensure only owner can approve pending member requests
- Threat Surface: Privilege escalation (main), unguarded RPC (secondary)
- Approach: Add `if (!is_platform_owner()) throw 'Unauthorized'` guard, run before any mutation
- Key Decisions: Guard at function entry (fail-fast), not scattered throughout body
- Risks: If is_platform_owner() returns false for the actual owner (e.g., due to bug), approvals block entirely
- Success Criteria: Codex approves, human reviewer confirms guard is in place, member-escalation test fails as expected

**Round 2 — Codex reviews**:
- Checks PLAN.md Approach: "You said the RPC has an `is_platform_owner()` guard. Where is it in the code?"
- Verdict: REVISE — "Function body shows no guard. Add it before the `UPDATE` statement."

**Round 3 — You revise PLAN.md**:
- Update Approach: "Guard: `IF NOT is_platform_owner() THEN RAISE...` appears at line X of the function body"
- Codex re-reviews, confirms guard is documented
- Verdict: APPROVED

**Output**: PLAN.md with APPROVED status + CODEX_REVIEW.md audit trail

---

### Example 2: Schema Change (Mode 2, Extended, type=schema)

**Your task**: "Redesign the RLS policy for task_completions to prevent members from incrementing each other's axes"

**Rounds 1–5**: Same interrogation → Codex review → revision loop, but with 5 rounds (3 not enough)

**Round 1 questions** (schema-specific):
- What columns exist on `task_completions`?
- Who should be able to read/write their own rows vs. others'?
- What happens if member A inserts a row with `user_id = member B`?
- Are there foreign keys to `profiles` that could cascade?
- How are the axis columns (`axis_a`, `axis_b`, `axis_c`) protected?

**Result**: PLAN.md + CODEX_REVIEW.md showing all 5 rounds of refinement

---

### Example 3: Low-Risk Decision (Mode 3, Quick)

**Your task**: "Add a help modal to the dashboard explaining the authority score"

**Round 1 — Interactive questionnaire**:
- Is this a data change? (No)
- Does it touch auth? (No)
- Will any members see sensitive data? (No, just a help popup)
- What are you adding? (HTML modal, CSS styling, JavaScript to open/close)

**Claude writes PLAN.md** quickly, no Codex review.

**Output**: PLAN.md only (no CODEX_REVIEW.md because Mode 3 skipped Codex review)

---

## PLAN.md Examples by Risk Level

### Low-Risk Example

```markdown
# Plan: Add Timezone Selector to Settings Page

**Status**: APPROVED-BY-CODEX

## Goal
Members in different time zones see local times in their notifications and calendar. Currently all times are UTC.

## Threat Surface
- [ ] Stored XSS — Timezone is user-selected from dropdown, not user-typed; safe
- [x] Silent-failure writes — Update to `profiles.timezone` needs error check
- [ ] RLS policy gaps — Only member can write their own timezone
- [x] Column-name mismatches — Does `profiles.timezone` column exist? Yes, confirmed
- [ ] Module-boundary bugs — Dropdown is inline HTML, no module JS needed
- [ ] Unguarded RPCs — No new RPC; just a `.update()` call
- [ ] Race conditions — One field, one member; no concurrency risk
- [ ] Missing edge cases — What if timezone is invalid? Dropdown enforces list

## Approach
- Add `<select>` dropdown with valid IANA timezones
- On change, call `sb.from('profiles').update({timezone: selected})`
- Check `if (error)` and show error toast; on success, show "✓ Timezone updated"
- Reload user's profile to apply changes
- Render all timestamps using [Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) with user's timezone

## Key Decisions
| Decision | Why | Tradeoff |
|---|---|---|
| Use IANA timezone list | Standard; works with PostgreSQL `AT TIME ZONE` | Requires parsing IANA database |
| Validate on client only | Simpler; timezone is non-sensitive | Server should also validate, but deferred to Phase 2 |
| Reload on change | Ensures all timestamps update without page refresh | Slight jank if user changes multiple times |

## Risks
- Risk: If timezone invalid, user gets an error and has to retry
  - Mitigation: Dropdown enforces valid list; error shouldn't happen

## Out of Scope
- Bulk timezone change for all events
- Calendar integration (handled separately)
- Timezone-aware search ("events in my timezone")

## Success Criteria
- [ ] Dropdown renders with all IANA timezones
- [ ] Update to `profiles.timezone` checks `.error` before success
- [ ] User's subsequent timestamps render in chosen timezone
- [ ] Error message appears if update fails
```

### High-Risk Example

```markdown
# Plan: Implement Stripe Webhook Handler for Subscription Updates

**Status**: APPROVED-BY-CODEX

## Goal
When a member's subscription status changes in Stripe (upgrade, downgrade, cancel), our database reflects the change immediately. No manual sync needed.

## Threat Surface
- [x] Stored XSS — Webhook body from Stripe, not user-input; safe
- [x] Silent-failure writes — Update to `subscriptions` table needs error check and idempotency
- [x] RLS policy gaps — Webhook is backend-only, not user-callable; doesn't need RLS
- [ ] Column-name mismatches — Reviewed schema; all columns exist
- [ ] Module-boundary bugs — No UI involved
- [x] Unguarded RPCs — Edge Function has Stripe secret validation; Stripe signature required
- [x] Race conditions — Concurrent webhook calls could double-process same event
- [x] Missing edge cases — Webhook retry, event out-of-order, Stripe API outage

## Approach
**Webhook signature validation**:
- Every request must have `Stripe-Signature` header
- Verify signature against webhook secret using crypto.subtle.verify
- If invalid, reject with 401 Unauthorized (tell Stripe to retry)

**Idempotency**:
- Use Stripe event ID as dedup key: `SELECT ... WHERE stripe_event_id = $1`
- If already processed, return 200 OK (Stripe stops retrying)
- If new, process and INSERT the event record

**Processing**:
- Parse event type: `charge.succeeded`, `customer.subscription.updated`, `invoice.payment_failed`
- For each event type, update `subscriptions` table:
  - `subscription_status = active/paused/canceled`
  - `renewal_date = event.next_billing_date`
  - Check error before returning; if error, return 500 (Stripe retries)
- Insert into `webhook_events` table for audit trail

**Race condition handling**:
- Webhook handler is idempotent (dedup key prevents double-processing)
- Each event is independent (no multi-step orchestration that could leave state inconsistent)

## Key Decisions
| Decision | Why | Tradeoff |
|---|---|---|
| Use dedup key (stripe_event_id) not idempotency_key | Stripe provides event ID; guaranteed unique per event; immutable | Have to parse it from event JSON, not from request header |
| Verify signature in Edge Function, not client | Webhook is backend-only; secret must not leave server | Adds crypto.subtle.verify overhead per request |
| Return 500 on process error (tell Stripe to retry) | Safer than swallowing the error and returning 200 | User's subscription update is delayed until retry succeeds (acceptable for webhooks) |

## Risks
- Risk: Stripe calls webhook twice (network duplicate); we charge customer twice
  - Mitigation: Dedup key + idempotency check prevents double-processing of same event ID
- Risk: Webhook arrives before user submits payment form; subscription status mismatch
  - Mitigation: Client calls `GET /check-subscription-status` before rendering UI; always reads latest
- Risk: Stripe event has a typo in event ID field; dedup fails
  - Mitigation: Stripe event ID is standardized (e.g., `evt_1a2b3c...`); if malformed, reject

## Out of Scope
- Automatic refund processing (manual admin decision required)
- Subscription pauses (cancel only in Phase 1)
- Multi-currency (USD only in Phase 1)

## Success Criteria
- [ ] Webhook signature validation rejects unsigned/invalid requests with 401
- [ ] Dedup key prevents duplicate processing (send same event twice, only one processes)
- [ ] Subscription status updates in DB immediately on valid webhook
- [ ] Audit trail in `webhook_events` table captures all received events
- [ ] Codex approves threat model (all 8 classes + payments extension addressed)
- [ ] Integration test: send mock Stripe event, confirm DB updated
- [ ] Human reviewer confirms secret is in Supabase secrets, not in code
```

---

## Threat Model Versioning

If a new bug class is discovered post-launch:

1. Add to [THREAT_MODEL.md](./skills/grill-me-codex/THREAT_MODEL.md) with `Version: 2` timestamp
2. Run `scripts/flag-stale-plans.py` to mark old PLAN.md files created under Version 1
3. Optionally re-validate affected past decisions (no automatic re-review; human discretion)

Example:
```markdown
# Version 2 Update

**Discovery**: Members could escalate via missing `auth.role()` validation (new threat class: "role spoofing")

**Added to threat model**: "9. Role Spoofing — Caller claims a role they don't have (e.g., authenticated claims to be owner)"

**Flagged for re-review**: All PLAN.md files created under Version 1
```

---

## Troubleshooting

**Q: Codex keeps saying REVISE. How long does this take?**
- A: Most decisions resolve in 2 rounds; complex ones take 3–5. If you're hitting 5+ rounds, consider breaking the decision into smaller pieces.

**Q: My decision is simple. Do I really need Mode 1?**
- A: If it's LOW-RISK (UI, docs, styling), use Mode 3 (quick). If it touches auth/schema/payments, use Mode 1 even if it seems simple; silent failures are often in the "simple" cases.

**Q: Can I use Mode 3 and still get an audit trail?**
- A: Mode 3 outputs PLAN.md only (no CODEX_REVIEW.md), so there's less audit trail. If you need the trail, use Mode 1.

**Q: What if Codex is wrong?**
- A: Document your disagreement in PLAN.md under `## Disagreement:` section. Set Status to `OVERRIDE` (proceed anyway, documented) or `AWAITING-HUMAN-REVIEW` (escalate to a human). Either way, it's logged in CODEX_REVIEW.md.

**Q: How do I know if my threat surface is complete?**
- A: Check each of the 8 threat classes against your approach. If you can't articulate how you address one, it probably needs more thought. Codex will find it in Round 2.

**Q: Can I automate grill-me-codex in GitHub Actions?**
- A: Phase 3+ (future work). For now, invoke manually as a skill.

---

## Links

- [SKILL.md](./skills/grill-me-codex/SKILL.md) — Quick start and mode selection
- [THREAT_MODEL.md](./skills/grill-me-codex/THREAT_MODEL.md) — Detailed threat classes + examples
- [PRE_FLIGHT.md](./PRE_FLIGHT.md) — Reviewer checklist
- [CLAUDE.md §8](./CLAUDE.md#8-known-debt) — Actual failure history this framework addresses
- [CLAUDE.md §10](./CLAUDE.md#10-autonomous-feature-proposal-pipeline) — Integration with feature-architect, autonomous-coder, subscriber-portal
