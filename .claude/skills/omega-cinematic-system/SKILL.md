---
name: omega-cinematic-system
description: Production visual design and motion system for Ω SYD OMEGA 91717. Use when improving the site's cinematic, emblematic, rotative, futuristic, gaming, robotics, space, or deep-tech visual experience.
---

# Ω CINEMATIC SYSTEM

## Objective

Raise visual quality without destroying the existing information architecture, shared design ownership, performance, accessibility, or member gating.

The target is not decoration. Every motion, glow, orbit, emblem, transition, and visual layer must communicate hierarchy, state, navigation, depth, or interaction.

## Visual language

- Dark-only experience; never introduce light mode.
- Ω is the sole primary emblem/iconographic identity.
- Preserve the established near-black, gold, cyan, green, red, and muted-text vocabulary.
- Prefer glass/vector surfaces, restrained bloom, depth fields, orbital geometry, telemetry lines, waveform motifs, and dimensional panels.
- Typography must become easier to read, not smaller. Body copy and controls must remain legible on mobile.
- Visual hierarchy: identity → state → primary action → supporting information → metadata.

## Motion rules

- Motion is purposeful and state-driven.
- Prefer transform/opacity/filter changes that remain compositor-friendly.
- Use the existing motion owners before adding new animation engines.
- Respect `prefers-reduced-motion` and provide an equivalent static state.
- Avoid perpetual high-frequency animation on large DOM sets.
- Avoid layout-triggering animation (`top`, `left`, `width`, `height`) when transform can express the same result.
- Avoid adding `will-change` broadly.
- Avoid stacking multiple reveal systems on the same element.
- Never introduce a persistent hidden state that can strand content at opacity 0.

## Cinematic interaction patterns

Use selectively:

1. **Omega Orb** — slow radial/emblem field for hero identity.
2. **Orbital ring** — depth/navigation cue, not decoration behind text.
3. **Telemetry sweep** — short state transition when loading or activating a system.
4. **Glass shimmer** — hover/focus feedback only.
5. **Depth tilt** — pointer-driven micro-parallax on cards where it improves affordance.
6. **Signal pulse** — status indicator tied to actual system state.
7. **Ascension progress** — progress visualization tied to real data, never invented numbers.
8. **World transition** — page/section transition that maintains spatial continuity.

## Responsive behavior

Design the same system across desktop, tablet, and mobile. Do not merely shrink desktop UI. Collapse navigation, reduce decorative layers, preserve primary actions, and increase text clarity on narrow screens.

## Performance budget

Before adding a visual effect, ask:
- How many DOM nodes receive it?
- Does it trigger layout or paint continuously?
- Does it run while the page is idle?
- Does it duplicate an existing effect?
- Can it be scoped to visible/hovered/active elements?

Prefer one shared mechanism over dozens of page-local scripts.

## Accessibility

- Focus-visible states must remain obvious.
- Never communicate state only through color or animation.
- Preserve semantic headings, links, buttons, labels, and landmarks.
- Keep contrast readable against glass backgrounds.
- Reduced-motion mode must remain fully usable.

## Existing-repo constraints

- Read `AGENTS.md` first.
- Do not edit `bg.js`, `nav.js`, or other Claude-owned platform modules from this skill. If a shared-system change is required, produce a precise handoff.
- Do not add page-local canonical token definitions.
- Do not use `!important` to defeat the existing cascade.
- Verify actual stylesheet ownership before changing shared classes.
- Preserve all existing links and routes unless a redirect is explicitly required.

## Visual acceptance test

A visual upgrade is accepted only if:
- the page is more legible;
- the primary action is easier to find;
- the Ω identity is stronger;
- motion has a clear purpose;
- mobile remains usable;
- reduced-motion remains usable;
- no existing data or navigation disappears;
- browser verification shows no blank page or console/runtime error.
