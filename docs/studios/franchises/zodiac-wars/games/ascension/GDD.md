# ZODIAC WARS: ASCENSION — Game Design Document (Draft 1, PROPOSED)

**Status: DESIGNED.** Nothing here is built, playable or released; Zodiac Wars content is not yet founder-approved. Written 2026-11-07 under the founder's
delegation. It separates the **full game** (a design target) from **Slice 0**, the smallest honest prototype this static, no-build repository can hold.
Multiplayer is **UNAVAILABLE**; "tactical multiplayer" is a later design target that needs server authority and is not scoped here.

## 1. Pillars
1. **Every power shows its cost before you pay it.** Aries' oath is "say the cost before the pour": each attack previews what it will spend.
2. **Your Shadow is a stance, not a second character** (canon, `docs/canon/zodiac-wars/BIBLE.md`). Pushing a House's strength past its limit swaps to the Shadow kit: it hits harder and cannot defend.
3. **Twelve Houses, twelve ways to hold the same power.** No House is a reskin of another.
4. **Readable and fair.** Frame data is visible; no hidden randomness in a duel; no loot boxes, no monetisation (payments are not live).
Audience 12+. No gore. The Knights are mortal apprentices, mediators and archivists, **not gold-armoured sign knights**; the Light rulers are the Olympians.

## 2. Core loop
TRIAL (a House's duel or skirmish) → CHOOSE (which stance to risk, which ally to call) → RESOLVE (the cost is paid, the Shadow stirs or does not) →
ASCEND (the twelve gates, read from `OmegaCanon`, never copied). The war is one argument told twelve ways: whose idea of sovereignty wins.

## 3. Combat rules (Slice 0 numbers; all tunable, none yet playtested)
| Rule | Value |
|---|---|
| Health | 100 per fighter |
| Light attack / heavy attack | 8 damage, 18 frames / 22 damage, 40 frames, 12-frame recovery |
| Guard | blocks 70% of damage while held; a perfect guard (first 6 frames) blocks 100% and opens the attacker for 20 frames |
| Overreach meter | +10 per hit dealt or taken, +25 for a heavy; 0 to 100 |
| Shadow stance | at 100 Overreach: 8 seconds, damage x1.5, guard disabled; then a 3-second stagger |
| Cost preview | before committing, an attack shows its spend (Aries: health; Libra: tempo) |
| Aries kit | pay up to 15 health to add that much damage to the next hit (the cost is shown first) |
| Libra kit | a counter that returns half the blocked damage and lowers the opponent's Overreach by 15 (the Balance Court, as a mechanic) |
Four **guardian assists** (Soul, Space, Void, The All) are one-use abilities that no House owns. The **Null** is an end encounter, not a roster fighter.

## 4. Technical architecture (what fits this repository)
- **No build step, no framework, no CDN** (CLAUDE.md §§4, 9). Classic scripts as static files, one page, added to `nav.js`.
- **Pure rules module in the Origins pattern:** `omega-zw-logic.js` (UMD so Node tests import it) holds every rule above as pure functions over plain data; the scene and UI never decide a result.
- **Fixed 60 Hz deterministic simulation**, rendered with interpolation, driven only by an input log and a seed, so any duel can be replayed in a test and compared frame by frame. This is also the precondition for rollback netcode later; it is built in now and **not claimed** as multiplayer.
- **Render:** Canvas 2-D with procedural vector fighters in Slice 0 (no third-party art, no downloaded assets); a WebGL2 or WebGPU renderer is a design target, feature-detected, never required.
- **Audio:** Web Audio synthesis; the 9.1717 Hz hum is a quiet sine under the arena. **Input:** keyboard, gamepad and touch with full remapping.
- **Accessibility:** no flashing above 3 Hz; Light and Shadow differ by shape and motion as well as colour; reduced motion honoured; every state has a text alternative.
- **Saves:** IndexedDB with a checksum and a versioned migration; every write checks its `.error` (CLAUDE.md §9).

## 5. Houses and progression
Twelve Houses unlock in sign order. A Knight's progress is the twelve gates (INITIATE to APEX), the last two (PRIME, APEX) held for the finale as the canon asks:
not the defeat of the Null, but a Light and its Shadow choosing to be the same god. Worlds and rulers come from the Worlds canon (`/worlds.html`), where only
Mars, Ceres and Neptune are repository canon and the rest are proposals.

## 6. Slice 0 (the first buildable thing)
One arena (the Ares Foundry floor, Mars), **two Houses (Aries: Kael Marren; Libra: Adaeze Okonkwo-Reyes)**, a training dummy, then one duel against the Aries Shadow
(The Unbled), who is drawn as an absence with an ember edge, not a molten body. Win by depleting health; lose by the same. Label **PROTOTYPE** until the criteria hold.
**Acceptance (all required before the label changes):** the rules module passes its Node tests including a 3-duel replay-equals-original check; a scripted bot
finishes the duel; 60 fps measured on a named mid-range device (not yet measured); every control reachable by keyboard and by touch; reduced motion verified.

## 7. What does not exist
No code, art, audio, roster, story script or build. The registry says CONCEPT for the series and films and DESIGNED only for this document.

## 8. Open questions for the founder
1. Accept the nine proposed worlds, the Shadows and the thirteenth seat (they decide the roster)?
2. Is Slice 0 right at two Houses, or should it be the three that reach the thirteenth seat first (Aries, Libra, Pisces)?
3. Is a tactical-multiplayer mode wanted at all, given it needs a server and moderation?
