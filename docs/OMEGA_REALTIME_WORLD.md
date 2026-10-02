# Ω SYD OMEGA 91717 — Realtime World

## Purpose

Turn the World from a route map into a genuinely live surface without weakening member privacy.

## Live mechanism

The World uses Supabase Realtime Presence on the ephemeral channel:

omega-world-presence

The client tracks:
- current route;
- timestamp;
- World mode.

The UI derives the number of connected presence keys from the channel's presence state.

## Privacy boundary

The persistent public.member_presence table remains self-readable only.

No policy is broadened to expose other members' database rows.

The temporary database-publication experiment was explicitly reverted. The repository retains both migration records so the live migration history remains truthful.

## Reality labels

- LIVE: the authenticated client has a subscribed Presence channel and receives a presence state.
- UNAVAILABLE: authentication, subscription, timeout, or channel initialization failed.
- The count is ephemeral connected-session presence, not a member directory.

## Non-authority rule

Realtime presence does not prove:
- identity;
- KYC;
- ownership;
- authorization;
- achievement;
- financial activity;
- message delivery;
- business correctness.

## Failure behavior

A failed channel never produces a fabricated count. The UI shows UNAVAILABLE and retains the rest of the World surface.

## Architecture

AUTHENTICATED SESSION
→ REALTIME PRESENCE CHANNEL
→ PRESENCE STATE
→ CONNECTED SESSION COUNT
→ WORLD HUD

Persistent evidence remains on the Event Fabric / Evidence Graph / Mission State paths.
