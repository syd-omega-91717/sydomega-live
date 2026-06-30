// ============================================================================
// FILE: /backend/src/modules/identity/presentation/routes/session-stream.routes.ts
// NEW FILE
// ============================================================================

GET     /identity/sessions/live

GET     /identity/sessions/{id}

DELETE  /identity/sessions/{id}

DELETE  /identity/sessions

GET     /identity/sessions/events

WS      /ws/identity/sessions
