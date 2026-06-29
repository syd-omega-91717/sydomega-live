// ============================================================================
// FILE: /backend/src/kernel/infrastructure/outbox-message.ts
// NEW FILE
// ============================================================================

export interface OutboxMessage {

    id: string;

    eventType: string;

    aggregateId: string;

    payload: string;

    occurredAt: Date;

}
