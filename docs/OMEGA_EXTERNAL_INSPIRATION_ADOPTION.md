# Ω SYD OMEGA 91717 — External Inspiration Adoption

The following repositories are reference architectures, not automatic dependencies.

| Source | Useful pattern adopted | Deliberately not adopted |
|---|---|---|
| LangChain | explicit core/integration boundaries, tool contracts, threat models, deterministic tests | full framework dependency |
| PRAW | authenticated Reddit API access, explicit rate/error handling, source attribution | uncontrolled scraping |
| Newman / Postman | executable API collections and environment-separated contract tests | requiring Postman as a runtime dependency |
| Next.js | metadata/SEO discipline, agent-readable project instructions, runtime-driven verification | replacing the current static runtime |
| Open Interpreter | explicit tool permissions, execution sandbox, resource/time limits, approval boundaries | unrestricted local code execution |

## OMEGA rule

External projects can improve implementation patterns, but they never override:
- live production evidence;
- Supabase authorization/RLS;
- existing repository architecture;
- source canon;
- security and legal controls.

## Adoption roadmap

1. API contract collection — repository-level, runnable with Newman when available.
2. SEO metadata contract — deterministic static audit.
3. Agent tool registry — capability, permission, risk and audit metadata.
4. Tool execution policy — no arbitrary shell/network/filesystem access by default.
5. Reddit intelligence connector — only through approved API credentials, attribution, rate limits and retention controls.
6. AI orchestration — provider-neutral adapters around existing agents, not a second agent database.
