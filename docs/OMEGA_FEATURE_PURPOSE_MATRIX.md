# Ω SYD OMEGA 91717 — Feature Purpose & Role Matrix

This matrix is the canonical experience contract for the 18-module model.

| Module | Product purpose | Gameful role | Primary live state | Simulation opportunity |
|---|---|---|---|---|
| Core | identity, navigation, platform control | Home world / HUD | session, approvals, platform status | onboarding scenarios |
| Consultancy | professional advisory work | Missions / contracts | requests, deliverables, statuses | what-if advisory models |
| Gaming | games and competitions | Arena | scores, sessions, rankings | deterministic games |
| Achievements | verified progress | Achievement tree | task completions, awards | training badges |
| Family | heritage and lineage | Dynasty map | family/heritage records | historical reconstruction |
| Media | publish/discover content | Broadcast network | publications, media assets | story/cinematic simulations |
| Blockchain/NFT | digital ownership concepts | Asset vault | owned assets when actually implemented | asset/economy sandbox |
| Communication | member communication | Comms channel | messages, broadcasts, connections | conversation simulations |
| Horoscope | entertainment/personal reflection | Cosmic map | profile preferences/content | clearly labeled generated readings |
| News | current information discovery | Intelligence feed | source articles/feed state | scenario timelines |
| Heritage | preserve history/evidence | Archive | heritage records/artifacts | reconstruction/visualization |
| Progress | measurable development | Progression system | tasks, milestones, completion events | skill-tree simulations |
| Credentials | proof of achievement/identity | Inventory / loadout | credential records | credential preview |
| Legal | terms, consent, governance | Rules / safe zone | consent, policies, audit state | compliance training |
| Elemental | thematic identity/visual system | Avatar affinity | profile element/preferences | visual affinity simulation |
| Investment | financial intelligence | Strategy arena | market/provider data when enabled | paper-trading/what-if only |
| Intelligence | search, analytics, AI | Command center | sources, graph, analytics, agent state | forecasts and scenario models |
| Hierarchy | permissions and governance | Faction/authority map | roles, owners, approvals | governance simulations |

## Universal feature contract

Every feature must answer:

1. **Why does it exist?**
2. **Who uses it?**
3. **What action does it enable?**
4. **What data does it consume?**
5. **What data does it create/change?**
6. **Who is authorized?**
7. **What is the failure state?**
8. **What makes it live?**
9. **What makes it gameful?**
10. **What is simulated versus real?**
11. **What evidence proves completion?**
12. **What happens when animation/3D is disabled?**

## Visual grammar

- **World:** navigation context.
- **Node:** capability.
- **Quest:** multi-step workflow.
- **Mission:** single actionable objective.
- **Badge:** verified achievement.
- **Gauge:** measurable live state.
- **Timeline:** history/provenance.
- **Graph:** relationships.
- **Radar:** multidimensional state.
- **Inventory:** owned/earned assets.
- **Arena:** simulation/game/competition.
- **Beacon:** alert/action requiring attention.
- **Portal:** route transition.

## Data-to-visual rule

A visual component must identify its backing state in code or its capability contract.

Example:

`member approval → live profile/access state → approval node → owner action → audit event → achievement`

Not:

`member approval → glowing animation`

## First implementation wave

P0:
- universal live-state badge
- mission/quest contract
- event-backed achievements
- live activity feed
- command HUD
- simulation labeling
- capability provenance panel

P1:
- interactive world map
- module graph
- progression/skill tree
- inventory/credential loadout
- scenario arena
- realtime presence

P2:
- selective 3D realms
- collaborative simulations
- advanced AI agents
- multiplayer competitions
- creator/editor mode
