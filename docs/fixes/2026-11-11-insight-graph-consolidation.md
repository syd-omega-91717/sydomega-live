# Insight graph consolidation — 2026-11-11

## Canonical destination

The single member-facing knowledge graph is insight.html. It owns five lenses: GRAPH, TIMELINE, CENTRALITY, ANOMALIES, and EVIDENCE. The Cosmos graph.html constellation remains a separate symbolic experience. graph-admin.html remains a separate owner-only curation surface.

## Routes preserved

| Legacy route | Canonical lens |
|---|---|
| graph-anomalies.html | ?lens=anomaly |
| graph-centrality.html | ?lens=central |
| graph-evidence.html | ?lens=evidence |
| graph-explorer.html | ?lens=graph |
| graph-timeline.html | ?lens=time |
| graphify.html | ?lens=graph&tools=1 |

The old URLs are compatibility redirects. They preserve the existing route so saved bookmarks and external links continue to work. The navigation map and Intel workspace now expose the canonical Insight route rather than six duplicate destinations.

## Capabilities preserved or consolidated

- Graph entity/relationship overview and node selection.
- Relationship neighborhood exploration with a bounded depth of 1–5. The old Graph Explorer's path traversal was also corrected: entity IDs are UUIDs and must be resolved against id, not canonical_name.
- Event-level timeline, sourced from graph_events.
- Evidence register and per-entity evidence details, sourced from graph_evidence.
- Centrality and local anomaly lenses.
- JSON graph export and readable evidence export.
- Owner curation remains in Graph Admin, not in the member-facing graph.

## Deliberately held capabilities

Graphify AI query and ingestion are not deployed and are not presented as working features. The provider inventory recorded 22 active functions on 2026-11-10; these two functions are held because they transmit member content to Anthropic without the required privacy processor disclosure/transfer basis and enforced per-member daily cost limit. The Insight workspace exposes the held state and unlock conditions. Do not add the functions to supabase/config.toml or deploy them until the gates in docs/legal/FUNCTION_GO_LIVE.md are satisfied and verified.

## Safety and verification

- No graph rows, RLS policies, migrations, or provider settings were changed.
- Legacy routes redirect; they do not delete the original URLs.
- The page contract registry records the redirects and removes their false claim of direct table reads.
- Regression tests cover route-to-lens mapping, navigation/workspace consolidation, source-evidence contracts, and the separation of Cosmos graph and owner Graph Admin.
