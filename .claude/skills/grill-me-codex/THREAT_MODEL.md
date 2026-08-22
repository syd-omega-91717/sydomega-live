# Threat Model Reference

**Version**: 1.0  
**Last updated**: 2026-08-22  
**Grounded in**: [CLAUDE.md §8](../../../CLAUDE.md#8-known-debt) (sydomega-live's actual failure history)

---

## Base Threat Model: 8 Bug Classes

These are the 8 specific failure modes sydomega-live has shipped. Codex hunts for all of them in every decision.

### 1. Stored XSS

**Definition**: Member-writable data rendered unescaped in HTML, allowing injected scripts to execute.

**Shape**: Member updates `display_name` to contain HTML/JavaScript → Page renders it with `.innerHTML` → Script executes in viewer's browser.

**Real examples from this repo**:
- `approvals.html` and `profile.html` rendered `display_name` straight to `.innerHTML` without escaping
- Member A could set their own name to `<img onerror="...">`, then owner sees the script when viewing member list
- `profile.html` also exposed `email` and avatar initial unescaped

**How to prevent**:
- Use `.textContent` or `.createTextNode()` for user data (browser auto-escapes)
- If you must use `.innerHTML`, apply `esc()` helper first
- OR use a templating engine that auto-escapes by default (not available in this repo; do it by hand)

**Checklist**:
- [ ] Every self-updatable field (`profiles.display_name`, `.bio`, etc.) is rendered to the page
- [ ] Rendering uses `.textContent` or `esc()`-wrapped `.innerHTML`, never bare string concatenation
- [ ] Found a form, checked `<script>` for `.innerHTML = user_data` patterns?

---

### 2. Silent-Failure Writes

**Definition**: Write to database (`.insert()`, `.update()`, `.rpc()`) that doesn't check `.error` before showing success.

**Shape**: 
```js
sb.from('table').update({...});  // returns {data:null, error} on failure
// Code shows success toast WITHOUT checking error
toast.show('✓ Updated!');  // FALSE SUCCESS on write failure
```

**Real examples from this repo**:
- `approvals.html`'s extend/approve/revoke buttons showed "✓ EXTENDED +9:17 MINUTES" even when RPC call failed
- `complete_task()` RPC never actually inserted task completion rows (error was silently swallowed); authority scores never updated
- `member_presence` upserts have been silently failing on every page load, every 30 seconds, for every member
- `omega-onboard.js` never saved member's chosen sign/element/god (wrong field names sent, error never checked)
- GDPR export (`omega-export.js`) silently exported empty datasets (4 of 6 select queries had wrong column names)
- `social.html` updated the UI before checking if write succeeded; `family.html` gave no feedback on failure

**How to prevent**:
```js
const { data, error } = await sb.from('table').update({...});
if (error) {
  toast.show('❌ Could not update — try again');
  return;
}
toast.show('✓ Updated!');
```

**Checklist**:
- [ ] Every `.from()/.insert()/.update()/.upsert()/.rpc()` is captured as `{ data, error }`
- [ ] Every write checks `if (error)` and shows user-visible failure feedback
- [ ] Success toast is shown ONLY after error check returns false
- [ ] User can retry if write fails (don't advance flow on error)

---

### 3. RLS Policy Gaps

**Definition**: RLS policy allows writes/reads it shouldn't, via `WITH CHECK(true)` or missing owner-bypass where needed.

**Shape**:
```sql
-- BAD: Any authenticated member can insert anything
CREATE POLICY "allow_insert" ON table_name
FOR INSERT TO authenticated
WITH CHECK (true);  -- ← This is too permissive

-- GOOD: Only the user who owns the row can insert
CREATE POLICY "own_inserts" ON table_name
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
```

**Real examples from this repo**:
- `capability_kpi_log` INSERT was `WITH CHECK(true)` — any member could inject fake KPI metrics into owner's dashboard
- `threat_events` INSERT had no scoping to `user_id` — any member could frame another member on the owner's security dashboard
- `public.pending_access_requests` granted direct SELECT to all `authenticated` users, leaking every user's email and sign-in history
- `storage.objects` "uploads" bucket had no owner-bypass, blocking even owner from reading member documents
- 5 tables had RLS fully disabled (`rls_enabled = false`) — total lockout, but that's safer than too permissive

**How to prevent**:
```sql
-- For member-scoped tables:
CREATE POLICY "own_reads" ON table_name
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "own_writes" ON table_name
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add owner bypass if needed:
CREATE POLICY "owner_reads_all" ON table_name
FOR SELECT TO authenticated
USING (is_platform_owner());  -- ← Owner can see everything
```

**Checklist**:
- [ ] Table has RLS enabled (`rls_enabled = true`)
- [ ] Every FOR SELECT policy has a USING condition (not just `true`)
- [ ] Every FOR INSERT/UPDATE/DELETE policy has a WITH CHECK condition
- [ ] For user-scoped data, USING/WITH CHECK includes `auth.uid() = user_id` or similar
- [ ] For owner-only data, there's an `is_platform_owner()` check
- [ ] For public reads, condition is explicit (not `true`, but e.g., `is_published = true`)

---

### 4. Column-Name Mismatches

**Definition**: Code references a column that doesn't exist in the schema, causing silent-failure reads/writes.

**Shape**:
```js
// Code tries to read non-existent 'zodiac_sign'
const { data } = await sb.from('profiles')
  .select('zodiac_sign, display_name');  // ← zodiac_sign doesn't exist
// PostgREST returns {data: null, error}
// But if error isn't checked, code treats null as "no data" and falls back
```

**Real examples from this repo**:
- `omega-onboard.js` sent `olympian`, `agent_name`, `token_affinity` (real columns: `god`, `agent`, `token`)
- `profile.html`, `graph.html`, `nexus.html`, `sigma.html` tried to read `zodiac_sign` (real column: `sign`)
- `tribe.html` selected `authority_score` and `gate_level` (both computed client-side, never columns)
- `omega-export.js` GDPR export selected `agent_name`, `weight_applied`, `created_at` on wrong tables (real: `agent`, `points_earned`, `occurred_at`)
- `advertising.html` inserted `headline`, `body`, `company_name` (real: `title`, `description`, `company`)
- 30+ pages had property-name mismatches in this class

**How to prevent**:
- Before writing `.from('table').select()` or `.insert()`, check the live schema: `information_schema.columns`
- Match every field name against the real table definition
- Test with a real database call, not just reading code

**Checklist**:
- [ ] Are all column names in `.select()` real columns on that table?
- [ ] Are all field names in `.insert()` real columns?
- [ ] Did you check the live schema, or just assume from code?
- [ ] Is every field name spelled consistently (not `zodiac_sign` vs `sign` in different places)?
- [ ] If a field is computed, is it computed client-side, not assumed to be a column?

---

### 5. Module-Boundary Bugs

**Definition**: Inline `onclick=` handler calls a function that's declared only in `<script type="module">`, which is module-scoped and not accessible from the global inline context.

**Shape**:
```html
<!-- Global script: defines setTab -->
<script>
function setTab(name) { ... }
</script>

<!-- Module script: defines updateCard, NOT GLOBAL -->
<script type="module">
function updateCard() { ... }
</script>

<!-- This works (setTab is global): -->
<button onclick="setTab('general')">General Tab</button>

<!-- This BREAKS (updateCard is module-scoped): -->
<button onclick="updateCard()">Update</button>  <!-- ReferenceError: updateCard is not defined -->
```

**Real examples from this repo**:
- 26 pages had tab-switcher and action functions declared only in `<script type="module">`
- When users clicked the tab button, `onclick="setTab()"` threw `ReferenceError` in the browser console, silently
- Examples: `awards.html`, `beacon.html`, `feed.html`, `health.html`, `marketplace.html`, `publications.html`

**How to prevent**:
- If you use `<script type="module">`, expose any inline-handler functions to global scope
- Right after the function declaration:
```js
window.setTab = setTab;  // Now it's accessible to onclick= handlers
```
- OR declare the function in a non-module script instead

**Checklist**:
- [ ] Do any `<button onclick="func()">` or `<input onchange="func()">` handlers exist on this page?
- [ ] Is `func()` declared in a `<script type="module">` block?
- [ ] If yes, did you add `window.func = func;` to expose it globally?
- [ ] Test in real browser (not just reading code) — click the button and check console for `ReferenceError`

---

### 6. Unguarded RPCs

**Definition**: A public-callable RPC function (callable by unauthenticated or unprivileged users) lacks a privilege check, allowing unauthorized callers to invoke privileged operations.

**Shape**:
```sql
CREATE OR REPLACE FUNCTION grant_trial_access(p_uid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles SET trial_expires_at = NOW() + interval '557 seconds'
  WHERE id = p_uid;
END;
$$ LANGUAGE plpgsql;

-- No SECURITY DEFINER, no is_platform_owner() check
-- Any authenticated member can call:
sb.rpc('grant_trial_access', { p_uid: their_own_id })
-- and grant themselves trial access, bypassing the approval queue
```

**Real examples from this repo**:
- `grant_trial_access()` had zero authorization checks — any authenticated member could grant themselves trial access
- `record_health_metric()` accepted arbitrary good/bad request counts from any caller (resource exhaustion)
- `compute_leaderboard_snapshot()` accepted requests from any caller (compute exhaustion)

**How to prevent**:
```sql
CREATE OR REPLACE FUNCTION approve_member(p_uid uuid)
RETURNS void AS $$
BEGIN
  -- CHECK: Only owner can approve members
  IF NOT is_platform_owner() THEN
    RAISE EXCEPTION 'Only the owner can approve members';
  END IF;
  
  UPDATE profiles SET access_approved = true WHERE id = p_uid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Checklist**:
- [ ] Does the RPC do something privileged (modify auth-gated data, change RLS, etc.)?
- [ ] Does the RPC have an explicit privilege check (`if (!is_platform_owner()) throw`)?
- [ ] Is it marked `SECURITY DEFINER` if it needs elevated privileges?
- [ ] Is the check at the TOP of the function, before any mutations?
- [ ] Did you test calling it as an unprivileged user and confirm it fails?

---

### 7. Race Conditions

**Definition**: Two concurrent writes to the same row/table leave data in an inconsistent state (violated uniqueness, broken invariant, etc.).

**Shape**:
```js
// User clicks "Complete Task" twice in quick succession
POST /complete-task { task: "read-book", points: 10 }  // Request 1
POST /complete-task { task: "read-book", points: 10 }  // Request 2

// Both requests reach the database concurrently, both insert rows
// Result: task marked complete twice, user gets 20 points instead of 10
```

**Real examples from this repo**:
- `complete_task()` RPC had no deduplication — calling it twice with the same task would insert two rows
- No unique constraint on `(user_id, task_name)` — data integrity relied on client not retrying
- Members could upgrade their axis values twice in the same update call

**How to prevent**:
```sql
-- Add idempotency check:
CREATE UNIQUE INDEX task_completions_dedup
ON task_completions (user_id, task_name);

-- Or use a dedup key in the function:
CREATE OR REPLACE FUNCTION complete_task(p_user_id uuid, p_task_name text, ...)
RETURNS TABLE (...) AS $$
DECLARE
  v_completed_today boolean;
BEGIN
  SELECT COUNT(*) > 0 INTO v_completed_today
  FROM task_completions
  WHERE user_id = p_user_id AND task_name = p_task_name
  AND DATE(created_at) = CURRENT_DATE;
  
  IF v_completed_today THEN
    RETURN;  -- Already done today, skip
  END IF;
  
  -- Proceed with insertion only once
  INSERT INTO task_completions (...) VALUES (...);
END;
```

**Checklist**:
- [ ] Can this operation be called twice by accident (browser retry, user impatience)?
- [ ] Is there a dedup key or unique constraint?
- [ ] Does the function check "is this already done?" before mutating?
- [ ] Did you test the race: rapid double-click on the button, do you get one update or two?

---

### 8. Missing Edge Cases

**Definition**: Code doesn't handle failure paths ("what if this fails?"), leaving the system in a partially-updated or undefined state.

**Shape**:
```js
// Approve member: step 1 update profile, step 2 send email
const { error: err1 } = await sb.from('profiles').update({...});
await sendWelcomeEmail(user.email);  // What if this fails? Email never sent, but user thinks they're approved.

// Never checked whether email succeeded
// User has no way to know, no retry available
```

**Real examples from this repo**:
- `approvals.html` updated profile first, then called `post_dispatch()` RPC to notify — if RPC failed, member was approved but never notified
- Task completion updated axis values first, then inserted into task_completions — if insert failed, axis was already incremented (partial failure)
- Payment webhook handler updated subscription first, then sent confirmation email — if email failed, user thinks they're not subscribed but they are

**How to prevent**:
```js
// Wrap in a transaction-like block:
try {
  const { error: err1 } = await sb.from('profiles').update({...});
  if (err1) throw err1;
  
  const { error: err2 } = await sb.rpc('notify_member', {...});
  if (err2) throw err2;  // If any step fails, the whole operation fails
  
  toast.show('✓ Approved and notified');
} catch (error) {
  toast.show('❌ Approval failed — try again');
  // User can retry the whole operation, or admin can manually notify
}
```

**Checklist**:
- [ ] Does this operation have multiple steps (read, compute, write, notify)?
- [ ] What if step 1 succeeds but step 2 fails?
- [ ] Is there a try/catch wrapping all steps together?
- [ ] Does every step check `.error` before proceeding to the next?
- [ ] If any step fails, is the whole operation rolled back or flagged for retry?

---

## Domain-Specific Extensions

### type=auth (Privilege, Sessions, Tokens)

**Additional threat classes**:

1. **Privilege Escalation** — Unprivileged user gains higher privileges
   - Check: Is there an `is_platform_owner()` or `auth.uid()` guard in every decision point?
   - Check: Can a member spoof another member's identity (passing a `user_id` parameter)?

2. **Session Fixation** — Attacker hijacks a session by forcing a victim to use a known session ID
   - Check: Is session ID generated fresh every login, never reused?
   - Check: Is there a CSRF token on state-changing forms?

3. **Token Validation** — Expired or forged tokens accepted
   - Check: Does every RPC call verify `auth.uid()` is a real, active user?
   - Check: Is token expiration enforced (not just client-side)?

4. **Credential Handling** — Passwords, API keys, secrets exposed in logs, errors, or source
   - Check: Are secrets ever logged or shown in error messages?
   - Check: Are they stored hashed/encrypted, never in plain text?

### type=schema (Migrations, Constraints, Foreign Keys)

**Additional threat classes**:

1. **Migration Ordering** — Migrations apply in wrong order, causing conflicts
   - Check: Do you have a migration that creates a foreign key to a table defined later?
   - Check: Is the migration file numbered correctly so it runs in the right order?

2. **Constraint Conflicts** — Adding a NOT NULL column to a table with existing rows fails
   - Check: Did you provide a DEFAULT value for new NOT NULL columns?
   - Check: Is the backfill safe (no data loss)?

3. **Type Mismatches** — Foreign key references a column of different type
   - Check: Is `profiles.id` uuid but you reference it as `references(BigInt)`?
   - Check: Do all joins match the column types?

4. **RLS Per-Column** — RLS policy leaks sensitive columns (e.g., password_hash)
   - Check: Are all sensitive columns protected by RLS?
   - Check: Can a member read another member's email/phone via a JOIN?

5. **Foreign-Key Cascades** — Deleting a row cascades unexpectedly
   - Check: Is `ON DELETE CASCADE` used where you intend?
   - Check: Would deleting a user accidentally cascade to delete all their data?

### type=payments (Stripe, Idempotency, Webhooks)

**Additional threat classes**:

1. **Idempotency Keys** — Duplicate payment requests create multiple charges
   - Check: Does every Stripe API call include an `idempotency_key`?
   - Check: Is the key stable (same input always produces same key)?

2. **Webhook Signature Validation** — Forged webhook accepted
   - Check: Does webhook handler verify `Stripe-Signature` header?
   - Check: Is the secret stored securely (Supabase `secrets`, not in code)?

3. **PCI Concerns** — Card data stored where it shouldn't be
   - Check: Does the code ever touch raw card numbers (PAN)?
   - Check: Is all card handling delegated to Stripe (never stored locally)?

4. **Stripe Event Replay** — Old webhook event processed twice (e.g., `charge.succeeded` from a retried webhook)
   - Check: Is there a dedup check (idempotency key, event ID, timestamp)?
   - Check: Would processing the same event twice cause a double-charge?

5. **Subscription State Races** — Concurrent subscription updates (cancel, upgrade, downgrade) leave state inconsistent
   - Check: Is subscription state guarded by an `updated_at` timestamp or version number?
   - Check: Would canceling and upgrading simultaneously cause a refund+charge race?

---

## How to Use This Reference in Codex Reviews

When reviewing a decision:

1. **Read the PLAN.md threat surface section** — Which of the 8 classes apply?
2. **Cross-reference each class** — Does the approach actually address it?
3. **Check domain extensions** — If `type=auth`, also hunt for privilege escalation, session fixation, etc.
4. **Look for anti-patterns** — `.innerHTML`, `WITH CHECK(true)`, `.from().update()` without error checks, inline handlers in modules, etc.
5. **Ask "what if this fails?"** — Is there a fallback or rollback?
6. **Require concrete examples** — "We use `esc()`" is better than "We escape user data"

---

## Version History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-08-22 | Initial threat model: 8 base classes + 3 domain extensions |

---

## When to Update This Document

- New bug class discovered in production → Add to base model, bump Version
- Existing class is too vague → Clarify with new examples
- Domain extension misses a sub-class → Add sub-class with examples
