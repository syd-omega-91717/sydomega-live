# Ω SYD OMEGA 91717 — Achievement Evidence Chain

## Purpose

Connect existing persisted progression and achievement surfaces without creating a duplicate achievement database.

## Live authorities

- `public.evolution_events` — persisted evolution history.
- `public.task_completions` — persisted completed-task evidence.
- `public.trophies` — persisted trophy rows.
- `public.medals` — persisted medal rows.
- `public.certificates` — persisted certificate rows.
- `public.user_assets` — existing asset inventory; current live policy exposes SELECT only.

## Chain

`EVENT → TASK → VERIFICATION → ACHIEVEMENT → INVENTORY → WORLD`

The World presentation reads these records under existing member RLS. It does not mint achievements, modify progression, grant credentials, or assign ownership.

## Reality labels

- `LIVE` — read from live Supabase tables for the authenticated member.
- `NOT-YET-EVIDENCED` — insufficient persisted evidence.
- `UNAVAILABLE` — signed out or evidence read failed.

## Critical boundary

Existing trophy/medal/certificate rows prove that records exist. They are not independently treated as proof that the underlying award rule was correctly executed. Rule verification remains a separate control.

Repository artwork in Legacy Constellation is source material and never becomes an earned achievement merely because it is displayed.

## Inventory decision

The bridge does not write `user_assets`. The current live policy exposes SELECT only, and no verified award-to-asset rule exists in the current source/live contract. A future inventory implementation must define the authoritative rule, write authorization, audit trail, idempotency, and live verification first.

## Acceptance criteria

1. Signed-out users see `UNAVAILABLE`.
2. Authenticated users see only rows permitted by RLS.
3. No client-side achievement is minted.
4. No source artwork is interpreted as earned.
5. No financial, ownership, credential, or authorization claim is inferred.
6. Trophy, Credentials, and Evolution remain the destination surfaces for their respective domains.
