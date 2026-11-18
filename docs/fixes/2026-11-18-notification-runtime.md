# Notification runtime reliability improvement

Date: 2026-11-18

## Implemented

- Replaced an unbounded interval-per-population-event pattern with one guarded, recursive 30-second scheduler.
- Polling is single-flight; slow Supabase responses cannot overlap and create request pressure.
- Hidden tabs stop polling; returning to a visible tab triggers a fresh poll.
- Notification badge is a native button with a descriptive accessible name and dialog relationship.
- Notification panel focuses its close control on open, closes on Escape, and returns focus to the badge.

## Safety boundaries

- No notification content, recipient, RLS policy, database function, trigger, external provider or delivery channel changed.
- Existing server-owned notification writes and escaped text rendering are preserved.
- No polling while the document is hidden; no new dependencies.

## Verification and estimate

- New static regression tests: `scripts/tests/test_omega_notification_runtime.py`.
- Full repository contracts and Cloudflare preview checks required.
- Browser QA: signed-in, signed-out, unread/zero state, repeated `omega:populated`, tab hide/show, Escape, keyboard focus and 375px/768px/desktop.
- Estimated engineering: 0.5 day implementation + 0.5 day verification.
