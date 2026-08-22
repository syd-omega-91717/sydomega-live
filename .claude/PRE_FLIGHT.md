# PRE_FLIGHT — Code Review Checklist for HIGH-RISK Decisions

**Purpose**: A checklist for PR reviewers to verify that HIGH-RISK changes (auth, schema, payments, RLS) were properly gated through `grill-me-codex` and that their threat-model review is documented and addressed.

Use this checklist before approving any PR that touches the categories below. A "No" answer to any mandatory check (marked ✓) means the PR should not be merged; missing or incomplete documentation is reason to request changes, not to approve with a note.

---

## 1. ✓ Does this PR touch authentication, authorization, or session logic?

**Check if**: 
- New `is_owner()`, `is_authenticated()`, or `has_role()` guards
- Changes to Supabase Auth configuration or policy
- New session-state logic or token handling
- Changes to `is_platform_owner()` or any permission-checking RPC

**Required**:
- [ ] A `PLAN.md` exists on the branch, with `# Status: APPROVED-BY-CODEX` or `# Status: OVERRIDE` (with documented reasoning)
- [ ] A matching `CODEX_REVIEW.md` exists, documenting Codex's verdict and any revisions made

**Threat model to check against**: `grill-me-codex` threat model, `type=auth` extension (privilege escalation, session fixation, token validation, credential handling)

---

## 2. ✓ Does this PR touch database schema, constraints, or migrations?

**Check if**:
- New tables or columns added
- Foreign-key constraints changed
- Indexes added or removed
- `supabase/*.sql` or `supabase/migrations/` touched

**Required**:
- [ ] A `PLAN.md` exists on the branch, with `# Status: APPROVED-BY-CODEX` or `# Status: OVERRIDE` (with documented reasoning)
- [ ] A matching `CODEX_REVIEW.md` exists, documenting Codex's verdict and any revisions made

**Threat model to check against**: `grill-me-codex` threat model, `type=schema` extension (migration ordering, constraint conflicts, type mismatches, foreign-key cascades, RLS per-column scoping)

---

## 3. ✓ Does this PR touch payment logic, Stripe integration, or subscriptions?

**Check if**:
- New `supabase/functions/checkout/`, `stripe-webhook/`, or `apply_subscription()` logic
- Changes to `platform_settings.tokens_enabled` or related payment gates
- New monetary features or pricing tiers
- Idempotency keys, webhook signature validation, or event replay handling

**Required**:
- [ ] A `PLAN.md` exists on the branch, with `# Status: APPROVED-BY-CODEX` or `# Status: OVERRIDE` (with documented reasoning)
- [ ] A matching `CODEX_REVIEW.md` exists, documenting Codex's verdict and any revisions made
- [ ] Feature is gated behind `platform_settings.<feature>_enabled = false` (default off until human decision)
- [ ] No secrets (Stripe keys, etc.) are committed to the repo

**Threat model to check against**: `grill-me-codex` threat model, `type=payments` extension (idempotency keys, webhook signature validation, PCI concerns, Stripe event replay, subscription state races)

---

## 4. ✓ Does this PR touch RLS policies?

**Check if**:
- Any `CREATE POLICY`, `ALTER POLICY`, or `REVOKE`/`GRANT` on RLS statements
- Changes to `WITH CHECK` or `USING` clauses
- New tables with RLS enabled/disabled
- Changes to owner-bypass logic

**Required**:
- [ ] A `PLAN.md` exists on the branch, with `# Status: APPROVED-BY-CODEX` or `# Status: OVERRIDE` (with documented reasoning)
- [ ] A matching `CODEX_REVIEW.md` exists, documenting Codex's verdict and any revisions made
- [ ] Every table with a data-access gate has **both** `is_platform_owner()` AND a member-scoped policy (not `WITH CHECK(true)` alone)
- [ ] No policy is broader than documented intent (e.g., `WITH CHECK(true)` on an `INSERT` is a common pattern that silently breaks)

**Threat model to check against**: `grill-me-codex` threat model base class #3 (RLS policy gaps: `WITH CHECK(true)`, missing owner-bypass clauses, unscoped access)

---

## 5. ✓ Does this PR create new RPC functions or Edge Functions?

**Check if**:
- New `public.<function>()` RPC added
- New `supabase/functions/<name>/` Edge Function added
- Changes to function call signature or access grants

**Required**:
- [ ] Every new RPC callable by non-owners is either:
  - Guarded with `if (!is_platform_owner())` before any write, OR
  - Scoped to `auth.uid()` via RLS on its target table(s), AND
  - A matching RLS `INSERT`/`UPDATE` policy exists preventing non-owner writes
- [ ] No public Edge Function endpoint accepts unvalidated input without server-side checks
- [ ] Secrets (API keys, webhook tokens) are set via `supabase secrets set`, never hardcoded

**Threat model to check against**: `grill-me-codex` threat model base classes #6 (Unguarded RPCs) and #8 (Missing edge cases)

---

## 6. ✓ Does this PR touch member-writable data rendered in member-facing or owner-facing pages?

**Check if**:
- `display_name`, `bio`, `avatar_url`, or other self-updatable profile fields
- User-submitted content (posts, comments, articles, media metadata)
- Any data read from a table where `auth.uid() = user_id` policy exists for `INSERT`/`UPDATE`
- Rendering via `.innerHTML`, `.textContent`, Canvas `fillText()`, or a prompt context

**Required**:
- [ ] All member-writable data rendered into `innerHTML` or a prompt is escaped using `esc()` or similar (never raw string concatenation)
- [ ] Spot-check: owner-facing pages (`approvals.html`, `profile.html`) especially carefully — owner sees every member's data
- [ ] If rendering into a prompt context (e.g., AI assistant), assume malicious content and document how it's handled

**Threat model to check against**: `grill-me-codex` threat model base class #1 (Stored XSS: member-writable data rendered unescaped)

---

## 7. ✓ Does this PR introduce new database writes without error-checking?

**Check if**:
- Any `.insert()`, `.update()`, `.upsert()`, `.delete()`, or `.rpc()` call
- Success state shown to user (toast, modal, page update) without verifying `.error`

**Required**:
- [ ] Every new data mutation checks `.error` (Supabase returns `{data:null, error}`, it does not throw) before showing success
- [ ] On write failure, user sees an explicit error message, not a false "Success" toast
- [ ] Example pattern to verify: `const {data, error} = await sb.from('table').insert(...); if(error) { alert('Failed: '+error.message); return; } else { showSuccessToast('Done'); }`

**Threat model to check against**: `grill-me-codex` threat model base class #2 (Silent-failure writes: `.insert()/.update()/.rpc()` missing `.error` checks)

---

## 8. ✓ Codex Audit Trail

**If any of checks 1–5 above apply, verify**:
- [ ] A `CODEX_REVIEW.md` file exists alongside `PLAN.md` documenting:
  - Which Codex rounds happened (Round 1 → Round 2 verdict → Round 3 revision if needed)
  - Codex's specific findings (if `REVISE`)
  - What was changed in response to Codex's feedback
  - Final status: `APPROVED` or user justification if `OVERRIDE`

**If no Codex audit trail exists for a HIGH-RISK change**:
- Reject the PR and ask the author to run `/grill-me-codex` before resubmitting

---

## Summary

| Check | Mandatory? | When to Apply |
|-------|-----------|---------------|
| Auth/session logic | ✓ | Any privilege, session, token changes |
| Schema/migration | ✓ | Any table/column/constraint changes |
| Payments/Stripe | ✓ | Any payment logic, idempotency, webhooks |
| RLS policies | ✓ | Any `CREATE POLICY`, `ALTER POLICY`, `REVOKE GRANT` |
| New RPCs/Edge Functions | ✓ | Any new public-callable functions |
| Member-writable data rendering | ✓ | User-submitted content rendered to page/prompt |
| Write error-checking | ✓ | Any `.insert()`, `.update()`, `.upsert()`, `.rpc()` |
| Codex audit trail | ✓ (if 1–5 apply) | PR contains PLAN.md + CODEX_REVIEW.md |

---

## Questions to ask the author (if audit trail is missing or incomplete)

1. "Why wasn't this gated through `/grill-me-codex` before implementing?" (Should be: "We did, see the PLAN.md and CODEX_REVIEW.md attached.")
2. "What threat model was checked?" (Should reference the `grill-me-codex` threat model + domain extension, not a custom one-off list.)
3. "Did Codex raise any concerns?" (Should point to the CODEX_REVIEW.md findings and how they were addressed.)
4. "Is this feature live or dormant?" (Should be: "Dormant by default, gated behind `platform_settings.<name>_enabled=false`, will be live only after human review and explicit flag flip.")

---

## Links

- [Grill-Me-Codex Skill](`./.claude/skills/grill-me-codex/SKILL.md`) — invocation modes and quick start
- [Full Framework Reference](`./grill-me-codex.md`) — detailed flow, templates, examples
- [Threat Model Reference](`./.claude/skills/grill-me-codex/THREAT_MODEL.md`) — all 8 threat classes + domain extensions + concrete examples
- [CLAUDE.md §5](./CLAUDE.md#5-backend--data-model) — RLS invariants (every table has RLS; `is_platform_owner()` is the owner check)
- [CLAUDE.md §8](./CLAUDE.md#8-known-debt) — real bugs this framework prevents (stored XSS, silent writes, RLS gaps, column mismatches, module-boundary bugs, unguarded RPCs, race conditions, missing edge cases)
- [CLAUDE.md §9](./CLAUDE.md#9-working-in-this-repo--practical-rules) — "Never show a success state without checking the write's actual result first"
