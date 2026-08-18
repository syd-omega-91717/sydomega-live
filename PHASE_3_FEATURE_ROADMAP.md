# Phase 3 Feature Roadmap + Decision Framework

**Status:** Ready for approval  
**Date Created:** 2026-08-18  
**Scope:** Four blocked features awaiting explicit product decisions  
**Next Step:** User approval of decision frameworks → Immediate implementation of Notification Triggers as first wired feature

---

## Executive Summary

Four features have complete or nearly-complete infrastructure in place but are blocked at the **product/business decision** level, not the technical level:

| Feature | Status | Decision Gate | Owner | Timeline |
|---------|--------|---------------|-------|----------|
| **Notification Triggers** | Infrastructure complete | Which events trigger notifications? | Product | ~4 hours after approval |
| **OmegaGuardian Risk Gates** | Module loaded, policies dormant | Which actions require risk scores? At what thresholds? | Product + Security | ~6 hours after approval |
| **Finance Server Persistence** | Currently localStorage-only | Move sensitive data server-side? | Product + Legal | Depends on legal review |
| **Enterprise Pricing** | Schema exists, checkout flows ready | Legal approval for payment terms? | Legal + Business | Blocks checkout wiring |

**Key Principle (from CLAUDE.md §9):** Never ship a new monetizable or legally-sensitive feature as "live" without an explicit gating decision. All four features will ship **dormant** behind `platform_settings` flags until their respective decision gates are resolved.

---

## Feature 1: Notification Triggers

### Current State
- **Schema:** `public.notifications` table exists with RLS policies (members read/update own rows, owner reads all)
- **Client Module:** `omega-notify.js` loaded platform-wide on every approved page
- **UI:** Notification badge/toast/panel widget already renders correctly
- **Infrastructure:** 5 member-status RPCs already populate notifications on approval/rejection/trial changes
- **What's Missing:** Trigger logic for achievement/task-completion/progression events

### Proposed Scope (Phase 3a - Immediate)
Wire two initial trigger events:
1. **Task Completion:** When a member completes a task, emit notification
2. **Achievement Earned:** When a member earns a trophy/medal/certificate, emit notification

Both flow through existing `record_notification(user_id, type, message, content)` RPC. No new schema needed.

### Decision Points
**Question 1:** Should task-completion notifications include a brief summary of what was completed, or just "Task completed"?
- **Option A:** Just "Task completed" (simpler, less data)
- **Option B:** "Completed: Habit Name" (more useful, requires passing task name through the event chain)
- **Recommendation:** Option B — task names are already available in `complete_task()`, minimal additional payload

**Question 2:** Should achievement notifications be grouped by tier (bronze/silver/gold/omega) or sent individually?
- **Option A:** Send immediately per medal earned (more notifications, more visible celebration)
- **Option B:** Batch at end of day (fewer notifications, less spam)
- **Recommendation:** Option A — achievements are inherently celebratory moments, individual timing matters

**Question 3:** What is the dismissal/read model? Should notifications auto-clear after 7 days?
- **Option A:** Manual dismiss only
- **Option B:** Auto-clear after 7 days (`created_at + interval '7 days'`)
- **Recommendation:** Option B with manual dismiss available — prevents infinite growth, respects member choice

### Wiring Plan
1. **Event Source:** `complete_task()` and `award_trophy()`/`award_medal()` RPCs
2. **Signal Path:** Each RPC calls `record_notification()` with typed message
3. **Client Render:** `omega-notify.js` already handles badge/panel display
4. **Gating:** Behind `platform_settings.notifications_enabled` flag (default: `false`)
5. **Activation:** Once flag is `true`, notifications appear automatically — no UI changes needed

### Success Criteria
- [ ] Task completion events generate notification rows
- [ ] Achievement events generate notification rows
- [ ] Member sees count in badge
- [ ] Member can read notification panel
- [ ] 7-day auto-clear works
- [ ] Notifications respect user's own read/unread toggling
- [ ] `scripts/audit.py` reports 0 critical issues
- [ ] CI passes (node --check, broken-asset check, RLS audit)

### Estimated Effort
~4 hours (add `record_notification()` calls to 2 RPCs, wire flag check in 2 pages, test e2e)

---

## Feature 2: OmegaGuardian Risk Gates

### Current State
- **Module:** `omega-guardian.js` loaded platform-wide (window.OmegaGuardian available)
- **Score System:** Tracks idle time (30-min timer), computes risk score 0–100
- **UI:** Badge always visible in topbar showing current score
- **What's Missing:** Nothing actually gates actions based on the score — `OmegaGuardian.gate()` function exists but is never called

### Proposed Scope (Phase 3b - Depends on decision)
Define which privileged actions require a minimum score before proceeding:
- Approve/reject member access (approvals.html)
- Grant permanent access (profile.html)
- Extend trial (approvals.html)
- Make payment (checkout.html)
- Update financial records (wealth.html, investment.html, etc.)

### Decision Points
**Question 1:** What is the minimum risk score required for privileged actions?
- **Option A:** 50 (medium risk acceptable)
- **Option B:** 75 (high risk only)
- **Option C:** 90 (very high risk only)
- **Recommendation:** Option B (75) — balances UX friction with security for approval/payment actions

**Question 2:** On score below threshold, what UX should trigger?
- **Option A:** Hard block with "Too risky, wait 5 min" message
- **Option B:** Soft warning: "Risk score low. Confirm to proceed?"
- **Recommendation:** Option B (soft warning) — respects member agency while surfacing the decision

**Question 3:** Should the score reset daily or keep accumulating?
- **Option A:** Reset at midnight (fresh start each day)
- **Option B:** Keep accumulating (rewards consistent, low-activity behavior)
- **Recommendation:** Option A (reset daily) — simpler mental model, prevents locked-out members

**Question 4:** Should the owner have a different score threshold than members?
- **Option A:** Same threshold for everyone
- **Option B:** Owner gates are different (e.g., owner always at 100, can't be gated)
- **Recommendation:** Option B — owner should never be gated out of their own admin actions

### Wiring Plan
1. **Score Computation:** Already done in `omega-guardian.js`, emits `OmegaGuardian.score()`
2. **Gate Placement:** Wrap privileged action handlers with `if(OmegaGuardian.gate(75)){...proceed...}`
3. **Soft Warning UI:** Use existing `.toast` system to show "score low, confirm?" prompt
4. **Gating:** Behind `platform_settings.guardian_gates_enabled` flag (default: `false`)
5. **Logging:** Each gated action attempt logged to `threat_events` table for audit trail

### Success Criteria
- [ ] Risk score visible in topbar
- [ ] Approval/rejection actions gated at score 75+
- [ ] Payment actions gated at score 75+
- [ ] Soft warning appears on low score
- [ ] Owner never gated (bypass via `is_platform_owner()`)
- [ ] Threat events logged correctly
- [ ] Daily reset works as expected
- [ ] `scripts/audit.py` reports 0 critical issues

### Estimated Effort
~6 hours (add gate checks to ~8 action handlers, wire soft-warning UX, test score behavior, verify logging)

---

## Feature 3: Finance Server Persistence

### Current State
- **Current Model:** All finance data (wealth, wallet, treasury, revenue, investment, expenses, budget) persists to `localStorage` only
- **Pages Affected:** 7 pages (`wealth.html`, `wallet.html`, `treasury.html`, `revenue.html`, `investment.html`, `expenses.html`, `budget.html`)
- **Migration Helper:** `omega-local-backup.js` added (export/import JSON backup, client-side only)
- **Server-Side Option:** `public.financial_records` table exists in schema but is currently unused
- **Data Sensitivity:** Extremely high (net worth, income, holdings — unusual to lose on device change or storage clear)

### Proposed Scope (Phase 3c - Strategic decision required)
**Decision:** Should financial records persist server-side, or remain client-only indefinitely?

**Option A: Remain client-only (current state)**
- ✅ No server-side exposure of sensitive data
- ✅ No new schema/RLS complexity
- ✅ Data stays on device, member owns it
- ❌ Data lost if storage cleared or new device used
- ❌ No sync across devices
- ❌ Inconsistent with rest of platform (tasks/portfolio/NFTs all server-backed)

**Option B: Migrate to server (longer-term)**
- ✅ Sync across devices
- ✅ Durable (survives storage clear)
- ✅ Consistent with platform model
- ❌ Real RLS/security commitment (this repo's history has bugs here)
- ❌ Delicate schema work (7 pages, multiple data shapes)
- ❌ Legal/privacy implications for financial data

### Decision Point
**Question:** Should financial records move server-side in Phase 3, or stay client-only?

**Recommendation:** Stay client-only in Phase 3, with clear path forward:
1. Keep backup/restore infrastructure in place (already built)
2. Mark as "Local Storage Only" in UI (already done)
3. Decide server migration after enterprise pricing is live and member base grows
4. When decided: server migration becomes a discrete Phase 4 work item, not rushed here

**Rationale:** This is the one feature among the four with a genuine architectural decision (not just policy). The backup system already mitigates the data-loss risk. Moving it server-side requires careful schema design, comprehensive RLS testing, and legal review of storing financial data — too much for Phase 3 when three other features are ready to activate immediately.

### If Option B is chosen (server migration):
**Wiring Plan:**
1. Design per-page schema: which fields from each page map to `financial_records` columns?
2. Add RLS policies: member read-only on own records, owner read all
3. Wire upsert on form submit: save both to localStorage AND server
4. Add conflict-resolution: server wins if both diverge
5. Add historical view: show last 30 days of changes
6. Gate behind `platform_settings.finance_server_enabled` (default: `false`)

**Success Criteria (if chosen):**
- [ ] Schema designed and applied
- [ ] RLS policies correct (tested)
- [ ] All 7 pages wire both local + server
- [ ] Conflict resolution tested
- [ ] Historical view works
- [ ] `scripts/audit.py` reports 0 critical

**Estimated Effort (if chosen):** ~12 hours (schema, RLS, 7 pages, testing, audit)

### Current Recommendation
**Phase 3:** Do not wire. Keep as "Phase 4 decision" once member base grows and the risk/benefit calculus becomes clearer.

---

## Feature 4: Enterprise Pricing

### Current State
- **Schema:** Payment infrastructure exists (`public.subscriptions`, `public.transactions`, `public.invoices`)
- **Checkout Flow:** `supabase/functions/checkout` and `supabase/functions/stripe-webhook` exist (Stripe integration complete)
- **What's Blocked:** Legal approval of pricing terms, payment processor terms, subscriber agreement language
- **Current Status:** All pages carry `PAYMENT ACTIVATION PENDING LEGAL REVIEW` placeholder copy (see `subscriptions.html`, `account.html`)

### Proposed Scope (Phase 3d - Blocked on external approval)
This feature **cannot** proceed without:
1. Legal team review of subscriber agreement terms
2. Legal team review of payment processor (Stripe) terms
3. Business decision on pricing tiers and member limits
4. Compliance review (GDPR, payment security, etc.)

**No technical wiring is possible until these approvals exist.**

### Decision Points
**Question 1:** Who owns the legal/business approval process?
- **Answer:** [User to specify: Legal team, business team, or yourself?]

**Question 2:** What is the target timeline for legal approval?
- **Answer:** [User to specify: Q4 2026? Q1 2027?]

**Question 3:** Once legal approves, should checkout go live immediately or stay behind a flag?
- **Recommendation:** Behind a flag. Migrate members to paid subscription one at a time via a controlled onboarding flow, not a sudden switch.

### Wiring Plan (Once approved)
1. Take legal-approved pricing/terms/agreement text
2. Add it to `sovereign-covenant.html` and account setup flows
3. Wire `platform_settings.enterprise_pricing_enabled` flag (default: `false`)
4. Test checkout e2e with Stripe test-mode keys (already configured)
5. Add member upgrade/downgrade flows
6. Implement billing portal (Stripe customer dashboard link)
7. Test RLS on payment tables (member only sees own invoices/transactions)

**Success Criteria (once approved):**
- [ ] Legal terms displayed in signup flow
- [ ] Checkout buttons visible on `subscriptions.html`, `account.html`
- [ ] Stripe webhook processing payments
- [ ] Member sees invoice history
- [ ] Billing portal link works
- [ ] RLS prevents members from seeing other members' payment data
- [ ] `scripts/audit.py` reports 0 critical

**Estimated Effort (once approved):** ~8 hours (wire flows, test payments, verify RLS)

### Current Recommendation
**Phase 3:** Block on legal approval. You can begin technical preparation (review Stripe API, sketch RLS policies), but no wiring until legal team provides written approval of terms and agreement language.

---

## Phase 3 Execution Plan

### Immediate (Week 1)
**Approve Decision Frameworks** — Review and approve the decision points above:
- Notification Triggers: Approve trigger events + dismissal model
- OmegaGuardian: Approve risk threshold + soft warning UX
- Finance: Confirm client-only or server-migration
- Enterprise: Confirm legal review timeline

### Short-term (Week 2-3)
**Wire Notification Triggers** — First implementation:
1. Add `record_notification()` calls to `complete_task()` and `award_trophy()` RPCs
2. Wire `platform_settings.notifications_enabled` flag in 2 pages
3. Test e2e: task completion → notification appears
4. Verify CI green, audit clean, push to branch, open PR

**Wire OmegaGuardian Gates** (if approved):
1. Add gate checks to 8 privileged action handlers
2. Wire soft-warning UX on low score
3. Test: attempt action at score 30 → warning appears; at score 80 → succeeds
4. Verify logging to `threat_events`
5. Verify CI green, audit clean, push to branch, open PR

### Medium-term (Week 4+)
**Finance Server Migration** (if approved):
- Design schema across 7 pages
- Apply schema and RLS policies
- Wire upsert on each page
- Test sync, conflict resolution, historical view
- CI green, audit clean, push to branch, open PR

**Enterprise Pricing** (once legal approves):
- Implement wiring per plan above
- Test checkout e2e with Stripe test mode
- CI green, audit clean, push to branch, open PR

---

## Platform Settings Flags (Implementation Checklist)

Each feature gates behind a platform_settings flag. To activate in production:

```sql
-- Notification Triggers
UPDATE platform_settings SET notifications_enabled = true;

-- OmegaGuardian Risk Gates
UPDATE platform_settings SET guardian_gates_enabled = true;

-- Finance Server Persistence (if chosen)
UPDATE platform_settings SET finance_server_enabled = true;

-- Enterprise Pricing (once legal approves)
UPDATE platform_settings SET enterprise_pricing_enabled = true;
```

All flags default to `false`. Features remain dormant until explicitly activated via these flag updates.

---

## Risk Mitigation & Testing Strategy

### Testing Before Any Activation
1. **Local:** Full e2e test with all 4 features wired but all flags `false` — should see no visible changes
2. **Staging:** Deploy to staging environment, test all features with flags `true`
3. **Production:** Flags remain `false` until explicit user approval to activate

### Audit Trail & Logging
- Every gated action (risk gates, notification sent, payment processed) logged to audit tables
- `omega-threat.js` and `telemetry_events` table used for platform-wide instrumentation
- Member-facing notification panel shows what was recorded about them

### Rollback Plan
If any feature causes issues after activation:
1. Set flag back to `false` immediately
2. Infrastructure remains in place (no deletion needed)
3. Feature can be re-tested and re-enabled later
4. Member data/notifications preserved (audit trail stays)

---

## Success Criteria for Phase 3 Complete

- [ ] All 4 decision frameworks approved by user
- [ ] Notification Triggers wired and tested (flag working)
- [ ] OmegaGuardian Gates wired and tested (flag working) — if approved
- [ ] Finance Server Migration planned or explicitly deferred — if approved
- [ ] Enterprise Pricing timeline and legal contact established
- [ ] All PRs merged to main
- [ ] `scripts/audit.py` reports 0 critical across all changes
- [ ] CI consistently green
- [ ] PHASE_3_COMPLETION_REPORT.md created with sign-off

---

## Questions for User / Next Steps

1. **Notification Triggers:** Approve trigger events + dismissal model (Options A/B/C per decision points)?
2. **OmegaGuardian Gates:** Approve risk threshold 75 + soft warning UX?
3. **Finance Persistence:** Confirm client-only, or proceed with server migration?
4. **Enterprise Pricing:** Who owns legal review? What is target timeline?

**Once these are answered, implementation can begin immediately.**

---

**Document Status:** Ready for approval  
**Last Updated:** 2026-08-18  
**Author:** Claude (Phase 3 planning)
