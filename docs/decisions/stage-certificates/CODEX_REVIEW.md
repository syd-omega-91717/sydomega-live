# Review record

**No Codex review ran.** The repo's Codex GitHub bot answered "You have reached your Codex usage limits for code reviews" on #1602 and
#1604, and there is no Codex tool in this session. This file is therefore a **self-review**, not an adversarial one, and the plan stays
`AWAITING-HUMAN-REVIEW`.

## Self-review, round 1

- Could Phase 1 let a member obtain a certificate? Only through `omega_issue_certificate`, which is owner + aal2 + `is_owner=true`
  server-side (`20261007004000`, lines 7-20). Nothing client-side is trusted. Not verified against the live function body.
- Could the owner console be reached by a member and misused? A member can load the page and call the RPC; the RPC raises
  `owner_authorization_required`. The UI must show that error truthfully, not a success.
- Is the achievement id free text? It must be chosen from `omega_achievement_definitions` (RLS read) so a typo cannot be submitted.
- Open: whether `omega_issue_certificate`'s live body matches the migration (unchecked). Whether the legacy progression RPC is still
  self-attestable live (unchecked). Both need the canonical project; they do not change Phase 1, only how strongly Phase 2 is blocked.
