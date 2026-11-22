### The Supabase connector was authorized for a paused non-canonical project, not production (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Symptom.** Every `mcp__Supabase__*` call (`list_migrations`, `get_advisors`) returned `MCP error -32600: You do not have permission to perform this action`. This was reported all session as "the connector refused", and the owner replied that the connector was connected.

**Cause (measured).** The connector was connected, but to a different organisation. `list_projects` returned one project, `nvgedlxlkdzvcelimbvq`, named "ydqhzvvoyufiiqvzcjns / sydomega", `status: INACTIVE`, in organisation `vercel_icfg_YB1nMDG3mKWzLVkLbu7fRxzy` ("syd-omega-91717's projects", a Vercel-integration org). `CLAUDE.md` and every call used `ydqhzvvoyufiiqvzcjns`, the canonical production project (178 references in the shipped client; `supabase/config.toml project_id`; `config/supabase-migration-provenance.json` states `nvgedlxlkdzvcelimbvq` "is not the canonical active target"). The visible project's *name* contains the canonical ref, which is easy to mistake for it.

**Not done, on purpose.** No `restore_project`, no `apply_migration`, no SQL on `nvgedlxlkdzvcelimbvq`: it is not production, it is paused, and acting on it would prove nothing while costing money. Nothing was inferred about production from it. The production API host (`ydqhzvvoyufiiqvzcjns.supabase.co`) is unreachable from the agent container (HTTP 000 through the proxy), so an anonymous read-only probe was not possible either; making it reachable would need an environment-network change and would only give anonymous access.

**Fix (repo side).** `CLAUDE.md` §8.2 no longer says the connector simply "works"; it says to run `list_projects` first and what to do when the canonical ref is missing (re-authorize, restart the session, never touch `nvge…`). Kept inside the 16,000-token budget (15,996). `GAP_ANALYSIS.md` records the open item and the owner step.

**Owner step (cannot be done from the agent).** Re-authorize the Supabase connector at claude.ai/customize/connectors for the account/org that owns `ydqhzvvoyufiiqvzcjns`, then start a new session: connectors are read at session start. After that: apply `docs/proposed-migrations/20261122140000_close_exam_results_member_write.sql`, check `certificates` / `sovereign_points_ledger`, and read `tokens_enabled`, `kyc_intake_enabled` and the advisors live.
