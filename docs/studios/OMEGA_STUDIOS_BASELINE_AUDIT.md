# Ω STUDIOS — baseline audit (Phase A), 2026-11-07

Read from `main` after PRs #1187-#1189. This extends `docs/studios/DISCOVERY.md` (kept, not duplicated) with the checks the
master brief asked for. The live database and Storage were **not** inspected: the Supabase connector has no permission on
`ydqhzvvoyufiiqvzcjns`, so tables come from `supabase/live-schema.json`, a dated snapshot.

## Pages the brief proposes, against what exists

| Proposed route | Exists? | Reuse |
|---|---|---|
| `/studios.html` | No (`studio.html` exists and reads `publications`) | Extend `studio.html`; do not add a near-duplicate |
| `/cinematic-universe.html` | No | `universe.html` (SLATE tab) and `media.html` already cover the catalogue |
| `/movies.html` | Yes, 12 procedural loop clips | Extend |
| `/series.html` | Yes, plays THE TWELVE HOUSES S1 | Extend |
| `/episodes.html` | No | The player lives inside `series.html` |
| `/franchises.html` | No (`factions.html` is the twelve Houses) | New, or a tab on `universe.html` |
| `/characters.html` | Yes | Extend; `config/page-character-manifest.json` is a separate concern (page characters) |
| `/worlds.html` | No | `realms`/`realm` pages exist for platform worlds |
| `/games.html` | No (`gaming.html` tracks 144 goals) | Extend `gaming.html` |
| `/production.html` | No | `creation-studio.html`, `project-studio.html` exist |

Any new page must be added to `nav.js` (`PS` map and a `SECTIONS` entry) and pass `reachability-contract.py` (CLAUDE.md §9).

## Assets that exist and must be preserved

- `assets/movies/franchise-01..12` (.mp4 12 s, .jpg, .webp), 19 MB: procedural loops from `scripts/movies/render.js`.
- `assets/series/houses-s1-ep01..12` (.mp4 20 s, .jpg) and `twelve-houses-s1.json`, 15 MB.
- `assets/concept/` boards, medallion and six `reel-0N.mp4` clips.
- `SYDOMEGA91717_DEMOD-1-.mp4` at the repo root and in `public/` (a build artefact; never commit `public/`).
- No subtitle files (.vtt), no streaming manifests (.m3u8), no soundtrack files, no game builds.

## Backend that exists

From the snapshot: `media_items`, `character_records`, `content_versions`, `omega_media_jobs`, `media_reservations`,
`content_recommendations`; migration `20261002090727_media_job_worker` adds the `claim_media_jobs` RPC. None of the 17
`studio_*` tables in the brief exist. Storage buckets and policies could not be read.

## Constraints that bind the plan

1. Merging to `main` deploys, and a merged migration is applied to production within about a minute (CLAUDE.md §8.2). Studio tables are therefore written dormant behind a `platform_settings` flag and reviewed before merge.
2. There is no build step and no framework (CLAUDE.md §9). Game prototypes are plain JS modules on `<canvas>`.
3. Multiplayer needs a real-time server and moderation that do not exist; it stays UNAVAILABLE.
4. Third-party artwork supplied as references is not licensed for this repo (see `canon/VISUAL_REFERENCES.md`).

## What this wave added

`config/omega-studio-registry.json` (seven franchises, 46 characters, 15 recorded conflicts), `scripts/studio-canon-check.py`
and its tests, seven generated franchise bibles, the universe bible, and the master status register.
