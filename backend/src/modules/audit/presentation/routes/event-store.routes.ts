// ============================================================================
// FILE: /backend/src/modules/audit/presentation/routes/event-store.routes.ts
// NEW FILE
// ============================================================================

POST    /audit/events

GET     /audit/events/{aggregateId}

POST    /audit/events/{aggregateId}/replay
