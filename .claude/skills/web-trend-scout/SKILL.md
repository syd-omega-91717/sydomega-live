---
name: web-trend-scout
description: Researches external platforms, APIs, and open-source trends via real web search, then writes a proposal-only feature idea grounded in this repo's actual code. Use when asked to find/propose new feature ideas for SYD OMEGA 91717 ("scout the web for new features", "what should we build next").
---

# WEB TREND SCOUT

## What this is

A research skill, not a code-writing one. It turns external inspiration into
a proposal entry that follows the exact convention already established in
this repo by `FEATURE_IDEAS.md`: **status: proposal only**, every claim
grounded in something verified in *this* codebase, nothing implemented.
Read `FEATURE_IDEAS.md` first (repo root) before writing anything — match
its tone and header format exactly rather than inventing a new one.

This repo is a static HTML + vanilla JS + Supabase site with **no build
step** (see root `CLAUDE.md` §1–2). Do not propose anything that assumes a
framework, bundler, or package manager this repo doesn't have.

## Steps

1. **Research.** Use WebSearch/WebFetch to look at what's actually shipping
   right now in adjacent spaces relevant to this platform's real feature
   set (habits/learning tracking, personal finance, media library,
   community/social features, AI-assistant UX, glassmorphism/dark-UI
   design patterns). Anchor searches in the platform's real domains — see
   `nav.js`'s `SECTIONS` array and `omega-agents.json` for what "domains"
   actually exist here — not in generic Web3/crypto hype. This platform's
   own token economy (`platform_settings.tokens_enabled`) is explicitly
   dormant pending legal review (`CLAUDE.md` §8); do not propose new
   monetary/token features unless the user explicitly asks for one, and if
   asked, flag it exactly as "Explicitly not proposed here" in
   `FEATURE_IDEAS.md` already does for this category.

2. **Ground it in this repo before writing anything down.** For every idea,
   grep/read the actual files it would touch or extend. An idea only
   qualifies for a proposal if you can write a real "Grounded in:" line
   citing a `file:line`, an existing table/RPC name, or a specific gap
   already documented in `GAP_ANALYSIS.md`/`REPOSITORY_AUDIT.md` — copy
   this discipline from `FEATURE_IDEAS.md`'s existing entries, don't just
   summarize the web result.

3. **Write the proposal.** Append a new numbered section to
   `FEATURE_IDEAS.md` (create it at the repo root, using the same header
   block V18's copy already has, if this repo doesn't have one yet — check
   first). Each entry needs:
   - **Feature name & concept** — one paragraph.
   - **Grounded in** — the file/table/RPC citation from step 2.
   - **User benefit** — free/approved member vs. a specific `membership_tier`
     (this platform's real tier field is `profiles.membership_tier`, an
     integer 1–9 gated through `OmegaCanon.tierUnlocks()` in
     `omega-canon.js` — reference that, don't invent a different tier
     system).
   - **Nav placement** — which `nav.js` `SECTIONS` key (`command`,
     `ascend`, `vault`, `intel`, etc.) it belongs under, per `CLAUDE.md`
     §6's rule that "which agent/domain" is an information-architecture
     call.
   - **Data needs** — new Supabase table(s)/RPC(s) needed, or "none, reads
     existing `<table>`". If it touches money, tokens, or new personal-data
     collection, say so explicitly and flag it needs a `platform_settings`
     gate + explicit sign-off before any code, per `CLAUDE.md` §9.
   - **Source inspiration** — the actual URLs/products researched.

4. **Stop there.** Do not create HTML pages, JS modules, or SQL files —
   that's `feature-architect`'s and `autonomous-coder`'s job, and only
   after a human picks one of these proposals to build.

## Guardrails

- Never mark an idea as decided, approved, or scheduled — that's the
  owner's call, matching `FEATURE_IDEAS.md`'s own explicit framing.
- Never propose anything requiring the deploy model to change (no
  "add a Next.js API route", no "add a build step") — this is Vercel
  static hosting with Supabase as the only backend (`CLAUDE.md` §1).
- If you can't find a real grounding citation for an idea, don't include
  it — a plausible-sounding but ungrounded idea is worse than no idea,
  since it invites building on a false premise later.
