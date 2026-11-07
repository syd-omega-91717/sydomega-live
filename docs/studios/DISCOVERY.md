# Ω SYD OMEGA 91717 STUDIOS — repository discovery (2026-11-07)

Phase 1 of the Studios program. Everything below was read from the repository at `main` (`119b4bab`); nothing was changed.
The live database was not queried (the Supabase connector has no permission on `ydqhzvvoyufiiqvzcjns`), so table lists
come from `supabase/live-schema.json`, a dated snapshot.

## What already exists

| Area | Evidence | State |
|---|---|---|
| Media hub | `media.html` (universes I–VII, 12-chapter saga `FILMS`, `SERIES`, `GAMES` arrays) | Descriptive. Marks chapter 1 IN PRODUCTION without evidence. |
| Movies page | `movies.html`, 13 `<video>` elements, `assets/movies/franchise-01..12.mp4` (12 s, ~1.4 MB each, 19 MB total) | **Procedural loop clips**, not films. Rendered by `scripts/movies/render.js` from `scene.html` with a synthesized drone for audio. |
| Series player | `series.html` plays THE TWELVE HOUSES S1: 12 vertical episodes, `assets/series/houses-s1-ep01..12.mp4` (20 s each, 15 MB total), script in `assets/series/twelve-houses-s1.json` (title, sign, guide, god, element, voice line, plot, cliffhanger) | **Working playback of micro-episodes** with resume state (`localStorage omega_houses_s1`). Each episode is a one-line plot, not a screenplay. |
| Slate and canon | `universe.html` SLATE tab, `config/omega-franchise-slate.json`, `config/omega-universe-canon.json`, `docs/canon/UNIVERSE.md`, `docs/canon/zodiac-wars/BIBLE.md` | CONCEPT / PROPOSED (PR #1187). |
| Other pages | `cinema.html`, `trailers.html`, `studio.html` (reads `publications`), `creation-studio.html`, `project-studio.html`, `characters.html`, `gaming.html` (144-game progress tracker, reads `task_completions`), `forge.html` (FORGE TRIALS), `arena.html` | None plays an original game. `gaming.html` tracks goals; it does not run games. |
| Backend reuse | `supabase/live-schema.json` (288 relations) has `media_items`, `character_records`, `content_versions`, `omega_media_jobs`, `media_reservations`, `content_recommendations`; migration `20261002090727_media_job_worker` adds `claim_media_jobs` | Reuse before adding. No table for screenplays, seasons, game versions, rights or watchlists. |
| Navigation | `nav.js` MEDIA section: media, cinema, movies, characters, series, trailers, universe | Studios pages are reachable; a new page needs a `PS` entry and a `SECTIONS` entry (CLAUDE.md §9). |
| Large video | no `.m3u8`, no `.vtt`; only short MP4s plus `SYDOMEGA91717_DEMOD-1-.mp4` at the root | No adaptive streaming, no subtitles, no audio tracks beyond the baked-in drone. |

## What does not exist

- A screenplay for any film or episode. The only story text is one-liners in `twelve-houses-s1.json` and the draft Zodiac Wars bible.
- A playable original game. No game build, no game state, no save format.
- Any real footage, voice, score or licensed rights record.
- Media storage policy for large files (Storage buckets were not inspectable), subtitles, rights/licence records, publication workflow.

## Consequences for the brief

1. "Hybrid live action / CGI" is not producible here. What this repository can produce is **written material, procedural motion, and browser-playable prototypes**. Live action needs people, cameras and licences outside this codebase.
2. The first publishable "movie" in this stack is a short procedural film or a motion-comic cut, labelled as such, not a feature.
3. Multiplayer, civilization simulation and fleet warfare need a real-time server, moderation and abuse handling the platform does not have. They stay UNAVAILABLE until that exists.
