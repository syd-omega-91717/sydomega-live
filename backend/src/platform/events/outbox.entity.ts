// ============================================================================
// FILE: /backend/src/platform/events/outbox.entity.ts
// NEW FILE
// ============================================================================

export interface OutboxEvent {

    id: string;

    eventName: string;

    aggregateId: string;

    payload: unknown;

    createdAt: Date;

    publishedAt?: Date;

    retryCount: number;

    status:

        | "pending"

        | "published"

        | "failed";

}
