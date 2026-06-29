// ============================================================================
// FILE: /backend/src/platform/events/domain-event.interface.ts
// NEW FILE
// ============================================================================

export interface DomainEvent {

    readonly id: string;

    readonly name: string;

    readonly aggregateId: string;

    readonly occurredAt: Date;

    readonly payload: unknown;

}
