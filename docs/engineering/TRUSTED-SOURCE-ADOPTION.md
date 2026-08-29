# SYD OMEGA 91717 — Trusted Source Adoption

## Purpose

Use established public engineering resources as design inputs without copying entire frameworks into the platform or creating unnecessary dependencies.

## Adopted patterns

### Anthropic Agent Skills
Use the open Agent Skills format for portable, progressive-disclosure skills: each skill has `SKILL.md` metadata and may include scripts, references and assets. The project uses this pattern under `skills/`. Source: https://github.com/anthropics/skills and the Agent Skills specification.

### OpenAI Agents SDK
Use the concepts of agents, tools, handoffs, guardrails, sessions, tracing and human-in-the-loop as reference patterns for the SYD OMEGA agent layer. Do not introduce the SDK merely for terminology; integrate only where it solves a concrete orchestration requirement.

### Google ADK
Use graph-based workflow concepts, structured delegation, evaluation and human-in-the-loop patterns as reference material for deterministic agent workflows. Keep provider integration behind the platform AI gateway.

### DeepSeek Harness
Use the plugin-composability model as an architectural reference for optional skills, tools, sessions, storage and agent runtime components. Treat the project as developer-preview material and do not make production availability depend on it.

### OpenAI Cookbook / Gemini Cookbook
Use official cookbooks for API integration patterns, structured outputs, retrieval, multimodal workflows and evaluation examples. Pin production dependencies and validate every integration against the provider's current official documentation.

### Cursor Plugins
Use the plugin manifest and modular skill organization as interoperability inspiration for developer tooling. Keep SYD OMEGA's canonical skill contract provider-neutral.

## Adoption rule

A public repository is an input, not an authority. Before production adoption, each dependency or pattern must pass:

1. license compatibility review;
2. maintenance/activity review;
3. security and supply-chain review;
4. API stability review;
5. isolation from provider lock-in;
6. project-specific tests;
7. rollback planning.

## Canonical architecture

All providers terminate behind the SYD OMEGA capability and AI gateways. Provider-specific APIs must not become the application's public contract.

## Current source references

- Anthropic Agent Skills: https://github.com/anthropics/skills
- Agent Skills specification: https://github.com/agentskills/agentskills
- OpenAI Agents SDK: https://github.com/openai/openai-agents-python
- OpenAI Cookbook: https://github.com/openai/openai-cookbook
- Google ADK: https://github.com/google/adk-python
- Gemini Cookbook: https://github.com/google-gemini/cookbook
- DeepSeek Harness: https://github.com/deepseek-ai/deepseek-harness
- Cursor Plugins: https://github.com/cursor/plugins

These references are intentionally kept as source links rather than vendored code so the platform remains maintainable and license boundaries remain clear.
