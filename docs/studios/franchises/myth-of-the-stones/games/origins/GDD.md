# MYTH OF THE STONES: ORIGINS — Game Design Document (Draft 1, PROPOSED)

**Status: DESIGNED.** Nothing here is built, playable or released. This document defines the game and, more importantly, the
**smallest honest slice that can be built in this repository**. Written 2026-11-07 under the founder's delegation, after the
founder approved the story of *The Seven Stones*. The brief's "third-person open-world action RPG" is a multi-year, multi-person
product; it cannot be made inside a static, no-build, framework-free site. This GDD therefore specifies two things and keeps them
apart: the **full game** (a design target) and the **Vertical Slice 0** (a browser prototype that is explicitly a PROTOTYPE).

## 1. Vision, pillars, audience
Become a guardian, learn what the seven stones really are, and decide who gets to hold them. Audience 12+; no gore; no monetisation.
Pillars:
1. **No one hand holds the whole.** Power is shared: the best moves need a second source (an ally, a lock's second key, a second stone).
2. **Memory has a price.** Reading the past hurts; the game tracks "Weight", not just health.
3. **Choices are kept.** Decisions persist in the save and change quests, factions and the ending.
4. **Readable action.** Combat is learnable in minutes and deep after hours.

## 2. Core loop
EXPLORE (regions, temples, ruins) → INVESTIGATE (records, artifacts, memory-reads) → CHOOSE (consequential decisions) → FIGHT
(enemies, guardians, bosses) → EVOLVE (abilities, gear, reputation, world state). One loop minute to minute; one region arc per hour.

## 3. Technical architecture (what actually fits this repository)
- **No build step, no framework, no CDN** (CLAUDE.md §§4, 9). Classic scripts served as static files, loaded by one page.
- **3-D third-person for Vertical Slice 0 (decision of 2026-11-07, replacing the earlier 2-D plan).** Real-time geometry on the vendored three.js r160 (`/vendor/three.module.js`, the same dynamic import `omega-sculpture.js` uses): low-poly flat-shaded terrain, a physically lit shrine, instanced trees and rocks, bloom-free but PMREM-lit materials, ACES tone mapping, a follow camera. If WebGL is missing the page says so; there is no 2-D fallback game.
- **Layout (built):** `game-origins.html` (page and CSS), `omega-origins-logic.js` (all rules as pure functions, UMD so Node can test them: damage, level curve, inventory, quest chain, enemy state machine, save serialise/migrate/checksum), `omega-origins-scene.js` (three.js world), `omega-origins-game.js` (loop, input, combat, AI, quest flow, saves), `omega-origins-ui.js` (HUD, touch controls, sheets), `omega-origins-audio.js` (synthesised sound).
- **Page contract:** loads `bg.js`; added to `nav.js` (`PS` and `SECTIONS`); no inline event handlers (CSP ratchet); every Supabase write checks `.error` (CLAUDE.md §9); reduced-motion honoured.
- **Art and audio are original and procedural.** Every mesh is built in code from primitives; sound is synthesised with the Web Audio API (the 9.1717 Hz hum as a quiet sine under the soundscape). No third-party artwork or sound is copied (see `docs/studios/canon/VISUAL_REFERENCES.md`).
- **Time step:** fixed 60 Hz simulation, render interpolated; deterministic given a seed so tests can replay a fight.

## 4. Playable characters
| Character | Role | Stone affinity | In Slice 0 |
|---|---|---|---|
| Auren Vale | Hero, Memory-reader | Memory | Yes |
| Lyra Thorne | Scholar, support | Matter | Later |
| Torin Draven | Warden, tank | Energy | Later |
| Seraphine | Keeper, controller | Consciousness | Later |
Character creation (brief): the player chooses a **name, a look from six original presets and a starting aspect** (the aspect picks the first ability tree). Auren is the story character; the created guardian is the player's own, a member of Ithren's order in a separate campaign thread.

## 5. World: five regions
| Region | Gameplay | Notes |
|---|---|---|
| The Forgotten Valley | Exploration, introductory missions | Slice 0 lives here |
| The Kingdom of Ash | Combat, survival | Self-rebuilding ash city; hazard: Creation drift |
| The Crystal Depths | Puzzles, ancient technology | Two-key locks; living crystal |
| The Guardian Citadel | Faction and character missions | Hub; the Lamp as narrator of records |
| The Eternal Temple | Final campaign, bosses | Ties to the film's end |
World size target for the full game: five regions of about 2 km² each (design number, not a promise). Slice 0: one valley map of 64 x 64 tiles.

## 6. Missions
Main quest, five acts, one per region: (1) *The Hum*: find the source of 9.1717 Hz. (2) *Ash*: cross Karth Vael. (3) *Two Hands*: open a lattice lock with an ally. (4) *The Records*: decide what the Citadel's truth is worth. (5) *The Release*: seven stones, seven hands.
**Slice 0 quest — "The Hum in the Valley":** the player hears a note, follows it across the valley to a ruined shrine, defeats the wardens of the shrine (a short combat encounter) and then the boss, reads the memory held in the shrine's stone, and makes one choice: *keep the reading* (power now, Weight rises) or *share it with the valley's keeper* (a second key; Weight falls; an ally joins). Objectives: reach the shrine; survive the encounter; defeat the boss; make the choice. Rewards: the first Memory ability, one artifact, 100 XP.
Side quests (design): find lost relics; settle a dispute between two villages (a mediation mechanic); escort a researcher through a time-slip.

## 7. Combat
Real-time. Light and heavy attacks, dodge with i-frames, block with stamina, one stone ability on a cooldown. Damage = base x (1 + gear) minus mitigation, floored at 1; crit chance from Balance-tree nodes. Enemy archetypes: Ash Wraith (melee swarm), Echo Archer (ranged), Lattice Sentry (shielded, must be flanked), Hollow (slow, hits hard). **Slice 0 boss: The Unfinished Guardian**, a construct left from the first experiment, three phases: (1) slow slams telegraphed by a ring, (2) summons two Sentries, (3) enraged, shorter telegraphs. It can be beaten by timing or by using the second-key mechanic when the ally is present.
**Weight** (Memory cost): reading memories raises Weight; at high Weight, dodges are slower and ability cooldowns grow; resting at a shrine or sharing a reading lowers it.

## 8. The seven ability trees
| Stone | Tree | Sample abilities (design) |
|---|---|---|
| Memory | Recall | Echo (replays your last attack), Foresight (shows enemy telegraph early) |
| Time | Tempo | Slow field, Stutter dodge |
| Energy | Surge | Chain bolt, Overcharge |
| Matter | Form | Stone skin, Shaped barrier |
| Creation | Weave | Summon ally construct, Mend |
| Consciousness | Focus | Mark target, Link allies |
| Balance | Poise | Counter window, Reflect |
Each tree has 12 nodes in three tiers; a character may commit to at most two trees, enforcing the "no one hand holds the whole" pillar. Slice 0 includes only the first tier (4 nodes) of Recall.

## 9. Inventory and equipment
Slots: weapon, armour, charm, two consumables, artifact. Item classes: weapons, armour, charms, consumables, artifacts, quest items. Weight limit replaced by a 24-slot grid (no encumbrance). Artifacts are collectibles with a lore entry each (the codex). Slice 0: 12 inventory slots, 6 items.

## 10. Progression and economy
XP from quests and defeating enemies; levels 1-30 in the full game, 1-5 in Slice 0; one skill point per level; faction reputation (Citadel, Valley Keepers, Reunion) from -100 to 100. Currency: **one soft currency (Tithes)** earned in play and spent in play. **There is no real-money purchase, no payment, no loot box and no connection to `tokens_enabled`** (which is false); rewards are never member-facing tokens. Do not invent achievements or leaderboards from nothing: each is defined here before it exists.

## 11. AI behaviour
Enemies use a small finite-state machine: Idle, Patrol, Alert, Chase, Attack, Retreat, Stunned. Group rule: at most two enemies attack at once; the rest circle (readability). Boss uses a scripted phase table. NPCs: three-slot daily schedules (design). All randomness is seeded for replay tests.

## 12. Save and load
- **Slice 0 saves to the browser only:** versioned JSON in `localStorage` (try/catch around every access; the game must run if storage is blocked), three slots plus an autosave at checkpoints. A `saveVersion` and a migration function, and a short checksum to detect hand-edits (not a security measure).
- **State saved:** player stats, inventory, ability nodes, quest flags, world flags, Weight, reputation, position.
- **Server persistence is a later, separate milestone.** It needs a table (proposed `studio_game_saves`, owner-only RLS, a flag in `platform_settings`, dormant) reviewed before any migration merges (a merged migration reaches production, CLAUDE.md §8.2). It is **not** created here.

## 13. Accessibility
Remappable keys and gamepad; hold-to-toggle options; three difficulty presets plus sliders (enemy damage, telegraph length, Weight rate); reduced motion and screen-shake off; colour-blind-safe palette with shape cues (not colour alone); subtitles for all speech; focus order and text labels on menus; pause anywhere. Meets the repo's 3:1 contrast floor (4.5:1 for body text).

## 14. Audio and visual direction
Dark cinematic fantasy with Omega gold (`#C9A84C`), cyan (`#00E5FF`) and void (`#0A0A0F`), violet for the Myth accent. Each stone is a distinct **material**, not a coloured gem (grey water-glass, amber, brick, green glass, rose-gold, clear, cobalt) set in cradles; they must not be shown floating around an altar (guardrail from the reference note). Audio: ambient bed, 9.1717 Hz hum under each region, seven pure notes at the release moment.

## 15. Performance
Targets: 60 fps on a mid-range phone at 4x CPU throttle; first interaction under 3 s; total Slice 0 assets under 2 MB; no layout reads in the frame loop. Measured with the repo's profiling method (V8 profiler over CDP, 390 px mobile) with a noise floor, per CLAUDE.md §8.4.

## 16. Multiplayer
**UNAVAILABLE.** It needs a real-time server, matchmaking, moderation and abuse handling that do not exist. If pursued it is a separate, independently tested milestone with its own design document. Not promised anywhere in the UI.

## 17. Vertical Slice 0 (what to build first)
Forgotten Valley (64 x 64 tiles), one playable character (Auren), one complete quest ("The Hum in the Valley"), one combat encounter, one boss, 12-slot inventory with 6 items, XP levels 1-5, four Recall nodes, one choice, localStorage saving with three slots, the Weight meter, keyboard and touch controls, accessibility options in section 13. **Status when built: PROTOTYPE**, never "playable game", until the release criteria below are met.

## 18. Testing and release criteria
| Rung | Meaning | Evidence required |
|---|---|---|
| DESIGNED | This document | The file exists |
| PROTOTYPE | A build runs in a browser | The page loads, `node --check` passes, a headless render shows the first frame |
| PLAYABLE_SLICE | Slice 0 can be finished start to finish | A recorded run, unit tests for combat, inventory and save migration, a save/reload test, accessibility checks, 4x-throttle performance numbers |
| RELEASED | Members can reach it from navigation | Everything above, plus review, preview inspection and an explicit founder go-ahead |
Pure systems (damage, loot rolls, level curve, save migration, FSM transitions) are written as functions and tested with seeded replays.

## 19. Risks and honest estimate
The slice is built (see section 18) but has only been run by a scripted bot in headless Chromium on software rendering; the full open-world game is years of work. The biggest risks are art volume (every mesh here is primitive geometry, far below the mood references), combat feel and balance, which only human play-testing can settle, and real-device performance, which is unmeasured. No person has play-tested it.

## 20. Open questions for the founder
1. (Answered by delegation, 2026-11-07: the first prototype is 3-D.) Is the primitive-geometry art direction acceptable for the slice, or should it wait for authored models?
2. Should the player-created guardian be in Slice 0 or later?
3. Is browser-only saving acceptable for the first release, with server saves later?
