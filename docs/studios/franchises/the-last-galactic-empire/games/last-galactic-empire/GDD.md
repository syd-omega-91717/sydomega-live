# LAST GALACTIC EMPIRE — Game Design Document (Draft 1, PROPOSED)

**Status: DESIGNED.** Nothing here is built, playable or released. Written 2026-11-07 under the founder's delegation. A design target (a grand-strategy game with fleet combat)
is kept apart from **Slice 0**, the smallest honest prototype for a static, no-build repository. The brief's "multiplayer campaigns" is **UNAVAILABLE**: it needs server authority, anti-cheat and moderation and is not scoped.

## 1. Pillars
1. **The institution is the enemy you build.** The empire was founded to stop endless war and becomes what it was made to prevent; the player feels that happen through a Drift meter.
2. **Every outcome is explainable.** Battle math and AI decisions are shown with their reasons.
3. **Order has a price in freedom, and freedom has a price in war.** No law is free.
4. **Scale you can read.** Long horizontal hulls, planetary backdrops; each faction has its own beam colour so a battle reads at a glance.
Audience 12+; no gore; no monetisation.

## 2. Core loop (one turn is one season)
SURVEY (systems, supply, Drift) → DECREE (laws in the Charter) → COMMAND (move fleets, set doctrine) → RESOLVE (battles, events, Drift) → REFORM or HARDEN.
Factions in the franchise canon: the Imperial Court (Emperor Aethon IV; Admiral Threx), the Reformers (Princess Seraya), the Independent Worlds (Juno Ardent), Strategist Kaelen Voss as an advisor role.
The empire's capital is not named in canon (OPEN in the Worlds canon); Slice 0 shows it as "The imperial capital".

## 3. Systems
| System | Rule (Slice 0, untested) |
|---|---|
| Map | a graph of 20 systems with supply links; a fleet beyond supply loses 10% readiness a turn |
| Drift | rises 2 a turn with each standing law and each unanswered grievance; at 100 the Court hardens into the thing it fought (a story state, not a game over) |
| Charter | six laws, each trading Order for Freedom, each with a visible long-term cost |
| Battle | a transparent resolver: strength x doctrine x supply, with a visible breakdown; the player can see why they won |
| AI | utility scoring over a few named goals; every move writes a one-line reason to a log the player can open |

## 4. Technical architecture (what fits this repository)
- **No build step, no framework, no CDN.** Plain scripts as static files, added to `nav.js`; art is procedural.
- **Deterministic simulation in a Web Worker**, seeded, typed arrays; a **pure battle resolver** and pure turn step in a UMD module that Node tests import, including replay-equals-original checks.
- **Render:** Canvas 2-D system map in Slice 0, instanced WebGL2 for fleet sprites as a target; a WebGPU compute path for very large battles is a design target behind feature detection, never required.
- **Saves:** IndexedDB with checksum; writes check `.error`. **Accessibility:** text equivalents for every map state, keyboard play, colour plus shape per faction, reduced motion honoured.

## 5. Slice 0
Twenty systems, three factions, one war, forty turns. Win by a stable peace with Drift under 60, or by a reform that dissolves the Court's veto. **Acceptance:** Node tests for the resolver
(known-answer battles), determinism (same seed, same forty turns), and Drift arithmetic; a scripted bot finishes a campaign; map render measured on a named device. PROTOTYPE until then.

## 6. What does not exist
No code, art, audio, campaign or build. The series (Galactic Thrones) and films are CONCEPT.

## 7. Open questions for the founder
1. Name the empire's capital and its world.
2. Should the player be able to play the Reformers or the Independent Worlds, or only the Court?
3. Is "Drift reaches 100" a lose state or a different story?
