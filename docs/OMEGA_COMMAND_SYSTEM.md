# Ω Command System

The platform command layer exposes the 99 production-safe slash commands grouped into Email, Writing, Thinking, Learning, Planning, Brainstorming, Meetings, Career and Content.

## Interaction

- `Cmd/Ctrl + K` opens the global command palette when the palette runtime is loaded.
- Search accepts command names, descriptions and groups.
- Selecting a command emits `omega:command` with the command identifier.
- The catalog is intent metadata; privileged actions must be implemented behind authenticated, authorized handlers.

## Safety

Commands must not directly execute privileged operations from the UI. Server-side authorization, input validation, audit logging and rate limiting remain mandatory.

## Integration contract

- Catalog: `omega-command-catalog.js`
- Palette: `omega-command-palette.js`
- Styles: `omega-command-palette.css`
- Event: `omega:command`
