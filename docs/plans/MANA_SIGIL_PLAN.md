# Mana, sigil and the character: one inner-power model (corrected)

Status: **PROPOSAL, display-only, no schema.** Written 2026-11-15. Not reviewed by a lawyer or an adversarial reviewer (Codex usage limit).

> **Supersedes the mana parts of `docs/plans/MANA_WARDROBE_ECONOMY_PLAN.md` (PR #1296).** That plan treated mana as a spendable currency
> (MANA ledger currency, Stripe packs). The owner meant the opposite: **mana is the user's inner power, gained by using the platform, with a
> sigil and related things.** The repo says the same: `config/omega-relearn-sigil-mana.json` defines mana as "a non-financial, transparent
> capacity abstraction ... **neverMeans money**". Everything about a MANA currency in that plan is withdrawn. Its legal findings and
> `CHAIN_ANCHOR_PLAN.md` stand.

## 1. Goal

A member's character has an **inner power** that grows as they really use the platform and fades when they do not, shown through their
**sigil**, tied to their sign. Nothing is bought, nothing is invented, nothing grants authority.

## 2. What exists

| Piece | Where | What it does today |
|---|---|---|
| Mana definition | `config/omega-relearn-sigil-mana.json` (`state: DESIGN_PROPOSAL`) | 5 components FOCUS / LEARNING / CREATIVE / COLLABORATION / EXECUTION; rules: show sources, show freshness, never fabricate, never grant authority |
| Mana calculation | `omega-relearn-sigil-mana.js` `calculateMana` | Pure function, 0-100 per component, truth label `CALCULATED`. Nothing is stored; `spendMana` only returns an object |
| Mana display | `omega-life.js` -> `life.html` (`mana-total /100`, sources line) | Calculated in the browser on each load |
| Sigil drawing | `omega-sigil-gen.js` `OmegaSigil` | Deterministic SVG from authority, element, axes A/B/C, gate; `sigil.html` |
| Sigil record | `omega-relearn-sigil-mana.js` `createSigil` / `evolveSigil` | Seed number from traits and verified milestones; versions on `SIGIL_EVOLVED`; "not an authentication credential" |
| Realm launcher | `omega-sigil-system.js` | The sigil as entry to CORE, CONSULTANCY, GAMING, BLOCKCHAIN, COMMUNICATION, PASSPORT, LEGAL pages |
| Member activity | `task_completions`, `evolution_events`, `omega_member_mission_state`, `omega_platform_events`, `sovereign_points_ledger` | Real, per-member, RLS-scoped |

## 3. Findings (from source; live database not checked, access refused)

1. **Two of mana's five components do not measure the member.** `omega-life.js` feeds `verifiedCapabilities` from `capability_registry`, a
   platform-wide registry (columns `domain`, `owner_agent`, `slo_*`; policy "authenticated reads"; no `user_id`). FOCUS (`caps*8`) and
   EXECUTION (`caps*6`) are built from it. Mana "gained by using the platform" is not what that measures.
2. **That filter can never match.** It keeps `lifecycle_status==='ACTIVE' || health_status==='HEALTHY'`, but `0061_omega_capability_registry.sql:30-31`
   allows only lowercase values (`'proposal','design','beta','live','deprecated','archived'` and `'healthy','degraded','down','unknown'`), no later migration changes the constraints, and nothing writes uppercase. So today the list is
   empty and FOCUS/EXECUTION come only from sign/element/agent being set and from missions. Fixing the case alone would make it worse
   (every member gets the same platform-wide value), so the right fix is to **remove the capability source from mana**, not to repair its case.
   (Class 2/9 of CLAUDE.md §8.1: a value that does not exist; a number not about the member.)
3. **CREATIVE is partly free.** `explicit*4` counts whether the member filled in sign, element and agent, which is profile completeness, not use.
4. **Nothing persists; "spent" and "recovered" do not exist.** Events are defined in the contract; no code stores or enforces them.
5. **Two sigil engines, two seeds.** `OmegaSigil.generate` seeds from name+element+authority; `createSigil` seeds from user id+traits+milestones.
   Same member, two different identities (class 8, duplicated source). One must draw; the other must only record versions.
6. **Four "power" numbers, no stated purposes:** authority (axes A/B/C), sovereign points (ledger), mana (capacity), sigil (picture). Members
   will not tell them apart unless each has one sentence.

## 4. The model (every number from the member's own recorded activity)

| Concept | One-sentence purpose | Source | Moves |
|---|---|---|---|
| **Authority** | Long-term rank | axes A/B/C (existing formula) | up only |
| **Sovereign points** | Record of what you did | `sovereign_points_ledger` | up only |
| **Mana** | **Current inner power: how much you have really used the platform lately** | the member's own rows in the last 30 days | up with use, **fades without it** |
| **Sigil** | The picture of all of the above, for your sign | drawn from sign, element, authority gate, mana | changes when a verified milestone lands |

**Mana components, member-only sources** (a component with no real source shows a dash and says so; it is never filled in):
- **FOCUS**: distinct active days in the last 30 (from `task_completions` / `evolution_events` / platform events).
- **LEARNING**: `task_completions` with points in the window.
- **COLLABORATION**: missions in progress/completed (`omega_member_mission_state`); later, links between members once that exists.
- **EXECUTION**: missions completed in the window.
- **CREATIVE**: **no recorded source exists yet** (ideas, notes). Shows "no source yet" until the owner decides what counts. Not derived from profile fields.

Windowed means no storage and no decay job: mana is recomputed from the trailing window, so it rises and falls on its own. Truth label stays
`CALCULATED`, the sources and freshness stay visible, and the hard rule stays: **mana never grants authority, never gates a purchase, never converts to anything.**

## 5. How it connects to the rest

- **Character card (merged):** add a Mana line and the member's sigil, read-only, from the same module.
- **One sigil engine:** `OmegaSigil` draws everything, including the 12 characters' own sigils (canon sign and element); `createSigil` keeps only
  versions and events. Mana adds visible rings or glow on the picture; authority gate keeps stroke weight.
- **Realm launcher:** the sigil already opens CONSULTANCY, LEGAL, BLOCKCHAIN pages: that is the "one project, no outside foundation" idea in the
  platform's own navigation. These pages must say what they are: information and services, not professional advice (see `docs/legal/`).
- **Chain anchor:** `SIGIL_EVOLVED` milestones can be leaves (verified, permanent facts). **Mana is never anchored**: it is derived and fades, so
  stamping it as permanent would be false. Stated in `CHAIN_ANCHOR_PLAN.md` scope when merged.
- **Visibility:** private by default; the config already names PRIVATE / SHARED / CIVILIZATION_AGGREGATE / PUBLIC. Others never see an
  individual's mana without the member's explicit choice.

## 6. Payments, corrected

No virtual currency of any kind. If the owner wants paid cosmetics (clothes, weapon *skins*, aura), they are sold **directly for real money**
through the existing Stripe -> ledger -> `omega_entitlements` / `user_assets` path, **price shown in real currency** (this alone removes most
of the in-game-currency consumer-law concerns found in research: no layered currencies, no pressure to buy bundles). A character is never sold
(main character = sign; extra characters follow progress). Mana, authority, points and progress are never sold. This stays a separate HIGH-RISK plan
and needs counsel first (withdrawal right for digital content, VAT, jurisdiction unrecorded).

## 7. Build order (each its own PR)

1. **Fix the mana sources** in `omega-relearn-sigil-mana.js` / `omega-life.js`: drop capability_registry, use the member's windowed activity,
   CREATIVE as "no source yet". Tests pin: no `capability_registry` in the mana inputs, no profile-completeness credit, a new member shows ~0,
   output differs between two members with different activity. LOW risk, no schema.
2. Mana + sigil on the character card.
3. One sigil engine; 12 character sigils.
4. Wardrobe (HIGH-RISK plan) after counsel and `advance_matrix`.
5. Chain anchor per its plan.

## 8. Decisions needed

1. What counts toward **CREATIVE** (ideas the member writes? which table?). Until then it stays "no source yet".
2. Window length: recommended 30 days.
3. Visibility: recommended private.
4. Paid cosmetics: direct real-money pricing (recommended) or none for now?

## 9. Success criteria

1. Two stub members with different recorded activity get different mana; a member with none gets 0 (not 12-40 free points).
2. Mana inputs contain no platform-wide table and no profile-completeness field (a test greps the source).
3. Every component shows its source and window; a component with no source shows a dash.
4. Mana never appears in any permission, price or ranking path.
5. `./scripts/ci-local.sh` all blocking checks pass; render checked on `life.html` and `character.html`.

## 10. Out of scope

A mana currency, purchases of mana, mana transfer, spending mana (until a governed action exists, and then server-side with an authorization id),
sign tokens, NFTs, civilization aggregation views, the wardrobe schema, the chain anchor itself.
