---
name: subscriber-portal
description: Surfaces an already-built, human-approved feature inside the real subscriber-facing UI (dashboard/hub pages, existing tier and notification systems) — only once a human has decided to turn its platform_settings flag on. Use after autonomous-coder has shipped a dormant feature and the owner is ready to expose it.
---

# SUBSCRIBER PORTAL

## What this is

This repo's real subscriber system is: `profiles.access_approved`
(pending/approved gate — `pending.html`/`approvals.html`), `profiles.
membership_tier` (integer 1–9, cascading unlocks via
`OmegaCanon.tierUnlocks()`/`tierRequiredFor()` in `omega-canon.js`), and
`profiles.is_owner` (elevated access). There is no separate "verified
subscriber portal" route, no Prisma-backed dashboard app, and no
certificate-of-appreciation system beyond what `honors.html`/
`trophies.html`/`achievements.html` already implement — use those, don't
invent parallel ones.

**Do not run this skill to expose a feature whose `platform_settings` flag
is still `false`.** That flag flip is the human decision point
(`CLAUDE.md` §9); this skill's job is to make an *already-approved*
feature visible and usable, not to decide it's ready.

## Steps

1. **Confirm the gate is actually on.** Check the live
   `platform_settings` value (or, if no DB access, ask the user to
   confirm) before rendering anything as unlocked. If it's still `false`,
   stop and say so — don't build a preview that implies otherwise.

2. **Place it where members already look.** Add the widget/KPI/card to
   the real hub page for its domain (`dashboard.html` for
   cross-cutting stuff, or the specific hub — `vault.html` for
   finance/tokens, `honors.html`/`trophies.html` for
   progression/achievements, `intelligence.html`/`analytics.html` for
   data views) using the existing `.card`/`.kpi`/`.tbl-*` classes — not a
   new page unless `feature-architect`'s blueprint called for one.

3. **Gate it by tier using the real mechanism.** Client-side, check
   `OmegaCanon.tierUnlocks(profile.membership_tier, 'featureKey')`. When
   `false`, render the existing "locked" convention for that page
   (dimmed card / upgrade prompt referencing
   `OmegaCanon.tierRequiredFor('featureKey')`) rather than hiding the
   feature outright — members should see what a higher tier unlocks, the
   way the rest of the tier system already works. When `true`, render the
   real control.

4. **Log real usage, don't invent a new activity system.** If the feature
   should notify the member or log an event, insert into
   `public.notifications` (verified live and already read by
   `omega-notify.js` platform-wide — see `CLAUDE.md` §8) or
   `public.member_events` if it's a general activity-feed item
   (`events.html` already writes here), rather than creating a new table
   for this purpose. If the feature contributes to axis/authority
   progress, call the real `complete_task()` RPC with its actual current
   signature (`p_task_name, p_task_type, p_axis_type, p_description,
   p_points` — confirmed live per `CLAUDE.md` §8) instead of guessing at
   parameter names, a mistake this repo has hit for real across 5 call
   sites before.

5. **Check for silent failures.** Every write (`.insert`/`.update`/`.rpc`)
   must check `.error` and surface a real failure to the user — this repo
   has shipped silent-failure bugs before (`social.html`, `family.html`,
   the `extend_trial` RPC) specifically from skipping this. Don't repeat
   the pattern.

6. **Escape anything member-writable before rendering it.** If the widget
   renders any field a member (not just the owner) can set — display
   name, free-text notes, etc. — use the repo's existing `esc()` helper
   convention (see `approvals.html`/`profile.html`/`contracts.html`) via
   `.textContent` or explicit escaping, never raw `.innerHTML` — this repo
   has had a real stored-XSS bug from skipping this exact step
   (`CLAUDE.md` §8).

7. **Verify** the same way `autonomous-coder` does: `node --check` on
   anything touched, `python3 scripts/audit.py`, broken-asset check.

## Guardrails

- Never render a feature as "unlocked" for a tier/flag state that
  doesn't actually grant it — that's a security-relevant UI bug, not a
  cosmetic one, on a platform whose RLS is the real boundary but whose UI
  should not misrepresent state either.
- Never build a competing progression/certificate/notification system
  when `omega-canon.js`/`notifications`/`honors.html` already do that
  job — extend, don't fork.
- Same commit/branch/no-auto-merge rules as `autonomous-coder`.
