// ============================================================================
// FILE: /backend/src/kernel/domain/domain-event.ts
// NEW FILE
// ============================================================================

export abstract class DomainEvent{

    readonly occurredAt=new Date();

    abstract readonly eventName:string;

    abstract readonly aggregateId:string;

}
