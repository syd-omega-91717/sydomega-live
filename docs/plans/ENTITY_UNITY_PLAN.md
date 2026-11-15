# One entity, not 241 services — measured audit and build order

Written 2026-11-15 from a read of the repo and headless renders. Nothing below is a claim about live data (live Supabase access was refused this session).
Not reviewed by Codex (usage limit).

## The principle (the owner's)
Every element of the platform is power and progress for the member, and the zodiac sign, element, god, house, hero, gate, medal and the rest are **one
entity**, not a service each. The test of that principle is mechanical: does each page read the member's position from one place, and does each facet
read its meaning from one place?

## What already exists (evidence)
- `omega-canon.json` `tracks[]` is already one record per sign with 14 fields: `sign, god, element, gate, token, agent, house, medal, trophy, certificate, grade, level, phase`.
- `omega-elements.json`: 9 elements (5 physical from the sign, 3 metaphysical assigned by class, 1 transcendent active at Stage 9), each with a `domain` sentence. All 12 signs resolve to an element and its sentence.
- `omega-canon.json` `lore_lattice.houses`: 12 houses with a `domain` and `desc`; all 12 resolve.
- `omega-stories.json`, the 12 gates (`authority.gates` / `gate_names`), `matrix_progress` per sign, and the mana model.

## Where the principle is broken (measured)
1. **Two 12-rung ladders with colliding names.** `authority.gate_names` = INITIATE, ACOLYTE, SCHOLAR, KEEPER, GUARDIAN, ARCHITECT, SOVEREIGN, VANGUARD, HERALD, ORACLE, PRIME, APEX
   (crossed by the member's recorded axes). `tiers[].name` = Initiate, Seeker, Adept, Warden, Vanguard, Architect, Sovereign, Luminary, Radiant, Unyielding, Transcendent, Ascendant
   (priced 9.17 to 917.17, each unlocks features). Four names appear in both at different rungs (Vanguard is gate 8 and tier 5; Architect 6/6; Sovereign 7/7; Initiate 1/1).
   A member can be "Vanguard" on one ladder and not the other. **This is the owner's decision** (merge, rename, or state plainly "earned standing" vs "held plan"); it also touches the dormant payment flag.
2. **`grade`, `level` and `phase` on a track are the same number** (`n`, 12 of 12 equal). They are one ordering written three times, not three ladders. The member's real position per sign is in `my_matrix()` (`a,b,c,node,pct,phase`) and the profile.
3. **Pages that describe a facet do not read the canon.** Sign-name occurrences per file (an upper bound on duplicated tables): `horoscope.html` 54, `character.html` 65, `pantheons.html` 12, `houses.html` 12. Of `levels`, `grades`, `phases`, `kings`, `city`, `pantheons`, `houses`, `horoscope`, `bloodline`, only `levels.html` mentions `OmegaCanon`. This is CLAUDE.md 8.1 class 8.
4. **Element to axis is only partly defined.** `omega-elements.json` says FIRE "Drives the Mastery axis" and WIND "carries knowledge"; the other elements name no axis. This **corrects the revision note in `CHARACTER_LAB_PLAN.md`**, which said no mapping exists. Completing it is a design decision, and there are 5 physical elements for 3 axes, so it is not a function.
5. **Heroes.** 12 numbered labors (`omega-hercules.js`), but nothing in the canon says which sign owns which labor. Equal numbers are not a mapping, so none is asserted.
6. The `PMI` score on the dashboard (logged in `GAP_ANALYSIS.md` section S).

## What this change ships
The character card gets a six-facet "entity" panel: Element, God, House, Gate, Agent, Honors. Each shows the canon's own words and links to the page that owns it
(`elements`, `pantheons`, `houses`, `evolution`, `agents`, `honors`). `OmegaCanon.houses` is now published. Verified: 12 of 12 signs give 6 rows;
link targets exist; no `innerHTML`; no horizontal overflow at 390px; 0 console errors. A global `a[href]` rule had turned the rows into one centred line, so the selector is `.occ .occ-f`, with a test.

## Proposed build order (none started)
1. Owner decides the two ladders (1 above). Nothing economic is built before that.
2. Route `pantheons`, `houses`, `horoscope`, `levels`, `grades`, `phases` through `OmegaCanon`, one page per PR with a before/after render, then add a gate that fails on a new hand-typed 12-sign table.
3. On each of those pages show "you are here" from `my_matrix()` and the profile, so the page is the member's position, not a catalogue.
4. Owner completes element to axis; then the element panel can say what the element does for the member's growth.
5. Owner states the sign to labor mapping (or says there is none); then heroes join the entity.

## Not claimed
No live data was read. The 3-D scene was tested only on a software renderer. The English-only facet text is not in the six i18n packs.
