# Ω SYD OMEGA 91717 — Agent Skill Stack

## Purpose

This document records which external agent ecosystems are useful to the project, what we adopt conceptually, and what we deliberately do not install blindly.

## Adopted now

| Source | Useful capability | Ω treatment |
|---|---|---|
| Vercel `agent-skills` | UI review, browser automation, React performance, deployment, AI SDK, workflows, motion | Use selectively through skills; do not migrate the static site to React merely to consume React skills |
| Vercel `web-interface-guidelines` | Accessibility, focus, forms, typography, animation, image/performance review | Treat as a continuous UI review baseline |
| Vercel `agent-browser` | Real browser automation and trust-boundary-aware verification | Use for runtime evidence, not source-only claims |
| DeepSeek Harness | Plugin-oriented agent architecture, explicit subsystems, sessions and tool boundaries | Architecture inspiration for future Ω Intelligence Fabric adapters; not a dependency |
| Everything Claude Code | Agents, skills, hooks, commands, memory/token optimization | Adopt the pattern, not the entire repository wholesale |

## Deliberately not imported blindly

- Large framework migrations (Next.js/React) because the current production surface is intentionally framework-free.
- Random MCP servers or connector packages without a clear role, license, maintenance signal, and security review.
- AI model/provider dependencies that would hard-code a single vendor into the core platform.
- UI libraries that duplicate the existing Omega design system.
- Autonomous deployment tools that bypass the repository's branch/PR and production-evidence rules.

## Agent architecture for Ω

The project should evolve around these roles:

1. **Omega Architect** — system design and conflict avoidance.
2. **Omega Builder** — implementation within an assigned lane.
3. **Omega Visual Director** — cinematic/emblematic UI and motion quality.
4. **Omega Security Sentinel** — secrets, auth, RLS, CSP, dependency and runtime risk.
5. **Omega QA Pilot** — browser journeys, regression and accessibility checks.
6. **Omega Data Guardian** — schema, RLS and persistence evidence.
7. **Omega Release Engineer** — GitHub/Vercel release evidence and rollback readiness.
8. **Omega Research Scout** — discovers external skills/repos and produces an evidence-backed adoption proposal.

Each role must operate through the same evidence states: IMPLEMENTED, RUNTIME VERIFIED, PRODUCTION VERIFIED, or UNVERIFIED.

## Token-efficiency rules

- Use one orchestrator to route work instead of repeating the full project context in every sub-agent.
- Store only compact state: objective, branch, changed files, checks, blockers, next action.
- Delegate narrow tasks to specialized agents.
- Do not load large external repositories when a focused skill file is sufficient.
- Reuse verification artifacts and test results instead of rerunning unchanged checks.
- Prefer repository search and targeted file reads over full-tree dumps.

## Visual quality gate

Every meaningful UI change should be judged on:

**identity + hierarchy + readability + motion purpose + responsiveness + accessibility + performance + regression safety.**

The target is cinematic and futuristic, but never at the cost of navigation, data visibility, or functional reliability.

## Research gate

Before adopting an external repository/skill:

1. verify the canonical upstream repository;
2. inspect license;
3. inspect maintenance/activity;
4. identify exact capability used;
5. inspect security/trust boundaries;
6. determine whether it is a runtime dependency, developer skill, or reference only;
7. integrate the smallest useful piece;
8. verify locally before production use.
