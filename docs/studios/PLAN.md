# Studios program — direction, canon reconciliation and plan (PROPOSED)

Status: **proposed under the founder's delegation, 2026-11-07, not approved.** Nothing here is released, streaming or
playable. This follows `docs/studios/DISCOVERY.md`.

## Decision on the three open questions

The founder recommended: one interconnected universe, hybrid production, movies, series and games together. Adopted, with three corrections:

1. **Scope: one universe, one franchise first.** All five franchises are registered, but only Zodiac Wars is written first, because it already has a bible. Writing five franchises in parallel produces five thin bibles and the contradictions the brief forbids.
2. **Style: "hybrid" means written canon plus procedural motion plus browser games.** Live action and photoreal CGI are outside what the repository can produce (see discovery). Those become production notes in each package, not features.
3. **Format: sequence, do not parallelise.** Screenplay, then series bible, then a game slice, because the game and the series both depend on the same character and house tables. Order: feature screenplay, season bible, game prototype.

## Reconciling the five franchises with the merged canon

PR #1187 anchored seven franchises to the 12-chapter saga. The new list is not additive, so this is the proposed mapping:

| New franchise | Maps to merged canon | Notes |
|---|---|---|
| Myth of the Stones | Myth of the Stones (ch. 5 + prehistory), The Sorcerer Reborn as a spin-off | **Conflict:** "seven primordial forces" vs the nine elements in `omega-canon.json`. Proposal: seven Stones, with Sand the first to hold the frequency (`media.html`), living inside the nine-element system. Founder to confirm. |
| Zodiac Wars | Zodiac Wars (ch. 1); Wrath of the Gods as its middle era (ch. 2–4) | **Conflicts:** (a) "The Twelve Houses" is already the live series title; (b) Orion is not one of the twelve signs; (c) the founder's earlier text says one feature film, this slate says four. |
| The Omega Chronicles | The Omega Saga + Post-Human Mind (ch. 8–12) | |
| The Lost Civilizations | Aethelgard Universe (ch. 7) plus prehistory | |
| The Last Galactic Empire | New. Anchored at saga ch. 11, where the frequency is detected in seven other civilisations | Needs a place in the chronology; ch. 11 is the natural hook. |

## Proposed first milestone

**Zodiac Wars — feature "The Rise of Aries"** (chapter 1, Kael Marren, Fire). Deliverables in order:

1. Treatment and three-act structure.
2. Full screenplay, written act by act in separate PRs so each can be reviewed.
3. Season-1 bible for the 10-episode limited series.
4. A small browser tactical-combat prototype ("Zodiac Wars: Ascension", two houses), local-only, labelled PROTOTYPE.
5. Only then: a procedural trailer cut through the existing renderer, labelled as such.

"The Fall of Orion" is held until the founder says who Orion is.

## Status vocabulary

The brief asks for LIVE, PUBLISHED, IN_PRODUCTION, PREVIEW, PROTOTYPE, SIMULATED, UNAVAILABLE. The repo's current vocabulary is CONCEPT / IN DEVELOPMENT / IN PRODUCTION / RELEASED, with an evidence rule. Proposal: keep that rule, add PROTOTYPE and SIMULATED, and require a file path in `evidence` for anything past CONCEPT. Not yet implemented.

## Database (Phase 8) — not started on purpose

Merging a migration to `main` applies it to production within about a minute (CLAUDE.md §8.2), and the connector cannot read the live database. So: reuse `media_items`, `character_records`, `content_versions` and `omega_media_jobs` first, and write any new migration dormant behind a `platform_settings` flag, reviewed before merge. Watch counts, revenue and progress stay uninvented.

## Remaining-work register

| # | Item | Blocked on |
|---|---|---|
| 1 | Approve the franchise mapping and the four conflicts above | Founder |
| 2 | Feature screenplay, acts 1–3 | Approval of item 1 |
| 3 | Season-1 bible | Item 2 |
| 4 | Game prototype | Items 2–3 (character table) |
| 5 | Rights and licence records | Founder / counsel |
| 6 | Real video, voice, score | People and licences outside this repo |
| 7 | Subtitles, adaptive streaming, large-file storage | Storage inspection (no connector access) |
| 8 | Schema for screenplays, seasons, game versions | Review before any merge |
