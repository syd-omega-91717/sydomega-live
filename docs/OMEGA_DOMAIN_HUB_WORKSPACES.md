# Ω SYD OMEGA 91717 — Domain Hub Workspaces

## Canonical workspace model

The current 241-page contract registry maps the platform into 14 persistent domain workspaces:

| Workspace | Canonical route |
|---|---|
| Command | `dashboard.html` |
| Identity | `profile.html` |
| Ascend | `ascend.html` |
| Cosmos | `cosmos.html` |
| Vault | `vault.html` |
| Order | `order.html` |
| Life | `life.html` |
| Services | `services.html` |
| Intelligence | `intel.html` |
| Sovereign AI | `sovereign-ai.html` |
| Governance | `govern.html` |
| Invest | `invest.html` |
| Achieve | `achieve.html` |
| Media | `media.html` |

The ownership matrix identifies 199 candidate hub routes. Fourteen are the hub routes themselves; the remaining **184 specialist routes** are exposed inside their owning workspace.

## Route treatment

- **197 specialist routes:** opened inside the owning hub through a same-origin embedded view. The user remains in the domain workspace while the original page supplies its existing UI and functionality.
- **14 hub routes:** remain the canonical workspace entry points.
- **18 KEEP_SEPARATE routes:** system, authentication, identity, legal, financial and owner-control lifecycles remain independent.
- **10 AMBIGUOUS routes:** remain independent until identity, ownership and access contracts are reviewed.
- **14 UNMAPPED routes:** remain independent until a valid domain owner is evidenced.

This produces 14 consolidated workspaces with 43 routes intentionally left outside the current consolidation scope. The original 241 HTML routes are retained for bookmarks, deep links, integrations and rollback; this phase reduces the user-facing workspace count, not the physical file count.

## Runtime behavior

- `omega-domain-hubs.js` reads `config/omega-page-hub-ownership.json` only on the 14 canonical hub routes.
- Specialist content loads only after an explicit user action; the iframe is lazy and same-origin.
- Embedded navigation preserves `omega_embed=1` for same-origin module links and form destinations.
- The embedded view hides duplicate global navigation and floating chrome, but does not override the original page's authentication visibility gates.
- The parent accepts frame-height messages only from its own origin and the active iframe window.
- Module labels are rendered with `textContent`; untrusted content is not injected as HTML.
- Each original page continues to own its own data requests, role checks, RLS boundaries, Edge Function calls and failure states. The hub shell grants no new authority.

## Completion boundary

This is a user-facing consolidation layer, not permission to delete or merge source pages. Physical page retirement requires a separate per-module migration proving task, script, data-source, authorization, event, failure, accessibility, responsive and production parity. Unknown routes remain separate rather than being guessed into a hub.
