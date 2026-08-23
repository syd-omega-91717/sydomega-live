---
name: interface-guidelines
description: Audit sydomega-live against the Web Interface Guidelines, using only the rules that apply to a no-build vanilla-HTML stack. Use when asked to review the UI, check accessibility, audit design/UX, or check the platform against best practices.
---

# INTERFACE GUIDELINES (adapted)

## What this is

The upstream source is `vercel-labs/web-interface-guidelines` (fetched by
`vercel-labs/agent-skills`' `web-design-guidelines` skill from
`https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md`).
It is a good list. It is also written for **React + Next.js + Tailwind**, and
this repo is ~250 hand-written HTML pages with no build step, no bundler and no
framework (root `CLAUDE.md` §1–2).

Installing it as-is would be wrong. This skill records which rules transfer,
which do not and why, and how to check the ones that do.

**Do not `npx skills add` the upstream pack into this repo.** Most of its
skills (`react-best-practices`, `composition-patterns`, `next-*`,
`react-view-transitions`, `react-native-skills`) assume a stack that does not
exist here, and CLAUDE.md §9 forbids introducing a build step or framework
migration without discussing it first.

## Running the audit

```
node .claude/skills/verify-in-browser/harness/scan.js guidelines
```

It reports per-issue page counts. Check it at **runtime**, never by grepping
source — see the traps below.

## Rules that DO apply here, and their status

| rule | status |
|---|---|
| `color-scheme: dark` on `:root` | **fixed** — was absent on all 173 pages; 312 native `<select>`s plus every scrollbar drew light chrome on a near-black page. Now in `bg.js`. |
| `touch-action: manipulation` on interactive elements | **fixed** in `bg.js` — removes the 300 ms double-tap-zoom delay. |
| Icon-only controls need an accessible name | **fixed** — 5 pages had bare `✕`/`◀`/`▸` buttons and empty toggles. |
| `<meta name="theme-color">` | already handled — `bg.js` injects it (172/173). |
| `:focus-visible` replacement for `outline:none` | already handled — a global rule in `omega-ui.js` covers 172/173. |
| Zoom must not be disabled | already clean — 0 pages set `user-scalable=no`. |
| `<img>` needs `alt` | already clean — 0 violations. |
| `prefers-reduced-motion` honoured | already the convention across `bg.js`, `emblem.js`, `omega-cinematic.js` and the dashboard galaxy. |
| Semantic `<button>` vs `<div onclick>` | partially — some `[onclick]` divs remain; not swept. |
| `transition: all` | **open, deliberately.** Only 2 literal instances existed (one fixed). The 173-page count comes from the `transition:.2s` shorthand, which implicitly sets `transition-property: all`. That idiom is pervasive here; rewriting it across ~250 pages risks silently killing transitions that currently work, for a performance/polish gain. Left as documented debt, not a bug. |

## Rules that do NOT apply, so nobody re-checks them

`focus-visible:ring-*`, `truncate`, `line-clamp-*`, `min-w-0` (Tailwind);
`htmlFor`, `spellCheck={false}`, `onPaste` + `preventDefault`,
`suppressHydrationWarning`, controlled/uncontrolled inputs, hydration safety
(React); `priority`, `<Link>`, nuqs, `next/image` (Next); virtualization
libraries (`virtua`). This platform has no JSX, no hydration and no lists over
50 items rendered client-side from a framework.

`Intl.DateTimeFormat` / `Intl.NumberFormat` are worth adopting but interact
with the existing `i18n.js` engine — treat as a feature decision, not a lint fix.

## Traps — all three cost a wrong conclusion here

**Grep the runtime, not the source.** A source grep said `<meta theme-color>`
was missing on 121 pages and that 131 bare `outline:none` had no replacement.
Both were wrong: `bg.js` injects the meta tag, and a global `:focus-visible`
rule covers the outlines. Rendering the pages showed 172/173 fine for both.

**"Short text" is not "no name".** The first version of the icon-only rule
flagged any control with fewer than 3 characters, which caught score buttons
labelled `1`–`10` — those announce as "1".."10" and are correctly named. The
rule now flags only genuinely nameless controls: empty text, or a label that
is pure symbol with no letter or digit (`✕`, `◀`).

**`offline.html` will always fail this audit, correctly.** It deliberately
loads no `bg.js` so that it still works with no network, so it gets no
`color-scheme` and no injected `theme-color`. Do not "fix" it.
